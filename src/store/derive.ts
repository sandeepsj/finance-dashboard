// Pure derivation functions over AppState. Pages call these via memoized
// hooks (see hooks.ts) so changes flow naturally.

import type { AppState } from './types';

export interface MonthlyKpi {
  income: number;
  outflow: number;
  freeCash: number;
  txnCount: number;
}

function monthKey(iso: string): string {
  // 2026-04-15 → 2026-04
  return iso.slice(0, 7);
}

export function monthlyKpi(state: AppState, ym: string): MonthlyKpi {
  let income = 0;
  let outflow = 0;
  let txnCount = 0;
  for (const t of Object.values(state.transactions)) {
    if (monthKey(t.date) !== ym) continue;
    if (t.direction === 'C') income += t.amount;
    else outflow += t.amount;
    txnCount += 1;
  }
  return { income, outflow, freeCash: income - outflow, txnCount };
}

export interface CashflowBucket {
  month: string;
  income: number;
  outflow: number;
}

/** Last `nMonths` months ending at `endYm` (inclusive). */
export function cashflow(state: AppState, endYm: string, nMonths = 12): CashflowBucket[] {
  const [yStr, mStr] = endYm.split('-');
  const endY = Number.parseInt(yStr, 10);
  const endM = Number.parseInt(mStr, 10);
  const buckets = new Map<string, CashflowBucket>();
  for (let i = nMonths - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(endY, endM - 1 - i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    buckets.set(key, { month: key, income: 0, outflow: 0 });
  }
  for (const t of Object.values(state.transactions)) {
    const k = monthKey(t.date);
    const b = buckets.get(k);
    if (!b) continue;
    if (t.direction === 'C') b.income += t.amount;
    else b.outflow += t.amount;
  }
  return [...buckets.values()];
}

/** Most recent transactions, newest first. */
export function recentTransactions(state: AppState, limit = 10) {
  return Object.values(state.transactions)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, limit);
}

export interface PortfolioSummary {
  invested: number;
  currentValue: number;
  pnl: number;
  pnlPct: number;
  count: number;
}

export function portfolioSummary(state: AppState): PortfolioSummary {
  let invested = 0;
  let currentValue = 0;
  let count = 0;
  for (const s of Object.values(state.savingsInstruments)) {
    invested += s.totalPaidToDate ?? 0;
    currentValue += s.currentValue ?? 0;
    count += 1;
  }
  const pnl = currentValue - invested;
  const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
  return { invested, currentValue, pnl, pnlPct, count };
}

import type { SavingsInstrument } from '@/domain/types';

export type SavingsType = SavingsInstrument['type'];

export interface PortfolioGroup {
  type: SavingsType;
  label: string;
  instruments: SavingsInstrument[];
  invested: number;
  currentValue: number;
  pnl: number;
  pnlPct: number;
}

const TYPE_LABEL: Record<SavingsType, string> = {
  mutualFund: 'Mutual Funds',
  lic: 'LIC policies',
  hdfcLife: 'HDFC Life policies',
  postalRd: 'Postal RDs',
  bankFd: 'Bank FDs',
  epf: 'EPF',
  nps: 'NPS',
  ppf: 'PPF',
  sukanya: 'Sukanya Samriddhi',
  stock: 'Stock holdings',
  other: 'Other',
};

export function portfolioByType(state: AppState): PortfolioGroup[] {
  const map = new Map<SavingsType, SavingsInstrument[]>();
  for (const s of Object.values(state.savingsInstruments)) {
    const arr = map.get(s.type) ?? [];
    arr.push(s);
    map.set(s.type, arr);
  }
  const groups: PortfolioGroup[] = [];
  for (const [type, instruments] of map) {
    let invested = 0;
    let currentValue = 0;
    for (const i of instruments) {
      invested += i.totalPaidToDate ?? 0;
      currentValue += i.currentValue ?? 0;
    }
    const pnl = currentValue - invested;
    const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
    groups.push({
      type,
      label: TYPE_LABEL[type],
      instruments: instruments.sort((a, b) => (b.currentValue ?? 0) - (a.currentValue ?? 0)),
      invested,
      currentValue,
      pnl,
      pnlPct,
    });
  }
  return groups.sort((a, b) => b.currentValue - a.currentValue);
}

/** Has any real data been loaded? Used to decide "show real data" vs "show
 *  illustrative mock" on the Dashboard. */
export function hasData(state: AppState): boolean {
  return (
    Object.keys(state.transactions).length > 0 ||
    Object.keys(state.savingsInstruments).length > 0
  );
}

// ── Outflows (derived) ────────────────────────────────────────────────────
//
// These run the categorizer chain at derive-time so refining rules retro-
// applies to every txn already in the store.

import { categorize as categorizeOne } from '@/lib/categorize';

