import logging
import re
from calendar import month_name
from datetime import date, datetime, timedelta

from django.conf import settings
from django.db.models import Avg, Max, Min
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import WeatherRecord
from .serializers import (
    CurrentWeatherSerializer,
    WeatherRecordSerializer,
    WeeklySummarySerializer,
    MonthlySummarySerializer,
    CorrelativePointSerializer,
    StationSerializer,
    ChatMessageSerializer,
)

logger = logging.getLogger(__name__)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _pct_change(current, previous):
    if previous and previous != 0:
        return round((current - previous) / previous * 100, 1)
    return 0.0

def _condition_from_rain(avg_rain):
    if avg_rain is not None:
        if avg_rain > 0.1: return "Rainy"
        if avg_rain > 0:   return "Partly Cloudy"
    return "Sunny"

def _default_station():
    rec = WeatherRecord.objects.values("station").first()
    return rec["station"] if rec else None


# ─── GET /api/current/ ────────────────────────────────────────────────────────

@api_view(["GET"])
def current_weather(request):
    station = request.query_params.get("station") or _default_station()
    if not station:
        return Response({"detail": "No data available."}, status=status.HTTP_404_NOT_FOUND)
    record = WeatherRecord.objects.filter(station__icontains=station).first()
    if record is None:
        record = WeatherRecord.objects.first()
    if record is None:
        return Response({"detail": "No data available."}, status=status.HTTP_404_NOT_FOUND)
    return Response(CurrentWeatherSerializer(record).data)


# ─── GET /api/historical/ ─────────────────────────────────────────────────────

@api_view(["GET"])
def historical(request):
    station = request.query_params.get("station")
    start   = request.query_params.get("start")
    end     = request.query_params.get("end")
    qs = WeatherRecord.objects.all()
    if station: qs = qs.filter(station__icontains=station)
    if start:   qs = qs.filter(date__gte=start)
    if end:     qs = qs.filter(date__lte=end)
    return Response(WeatherRecordSerializer(qs.order_by("date"), many=True).data)


# ─── GET /api/weekly-summary/ ─────────────────────────────────────────────────

@api_view(["GET"])
def weekly_summary(request):
    station = request.query_params.get("station") or _default_station()
    qs = list(WeatherRecord.objects.filter(station__icontains=station).order_by("date") if station else WeatherRecord.objects.order_by("date"))
    if not qs: return Response([])

    weeks = {}
    for r in qs:
        iso = r.date.isocalendar()
        key = (iso.year, iso.week)
        weeks.setdefault(key, []).append(r)

    summaries = []
    week_keys = sorted(weeks)
    for i, key in enumerate(week_keys):
        records = weeks[key]
        temps  = [r.air_temp for r in records]
        rains  = [r.rain for r in records if r.rain is not None]
        winds  = [r.wind_speed for r in records if r.wind_speed is not None]
        dates  = sorted(r.date for r in records)
        avg_temp = sum(temps) / len(temps)
        avg_rain = sum(rains) / len(rains) if rains else None
        avg_wind = sum(winds) / len(winds) if winds else None
        if i > 0:
            prev_recs  = weeks[week_keys[i - 1]]
            prev_avg_temp = sum(r.air_temp for r in prev_recs) / len(prev_recs)
            prev_rains = [r.rain for r in prev_recs if r.rain is not None]
            prev_avg_rain = sum(prev_rains) / len(prev_rains) if prev_rains else None
        else:
            prev_avg_temp = avg_temp; prev_avg_rain = avg_rain
        summaries.append({
            "week_label": f"{dates[0].strftime('%b %-d')}–{dates[-1].strftime('%-d, %Y')}",
            "week_start": dates[0], "week_end": dates[-1],
            "station": station or records[0].station,
            "avg_temp_f": round(avg_temp, 1), "max_temp_f": round(max(temps), 1), "min_temp_f": round(min(temps), 1),
            "avg_rain": round(avg_rain, 3) if avg_rain is not None else None,
            "avg_wind_speed": round(avg_wind, 1) if avg_wind is not None else None,
            "condition": _condition_from_rain(avg_rain),
            "temp_change_pct": _pct_change(avg_temp, prev_avg_temp) if i > 0 else 0.0,
            "rain_change_pct": _pct_change(avg_rain, prev_avg_rain) if (i > 0 and avg_rain is not None and prev_avg_rain) else 0.0,
            "avg_humidity": None, "humid_change_pct": 0.0,
        })
    summaries.reverse()
    return Response(WeeklySummarySerializer(summaries, many=True).data)


