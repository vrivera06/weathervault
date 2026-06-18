import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import SectionBadge from '../components/SectionBadge';
import { SkeletonChart } from '../components/Skeleton';
import ErrorState from '../components/ErrorState';
import { fetchCorrelative } from '../api/weatherApi';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(10,24,60,0.92)', backdropFilter: 'blur(12px)', border: '1px solid var(--card-border)', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: 'var(--text-primary)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: '6px', fontFamily: "'Fira Code', monospace" }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {p.value != null ? p.value : '—'}{p.dataKey.includes('temp') ? '°F' : ' in'}
        </p>
      ))}
    </div>
  );
}

function DeltaBadge({ data, key2026, key2025, label }) {
  const valid = data.filter(d => d[key2026] != null && d[key2025] != null);
  if (!valid.length) return <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: "'Fira Code', monospace" }}>no comparison data</span>;
  const avg26 = valid.reduce((s, d) => s + d[key2026], 0) / valid.length;
  const avg25 = valid.reduce((s, d) => s + d[key2025], 0) / valid.length;
  const delta = avg25 !== 0 ? ((avg26 - avg25) / Math.abs(avg25) * 100).toFixed(1) : '—';
  const pos = parseFloat(delta) > 0;
  return (
    <span style={{ fontSize: '12px', fontFamily: "'Fira Code', monospace", fontWeight: 600, color: pos ? '#ffa0a0' : 'var(--accent)', background: pos ? 'rgba(255,107,107,0.1)' : 'rgba(0,200,150,0.1)', border: `1px solid ${pos ? 'rgba(255,107,107,0.25)' : 'rgba(0,200,150,0.25)'}`, borderRadius: '4px', padding: '2px 10px' }}>
      {pos ? '+' : ''}{delta}% vs 2025
    </span>
  );
}

const tickStyle = { fill: 'rgba(255,255,255,0.45)', fontSize: 11, fontFamily: "'Fira Code', monospace" };

function CorrelationChart({ title, key2026, key2025, unit, data }) {
  return (
    <div className="glass" style={{ padding: '20px', flex: 1, minWidth: '300px', background: 'var(--chart-bg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>{title}</p>
        <DeltaBadge data={data} key2026={key2026} key2025={key2025} />
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="date" tick={tickStyle} tickLine={false} axisLine={false} tickFormatter={d => String(d).slice(5)} interval={2} />
          <YAxis tick={tickStyle} tickLine={false} axisLine={false} unit={unit} domain={['auto', 'auto']} width={50} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--text-muted)', paddingTop: '8px' }} />
          <Line type="monotone" dataKey={key2026} name="2026" stroke="var(--line-temp)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: 'var(--line-temp)', stroke: 'white', strokeWidth: 2 }} />
          <Line type="monotone" dataKey={key2025} name="2025" stroke="var(--line-prev-year)" strokeWidth={1.5} strokeDasharray="5 3" dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function avg(arr) {
  const valid = arr.filter(v => v != null);
  return valid.length ? (valid.reduce((a, b) => a + b, 0) / valid.length) : null;
}

function StatRow({ label, val26, val25, unit }) {
  if (val26 == null || val25 == null) return null;
  const diff = val26 - val25;
  const pos  = diff > 0;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '13px' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ color: 'var(--line-temp)', fontFamily: "'Fira Code', monospace", fontWeight: 600 }}>{val26.toFixed(1)}{unit}</span>
      <span style={{ color: 'var(--line-prev-year)', fontFamily: "'Fira Code', monospace" }}>{val25.toFixed(1)}{unit}</span>
      <span style={{ fontFamily: "'Fira Code', monospace", fontSize: '12px', fontWeight: 600, color: pos ? '#ffa0a0' : 'var(--accent)' }}>
        {pos ? '+' : ''}{diff.toFixed(2)}{unit}
      </span>
    </div>
  );
}

export default function CorrelativeGraphs() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  async function load() {
    setLoading(true); setError(null);
    try { setData(await fetchCorrelative()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({
    avgTemp26:  avg(data.map(d => d.temp2026)),
    avgTemp25:  avg(data.map(d => d.temp2025)),
    maxTemp26:  data.length ? Math.max(...data.map(d => d.temp2026).filter(v => v != null)) : null,
    maxTemp25:  data.length ? Math.max(...data.map(d => d.temp2025).filter(v => v != null)) : null,
    minTemp26:  data.length ? Math.min(...data.map(d => d.temp2026).filter(v => v != null)) : null,
    minTemp25:  data.length ? Math.min(...data.map(d => d.temp2025).filter(v => v != null)) : null,
    avgRain26:  avg(data.map(d => d.rain2026)),
    avgRain25:  avg(data.map(d => d.rain2025)),
  }), [data]);

  return (
    <div style={{ padding: '36px 40px', maxWidth: '1300px' }} className="page-enter">
      <SectionBadge number={4} />
      <h1 style={{ fontSize: '42px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '8px' }}>
        Correlative Graphs
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>
        Same date window — 2026 vs 2025 — JFK International Airport, NY
      </p>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: 28, height: 3, background: 'var(--line-temp)', borderRadius: 2 }} />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>2026 (current year)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: 28, height: 2, background: 'var(--line-prev-year)', borderRadius: 2, backgroundImage: 'repeating-linear-gradient(to right, rgba(255,255,255,0.35) 0, rgba(255,255,255,0.35) 5px, transparent 5px, transparent 8px)' }} />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>2025 (same dates)</span>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '32px' }}>
          <SkeletonChart height={240} /><SkeletonChart height={240} />
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '32px', flexWrap: 'wrap' }}>
            <CorrelationChart title="Temperature comparison — 2026 vs 2025" key2026="temp2026" key2025="temp2025" unit="°" data={data} />
            <CorrelationChart title="Precipitation comparison — 2026 vs 2025" key2026="rain2026" key2025="rain2025" unit=" in" data={data} />
          </div>

          <div className="glass" style={{ overflow: 'hidden', borderRadius: '14px' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--card-border)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Metric</span>
              <span style={{ fontSize: '11px', color: 'var(--line-temp)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>2026 avg</span>
              <span style={{ fontSize: '11px', color: 'var(--line-prev-year)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>2025 avg</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Delta</span>
            </div>
            <StatRow label="Average temperature" val26={stats.avgTemp26} val25={stats.avgTemp25} unit="°F" />
            <StatRow label="Max temperature"     val26={stats.maxTemp26} val25={stats.maxTemp25} unit="°F" />
            <StatRow label="Min temperature"     val26={stats.minTemp26} val25={stats.minTemp25} unit="°F" />
            <StatRow label="Avg precipitation"   val26={stats.avgRain26} val25={stats.avgRain25} unit=" in" />
          </div>

          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px', fontFamily: "'Fira Code', monospace" }}>
            Last 30 days of 2026 vs same 30 days of 2025 · Positive Δ = warmer/wetter in 2026
          </p>
        </>
      )}
    </div>
  );
}
