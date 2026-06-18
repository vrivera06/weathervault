import { useState, useEffect } from 'react';
import { Leaf, RotateCcw } from 'lucide-react';
import SectionBadge from '../components/SectionBadge';

const TASKS = [
  { id: 1,  label: 'Walk or bike instead of driving',      co2: 2.6,  icon: '🚶',  tip: 'Saves ~2.6 lbs CO₂ per mile avoided' },
  { id: 2,  label: 'Use a reusable water bottle',          co2: 0.3,  icon: '🍶',  tip: 'Eliminates single-use plastic waste' },
  { id: 3,  label: 'Skip meat for one meal',               co2: 3.5,  icon: '🥗',  tip: 'Beef produces 27x more CO₂ than vegetables' },
  { id: 4,  label: 'Turn off lights when leaving a room',  co2: 0.5,  icon: '💡',  tip: 'LED bulbs + smart habits cut energy 10-15%' },
  { id: 5,  label: 'Take a shower under 5 minutes',        co2: 0.8,  icon: '🚿',  tip: 'Hot water heating = 18% of home energy use' },
  { id: 6,  label: 'Bring reusable bags shopping',         co2: 0.2,  icon: '🛍️',  tip: 'Plastic bags take 1,000 years to decompose' },
  { id: 7,  label: 'Unplug devices not in use',            co2: 0.4,  icon: '🔌',  tip: 'Idle electronics use up to 10% of home energy' },
  { id: 8,  label: 'Eat locally sourced food',             co2: 1.2,  icon: '🥦',  tip: 'Food transport accounts for 6% of food emissions' },
  { id: 9,  label: 'Air dry clothes instead of dryer',     co2: 1.8,  icon: '👕',  tip: 'Dryers are one of the most energy-hungry appliances' },
  { id: 10, label: 'Use public transportation today',       co2: 4.2,  icon: '🚌',  tip: 'One bus replaces ~40 car trips' },
];

const PET_STATES = [
  { min: 0,  max: 2,  emoji: '🥀', mood: 'Struggling',  color: '#ff6b6b', msg: 'Your planet needs help. Complete some tasks!' },
  { min: 3,  max: 4,  emoji: '🌱', mood: 'Sprouting',   color: '#ffd166', msg: "You're making a start — keep going!" },
  { min: 5,  max: 6,  emoji: '🌿', mood: 'Growing',     color: '#74c0fc', msg: "Nice work! Your planet is getting healthier." },
  { min: 7,  max: 8,  emoji: '🌳', mood: 'Thriving',    color: 'var(--accent)', msg: "Amazing! You're making a real difference." },
  { min: 9,  max: 10, emoji: '🌍', mood: 'Flourishing', color: '#00c896', msg: "Perfect score! You're an eco champion! 🎉" },
];

function getPetState(count) {
  return PET_STATES.find(s => count >= s.min && count <= s.max) || PET_STATES[0];
}

const STORAGE_KEY = 'ecogame_tasks';

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function EcoGame() {
  const [checked, setChecked] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (saved.date === getTodayKey()) return new Set(saved.tasks || []);
    } catch {}
    return new Set();
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: getTodayKey(), tasks: [...checked] }));
  }, [checked]);

  function toggle(id) {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function reset() { setChecked(new Set()); }

  const count     = checked.size;
  const pet       = getPetState(count);
  const totalCO2  = TASKS.filter(t => checked.has(t.id)).reduce((s, t) => s + t.co2, 0);
  const pct       = Math.round((count / TASKS.length) * 100);

  return (
    <div style={{ padding: '36px 40px', maxWidth: '1100px' }} className="page-enter">
      <SectionBadge number={6} />
      <h1 style={{ fontSize: '42px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '8px' }}>
        Eco Pet
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '32px' }}>
        Complete daily eco tasks to keep your planet healthy · resets every day
      </p>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>

        {/* Pet panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '260px', flex: '0 0 280px' }}>

          {/* Pet card */}
          <div className="glass" style={{ padding: '32px 24px', textAlign: 'center', borderColor: pet.color, background: `rgba(0,0,0,0.3)`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '200px', height: '200px', borderRadius: '50%', background: `radial-gradient(circle, ${pet.color}18 0%, transparent 70%)`, pointerEvents: 'none' }} />
            <div style={{ fontSize: '80px', lineHeight: 1, marginBottom: '12px', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))', animation: 'float 3s ease-in-out infinite' }}>
              {pet.emoji}
            </div>
            <p style={{ fontSize: '18px', fontWeight: 800, color: pet.color, marginBottom: '4px' }}>{pet.mood}</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>{pet.msg}</p>

            {/* Health bar */}
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '100px', height: '8px', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${pet.color}, ${pet.color}cc)`, borderRadius: '100px', transition: 'width 400ms cubic-bezier(0.34,1.56,0.64,1)' }} />
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: "'Fira Code', monospace" }}>{count}/{TASKS.length} tasks · {pct}%</p>
          </div>

          {/* CO2 saved */}
          <div className="glass" style={{ padding: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>CO₂ Saved Today</p>
            <p style={{ fontSize: '36px', fontWeight: 900, color: 'var(--accent)', letterSpacing: '-0.03em', lineHeight: 1 }}>
              {totalCO2.toFixed(1)}
              <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '4px' }}>lbs</span>
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>equivalent to {(totalCO2 / 0.404).toFixed(1)} miles not driven</p>
          </div>

          {/* Reset */}
          <button onClick={reset} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--card-border)', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer', transition: 'all 150ms ease' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
          >
            <RotateCcw size={13} /> Reset today's tasks
          </button>
        </div>

        {/* Task checklist */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Today's Eco Checklist</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {TASKS.map(task => {
              const done = checked.has(task.id);
              return (
                <div
                  key={task.id}
                  onClick={() => toggle(task.id)}
                  className="glass"
                  style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', transition: 'all 150ms ease', borderColor: done ? 'rgba(0,200,150,0.4)' : 'var(--card-border)', background: done ? 'rgba(0,200,150,0.06)' : 'rgba(255,255,255,0.02)', userSelect: 'none' }}
                  onMouseEnter={e => { if (!done) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={e => { if (!done) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                >
                  {/* Checkbox */}
                  <div style={{ width: 22, height: 22, borderRadius: '6px', border: `2px solid ${done ? 'var(--accent)' : 'var(--card-border)'}`, background: done ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 150ms ease' }}>
                    {done && <span style={{ fontSize: '12px', color: '#0a1832', fontWeight: 900 }}>✓</span>}
                  </div>

                  {/* Icon */}
                  <span style={{ fontSize: '22px', flexShrink: 0 }}>{task.icon}</span>

                  {/* Label + tip */}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '13px', fontWeight: done ? 600 : 400, color: done ? 'var(--text-primary)' : 'var(--text-secondary)', textDecoration: done ? 'none' : 'none', marginBottom: '2px', transition: 'all 150ms ease' }}>
                      {task.label}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>{task.tip}</p>
                  </div>

                  {/* CO2 badge */}
                  <span style={{ fontSize: '11px', fontFamily: "'Fira Code', monospace", color: done ? 'var(--accent)' : 'var(--text-muted)', background: done ? 'rgba(0,200,150,0.12)' : 'rgba(255,255,255,0.06)', border: `1px solid ${done ? 'rgba(0,200,150,0.3)' : 'var(--card-border)'}`, borderRadius: '6px', padding: '3px 8px', flexShrink: 0, transition: 'all 150ms ease' }}>
                    -{task.co2} lbs
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
