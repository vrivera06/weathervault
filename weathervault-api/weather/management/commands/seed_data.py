"""
Management command: python manage.py seed_data

Seeds the database with Pleasantville mock data mirroring the
React frontend's mockData.js so the API returns matching values
during development before NOAA data arrives.
"""

import math
import random
from datetime import date, timedelta

from django.core.management.base import BaseCommand

from weather.models import WeatherRecord


def _pick_condition(humidity: float) -> str:
    if humidity > 75:
        return "Rainy"
    if humidity > 60:
        return "Cloudy"
    if humidity > 45:
        return "Partly Cloudy"
    return "Sunny"


def _generate_daily_data(start_date: date, days: int, base_temp_f: float, base_humidity: float):
    """Mirrors the generateDailyData() function in mockData.js."""
    records = []
    # Use a fixed seed for reproducible data so re-running seed is idempotent
    rng = random.Random(42)
    for i in range(days):
        d = start_date + timedelta(days=i)
        seasonal_temp = math.sin((i / days) * math.pi) * 8
        noise = (rng.random() - 0.5) * 6
        humid_noise = (rng.random() - 0.5) * 12

        temp = round(base_temp_f + seasonal_temp + noise, 1)
        humidity = int(min(95, max(30, round(base_humidity + humid_noise))))
        wind = round(8 + rng.random() * 12, 1)

        records.append(WeatherRecord(
            date=d,
            city="Pleasantville",
            temp_f=temp,
            humidity=humidity,
            wind_mph=wind,
            condition=_pick_condition(base_humidity + humid_noise),
        ))
    return records


class Command(BaseCommand):
    help = "Seed the database with Pleasantville mock weather data (mirrors React mockData.js)"

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

        records_2025 = _generate_daily_data(date(2025, 6, 1), 45, 74.0, 58.0)
        records_2026 = _generate_daily_data(date(2026, 6, 1), 15, 76.0, 61.0)
        all_records = records_2025 + records_2026

        created = 0
        skipped = 0
        for record in all_records:
            _, was_created = WeatherRecord.objects.get_or_create(
                date=record.date,
                city=record.city,
                defaults={
                    "temp_f": record.temp_f,
                    "humidity": record.humidity,
                    "wind_mph": record.wind_mph,
                    "condition": record.condition,
                },
            )
            if was_created:
                created += 1
            else:
                skipped += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {created} records for Pleasantville "
                f"({skipped} already existed, skipped)."
            )
        )
