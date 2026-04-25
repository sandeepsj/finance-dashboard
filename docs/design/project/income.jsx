// income.jsx — Income page artboards.
// Three views:
//   IncomeDesktopA  — canonical: KPI strip + streams list + annual calendar
//   IncomeDesktopB  — editorial: hero "expected this month", stream cards as a vertical stream
//   IncomeMobile    — compact phone view of A

const TI = window.FDTokens;
function tki(theme) { return theme === 'dark' ? TI.dark : TI.light; }

// ---- shared mock data ----
const STREAMS = [
  { id: 's1', type: 'salary',   label: 'Juspay · Engineering',         amount: 184200, frequency: 'monthly', day: 1,  ytd: 1657800, last: '2026-04-01', next: '2026-05-01', confidence: 'high', accentKey: 's1' },
  { id: 's2', type: 'pension',  label: 'Family pension share',         amount: 18400,  frequency: 'monthly', day: 16, ytd: 165600,  last: '2026-04-16', next: '2026-05-16', confidence: 'high', accentKey: 's2', note: 'Credited 16th every month — RBI clearing window' },
  { id: 's3', type: 'rental',   label: '2BHK · Whitefield',            amount: 28000,  frequency: 'monthly', day: 5,  ytd: 252000,  last: '2026-04-05', next: '2026-05-05', confidence: 'medium', accentKey: 's3', note: 'Tenant occasionally pays late — track Apr 2026' },
  { id: 's4', type: 'insurance-payout', label: 'LIC Money-back · Survival benefit', amount: 50000, frequency: 'yearly', day: null, ytd: 50000, last: '2025-08-12', next: '2026-08-12', confidence: 'high', accentKey: 's4' },
  { id: 's5', type: 'reimbursement', label: 'Travel reimbursement · variable', amount: 12400, frequency: 'one-time', day: null, ytd: 38600, last: '2026-03-22', next: null, confidence: 'low', accentKey: 's5', note: 'Variable — based on quarterly travel' },
];

const TYPE_BADGE = {
  salary:           { label: 'SALARY',         tone: 'accent' },
  pension:          { label: 'PENSION',        tone: 'info' },
  rental:           { label: 'RENTAL',         tone: 'warn' },
  'insurance-payout':{ label: 'INSURANCE',     tone: 'gain' },
  reimbursement:    { label: 'REIMBURSEMENT',  tone: 'pending' },
  other:            { label: 'OTHER',          tone: 'neutral' },
};

const FREQ_LABEL = {
  monthly: 'Monthly', quarterly: 'Quarterly', 'half-yearly': 'Half-yearly', yearly: 'Yearly', 'one-time': 'Variable',
};

// monthly equivalent for any frequency (for KPI math)
function monthlyEquivalent(s) {
  switch (s.frequency) {
    case 'monthly': return s.amount;
    case 'quarterly': return s.amount / 3;
    case 'half-yearly': return s.amount / 6;
    case 'yearly': return s.amount / 12;
    default: return 0;
  }
}

