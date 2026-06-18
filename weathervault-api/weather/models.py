from django.db import models


class WeatherRecord(models.Model):
    """
    One row per station per day, sourced from NOAA CSV data.
    Field names mirror the processed dataset from import_noaa_data.
    Frontend-facing aliases (temp_f, wind_mph, etc.) are properties
    for backward compatibility.
    """

    station         = models.CharField(max_length=200, db_index=True)
    date            = models.DateField(db_index=True)
    rain            = models.FloatField(null=True, blank=True, help_text="Precipitation (inches)")
    wind_speed      = models.FloatField(null=True, blank=True, help_text="Avg wind speed (mph)")
    wind_dir        = models.FloatField(null=True, blank=True, help_text="Wind direction (degrees)")
    max_wind_speed  = models.FloatField(null=True, blank=True, help_text="Fastest wind speed (mph)")
    air_temp        = models.FloatField(help_text="Average of TMAX and TMIN (°F)")
    month           = models.IntegerField()
    year            = models.IntegerField()
    day_of_year     = models.IntegerField()
    prev_day_temp   = models.FloatField(null=True, blank=True, help_text="Previous day air temp (°F)")
    created_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date"]
        unique_together = ("station", "date")
        indexes = [
            models.Index(fields=["station", "date"]),
            models.Index(fields=["year", "month"]),
        ]

    def __str__(self):
        return f"{self.station} — {self.date} — {self.air_temp}°F"

    # ── Frontend compatibility properties ──────────────────────────────────

    @property
    def temp_f(self):
        return self.air_temp

    @property
    def wind_mph(self):
        return self.wind_speed

    @property
    def humidity(self):
        return None  # not in NOAA data

    @property
    def condition(self):
        if self.rain is not None:
            if self.rain > 0.1:
                return "Rainy"
            if self.rain > 0:
                return "Partly Cloudy"
        return "Sunny"
