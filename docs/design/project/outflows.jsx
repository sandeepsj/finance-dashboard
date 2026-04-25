// outflows.jsx — Outflows page (category-first).
// Two artboards: OutflowsDesktop (1320×900) + OutflowsMobile (390×800).

const TO = window.FDTokens;
function tko(theme) { return theme === 'dark' ? TO.dark : TO.light; }

// ── Categories ──────────────────────────────────────────────────────────
// Color is reused from the existing s1..s6 stream palette so we stay on-brand.
const CATEGORIES = [
  { id: 'housing',    label: 'Housing & utilities',  amount: 42800, last: 38600, count: 7,  recurring: 0.92, top: 'BESCOM · electricity', accentKey: 's1', icon: '⌂' },
  { id: 'groceries',  label: 'Groceries',            amount: 18400, last: 16800, count: 22, recurring: 0.10, top: 'BigBasket',           accentKey: 's2', icon: '◊' },
  { id: 'dining',     label: 'Food & dining',        amount: 11200, last: 9800,  count: 31, recurring: 0.04, top: 'Swiggy',              accentKey: 's3', icon: '◐' },
  { id: 'transport',  label: 'Transport & fuel',     amount: 7600,  last: 7400,  count: 14, recurring: 0.20, top: 'Indian Oil · HSR',    accentKey: 's4', icon: '→' },
  { id: 'healthcare', label: 'Healthcare',           amount: 5400,  last: 2200,  count: 4,  recurring: 0.00, top: 'Apollo Pharmacy',     accentKey: 's5', icon: '+' },
  { id: 'insurance',  label: 'Insurance premiums',   amount: 14380, last: 0,     count: 2,  recurring: 1.00, top: 'LIC Jeevan Anand',    accentKey: 's6', icon: '◇' },
  { id: 'emis',       label: 'EMIs & loans',         amount: 38400, last: 38400, count: 2,  recurring: 1.00, top: 'HDFC Home Loan',      accentKey: 's1', icon: '═' },
  { id: 'sips',       label: 'Investments · SIPs',   amount: 32000, last: 32000, count: 5,  recurring: 1.00, top: 'PPFAS Flexi Cap',     accentKey: 's2', icon: '↑' },
  { id: 'family',     label: 'Family support',       amount: 25000, last: 25000, count: 1,  recurring: 1.00, top: 'Mother · transfer',  accentKey: 's3', icon: '○' },
  { id: 'subs',       label: 'Subscriptions',        amount: 2840,  last: 2840,  count: 6,  recurring: 1.00, top: 'Apple One',          accentKey: 's4', icon: '◷' },
  { id: 'travel',     label: 'Travel',               amount: 0,     last: 18400, count: 0,  recurring: 0.00, top: '—',                   accentKey: 's5', icon: '✈' },
  { id: 'discretionary', label: 'Discretionary',     amount: 8600,  last: 11200, count: 11, recurring: 0.00, top: 'Amazon',              accentKey: 's6', icon: '◌' },
];

const TOTAL = CATEGORIES.reduce((s, c) => s + c.amount, 0);
const RECURRING_TOTAL = CATEGORIES.reduce((s, c) => s + c.amount * c.recurring, 0);
const VARIABLE_TOTAL = TOTAL - RECURRING_TOTAL;

// ── FY26 dataset (Apr-25 → Mar-26) ──────────────────────────────────────
// Per-category yearly totals, tuned to feel realistic (festivals push dining/
// discretionary in Oct/Nov; travel concentrated in May+Dec; insurance lumpier).
const FY_TOTALS = {
  housing:       42800 * 12 + 4200,    // small annual maintenance bumps
  groceries:     17500 * 12,
  dining:        9800 * 12 + 18000,    // festivals
  transport:     7400 * 12 + 6000,
  healthcare:    3200 * 12 + 22000,    // one hospital event
  insurance:     14380 * 4,            // quarterly-ish
  emis:          38400 * 12,
  sips:          32000 * 12,
  family:        25000 * 12,
  subs:          2840 * 12,
  travel:        18400 * 2 + 64000,    // 2 big trips
  discretionary: 9200 * 12 + 24000,    // festival shopping
};

const CATEGORIES_FY = CATEGORIES.map((c) => {
  const fyAmount = FY_TOTALS[c.id];
  // prior-FY synthesized (-3% to +12% per cat for visual variety)
  const seed = c.id.length;
  const priorDelta = ((seed * 7) % 15) - 3; // -3..+11
  const priorFY = Math.round(fyAmount * (100 / (100 + priorDelta)));
  return {
    ...c,
    amount: fyAmount,
    last: priorFY,
    count: c.count * 12 - (c.id === 'travel' ? 16 : 0),
    // mini 12-month spark for the card
    spark: Array.from({ length: 12 }, (_, i) => {
      const base = fyAmount / 12;
      // festival bump for dining/discretionary in months 6,7 (Oct/Nov)
      const festival = (c.id === 'dining' || c.id === 'discretionary') && (i === 6 || i === 7) ? base * 0.6 : 0;
      // travel concentrated months 1, 8
      const travelBump = c.id === 'travel' && (i === 1 || i === 8) ? base * 1.5 : 0;
      // insurance lumpy
      const insurLump = c.id === 'insurance' ? (i % 3 === 0 ? base * 2.5 : base * 0.2) : 0;
      const noise = (((i * (seed + 3)) % 11) - 5) / 100;
      return Math.max(0, base * (1 + noise) + festival + travelBump + insurLump);
    }),
  };
});

const FY_TOTAL = CATEGORIES_FY.reduce((s, c) => s + c.amount, 0);
const FY_RECURRING = CATEGORIES_FY.reduce((s, c) => s + c.amount * c.recurring, 0);
const FY_VARIABLE = FY_TOTAL - FY_RECURRING;

// monthly totals across FY (sum of all category sparks at index i)
const MONTHLY_TOTALS = Array.from({ length: 12 }, (_, i) =>
  CATEGORIES_FY.reduce((s, c) => s + (c.spark[i] || 0), 0)
);
const MONTHLY_RECURRING = Array.from({ length: 12 }, (_, i) =>
  CATEGORIES_FY.reduce((s, c) => s + (c.spark[i] || 0) * c.recurring, 0)
);
const MONTH_LABELS = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];

// ── Calendar of debits across April ─────────────────────────────────────
// each entry: { day, amount, category }
const APRIL_DEBITS = [
  { day: 1,  amount: 24500, category: 'emis' },        // Home loan EMI
  { day: 1,  amount: 13900, category: 'emis' },        // Car loan
  { day: 2,  amount: 8000,  category: 'sips' },        // SIP 1
  { day: 3,  amount: 6000,  category: 'sips' },
  { day: 5,  amount: 25000, category: 'family' },
  { day: 5,  amount: 4200,  category: 'housing' },     // Internet
  { day: 7,  amount: 2890,  category: 'housing' },     // Electricity
  { day: 8,  amount: 1499,  category: 'subs' },
  { day: 9,  amount: 5400,  category: 'groceries' },
  { day: 10, amount: 8000,  category: 'sips' },
  { day: 12, amount: 14380, category: 'insurance' },   // LIC
  { day: 13, amount: 1850,  category: 'dining' },
  { day: 14, amount: 6000,  category: 'sips' },
  { day: 15, amount: 32000, category: 'housing' },     // Rent
  { day: 16, amount: 4400,  category: 'groceries' },
  { day: 17, amount: 2400,  category: 'transport' },
  { day: 18, amount: 5400,  category: 'healthcare' },
  { day: 19, amount: 4000,  category: 'sips' },
  { day: 20, amount: 3200,  category: 'dining' },
  { day: 22, amount: 8600,  category: 'discretionary' },
  { day: 23, amount: 5200,  category: 'transport' },
  { day: 24, amount: 6800,  category: 'groceries' },
  { day: 25, amount: 1340,  category: 'subs' },
  { day: 26, amount: 4200,  category: 'dining' },
  { day: 27, amount: 2200,  category: 'groceries' },
  { day: 28, amount: 1900,  category: 'dining' },
];

// ── Treemap (squarified-ish, not perfect; good enough for design) ───────
function squarify(items, x, y, w, h) {
  // sort desc
  const sorted = [...items].sort((a, b) => b.value - a.value).filter(i => i.value > 0);
  const total = sorted.reduce((s, i) => s + i.value, 0);
  if (total === 0) return [];
  const out = [];

  // simple alternating slice-and-dice with horizontal/vertical based on aspect
  function layout(list, x, y, w, h) {
    if (list.length === 0) return;
    if (list.length === 1) {
      out.push({ ...list[0], x, y, w, h });
      return;
    }
    const tot = list.reduce((s, i) => s + i.value, 0);
    // take a chunk of items whose value approximates a "good" row
    const horizontal = w >= h;
    // greedy: take items until they cover ~ proportional area equal-ish to remaining
    let acc = 0;
    let i = 0;
    // Heuristic: first 2-3 biggest go in their own row/col, then recurse
    const target = list[0].value / tot;
    const headCount = Math.max(1, Math.min(list.length - 1, Math.round(list.length * 0.35)));
    const head = list.slice(0, headCount);
    const tail = list.slice(headCount);
    const headSum = head.reduce((s, i) => s + i.value, 0);
    const headFrac = headSum / tot;

    if (horizontal) {
      const headW = w * headFrac;
      // stack head vertically in headW column
      let yy = y;
      for (const it of head) {
        const hh = h * (it.value / headSum);
        out.push({ ...it, x, y: yy, w: headW, h: hh });
        yy += hh;
      }
      layout(tail, x + headW, y, w - headW, h);
    } else {
      const headH = h * headFrac;
      let xx = x;
      for (const it of head) {
        const ww = w * (it.value / headSum);
        out.push({ ...it, x: xx, y, w: ww, h: headH });
        xx += ww;
      }
      layout(tail, x, y + headH, w, h - headH);
    }
  }

  layout(sorted, x, y, w, h);
  return out;
}

