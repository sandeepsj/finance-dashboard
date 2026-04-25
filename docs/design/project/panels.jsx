// panels.jsx — artboard contents for the design canvas.
// Each *Panel renders one component category in a fixed-size frame.

const TPN = window.FDTokens;
function tkp(theme) { return theme === 'dark' ? TPN.dark : TPN.light; }

// ─── Buttons / Inputs / Badges ────────────────────────────────────────────
function ControlsPanel({ theme = 'light' }) {
  const tk = tkp(theme);
  return (
    <ThemeFrame theme={theme}>
      <PanelHeader kicker="CONTROLS" title="Buttons, inputs, badges" subtitle="The atomic kit. Buttons sit on a 32px grid; soft and ghost variants for chrome density." tk={tk} />

      <SectionLabel tk={tk}>Buttons · variants</SectionLabel>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <Button theme={theme} variant="primary">Run monthly review</Button>
        <Button theme={theme} variant="secondary" leadingIcon={Icon.upload(13)}>Upload statement</Button>
        <Button theme={theme} variant="soft">Re-categorise</Button>
        <Button theme={theme} variant="ghost">Cancel</Button>
        <Button theme={theme} variant="danger">Delete folio</Button>
        <Button theme={theme} variant="primary" disabled>Disabled</Button>
      </div>

      <SectionLabel tk={tk}>Buttons · sizes</SectionLabel>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 24 }}>
        <Button theme={theme} variant="primary" size="sm">Small</Button>
        <Button theme={theme} variant="primary" size="md">Medium</Button>
        <Button theme={theme} variant="primary" size="lg">Large</Button>
      </div>

      <SectionLabel tk={tk}>Inputs</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
        <Input theme={theme} label="Folio number" value="GR-1429-7752-A" mono />
        <Input theme={theme} label="Sum assured" value="5,00,000" prefix="₹" mono />
        <Input theme={theme} label="Premium frequency" value="Yearly" suffix="▾" />
        <Input theme={theme} label="Maturity date" placeholder="DD / MM / YYYY" mono />
        <Input theme={theme} label="Account password" value="••••••••" mono hint="Required for HDFC bank PDF" />
        <Input theme={theme} label="XIRR" value="12.4" suffix="%" mono error hint="Above expected range — verify" />
      </div>

      <SectionLabel tk={tk}>Badges · semantics</SectionLabel>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <Badge theme={theme} tone="accent" dot>Auto-debit</Badge>
        <Badge theme={theme} tone="gain" dot>Parsed</Badge>
        <Badge theme={theme} tone="loss" dot>Failed</Badge>
        <Badge theme={theme} tone="warn" dot>Maturity due</Badge>
        <Badge theme={theme} tone="info" dot>Survival benefit</Badge>
        <Badge theme={theme} tone="pending" dot>Awaiting upload</Badge>
        <Badge theme={theme} tone="neutral">SIP</Badge>
        <Badge theme={theme} tone="neutral">EMI · 18 of 60</Badge>
      </div>

      <SectionLabel tk={tk}>Tabs · pages</SectionLabel>
      <Tabs theme={theme} active="Transactions" items={['Overview', 'Transactions', 'Categories', 'Documents']} />

      <div style={{ marginTop: 22 }}>
        <SectionLabel tk={tk}>Deltas + sparklines</SectionLabel>
        <div style={{ display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Delta theme={theme} value={12.4} size={16} />
            <span style={{ fontSize: 10, color: tk.inkSubtle, fontFamily: TPN.type.mono }}>vs last month</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Delta theme={theme} value={-3.8} size={16} />
            <span style={{ fontSize: 10, color: tk.inkSubtle, fontFamily: TPN.type.mono }}>portfolio · 1M</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Delta theme={theme} value={84200} currency size={16} />
            <span style={{ fontSize: 10, color: tk.inkSubtle, fontFamily: TPN.type.mono }}>net cash · April</span>
          </div>
          <Sparkline theme={theme} data={[3,4,3,5,6,5,7,6,8,9,8,10]} width={160} height={44} />
          <Sparkline theme={theme} data={[12,11,13,10,9,11,8,9,7,8,6,5]} width={160} height={44} color={tk.loss} />
        </div>
      </div>
    </ThemeFrame>
  );
}