export interface OutflowKpis {
  total: number;
  txnCount: number;
  recurring: number;
  variable: number;
  topCategory: { category: string; spend: number } | null;
  dailyAverage: number;
}

const RECURRING_CATEGORIES = new Set(['sip', 'emi', 'insurance-premium', 'utility', 'subscription', 'rent']);

export interface CategoryBucket {
  category: string;
  spend: number;
  txnCount: number;
  topMerchants: { description: string; spend: number; count: number }[];
}

export interface DailyTotal {
  date: string;
  spend: number;
  /** Number of debit transactions on this date. */
  count: number;
}

export interface MerchantSpend {
  description: string;
  category: string;
  spend: number;
  count: number;
  lastDate: string;
}

function debitsForMonth(state: AppState, ym: string) {
  const out = [];
  for (const t of Object.values(state.transactions)) {
    if (t.direction !== 'D') continue;
    if (t.date.slice(0, 7) !== ym) continue;
    out.push(categorizeOne(t));
  }
  return out;
}

function daysInMonth(ym: string): number {
  const [y, m] = ym.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function outflowKpis(state: AppState, ym: string): OutflowKpis {
  const debits = debitsForMonth(state, ym);
  const total = debits.reduce((a, t) => a + t.amount, 0);
  let recurring = 0;
  let variable = 0;
  const byCategory = new Map<string, number>();
  for (const t of debits) {
    const c = t.category ?? 'other';
    if (RECURRING_CATEGORIES.has(c)) recurring += t.amount;
    else variable += t.amount;
    byCategory.set(c, (byCategory.get(c) ?? 0) + t.amount);
  }
  let topCategory: OutflowKpis['topCategory'] = null;
  for (const [category, spend] of byCategory) {
    if (!topCategory || spend > topCategory.spend) topCategory = { category, spend };
  }
  const days = daysInMonth(ym);
  return {
    total,
    txnCount: debits.length,
    recurring,
    variable,
    topCategory,
    dailyAverage: days > 0 ? total / days : 0,
  };
}

export function outflowCategories(state: AppState, ym: string): CategoryBucket[] {
  const debits = debitsForMonth(state, ym);
  const groups = new Map<string, { spend: number; txnCount: number; merchants: Map<string, { spend: number; count: number }> }>();
  for (const t of debits) {
    const c = t.category ?? 'other';
    const g = groups.get(c) ?? { spend: 0, txnCount: 0, merchants: new Map() };
    g.spend += t.amount;
    g.txnCount += 1;
    const m = g.merchants.get(t.description) ?? { spend: 0, count: 0 };
    m.spend += t.amount;
    m.count += 1;
    g.merchants.set(t.description, m);
    groups.set(c, g);
  }
  const out: CategoryBucket[] = [];
  for (const [category, g] of groups) {
    const topMerchants = [...g.merchants.entries()]
      .map(([description, v]) => ({ description, ...v }))
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 4);
    out.push({ category, spend: g.spend, txnCount: g.txnCount, topMerchants });
  }
  return out.sort((a, b) => b.spend - a.spend);
}

export function dailyDebitTotals(state: AppState, ym: string): DailyTotal[] {
  const days = daysInMonth(ym);
  const buckets: DailyTotal[] = [];
  for (let d = 1; d <= days; d++) {
    buckets.push({ date: `${ym}-${String(d).padStart(2, '0')}`, spend: 0, count: 0 });
  }
  for (const t of debitsForMonth(state, ym)) {
    const day = Number(t.date.slice(8, 10));
    const bucket = buckets[day - 1];
    if (bucket) {
      bucket.spend += t.amount;
      bucket.count += 1;
    }
  }
  return buckets;
}

