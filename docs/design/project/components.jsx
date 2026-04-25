// components.jsx — finance-specific components: KPI, savings cards,
// transaction table, charts, document upload, nav.

const TC = window.FDTokens;
function tkc(theme) { return theme === 'dark' ? TC.dark : TC.light; }

// ─── KPI Card ──────────────────────────────────────────────────────────────
function KPICard({ theme = 'light', label, value, delta, deltaLabel, sparkData, sparkColor, footer, accent }) {
  const tk = tkc(theme);
  return (
    <Card theme={theme} padding={16} elevation={1} style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: tk.inkMuted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</div>
        {accent && <div style={{ width: 6, height: 6, borderRadius: 999, background: accent }} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontFamily: TC.type.mono, fontSize: 28, fontWeight: 500, color: tk.ink, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
          {value}
        </div>
        {sparkData && <Sparkline theme={theme} data={sparkData} color={sparkColor || tk.accent} width={84} height={28} />}
      </div>
      {(delta != null || deltaLabel || footer) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: tk.inkMuted }}>
          {delta != null && <Delta theme={theme} value={delta} size={12} />}
          {deltaLabel && <span>{deltaLabel}</span>}
          {footer && <span style={{ marginLeft: 'auto' }}>{footer}</span>}
        </div>
      )}
    </Card>
  );
}

// ─── Savings Instrument Card (polymorphic) ─────────────────────────────────
function SavingsCard({ theme = 'light', instrument }) {
  const tk = tkc(theme);
  const i = instrument;
  const pct = i.maturityValue ? Math.min(100, (i.totalPaid / i.maturityValue) * 100) : null;
  return (
    <Card theme={theme} padding={16} style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <InstitutionMark theme={theme} name={i.institution} size={32} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: tk.ink, letterSpacing: '-0.005em' }}>{i.label}</div>
            <Badge theme={theme} tone={typeBadge(i.type).tone} dot>{typeBadge(i.type).label}</Badge>
          </div>
          <div style={{ fontSize: 12, color: tk.inkMuted, marginTop: 2 }}>
            {i.institution}
            {i.policyNo && <> · <span style={{ fontFamily: TC.type.mono }}>{i.policyNo}</span></>}
            {i.folio && <> · <span style={{ fontFamily: TC.type.mono }}>{i.folio}</span></>}
          </div>
        </div>
      </div>

      {/* Type-specific fields row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, paddingTop: 10, borderTop: `1px solid ${tk.divider}` }}>
        {i.fields.map((f) => (
          <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <div style={{ fontSize: 10, color: tk.inkSubtle, fontFamily: TC.type.mono, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{f.label}</div>
            <div style={{ fontFamily: f.mono === false ? TC.type.sans : TC.type.mono, fontSize: 13, color: tk.ink, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {f.value}
            </div>
          </div>
        ))}
      </div>

      {/* Current value + delta */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, color: tk.inkSubtle, fontFamily: TC.type.mono, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 2 }}>Current value</div>
          <div style={{ fontFamily: TC.type.mono, fontSize: 20, fontWeight: 500, color: tk.ink, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
            {TC.formatINR(i.currentValue)}
          </div>
          {i.delta != null && <div style={{ marginTop: 4 }}><Delta theme={theme} value={i.delta} size={12} /></div>}
        </div>
        {i.spark && <Sparkline theme={theme} data={i.spark} width={96} height={32} color={i.delta < 0 ? tk.loss : tk.gain} />}
      </div>

      {pct != null && <Progress theme={theme} value={pct} label={`Paid · ${TC.formatINR(i.totalPaid, { compact: true })}`} valueLabel={`/ ${TC.formatINR(i.maturityValue, { compact: true })}`} />}
    </Card>
  );
}

function typeBadge(type) {
  return ({
    mutualFund:   { label: 'MUTUAL FUND', tone: 'accent' },
    lic:          { label: 'LIC', tone: 'info' },
    hdfcLife:     { label: 'HDFC LIFE', tone: 'info' },
    postalRd:     { label: 'POSTAL RD', tone: 'warn' },
    bankFd:       { label: 'BANK FD', tone: 'warn' },
    epf:          { label: 'EPF', tone: 'pending' },
    nps:          { label: 'NPS', tone: 'pending' },
    stock:        { label: 'STOCK', tone: 'gain' },
  })[type] || { label: type.toUpperCase(), tone: 'neutral' };
}