// ─── KPI grid ──────────────────────────────────────────────────────────────
function KPIPanel({ theme = 'light' }) {
  const tk = tkp(theme);
  return (
    <ThemeFrame theme={theme}>
      <PanelHeader kicker="KPI · METRIC CARDS" title="Summary cards" subtitle="Used on Dashboard, Income, Outflows, Savings. Mono numbers, optional sparkline, optional delta." tk={tk} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        <KPICard theme={theme} label="Monthly income" value={TPN.formatINR(218400)}
          sparkData={[180,185,190,200,210,205,212,218,222,218,224,218]} sparkColor={tk.accent}
          delta={4.2} deltaLabel="vs March" accent={tk.accent} />
        <KPICard theme={theme} label="Committed outflow" value={TPN.formatINR(142800)}
          sparkData={[120,124,128,130,134,136,138,140,141,142,142,143]} sparkColor={tk.s4}
          delta={1.8} deltaLabel="vs March" />
        <KPICard theme={theme} label="Free cash · April" value={TPN.formatINR(75600)}
          delta={-6.4} deltaLabel="vs March" footer="3rd of 30 days" />
        <KPICard theme={theme} label="Net worth" value={TPN.formatINR(8420000, { compact: true })}
          sparkData={[60,62,65,68,70,73,76,78,80,82,83,84]} sparkColor={tk.gain}
          delta={12.6} deltaLabel="YTD" />
        <KPICard theme={theme} label="SIP · MoM" value="₹38,500" footer="14 active SIPs" />
        <KPICard theme={theme} label="Insurance · annual" value={TPN.formatINR(284600)} footer="HDFC Life · LIC" />
      </div>
    </ThemeFrame>
  );
}

// ─── Savings cards (polymorphic) ──────────────────────────────────────────
function SavingsPanel({ theme = 'light' }) {
  const tk = tkp(theme);
  const instruments = [
    {
      type: 'mutualFund', institution: 'Parag Parikh', label: 'Flexi Cap Fund · Direct',
      folio: 'PPFAS/8231/19', delta: 14.8,
      fields: [
        { label: 'NAV', value: '₹78.42' },
        { label: 'Units', value: '4,218.55' },
        { label: 'XIRR', value: '15.2%' },
      ],
      currentValue: 330650, totalPaid: 240000, maturityValue: 600000,
      spark: [60,62,68,72,70,76,80,82,78,84,88,92],
    },
    {
      type: 'lic', institution: 'LIC of India', label: 'Jeevan Anand · Endowment',
      policyNo: '714829301', delta: null,
      fields: [
        { label: 'Sum assured', value: '₹5,00,000' },
        { label: 'Premium', value: '₹24,800/yr' },
        { label: 'Term', value: '20y · 12 paid' },
      ],
      currentValue: 412000, totalPaid: 297600, maturityValue: 720000,
    },
    {
      type: 'hdfcLife', institution: 'HDFC Life', label: 'Sanchay Plus · Money-back',
      policyNo: 'HL-22-104822', delta: null,
      fields: [
        { label: 'Sum assured', value: '₹10,00,000' },
        { label: 'Next payout', value: 'Mar 2027' },
        { label: 'Premium', value: '₹2,40,000/yr' },
      ],
      currentValue: 720000, totalPaid: 720000, maturityValue: 1800000,
    },
    {
      type: 'postalRd', institution: 'India Post', label: 'Postal RD · 5 year',
      policyNo: 'RD-IP-339201', delta: null,
      fields: [
        { label: 'Monthly', value: '₹5,000' },
        { label: 'Rate', value: '6.7%' },
        { label: 'Months', value: '34 / 60' },
      ],
      currentValue: 184200, totalPaid: 170000, maturityValue: 358000,
    },
  ];
  return (
    <ThemeFrame theme={theme}>
      <PanelHeader kicker="SAVINGS · POLYMORPHIC CARDS" title="Instrument cards" subtitle="One card per instrument. Card chrome stays consistent; the metadata row swaps in fields specific to MF / LIC / HDFC Life / RD / FD / EPF / NPS / stock." tk={tk} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {instruments.map((i, idx) => <SavingsCard key={idx} theme={theme} instrument={i} />)}
      </div>
    </ThemeFrame>
  );
}

