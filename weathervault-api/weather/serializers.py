from rest_framework import serializers
from .models import WeatherRecord


class WeatherRecordSerializer(serializers.ModelSerializer):
    """Full daily record — used by /api/historical/."""
    temp_f    = serializers.FloatField(source="air_temp")
    wind_mph  = serializers.SerializerMethodField()
    humidity  = serializers.SerializerMethodField()
    condition = serializers.SerializerMethodField()

    class Meta:
        model = WeatherRecord
        fields = [
            "id", "station", "date",
            "air_temp", "rain", "wind_speed", "wind_dir", "max_wind_speed",
            "month", "year", "day_of_year", "prev_day_temp",
            "temp_f", "wind_mph", "humidity", "condition",
            "created_at",
        ]

    def get_wind_mph(self, obj):
        return obj.wind_speed

    def get_humidity(self, obj):
        return None

    def get_condition(self, obj):
        return obj.condition


class CurrentWeatherSerializer(WeatherRecordSerializer):
    """Latest record — used by /api/current/."""
    pass


class WeeklySummarySerializer(serializers.Serializer):
    week_label       = serializers.CharField()
    week_start       = serializers.DateField()
    week_end         = serializers.DateField()
    station          = serializers.CharField()
    avg_temp_f       = serializers.FloatField()
    max_temp_f       = serializers.FloatField()
    min_temp_f       = serializers.FloatField()
    avg_rain         = serializers.FloatField(allow_null=True)
    avg_wind_speed   = serializers.FloatField(allow_null=True)
    condition        = serializers.CharField()
    temp_change_pct  = serializers.FloatField()
    rain_change_pct  = serializers.FloatField()
    avg_humidity     = serializers.IntegerField(allow_null=True)
    humid_change_pct = serializers.FloatField()


class MonthlySummarySerializer(serializers.Serializer):
    month_label      = serializers.CharField()
    year             = serializers.IntegerField()
    month            = serializers.IntegerField()
    station          = serializers.CharField()
    avg_temp_f       = serializers.FloatField()
    max_temp_f       = serializers.FloatField()
    min_temp_f       = serializers.FloatField()
    avg_rain         = serializers.FloatField(allow_null=True)
    avg_wind_speed   = serializers.FloatField(allow_null=True)
    condition        = serializers.CharField()
    temp_change_pct  = serializers.FloatField()
    rain_change_pct  = serializers.FloatField()
    avg_humidity     = serializers.IntegerField(allow_null=True)
    humid_change_pct = serializers.FloatField()


class CorrelativePointSerializer(serializers.Serializer):
    date              = serializers.DateField()
    temp_current_year = serializers.FloatField(allow_null=True)
    temp_prev_year    = serializers.FloatField(allow_null=True)
    rain_current_year = serializers.FloatField(allow_null=True)
    rain_prev_year    = serializers.FloatField(allow_null=True)
    # Legacy compat
    temp_2026         = serializers.FloatField(source="temp_current_year", allow_null=True)
    temp_2025         = serializers.FloatField(source="temp_prev_year", allow_null=True)
    humidity_2026     = serializers.SerializerMethodField()
    humidity_2025     = serializers.SerializerMethodField()

    def get_humidity_2026(self, obj):
        return None

    def get_humidity_2025(self, obj):
        return None


class StationSerializer(serializers.Serializer):
    station = serializers.CharField()


class ChatMessageSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=2000)
    history = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list,
    )