function Treemap({ theme, width, height, period = 'month' }) {
  const tk = tko(theme);
  const cats = period === 'fy' ? CATEGORIES_FY : CATEGORIES;
  const total = period === 'fy' ? FY_TOTAL : TOTAL;
  const items = cats.map(c => ({ id: c.id, label: c.label, value: c.amount, color: tk[c.accentKey], cat: c, total }));
  const rects = squarify(items, 0, 0, width, height);
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {rects.map((r) => {
        const isSmall = r.w < 80 || r.h < 50;
        const isTiny = r.w < 60 || r.h < 36;
        const pct = (r.value / r.total) * 100;
        return (
          <g key={r.id}>
            <rect x={r.x + 1} y={r.y + 1} width={r.w - 2} height={r.h - 2} fill={r.color} opacity={0.18} />
            <rect x={r.x + 1} y={r.y + 1} width={r.w - 2} height={r.h - 2} fill="none" stroke={r.color} strokeOpacity={0.5} strokeWidth={1} />
            {!isTiny && (
              <text x={r.x + 10} y={r.y + 18} fontSize={11} fontFamily={TO.type.sans} fill={tk.ink} fontWeight={600}>
                {r.label.length > 22 ? r.label.slice(0, 22) + '…' : r.label}
              </text>
            )}
            {!isSmall && (
              <text x={r.x + 10} y={r.y + 38} fontSize={14} fontFamily={TO.type.mono} fill={tk.ink} style={{ fontVariantNumeric: 'tabular-nums' }}>
                {TO.formatINR(r.value, { compact: true })}
              </text>
            )}
            {!isSmall && (
              <text x={r.x + 10} y={r.y + 54} fontSize={10} fontFamily={TO.type.mono} fill={tk.inkSubtle} style={{ fontVariantNumeric: 'tabular-nums' }}>
                {((r.value / r.total) * 100).toFixed(1)}%
              </text>
            )}
            {isTiny && r.value > 0 && (
              <text x={r.x + r.w / 2} y={r.y + r.h / 2 + 3} fontSize={9} fontFamily={TO.type.mono} fill={tk.ink} style={{ fontVariantNumeric: 'tabular-nums' }} textAnchor="middle">
                {TO.formatINR(r.value, { compact: true })}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── April debit calendar ────────────────────────────────────────────────
function DebitCalendar({ theme }) {
  const tk = tko(theme);
  // April 2026 starts on a Wednesday. 30 days.
  const startDow = 3; // 0=Sun..6=Sat
  const daysInMonth = 30;
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  // group debits by day
  const byDay = {};
  for (const d of APRIL_DEBITS) {
    (byDay[d.day] ||= []).push(d);
  }
  const dayTotal = (day) => (byDay[day] || []).reduce((s, x) => s + x.amount, 0);
  const maxDay = Math.max(...Object.values(byDay).map(arr => arr.reduce((s, x) => s + x.amount, 0)));

  return (
    <div style={{ background: tk.surface, border: `1px solid ${tk.border}`, borderRadius: TO.radius.md, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: tk.inkMuted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>April · debits by day</div>
          <div style={{ fontSize: 13, color: tk.ink, marginTop: 2 }}>When money leaves the account</div>
        </div>
        <div style={{ fontFamily: TO.type.mono, fontSize: 11, color: tk.inkSubtle }}>
          peak: {TO.formatINR(maxDay)} on day 1
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d) => (
          <div key={d} style={{ fontSize: 9, fontFamily: TO.type.mono, color: tk.inkSubtle, letterSpacing: '0.06em', textAlign: 'center' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {weeks.flat().map((day, i) => {
          if (!day) return <div key={i} style={{ aspectRatio: '1.6', background: 'transparent' }} />;
          const total = dayTotal(day);
          const intensity = total > 0 ? Math.min(1, total / maxDay) : 0;
          const debits = byDay[day] || [];
          return (
            <div key={i} style={{
              aspectRatio: '1.6',
              border: `1px solid ${tk.border}`,
              borderRadius: 4,
              padding: '4px 6px',
              background: total > 0 ? `color-mix(in oklch, ${tk.accent} ${Math.round(intensity * 22)}%, ${tk.surface})` : tk.surface,
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              minHeight: 56,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontFamily: TO.type.mono, color: tk.inkMuted, fontVariantNumeric: 'tabular-nums' }}>{day}</span>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[...new Set(debits.map(d => d.category))].slice(0, 3).map((cid) => {
                    const cat = CATEGORIES.find(c => c.id === cid);
                    return <span key={cid} style={{ width: 4, height: 4, borderRadius: 999, background: tk[cat.accentKey] }} />;
                  })}
                </div>
              </div>
              {total > 0 && (
                <div style={{ fontSize: 10, fontFamily: TO.type.mono, color: tk.ink, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
                  {TO.formatINR(total, { compact: true })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Sparkline mini for category card (FY) ──────────────────────────────
function MiniSpark({ data, color, theme, width = 110, height = 22 }) {
  const tk = tko(theme);
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const dx = width / (data.length - 1);
  const pts = data.map((v, i) => {
    const x = i * dx;
    const y = height - ((v - min) / span) * (height - 2) - 1;
    return [x, y];
  });
  const path = pts.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(' ');
  const area = `${path} L ${width} ${height} L 0 ${height} Z`;
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <path d={area} fill={color} opacity={0.15} />
      <path d={path} fill="none" stroke={color} strokeWidth={1.25} />
      {pts.map((p, i) => i === pts.length - 1 ? <circle key={i} cx={p[0]} cy={p[1]} r={1.6} fill={color} /> : null)}
    </svg>
  );
}

// ── Category card ──────────────────────────────────────────────────────
function CategoryCard({ theme, c, total, period = 'month' }) {
  const tk = tko(theme);
  const isFY = period === 'fy';
  const pct = (c.amount / total) * 100;
  const deltaPct = c.last > 0 ? ((c.amount - c.last) / c.last) * 100 : (c.amount > 0 ? 100 : 0);
  const recurringPct = Math.round(c.recurring * 100);
  const compareLabel = isFY ? 'vs FY25' : 'vs March';
  const txnLabel = isFY ? `${c.count} txn · year` : `${c.count} txn`;

  return (
    <div style={{
      background: tk.surface, border: `1px solid ${tk.border}`, borderRadius: TO.radius.md,
      padding: 14, display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: tk[c.accentKey] }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 22, height: 22, borderRadius: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: `color-mix(in oklch, ${tk[c.accentKey]} 18%, ${tk.surface})`,
            color: tk[c.accentKey], fontFamily: TO.type.mono, fontSize: 12, fontWeight: 600,
          }}>{c.icon}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: tk.ink }}>{c.label}</span>
        </div>
        {recurringPct === 100 && <Badge theme={theme} tone="info">AUTO</Badge>}
        {recurringPct === 0 && c.amount > 0 && <Badge theme={theme} tone="neutral">VAR</Badge>}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontFamily: TO.type.mono, fontSize: 22, fontWeight: 500, color: tk.ink, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em', lineHeight: 1 }}>
          {TO.formatINR(c.amount, isFY ? { compact: true } : {})}
        </span>
        <span style={{ fontFamily: TO.type.mono, fontSize: 11, color: tk.inkSubtle, fontVariantNumeric: 'tabular-nums' }}>
          {pct.toFixed(1)}%
        </span>
      </div>
      {isFY && c.spark ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <MiniSpark data={c.spark} color={tk[c.accentKey]} theme={theme} />
          {c.last > 0
            ? <Delta theme={theme} value={Number(deltaPct.toFixed(1))} size={11} />
            : <span style={{ fontFamily: TO.type.mono, fontSize: 11, color: tk.inkSubtle }}>new</span>
          }
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {c.last > 0
            ? <Delta theme={theme} value={Number(deltaPct.toFixed(1))} size={11} />
            : <span style={{ fontFamily: TO.type.mono, fontSize: 11, color: tk.inkSubtle }}>—</span>
          }
          <span style={{ fontSize: 11, color: tk.inkMuted }}>{compareLabel}</span>
        </div>
      )}
      <div style={{ borderTop: `1px solid ${tk.divider}`, paddingTop: 8, fontSize: 11, color: tk.inkMuted, display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 }}>{c.top}</span>
        <span style={{ fontFamily: TO.type.mono, color: tk.inkSubtle }}>{txnLabel}</span>
      </div>
    </div>
  );
}

// ── MonthlyTrend (FY view replacement for DebitCalendar) ────────────────
function MonthlyTrend({ theme }) {
  const tk = tko(theme);
  const max = Math.max(...MONTHLY_TOTALS);
  const peakIdx = MONTHLY_TOTALS.indexOf(max);
  const minIdx = MONTHLY_TOTALS.indexOf(Math.min(...MONTHLY_TOTALS));
  const avg = MONTHLY_TOTALS.reduce((s, x) => s + x, 0) / 12;

  return (
    <div style={{ background: tk.surface, border: `1px solid ${tk.border}`, borderRadius: TO.radius.md, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: tk.inkMuted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>FY26 · monthly trend</div>
          <div style={{ fontSize: 13, color: tk.ink, marginTop: 2 }}>Recurring vs variable each month</div>
        </div>
        <div style={{ fontFamily: TO.type.mono, fontSize: 11, color: tk.inkSubtle }}>
          peak: {MONTH_LABELS[peakIdx]} · {TO.formatINR(max, { compact: true })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 6, alignItems: 'flex-end', height: 160, marginBottom: 6 }}>
        {MONTHLY_TOTALS.map((total, i) => {
          const recH = (MONTHLY_RECURRING[i] / max) * 100;
          const varH = ((total - MONTHLY_RECURRING[i]) / max) * 100;
          const isPeak = i === peakIdx;
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', height: '100%', justifyContent: 'flex-end', gap: 2 }}>
              <div style={{ fontSize: 9, fontFamily: TO.type.mono, color: isPeak ? tk.ink : tk.inkSubtle, textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontWeight: isPeak ? 600 : 400 }}>
                {TO.formatINR(total, { compact: true })}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', height: `${recH + varH}%`, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: `${(varH / (recH + varH)) * 100}%`, background: tk.s4, opacity: 0.6 }} />
                <div style={{ flex: 1, background: tk.accent }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 6 }}>
        {MONTH_LABELS.map((m, i) => (
          <div key={m} style={{ fontSize: 10, fontFamily: TO.type.mono, color: i === peakIdx ? tk.ink : tk.inkSubtle, letterSpacing: '0.04em', textAlign: 'center', fontWeight: i === peakIdx ? 600 : 400 }}>{m}</div>
        ))}
      </div>

      <div style={{ borderTop: `1px solid ${tk.divider}`, marginTop: 12, paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, color: tk.inkMuted, lineHeight: 1.5 }}>
        <div>Peak <span style={{ color: tk.ink, fontFamily: TO.type.mono }}>{MONTH_LABELS[peakIdx]}</span> ({TO.formatINR(max - avg, { compact: true })} above avg) — festival shopping + dining lifted variable spend.</div>
        <div>Lowest <span style={{ color: tk.ink, fontFamily: TO.type.mono }}>{MONTH_LABELS[minIdx]}</span> — no travel, no premiums due. Recurring floor ≈ <span style={{ fontFamily: TO.type.mono, color: tk.ink }}>{TO.formatINR(MONTHLY_RECURRING[minIdx], { compact: true })}</span>.</div>
      </div>
    </div>
  );
}

// ── PeriodSwitcher ──────────────────────────────────────────────────────
function PeriodSwitcher({ theme, value, onChange }) {
  const tk = tko(theme);
  const opts = [
    { id: 'month', label: 'Month' },
    { id: 'fy', label: 'FY' },
    { id: 'next', label: 'Next' },
  ];
  return (
    <div style={{ display: 'inline-flex', background: tk.surfaceAlt, border: `1px solid ${tk.border}`, borderRadius: 6, padding: 2, gap: 2 }}>
      {opts.map((o) => {
        const active = o.id === value;
        return (
          <button key={o.id} onClick={() => onChange(o.id)} style={{
            background: active ? tk.surface : 'transparent',
            border: active ? `1px solid ${tk.border}` : '1px solid transparent',
            boxShadow: active ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
            color: active ? tk.ink : tk.inkMuted,
            fontFamily: TO.type.sans, fontSize: 12, fontWeight: 600,
            padding: '4px 12px', borderRadius: 4, cursor: 'pointer', letterSpacing: '0.01em',
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

// ── Projection · next 3 months ──────────────────────────────────────────
// Locked groups: drawn from existing CATEGORIES.recurring=1 buckets, plus a
// few one-offs that don't fall every month (insurance premiums, family bonus
// transfers). Variable expected: weighted avg of the last 3 months' variable
// component, with low/high = ±15%.
//
// Data is laid out by upcoming month so we can render a per-month drawer
// of every scheduled debit.

const PROJ_MONTHS = [
  { id: 'may', label: 'May 2026', short: 'May' },
  { id: 'jun', label: 'Jun 2026', short: 'Jun' },
  { id: 'jul', label: 'Jul 2026', short: 'Jul' },
];

// each entry: { id, label, amount, day (1-31), category, group, kind: 'fixed'|'one-off' }
const PROJ_LOCKED = {
  may: [
    { id: 'm-rent',     label: 'Rent · BESCOM landlord', amount: 32000, day: 15, category: 'housing',   group: 'rent',      kind: 'fixed' },
    { id: 'm-elec',     label: 'BESCOM electricity',     amount: 3200,  day: 7,  category: 'housing',   group: 'rent',      kind: 'fixed' },
    { id: 'm-internet', label: 'ACT Fibernet',           amount: 1499,  day: 5,  category: 'housing',   group: 'rent',      kind: 'fixed' },
    { id: 'm-gas',      label: 'Indane gas',             amount: 1100,  day: 22, category: 'housing',   group: 'rent',      kind: 'fixed' },
    { id: 'm-emi-home', label: 'HDFC Home Loan EMI',     amount: 24500, day: 1,  category: 'emis',      group: 'emi',       kind: 'fixed' },
    { id: 'm-emi-car',  label: 'Kotak Car Loan EMI',     amount: 13900, day: 1,  category: 'emis',      group: 'emi',       kind: 'fixed' },
    { id: 'm-sip-1',    label: 'PPFAS Flexi Cap SIP',    amount: 8000,  day: 2,  category: 'sips',      group: 'sip',       kind: 'fixed' },
    { id: 'm-sip-2',    label: 'Mirae Asset Large Cap',  amount: 6000,  day: 3,  category: 'sips',      group: 'sip',       kind: 'fixed' },
    { id: 'm-sip-3',    label: 'Axis Small Cap',         amount: 8000,  day: 10, category: 'sips',      group: 'sip',       kind: 'fixed' },
    { id: 'm-sip-4',    label: 'Quant Active Fund',      amount: 6000,  day: 14, category: 'sips',      group: 'sip',       kind: 'fixed' },
    { id: 'm-sip-5',    label: 'PPF deposit',            amount: 4000,  day: 19, category: 'sips',      group: 'sip',       kind: 'fixed' },
    { id: 'm-fam',      label: 'Mother · monthly transfer', amount: 25000, day: 5, category: 'family',  group: 'family',    kind: 'fixed' },
    { id: 'm-sub-1',    label: 'Apple One Family',       amount: 1499,  day: 8,  category: 'subs',      group: 'subs',      kind: 'fixed' },
    { id: 'm-sub-2',    label: 'Netflix',                amount: 649,   day: 12, category: 'subs',      group: 'subs',      kind: 'fixed' },
    { id: 'm-sub-3',    label: 'Spotify',                amount: 179,   day: 14, category: 'subs',      group: 'subs',      kind: 'fixed' },
    { id: 'm-sub-4',    label: 'iCloud 200 GB',          amount: 219,   day: 20, category: 'subs',      group: 'subs',      kind: 'fixed' },
    { id: 'm-sub-5',    label: 'Notion',                 amount: 408,   day: 25, category: 'subs',      group: 'subs',      kind: 'fixed' },
  ],
  jun: [
    { id: 'j-rent',     label: 'Rent · BESCOM landlord', amount: 32000, day: 15, category: 'housing',   group: 'rent',      kind: 'fixed' },
    { id: 'j-elec',     label: 'BESCOM electricity',     amount: 3400,  day: 7,  category: 'housing',   group: 'rent',      kind: 'fixed' },
    { id: 'j-internet', label: 'ACT Fibernet',           amount: 1499,  day: 5,  category: 'housing',   group: 'rent',      kind: 'fixed' },
    { id: 'j-emi-home', label: 'HDFC Home Loan EMI',     amount: 24500, day: 1,  category: 'emis',      group: 'emi',       kind: 'fixed' },
    { id: 'j-emi-car',  label: 'Kotak Car Loan EMI',     amount: 13900, day: 1,  category: 'emis',      group: 'emi',       kind: 'fixed' },
    { id: 'j-sip-1',    label: 'PPFAS Flexi Cap SIP',    amount: 8000,  day: 2,  category: 'sips',      group: 'sip',       kind: 'fixed' },
    { id: 'j-sip-2',    label: 'Mirae Asset Large Cap',  amount: 6000,  day: 3,  category: 'sips',      group: 'sip',       kind: 'fixed' },
    { id: 'j-sip-3',    label: 'Axis Small Cap',         amount: 8000,  day: 10, category: 'sips',      group: 'sip',       kind: 'fixed' },
    { id: 'j-sip-4',    label: 'Quant Active Fund',      amount: 6000,  day: 14, category: 'sips',      group: 'sip',       kind: 'fixed' },
    { id: 'j-sip-5',    label: 'PPF deposit',            amount: 4000,  day: 19, category: 'sips',      group: 'sip',       kind: 'fixed' },
    { id: 'j-fam',      label: 'Mother · monthly transfer', amount: 25000, day: 5, category: 'family',  group: 'family',    kind: 'fixed' },
    { id: 'j-ins-car',  label: 'HDFC ERGO · car insurance renewal', amount: 18400, day: 18, category: 'insurance', group: 'insurance', kind: 'one-off' },
    { id: 'j-ins-lic',  label: 'LIC Jeevan Anand premium', amount: 14380, day: 12, category: 'insurance', group: 'insurance', kind: 'fixed' },
    { id: 'j-sub-1',    label: 'Apple One Family',       amount: 1499,  day: 8,  category: 'subs',      group: 'subs',      kind: 'fixed' },
    { id: 'j-sub-2',    label: 'Netflix',                amount: 649,   day: 12, category: 'subs',      group: 'subs',      kind: 'fixed' },
    { id: 'j-sub-3',    label: 'Spotify',                amount: 179,   day: 14, category: 'subs',      group: 'subs',      kind: 'fixed' },
    { id: 'j-sub-4',    label: 'iCloud 200 GB',          amount: 219,   day: 20, category: 'subs',      group: 'subs',      kind: 'fixed' },
    { id: 'j-sub-5',    label: 'Notion',                 amount: 408,   day: 25, category: 'subs',      group: 'subs',      kind: 'fixed' },
  ],
  jul: [
    { id: 'l-rent',     label: 'Rent · BESCOM landlord', amount: 32000, day: 15, category: 'housing',   group: 'rent',      kind: 'fixed' },
    { id: 'l-elec',     label: 'BESCOM electricity',     amount: 4200,  day: 7,  category: 'housing',   group: 'rent',      kind: 'fixed' },
    { id: 'l-internet', label: 'ACT Fibernet',           amount: 1499,  day: 5,  category: 'housing',   group: 'rent',      kind: 'fixed' },
    { id: 'l-emi-home', label: 'HDFC Home Loan EMI',     amount: 24500, day: 1,  category: 'emis',      group: 'emi',       kind: 'fixed' },
    { id: 'l-emi-car',  label: 'Kotak Car Loan EMI',     amount: 13900, day: 1,  category: 'emis',      group: 'emi',       kind: 'fixed' },
    { id: 'l-sip-1',    label: 'PPFAS Flexi Cap SIP',    amount: 8000,  day: 2,  category: 'sips',      group: 'sip',       kind: 'fixed' },
    { id: 'l-sip-2',    label: 'Mirae Asset Large Cap',  amount: 6000,  day: 3,  category: 'sips',      group: 'sip',       kind: 'fixed' },
    { id: 'l-sip-3',    label: 'Axis Small Cap',         amount: 8000,  day: 10, category: 'sips',      group: 'sip',       kind: 'fixed' },
    { id: 'l-sip-4',    label: 'Quant Active Fund',      amount: 6000,  day: 14, category: 'sips',      group: 'sip',       kind: 'fixed' },
    { id: 'l-sip-5',    label: 'PPF deposit',            amount: 4000,  day: 19, category: 'sips',      group: 'sip',       kind: 'fixed' },
    { id: 'l-fam',      label: 'Mother · monthly transfer', amount: 25000, day: 5, category: 'family',  group: 'family',    kind: 'fixed' },
    { id: 'l-sub-1',    label: 'Apple One Family',       amount: 1499,  day: 8,  category: 'subs',      group: 'subs',      kind: 'fixed' },
    { id: 'l-sub-2',    label: 'Netflix',                amount: 649,   day: 12, category: 'subs',      group: 'subs',      kind: 'fixed' },
    { id: 'l-sub-3',    label: 'Spotify',                amount: 179,   day: 14, category: 'subs',      group: 'subs',      kind: 'fixed' },
    { id: 'l-sub-4',    label: 'iCloud 200 GB',          amount: 219,   day: 20, category: 'subs',      group: 'subs',      kind: 'fixed' },
    { id: 'l-sub-5',    label: 'Notion',                 amount: 408,   day: 25, category: 'subs',      group: 'subs',      kind: 'fixed' },
  ],
};

// One-offs the user has flagged but not yet scheduled (will surface as
// "upcoming events" on the projection page).
const PROJ_ONE_OFFS = [
  { id: 'oo-1', label: 'Tarini · summer school fees', amount: 38000, monthId: 'may', when: 'Late May (est)', category: 'family', confirmed: false },
  { id: 'oo-2', label: 'Goa trip · 3-day weekend',    amount: 42000, monthId: 'jun', when: '12–14 Jun',       category: 'travel', confirmed: true },
  { id: 'oo-3', label: 'Mac mini upgrade',            amount: 64000, monthId: 'jul', when: 'Mid Jul (est)',   category: 'discretionary', confirmed: false },
];

// Group metadata: order, color (reusing stream palette), icon, label
const PROJ_GROUPS = [
  { id: 'rent',      label: 'Rent & utilities',     accentKey: 's1', icon: '⌂' },
  { id: 'emi',       label: 'EMIs & loans',         accentKey: 's2', icon: '═' },
  { id: 'sip',       label: 'SIPs & investments',   accentKey: 's3', icon: '↑' },
  { id: 'family',    label: 'Family support',       accentKey: 's4', icon: '○' },
  { id: 'insurance', label: 'Insurance',            accentKey: 's5', icon: '◇' },
  { id: 'subs',      label: 'Subscriptions',        accentKey: 's6', icon: '◷' },
];

// Variable-spend baseline (last 3 months avg of variable categories)
const VAR_BASELINE = 46000; // expected
function variableForMonth(slider /* 0..1, default 0.5 */) {
  // slider 0 → 0.7×, 0.5 → 1.0×, 1.0 → 1.4×
  const factor = 0.7 + slider * 0.7;
  return Math.round(VAR_BASELINE * factor);
}

function projMonthLocked(monthId) {
  const items = PROJ_LOCKED[monthId];
  const byGroup = {};
  PROJ_GROUPS.forEach(g => byGroup[g.id] = 0);
  items.forEach(it => { byGroup[it.group] = (byGroup[it.group] || 0) + it.amount; });
  const total = items.reduce((s, i) => s + i.amount, 0);
  return { items, byGroup, total };
}

// Confidence triple: low / expected / high
// locked is always certain → contributes equally to all three
// variable contributes ±15% range
function projMonthRange(monthId, varSlider) {
  const { total: locked, byGroup, items } = projMonthLocked(monthId);
  const expectedVar = variableForMonth(varSlider);
  const lowVar = Math.round(expectedVar * 0.85);
  const highVar = Math.round(expectedVar * 1.15);
  return {
    locked, byGroup, items,
    expectedVar, lowVar, highVar,
    low: locked + lowVar,
    expected: locked + expectedVar,
    high: locked + highVar,
  };
}

// "Rest of FY" = Aug → Mar = 8 months. Locked recurring is steady; variable
// uses 8× expected; one big bump for insurance renewals in Q3.
function restOfFY(varSlider) {
  // pull a "typical" locked total from June (insurance + lic in same month makes
  // it slightly heavy; subtract one-off insurance renewal for monthly avg)
  const junTotal = projMonthLocked('jun').total - 18400; // strip the one-off
  const monthlyLocked = Math.round((projMonthLocked('may').total + junTotal + projMonthLocked('jul').total) / 3);
  const lockedYear = monthlyLocked * 8;
  const varYear = variableForMonth(varSlider) * 8;
  // Q3 festival bump (Oct/Nov dining + discretionary)
  const festivalBump = 48000;
  return {
    months: 8,
    locked: lockedYear,
    variable: varYear,
    festival: festivalBump,
    total: lockedYear + varYear + festivalBump,
    scheduledEvents: 8 * 17 + 2, // ~17 fixed/month + 2 quarterly insurance renewals
  };
}

// ── Projection chart: 3 months, low/expected/high triplets ──────────────
function OutflowsProjectionChart({ theme, varSlider, hovered, onHover }) {
  const tk = tko(theme);
  const W = 760, H = 320, padL = 56, padR = 16, padT = 16, padB = 60;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const months = PROJ_MONTHS.map(m => ({ ...m, range: projMonthRange(m.id, varSlider) }));
  const max = Math.max(...months.map(m => m.range.high)) * 1.08;

  const groupW = chartW / months.length; // each month gets a column
  const tripletGap = 8;
  const barW = (groupW - 32 - tripletGap * 2) / 3;

  const yScale = (v) => padT + chartH - (v / max) * chartH;

  // Y-axis ticks (0, 50k, 100k, 150k, 200k)
  const tickStep = 50000;
  const ticks = [];
  for (let v = 0; v <= max; v += tickStep) ticks.push(v);

  return (
    <svg width={W} height={H} style={{ display: 'block' }}>
      {/* Y-axis ticks + gridlines */}
      {ticks.map((v) => (
        <g key={v}>
          <line x1={padL} x2={W - padR} y1={yScale(v)} y2={yScale(v)} stroke={tk.divider} strokeDasharray="2 4" />
          <text x={padL - 8} y={yScale(v) + 3} fontSize={10} fill={tk.inkSubtle} fontFamily={TO.type.mono} textAnchor="end" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {v === 0 ? '0' : TO.formatINR(v, { compact: true })}
          </text>
        </g>
      ))}

      {/* X-axis baseline */}
      <line x1={padL} x2={W - padR} y1={yScale(0)} y2={yScale(0)} stroke={tk.border} />

      {months.map((m, i) => {
        const xBase = padL + i * groupW + 16;
        const isHover = hovered === m.id;
        const triplets = [
          { kind: 'low',      v: m.range.low,      label: 'low',      x: xBase,                          opacity: 0.55 },
          { kind: 'expected', v: m.range.expected, label: 'expected', x: xBase + barW + tripletGap,      opacity: 1 },
          { kind: 'high',     v: m.range.high,     label: 'high',     x: xBase + (barW + tripletGap)*2,  opacity: 0.35 },
        ];

        // Locked stack height (for each bar, locked portion is the same)
        const lockedH = (m.range.locked / max) * chartH;
        return (
          <g key={m.id} onMouseEnter={() => onHover && onHover(m.id)} onMouseLeave={() => onHover && onHover(null)} style={{ cursor: 'pointer' }}>
            {/* hover rect */}
            <rect x={xBase - 8} y={padT} width={groupW - 16} height={chartH} fill={isHover ? tk.surfaceAlt : 'transparent'} rx={4} />

            {triplets.map((t) => {
              const barH = (t.v / max) * chartH;
              const yTop = yScale(t.v);
              const yLockTop = yScale(m.range.locked);
              return (
                <g key={t.kind}>
                  {/* variable portion (top, lighter) */}
                  <rect x={t.x} y={yTop} width={barW} height={yLockTop - yTop} fill={tk.s5} opacity={t.opacity * 0.6} />
                  {/* locked portion (bottom, accent) */}
                  <rect x={t.x} y={yLockTop} width={barW} height={lockedH} fill={tk.accent} opacity={t.opacity} />
                  {/* expected gets a value label on top */}
                  {t.kind === 'expected' && (
                    <text x={t.x + barW / 2} y={yTop - 6} fontSize={11} fill={tk.ink} fontFamily={TO.type.mono} textAnchor="middle" fontWeight={600} style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {TO.formatINR(t.v, { compact: true })}
                    </text>
                  )}
                  {/* low/high tiny label */}
                  {(t.kind === 'low' || t.kind === 'high') && (
                    <text x={t.x + barW / 2} y={yTop - 4} fontSize={9} fill={tk.inkSubtle} fontFamily={TO.type.mono} textAnchor="middle" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {TO.formatINR(t.v, { compact: true })}
                    </text>
                  )}
                </g>
              );
            })}

            {/* low/expected/high tick labels under bars */}
            {triplets.map((t) => (
              <text key={t.kind} x={t.x + barW / 2} y={yScale(0) + 14} fontSize={9} fill={tk.inkSubtle} fontFamily={TO.type.mono} textAnchor="middle" style={{ letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {t.label}
              </text>
            ))}

            {/* Month label */}
            <text x={xBase + (barW * 3 + tripletGap * 2) / 2} y={yScale(0) + 32} fontSize={13} fill={tk.ink} fontFamily={TO.type.sans} textAnchor="middle" fontWeight={600}>
              {m.label}
            </text>
            <text x={xBase + (barW * 3 + tripletGap * 2) / 2} y={yScale(0) + 48} fontSize={10} fill={tk.inkMuted} fontFamily={TO.type.mono} textAnchor="middle">
              {PROJ_LOCKED[m.id].length} scheduled
            </text>
          </g>
        );
      })}

      {/* Legend */}
      <g transform={`translate(${padL}, 4)`}>
        <rect x={0} y={0} width={10} height={10} fill={tk.accent} />
        <text x={14} y={9} fontSize={10} fill={tk.inkMuted} fontFamily={TO.type.sans}>Locked debits</text>
        <rect x={100} y={0} width={10} height={10} fill={tk.s5} opacity={0.6} />
        <text x={114} y={9} fontSize={10} fill={tk.inkMuted} fontFamily={TO.type.sans}>Estimated variable</text>
      </g>
    </svg>
  );
}

// ── Locked debits drawer (per month) ────────────────────────────────────
function LockedDrawer({ theme, monthId }) {
  const tk = tko(theme);
  const items = PROJ_LOCKED[monthId];
  // sort by day asc
  const sorted = [...items].sort((a, b) => a.day - b.day);
  const month = PROJ_MONTHS.find(m => m.id === monthId);
  const groupColor = (g) => tk[PROJ_GROUPS.find(gr => gr.id === g)?.accentKey || 's1'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 90px 100px 80px', columnGap: 12, padding: '8px 0', borderBottom: `1px solid ${tk.divider}`, fontSize: 10, color: tk.inkSubtle, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        <div>Date</div>
        <div>Debit</div>
        <div>Group</div>
        <div style={{ textAlign: 'right' }}>Amount</div>
        <div style={{ textAlign: 'right' }}>Action</div>
      </div>
      {sorted.map((it) => {
        const g = PROJ_GROUPS.find(gr => gr.id === it.group);
        return (
          <div key={it.id} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 90px 100px 80px', columnGap: 12, padding: '8px 0', borderBottom: `1px solid ${tk.divider}`, fontSize: 12, alignItems: 'center' }}>
            <span style={{ fontFamily: TO.type.mono, color: tk.ink, fontVariantNumeric: 'tabular-nums' }}>{String(it.day).padStart(2, '0')}/{month.short === 'May' ? '05' : month.short === 'Jun' ? '06' : '07'}</span>
            <span style={{ color: tk.ink }}>{it.label}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: tk.inkMuted, fontSize: 11 }}>
              <span style={{ width: 6, height: 6, borderRadius: 2, background: groupColor(it.group) }} />
              {g?.label.replace(/ &.*/, '').replace(' support', '').replace(' & investments', '').replace(' & utilities', '')}
            </span>
            <span style={{ fontFamily: TO.type.mono, color: tk.ink, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{TO.formatINR(it.amount)}</span>
            <span style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
              {it.kind === 'one-off'
                ? <Badge theme={theme} tone="warning">ONE-OFF</Badge>
                : <button style={{ background: 'transparent', border: `1px solid ${tk.border}`, color: tk.inkMuted, fontSize: 10, padding: '2px 8px', borderRadius: 3, cursor: 'pointer', fontFamily: TO.type.sans }}>Edit</button>
              }
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Variable-spend slider (what-if) ─────────────────────────────────────
function VariableSlider({ theme, value, onChange }) {
  const tk = tko(theme);
  const expected = variableForMonth(value);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontSize: 11, color: tk.inkMuted, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>What-if · variable spend</div>
        <span style={{ fontFamily: TO.type.mono, fontSize: 14, color: tk.ink, fontVariantNumeric: 'tabular-nums' }}>
          {TO.formatINR(expected)}/mo
        </span>
      </div>
      <input
        type="range" min={0} max={1} step={0.01} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: tk.accent }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: tk.inkSubtle, fontFamily: TO.type.mono }}>
        <span>Lean · {TO.formatINR(variableForMonth(0))}</span>
        <span>Avg · {TO.formatINR(variableForMonth(0.5))}</span>
        <span>Loose · {TO.formatINR(variableForMonth(1))}</span>
      </div>
    </div>
  );
}

// ── Group summary chips (composition of locked) ─────────────────────────
function GroupSummary({ theme, monthId }) {
  const tk = tko(theme);
  const { byGroup, total } = projMonthLocked(monthId);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {PROJ_GROUPS.filter(g => byGroup[g.id] > 0).map((g) => {
        const v = byGroup[g.id];
        const pct = (v / total) * 100;
        return (
          <div key={g.id} style={{ display: 'grid', gridTemplateColumns: '14px 1fr 70px 38px', alignItems: 'center', columnGap: 8, fontSize: 12 }}>
            <span style={{ color: tk[g.accentKey], fontFamily: TO.type.mono, fontSize: 12 }}>{g.icon}</span>
            <span style={{ color: tk.ink, fontSize: 12 }}>{g.label}</span>
            <span style={{ fontFamily: TO.type.mono, color: tk.ink, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{TO.formatINR(v, { compact: true })}</span>
            <span style={{ fontFamily: TO.type.mono, color: tk.inkSubtle, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 11 }}>{pct.toFixed(0)}%</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Rest of FY summary card ─────────────────────────────────────────────
function RestOfFY({ theme, varSlider }) {
  const tk = tko(theme);
  const r = restOfFY(varSlider);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div style={{ fontSize: 11, color: tk.inkMuted, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>Rest of FY26</div>
        <div style={{ fontSize: 11, color: tk.inkSubtle, marginTop: 2 }}>Aug 2026 → Mar 2027 · 8 months</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontFamily: TO.type.mono, fontSize: 30, color: tk.ink, fontWeight: 500, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          {TO.formatINR(r.total, { compact: true })}
        </span>
        <span style={{ fontSize: 11, color: tk.inkMuted }}>projected</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingTop: 8, borderTop: `1px solid ${tk.divider}` }}>
        <div>
          <div style={{ fontSize: 10, color: tk.inkSubtle, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>Locked</div>
          <div style={{ fontFamily: TO.type.mono, fontSize: 16, color: tk.ink, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{TO.formatINR(r.locked, { compact: true })}</div>
          <div style={{ fontSize: 10, color: tk.inkMuted, fontFamily: TO.type.mono, marginTop: 2 }}>{((r.locked / r.total) * 100).toFixed(0)}% of total</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: tk.inkSubtle, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>Variable + festival</div>
          <div style={{ fontFamily: TO.type.mono, fontSize: 16, color: tk.ink, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{TO.formatINR(r.variable + r.festival, { compact: true })}</div>
          <div style={{ fontSize: 10, color: tk.inkMuted, fontFamily: TO.type.mono, marginTop: 2 }}>incl. ₹48k Q3 festival bump</div>
        </div>
      </div>
      <div style={{ paddingTop: 8, borderTop: `1px solid ${tk.divider}`, fontSize: 11, color: tk.inkMuted }}>
        <span style={{ fontFamily: TO.type.mono, color: tk.ink }}>{r.scheduledEvents}</span> scheduled debits across the period · auto-recalculates as you pause SIPs or change recurring plans
      </div>
    </div>
  );
}

// ── One-off events panel ────────────────────────────────────────────────
function OneOffsPanel({ theme }) {
  const tk = tko(theme);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 11, color: tk.inkMuted, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>One-off events you've flagged</div>
          <div style={{ fontSize: 11, color: tk.inkSubtle, marginTop: 2 }}>Non-recurring spends already on the radar</div>
        </div>
        <button style={{ background: tk.surface, border: `1px solid ${tk.border}`, color: tk.ink, fontSize: 11, padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontFamily: TO.type.sans, fontWeight: 600 }}>+ Mark a one-off</button>
      </div>
      {PROJ_ONE_OFFS.map((it, i) => (
        <div key={it.id} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 110px 90px 90px', alignItems: 'center', columnGap: 12, padding: '10px 0', borderTop: i === 0 ? `1px solid ${tk.divider}` : 'none', borderBottom: `1px solid ${tk.divider}`, fontSize: 12 }}>
          <span style={{ fontFamily: TO.type.mono, color: tk.inkSubtle }}>{it.confirmed ? '●' : '◌'}</span>
          <span style={{ color: tk.ink, fontWeight: 500 }}>{it.label}</span>
          <span style={{ color: tk.inkMuted, fontSize: 11 }}>{it.when}</span>
          <span style={{ fontFamily: TO.type.mono, color: tk.ink, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>{TO.formatINR(it.amount)}</span>
          <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Badge theme={theme} tone={it.confirmed ? 'info' : 'neutral'}>{it.confirmed ? 'CONFIRMED' : 'TENTATIVE'}</Badge>
          </span>
        </div>
      ))}
    </div>
  );
}

// ── ProjectionView (the whole 'Next' page) ──────────────────────────────
function ProjectionView({ theme }) {
  const tk = tko(theme);
  const [varSlider, setVarSlider] = React.useState(0.5);
  const [openMonth, setOpenMonth] = React.useState('may');
  const [hoveredMonth, setHoveredMonth] = React.useState(null);

  const may = projMonthRange('may', varSlider);
  const jun = projMonthRange('jun', varSlider);
  const jul = projMonthRange('jul', varSlider);
  const total3mo = may.expected + jun.expected + jul.expected;
  const locked3mo = may.locked + jun.locked + jul.locked;

  return (
    <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
      {/* Top strip: kpis + slider */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1.1fr', gap: 12, flexShrink: 0 }}>
        <Card theme={theme} padding={16} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, color: tk.inkMuted, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>Next 3 months · projected</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontFamily: TO.type.mono, fontSize: 32, color: tk.ink, fontWeight: 500, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1.05 }}>
              {TO.formatINR(total3mo, { compact: true })}
            </span>
            <span style={{ fontSize: 11, color: tk.inkSubtle }}>at expected</span>
          </div>
          <div style={{ fontSize: 11, color: tk.inkMuted }}>
            Range <span style={{ fontFamily: TO.type.mono, color: tk.ink }}>{TO.formatINR(may.low + jun.low + jul.low, { compact: true })}</span>
            {' → '}
            <span style={{ fontFamily: TO.type.mono, color: tk.ink }}>{TO.formatINR(may.high + jun.high + jul.high, { compact: true })}</span>
          </div>
        </Card>
        <KPICard theme={theme} label="Locked debits · 3 mo" value={TO.formatINR(locked3mo, { compact: true })} footer={`${PROJ_LOCKED.may.length + PROJ_LOCKED.jun.length + PROJ_LOCKED.jul.length} scheduled · ${((locked3mo/total3mo)*100).toFixed(0)}% of projection`} />
        <KPICard theme={theme} label="One-offs flagged" value={`${PROJ_ONE_OFFS.length} events · ${TO.formatINR(PROJ_ONE_OFFS.reduce((s,o)=>s+o.amount,0), { compact: true })}`} footer="not yet folded into the bars" />
        <Card theme={theme} padding={16}>
          <VariableSlider theme={theme} value={varSlider} onChange={setVarSlider} />
        </Card>
      </div>

      {/* Chart + composition */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 12, flexShrink: 0 }}>
        <Card theme={theme} padding={0} style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '14px 16px 6px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: tk.inkMuted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Projected outflows · low / expected / high</div>
            <div style={{ fontSize: 13, color: tk.ink, marginTop: 2 }}>Each month: 3 bars showing the range. Dark = locked, light = variable.</div>
          </div>
          <div style={{ padding: '0 16px 12px' }}>
            <OutflowsProjectionChart theme={theme} varSlider={varSlider} hovered={hoveredMonth} onHover={setHoveredMonth} />
          </div>
        </Card>

        <Card theme={theme} padding={16} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <RestOfFY theme={theme} varSlider={varSlider} />
        </Card>
      </div>

      {/* Per-month tabs + drawer */}
      <Card theme={theme} padding={0} style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', borderBottom: `1px solid ${tk.divider}` }}>
          {PROJ_MONTHS.map((m) => {
            const r = projMonthRange(m.id, varSlider);
            const active = openMonth === m.id;
            return (
              <button key={m.id} onClick={() => setOpenMonth(m.id)} style={{
                flex: 1, padding: '14px 16px', background: active ? tk.surface : tk.surfaceAlt,
                border: 'none', borderBottom: active ? `2px solid ${tk.accent}` : '2px solid transparent',
                cursor: 'pointer', textAlign: 'left', fontFamily: TO.type.sans,
              }}>
                <div style={{ fontSize: 11, color: tk.inkMuted, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>{m.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                  <span style={{ fontFamily: TO.type.mono, fontSize: 18, color: tk.ink, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{TO.formatINR(r.expected, { compact: true })}</span>
                  <span style={{ fontFamily: TO.type.mono, fontSize: 11, color: tk.inkSubtle, fontVariantNumeric: 'tabular-nums' }}>± {TO.formatINR(r.expectedVar * 0.15, { compact: true })}</span>
                </div>
                <div style={{ fontSize: 11, color: tk.inkMuted, marginTop: 2 }}>{PROJ_LOCKED[m.id].length} scheduled debits</div>
              </button>
            );
          })}
        </div>
        <div style={{ padding: '12px 16px 16px', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
          <div>
            <div style={{ fontSize: 11, color: tk.inkMuted, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
              Scheduled debits · {PROJ_MONTHS.find(m => m.id === openMonth).label}
            </div>
            <LockedDrawer theme={theme} monthId={openMonth} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: tk.inkMuted, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>By group</div>
            <GroupSummary theme={theme} monthId={openMonth} />
          </div>
        </div>
      </Card>

      {/* One-offs */}
      <Card theme={theme} padding={16} style={{ flexShrink: 0 }}>
        <OneOffsPanel theme={theme} />
      </Card>
    </div>
  );
}

// ── OutflowsDesktop ─────────────────────────────────────────────────────
function OutflowsDesktop({ theme = 'light', period: periodProp }) {
  const tk = tko(theme);
  const [periodState, setPeriodState] = React.useState('month');
  const period = periodProp || periodState;
  const isFY = period === 'fy';
  const isNext = period === 'next';

  const total = isFY ? FY_TOTAL : TOTAL;
  const recurring = isFY ? FY_RECURRING : RECURRING_TOTAL;
  const variable = isFY ? FY_VARIABLE : VARIABLE_TOTAL;
  const recurringPct = (recurring / total) * 100;
  const cats = isFY ? CATEGORIES_FY : CATEGORIES;
  const sortedCats = [...cats].sort((a, b) => b.amount - a.amount);

  const monthlyAvg = 200000;
  const fyAvg = monthlyAvg * 12;

  const periodLabel = isFY ? 'FY26' : 'April';
  const subtitle = isNext
    ? `Forward-looking · May → Jul 2026 · plus a rest-of-FY summary. Locked debits + variable range.`
    : isFY
    ? `12 categories · ${cats.reduce((s, c) => s + c.count, 0)} transactions · ${TO.formatINR(total, { compact: true })} spent in FY26`
    : `12 categories · 105 transactions · ${TO.formatINR(total)} spent in April`;
  const heroPeriod = isFY ? 'FY26 · spent' : 'April · spent';

  return (
    <div style={{ background: tk.bg, color: tk.ink, fontFamily: TO.type.sans, display: 'flex', height: '100%', minWidth: 0 }}>
      <SideNav theme={theme} active="Outflows" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar theme={theme} title="Outflows" subtitle={subtitle} period={isNext ? 'May → Jul 2026' : isFY ? 'FY26' : 'Apr 2026'} />
        {isNext ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 0', flexShrink: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: tk.inkMuted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Showing · Next 3 months + rest of FY26
              </div>
              <PeriodSwitcher theme={theme} value={period} onChange={setPeriodState} />
            </div>
            <ProjectionView theme={theme} />
          </>
        ) : (
        <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          {/* Period switcher row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: -4, marginBottom: -4, flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: tk.inkMuted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Showing · {isFY ? 'FY26 (Apr 2025 → Mar 2026)' : 'April 2026'}
            </div>
            <PeriodSwitcher theme={theme} value={period} onChange={setPeriodState} />
          </div>

          {/* KPI strip */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 12, flexShrink: 0 }}>
            <Card theme={theme} padding={16} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: tk.inkMuted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{heroPeriod}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ fontFamily: TO.type.mono, fontSize: 32, fontWeight: 500, color: tk.ink, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1.05 }}>
                  {TO.formatINR(total, isFY ? { compact: true } : {})}
                </span>
                <Delta theme={theme} value={isFY ? 6.4 : 3.2} size={13} />
                <span style={{ fontSize: 11, color: tk.inkSubtle }}>{isFY ? 'vs FY25' : 'vs March'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', height: 8, borderRadius: 999, overflow: 'hidden', background: tk.surfaceAlt }}>
                  <div style={{ width: `${recurringPct}%`, background: tk.accent }} />
                  <div style={{ flex: 1, background: tk.s4, opacity: 0.6 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: tk.inkMuted }}>
                    <span style={{ display: 'inline-block', width: 8, height: 8, background: tk.accent, marginRight: 6, borderRadius: 2 }} />
                    Recurring <span style={{ fontFamily: TO.type.mono, color: tk.ink }}>{TO.formatINR(recurring, { compact: true })}</span> · {recurringPct.toFixed(0)}%
                  </span>
                  <span style={{ color: tk.inkMuted }}>
                    <span style={{ display: 'inline-block', width: 8, height: 8, background: tk.s4, opacity: 0.6, marginRight: 6, borderRadius: 2 }} />
                    Variable <span style={{ fontFamily: TO.type.mono, color: tk.ink }}>{TO.formatINR(variable, { compact: true })}</span> · {(100 - recurringPct).toFixed(0)}%
                  </span>
                </div>
              </div>
            </Card>

            {isFY ? (
              <>
                <KPICard theme={theme} label="vs prior FY" value={TO.formatINR(total - fyAvg, { compact: true }) + (total > fyAvg ? ' over' : ' under')} delta={6.4} deltaLabel="vs FY25" footer={`FY25 ${TO.formatINR(fyAvg, { compact: true })}`} />
                <KPICard theme={theme} label="Auto-debits · year" value="168 of 168" footer="all 14 monthly cycles complete" />
                <KPICard theme={theme} label="Highest month" value={TO.formatINR(Math.max(...MONTHLY_TOTALS), { compact: true })} footer={`${MONTH_LABELS[MONTHLY_TOTALS.indexOf(Math.max(...MONTHLY_TOTALS))]} · festival + travel`} />
              </>
            ) : (
              <>
                <KPICard theme={theme} label="vs 6-mo average" value={TO.formatINR(monthlyAvg - TOTAL, { compact: true }) + ' under'} delta={-3.4} deltaLabel="below avg" footer={`6-mo avg ${TO.formatINR(monthlyAvg, { compact: true })}`} />
                <KPICard theme={theme} label="Auto-debits this month" value="14 of 14" footer="3 still upcoming · all on file" />
                <KPICard theme={theme} label="Largest single debit" value={TO.formatINR(32000)} footer="Rent · 15/04 · BESCOM landlord" />
              </>
            )}
          </div>

          {/* Treemap + (calendar | monthly trend) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 12, minHeight: 0, flexShrink: 0 }}>
            <Card theme={theme} padding={0} style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: tk.inkMuted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>By category</div>
                  <div style={{ fontSize: 13, color: tk.ink, marginTop: 2 }}>Area = share of {isFY ? 'FY26' : 'April'} spend</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button theme={theme} variant="ghost" size="sm">By amount</Button>
                  <Button theme={theme} variant="ghost" size="sm">By count</Button>
                </div>
              </div>
              <div style={{ padding: '0 16px 16px' }}>
                <Treemap theme={theme} width={760} height={280} period={period} />
              </div>
            </Card>

            {isFY ? <MonthlyTrend theme={theme} /> : <DebitCalendar theme={theme} />}
          </div>

          {/* Category cards grid */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: tk.inkMuted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>All categories · sorted by spend</div>
              <div style={{ fontSize: 11, color: tk.inkSubtle, fontFamily: TO.type.mono }}>● auto-debit · ◌ variable</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {sortedCats.map((c) => <CategoryCard key={c.id} theme={theme} c={c} total={total} period={period} />)}
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

// ── OutflowsMobile ──────────────────────────────────────────────────────
function OutflowsMobile({ theme = 'light' }) {
  const tk = tko(theme);
  const recurringPct = (RECURRING_TOTAL / TOTAL) * 100;
  const sortedCats = [...CATEGORIES].sort((a, b) => b.amount - a.amount).filter(c => c.amount > 0);

  return (
    <div style={{ background: tk.bg, color: tk.ink, fontFamily: TO.type.sans, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${tk.border}`, background: tk.bg }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 18, color: tk.inkMuted }}>‹</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: tk.ink }}>Outflows</span>
          <span style={{ fontSize: 18, color: tk.inkMuted }}>⌕</span>
        </div>
        <div style={{ fontFamily: TO.type.mono, fontSize: 10, color: tk.inkSubtle, letterSpacing: '0.06em', textTransform: 'uppercase' }}>April 2026</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Hero */}
        <Card theme={theme} padding={16} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: tk.inkMuted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>April · spent</div>
          <div style={{ fontFamily: TO.type.mono, fontSize: 30, fontWeight: 500, color: tk.ink, letterSpacing: '-0.02em', lineHeight: 1.05, fontVariantNumeric: 'tabular-nums' }}>
            {TO.formatINR(TOTAL)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Delta theme={theme} value={3.2} size={12} />
            <span style={{ fontSize: 11, color: tk.inkMuted }}>vs March · {TO.formatINR(200000, { compact: true })} avg</span>
          </div>
          <div style={{ display: 'flex', height: 6, borderRadius: 999, overflow: 'hidden', background: tk.surfaceAlt }}>
            <div style={{ width: `${recurringPct}%`, background: tk.accent }} />
            <div style={{ flex: 1, background: tk.s4, opacity: 0.6 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: tk.inkMuted, fontFamily: TO.type.mono }}>
            <span>Recurring {recurringPct.toFixed(0)}%</span>
            <span>Variable {(100 - recurringPct).toFixed(0)}%</span>
          </div>
        </Card>

        {/* Mini treemap */}
        <Card theme={theme} padding={12} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: tk.inkMuted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>By category</div>
          <Treemap theme={theme} width={334} height={150} />
        </Card>

        {/* Top categories list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sortedCats.slice(0, 8).map((c) => {
            const pct = (c.amount / TOTAL) * 100;
            const deltaPct = c.last > 0 ? ((c.amount - c.last) / c.last) * 100 : 0;
            return (
              <Card key={c.id} theme={theme} padding={0} style={{ overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '4px 1fr auto', minHeight: 64, alignItems: 'stretch' }}>
                  <div style={{ background: tk[c.accentKey] }} />
                  <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontFamily: TO.type.mono, fontSize: 11, color: tk[c.accentKey] }}>{c.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: tk.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.label}</span>
                      {c.recurring === 1 && <Badge theme={theme} tone="info">AUTO</Badge>}
                    </div>
                    <div style={{ fontSize: 11, color: tk.inkMuted, fontFamily: TO.type.mono, display: 'flex', gap: 8 }}>
                      <span>{c.count} txn</span>
                      <span>·</span>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.top}</span>
                    </div>
                  </div>
                  <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', gap: 2 }}>
                    <span style={{ fontFamily: TO.type.mono, fontSize: 14, fontWeight: 500, color: tk.ink, fontVariantNumeric: 'tabular-nums' }}>
                      {TO.formatINR(c.amount, { compact: true })}
                    </span>
                    <span style={{ fontSize: 10, color: tk.inkSubtle, fontFamily: TO.type.mono }}>{pct.toFixed(0)}%</span>
                    {c.last > 0 && <Delta theme={theme} value={Number(deltaPct.toFixed(1))} size={10} />}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Bottom tab bar */}
      <div style={{ display: 'flex', borderTop: `1px solid ${tk.border}`, background: tk.surface, padding: '8px 0 14px' }}>
        {['Home', 'Income', 'Save', 'Docs', 'More'].map((l) => {
          // Outflows is in "More" on the tab bar; nothing active highlighted strongly
          return (
            <div key={l} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 4, height: 4, borderRadius: 999, background: 'transparent' }} />
              <span style={{ fontSize: 11, fontWeight: 500, color: tk.inkSubtle }}>{l}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── OutflowsMobileNext (390 × 820) ──────────────────────────────────────
function OutflowsMobileNext({ theme = 'light' }) {
  const tk = tko(theme);
  const [varSlider, setVarSlider] = React.useState(0.5);
  const [openMonth, setOpenMonth] = React.useState('may');

  const months = PROJ_MONTHS.map(m => ({ ...m, range: projMonthRange(m.id, varSlider) }));
  const total3 = months.reduce((s, m) => s + m.range.expected, 0);
  const locked3 = months.reduce((s, m) => s + m.range.locked, 0);
  const open = months.find(m => m.id === openMonth);
  const fy = restOfFY(varSlider);

  return (
    <div style={{ background: tk.bg, color: tk.ink, fontFamily: TO.type.sans, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* status bar */}
      <div style={{ height: 28, background: tk.surface, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', fontSize: 11, fontWeight: 600, color: tk.ink, fontFamily: TO.type.mono }}>
        <span>9:41</span>
        <span style={{ fontSize: 10 }}>● ● ●  ▮▮</span>
      </div>
      {/* nav */}
      <div style={{ padding: '12px 16px 8px', borderBottom: `1px solid ${tk.divider}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 18, color: tk.inkMuted }}>‹</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: tk.ink }}>Outflows</span>
          <span style={{ fontSize: 18, color: tk.inkMuted }}>⌕</span>
        </div>
        {/* segmented switcher */}
        <div style={{ display: 'flex', background: tk.surfaceAlt, border: `1px solid ${tk.border}`, borderRadius: 6, padding: 2, gap: 2 }}>
          {[{id:'month',l:'Month'},{id:'fy',l:'FY'},{id:'next',l:'Next'}].map(o => {
            const active = o.id === 'next';
            return (
              <button key={o.id} style={{
                flex: 1, background: active ? tk.surface : 'transparent',
                border: active ? `1px solid ${tk.border}` : '1px solid transparent',
                color: active ? tk.ink : tk.inkMuted,
                fontFamily: TO.type.sans, fontSize: 12, fontWeight: 600,
                padding: '5px 0', borderRadius: 4, cursor: 'pointer',
              }}>{o.l}</button>
            );
          })}
        </div>
      </div>

      {/* scroll body */}
      <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* hero */}
        <div>
          <div style={{ fontSize: 10, color: tk.inkMuted, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>Next 3 months · projected</div>
          <div style={{ fontFamily: TO.type.mono, fontSize: 30, color: tk.ink, fontWeight: 500, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1.05, marginTop: 4 }}>
            {TO.formatINR(total3, { compact: true })}
          </div>
          <div style={{ fontSize: 11, color: tk.inkMuted, marginTop: 4 }}>
            Locked <span style={{ fontFamily: TO.type.mono, color: tk.ink }}>{TO.formatINR(locked3, { compact: true })}</span> · variable adjusts with slider
          </div>
        </div>

        {/* slider */}
        <div style={{ background: tk.surface, border: `1px solid ${tk.border}`, borderRadius: TO.radius.md, padding: 12 }}>
          <VariableSlider theme={theme} value={varSlider} onChange={setVarSlider} />
        </div>

        {/* per-month chips with low/exp/high mini-bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {months.map((m) => {
            const active = m.id === openMonth;
            const max = Math.max(...months.map(mm => mm.range.high));
            const lockH = (m.range.locked / max) * 36;
            const lowVar = ((m.range.low - m.range.locked) / max) * 36;
            const expVar = ((m.range.expected - m.range.locked) / max) * 36;
            const highVar = ((m.range.high - m.range.locked) / max) * 36;
            return (
              <button key={m.id} onClick={() => setOpenMonth(m.id)} style={{
                background: active ? tk.surface : tk.surfaceAlt,
                border: `1px solid ${active ? tk.accent : tk.border}`,
                borderRadius: TO.radius.md, padding: 12, textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: tk.inkMuted, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{m.label}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
                    <span style={{ fontFamily: TO.type.mono, fontSize: 18, color: tk.ink, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{TO.formatINR(m.range.expected, { compact: true })}</span>
                    <span style={{ fontFamily: TO.type.mono, fontSize: 10, color: tk.inkSubtle }}>± {TO.formatINR(m.range.expectedVar * 0.15, { compact: true })}</span>
                  </div>
                  <div style={{ fontSize: 10, color: tk.inkMuted, marginTop: 2 }}>{PROJ_LOCKED[m.id].length} scheduled</div>
                </div>
                {/* mini triplet bars */}
                <svg width={66} height={40} style={{ flexShrink: 0 }}>
                  {[{ h: lockH + lowVar,  o: 0.55, x: 4  },
                    { h: lockH + expVar,  o: 1,    x: 26 },
                    { h: lockH + highVar, o: 0.35, x: 48 }].map((b, i) => (
                    <g key={i}>
                      <rect x={b.x} y={40 - b.h} width={14} height={b.h - lockH} fill={tk.s5} opacity={b.o * 0.6} />
                      <rect x={b.x} y={40 - lockH} width={14} height={lockH} fill={tk.accent} opacity={b.o} />
                    </g>
                  ))}
                </svg>
              </button>
            );
          })}
        </div>

        {/* open month detail */}
        <div style={{ background: tk.surface, border: `1px solid ${tk.border}`, borderRadius: TO.radius.md, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ fontSize: 11, color: tk.inkMuted, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{open.label} · debits</div>
            <span style={{ fontSize: 11, color: tk.inkSubtle }}>{PROJ_LOCKED[openMonth].length} items</span>
          </div>
          {[...PROJ_LOCKED[openMonth]].sort((a, b) => a.day - b.day).slice(0, 6).map((it) => {
            const g = PROJ_GROUPS.find(gr => gr.id === it.group);
            return (
              <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 8, borderBottom: `1px solid ${tk.divider}` }}>
                <span style={{ fontFamily: TO.type.mono, fontSize: 11, color: tk.inkMuted, width: 28 }}>{String(it.day).padStart(2, '0')}</span>
                <span style={{ width: 4, height: 24, background: tk[g.accentKey], borderRadius: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: tk.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.label}</div>
                  <div style={{ fontSize: 10, color: tk.inkMuted }}>{g.label}</div>
                </div>
                <span style={{ fontFamily: TO.type.mono, fontSize: 12, color: tk.ink, fontVariantNumeric: 'tabular-nums' }}>{TO.formatINR(it.amount)}</span>
              </div>
            );
          })}
          <button style={{ background: 'transparent', border: 'none', color: tk.accent, fontSize: 12, fontWeight: 600, padding: 4, cursor: 'pointer', textAlign: 'left' }}>
            See all {PROJ_LOCKED[openMonth].length} debits →
          </button>
        </div>

        {/* one-offs */}
        <div style={{ background: tk.surface, border: `1px solid ${tk.border}`, borderRadius: TO.radius.md, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ fontSize: 11, color: tk.inkMuted, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>One-off events</div>
            <button style={{ background: 'transparent', border: `1px solid ${tk.border}`, color: tk.ink, fontSize: 10, padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>+ Add</button>
          </div>
          {PROJ_ONE_OFFS.map((it) => (
            <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 8, borderTop: `1px solid ${tk.divider}` }}>
              <span style={{ fontFamily: TO.type.mono, fontSize: 12, color: tk.inkSubtle, width: 12 }}>{it.confirmed ? '●' : '◌'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: tk.ink }}>{it.label}</div>
                <div style={{ fontSize: 10, color: tk.inkMuted }}>{it.when}</div>
              </div>
              <span style={{ fontFamily: TO.type.mono, fontSize: 12, color: tk.ink, fontVariantNumeric: 'tabular-nums' }}>{TO.formatINR(it.amount)}</span>
            </div>
          ))}
        </div>

        {/* rest of fy */}
        <div style={{ background: tk.surface, border: `1px solid ${tk.border}`, borderRadius: TO.radius.md, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, color: tk.inkMuted, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Rest of FY26 · 8 months</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: TO.type.mono, fontSize: 24, color: tk.ink, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{TO.formatINR(fy.total, { compact: true })}</span>
            <span style={{ fontSize: 11, color: tk.inkMuted }}>projected</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: tk.inkMuted, paddingTop: 6, borderTop: `1px solid ${tk.divider}` }}>
            <span>Locked <span style={{ fontFamily: TO.type.mono, color: tk.ink }}>{TO.formatINR(fy.locked, { compact: true })}</span></span>
            <span>Variable <span style={{ fontFamily: TO.type.mono, color: tk.ink }}>{TO.formatINR(fy.variable + fy.festival, { compact: true })}</span></span>
          </div>
        </div>

        <div style={{ height: 12 }} />
      </div>

      {/* tab bar */}
      <div style={{ display: 'flex', borderTop: `1px solid ${tk.border}`, background: tk.surface, padding: '8px 0 14px' }}>
        {['Home', 'Income', 'Save', 'Docs', 'More'].map((l) => (
          <div key={l} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 4, height: 4, borderRadius: 999, background: 'transparent' }} />
            <span style={{ fontSize: 11, fontWeight: 500, color: tk.inkSubtle }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { OutflowsDesktop, OutflowsMobile, OutflowsMobileNext });
