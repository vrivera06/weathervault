import { useEffect, useState } from 'react';
import { MapPin, Wifi, WifiOff } from 'lucide-react';

export default function Header({ city = 'Pleasantville, NY' }) {
  const [time, setTime] = useState(new Date());
  const apiConnected = !!import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const dateStr = time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <header
      style={{
        height: '52px',
        background: 'var(--header-bg)',
        borderBottom: '1px solid var(--card-border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: '16px',
        flexShrink: 0,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* City */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <MapPin size={13} style={{ color: 'var(--accent)' }} />
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{city}</span>
      </div>

      <div style={{ flex: 1 }} />

      {/* Date */}
      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{dateStr}</span>

      {/* Clock */}
      <span
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          fontFamily: "'Fira Code', monospace",
          minWidth: '88px',
          textAlign: 'right',
        }}
      >
        {timeStr}
      </span>

      {/* API status pill */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '3px 10px',
          borderRadius: '20px',
          background: apiConnected ? 'rgba(0,200,150,0.12)' : 'rgba(255,255,255,0.08)',
          border: `1px solid ${apiConnected ? 'rgba(0,200,150,0.3)' : 'rgba(255,255,255,0.12)'}`,
        }}
      >
        {apiConnected
          ? <Wifi size={11} style={{ color: '#00c896' }} />
          : <WifiOff size={11} style={{ color: 'var(--text-muted)' }} />
        }
        <span style={{ fontSize: '10px', color: apiConnected ? '#00c896' : 'var(--text-muted)', fontFamily: "'Fira Code', monospace" }}>
          {apiConnected ? 'API' : 'mock'}
        </span>
      </div>
    </header>
  );
}
