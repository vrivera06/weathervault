import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorState({ message = 'Failed to load data', onRetry }) {
  return (
    <div
      style={{
        background: 'var(--chart-bg)',
        border: '1px solid rgba(255, 107, 107, 0.25)',
        borderRadius: '12px',
        padding: '32px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        textAlign: 'center',
      }}
    >
      <AlertTriangle size={28} style={{ color: '#ff6b6b' }} />
      <p style={{ fontSize: '14px', color: 'var(--cream)', fontWeight: 600 }}>Something went wrong</p>
      <p style={{ fontSize: '13px', color: 'var(--cream-muted)', maxWidth: 320 }}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 18px',
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: '8px',
            color: 'var(--cream)',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 150ms ease',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--card-border)'}
        >
          <RefreshCw size={13} />
          Retry
        </button>
      )}
    </div>
  );
}
