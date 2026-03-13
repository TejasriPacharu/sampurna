// src/components/ui.js
// ─────────────────────────────────────────────────────────────────
// LIGHT THEME — clean, editorial, premium food-tech SaaS
// Palette  : warm white base · stone greys · vivid role accents
// Fonts    : DM Sans (body) + Sora (display) — unchanged imports
// ─────────────────────────────────────────────────────────────────

import { useState } from 'react';

// ── Design tokens ──────────────────────────────────────────────
export const T = {
  // Backgrounds
  bg:       '#F7F6F3',   // warm off-white page bg
  surface:  '#FFFFFF',   // card / sheet surface
  surface2: '#F2F1EE',   // input fill / secondary bg
  surface3: '#ECEAE6',   // hover / pressed state

  // Borders
  border:   '#E3E0D9',   // default card border
  border2:  '#D6D2CA',   // stronger border / divider

  // Text
  text:     '#1C1A17',   // near-black, warm
  textSub:  '#4B4842',   // secondary body text
  muted:    '#8C8880',   // placeholders, labels
  dim:      '#C5C1B9',   // disabled / very faint

  // Shadows
  shadow:   '0 1px 3px rgba(28,26,23,0.07), 0 1px 2px rgba(28,26,23,0.04)',
  shadowMd: '0 4px 14px rgba(28,26,23,0.09), 0 2px 4px rgba(28,26,23,0.05)',
  shadowLg: '0 16px 40px rgba(28,26,23,0.11), 0 4px 10px rgba(28,26,23,0.06)',

  // Typography
  font:    "'DM Sans', system-ui, sans-serif",
  display: "'Sora', sans-serif",
};

// ── Role accent palette (light-readable) ───────────────────────
// Maps legacy dark-theme hex → vivid-on-white equivalent
export const ACCENT = {
  green:  { fg:'#16A34A', bg:'#F0FDF4', border:'#BBF7D0', text:'#15803D' },  // donor
  blue:   { fg:'#2563EB', bg:'#EFF6FF', border:'#BFDBFE', text:'#1D4ED8' },  // ngo
  amber:  { fg:'#D97706', bg:'#FFFBEB', border:'#FDE68A', text:'#B45309' },  // delivery
  purple: { fg:'#7C3AED', bg:'#F5F3FF', border:'#DDD6FE', text:'#6D28D9' },  // admin/crisis
  red:    { fg:'#DC2626', bg:'#FEF2F2', border:'#FECACA', text:'#B91C1C' },  // error/expired
};

// Resolve a raw accent hex (passed from dashboards) → ACCENT entry
export function resolveAccent(hex) {
  if (!hex) return ACCENT.green;
  const h = hex.toLowerCase();
  if (h.includes('4ade80') || h.includes('22c55e')) return ACCENT.green;
  if (h.includes('60a5fa') || h.includes('3b82f6')) return ACCENT.blue;
  if (h.includes('fbbf24') || h.includes('f59e0b')) return ACCENT.amber;
  if (h.includes('a78bfa') || h.includes('8b5cf6')) return ACCENT.purple;
  if (h.includes('ef4444') || h.includes('dc2626')) return ACCENT.red;
  return ACCENT.green;
}

// Convenience — get just the foreground colour given a legacy hex
export function accentFg(hex) { return resolveAccent(hex).fg; }

// ── Shared card style ──────────────────────────────────────────
export const cardStyle = (extra = {}) => ({
  background:   T.surface,
  borderRadius: '14px',
  border:       `1px solid ${T.border}`,
  padding:      '16px',
  marginBottom: '10px',
  boxShadow:    T.shadow,
  ...extra,
});

// ── TopBar ─────────────────────────────────────────────────────
export function TopBar({ onLogout }) {
  const [hov, setHov] = useState(false);
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      paddingTop: 18, paddingBottom: 18,
      borderBottom: `1px solid ${T.border}`,
      marginBottom: 4,
    }}>
      <div style={{
        fontSize: 22, fontWeight: 800, color: ACCENT.green.fg,
        letterSpacing: '-0.5px', fontFamily: T.display,
      }}>
        sampurna
      </div>
      <button
        onClick={onLogout}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          padding: '7px 16px',
          background: hov ? T.surface3 : T.surface2,
          border: `1px solid ${T.border}`,
          borderRadius: 8, color: hov ? T.text : T.muted,
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
          fontFamily: T.font, transition: 'all 0.15s',
        }}
      >
        Sign out
      </button>
    </div>
  );
}

