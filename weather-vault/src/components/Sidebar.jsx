import { LayoutDashboard, Clock, TrendingUp, GitCompare, MessageSquare, CloudSun, Leaf } from 'lucide-react';

const navItems = [
  { id: 'dashboard',   label: 'Dashboard',         icon: LayoutDashboard, section: 1 },
  { id: 'past',        label: 'Past Models',        icon: Clock,           section: 2 },
  { id: 'predictive',  label: 'Predictive Models',  icon: TrendingUp,      section: 3 },
  { id: 'correlative', label: 'Correlative Graphs', icon: GitCompare,      section: 4 },
  { id: 'chat',        label: 'Environmental Eddie', icon: MessageSquare,   section: 5 },
  { id: 'ecogame',     label: 'Eco Pet',            icon: Leaf,            section: 6 },
];

export default function Sidebar({ active, onNav }) {
  return (
    <aside
      style={{
        width: '220px',
        minWidth: '220px',
        background: 'var(--sidebar-bg)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderRight: '1px solid var(--card-border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '0 20px 28px' }}>
        <div className="flex items-center gap-2">
          <CloudSun size={20} style={{ color: 'var(--line-temp)' }} />
          <span
            style={{
              fontWeight: 800,
              fontSize: '16px',
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            WeatherVault
          </span>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', paddingLeft: '28px' }}>
          Pleasantville, NY
        </p>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNav(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 20px',
                background: isActive ? 'rgba(255,255,255,0.10)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 150ms ease',
                border: 'none',
                textAlign: 'left',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <Icon size={15} />
              <span style={{ flex: 1 }}>{item.label}</span>
              <span
                style={{
                  fontSize: '10px',
                  color: isActive ? 'var(--accent)' : 'transparent',
                  fontFamily: "'Fira Code', monospace",
                }}
              >
                §{item.section}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '20px', borderTop: '1px solid var(--card-border)' }}>
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Climate data dashboard<br />
          v1.0 — Frontend only
        </p>
      </div>
    </aside>
  );
}