# ─── GET /api/monthly-summary/ ────────────────────────────────────────────────

@api_view(["GET"])
def monthly_summary(request):
    station = request.query_params.get("station") or _default_station()
    qs = list(WeatherRecord.objects.filter(station__icontains=station).order_by("date") if station else WeatherRecord.objects.order_by("date"))
    if not qs: return Response([])

    months = {}
    for r in qs:
        key = (r.date.year, r.date.month)
        months.setdefault(key, []).append(r)

    summaries = []
    month_keys = sorted(months)
    for i, key in enumerate(month_keys):
        yr, mo = key
        records = months[key]
        temps  = [r.air_temp for r in records]
        rains  = [r.rain for r in records if r.rain is not None]
        winds  = [r.wind_speed for r in records if r.wind_speed is not None]
        avg_temp = sum(temps) / len(temps)
        avg_rain = sum(rains) / len(rains) if rains else None
        avg_wind = sum(winds) / len(winds) if winds else None
        if i > 0:
            prev_recs = months[month_keys[i - 1]]
            prev_avg_temp = sum(r.air_temp for r in prev_recs) / len(prev_recs)
            prev_rains = [r.rain for r in prev_recs if r.rain is not None]
            prev_avg_rain = sum(prev_rains) / len(prev_rains) if prev_rains else None
        else:
            prev_avg_temp = avg_temp; prev_avg_rain = avg_rain
        label = f"{month_name[mo]} {yr}"
        if len(records) < 28: label += " (partial)"
        summaries.append({
            "month_label": label, "year": yr, "month": mo,
            "station": station or records[0].station,
            "avg_temp_f": round(avg_temp, 1), "max_temp_f": round(max(temps), 1), "min_temp_f": round(min(temps), 1),
            "avg_rain": round(avg_rain, 3) if avg_rain is not None else None,
            "avg_wind_speed": round(avg_wind, 1) if avg_wind is not None else None,
            "condition": _condition_from_rain(avg_rain),
            "temp_change_pct": _pct_change(avg_temp, prev_avg_temp) if i > 0 else 0.0,
            "rain_change_pct": _pct_change(avg_rain, prev_avg_rain) if (i > 0 and avg_rain is not None and prev_avg_rain) else 0.0,
            "avg_humidity": None, "humid_change_pct": 0.0,
        })
    summaries.reverse()
    return Response(MonthlySummarySerializer(summaries, many=True).data)


# ─── GET /api/correlative/ ────────────────────────────────────────────────────

@api_view(["GET"])
def correlative(request):
    station   = request.query_params.get("station") or _default_station()
    today     = date.today()
    window_start = today - timedelta(days=30)
    qs_filter = {"station__icontains": station} if station else {}
    current_qs = WeatherRecord.objects.filter(**qs_filter, date__gte=window_start, date__lte=today).order_by("date")
    prev_lookup = {r.date: r for r in WeatherRecord.objects.filter(**qs_filter, date__gte=window_start.replace(year=window_start.year-1), date__lte=today.replace(year=today.year-1))}
    points = []
    for r in current_qs:
        prev = prev_lookup.get(r.date.replace(year=r.date.year - 1))
        points.append({"date": r.date, "temp_current_year": r.air_temp, "temp_prev_year": prev.air_temp if prev else None, "rain_current_year": r.rain, "rain_prev_year": prev.rain if prev else None})
    return Response(CorrelativePointSerializer(points, many=True).data)


# ─── GET /api/stations/ ───────────────────────────────────────────────────────

@api_view(["GET"])
def stations(request):
    names = WeatherRecord.objects.values_list("station", flat=True).distinct().order_by("station")
    return Response(StationSerializer([{"station": s} for s in names], many=True).data)


# ─── POST /api/chat/ ──────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are Environmental Eddie, a friendly and knowledgeable climate assistant built into WeatherVault.

You have FULL access to the NOAA JFK Airport weather dataset (2014–2026, 4,300+ daily records). When users ask about a specific date, you will be provided with the exact data for that day — use it to answer precisely.