// ── WelcomeCard ────────────────────────────────────────────────
export function WelcomeCard({ icon, name, email, accent, tag }) {
  const ac = resolveAccent(accent);
  return (
    <div style={{
      ...cardStyle(),
      display: 'flex', alignItems: 'center', gap: 14,
      marginTop: 18, marginBottom: 22,
      borderColor: ac.border,
      background: `linear-gradient(135deg, ${ac.bg} 0%, ${T.surface} 70%)`,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: ac.bg, border: `1.5px solid ${ac.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: T.muted, fontWeight: 500, letterSpacing: '0.3px' }}>Welcome back,</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginTop: 2, fontFamily: T.display }}>{name}</div>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
      </div>
      <div style={{
        padding: '5px 12px', borderRadius: 20, flexShrink: 0,
        background: ac.bg, border: `1px solid ${ac.border}`,
        fontSize: 10, fontWeight: 700, color: ac.fg, letterSpacing: '0.4px',
      }}>
        {tag}
      </div>
    </div>
  );
}

// ── StatsRow ───────────────────────────────────────────────────
export function StatsRow({ stats, accent }) {
  const ac = resolveAccent(accent);
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
      {stats.map(s => (
        <div key={s.label} style={{
          ...cardStyle({ padding: '14px 8px', marginBottom: 0 }),
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        }}>
          <div style={{ fontSize: 18 }}>{s.icon}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: ac.fg, fontFamily: T.display }}>{s.value}</div>
          <div style={{ fontSize: 9, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.6px', textAlign: 'center' }}>
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── SectionTitle ───────────────────────────────────────────────
export function SectionTitle({ children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      margin: '24px 0 12px',
    }}>
      <div style={{ flex: 1, height: 1, background: T.border }} />
      <div style={{
        fontSize: 10, fontWeight: 700, color: T.muted,
        textTransform: 'uppercase', letterSpacing: '1.2px', whiteSpace: 'nowrap',
      }}>
        {children}
      </div>
      <div style={{ flex: 1, height: 1, background: T.border }} />
    </div>
  );
}

// ── DashboardTitle ─────────────────────────────────────────────
export function DashboardTitle({ title, subtitle, accent }) {
  const ac = resolveAccent(accent);
  return (
    <div style={{ marginBottom: 22, paddingTop: 4 }}>
      <div style={{
        fontFamily: T.display, fontSize: 24, fontWeight: 800,
        color: T.text, letterSpacing: '-0.5px',
      }}>
        {title}
      </div>
      {subtitle && (
        <div style={{
          fontSize: 13, color: T.muted, marginTop: 5,
          borderLeft: `3px solid ${ac.fg}`,
          paddingLeft: 10,
        }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

// ── ActionCard ─────────────────────────────────────────────────
export function ActionCard({ icon, label, sublabel, accent, onClick, badge, badgeColor }) {
  const ac = resolveAccent(accent);
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...cardStyle({ marginBottom: 10 }),
        display: 'flex', alignItems: 'center', gap: 14,
        cursor: 'pointer', width: '100%', textAlign: 'left',
        transition: 'all 0.18s',
        borderColor: hov ? ac.border : T.border,
        background: hov ? ac.bg : T.surface,
        boxShadow: hov ? T.shadowMd : T.shadow,
        transform: hov ? 'translateY(-1px)' : '',
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: ac.bg, border: `1px solid ${ac.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{label}</div>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{sublabel}</div>
      </div>
      {badge && (
        <div style={{
          padding: '4px 11px', borderRadius: 20,
          background: ac.bg, border: `1px solid ${ac.border}`,
          fontSize: 10, fontWeight: 700, color: ac.fg, flexShrink: 0,
        }}>
          {badge}
        </div>
      )}
      <div style={{ color: T.dim, fontSize: 16, fontWeight: 300, flexShrink: 0 }}>›</div>
    </button>
  );
}

// ── Modal (bottom sheet) ───────────────────────────────────────
export function Modal({ title, accent, onClose, children }) {
  const ac = resolveAccent(accent);
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(28,26,23,0.40)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      zIndex: 1000, backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        background: T.surface, borderRadius: '22px 22px 0 0',
        width: '100%', maxWidth: 520, maxHeight: '90vh',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        border: `1px solid ${T.border}`, borderBottom: 'none',
        boxShadow: T.shadowLg,
      }}>
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 38, height: 4, borderRadius: 2, background: T.border2 }} />
        </div>
        <div style={{
          padding: '12px 20px 16px',
          borderBottom: `1px solid ${T.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: T.text, fontFamily: T.display }}>
            {title}
          </div>
          <button
            onClick={onClose}
            style={{
              background: T.surface2, border: `1px solid ${T.border}`,
              color: T.muted, borderRadius: 8, width: 30, height: 30,
              cursor: 'pointer', fontSize: 13, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ overflowY: 'auto', padding: 20, flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

// ── TabBar ─────────────────────────────────────────────────────
export function TabBar({ tabs, active, onChange, accent }) {
  const ac = resolveAccent(accent);
  return (
    <div style={{
      display: 'flex', gap: 4, marginBottom: 24,
      background: T.surface2, borderRadius: 13, padding: 4,
      border: `1px solid ${T.border}`,
    }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            flex: 1, padding: '8px 4px', border: 'none',
            borderRadius: 10, cursor: 'pointer',
            fontSize: 11, fontWeight: 600, fontFamily: T.font,
            transition: 'all 0.15s',
            background: active === t.id ? T.surface : 'transparent',
            color: active === t.id ? ac.fg : T.muted,
            boxShadow: active === t.id ? T.shadow : 'none',
          }}
        >
          <div style={{ fontSize: 14 }}>{t.icon}</div>
          <div style={{ fontSize: 9, letterSpacing: '0.2px', marginTop: 2 }}>{t.label}</div>
        </button>
      ))}
    </div>
  );
}

// ── Form primitives ────────────────────────────────────────────
const inputBase = (focused) => ({
  width: '100%',
  background: T.surface,
  border: `1px solid ${focused ? ACCENT.blue.fg : T.border2}`,
  borderRadius: 10, padding: '11px 14px',
  color: T.text, fontSize: 14, fontFamily: T.font,
  boxSizing: 'border-box', outline: 'none',
  boxShadow: focused ? `0 0 0 3px ${ACCENT.blue.bg}` : 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
});

export function Input({ label, required, style, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <div style={{ fontSize: 12, color: T.textSub, marginBottom: 6, fontWeight: 600 }}>
          {label}{required && <span style={{ color: ACCENT.red.fg }}> *</span>}
        </div>
      )}
      <input
        {...props}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e => { setFocused(false); props.onBlur?.(e); }}
        style={{ ...inputBase(focused), ...style }}
      />
    </div>
  );
}

export function Textarea({ label, rows = 3, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <div style={{ fontSize: 12, color: T.textSub, marginBottom: 6, fontWeight: 600 }}>{label}</div>}
      <textarea
        rows={rows} {...props}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e => { setFocused(false); props.onBlur?.(e); }}
        style={{ ...inputBase(focused), resize: 'vertical' }}
      />
    </div>
  );
}

export function SelectInput({ label, children, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <div style={{ fontSize: 12, color: T.textSub, marginBottom: 6, fontWeight: 600 }}>{label}</div>}
      <select
        {...props}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e => { setFocused(false); props.onBlur?.(e); }}
        style={inputBase(focused)}
      >
        {children}
      </select>
    </div>
  );
}

export function Checkbox({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, cursor: 'pointer' }}>
      <div style={{
        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
        background: checked ? ACCENT.blue.fg : T.surface,
        border: `1.5px solid ${checked ? ACCENT.blue.fg : T.border2}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}>
        {checked && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, lineHeight: 1 }}>✓</span>}
      </div>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ display: 'none' }} />
      <span style={{ fontSize: 13, color: T.textSub }}>{label}</span>
    </label>
  );
}

