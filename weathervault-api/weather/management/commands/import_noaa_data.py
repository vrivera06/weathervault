"""
Management command: python manage.py import_noaa_data

Reads combined_weather_data.csv from the project root (or a path
supplied via --csv-path), applies the NOAA processing pipeline, and
bulk-inserts all records into the WeatherRecord table.

Duplicate (station, date) pairs are skipped on re-runs.
"""

import csv
import os
from datetime import date as date_cls
from math import isnan

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from weather.models import WeatherRecord


def _safe_float(value):
    """Return float or None for empty / NaN strings."""
    if value is None or str(value).strip() == "":
        return None
    try:
        f = float(value)
        return None if isnan(f) else f
    except (ValueError, TypeError):
        return None


def _air_temp(tmax, tmin):
    """Average of TMAX and TMIN; returns None if both are missing."""
    t1 = _safe_float(tmax)
    t2 = _safe_float(tmin)
    if t1 is not None and t2 is not None:
        return (t1 + t2) / 2
    if t1 is not None:
        return t1
    if t2 is not None:
        return t2
    return None


class Command(BaseCommand):
    help = "Import NOAA weather CSV data into the WeatherRecord table."

    def add_arguments(self, parser):
        parser.add_argument(
            "--csv-path",
            default=None,
            help="Path to combined_weather_data.csv (defaults to <project_root>/combined_weather_data.csv)",
        )
        parser.add_argument(
            "--batch-size",
            type=int,
            default=500,
            help="Records per bulk_create call (default: 500)",
        )

    def handle(self, *args, **options):
        csv_path = options["csv_path"]
        if csv_path is None:
            # Walk up from this file to find manage.py's directory
            base = os.path.dirname(os.path.abspath(__file__))
            for _ in range(6):
                candidate = os.path.join(base, "combined_weather_data.csv")
                if os.path.exists(candidate):
                    csv_path = candidate
                    break
                base = os.path.dirname(base)

        if not csv_path or not os.path.exists(csv_path):
            raise CommandError(
                "Cannot find combined_weather_data.csv. "
                "Place it in the project root or pass --csv-path."
            )

        self.stdout.write(f"Reading {csv_path} …")

        # ── Parse CSV ──────────────────────────────────────────────────────
        rows = []
        stations_found = set()
        min_date = None
        max_date = None

        with open(csv_path, newline="", encoding="utf-8-sig") as fh:
            reader = csv.DictReader(fh)
            for raw in reader:
                try:
                    record_date = date_cls.fromisoformat(raw["DATE"][:10])
                except (KeyError, ValueError):
                    continue

                at = _air_temp(raw.get("TMAX"), raw.get("TMIN"))
                if at is None:
                    continue  # air_temp is non-nullable; skip incomplete rows

                station = (raw.get("NAME") or raw.get("STATION") or "").strip()
                if not station:
                    continue

                rows.append({
                    "station":        station,
                    "date":           record_date,
                    "rain":           _safe_float(raw.get("PRCP")),
                    "wind_speed":     _safe_float(raw.get("AWND")),
                    "wind_dir":       _safe_float(raw.get("WDF2")),
                    "max_wind_speed": _safe_float(raw.get("WSF2")),
                    "air_temp":       at,
                    "month":          record_date.month,
                    "year":           record_date.year,
                    "day_of_year":    record_date.timetuple().tm_yday,
                })

                stations_found.add(station)
                if min_date is None or record_date < min_date:
                    min_date = record_date
                if max_date is None or record_date > max_date:
                    max_date = record_date

        self.stdout.write(
            f"  Parsed {len(rows):,} rows | "
            f"date range: {min_date} → {max_date} | "
            f"stations: {len(stations_found)}"
        )
        for s in sorted(stations_found):
            self.stdout.write(f"    • {s}")

        # ── Compute prev_day_temp (shift by 1 within each station) ─────────
        rows.sort(key=lambda r: (r["station"], r["date"]))
        prev_temps: dict[str, float | None] = {}
        for row in rows:
            row["prev_day_temp"] = prev_temps.get(row["station"])
            prev_temps[row["station"]] = row["air_temp"]

        # ── Build existing (station, date) set to skip duplicates ──────────
        self.stdout.write("Checking for existing records …")
        existing = set(
            WeatherRecord.objects.values_list("station", "date")
        )
        self.stdout.write(f"  {len(existing):,} records already in DB (will be skipped).")

        # ── Filter new rows and build model instances ──────────────────────
        new_rows = [r for r in rows if (r["station"], r["date"]) not in existing]
        self.stdout.write(f"  {len(new_rows):,} new records to insert.")

        if not new_rows:
            self.stdout.write(self.style.SUCCESS("Nothing to import — all records already exist."))
            return

        objects = [
            WeatherRecord(
                station        = r["station"],
                date           = r["date"],
                rain           = r["rain"],
                wind_speed     = r["wind_speed"],
                wind_dir       = r["wind_dir"],
                max_wind_speed = r["max_wind_speed"],
                air_temp       = r["air_temp"],
                month          = r["month"],
                year           = r["year"],
                day_of_year    = r["day_of_year"],
                prev_day_temp  = r["prev_day_temp"],
            )
            for r in new_rows
        ]

        # ── Bulk insert in batches ─────────────────────────────────────────
        batch_size = options["batch_size"]
        inserted = 0
        with transaction.atomic():
            for i in range(0, len(objects), batch_size):
                batch = objects[i : i + batch_size]
                WeatherRecord.objects.bulk_create(batch, ignore_conflicts=True)
                inserted += len(batch)
                self.stdout.write(f"  … inserted {inserted:,}/{len(objects):,}", ending="\r")
                self.stdout.flush()

        self.stdout.write("")
        self.stdout.write(
            self.style.SUCCESS(
                f"Done. {inserted:,} records imported. "
                f"Date range: {min_date} → {max_date}."
            )
        )