// ─── Transactions table ───────────────────────────────────────────────────
function TransactionsPanel({ theme = 'light' }) {
  const tk = tkp(theme);
  const rows = [
    { date: '2026-04-16', desc: 'JUSPAY TECHNOLOGIES PVT LTD',     category: 'Salary',          categoryTone: 'gain',    account: 'HDFC ××34', accentKey: 's1', amount: 184200, dir: 'C', matched: 'Income · salary' },
    { date: '2026-04-15', desc: 'SIP · PARAG PARIKH FLEXI CAP',    category: 'SIP',             categoryTone: 'accent',  account: 'HDFC ××34', accentKey: 's1', amount: 25000, dir: 'D', matched: 'Auto-debit' },
    { date: '2026-04-14', desc: 'LIC PREMIUM 714829301',           category: 'Insurance',       categoryTone: 'info',    account: 'HDFC ××34', accentKey: 's1', amount: 24800, dir: 'D' },
    { date: '2026-04-13', desc: 'IRCTC · TRAVEL · CHENNAI-MAS',    category: 'Travel',          categoryTone: 'warn',    account: 'HDFC CC ××21', accentKey: 's3', amount: 4250, dir: 'D' },
    { date: '2026-04-12', desc: 'AMAZON.IN · GROCERY',             category: 'Groceries',       categoryTone: 'neutral', account: 'ICICI AP ××88', accentKey: 's2', amount: 2840, dir: 'D' },
    { date: '2026-04-11', desc: 'RENT · APR · LANDLORD K. RAO',    category: 'Rent',            categoryTone: 'loss',    account: 'HDFC ××34', accentKey: 's1', amount: 38000, dir: 'D', matched: 'Obligation' },
    { date: '2026-04-10', desc: 'RD · INDIA POST · RD-IP-339201',  category: 'RD',              categoryTone: 'accent',  account: 'HDFC ××34', accentKey: 's1', amount: 5000, dir: 'D', matched: 'Auto-debit' },
    { date: '2026-04-09', desc: 'NETFLIX SUBSCRIPTION',            category: 'Subscriptions',   categoryTone: 'pending', account: 'HDFC CC ××21', accentKey: 's3', amount: 649, dir: 'D' },
  ];
  return (
    <ThemeFrame theme={theme}>
      <PanelHeader kicker="DATA TABLE" title="Transactions" subtitle="Five-column grid · monospaced money + dates · category badges · account dot. Dense and regular row heights." tk={tk} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <Input theme={theme} label="" placeholder="Search description" prefix="⌕" />
        <div style={{ flex: 1 }} />
        <Button theme={theme} variant="secondary" size="sm" leadingIcon={Icon.filter(13)}>Filters · 2</Button>
        <Button theme={theme} variant="ghost" size="sm" leadingIcon={Icon.download(13)}>Export</Button>
      </div>
      <TransactionTable theme={theme} rows={rows} />
    </ThemeFrame>
  );
}

// ─── Charts ───────────────────────────────────────────────────────────────
function ChartsPanel({ theme = 'light' }) {
  const tk = tkp(theme);
  const cf = ['May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr'].map((m, i) => ({
    month: m,
    income: 180000 + Math.round(Math.sin(i * 0.6) * 20000) + i * 2000,
    outflow: 120000 + Math.round(Math.cos(i * 0.4) * 30000) + (m === 'Mar' ? 240000 : 0) + (m === 'Jun' ? 80000 : 0),
  }));
  const proj = Array.from({ length: 21 }).map((_, i) => ({
    year: 2026 + i,
    value: 8400000 * Math.pow(1.11, i) + Math.sin(i * 0.7) * 200000 * i,
  }));
  return (
    <ThemeFrame theme={theme}>
      <PanelHeader kicker="CHARTS" title="Cashflow & projection" subtitle="Pure SVG, theme-aware. Cashflow uses paired bars; projection uses an area + maturity marker." tk={tk} />

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
          <SectionLabel tk={tk}>12-month cashflow</SectionLabel>
          <div style={{ display: 'flex', gap: 14, fontSize: 11, color: tk.inkMuted }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, background: tk.accent, borderRadius: 2 }} /> Income</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, background: tk.s4, opacity: 0.85, borderRadius: 2 }} /> Outflow</span>
          </div>
        </div>
        <div style={{ background: tk.surface, border: `1px solid ${tk.border}`, borderRadius: TPN.radius.md, padding: 12 }}>
          <CashflowChart theme={theme} data={cf} width={680} height={200} />
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
          <SectionLabel tk={tk}>Projection · Parag Parikh Flexi Cap</SectionLabel>
          <div style={{ fontSize: 11, color: tk.inkMuted, fontFamily: TPN.type.mono }}>maturity 2046 · ₹62.4L expected</div>
        </div>
        <div style={{ background: tk.surface, border: `1px solid ${tk.border}`, borderRadius: TPN.radius.md, padding: 12 }}>
          <ProjectionChart theme={theme} data={proj} width={680} height={200} maturityIdx={20} />
        </div>
      </div>
    </ThemeFrame>
  );
}

