// primitives.jsx — base UI primitives: Card, Button, Input, Badge, Pill, Avatar, Tab.

const TP = window.FDTokens;

function useTk(theme) { return theme === 'dark' ? TP.dark : TP.light; }

// ─── Card ──────────────────────────────────────────────────────────────────
function Card({ theme = 'light', children, padding = 16, style, elevation = 1, interactive }) {
  const tk = useTk(theme);
  const elev = theme === 'dark' ? TP.elevDark : TP.elev;
  return (
    <div
      style={{
        background: tk.surface,
        border: `1px solid ${tk.border}`,
        borderRadius: TP.radius.md,
        padding,
        boxShadow: elev[elevation],
        transition: 'box-shadow .15s, transform .15s, border-color .15s',
        cursor: interactive ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Button ────────────────────────────────────────────────────────────────
function Button({ theme = 'light', variant = 'primary', size = 'md', children, leadingIcon, trailingIcon, style, disabled }) {
  const tk = useTk(theme);
  const sizing = {
    sm: { h: 28, px: 10, fs: 12, gap: 6 },
    md: { h: 32, px: 12, fs: 13, gap: 6 },
    lg: { h: 38, px: 16, fs: 14, gap: 8 },
  }[size];
  const variants = {
    primary: { bg: tk.accent, fg: tk.inkOnAccent, bd: tk.accent },
    secondary: { bg: tk.surface, fg: tk.ink, bd: tk.borderStrong },
    ghost: { bg: 'transparent', fg: tk.ink, bd: 'transparent' },
    soft: { bg: tk.accentSoft, fg: tk.accentInk, bd: 'transparent' },
    danger: { bg: tk.surface, fg: tk.loss, bd: tk.borderStrong },
  }[variant];
  return (
    <button
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: sizing.gap,
        height: sizing.h,
        padding: `0 ${sizing.px}px`,
        fontSize: sizing.fs,
        fontWeight: 500,
        fontFamily: TP.type.sans,
        background: variants.bg,
        color: variants.fg,
        border: `1px solid ${variants.bd}`,
        borderRadius: TP.radius.md,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        letterSpacing: '-0.005em',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  );
}

// ─── Input / Field ─────────────────────────────────────────────────────────
function Input({ theme = 'light', label, value, placeholder, hint, prefix, suffix, mono, disabled, error }) {
  const tk = useTk(theme);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <div style={{ fontSize: 11, fontWeight: 600, color: tk.inkMuted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {label}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          height: 36,
          background: disabled ? tk.surfaceAlt : tk.surface,
          border: `1px solid ${error ? tk.loss : tk.border}`,
          borderRadius: TP.radius.md,
          padding: '0 10px',
          gap: 8,
        }}
      >
        {prefix && <span style={{ color: tk.inkSubtle, fontFamily: mono ? TP.type.mono : TP.type.sans, fontSize: 13 }}>{prefix}</span>}
        <span style={{ flex: 1, color: value ? tk.ink : tk.inkSubtle, fontFamily: mono ? TP.type.mono : TP.type.sans, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
          {value || placeholder}
        </span>
        {suffix && <span style={{ color: tk.inkMuted, fontFamily: TP.type.mono, fontSize: 11 }}>{suffix}</span>}
      </div>
      {hint && (
        <div style={{ fontSize: 11, color: error ? tk.loss : tk.inkSubtle }}>{hint}</div>
      )}
    </div>
  );
}

// ─── Badge ─────────────────────────────────────────────────────────────────
function Badge({ theme = 'light', tone = 'neutral', children, dot }) {
  const tk = useTk(theme);
  const tones = {
    neutral: { bg: tk.surfaceAlt, fg: tk.inkMuted, dot: tk.inkSubtle },
    accent:  { bg: tk.accentSoft, fg: tk.accentInk, dot: tk.accent },
    gain:    { bg: tk.gainSoft, fg: tk.gain, dot: tk.gain },
    loss:    { bg: tk.lossSoft, fg: tk.loss, dot: tk.loss },
    warn:    { bg: tk.warnSoft, fg: tk.warn, dot: tk.warn },
    info:    { bg: tk.infoSoft, fg: tk.info, dot: tk.info },
    pending: { bg: tk.pendingSoft, fg: tk.pending, dot: tk.pending },
  }[tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        height: 20,
        padding: '0 8px',
        background: tones.bg,
        color: tones.fg,
        borderRadius: TP.radius.sm,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.02em',
        fontFamily: TP.type.sans,
        whiteSpace: 'nowrap',
      }}
    >
      {dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: tones.dot }} />}
      {children}
    </span>
  );
}

// ─── Delta · gain/loss number ──────────────────────────────────────────────
function Delta({ theme = 'light', value, decimals = 1, currency, mono = true, size = 13 }) {
  const tk = useTk(theme);
  const positive = value > 0;
  const negative = value < 0;
  const color = positive ? tk.gain : negative ? tk.loss : tk.inkMuted;
  const arrow = positive ? '▲' : negative ? '▼' : '–';
  const formatted = currency
    ? TP.formatINR(value, { decimals, compact: Math.abs(value) >= 100000 })
    : (value >= 0 ? '+' : '') + value.toFixed(decimals) + '%';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'baseline', gap: 4,
      color, fontFamily: mono ? TP.type.mono : TP.type.sans, fontSize: size,
      fontVariantNumeric: 'tabular-nums', fontWeight: 500,
    }}>
      <span style={{ fontSize: size * 0.75 }}>{arrow}</span>
      {formatted}
    </span>
  );
}

