// savings-data.jsx — instrument dataset for the Savings page.
// Realistic Indian portfolio with 8 instruments across 3 layout types:
//   market-linked   → MFs (×4), HDFC Life ULIP, NPS Tier I
//   traditional     → LIC Jeevan Anand
//   fixed-return    → PPF, Sukanya Samriddhi, RD

const SVT = window.FDTokens;

// helper: synthesize NAV-style time series given start value, target current
// value, # months, and a volatility hint
function buildSeries(startVal, currentVal, months, vol = 0.04, seed = 7) {
  const out = [];
  const targetGrowthPerMonth = Math.pow(currentVal / startVal, 1 / months);
  let v = startVal;
  for (let i = 0; i <= months; i++) {
    if (i > 0) {
      const rand = ((Math.sin(seed * (i + 1)) + Math.sin((seed + 3) * (i * 0.7))) / 2);
      v = v * targetGrowthPerMonth * (1 + rand * vol);
    }
    out.push(Math.round(v));
  }
  // pin endpoint to currentVal so display numbers reconcile
  out[out.length - 1] = currentVal;
  out[0] = startVal;
  return out;
}

// helper: cumulative contributions series (linear, monthly SIP)
function buildContribSeries(monthlySIP, months, startContrib = 0) {
  const out = [];
  let c = startContrib;
  for (let i = 0; i <= months; i++) {
    out.push(c);
    c += monthlySIP;
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────
// 8 instruments
// Each has: id, name, kind (mf|ulip|nps|lic|ppf|rd|ssy), layout type,
// current value, invested, returns, sip/premium, schedule, statements,
// chart series, etc.
// ─────────────────────────────────────────────────────────────────────────

const SAVINGS_INSTRUMENTS = [
  // ── 1. PPFAS Flexi Cap ─────────────────────────────────────────────────
  {
    id: 'ppfas',
    name: 'Parag Parikh Flexi Cap Fund',
    short: 'PPFAS Flexi Cap',
    type: 'Mutual fund · SIP',
    kind: 'mf',
    layout: 'market',
    accentKey: 's2',
    icon: '↑',
    folio: 'PPF/1289347',
    holding: 'Direct · Growth',
    started: '12/03/2022',
    horizon: 'Long-term · 10y+',
    sipAmount: 8000,
    sipDay: 2,
    sipFreq: 'Monthly',
    units: 1842.4,
    nav: 91.84,
    currentValue: 169240,
    invested: 320000 / 4, // illustrative — keep in line with monthly SIP × months
    investedReal: 360000, // realistic: 8k × 45 months
    monthsActive: 49,
    xirr: 18.2,
    absoluteReturn: 0.218,
    last1y: 0.241,
    last3y: 0.196,
    expenseRatio: 0.61,
    nominee: 'Priya Iyer (spouse · 100%)',
    taxNote: 'LTCG 12.5% above ₹1.25L/yr',
    riskLevel: 'Very high',
    lockIn: 'None · open-ended',
    exitLoad: '1% if redeemed within 12 months',
    series: buildSeries(8000, 169240, 49, 0.038, 4),
    contribSeries: buildContribSeries(8000, 49, 0),
    schedule: makeSIPSchedule(8000, 2, 12),
    statements: [
      { period: 'Mar 2026', uploaded: '03/04/2026', parsed: true },
      { period: 'Feb 2026', uploaded: '02/03/2026', parsed: true },
      { period: 'Jan 2026', uploaded: '02/02/2026', parsed: true },
      { period: 'Dec 2025', uploaded: '03/01/2026', parsed: true },
    ],
  },
  // ── 2. Mirae Asset Large Cap ───────────────────────────────────────────
  {
    id: 'mirae',
    name: 'Mirae Asset Large Cap Fund',
    short: 'Mirae Large Cap',
    type: 'Mutual fund · SIP',
    kind: 'mf',
    layout: 'market',
    accentKey: 's3',
    icon: '↑',
    folio: 'MAS/8847123',
    holding: 'Direct · Growth',
    started: '08/06/2021',
    horizon: 'Long-term · 7y+',
    sipAmount: 6000,
    sipDay: 3,
    sipFreq: 'Monthly',
    units: 2412.8,
    nav: 49.12,
    currentValue: 118490,
    investedReal: 348000, // 6k × 58
    monthsActive: 58,
    xirr: -1.8,
    absoluteReturn: -0.658,
    last1y: 0.082,
    last3y: 0.041,
    expenseRatio: 0.54,
    nominee: 'Priya Iyer (spouse · 100%)',
    taxNote: 'LTCG 12.5% above ₹1.25L/yr',
    riskLevel: 'Very high',
    lockIn: 'None · open-ended',
    exitLoad: '1% if redeemed within 1 year',
    series: buildSeries(6000, 118490, 58, 0.045, 11),
    contribSeries: buildContribSeries(6000, 58, 0),
    schedule: makeSIPSchedule(6000, 3, 12),
    statements: [
      { period: 'Mar 2026', uploaded: '04/04/2026', parsed: true },
      { period: 'Feb 2026', uploaded: '03/03/2026', parsed: true },
      { period: 'Jan 2026', uploaded: '04/02/2026', parsed: true },
    ],
    flag: 'Underperforming · review',
  },
  // ── 3. Axis Small Cap ──────────────────────────────────────────────────
  {
    id: 'axis',
    name: 'Axis Small Cap Fund',
    short: 'Axis Small Cap',
    type: 'Mutual fund · SIP',
    kind: 'mf',
    layout: 'market',
    accentKey: 's4',
    icon: '↑',
    folio: 'AXS/3329012',
    holding: 'Direct · Growth',
    started: '15/01/2023',
    horizon: 'Long-term · 10y+',
    sipAmount: 8000,
    sipDay: 10,
    sipFreq: 'Monthly',
    units: 1182.6,
    nav: 96.12,
    currentValue: 113680,
    investedReal: 296000, // 8k × 37 + small lumpsum
    monthsActive: 37,
    xirr: -3.1,
    absoluteReturn: -0.616,
    last1y: -0.084,
    last3y: 0.062,
    expenseRatio: 0.52,
    nominee: 'Priya Iyer (spouse · 100%)',
    taxNote: 'LTCG 12.5% above ₹1.25L/yr',
    riskLevel: 'Very high',
    lockIn: 'None · open-ended',
    exitLoad: '1% if redeemed within 12 months',
    series: buildSeries(8000, 113680, 37, 0.06, 19),
    contribSeries: buildContribSeries(8000, 37, 0),
    schedule: makeSIPSchedule(8000, 10, 12),
    statements: [
      { period: 'Mar 2026', uploaded: '03/04/2026', parsed: true },
      { period: 'Feb 2026', uploaded: '02/03/2026', parsed: true },
    ],
    flag: 'Volatile · 1y down',
  },
  // ── 4. Quant Active ────────────────────────────────────────────────────
  {
    id: 'quant',
    name: 'Quant Active Fund',
    short: 'Quant Active',
    type: 'Mutual fund · SIP',
    kind: 'mf',
    layout: 'market',
    accentKey: 's6',
    icon: '↑',
    folio: 'QNT/9912884',
    holding: 'Direct · Growth',
    started: '02/11/2022',
    horizon: 'Long-term · 7y+',
    sipAmount: 6000,
    sipDay: 14,
    sipFreq: 'Monthly',
    units: 412.5,
    nav: 612.4,
    currentValue: 252620,
    investedReal: 246000, // 6k × 41
    monthsActive: 41,
    xirr: 2.1,
    absoluteReturn: 0.0269,
    last1y: -0.121,
    last3y: 0.244,
    expenseRatio: 0.69,
    nominee: 'Priya Iyer (spouse · 100%)',
    taxNote: 'LTCG 12.5% above ₹1.25L/yr',
    riskLevel: 'Very high',
    lockIn: 'None · open-ended',
    exitLoad: '0.5% if redeemed within 90 days',
    series: buildSeries(6000, 252620, 41, 0.075, 27),
    contribSeries: buildContribSeries(6000, 41, 0),
    schedule: makeSIPSchedule(6000, 14, 12),
    statements: [
      { period: 'Mar 2026', uploaded: '02/04/2026', parsed: true },
      { period: 'Feb 2026', uploaded: '03/03/2026', parsed: 'pending' },
    ],
  },
  // ── 5. HDFC Life Click 2 Wealth (ULIP) ─────────────────────────────────
  {
    id: 'hdfclife',
    name: 'HDFC Life Click 2 Wealth',
    short: 'HDFC Life ULIP',
    type: 'Insurance · ULIP',
    kind: 'ulip',
    layout: 'market',
    accentKey: 's1',
    icon: '◇',
    folio: 'HL/C2W/74128',
    holding: 'Equity Plus · ₹50L sum assured',
    started: '14/02/2020',
    horizon: 'Lock-in 5y · matures 14/02/2030',
    sipAmount: 0, // annual instead
    annualPremium: 60000,
    nextPremium: '14/02/2027',
    units: 4128.4,
    nav: 84.12,
    currentValue: 347280,
    investedReal: 360000, // 60k × 6
    monthsActive: 74,
    xirr: -0.8,
    absoluteReturn: -0.0353,
    last1y: 0.084,
    last3y: 0.071,
    expenseRatio: 1.35,
    nominee: 'Priya Iyer (spouse · 100%)',
    taxNote: 'EEE if premium ≤ 10% of sum assured',
    riskLevel: 'High',
    lockIn: '5 years · 14/02/2025 onwards withdrawal allowed',
    exitLoad: '4-yr surrender · partial withdrawals after lock-in',
    series: buildSeries(60000, 347280, 74, 0.04, 9),
    contribSeries: (() => {
      // annual contributions, stepped
      const arr = [];
      for (let i = 0; i <= 74; i++) {
        const yrs = Math.floor(i / 12) + 1;
        arr.push(60000 * yrs);
      }
      return arr;
    })(),
    schedule: makeAnnualSchedule(60000, 'Feb', 14, 6, 2026),
    statements: [
      { period: 'FY26 Q4', uploaded: '12/04/2026', parsed: true },
      { period: 'FY26 Q3', uploaded: '15/01/2026', parsed: true },
    ],
  },
  // ── 6. NPS Tier I ──────────────────────────────────────────────────────
  {
    id: 'nps',
    name: 'NPS Tier I · National Pension System',
    short: 'NPS Tier I',
    type: 'Pension · NPS',
    kind: 'nps',
    layout: 'market',
    accentKey: 's5',
    icon: '◈',
    folio: 'PRAN 7129 4488 0192',
    holding: 'Active · 75/15/10 (E/C/G)',
    started: '20/04/2019',
    horizon: 'Maturity at age 60 · 22 years remaining',
    sipAmount: 4000,
    sipDay: 19,
    sipFreq: 'Monthly',
    units: 6249.2,
    nav: 47.42,
    currentValue: 296280,
    investedReal: 336000, // 4k × 84
    monthsActive: 84,
    xirr: -3.2,
    absoluteReturn: -0.118,
    last1y: 0.094,
    last3y: 0.082,
    expenseRatio: 0.09,
    nominee: 'Priya Iyer (spouse · 60%) · Tarini Iyer (daughter · 40%)',
    taxNote: '80CCD(1B) · ₹50k extra deduction',
    riskLevel: 'Moderate-high',
    lockIn: 'Until age 60 · 60% lump-sum + 40% annuity',
    exitLoad: 'Premature exit: 20% lump-sum, 80% annuity',
    series: buildSeries(4000, 296280, 84, 0.025, 13),
    contribSeries: buildContribSeries(4000, 84, 0),
    schedule: makeSIPSchedule(4000, 19, 12),
    statements: [
      { period: 'FY26 Annual', uploaded: '08/04/2026', parsed: true },
    ],
  },
  // ── 7. LIC Jeevan Anand (traditional) ──────────────────────────────────
  {
    id: 'lic',
    name: 'LIC Jeevan Anand · 815',
    short: 'LIC Jeevan Anand',
    type: 'Insurance · traditional',
    kind: 'lic',
    layout: 'traditional',
    accentKey: 's6',
    icon: '◇',
    folio: 'LIC 815/447/8829014',
    holding: '21-year endowment · ₹15L sum assured',
    started: '12/05/2018',
    horizon: 'Matures 12/05/2039 · 13 years remaining',
    sipAmount: 0,
    annualPremium: 57520,
    nextPremium: '12/05/2026',
    sumAssured: 1500000,
    bonusAccrued: 187200, // simple-reversionary + final additions estimate
    paidUpValue: 412000,
    surrenderValue: 224800,
    yearsPaid: 8,
    yearsTotal: 21,
    expectedMaturity: 2842000, // SA + bonuses + FAB at maturity
    estimatedIRR: 4.6,
    currentValue: 412000, // = paid-up; for "savings" total purposes
    investedReal: 460160, // 57520 × 8
    nominee: 'Priya Iyer (spouse · 100%)',
    taxNote: '80C ₹1.5L · maturity tax-free under Sec 10(10D)',
    riskLevel: 'Low · guaranteed + bonuses',
    lockIn: 'Surrender after 3y · paid-up after 3y',
    exitLoad: 'Surrender value ~50% of paid premiums after 8y',
    schedule: makeAnnualSchedule(57520, 'May', 12, 8, 2026),
    statements: [
      { period: 'FY26 Premium receipt', uploaded: '15/05/2025', parsed: true },
      { period: 'FY26 Bonus statement', uploaded: '02/04/2026', parsed: true },
    ],
  },
  // ── 8. PPF (15-year) ───────────────────────────────────────────────────
  {
    id: 'ppf',
    name: 'Public Provident Fund · SBI',
    short: 'PPF',
    type: 'Government · PPF',
    kind: 'ppf',
    layout: 'fixed',
    accentKey: 's2',
    icon: '◈',
    folio: 'PPF 30441 8821 9 · SBI HSR Layout',
    holding: '15-year tenure · extendable in 5y blocks',
    started: '01/04/2020',
    horizon: 'Matures 31/03/2035 · 9 years remaining',
    sipAmount: 4000,
    sipDay: 19,
    sipFreq: 'Monthly · auto-debit',
    annualLimit: 150000,
    annualContrib: 48000,
    interestRate: 7.1,
    interestRateNote: 'Govt-set quarterly · current Q1 FY26',
    currentValue: 312840,
    investedReal: 288000,
    accruedInterest: 24840,
    monthsActive: 72,
    yearsPaid: 6,
    yearsTotal: 15,
    expectedMaturity: 1284000,
    nominee: 'Priya Iyer (spouse · 100%)',
    taxNote: 'EEE · 80C ₹1.5L deduction · interest tax-free',
    riskLevel: 'Sovereign · zero risk',
    lockIn: 'Partial withdrawal from 7th year · loan from 3rd year',
    exitLoad: 'Premature closure only on medical/education grounds',
    schedule: makeSIPSchedule(4000, 19, 12),
    statements: [
      { period: 'FY26 Q4', uploaded: '04/04/2026', parsed: true },
      { period: 'FY26 Q3', uploaded: '05/01/2026', parsed: true },
    ],
  },
  // ── 9. Sukanya Samriddhi (daughter) ────────────────────────────────────
  {
    id: 'ssy',
    name: 'Sukanya Samriddhi Yojana · Tarini',
    short: 'Sukanya · Tarini',
    type: 'Government · SSY',
    kind: 'ssy',
    layout: 'fixed',
    accentKey: 's4',
    icon: '○',
    folio: 'SSY 8841 2992 · Post Office, HSR',
    holding: '21-year scheme · ends when Tarini turns 21',
    started: '08/08/2022',
    horizon: 'Matures 08/08/2043 · 17 years remaining',
    sipAmount: 0, // lump-sum yearly
    annualContrib: 50000,
    interestRate: 8.2,
    interestRateNote: 'Govt-set quarterly · highest small-savings rate',
    currentValue: 184600,
    investedReal: 175000, // 50k × 3.5y
    accruedInterest: 9600,
    yearsPaid: 4,
    yearsTotal: 14, // contribute for 14, mature at 21
    expectedMaturity: 2240000,
    nominee: 'Tarini Iyer (account holder)',
    taxNote: 'EEE · 80C ₹1.5L · interest + maturity tax-free',
    riskLevel: 'Sovereign · zero risk',
    lockIn: 'Withdrawal at age 18 (50%) or 21 (full)',
    exitLoad: 'No premature exit except for marriage at 18+',
    schedule: makeAnnualSchedule(50000, 'Aug', 8, 3, 2026),
    statements: [
      { period: 'FY26 passbook', uploaded: '10/04/2026', parsed: true },
    ],
  },
  // ── 10. Recurring Deposit (HDFC Bank, 1y) ──────────────────────────────
  {
    id: 'rd',
    name: 'HDFC Bank · Recurring Deposit',
    short: 'HDFC RD',
    type: 'Bank · RD',
    kind: 'rd',
    layout: 'fixed',
    accentKey: 's3',
    icon: '═',
    folio: 'RD 50100 884412 · HDFC HSR',
    holding: '12-month tenure · auto-renew off',
    started: '01/10/2025',
    horizon: 'Matures 01/10/2026 · 5 months remaining',
    sipAmount: 5000,
    sipDay: 1,
    sipFreq: 'Monthly · auto-debit',
    interestRate: 6.75,
    interestRateNote: 'Locked · contracted at start',
    currentValue: 36420,
    investedReal: 35000, // 5k × 7
    accruedInterest: 1420,
    monthsActive: 7,
    yearsPaid: 0.58,
    yearsTotal: 1,
    expectedMaturity: 62100,
    nominee: 'Priya Iyer (spouse · 100%)',
    taxNote: 'Interest taxable at slab · TDS if > ₹40k/yr',
    riskLevel: 'Low · DICGC ₹5L cover',
    lockIn: 'Premature closure with 1% penalty',
    exitLoad: '1% on prevailing rate if closed early',
    schedule: makeSIPSchedule(5000, 1, 5), // only 5 left
    statements: [
      { period: 'Mar 2026', uploaded: '02/04/2026', parsed: true },
    ],
  },
];

// ─── helpers for schedules ─────────────────────────────────────────────────
function makeSIPSchedule(amount, day, monthsAhead) {
  // Build past 6 + future N. We're "now" = late Apr 2026 (system date).
  const months = [
    { id: 'nov-25', short: 'Nov', y: 25, m: 10 },
    { id: 'dec-25', short: 'Dec', y: 25, m: 11 },
    { id: 'jan-26', short: 'Jan', y: 26, m: 0 },
    { id: 'feb-26', short: 'Feb', y: 26, m: 1 },
    { id: 'mar-26', short: 'Mar', y: 26, m: 2 },
    { id: 'apr-26', short: 'Apr', y: 26, m: 3 },
    { id: 'may-26', short: 'May', y: 26, m: 4 },
    { id: 'jun-26', short: 'Jun', y: 26, m: 5 },
    { id: 'jul-26', short: 'Jul', y: 26, m: 6 },
    { id: 'aug-26', short: 'Aug', y: 26, m: 7 },
    { id: 'sep-26', short: 'Sep', y: 26, m: 8 },
    { id: 'oct-26', short: 'Oct', y: 26, m: 9 },
  ];
  // status: paid for past, scheduled for future, today = apr (paid)
  return months.map((mo, i) => ({
    ...mo,
    day,
    amount,
    status: i <= 5 ? 'paid' : 'scheduled', // 0..5 = nov..apr paid
    paidOn: i <= 5 ? `${String(day).padStart(2, '0')}/${String(mo.m + 1).padStart(2, '0')}` : null,
  }));
}

function makeAnnualSchedule(amount, monthShort, day, yearsPaid, currentYear) {
  // For LIC/SSY/ULIP: one premium per year. Build a 12-month strip with the
  // single premium month flagged + the rest empty.
  const monthMap = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
  const targetM = monthMap[monthShort];
  const months = [
    { id: 'nov-25', short: 'Nov', m: 10, y: 25 },
    { id: 'dec-25', short: 'Dec', m: 11, y: 25 },
    { id: 'jan-26', short: 'Jan', m: 0, y: 26 },
    { id: 'feb-26', short: 'Feb', m: 1, y: 26 },
    { id: 'mar-26', short: 'Mar', m: 2, y: 26 },
    { id: 'apr-26', short: 'Apr', m: 3, y: 26 },
    { id: 'may-26', short: 'May', m: 4, y: 26 },
    { id: 'jun-26', short: 'Jun', m: 5, y: 26 },
    { id: 'jul-26', short: 'Jul', m: 6, y: 26 },
    { id: 'aug-26', short: 'Aug', m: 7, y: 26 },
    { id: 'sep-26', short: 'Sep', m: 8, y: 26 },
    { id: 'oct-26', short: 'Oct', m: 9, y: 26 },
  ];
  return months.map((mo) => {
    const isPremiumMonth = mo.m === targetM;
    if (!isPremiumMonth) return { ...mo, day, amount: 0, status: 'idle' };
    // Past Feb/May 25 = paid; future targetM = scheduled
    const past = mo.y === 25 || (mo.y === 26 && mo.m <= 3);
    return { ...mo, day, amount, status: past ? 'paid' : 'scheduled', paidOn: past ? `${String(day).padStart(2,'0')}/${String(mo.m+1).padStart(2,'0')}` : null };
  });
}

// ─── Portfolio aggregates ──────────────────────────────────────────────────
function portfolioAgg(instruments) {
  const totalValue = instruments.reduce((s, i) => s + i.currentValue, 0);
  const totalInvested = instruments.reduce((s, i) => s + i.investedReal, 0);
  const totalReturn = totalValue - totalInvested;
  const totalReturnPct = (totalReturn / totalInvested) * 100;
  const monthlyOut = instruments.reduce((s, i) => s + (i.sipAmount || 0), 0);
  const annualPremiums = instruments.reduce((s, i) => s + (i.annualPremium || 0), 0);
  // by type (for the donut)
  const byType = {};
  instruments.forEach(i => {
    const t = (
      i.kind === 'mf' ? 'Mutual funds' :
      i.kind === 'ulip' ? 'Insurance · ULIP' :
      i.kind === 'lic'  ? 'Insurance · traditional' :
      i.kind === 'nps'  ? 'NPS' :
      i.kind === 'ppf'  ? 'PPF' :
      i.kind === 'ssy'  ? 'Sukanya' :
      i.kind === 'rd'   ? 'RD / FD' : 'Other'
    );
    if (!byType[t]) byType[t] = { type: t, value: 0, accentKey: i.accentKey };
    byType[t].value += i.currentValue;
  });
  return {
    totalValue, totalInvested, totalReturn, totalReturnPct,
    monthlyOut, annualPremiums,
    byType: Object.values(byType).sort((a, b) => b.value - a.value),
    count: instruments.length,
  };
}

// Group instruments by type for the index page
const SAVINGS_GROUPS = [
  { id: 'mf',          label: 'Mutual fund SIPs',   subtitle: 'Equity · long-term wealth',         filter: i => i.kind === 'mf' },
  { id: 'pension',     label: 'Pension & ULIP',     subtitle: 'Retirement-focused, market-linked', filter: i => i.kind === 'nps' || i.kind === 'ulip' },
  { id: 'insurance',   label: 'Traditional insurance', subtitle: 'Guaranteed sum + bonuses',       filter: i => i.kind === 'lic' },
  { id: 'government',  label: 'Government schemes', subtitle: 'PPF, Sukanya · sovereign-backed',   filter: i => i.kind === 'ppf' || i.kind === 'ssy' },
  { id: 'bank',        label: 'Bank deposits',      subtitle: 'RDs, FDs · short-term liquidity',   filter: i => i.kind === 'rd' || i.kind === 'fd' },
];

Object.assign(window, {
  SAVINGS_INSTRUMENTS,
  SAVINGS_GROUPS,
  savingsPortfolioAgg: portfolioAgg,
});
