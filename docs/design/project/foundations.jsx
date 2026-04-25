// foundations.jsx — token visualizations for the design canvas.
// Exports panel components onto window.

const { useMemo } = React;

const T = window.FDTokens;

// Theme is read from a data-theme attribute on the artboard root or body.
// Each artboard wraps its content in <ThemeFrame theme="light|dark">.

function ThemeFrame({ theme = 'light', children, padding = 24, style }) {
  const tk = theme === 'dark' ? T.dark : T.light;
  return (
    <div
      data-theme={theme}
      style={{
        background: tk.bg,
        color: tk.ink,
        fontFamily: T.type.sans,
        padding,
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        fontFeatureSettings: '"cv11", "ss01"',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Color palette ──────────────────────────────────────────────────────────
function Swatch({ name, value, ink, label, tk }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
      <div
        style={{
          background: value,
          border: `1px solid ${tk.border}`,
          borderRadius: T.radius.md,
          height: 56,
          display: 'flex',
          alignItems: 'flex-end',
          padding: 8,
          color: ink || tk.ink,
          fontFamily: T.type.mono,
          fontSize: 10,
        }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: tk.ink }}>{name}</div>
        <div style={{ fontSize: 10, fontFamily: T.type.mono, color: tk.inkSubtle, lineHeight: 1.3 }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function ColorPanel({ theme = 'light' }) {
  const tk = theme === 'dark' ? T.dark : T.light;
  const groups = [
    {
      title: 'Surfaces',
      items: [
        { name: 'bg', key: 'bg' },
        { name: 'surface', key: 'surface' },
        { name: 'surfaceAlt', key: 'surfaceAlt' },
        { name: 'border', key: 'border' },
        { name: 'borderStrong', key: 'borderStrong' },
        { name: 'divider', key: 'divider' },
      ],
    },
    {
      title: 'Ink',
      items: [
        { name: 'ink', key: 'ink' },
        { name: 'inkMuted', key: 'inkMuted' },
        { name: 'inkSubtle', key: 'inkSubtle' },
      ],
    },
    {
      title: 'Accent — muted forest',
      items: [
        { name: 'accent', key: 'accent', label: 'AA' },
        { name: 'accentHover', key: 'accentHover', label: 'AA' },
        { name: 'accentSoft', key: 'accentSoft' },
        { name: 'accentInk', key: 'accentInk' },
      ],
    },
    {
      title: 'Semantic',
      items: [
        { name: 'gain', key: 'gain' },
        { name: 'gainSoft', key: 'gainSoft' },
        { name: 'loss', key: 'loss' },
        { name: 'lossSoft', key: 'lossSoft' },
        { name: 'warn', key: 'warn' },
        { name: 'warnSoft', key: 'warnSoft' },
        { name: 'info', key: 'info' },
        { name: 'infoSoft', key: 'infoSoft' },
        { name: 'pending', key: 'pending' },
        { name: 'pendingSoft', key: 'pendingSoft' },
      ],
    },
    {
      title: 'Chart series',
      items: [
        { name: 's1 · primary', key: 's1' },
        { name: 's2 · info', key: 's2' },
        { name: 's3 · warn', key: 's3' },
        { name: 's4 · loss', key: 's4' },
        { name: 's5 · accent', key: 's5' },
      ],
    },
  ];

  return (
    <ThemeFrame theme={theme}>
      <PanelHeader
        kicker={theme === 'dark' ? 'COLOR · DARK' : 'COLOR · LIGHT'}
        title="Palette"
        subtitle="Warm-neutral surfaces, muted forest accent. All values authored in oklch."
        tk={tk}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {groups.map((g) => (
          <div key={g.title}>
            <SectionLabel tk={tk}>{g.title}</SectionLabel>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, minmax(0,1fr))',
                gap: 12,
              }}
            >
              {g.items.map((it) => (
                <Swatch key={it.key} name={it.name} value={tk[it.key]} label={it.label} tk={tk} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </ThemeFrame>
  );
}

// ─── Typography ─────────────────────────────────────────────────────────────
function TypePanel({ theme = 'light' }) {
  const tk = theme === 'dark' ? T.dark : T.light;
  const styles = [
    ['display', 'Display · ₹12,34,567', T.type.display, T.type.sans],
    ['title', 'Title · Monthly Review', T.type.title, T.type.sans],
    ['heading', 'Heading · Savings instruments', T.type.heading, T.type.sans],
    ['subheading', 'Subheading · HDFC Regalia Gold', T.type.subheading, T.type.sans],
    ['body', 'Body · Total committed outflow this month is ₹1,42,800 across 14 obligations.', T.type.body, T.type.sans],
    ['bodySm', 'Body sm · Auto-debited on the 16th of each month.', T.type.bodySm, T.type.sans],
    ['caption', 'Caption · Last parsed 16/04/2026', T.type.caption, T.type.sans],
    ['micro', 'MICRO · OBLIGATION · AUTO-DEBIT', T.type.micro, T.type.sans],
    ['metric', '₹12,34,567', T.type.metric, T.type.mono],
    ['metricSm', '₹84,200.50', T.type.metricSm, T.type.mono],
  ];

  return (
    <ThemeFrame theme={theme}>
      <PanelHeader
        kicker="TYPOGRAPHY"
        title="Type scale"
        subtitle="Inter for UI, JetBrains Mono for all numbers, masks, and codes. Mono numbers are tabular for column alignment."
        tk={tk}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '120px 1fr 200px',
          rowGap: 18,
          columnGap: 16,
          alignItems: 'baseline',
        }}
      >
        {styles.map(([name, sample, spec, fam]) => (
          <React.Fragment key={name}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{name}</div>
              <div style={{ fontSize: 10, fontFamily: T.type.mono, color: tk.inkSubtle }}>
                {fam === T.type.mono ? 'mono' : 'sans'}
              </div>
            </div>
            <div
              style={{
                fontFamily: fam,
                fontSize: spec.size,
                lineHeight: spec.lh,
                fontWeight: spec.weight,
                letterSpacing: spec.tracking,
                fontVariantNumeric: fam === T.type.mono ? 'tabular-nums' : 'normal',
                color: tk.ink,
              }}
            >
              {sample}
            </div>
            <div style={{ fontFamily: T.type.mono, fontSize: 10, color: tk.inkSubtle, lineHeight: 1.5 }}>
              {spec.size}px / {spec.lh} · {spec.weight}
              <br />
              tracking {spec.tracking}
            </div>
          </React.Fragment>
        ))}
      </div>
    </ThemeFrame>
  );
}

// ─── Spacing / Radius / Elevation ──────────────────────────────────────────
function SpacingPanel({ theme = 'light' }) {
  const tk = theme === 'dark' ? T.dark : T.light;
  const elev = theme === 'dark' ? T.elevDark : T.elev;
  return (
    <ThemeFrame theme={theme}>
      <PanelHeader
        kicker="SPACING · RADIUS · ELEVATION"
        title="Layout primitives"
        subtitle="4px spacing base. Radius 6px default — subtle, not pillowy. Soft warm-tinted shadows."
        tk={tk}
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        <div>
          <SectionLabel tk={tk}>Spacing scale</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(T.space).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 28, fontFamily: T.type.mono, fontSize: 11, color: tk.inkMuted }}>
                  {k}
                </div>
                <div style={{ width: 48, fontFamily: T.type.mono, fontSize: 11, color: tk.ink }}>
                  {v}px
                </div>
                <div style={{ height: 12, width: v, background: tk.accent, borderRadius: 2 }} />
              </div>
            ))}
          </div>
        </div>
        <div>
          <SectionLabel tk={tk}>Radius</SectionLabel>
          <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
            {Object.entries(T.radius).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    background: tk.accentSoft,
                    border: `1px solid ${tk.accent}`,
                    borderRadius: v === 999 ? 999 : v,
                  }}
                />
                <div style={{ fontFamily: T.type.mono, fontSize: 10, color: tk.ink }}>{k}</div>
                <div style={{ fontFamily: T.type.mono, fontSize: 10, color: tk.inkSubtle }}>
                  {v === 999 ? '∞' : v + 'px'}
                </div>
              </div>
            ))}
          </div>
          <SectionLabel tk={tk}>Elevation</SectionLabel>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {Object.entries(elev).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    background: tk.surface,
                    border: `1px solid ${tk.border}`,
                    borderRadius: T.radius.md,
                    boxShadow: v,
                  }}
                />
                <div style={{ fontFamily: T.type.mono, fontSize: 10, color: tk.ink }}>elev.{k}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ThemeFrame>
  );
}