// ─── Documents ────────────────────────────────────────────────────────────
function DocumentsPanel({ theme = 'light' }) {
  const tk = tkp(theme);
  const docs = [
    { name: 'hdfc-cc-regalia-××21.pdf', size: '184 KB', parser: 'hdfc.creditCard.regalia', status: 'parsed', recordCount: 47, locked: false },
    { name: 'hdfc-bank-××34.pdf',       size: '312 KB', parser: 'hdfc.bankAccount',        status: 'parsed', recordCount: 102, locked: true },
    { name: 'icici-amazon-pay-××88.pdf',size: '98 KB',  parser: 'icici.amazonPay',         status: 'parsed', recordCount: 22, locked: false },
    { name: 'lic-jeevan-anand-714829301.pdf', size: '422 KB', parser: 'lic.policyStatement', status: 'pending', recordCount: null, locked: false },
    { name: 'groww-mf-holdings-2026Q1.xlsx', size: '46 KB', parser: 'groww.mfHoldings',    status: 'parsed', recordCount: 9, locked: false },
    { name: 'hdfc-life-sanchay.pdf',    size: '512 KB', parser: 'hdfcLife.policy',         status: 'failed', recordCount: null, locked: false },
  ];
  return (
    <ThemeFrame theme={theme}>
      <PanelHeader kicker="DOCUMENTS" title="Upload & parse status" subtitle="Drag-drop zone · per-document tile with parser id + parse status. Failed parses surface a re-run action; locked docs prompt for password." tk={tk} />
      <div style={{ marginBottom: 16 }}>
        <UploadZone theme={theme} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <SectionLabel tk={tk}>April 2026 · 6 documents</SectionLabel>
        <Tabs theme={theme} active="All" items={['All', 'Parsed', 'Pending', 'Failed']} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {docs.map((d, i) => <DocumentTile key={i} theme={theme} doc={d} />)}
      </div>
    </ThemeFrame>
  );
}

