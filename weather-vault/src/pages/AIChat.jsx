import { useState, useRef, useEffect } from 'react';
import { Send, Leaf, Bot, User } from 'lucide-react';
import SectionBadge from '../components/SectionBadge';
import { sampleChatMessages } from '../data/mockData';

const SUGGESTED = [
  "How does today's weather affect carbon emissions?",
  "What's the trend in local temperatures since 2020?",
  "Are heat spikes getting more frequent in Pleasantville?",
  "How can I reduce my footprint on hot days?",
];

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div
      style={{ display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row', gap: '10px', alignItems: 'flex-end', marginBottom: '16px', animation: 'msg-in 200ms cubic-bezier(0.22,1,0.36,1) both' }}
    >
      <div style={{ width: 30, height: 30, borderRadius: '8px', background: isUser ? 'rgba(255,255,255,0.15)' : 'rgba(91,212,255,0.15)', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {isUser ? <User size={14} style={{ color: 'var(--text-primary)' }} /> : <Bot size={14} style={{ color: 'var(--line-humidity)' }} />}
      </div>
      <div style={{ maxWidth: '72%', background: isUser ? 'rgba(255,255,255,0.12)' : 'rgba(91,212,255,0.08)', border: '1px solid var(--card-border)', borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px', padding: '12px 16px', backdropFilter: 'blur(8px)' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.55 }}>{msg.text}</p>
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px', textAlign: isUser ? 'right' : 'left', fontFamily: "'Fira Code', monospace" }}>{msg.time}</p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '16px' }}>
      <div style={{ width: 30, height: 30, borderRadius: '8px', background: 'rgba(91,212,255,0.15)', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Bot size={14} style={{ color: 'var(--line-humidity)' }} />
      </div>
      <div style={{ background: 'rgba(91,212,255,0.08)', border: '1px solid var(--card-border)', borderRadius: '14px 14px 14px 4px', padding: '14px 18px', display: 'flex', gap: '5px', alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--line-humidity)', display: 'inline-block', animation: `typing-dot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>
    </div>
  );
}

export default function AIChat() {
  const [messages, setMessages] = useState(sampleChatMessages);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  async function sendMessage(text) {
    const t = (text || input).trim();
    if (!t) return;
    const now = () => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const userMsg = { id: Date.now(), role: 'user', text: t, time: now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    try {
      // Build history from current messages (exclude sample starters)
      const history = messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, text: m.text }));

      const res = await fetch(`${API_BASE}/api/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: t, history }),
      });
      const data = await res.json();
      const reply = { id: Date.now() + 1, role: 'assistant', text: data.reply || 'No response received.', time: now() };
      setMessages(prev => [...prev, reply]);
    } catch {
      const reply = { id: Date.now() + 1, role: 'assistant', text: 'Unable to reach the AI backend. Make sure the Django server is running on port 8001.', time: now() };
      setMessages(prev => [...prev, reply]);
    } finally {
      setTyping(false);
    }
  }

  return (
    <div style={{ padding: '36px 40px', maxWidth: '860px', height: '100%', display: 'flex', flexDirection: 'column' }} className="page-enter">
      <SectionBadge number={5} />
      <h1 style={{ fontSize: '42px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '24px' }}>
        AI Chat
      </h1>

      <div className="glass" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '500px', overflow: 'hidden', background: 'rgba(10,24,46,0.55)' }}>
        {/* Chat header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(91,212,255,0.05)' }}>
          <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(0,200,150,0.12)', border: '1px solid rgba(0,200,150,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Leaf size={18} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Environmental Eddie</p>
            <p style={{ fontSize: '11px', color: 'var(--accent)', fontFamily: "'Fira Code', monospace" }}>Powered by Gemini · NOAA data</p>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--accent)', background: 'rgba(0,200,150,0.08)', border: '1px solid rgba(0,200,150,0.3)', borderRadius: '12px', padding: '3px 10px' }}>
            ● Online
          </span>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
          {typing && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Suggested prompts */}
        <div style={{ padding: '0 16px 10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {SUGGESTED.map(s => (
            <button key={s} onClick={() => sendMessage(s)}
              style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--card-border)', borderRadius: '20px', padding: '4px 12px', cursor: 'pointer', transition: 'all 150ms ease', whiteSpace: 'nowrap' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--line-humidity)'; e.currentTarget.style.borderColor = 'rgba(91,212,255,0.35)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--card-border)'; }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input bar */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--card-border)', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div className="glass" style={{ flex: 1, padding: '10px 14px', display: 'flex', alignItems: 'center', borderRadius: '10px' }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && input.trim()) { e.preventDefault(); sendMessage(); } }}
              placeholder="Ask about climate, carbon footprint, weather trends..."
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '13px' }}
            />
          </div>
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim()}
            style={{ width: 40, height: 40, borderRadius: '10px', background: input.trim() ? 'var(--accent)' : 'rgba(255,255,255,0.08)', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'default', transition: 'all 150ms ease', flexShrink: 0 }}
          >
            <Send size={16} style={{ color: input.trim() ? '#0a1832' : 'var(--text-muted)' }} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes msg-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
