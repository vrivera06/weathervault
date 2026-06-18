from django.contrib import admin
from .models import WeatherRecord


@admin.register(WeatherRecord)
class WeatherRecordAdmin(admin.ModelAdmin):
    list_display = ["date", "station", "air_temp", "rain", "wind_speed", "max_wind_speed"]
    list_filter = ["station", "year", "month"]
    date_hierarchy = "date"
    search_fields = ["station"]
    ordering = ["-date"]