// ─── Patterns: Empty + Modal + Toast ──────────────────────────────────────
function PatternsPanel({ theme = 'light' }) {
  const tk = tkp(theme);
  return (
    <ThemeFrame theme={theme}>
      <PanelHeader kicker="PATTERNS" title="Empty states · password prompt · toast" subtitle="Recurring composites used across the app. Each is a small, themed Card with a clear primary action." tk={tk} />

      <SectionLabel tk={tk}>Empty states</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
        <EmptyState theme={theme} title="No transactions for April yet" body="Drop in this month's bank or credit-card statements and we'll parse them in your browser." action={<Button theme={theme} variant="primary" size="sm" leadingIcon={Icon.upload(13)}>Upload statement</Button>} />
        <EmptyState theme={theme} title="No savings instruments" body="Add a mutual fund, LIC policy, RD or FD manually — or import a Groww holdings export." action={<Button theme={theme} variant="secondary" size="sm" leadingIcon={Icon.plus(13)}>Add instrument</Button>} />
      </div>

      <SectionLabel tk={tk}>PDF password prompt</SectionLabel>
      <div style={{ marginBottom: 24 }}>
        <Card theme={theme} padding={20} elevation={3} style={{ maxWidth: 380 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            {Icon.lock(16, tk.warn)}
            <div style={{ fontSize: 14, fontWeight: 600, color: tk.ink }}>Password required</div>
          </div>
          <div style={{ fontSize: 12, color: tk.inkMuted, marginBottom: 14, lineHeight: 1.5 }}>
            <span style={{ fontFamily: TPN.type.mono }}>hdfc-bank-××34.pdf</span> is encrypted. Enter the password to unlock and parse it locally.
          </div>
          <div style={{ marginBottom: 14 }}>
            <Input theme={theme} label="Password" value="••••••••" mono />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button theme={theme} variant="ghost" size="sm">Skip</Button>
            <Button theme={theme} variant="primary" size="sm">Unlock</Button>
          </div>
        </Card>
      </div>

      <SectionLabel tk={tk}>Toast</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 420 }}>
        <Card theme={theme} padding={12} elevation={2} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 22, height: 22, borderRadius: 999, background: tk.gainSoft, color: tk.gain, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Icon.check(12, tk.gain)}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: tk.ink }}>Parsed 47 transactions · HDFC Regalia Gold</div>
            <div style={{ fontSize: 11, color: tk.inkMuted, fontFamily: TPN.type.mono }}>sum-of-debits matches statement summary</div>
          </div>
          <Button theme={theme} variant="ghost" size="sm">View</Button>
        </Card>
        <Card theme={theme} padding={12} elevation={2} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 22, height: 22, borderRadius: 999, background: tk.lossSoft, color: tk.loss, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>!</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: tk.ink }}>HDFC Life parser failed · unrecognised layout</div>
            <div style={{ fontSize: 11, color: tk.inkMuted }}>Open the doc to add a new regex match.</div>
          </div>
          <Button theme={theme} variant="secondary" size="sm">Retry</Button>
        </Card>
      </div>
    </ThemeFrame>
  );
}

