"""
python manage.py seed_weather [--clear]

Populates WeatherRecord with Pleasantville mock data matching the React
frontend's mockData.js so the frontend can immediately switch from
importing mock data to calling the API without any visual difference.

Data generated:
  • 45 daily records  — 2025-06-01 to 2025-07-15
  • 15 daily records  — 2026-06-01 to 2026-06-15
  City: Pleasantville
"""

import math
import random
from datetime import date, timedelta

from django.core.management.base import BaseCommand

from weather.models import WeatherRecord


# ─── Generation helpers (mirrors mockData.js logic exactly) ───────────────────

def _pick_condition(humidity: float) -> str:
    if humidity > 75:
        return "Rainy"
    if humidity > 60:
        return "Cloudy"
    if humidity > 45:
        return "Partly Cloudy"
    return "Sunny"


def _feels_like(temp_f: float, humidity: int) -> float:
    """Rothfusz heat index formula (accurate ≥80°F); simple offset below."""
    if temp_f >= 80:
        hi = (
            -42.379
            + 2.04901523 * temp_f
            + 10.14333127 * humidity
            - 0.22475541 * temp_f * humidity
            - 6.83783e-3 * temp_f ** 2
            - 5.481717e-2 * humidity ** 2
            + 1.22874e-3 * temp_f ** 2 * humidity
            + 8.5282e-4 * temp_f * humidity ** 2
            - 1.99e-6 * temp_f ** 2 * humidity ** 2
        )
        return round(hi, 1)
    return round(temp_f + (humidity - 50) * 0.05, 1)


def _uv_index(temp_f: float, condition: str) -> int:
    """Rough UV proxy from temp and sky cover."""
    base = max(1, min(11, round((temp_f - 55) / 4)))
    penalties = {"Rainy": -3, "Cloudy": -2, "Partly Cloudy": -1, "Sunny": 0}
    return max(1, base + penalties.get(condition, 0))


def _generate_daily_records(
    start_date: date,
    days: int,
    base_temp_f: float,
    base_humidity: float,
    seed: int = 42,
) -> list[dict]:
    rng = random.Random(seed)
    records = []
    for i in range(days):
        d = start_date + timedelta(days=i)
        seasonal_temp = math.sin((i / days) * math.pi) * 8
        temp = round(base_temp_f + seasonal_temp + (rng.random() - 0.5) * 6, 1)
        raw_humid = base_humidity + (rng.random() - 0.5) * 12
        humidity = int(min(95, max(30, round(raw_humid))))
        wind = round(8 + rng.random() * 12, 1)
        condition = _pick_condition(raw_humid)
        pressure = round(1010 + (rng.random() - 0.5) * 10, 1)
        visibility = round(8 + rng.random() * 4, 1)

        records.append({
            "date": d,
            "city": "Pleasantville",
            "temp_f": temp,
            "feels_like_f": _feels_like(temp, humidity),
            "humidity": humidity,
            "wind_mph": wind,
            "condition": condition,
            "uv_index": _uv_index(temp, condition),
            "pressure": pressure,
            "visibility": visibility,
        })
    return records


# ─── Command ──────────────────────────────────────────────────────────────────

class Command(BaseCommand):
    help = "Seed WeatherRecord with Pleasantville mock data (mirrors React mockData.js)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete all existing WeatherRecord rows before seeding",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            deleted, _ = WeatherRecord.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"Deleted {deleted} existing records."))

        batches = [
            (date(2025, 6, 1),  45, 74.0, 58.0, 42),   # Jun 1 – Jul 15, 2025
            (date(2026, 6, 1),  15, 76.0, 61.0, 99),   # Jun 1 – Jun 15, 2026
        ]

        created = skipped = 0
        for start, days, base_temp, base_humid, seed in batches:
            for data in _generate_daily_records(start, days, base_temp, base_humid, seed):
                _, was_created = WeatherRecord.objects.update_or_create(
                    date=data["date"],
                    city=data["city"],
                    defaults={k: v for k, v in data.items() if k not in ("date", "city")},
                )
                if was_created:
                    created += 1
                else:
                    skipped += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Done — {created} created, {skipped} updated for Pleasantville."
            )
        )