export function topMerchants(state: AppState, ym: string, limit = 8): MerchantSpend[] {
  const debits = debitsForMonth(state, ym);
  const map = new Map<string, MerchantSpend>();
  for (const t of debits) {
    const existing = map.get(t.description);
    if (existing) {
      existing.spend += t.amount;
      existing.count += 1;
      if (t.date > existing.lastDate) existing.lastDate = t.date;
    } else {
      map.set(t.description, {
        description: t.description,
        category: t.category ?? 'other',
        spend: t.amount,
        count: 1,
        lastDate: t.date,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.spend - a.spend).slice(0, limit);
}

// ── Income streams (derived) ──────────────────────────────────────────────
//
// Until a parser produces explicit IncomeStream records, we infer
// "streams" from the actual credit transactions in the ledger: group by
// normalized description, classify by keyword.

export type IncomeStreamType = 'salary' | 'pension' | 'rental' | 'reimbursement' | 'insurance-payout' | 'other';

export interface DerivedIncomeStream {
  id: string;
  label: string;
  type: IncomeStreamType;
  /** Average per occurrence. */
  amount: number;
  /** Total received YTD (sum across the period covered by the data). */
  ytd: number;
  occurrences: number;
  /** Most recent date this stream credited. */
  lastDate: string;
  /** Monthly equivalent — for composition / KPI math. */
  monthlyEquivalent: number;
  frequency: 'monthly' | 'yearly' | 'one-time';
}

const TYPE_PATTERNS: { type: IncomeStreamType; pattern: RegExp }[] = [
  { type: 'salary', pattern: /\b(salary|sal\s*cr|payroll|wages)\b/i },
  { type: 'pension', pattern: /\bpension\b/i },
  { type: 'rental', pattern: /\b(rent|tenant)\b/i },
  { type: 'insurance-payout', pattern: /\b(survival\s*benefit|maturity\s*proceeds|insurance\s*claim)\b/i },
  { type: 'reimbursement', pattern: /\b(reimburs|refund|reversal|cashback)\b/i },
];

function classifyIncome(description: string): IncomeStreamType {
  for (const { type, pattern } of TYPE_PATTERNS) if (pattern.test(description)) return type;
  return 'other';
}

/** Strip the noisy parts of a UPI / NEFT description so similar credits group
 *  together (e.g. "UPI-EMPLOYER-XYZ123" and "UPI-EMPLOYER-ABC456" both → "UPI EMPLOYER"). */
function normalizeForGrouping(s: string): string {
  return s
    .toUpperCase()
    .replace(/\d+/g, '')
    .replace(/[A-Z]{0,3}\d{6,}/g, '')
    .replace(/[\-_@.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
}

export function derivedIncomeStreams(state: AppState): DerivedIncomeStream[] {
  const groups = new Map<string, { occurrences: number; ytd: number; lastDate: string; rawLabel: string }>();
  for (const t of Object.values(state.transactions)) {
    if (t.direction !== 'C') continue;
    const key = normalizeForGrouping(t.description);
    if (!key) continue;
    const g = groups.get(key) ?? { occurrences: 0, ytd: 0, lastDate: '', rawLabel: t.description };
    g.occurrences += 1;
    g.ytd += t.amount;
    if (t.date > g.lastDate) {
      g.lastDate = t.date;
      g.rawLabel = t.description;
    }
    groups.set(key, g);
  }
  const streams: DerivedIncomeStream[] = [];
  for (const [, g] of groups) {
    const amount = g.ytd / g.occurrences;
    const frequency: DerivedIncomeStream['frequency'] =
      g.occurrences >= 3 ? 'monthly' : g.occurrences === 1 ? 'one-time' : 'yearly';
    const monthlyEquivalent =
      frequency === 'monthly' ? amount :
      frequency === 'yearly' ? amount / 12 :
      0;
    streams.push({
      id: `inc_${normalizeForGrouping(g.rawLabel).replace(/\s+/g, '_').toLowerCase()}`,
      label: g.rawLabel,
      type: classifyIncome(g.rawLabel),
      amount,
      ytd: g.ytd,
      occurrences: g.occurrences,
      lastDate: g.lastDate,
      monthlyEquivalent,
      frequency,
    });
  }
  return streams.sort((a, b) => b.monthlyEquivalent - a.monthlyEquivalent || b.ytd - a.ytd);
}

export interface IncomeKpis {
  monthEquivalent: number;
  annualRunRate: number;
  monthReceived: number;
  monthExpected: number;
  active: number;
  variableCount: number;
}

export function incomeKpis(state: AppState, ym: string): IncomeKpis {
  const streams = derivedIncomeStreams(state);
  const monthEquivalent = streams.reduce((a, s) => a + s.monthlyEquivalent, 0);
  let annualRunRate = 0;
  for (const s of streams) {
    if (s.frequency === 'monthly') annualRunRate += s.amount * 12;
    else if (s.frequency === 'yearly') annualRunRate += s.amount;
    else annualRunRate += s.ytd;
  }
  // monthReceived = sum of credits in `ym`; monthExpected = sum of monthly streams' amounts
  let monthReceived = 0;
  for (const t of Object.values(state.transactions)) {
    if (t.direction === 'C' && t.date.slice(0, 7) === ym) monthReceived += t.amount;
  }
  const monthExpected = streams.filter(s => s.frequency === 'monthly').reduce((a, s) => a + s.amount, 0);
  const variableCount = streams.filter(s => s.frequency === 'one-time').length;
  return { monthEquivalent, annualRunRate, monthReceived, monthExpected, active: streams.length, variableCount };
}

/** Default reporting month: latest YM that has any transactions, or current. */
export function latestMonth(state: AppState): string {
  let latest = '';
  for (const t of Object.values(state.transactions)) {
    const k = monthKey(t.date);
    if (k > latest) latest = k;
  }
  if (latest) return latest;
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
