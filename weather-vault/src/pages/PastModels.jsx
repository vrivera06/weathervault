import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Filter } from 'lucide-react';
import SectionBadge from '../components/SectionBadge';
import { SkeletonTable, SkeletonCard } from '../components/Skeleton';
import ErrorState from '../components/ErrorState';
import { fetchWeeklySummary, fetchMonthlySummary } from '../api/weatherApi';

const VIEWS = ['Weekly', 'Monthly'];

function ChangePill({ value }) {
  if (value == null) return <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>;
  const neutral = Math.abs(value) < 0.5;
  const positive = value > 0;
  const color = neutral ? 'var(--text-muted)' : positive ? 'var(--destructive)' : 'var(--accent)';
  const Icon = neutral ? Minus : positive ? TrendingUp : TrendingDown;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color, fontFamily: "'Fira Code', monospace" }}>
      <Icon size={12} />
      {positive && !neutral ? '+' : ''}{value.toFixed(1)}%
    </span>
  );
}

function ConditionDot({ condition }) {
  const colors = { 'Sunny': '#ffd166', 'Partly Cloudy': '#5bd4ff', 'Cloudy': 'rgba(255,255,255,0.4)', 'Rainy': '#74c0fc' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors[condition] || '#888', display: 'inline-block', flexShrink: 0 }} />
      {condition || '—'}
    </span>
  );
}

const TH = ({ children }) => (
  <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, whiteSpace: 'nowrap', borderBottom: '1px solid var(--card-border)' }}>
    {children}
  </th>
);

const TD = ({ children, mono }) => (
  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-primary)', borderBottom: '1px solid rgba(255,255,255,0.06)', fontFamily: mono ? "'Fira Code', monospace" : undefined, whiteSpace: 'nowrap' }}>
    {children}
  </td>
);

export default function PastModels() {
  const [view, setView]           = useState('Weekly');
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const [weekly, monthly] = await Promise.all([fetchWeeklySummary(), fetchMonthlySummary()]);
      setWeeklyData(weekly);
      setMonthlyData(monthly);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const data = view === 'Weekly' ? weeklyData : monthlyData;

  // Summary cards from first row of current view
  const topRow = data[0] || {};

  return (
    <div style={{ padding: '36px 40px', maxWidth: '1200px' }} className="page-enter">
      <SectionBadge number={2} />
      <h1 style={{ fontSize: '42px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '8px' }}>
        Past Models
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '32px' }}>
        Historical NOAA weather data — JFK Airport · 2014–2026
      </p>

      {/* Summary cards */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '32px' }}>
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} height={110} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '32px' }}>
          {[
            { label: `Avg Temp (latest ${view === 'Weekly' ? 'week' : 'month'})`, value: topRow.avgTempF ? `${topRow.avgTempF}°F` : '—', change: topRow.tempChangePct, sub: 'vs prev period' },
            { label: 'Max / Min Temp',  value: topRow.maxTempF ? `${topRow.maxTempF}° / ${topRow.minTempF}°` : '—', change: null, sub: 'this period' },
            { label: 'Avg Precipitation', value: topRow.avgRain != null ? `${topRow.avgRain} in` : '—', change: topRow.rainChangePct, sub: 'vs prev period' },
            { label: 'Avg Wind Speed',  value: topRow.avgWindSpeed != null ? `${topRow.avgWindSpeed} mph` : '—', change: null, sub: 'this period' },
          ].map(card => (
            <div key={card.label} className="glass" style={{ padding: '16px 18px' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>{card.label}</p>
              <p style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{card.value}</p>
              <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {card.change != null && <ChangePill value={card.change} />}
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{card.sub}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>View by:</span>
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.25)', padding: '3px', borderRadius: '8px' }}>
            {VIEWS.map(v => (
              <button key={v} onClick={() => setView(v)} style={{ padding: '5px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, background: view === v ? 'rgba(255,255,255,0.15)' : 'transparent', color: view === v ? 'var(--text-primary)' : 'var(--text-muted)', border: view === v ? '1px solid var(--card-border)' : '1px solid transparent', cursor: 'pointer', transition: 'all 150ms ease' }}>
                {v}
              </button>
            ))}
          </div>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: "'Fira Code', monospace" }}>{data.length} records</span>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <SkeletonTable rows={6} />
      ) : (
        <div className="glass" style={{ overflow: 'hidden', borderRadius: '14px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <TH>{view === 'Weekly' ? 'Week' : 'Month'}</TH>
                  <TH>Avg Temp</TH>
                  <TH>Max / Min</TH>
                  <TH>Temp Δ</TH>
                  <TH>Avg Rain</TH>
                  <TH>Rain Δ</TH>
                  <TH>Avg Wind</TH>
                  <TH>Condition</TH>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    style={{ transition: 'background 120ms ease', cursor: 'default' }}
                  >
                    <TD><span style={{ fontWeight: 600 }}>{row.week || row.month}</span></TD>
                    <TD mono>{row.avgTempF}°F</TD>
                    <TD mono>
                      <span style={{ color: '#ffa0a0' }}>{row.maxTempF}°</span>
                      <span style={{ color: 'var(--text-muted)' }}> / </span>
                      <span style={{ color: 'var(--line-humidity)' }}>{row.minTempF}°</span>
                    </TD>
                    <TD><ChangePill value={row.tempChangePct} /></TD>
                    <TD mono>{row.avgRain != null ? `${row.avgRain} in` : '—'}</TD>
                    <TD><ChangePill value={row.rainChangePct} /></TD>
                    <TD mono>{row.avgWindSpeed != null ? `${row.avgWindSpeed} mph` : '—'}</TD>
                    <TD><ConditionDot condition={row.condition} /></TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px', fontFamily: "'Fira Code', monospace" }}>
        Δ = % change vs previous {view === 'Weekly' ? 'week' : 'month'} · Source: NOAA JFK Airport
      </p>
    </div>
  );
}