// ─── Sparkline · pure SVG ──────────────────────────────────────────────────
function Sparkline({ theme = 'light', data, width = 120, height = 32, color, fill = true, strokeWidth = 1.5 }) {
  const tk = useTk(theme);
  const c = color || tk.accent;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const pts = data.map((v, i) => `${(i * stepX).toFixed(2)},${(height - ((v - min) / range) * (height - 4) - 2).toFixed(2)}`);
  const linePath = 'M' + pts.join(' L');
  const fillPath = linePath + ` L${width},${height} L0,${height} Z`;
  const fillId = `sf-${Math.random().toString(36).slice(2,8)}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={fillId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="0.22" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={fillPath} fill={`url(#${fillId})`} />}
      <path d={linePath} fill="none" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Progress bar ──────────────────────────────────────────────────────────
function Progress({ theme = 'light', value, max = 100, tone = 'accent', height = 6, label, valueLabel }) {
  const tk = useTk(theme);
  const tones = {
    accent: tk.accent, gain: tk.gain, loss: tk.loss, warn: tk.warn, info: tk.info,
  };
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {(label || valueLabel) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: tk.inkMuted }}>
          <span>{label}</span>
          <span style={{ fontFamily: TP.type.mono, color: tk.ink }}>{valueLabel}</span>
        </div>
      )}
      <div style={{ height, background: tk.surfaceAlt, borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: tones[tone], borderRadius: 999, transition: 'width .3s' }} />
      </div>
    </div>
  );
}

// ─── Tabs (visual only) ────────────────────────────────────────────────────
function Tabs({ theme = 'light', items, active }) {
  const tk = useTk(theme);
  return (
    <div style={{ display: 'flex', gap: 2, borderBottom: `1px solid ${tk.border}` }}>
      {items.map((it) => {
        const isActive = it === active;
        return (
          <div
            key={it}
            style={{
              padding: '8px 12px',
              fontSize: 13,
              fontWeight: isActive ? 600 : 500,
              color: isActive ? tk.ink : tk.inkMuted,
              borderBottom: `2px solid ${isActive ? tk.accent : 'transparent'}`,
              marginBottom: -1,
              cursor: 'pointer',
            }}
          >
            {it}
          </div>
        );
      })}
    </div>
  );
}

// ─── Avatar / institution mark ─────────────────────────────────────────────
function InstitutionMark({ theme = 'light', name, size = 28 }) {
  const tk = useTk(theme);
  // hash name -> hue from chart series
  const palette = [tk.s1, tk.s2, tk.s3, tk.s4, tk.s5];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const c = palette[h % palette.length];
  const initials = name.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: TP.radius.sm,
      background: c, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: TP.type.sans, fontSize: size * 0.4, fontWeight: 600,
      letterSpacing: '-0.01em',
    }}>
      {initials}
    </div>
  );
}

// ─── tiny stroked icons ────────────────────────────────────────────────────
const Icon = {
  arrowRight: (s = 14, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
  ),
  plus: (s = 14, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><path d="M8 3v10M3 8h10"/></svg>
  ),
  upload: (s = 14, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 11V3M5 6l3-3 3 3M3 13h10"/></svg>
  ),
  download: (s = 14, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v8M5 8l3 3 3-3M3 13h10"/></svg>
  ),
  doc: (s = 14, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 2h6L13 5.5V14H3.5zM9 2v4h4"/></svg>
  ),
  search: (s = 14, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="7" r="4.5"/><path d="m13 13-2.5-2.5"/></svg>
  ),
  filter: (s = 14, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4h10M5 8h6M7 12h2"/></svg>
  ),
  lock: (s = 14, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="7" width="9" height="6" rx="1"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/></svg>
  ),
  check: (s = 14, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="m3.5 8 3 3 6-6"/></svg>
  ),
  spark: (s = 14, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4M8 10v4M2 8h4M10 8h4M4 4l2 2M10 10l2 2M4 12l2-2M10 6l2-2"/></svg>
  ),
  drive: (s = 14, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3h6l3 6-3 4H5L2 9zM5 3l3 6h6M11 3l-3 6-3-6"/></svg>
  ),
};

Object.assign(window, { Card, Button, Input, Badge, Delta, Sparkline, Progress, Tabs, InstitutionMark, Icon });