// ── PrimaryButton ──────────────────────────────────────────────
export function PrimaryButton({ label, accent, onClick, disabled, outline, style: xStyle }) {
  const ac = resolveAccent(accent || '#4ADE80');
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', padding: 13, borderRadius: 12,
        fontSize: 14, fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: T.font, transition: 'all 0.15s', marginTop: 8,
        background: outline
          ? 'transparent'
          : disabled ? T.surface2 : ac.fg,
        border: `1.5px solid ${disabled ? T.border2 : ac.fg}`,
        color: disabled ? T.dim : outline ? ac.fg : '#FFFFFF',
        opacity: disabled ? 0.6 : 1,
        boxShadow: (!disabled && !outline && hov) ? `0 4px 14px ${ac.fg}35` : 'none',
        transform: (!disabled && hov) ? 'translateY(-1px)' : '',
        ...xStyle,
      }}
    >
      {label}
    </button>
  );
}

// ── ErrorBox ───────────────────────────────────────────────────
export function ErrorBox({ message }) {
  if (!message) return null;
  return (
    <div style={{
      background: ACCENT.red.bg, border: `1px solid ${ACCENT.red.border}`,
      borderRadius: 10, padding: '10px 14px',
      color: ACCENT.red.fg, fontSize: 13, marginBottom: 14,
      display: 'flex', gap: 8, alignItems: 'flex-start',
    }}>
      <span style={{ flexShrink: 0 }}>⚠️</span>
      <span>{message}</span>
    </div>
  );
}

