/**
 * Weather API service.
 *
 * If VITE_API_BASE_URL is set (e.g. http://localhost:8000), all calls
 * hit the Django backend. If it's absent, the mock data fallbacks are
 * used — swap to real data with a single .env line:
 *
 *   VITE_API_BASE_URL=http://localhost:8000
 */

import {
  currentWeather as mockCurrent,
  dailyData2025,
  dailyData2026,
  weeklyHistory,
  monthlyHistory,
  correlativeData,
} from '../data/mockData';

const BASE = import.meta.env.VITE_API_BASE_URL || null;

async function apiFetch(path, params = {}) {
  const url = new URL(`${BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => v != null && url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

// ─── Current conditions ────────────────────────────────────────────────────

export async function fetchCurrentWeather(city = 'Pleasantville') {
  if (!BASE) return mockCurrent;
  return apiFetch('/api/current/', { city });
}

// ─── Historical time series ────────────────────────────────────────────────

export async function fetchHistorical({ start, end, city = 'Pleasantville' } = {}) {
  if (!BASE) {
    // Return all mock data; caller can filter further if needed
    return [...dailyData2025, ...dailyData2026];
  }
  return apiFetch('/api/historical/', { start, end, city });
}

// ─── Weekly summary (Past Models table) ───────────────────────────────────

export async function fetchWeeklySummary() {
  if (!BASE) return weeklyHistory;
  const rows = await apiFetch('/api/weekly-summary/');
  return rows.map(r => ({
    week: `${r.week_start} – ${r.week_end}`,
    avgTempF: parseFloat(r.avg_temp_f),
    maxTempF: parseFloat(r.max_temp_f),
    minTempF: parseFloat(r.min_temp_f),
    avgRain: r.avg_rain,
    avgWindSpeed: r.avg_wind_speed,
    condition: r.condition,
    tempChangePct: r.temp_change_pct,
    rainChangePct: r.rain_change_pct,
  }));
}

// ─── Monthly summary (Past Models table) ──────────────────────────────────

export async function fetchMonthlySummary() {
  if (!BASE) return monthlyHistory;
  const rows = await apiFetch('/api/monthly-summary/');
  return rows.map(r => ({
    month: r.month_label,
    avgTempF: parseFloat(r.avg_temp_f),
    maxTempF: parseFloat(r.max_temp_f),
    minTempF: parseFloat(r.min_temp_f),
    avgRain: r.avg_rain,
    avgWindSpeed: r.avg_wind_speed,
    condition: r.condition,
    tempChangePct: r.temp_change_pct,
    rainChangePct: r.rain_change_pct,
  }));
}

// ─── Correlative (year-over-year) ─────────────────────────────────────────

export async function fetchCorrelative(city = 'Pleasantville') {
  if (!BASE) return correlativeData;
  const rows = await apiFetch('/api/correlative/', { city });
  return rows.map(r => ({
    date: r.date,
    temp2026: r.temp_current_year,
    temp2025: r.temp_prev_year,
    rain2026: r.rain_current_year,
    rain2025: r.rain_prev_year,
  }));
}
