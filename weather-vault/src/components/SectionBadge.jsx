export default function SectionBadge({ number }) {
  return (
    <div className="inline-flex items-center gap-2 mb-4" style={{ fontFamily: "'Fira Code', monospace" }}>
      <span
        style={{
          border: '1px solid var(--text-muted)',
          color: 'var(--text-muted)',
          fontSize: '11px',
          letterSpacing: '0.06em',
          padding: '2px 10px',
          borderRadius: '2px',
          textTransform: 'uppercase',
        }}
      >
        Section
      </span>
      <span
        style={{
          border: '1px solid var(--text-muted)',
          color: 'var(--text-muted)',
          fontSize: '11px',
          padding: '2px 10px',
          borderRadius: '2px',
        }}
      >
        {number}
      </span>
    </div>
  );
}