Your capabilities:
- Answer questions about weather on specific dates using the injected data
- Analyze temperature trends, precipitation patterns, and wind data over time
- Explain year-over-year climate comparisons
- Describe what the Random Forest predictive model forecasts
- Give personalized carbon footprint reduction advice based on current conditions

Carbon footprint recommendations should be specific and actionable:
- Driving habits (carpool, bike, walk, EV tips)
- Diet (seasonal eating, plant-based meals)
- Home energy (HVAC, insulation, appliance tips)
- Daily habits (reusable bottles, shorter showers, unplugging devices)

Be friendly, concise, and data-driven. Reference specific numbers from the dataset when available."""

FALLBACK_REPLY = "I'm having trouble connecting right now. Please make sure the Django server is running and GEMINI_API_KEY is set."


def _extract_date(text):
    """Try to parse a date from the user's message."""
    patterns = [
        (r'\d{4}-\d{2}-\d{2}', '%Y-%m-%d'),
        (r'\d{1,2}/\d{1,2}/\d{4}', '%m/%d/%Y'),
    ]
    month_pattern = r'(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}'
    month_formats = ['%B %d, %Y', '%B %d %Y', '%b %d, %Y', '%b %d %Y', '%b. %d, %Y']

    for pattern, fmt in patterns:
        m = re.search(pattern, text)
        if m:
            try: return datetime.strptime(m.group(), fmt).date()
            except: pass

    m = re.search(month_pattern, text, re.IGNORECASE)
    if m:
        ds = m.group().replace(',', '')
        for fmt in month_formats:
            try: return datetime.strptime(ds, fmt).date()
            except: pass
    return None


def _build_weather_context(user_message=""):
    latest = WeatherRecord.objects.first()
    oldest = WeatherRecord.objects.order_by('date').first()
    total  = WeatherRecord.objects.count()
    if not latest:
        return ""

    parts = [
        f"NOAA Dataset: {total:,} daily records · {oldest.date} to {latest.date} · Station: {latest.station}",
        f"",
        f"Latest record ({latest.date}): Air Temp {latest.air_temp}°F · Rain {latest.rain} in · Wind {latest.wind_speed} mph · Max Wind {latest.max_wind_speed} mph · Dir {latest.wind_dir}°",
    ]

    # Inject specific date data if user mentions one
    found_date = _extract_date(user_message)
    if found_date:
        record = WeatherRecord.objects.filter(date=found_date).first()
        if record:
            parts += [
                f"",
                f"Data for {found_date} (user asked about this date):",
                f"  Air Temperature: {record.air_temp}°F",
                f"  Precipitation: {record.rain} inches",
                f"  Wind Speed: {record.wind_speed} mph",
                f"  Max Wind Speed: {record.max_wind_speed} mph",
                f"  Wind Direction: {record.wind_dir}°",
                f"  Day of Year: {record.day_of_year} · Month: {record.month} · Year: {record.year}",
            ]
        else:
            parts.append(f"\nNo data found for {found_date} in the dataset (may be outside the 2014–2026 range).")

    return "\n".join(parts)


@api_view(["POST"])
def chat(request):
    serializer = ChatMessageSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    api_key = settings.GEMINI_API_KEY
    if not api_key or api_key == "our_actual_key":
        return Response({"reply": FALLBACK_REPLY}, status=status.HTTP_200_OK)

    user_message = serializer.validated_data["message"]
    raw_history  = serializer.validated_data.get("history", [])
    weather_ctx  = _build_weather_context(user_message)
    system_full  = f"{SYSTEM_PROMPT}\n\n{weather_ctx}" if weather_ctx else SYSTEM_PROMPT

    try:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=api_key)
        gemini_history = []
        for msg in raw_history:
            role = "model" if msg.get("role") == "assistant" else "user"
            text = msg.get("text", "")
            if text:
                gemini_history.append(types.Content(role=role, parts=[types.Part(text=text)]))
        session = client.chats.create(
            model=settings.GEMINI_MODEL,
            config=types.GenerateContentConfig(system_instruction=system_full),
            history=gemini_history,
        )
        response = session.send_message(user_message)
        return Response({"reply": response.text})
    except Exception as exc:
        logger.error("Gemini API error: %s", exc)
        return Response({"reply": FALLBACK_REPLY}, status=status.HTTP_200_OK)
