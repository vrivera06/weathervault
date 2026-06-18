/**
 * Skeleton loading primitives.
 * All take a className prop for size overrides.
 */

const pulseStyle = {
  background: 'linear-gradient(90deg, var(--skeleton-base) 25%, var(--skeleton-shimmer) 50%, var(--skeleton-base) 75%)',
  backgroundSize: '200% 100%',
  animation: 'skeleton-shimmer 1.5s infinite',
  borderRadius: '6px',
};

export function SkeletonBlock({ width = '100%', height = 16, radius = 6, style = {} }) {
  return (
    <div
      style={{
        ...pulseStyle,
        width,
        height,
        borderRadius: radius,
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

export function SkeletonText({ lines = 3, gap = 8 }) {
  const widths = ['100%', '85%', '70%', '90%', '60%'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock key={i} width={widths[i % widths.length]} height={14} />
      ))}
    </div>
  );
}

export function SkeletonCard({ height = 120 }) {
  return (
    <div
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: '12px',
        padding: '20px',
        height,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <SkeletonBlock width="40%" height={11} />
      <SkeletonBlock width="60%" height={32} />
      <SkeletonBlock width="30%" height={11} />
    </div>
  );
}

export function SkeletonChart({ height = 220 }) {
  return (
    <div
      style={{
        background: 'var(--chart-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: '12px',
        padding: '20px',
        flex: 1,
      }}
    >
      <SkeletonBlock width="45%" height={12} style={{ marginBottom: 16 }} />
      {/* Fake chart bars */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height }}>
        {Array.from({ length: 20 }).map((_, i) => {
          const h = 40 + Math.sin(i * 0.8) * 30 + (i % 3) * 15;
          return <SkeletonBlock key={i} style={{ flex: 1, height: `${h}%` }} />;
        })}
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 6 }) {
  return (
    <div
      style={{
        background: 'var(--chart-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 12,
          padding: '12px 16px',
          borderBottom: '1px solid var(--card-border)',
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBlock key={i} height={11} width="70%" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: 12,
            padding: '14px 16px',
            borderBottom: r < rows - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
          }}
        >
          {Array.from({ length: 6 }).map((_, c) => (
            <SkeletonBlock key={c} height={13} width={c === 0 ? '90%' : '55%'} />
          ))}
        </div>
      ))}
    </div>
  );
}