// ─── Locale / number formatting ────────────────────────────────────────────
function LocalePanel({ theme = 'light' }) {
  const tk = theme === 'dark' ? T.dark : T.light;
  const cell = (label, value) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: 10, color: tk.inkSubtle, fontFamily: T.type.mono, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: T.type.mono, fontSize: 14, color: tk.ink, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
  return (
    <ThemeFrame theme={theme}>
      <PanelHeader
        kicker="LOCALE · INR · DATES"
        title="Number & date formatting"
        subtitle="Indian numbering system (12,34,567), DD/MM/YYYY dates, lakh / crore for compact display, sign-prefixed deltas."
        tk={tk}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 24 }}>
        {cell('Standard', T.formatINR(1234567))}
        {cell('With paise', T.formatINR(84200.5, { decimals: 2 }))}
        {cell('Compact · L', T.formatINR(1234567, { compact: true }))}
        {cell('Compact · Cr', T.formatINR(24500000, { compact: true }))}
        {cell('Negative', T.formatINR(-12500))}
        {cell('Zero', T.formatINR(0))}
      </div>
      <SectionLabel tk={tk}>Dates</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 24 }}>
        {cell('Long', T.formatDate('2026-04-16'))}
        {cell('Short', T.formatDate('2026-04-16', { short: true }))}
        {cell('Maturity', T.formatDate('2042-08-12'))}
      </div>
      <SectionLabel tk={tk}>Deltas</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 10, color: tk.inkSubtle, fontFamily: T.type.mono, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Gain</div>
          <div style={{ fontFamily: T.type.mono, fontSize: 14, color: tk.gain, fontVariantNumeric: 'tabular-nums' }}>{T.formatPercent(12.4)}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 10, color: tk.inkSubtle, fontFamily: T.type.mono, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Loss</div>
          <div style={{ fontFamily: T.type.mono, fontSize: 14, color: tk.loss, fontVariantNumeric: 'tabular-nums' }}>{T.formatPercent(-3.8)}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 10, color: tk.inkSubtle, fontFamily: T.type.mono, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Flat</div>
          <div style={{ fontFamily: T.type.mono, fontSize: 14, color: tk.inkMuted, fontVariantNumeric: 'tabular-nums' }}>{T.formatPercent(0)}</div>
        </div>
      </div>
    </ThemeFrame>
  );
}

// ─── shared little bits ────────────────────────────────────────────────────
function PanelHeader({ kicker, title, subtitle, tk }) {
  return (
    <div style={{ marginBottom: 28, maxWidth: 720 }}>
      <div style={{ fontFamily: T.type.mono, fontSize: 10, letterSpacing: '0.08em', color: tk.inkSubtle, marginBottom: 6 }}>
        {kicker}
      </div>
      <div style={{ fontSize: T.type.title.size, fontWeight: 600, lineHeight: 1.15, letterSpacing: '-0.015em', color: tk.ink, marginBottom: 6 }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: 14, lineHeight: 1.5, color: tk.inkMuted, textWrap: 'pretty' }}>{subtitle}</div>
      )}
    </div>
  );
}
function SectionLabel({ tk, children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: tk.inkMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
      {children}
    </div>
  );
}

Object.assign(window, { ThemeFrame, ColorPanel, TypePanel, SpacingPanel, LocalePanel, PanelHeader, SectionLabel });