// ─── Hero Dashboard composition ───────────────────────────────────────────
function DashboardHero({ theme = 'light' }) {
  const tk = tkp(theme);
  const cf = ['May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr'].map((m, i) => ({
    month: m,
    income: 180000 + Math.round(Math.sin(i * 0.6) * 20000) + i * 2000,
    outflow: 120000 + Math.round(Math.cos(i * 0.4) * 30000) + (m === 'Mar' ? 240000 : 0) + (m === 'Jun' ? 80000 : 0),
  }));
  const upcoming = [
    { date: '2026-04-28', label: 'HDFC Regalia · payment due', amount: 84200, tone: 'warn' },
    { date: '2026-05-03', label: 'SIP · Parag Parikh Flexi Cap', amount: 25000, tone: 'accent' },
    { date: '2026-05-15', label: 'LIC premium · Jeevan Anand', amount: 24800, tone: 'info' },
    { date: '2026-06-12', label: 'HDFC Life · Sanchay annual', amount: 240000, tone: 'loss' },
  ];
  const recent = [
    { date: '2026-04-16', desc: 'JUSPAY TECHNOLOGIES PVT LTD', category: 'Salary', categoryTone: 'gain', account: 'HDFC ××34', accentKey: 's1', amount: 184200, dir: 'C' },
    { date: '2026-04-15', desc: 'SIP · PARAG PARIKH FLEXI CAP', category: 'SIP', categoryTone: 'accent', account: 'HDFC ××34', accentKey: 's1', amount: 25000, dir: 'D' },
    { date: '2026-04-14', desc: 'LIC PREMIUM 714829301', category: 'Insurance', categoryTone: 'info', account: 'HDFC ××34', accentKey: 's1', amount: 24800, dir: 'D' },
    { date: '2026-04-13', desc: 'IRCTC · TRAVEL · CHENNAI-MAS', category: 'Travel', categoryTone: 'warn', account: 'HDFC CC ××21', accentKey: 's3', amount: 4250, dir: 'D' },
    { date: '2026-04-12', desc: 'AMAZON.IN · GROCERY', category: 'Groceries', categoryTone: 'neutral', account: 'ICICI AP ××88', accentKey: 's2', amount: 2840, dir: 'D' },
  ];
  return (
    <div style={{ background: tk.bg, color: tk.ink, fontFamily: TPN.type.sans, display: 'flex', height: '100%', minWidth: 0 }}>
      <SideNav theme={theme} active="Dashboard" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar theme={theme} title="Dashboard" subtitle="April 2026 · 6 documents parsed · last sync 16/04 09:42" period="Apr 2026" />
        <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden', minWidth: 0 }}>

          {/* KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <KPICard theme={theme} label="Monthly income" value={TPN.formatINR(218400)}
              sparkData={[180,185,190,200,210,205,212,218,222,218,224,218]} sparkColor={tk.accent}
              delta={4.2} deltaLabel="vs March" accent={tk.accent} />
            <KPICard theme={theme} label="Committed outflow" value={TPN.formatINR(142800)}
              sparkData={[120,124,128,130,134,136,138,140,141,142,142,143]} sparkColor={tk.s4}
              delta={1.8} deltaLabel="vs March" />
            <KPICard theme={theme} label="Free cash · April" value={TPN.formatINR(75600)}
              delta={-6.4} deltaLabel="vs March" footer="3rd of 30 days" />
            <KPICard theme={theme} label="Net worth" value={TPN.formatINR(8420000, { compact: true })}
              sparkData={[60,62,65,68,70,73,76,78,80,82,83,84]} sparkColor={tk.gain}
              delta={12.6} deltaLabel="YTD" />
          </div>

          {/* Cashflow + upcoming */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, minHeight: 0 }}>
            <Card theme={theme} padding={16} style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: tk.inkMuted, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 4 }}>Cashflow · 12 months</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: tk.ink, letterSpacing: '-0.01em' }}>
                    Watch out for <span style={{ color: tk.warn }}>March</span> — HDFC Life premium hits.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 14, fontSize: 11, color: tk.inkMuted }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, background: tk.accent, borderRadius: 2 }} /> Income</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, background: tk.s4, opacity: 0.85, borderRadius: 2 }} /> Outflow</span>
                </div>
              </div>
              <CashflowChart theme={theme} data={cf} width={620} height={200} />
            </Card>
            <Card theme={theme} padding={16} style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: tk.inkMuted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Upcoming · next 60 days</div>
                <Badge theme={theme} tone="neutral">4</Badge>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                {upcoming.map((u, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10, borderBottom: i < upcoming.length - 1 ? `1px solid ${tk.divider}` : 'none' }}>
                    <div style={{
                      width: 38, textAlign: 'center', padding: '4px 0',
                      border: `1px solid ${tk.border}`, borderRadius: TPN.radius.sm, background: tk.surfaceAlt,
                    }}>
                      <div style={{ fontSize: 9, color: tk.inkSubtle, fontFamily: TPN.type.mono, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{TPN.formatDate(u.date, { short: true }).split(' ')[1]}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: tk.ink, fontFamily: TPN.type.mono, lineHeight: 1.1 }}>{TPN.formatDate(u.date, { short: true }).split(' ')[0]}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: tk.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.label}</div>
                      <Badge theme={theme} tone={u.tone}>{({warn:'Due',accent:'SIP',info:'Premium',loss:'Big'})[u.tone]}</Badge>
                    </div>
                    <div style={{ fontFamily: TPN.type.mono, fontSize: 13, color: tk.ink, fontVariantNumeric: 'tabular-nums' }}>{TPN.formatINR(u.amount, { compact: u.amount >= 100000 })}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Recent transactions */}
          <Card theme={theme} padding={0} style={{ overflow: 'hidden', minHeight: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: tk.inkMuted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Recent transactions</div>
                <div style={{ fontSize: 13, color: tk.ink, marginTop: 2 }}>171 in April · matched <span style={{ fontFamily: TPN.type.mono }}>87%</span> to known obligations</div>
              </div>
              <Button theme={theme} variant="ghost" size="sm" trailingIcon={Icon.arrowRight(13)}>See all</Button>
            </div>
            <TransactionTable theme={theme} rows={recent} />
          </Card>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  ControlsPanel, KPIPanel, SavingsPanel, TransactionsPanel,
  ChartsPanel, DocumentsPanel, PatternsPanel, DashboardHero,
});