// ── StatusPill ─────────────────────────────────────────────────
const STATUS_STYLES = {
  active:    { ...ACCENT.green,  label: 'Active'    },
  claimed:   { ...ACCENT.blue,   label: 'Claimed'   },
  picked_up: { ...ACCENT.amber,  label: 'Picked Up' },
  delivered: { ...ACCENT.purple, label: 'Delivered' },
  expired:   { ...ACCENT.red,    label: 'Expired'   },
};

export function StatusPill({ status }) {
  const s = STATUS_STYLES[status] || { fg: T.muted, bg: T.surface2, border: T.border, label: 'Unknown' };
  return (
    <span style={{
      padding: '4px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 600,
      background: s.bg, color: s.fg, border: `1px solid ${s.border}`,
      display: 'inline-flex', alignItems: 'center', gap: 5,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.fg, display: 'inline-block', flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

// ── RatingStars ────────────────────────────────────────────────
export function RatingStars({ rating, size = 14 }) {
  return (
    <span style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ color: i <= rating ? ACCENT.amber.fg : T.border2 }}>★</span>
      ))}
    </span>
  );
}

// ── StarPicker ─────────────────────────────────────────────────
export function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i} onClick={() => onChange(i)}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          style={{
            fontSize: 28, background: 'none', border: 'none', cursor: 'pointer',
            color: i <= (hovered || value) ? ACCENT.amber.fg : T.border2,
            transition: 'color 0.1s, transform 0.1s',
            transform: i <= (hovered || value) ? 'scale(1.15)' : 'scale(1)',
          }}
        >★</button>
      ))}
    </div>
  );
}

// ── RateModal ──────────────────────────────────────────────────
export function RateModal({ accent, targetName, onClose, onSubmit }) {
  const [val, setVal]         = useState(5);
  const [comment, setComment] = useState('');
  return (
    <Modal title={`Rate ${targetName}`} accent={accent} onClose={onClose}>
      <StarPicker value={val} onChange={setVal} />
      <Textarea label="Comment" value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your experience…" />
      <PrimaryButton label="Submit Rating" accent={accent} onClick={() => onSubmit(val, comment)} />
    </Modal>
  );
}

// ── getTimeLeft ────────────────────────────────────────────────
export function getTimeLeft(expiryTime) {
  const diff = (new Date(expiryTime) - new Date()) / 3_600_000;
  if (diff <= 0) return { text: 'Expired',                  color: ACCENT.red.fg   };
  if (diff < 2)  return { text: `${Math.round(diff*60)}m left`, color: ACCENT.amber.fg };
  return           { text: `${diff.toFixed(1)}h left`,      color: ACCENT.green.fg };
}

// ── PageScroll ─────────────────────────────────────────────────
export function PageScroll({ children }) {
  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, color: T.text }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Sora:wght@700;800&display=swap" rel="stylesheet" />
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 20px 80px' }}>
        {children}
      </div>
    </div>
  );
}

// ── DonorChip ──────────────────────────────────────────────────
export function DonorChip({ donorName }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: ACCENT.green.bg, border: `1px solid ${ACCENT.green.border}`,
      borderRadius: 8, padding: '7px 10px', marginBottom: 8,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: ACCENT.green.bg, border: `1px solid ${ACCENT.green.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
      }}>🌱</div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: ACCENT.green.fg }}>{donorName}</div>
        <div style={{ fontSize: 10, color: T.muted }}>Donor</div>
      </div>
    </div>
  );
}