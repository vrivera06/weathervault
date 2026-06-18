import { useState, useMemo, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Wind, Droplets, Thermometer, Eye, Search, Calendar } from 'lucide-react';
import SectionBadge from '../components/SectionBadge';
import { SkeletonCard, SkeletonChart } from '../components/Skeleton';
import ErrorState from '../components/ErrorState';
import { fetchCurrentWeather, fetchHistorical } from '../api/weatherApi';

const RANGES = ['Daily', 'Weekly', 'Monthly'];
const WINDOW = { Daily: 90, Weekly: 26, Monthly: 24 };

const CONDITION_ICON = { 'Sunny': '☀️', 'Partly Cloudy': '⛅', 'Cloudy': '☁️', 'Rainy': '🌧️', 'Stormy': '⛈️' };

function StatCard({ icon: Icon, label, value, unit, color = 'var(--accent)' }) {
  return (
    <div className="glass" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Icon size={14} style={{ color }} />
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
        {value}<span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '3px' }}>{unit}</span>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(10,24,60,0.92)', backdropFilter: 'blur(12px)', border: '1px solid var(--card-border)', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: 'var(--text-primary)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: '6px', fontFamily: "'Fira Code', monospace" }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color, fontWeight: 600 }}>
          {p.name || p.dataKey}: {p.value}{unit}
        </p>
      ))}
    </div>
  );
}

function SliderChart({ title, dataKey, unit, color, data, allData, sliderVal, onSlider }) {
  const tickStyle = { fill: 'rgba(255,255,255,0.45)', fontSize: 11, fontFamily: "'Fira Code', monospace" };
  const maxSlider = Math.max(0, allData.length - data.length);
  const startDate = data[0]?.date;
  const endDate   = data[data.length - 1]?.date;

  return (
    <div className="glass" style={{ padding: '20px', flex: 1, minWidth: '280px', background: 'var(--chart-bg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>{title}</p>
        {startDate && (
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: "'Fira Code', monospace" }}>
            {startDate} → {endDate}
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="date" tick={tickStyle} tickLine={false} axisLine={false} tickFormatter={d => String(d).slice(5)} interval={Math.floor(data.length / 6)} />
          <YAxis tick={tickStyle} tickLine={false} axisLine={false} unit={unit} domain={['auto', 'auto']} width={45} />
          <Tooltip content={<CustomTooltip unit={unit} />} />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: color, stroke: 'white', strokeWidth: 2 }} />
        </LineChart>
      </ResponsiveContainer>

      {/* Time scrubber */}
      {maxSlider > 0 && (
        <div style={{ marginTop: '12px', padding: '0 4px' }}>
          <input
            type="range"
            min={0}
            max={maxSlider}
            value={sliderVal}
            onChange={e => onSlider(Number(e.target.value))}
            style={{ width: '100%', accentColor: color, cursor: 'pointer', height: '3px' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: "'Fira Code', monospace" }}>{allData[0]?.date}</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: "'Fira Code', monospace" }}>Scrub timeline</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: "'Fira Code', monospace" }}>{allData[allData.length - 1]?.date}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function aggregateWeekly(data) {
  const weeks = [];
  for (let i = 0; i < data.length; i += 7) {
    const slice = data.slice(i, i + 7);
    if (!slice.length) continue;
    const validWind = slice.filter(d => d.windSpeed != null);
    weeks.push({
      date: slice[0].date,
      tempF:     Math.round(slice.reduce((s, d) => s + d.tempF, 0) / slice.length * 10) / 10,
      windSpeed: validWind.length ? Math.round(validWind.reduce((s, d) => s + d.windSpeed, 0) / validWind.length * 10) / 10 : null,
    });
  }
  return weeks;
}

function aggregateMonthly(data) {
  const map = {};
  data.forEach(d => {
    const m = String(d.date).slice(0, 7);
    if (!map[m]) map[m] = { date: m, temps: [], winds: [] };
    map[m].temps.push(d.tempF);
    if (d.windSpeed != null) map[m].winds.push(d.windSpeed);
  });
  return Object.values(map).map(m => ({
    date: m.date,
    tempF:     Math.round(m.temps.reduce((a, b) => a + b, 0) / m.temps.length * 10) / 10,
    windSpeed: m.winds.length ? Math.round(m.winds.reduce((a, b) => a + b, 0) / m.winds.length * 10) / 10 : null,
  }));
}