// ---- shared little subcomponents ----
function StreamRow({ theme, s }) {
  const tk = tki(theme);
  const tb = TYPE_BADGE[s.type];
  const monthlyEq = monthlyEquivalent(s);
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '24px 1fr 120px 90px 130px',
      alignItems: 'center', gap: 14,
      padding: '14px 16px',
      borderBottom: `1px solid ${tk.divider}`,
    }}>
      <span style={{ width: 8, height: 8, borderRadius: 999, background: tk[s.accentKey] }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: tk.ink }}>{s.label}</span>
          <Badge theme={theme} tone={tb.tone}>{tb.label}</Badge>
          {s.confidence === 'low' && <Badge theme={theme} tone="warn" dot>Variable</Badge>}
        </div>
        <div style={{ fontSize: 11, color: tk.inkMuted, fontFamily: TI.type.mono }}>
          {FREQ_LABEL[s.frequency]}{s.day ? ` · day ${s.day}` : ''} · last {TI.formatDate(s.last, { short: true })}
          {s.next && <> · next {TI.formatDate(s.next, { short: true })}</>}
        </div>
      </div>
      <div style={{ fontFamily: TI.type.mono, fontSize: 14, color: tk.ink, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
        {TI.formatINR(s.amount)}
      </div>
      <div style={{ fontFamily: TI.type.mono, fontSize: 11, color: tk.inkSubtle, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
        {s.frequency !== 'monthly' && s.frequency !== 'one-time' ? `≈${TI.formatINR(Math.round(monthlyEq))}/mo` : ''}
      </div>
      <div style={{ fontFamily: TI.type.mono, fontSize: 12, color: tk.inkMuted, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
        YTD {TI.formatINR(s.ytd, { compact: true })}
      </div>
    </div>
  );
}

// 12-month calendar dot grid: shows each stream's expected/actual hits across the year
function YearGrid({ theme }) {
  const tk = tki(theme);
  const months = ['May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr'];
  // rows = streams, columns = months. dot color encodes type.
  return (
    <div style={{ background: tk.surface, border: `1px solid ${tk.border}`, borderRadius: TI.radius.md, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: tk.inkMuted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Annual cadence</div>
          <div style={{ fontSize: 13, color: tk.ink, marginTop: 2 }}>Expected income hits, last 12 months</div>
        </div>
        <div style={{ fontSize: 11, color: tk.inkSubtle, fontFamily: TI.type.mono }}>● received  ◯ expected</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '180px repeat(12, 1fr)', gap: 6, alignItems: 'center' }}>
        <div />
        {months.map((m, i) => (
          <div key={m} style={{ fontSize: 10, fontFamily: TI.type.mono, color: tk.inkSubtle, textAlign: 'center', letterSpacing: '0.04em' }}>{m}</div>
        ))}

        {STREAMS.map((s) => {
          const cells = months.map((m, idx) => {
            // monthly: every cell. yearly: only the matching month (last hit aug -> Aug).
            // one-time: scatter
            let kind = null;
            if (s.frequency === 'monthly') kind = idx <= 11 ? 'past' : 'future';
            else if (s.frequency === 'yearly') {
              if (m === 'Aug') kind = 'past';
            } else if (s.frequency === 'one-time') {
              if (m === 'Sep' || m === 'Dec' || m === 'Mar') kind = 'past';
            }
            // mark April (last col) as 'expected' for monthly to show partial
            if (s.frequency === 'monthly' && idx === 11) kind = 'past';
            return kind;
          });
          return (
            <React.Fragment key={s.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: tk.ink, minWidth: 0 }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: tk[s.accentKey] }} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.label}</span>
              </div>
              {cells.map((c, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'center' }}>
                  {c === 'past' && <span style={{ width: 8, height: 8, borderRadius: 999, background: tk[s.accentKey] }} />}
                  {c === 'future' && <span style={{ width: 8, height: 8, borderRadius: 999, border: `1.25px solid ${tk[s.accentKey]}` }} />}
                  {!c && <span style={{ width: 8, height: 8, borderRadius: 999, background: tk.divider }} />}
                </div>
              ))}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// stacked-bar showing composition of monthly income by stream
function CompositionBar({ theme, height = 12 }) {
  const tk = tki(theme);
  const total = STREAMS.reduce((sum, s) => sum + monthlyEquivalent(s), 0);
  const segments = STREAMS.filter(s => monthlyEquivalent(s) > 0).map(s => ({
    label: s.label, value: monthlyEquivalent(s), pct: (monthlyEquivalent(s) / total) * 100, color: tk[s.accentKey], type: s.type,
  }));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', height, borderRadius: 999, overflow: 'hidden', background: tk.surfaceAlt }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ width: `${seg.pct}%`, background: seg.color }} title={`${seg.label} · ${seg.pct.toFixed(1)}%`} />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 11 }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: tk.inkMuted }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: seg.color }} />
            <span style={{ color: tk.ink }}>{TYPE_BADGE[seg.type].label.toLowerCase()}</span>
            <span style={{ fontFamily: TI.type.mono, fontVariantNumeric: 'tabular-nums' }}>{seg.pct.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =========================================================================
// IncomeDesktopA — canonical
// =========================================================================
function IncomeDesktopA({ theme = 'light' }) {
  const tk = tki(theme);
  const monthlyTotal = STREAMS.reduce((s, x) => s + monthlyEquivalent(x), 0);
  const annualTotal = STREAMS.reduce((s, x) => {
    if (x.frequency === 'monthly') return s + x.amount * 12;
    if (x.frequency === 'quarterly') return s + x.amount * 4;
    if (x.frequency === 'half-yearly') return s + x.amount * 2;
    if (x.frequency === 'yearly') return s + x.amount;
    if (x.frequency === 'one-time') return s + x.ytd;
    return s;
  }, 0);
  const aprilReceived = 184200 + 18400 + 28000;
  const aprilExpected = STREAMS.filter(s => s.frequency === 'monthly').reduce((a, b) => a + b.amount, 0);

  return (
    <div style={{ background: tk.bg, color: tk.ink, fontFamily: TI.type.sans, display: 'flex', height: '100%', minWidth: 0 }}>
      <SideNav theme={theme} active="Income" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar theme={theme} title="Income" subtitle="5 streams · monthly equivalent ₹2,72,800 · last credit 16/04" period="Apr 2026" />
        <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden', minWidth: 0 }}>

          {/* Top KPI strip */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 12 }}>
            {/* Hero card: April received / expected */}
            <Card theme={theme} padding={16} style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: tk.inkMuted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>April · received</div>
                <Badge theme={theme} tone="gain" dot>3 of 5 in</Badge>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontFamily: TI.type.mono, fontSize: 32, fontWeight: 500, color: tk.ink, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1.05 }}>
                  {TI.formatINR(aprilReceived)}
                </span>
                <span style={{ fontFamily: TI.type.mono, fontSize: 13, color: tk.inkSubtle, fontVariantNumeric: 'tabular-nums' }}>
                  / {TI.formatINR(aprilExpected)} expected
                </span>
              </div>
              <Progress theme={theme} value={aprilReceived} max={aprilExpected} tone="accent" height={6} />
              <div style={{ fontSize: 11, color: tk.inkMuted }}>
                Pending: <span style={{ fontFamily: TI.type.mono }}>Travel reimbursement</span>
              </div>
            </Card>

            <KPICard theme={theme} label="Monthly equivalent" value={TI.formatINR(monthlyTotal)} delta={4.2} deltaLabel="vs March" sparkData={[230,232,238,245,248,252,260,265,268,270,272,273]} sparkColor={tk.accent} />
            <KPICard theme={theme} label="Annual run rate" value={TI.formatINR(annualTotal, { compact: true })} delta={3.1} deltaLabel="YoY" sparkData={[28,29,30,30,31,31,31,32,32,32,33,33]} sparkColor={tk.s2} />
            <KPICard theme={theme} label="Active streams" value="5" delta={null} deltaLabel="" footer="2 variable · 3 fixed" />
          </div>

          {/* Composition + main streams list */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, minHeight: 0 }}>
            <Card theme={theme} padding={0} style={{ overflow: 'hidden', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: tk.inkMuted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Streams</div>
                  <div style={{ fontSize: 13, color: tk.ink, marginTop: 2 }}>5 active · sorted by monthly value</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button theme={theme} variant="ghost" size="sm" leadingIcon={Icon.filter(13)}>All types</Button>
                  <Button theme={theme} variant="primary" size="sm" leadingIcon={Icon.plus(13)}>Add stream</Button>
                </div>
              </div>
              <div style={{
                display: 'grid', gridTemplateColumns: '24px 1fr 120px 90px 130px',
                padding: '0 16px', height: 30, alignItems: 'center', gap: 14,
                background: tk.surfaceAlt, borderTop: `1px solid ${tk.border}`, borderBottom: `1px solid ${tk.border}`,
                fontSize: 10, fontWeight: 600, color: tk.inkMuted, letterSpacing: '0.05em', textTransform: 'uppercase',
              }}>
                <div />
                <div>Stream</div>
                <div style={{ textAlign: 'right' }}>Amount</div>
                <div style={{ textAlign: 'right' }}>Mo eq.</div>
                <div style={{ textAlign: 'right' }}>YTD</div>
              </div>
              {STREAMS.map((s) => <StreamRow key={s.id} theme={theme} s={s} />)}
            </Card>

            <Card theme={theme} padding={16} style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: tk.inkMuted, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8 }}>Composition · monthly equivalent</div>
                <CompositionBar theme={theme} />
              </div>
              <div style={{ borderTop: `1px solid ${tk.divider}`, paddingTop: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: tk.inkMuted, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8 }}>Notes & flags</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <Badge theme={theme} tone="warn" dot>Late</Badge>
                    <span style={{ fontSize: 12, color: tk.ink, lineHeight: 1.5 }}>April rent not yet received — tenant typically pays by the 5th.</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <Badge theme={theme} tone="info" dot>Upcoming</Badge>
                    <span style={{ fontSize: 12, color: tk.ink, lineHeight: 1.5 }}>LIC survival benefit ₹50,000 expected 12/08/2026.</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <Badge theme={theme} tone="pending" dot>Variable</Badge>
                    <span style={{ fontSize: 12, color: tk.ink, lineHeight: 1.5 }}>Travel reimbursement is irregular — last 90d trend shown.</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Annual cadence */}
          <YearGrid theme={theme} />
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// IncomeDesktopB — editorial / stream-focused
// =========================================================================
function IncomeDesktopB({ theme = 'light' }) {
  const tk = tki(theme);
  const monthlyTotal = STREAMS.reduce((s, x) => s + monthlyEquivalent(x), 0);

  return (
    <div style={{ background: tk.bg, color: tk.ink, fontFamily: TI.type.sans, display: 'flex', height: '100%', minWidth: 0 }}>
      <SideNav theme={theme} active="Income" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar theme={theme} title="Income" subtitle="The five streams that paid you this year" period="Apr 2026" />
        <div style={{ flex: 1, padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 24, overflow: 'auto', minWidth: 0 }}>

          {/* Editorial hero */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontFamily: TI.type.mono, fontSize: 11, color: tk.inkSubtle, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>This month · expected</div>
              <div style={{ fontFamily: TI.type.mono, fontSize: 48, fontWeight: 500, letterSpacing: '-0.025em', color: tk.ink, lineHeight: 1, fontVariantNumeric: 'tabular-nums', marginBottom: 8 }}>
                {TI.formatINR(monthlyTotal)}
              </div>
              <div style={{ fontSize: 14, color: tk.inkMuted, lineHeight: 1.5, maxWidth: 540, textWrap: 'pretty' }}>
                Across <span style={{ color: tk.ink, fontWeight: 600 }}>5 streams</span>. Salary, family pension and rent fall on fixed days; LIC pays once a year; travel reimbursements are irregular. <Delta theme={theme} value={4.2} size={14} /> vs last month.
              </div>
            </div>
            <CompositionBar theme={theme} height={16} />
          </div>

          {/* Stream cards · vertical stream */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {STREAMS.map((s) => {
              const tb = TYPE_BADGE[s.type];
              return (
                <Card key={s.id} theme={theme} padding={0} style={{ overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '6px 1fr 200px 160px', minHeight: 88 }}>
                    <div style={{ background: tk[s.accentKey] }} />
                    <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Badge theme={theme} tone={tb.tone}>{tb.label}</Badge>
                        <span style={{ fontFamily: TI.type.mono, fontSize: 11, color: tk.inkSubtle, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                          {FREQ_LABEL[s.frequency]}{s.day ? ` · day ${s.day}` : ''}
                        </span>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: tk.ink, letterSpacing: '-0.005em' }}>{s.label}</div>
                      {s.note && <div style={{ fontSize: 12, color: tk.inkMuted, lineHeight: 1.5 }}>{s.note}</div>}
                      <div style={{ fontFamily: TI.type.mono, fontSize: 11, color: tk.inkSubtle, marginTop: 2 }}>
                        last {TI.formatDate(s.last, { short: true })}{s.next && <> · next {TI.formatDate(s.next, { short: true })}</>}
                      </div>
                    </div>
                    <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4, borderLeft: `1px solid ${tk.divider}` }}>
                      <div style={{ fontSize: 10, color: tk.inkSubtle, fontFamily: TI.type.mono, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Per occurrence</div>
                      <div style={{ fontFamily: TI.type.mono, fontSize: 22, fontWeight: 500, color: tk.ink, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{TI.formatINR(s.amount)}</div>
                      {s.frequency !== 'monthly' && s.frequency !== 'one-time' && (
                        <div style={{ fontSize: 11, color: tk.inkMuted, fontFamily: TI.type.mono }}>≈ {TI.formatINR(Math.round(monthlyEquivalent(s)))}/mo</div>
                      )}
                    </div>
                    <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4, borderLeft: `1px solid ${tk.divider}`, background: tk.surfaceAlt }}>
                      <div style={{ fontSize: 10, color: tk.inkSubtle, fontFamily: TI.type.mono, letterSpacing: '0.04em', textTransform: 'uppercase' }}>YTD</div>
                      <div style={{ fontFamily: TI.type.mono, fontSize: 18, fontWeight: 500, color: tk.ink, fontVariantNumeric: 'tabular-nums' }}>{TI.formatINR(s.ytd, { compact: true })}</div>
                      <div style={{ fontSize: 11, color: tk.inkMuted }}>{s.confidence === 'high' ? 'Reliable' : s.confidence === 'medium' ? 'Mostly on time' : 'Irregular'}</div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// IncomeMobile (390 wide)
// =========================================================================
function IncomeMobile({ theme = 'light' }) {
  const tk = tki(theme);
  const monthlyTotal = STREAMS.reduce((s, x) => s + monthlyEquivalent(x), 0);
  const aprilReceived = 184200 + 18400 + 28000;

  return (
    <div style={{ background: tk.bg, color: tk.ink, fontFamily: TI.type.sans, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* App bar */}
      <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${tk.border}`, background: tk.bg }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 18, color: tk.inkMuted }}>‹</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: tk.ink }}>Income</span>
          <span style={{ fontSize: 18, color: tk.inkMuted }}>+</span>
        </div>
        <div style={{ fontFamily: TI.type.mono, fontSize: 10, color: tk.inkSubtle, letterSpacing: '0.06em', textTransform: 'uppercase' }}>April 2026</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Hero */}
        <Card theme={theme} padding={16} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: tk.inkMuted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>This month · received</div>
          <div style={{ fontFamily: TI.type.mono, fontSize: 30, fontWeight: 500, color: tk.ink, letterSpacing: '-0.02em', lineHeight: 1.05, fontVariantNumeric: 'tabular-nums' }}>
            {TI.formatINR(aprilReceived)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Delta theme={theme} value={4.2} size={12} />
            <span style={{ fontSize: 11, color: tk.inkMuted }}>vs March · {TI.formatINR(monthlyTotal)} expected</span>
          </div>
          <Progress theme={theme} value={aprilReceived} max={monthlyTotal} tone="accent" height={5} />
        </Card>

        {/* Composition mini */}
        <Card theme={theme} padding={14} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: tk.inkMuted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Composition</div>
          <CompositionBar theme={theme} height={10} />
        </Card>

        {/* Streams list — phone-tuned */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {STREAMS.map((s) => {
            const tb = TYPE_BADGE[s.type];
            return (
              <Card key={s.id} theme={theme} padding={0} style={{ overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '4px 1fr', minHeight: 72 }}>
                  <div style={{ background: tk[s.accentKey] }} />
                  <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                        <Badge theme={theme} tone={tb.tone}>{tb.label}</Badge>
                      </div>
                      <span style={{ fontFamily: TI.type.mono, fontSize: 14, fontWeight: 500, color: tk.ink, fontVariantNumeric: 'tabular-nums' }}>
                        {TI.formatINR(s.amount)}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: tk.ink, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.label}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: tk.inkMuted, fontFamily: TI.type.mono }}>
                      <span>{FREQ_LABEL[s.frequency]}{s.day ? ` · ${s.day}` : ''}</span>
                      <span>YTD {TI.formatINR(s.ytd, { compact: true })}</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Bottom tab bar */}
      <div style={{ display: 'flex', borderTop: `1px solid ${tk.border}`, background: tk.surface, padding: '8px 0 14px' }}>
        {['Home', 'Income', 'Save', 'Docs', 'More'].map((l, i) => {
          const active = l === 'Income';
          return (
            <div key={l} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 4, height: 4, borderRadius: 999, background: active ? tk.accent : 'transparent' }} />
              <span style={{ fontSize: 11, fontWeight: active ? 600 : 500, color: active ? tk.ink : tk.inkSubtle }}>{l}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { IncomeDesktopA, IncomeDesktopB, IncomeMobile });