// ─── Transaction Table ─────────────────────────────────────────────────────
function TransactionTable({ theme = 'light', rows, dense, height }) {
  const tk = tkc(theme);
  const rowH = dense ? 32 : 40;
  return (
    <div style={{ background: tk.surface, border: `1px solid ${tk.border}`, borderRadius: TC.radius.md, overflow: 'hidden', height }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '90px 1fr 130px 110px 130px',
        padding: '0 16px', height: 32, alignItems: 'center', gap: 12,
        background: tk.surfaceAlt, borderBottom: `1px solid ${tk.border}`,
        fontSize: 10, fontWeight: 600, color: tk.inkMuted, letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: TC.type.sans,
      }}>
        <div>Date</div>
        <div>Description</div>
        <div>Category</div>
        <div>Account</div>
        <div style={{ textAlign: 'right' }}>Amount</div>
      </div>
      {rows.map((r, idx) => (
        <div key={idx} style={{
          display: 'grid', gridTemplateColumns: '90px 1fr 130px 110px 130px',
          padding: '0 16px', height: rowH, alignItems: 'center', gap: 12,
          borderBottom: idx < rows.length - 1 ? `1px solid ${tk.divider}` : 'none',
          fontSize: 13,
        }}>
          <div style={{ fontFamily: TC.type.mono, color: tk.inkMuted, fontSize: 12 }}>{TC.formatDate(r.date, { short: true })}</div>
          <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: tk.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.desc}</span>
            {r.matched && <Badge theme={theme} tone="accent">{r.matched}</Badge>}
          </div>
          <div><Badge theme={theme} tone={r.categoryTone || 'neutral'}>{r.category}</Badge></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: tk[r.accentKey || 'inkSubtle'] }} />
            <span style={{ color: tk.inkMuted, fontSize: 12, fontFamily: TC.type.mono }}>{r.account}</span>
          </div>
          <div style={{ textAlign: 'right', fontFamily: TC.type.mono, fontVariantNumeric: 'tabular-nums', color: r.dir === 'C' ? tk.gain : tk.ink, fontWeight: 500 }}>
            {r.dir === 'C' ? '+' : ''}{TC.formatINR(r.amount, { decimals: 2 })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Cashflow chart (SVG, 12-month bars) ───────────────────────────────────
function CashflowChart({ theme = 'light', data, height = 200, width = 600 }) {
  const tk = tkc(theme);
  const padL = 44, padR = 8, padT = 12, padB = 28;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const max = Math.max(...data.map(d => Math.max(d.income, d.outflow)));
  const ticks = 4;
  const barGroupW = innerW / data.length;
  const barW = Math.min(14, barGroupW * 0.35);

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {/* gridlines */}
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const y = padT + (innerH / ticks) * i;
        const v = max - (max / ticks) * i;
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={width - padR} y2={y} stroke={tk.divider} strokeDasharray="2 3" />
            <text x={padL - 6} y={y + 3} textAnchor="end" fill={tk.inkSubtle} fontFamily={TC.type.mono} fontSize="9">
              {v >= 100000 ? (v / 100000).toFixed(1) + 'L' : Math.round(v / 1000) + 'k'}
            </text>
          </g>
        );
      })}
      {/* bars */}
      {data.map((d, i) => {
        const cx = padL + barGroupW * (i + 0.5);
        const incH = (d.income / max) * innerH;
        const outH = (d.outflow / max) * innerH;
        return (
          <g key={i}>
            <rect x={cx - barW - 1} y={padT + innerH - incH} width={barW} height={incH} fill={tk.accent} rx="1.5" />
            <rect x={cx + 1} y={padT + innerH - outH} width={barW} height={outH} fill={tk.s4} opacity="0.85" rx="1.5" />
            <text x={cx} y={height - 8} textAnchor="middle" fill={tk.inkSubtle} fontFamily={TC.type.mono} fontSize="9">{d.month}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Projection chart (area + maturity marker) ─────────────────────────────
function ProjectionChart({ theme = 'light', data, width = 600, height = 200, maturityIdx }) {
  const tk = tkc(theme);
  const padL = 44, padR = 8, padT = 12, padB = 28;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const max = Math.max(...data.map(d => d.value));
  const stepX = innerW / (data.length - 1);
  const pts = data.map((d, i) => `${(padL + i * stepX).toFixed(2)},${(padT + innerH - (d.value / max) * innerH).toFixed(2)}`);
  const linePath = 'M' + pts.join(' L');
  const fillPath = linePath + ` L${padL + innerW},${padT + innerH} L${padL},${padT + innerH} Z`;
  const fillId = `pj-${Math.random().toString(36).slice(2,8)}`;

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={fillId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={tk.accent} stopOpacity="0.22" />
          <stop offset="100%" stopColor={tk.accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const y = padT + innerH * t;
        const v = max * (1 - t);
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={width - padR} y2={y} stroke={tk.divider} strokeDasharray="2 3" />
            <text x={padL - 6} y={y + 3} textAnchor="end" fill={tk.inkSubtle} fontFamily={TC.type.mono} fontSize="9">
              {v >= 1e7 ? (v / 1e7).toFixed(1) + 'Cr' : (v / 1e5).toFixed(1) + 'L'}
            </text>
          </g>
        );
      })}
      <path d={fillPath} fill={`url(#${fillId})`} />
      <path d={linePath} fill="none" stroke={tk.accent} strokeWidth="1.75" strokeLinejoin="round" />
      {data.filter((_, i) => i % Math.ceil(data.length / 6) === 0).map((d, i, a) => {
        const realI = data.indexOf(d);
        const x = padL + realI * stepX;
        return (
          <text key={i} x={x} y={height - 8} textAnchor="middle" fill={tk.inkSubtle} fontFamily={TC.type.mono} fontSize="9">{d.year}</text>
        );
      })}
      {maturityIdx != null && (
        <g>
          <line x1={padL + maturityIdx * stepX} y1={padT} x2={padL + maturityIdx * stepX} y2={padT + innerH} stroke={tk.warn} strokeDasharray="3 3" strokeWidth="1" />
          <circle cx={padL + maturityIdx * stepX} cy={padT + innerH - (data[maturityIdx].value / max) * innerH} r="3.5" fill={tk.warn} stroke={tk.surface} strokeWidth="1.5" />
        </g>
      )}
    </svg>
  );
}

// ─── Document upload + parse status ────────────────────────────────────────
function DocumentTile({ theme = 'light', doc }) {
  const tk = tkc(theme);
  const statusTone = doc.status === 'parsed' ? 'gain' : doc.status === 'failed' ? 'loss' : 'pending';
  const statusLabel = { parsed: 'Parsed', failed: 'Failed', pending: 'Pending' }[doc.status];
  return (
    <div style={{
      background: tk.surface, border: `1px solid ${tk.border}`,
      borderRadius: TC.radius.md, padding: 12, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: TC.radius.sm, background: tk.surfaceAlt, color: tk.inkMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {Icon.doc(14, tk.inkMuted)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: tk.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.name}</div>
          <div style={{ fontSize: 10, fontFamily: TC.type.mono, color: tk.inkSubtle, marginTop: 1 }}>{doc.size} · {doc.parser}</div>
        </div>
        {doc.locked && <span style={{ color: tk.inkSubtle }}>{Icon.lock(13, tk.inkSubtle)}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Badge theme={theme} tone={statusTone} dot>{statusLabel}</Badge>
        {doc.recordCount != null && (
          <span style={{ fontSize: 11, color: tk.inkMuted, fontFamily: TC.type.mono }}>
            {doc.recordCount} txns
          </span>
        )}
      </div>
    </div>
  );
}

function UploadZone({ theme = 'light' }) {
  const tk = tkc(theme);
  return (
    <div style={{
      border: `1.5px dashed ${tk.borderStrong}`, borderRadius: TC.radius.md,
      padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      background: tk.surfaceAlt,
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 999, background: tk.accentSoft, color: tk.accentInk, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {Icon.upload(18, tk.accentInk)}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: tk.ink }}>Drop bank or insurance statements</div>
      <div style={{ fontSize: 12, color: tk.inkMuted, textAlign: 'center', maxWidth: 320 }}>
        PDF or XLSX. Files are uploaded straight to your Google&nbsp;Drive — never to this app's servers.
      </div>
      <Button theme={theme} variant="secondary" size="sm" leadingIcon={Icon.drive(13, 'currentColor')}>
        Browse Drive
      </Button>
    </div>
  );
}

// ─── Side nav ──────────────────────────────────────────────────────────────
function SideNav({ theme = 'light', active = 'Dashboard' }) {
  const tk = tkc(theme);
  const items = [
    { label: 'Dashboard', glyph: '◇' },
    { label: 'Income', glyph: '↗' },
    { label: 'Outflows', glyph: '↘' },
    { label: 'Savings', glyph: '◈' },
    { label: 'Transactions', glyph: '≡' },
    { label: 'Documents', glyph: '▤' },
    { label: 'Monthly review', glyph: '✦' },
  ];
  return (
    <div style={{
      width: 220, background: tk.surface, borderRight: `1px solid ${tk.border}`,
      padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 4, height: '100%',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px 16px' }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: tk.accent, color: tk.inkOnAccent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: TC.type.sans, fontWeight: 700, fontSize: 14, letterSpacing: '-0.04em' }}>fd</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: tk.ink, letterSpacing: '-0.01em' }}>finance</div>
          <div style={{ fontSize: 10, color: tk.inkSubtle, fontFamily: TC.type.mono, marginTop: -2 }}>private · Drive</div>
        </div>
      </div>
      {items.map((it) => {
        const isActive = it.label === active;
        return (
          <div key={it.label} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px',
            borderRadius: TC.radius.md,
            background: isActive ? tk.accentSoft : 'transparent',
            color: isActive ? tk.accentInk : tk.inkMuted,
            fontSize: 13, fontWeight: isActive ? 600 : 500, cursor: 'pointer',
          }}>
            <span style={{ width: 16, textAlign: 'center', fontFamily: TC.type.mono, fontSize: 13 }}>{it.glyph}</span>
            {it.label}
          </div>
        );
      })}
      <div style={{ flex: 1 }} />
      <div style={{ padding: 12, border: `1px solid ${tk.border}`, borderRadius: TC.radius.md, fontSize: 11, color: tk.inkMuted, lineHeight: 1.5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          {Icon.lock(12, tk.inkMuted)}
          <span style={{ fontWeight: 600, color: tk.ink, fontSize: 12 }}>End-to-end private</span>
        </div>
        Your statements stay in your Drive. Nothing is sent to the dashboard's servers.
      </div>
    </div>
  );
}

// ─── Top toolbar ───────────────────────────────────────────────────────────
function TopBar({ theme = 'light', title, subtitle, period }) {
  const tk = tkc(theme);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 24px', borderBottom: `1px solid ${tk.border}`, background: tk.bg,
    }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 600, color: tk.ink, letterSpacing: '-0.015em', lineHeight: 1.15 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: tk.inkMuted, marginTop: 2 }}>{subtitle}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {period && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
            background: tk.surface, border: `1px solid ${tk.border}`, borderRadius: TC.radius.md,
            fontSize: 12, color: tk.ink, fontFamily: TC.type.mono,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: tk.accent }} />
            {period}
          </div>
        )}
        <Button theme={theme} variant="secondary" size="sm" leadingIcon={Icon.upload(13)}>Upload</Button>
        <Button theme={theme} variant="primary" size="sm" leadingIcon={Icon.spark(13)}>Run review</Button>
      </div>
    </div>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────
function EmptyState({ theme = 'light', title, body, action }) {
  const tk = tkc(theme);
  return (
    <div style={{
      border: `1px dashed ${tk.borderStrong}`, borderRadius: TC.radius.md,
      padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      textAlign: 'center', background: tk.surfaceAlt,
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: tk.ink }}>{title}</div>
      <div style={{ fontSize: 12, color: tk.inkMuted, maxWidth: 280, textWrap: 'pretty' }}>{body}</div>
      {action}
    </div>
  );
}

Object.assign(window, {
  KPICard, SavingsCard, TransactionTable, CashflowChart, ProjectionChart,
  DocumentTile, UploadZone, SideNav, TopBar, EmptyState,
});