export default function Dashboard({ dateRange, setDateRange }) {
  const [current, setCurrent]     = useState(null);
  const [historical, setHistorical] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [searchDate, setSearchDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sliderVal, setSliderVal] = useState(0); // 0 = latest

  async function load() {
    setLoading(true); setError(null);
    try {
      const [cur, hist] = await Promise.all([fetchCurrentWeather(), fetchHistorical()]);
      setCurrent(cur);
      setHistorical(hist);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Reset slider to "latest" when range changes
  useEffect(() => { setSliderVal(0); }, [dateRange]);

  const allChartData = useMemo(() => {
    const base = historical.map(d => ({
      date:      d.date,
      tempF:     parseFloat(d.temp_f ?? d.air_temp ?? d.tempF),
      windSpeed: d.wind_speed != null ? parseFloat(d.wind_speed) : null,
    }));
    if (dateRange === 'Weekly')  return aggregateWeekly(base);
    if (dateRange === 'Monthly') return aggregateMonthly(base);
    return base;
  }, [historical, dateRange]);

  // Windowed slice — slider 0 = most recent end
  const windowSize = WINDOW[dateRange] || 90;
  const chartData = useMemo(() => {
    if (!allChartData.length) return [];
    const maxStart = Math.max(0, allChartData.length - windowSize);
    // slider 0 = end of data, slider max = start of data
    const startIdx = maxStart - Math.round(sliderVal / Math.max(1, allChartData.length - windowSize) * maxStart);
    const clamped  = Math.max(0, Math.min(startIdx, maxStart));
    return allChartData.slice(clamped, clamped + windowSize);
  }, [allChartData, sliderVal, windowSize]);

  const sliderMax = Math.max(0, allChartData.length - windowSize);

  const searchResult = useMemo(() => {
    if (!searchDate) return null;
    return historical.find(d => d.date === searchDate) || null;
  }, [searchDate, historical]);

  if (error) return (
    <div style={{ padding: '36px 40px' }}>
      <SectionBadge number={1} />
      <h1 style={{ fontSize: '42px', fontWeight: 900, marginBottom: '24px' }}>Dashboard</h1>
      <ErrorState message={error} onRetry={load} />
    </div>
  );

  return (
    <div style={{ padding: '36px 40px', maxWidth: '1300px' }} className="page-enter">
      <SectionBadge number={1} />
      <h1 style={{ fontSize: '42px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '8px' }}>
        Dashboard
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '32px' }}>
        Real-time weather overview · JFK International Airport, NY
      </p>

      {/* Current weather */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'auto auto 1fr', gap: '28px', marginBottom: '28px' }}>
          <SkeletonCard height={140} /><SkeletonCard height={140} /><SkeletonCard height={140} />
        </div>
      ) : current && (
        <div className="glass" style={{ padding: '24px 28px', display: 'flex', alignItems: 'center', gap: '32px', marginBottom: '28px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '52px', lineHeight: 1 }}>{CONDITION_ICON[current.condition] || '🌤️'}</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>{current.condition}</p>
          </div>
          <div>
            <div style={{ fontSize: '56px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>
              {parseFloat(current.temp_f ?? current.air_temp).toFixed(1)}°
              <span style={{ fontSize: '24px', color: 'var(--text-muted)', fontWeight: 400 }}>F</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
              {current.station || 'JFK International Airport'} · {current.date}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: "'Fira Code', monospace" }}>
              Rain: {current.rain ?? '—'} in · Wind dir: {current.wind_dir ?? '—'}°
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', flex: 1, minWidth: '260px' }}>
            <StatCard icon={Droplets}    label="Precipitation" value={current.rain ?? '—'}                              unit="in"  color="var(--line-humidity)" />
            <StatCard icon={Wind}        label="Wind Speed"    value={parseFloat(current.wind_speed ?? 0).toFixed(1)}   unit="mph" color="var(--accent)" />
            <StatCard icon={Thermometer} label="Max Wind"      value={parseFloat(current.max_wind_speed ?? 0).toFixed(1)} unit="mph" color="var(--accent-warm)" />
            <StatCard icon={Eye}         label="Wind Dir"      value={current.wind_dir ?? '—'}                          unit="°"   color="var(--text-secondary)" />
          </div>
        </div>
      )}

      {/* Range toggle + search */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.25)', padding: '4px', borderRadius: '10px', backdropFilter: 'blur(8px)' }}>
          {RANGES.map(r => (
            <button key={r} onClick={() => setDateRange(r)} style={{ padding: '6px 18px', borderRadius: '7px', fontSize: '13px', fontWeight: 500, background: dateRange === r ? 'rgba(255,255,255,0.15)' : 'transparent', color: dateRange === r ? 'var(--text-primary)' : 'var(--text-muted)', border: dateRange === r ? '1px solid var(--card-border)' : '1px solid transparent', cursor: 'pointer', transition: 'all 150ms ease' }}>
              {r}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px', borderRadius: '10px' }}>
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search location..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '13px', width: '150px' }} />
          </div>
          <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px', borderRadius: '10px' }}>
            <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
            <input type="date" value={searchDate} onChange={e => setSearchDate(e.target.value)} style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '13px', colorScheme: 'dark' }} />
          </div>
        </div>
      </div>

      {/* Date lookup result */}
      {searchDate && (
        <div className="glass" style={{ padding: '12px 18px', marginBottom: '20px', fontSize: '13px', borderColor: searchResult ? 'rgba(0,200,150,0.4)' : 'var(--card-border)' }}>
          {searchResult ? (
            <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--accent)', fontFamily: "'Fira Code', monospace" }}>{searchResult.date}</span>
              <span>Temp: <strong>{parseFloat(searchResult.temp_f ?? searchResult.air_temp).toFixed(1)}°F</strong></span>
              <span>Rain: <strong>{searchResult.rain ?? '—'} in</strong></span>
              <span>Wind: <strong>{parseFloat(searchResult.wind_speed ?? 0).toFixed(1)} mph</strong></span>
              <span>Condition: <strong>{searchResult.condition}</strong></span>
            </div>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>No data for {searchDate}</span>
          )}
        </div>
      )}

      {/* Charts */}
      {loading ? (
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <SkeletonChart height={260} /><SkeletonChart height={260} />
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <SliderChart
            title="Temperature over time — JFK Airport"
            dataKey="tempF" unit="°F" color="var(--line-temp)"
            data={chartData} allData={allChartData}
            sliderVal={sliderVal} onSlider={setSliderVal}
          />
          <SliderChart
            title="Wind Speed over time — JFK Airport"
            dataKey="windSpeed" unit=" mph" color="var(--accent)"
            data={chartData} allData={allChartData}
            sliderVal={sliderVal} onSlider={setSliderVal}
          />
        </div>
      )}

      {allChartData.length > windowSize && (
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px', fontFamily: "'Fira Code', monospace", textAlign: 'center' }}>
          Showing {Math.min(windowSize, chartData.length)} of {allChartData.length} {dateRange.toLowerCase()} points · drag slider to explore
        </p>
      )}
    </div>
  );
}
