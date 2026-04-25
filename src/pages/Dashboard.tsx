import { Link } from 'react-router-dom';
import { KPICard } from '@/components/ui/KPICard';
import { Card } from '@/components/ui/Card';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CashflowChart } from '@/components/ui/CashflowChart';
import { TransactionTable, type TxnRow } from '@/components/ui/TransactionTable';
import { ArrowRight, Upload as UploadIcon } from '@/components/ui/Icon';
import { TopBar } from '@/components/TopBar';
import { formatINR, formatDate } from '@/lib/format';
import { useStoreState } from '@/store/hooks';
import {
  cashflow,
  hasData,
  latestMonth,
  monthlyKpi,
  portfolioSummary,
  recentTransactions,
} from '@/store/derive';
import { categorize, categoryLabel } from '@/lib/categorize';

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const mockCashflow = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'].map((m, i) => ({
  month: m,
  income: 180000 + Math.round(Math.sin(i * 0.6) * 20000) + i * 2000,
  outflow: 120000 + Math.round(Math.cos(i * 0.4) * 30000) + (m === 'Mar' ? 240000 : 0) + (m === 'Jun' ? 80000 : 0),
}));

const mockUpcoming: { date: string; label: string; amount: number; tone: BadgeTone }[] = [
  { date: '2026-04-28', label: 'HDFC Regalia · payment due', amount: 84200, tone: 'warn' },
  { date: '2026-05-03', label: 'SIP · Parag Parikh Flexi Cap', amount: 25000, tone: 'accent' },
  { date: '2026-05-15', label: 'LIC premium · Jeevan Anand', amount: 24800, tone: 'info' },
  { date: '2026-06-12', label: 'HDFC Life · Sanchay annual', amount: 240000, tone: 'loss' },
];

const upcomingLabel: Record<BadgeTone, string> = {
  neutral: 'Note',
  accent: 'SIP',
  gain: 'Credit',
  warn: 'Due',
  info: 'Premium',
  loss: 'Big',
  pending: 'Pending',
};

const mockRecent: TxnRow[] = [
  { date: '2026-04-16', desc: 'JUSPAY TECHNOLOGIES PVT LTD', category: 'Salary', categoryTone: 'gain', account: 'HDFC ××34', accentKey: 's1', amount: 184200, dir: 'C' },
  { date: '2026-04-15', desc: 'SIP · PARAG PARIKH FLEXI CAP', category: 'SIP', categoryTone: 'accent', account: 'HDFC ××34', accentKey: 's1', amount: 25000, dir: 'D' },
  { date: '2026-04-14', desc: 'LIC PREMIUM 714829301', category: 'Insurance', categoryTone: 'info', account: 'HDFC ××34', accentKey: 's1', amount: 24800, dir: 'D' },
  { date: '2026-04-13', desc: 'IRCTC · TRAVEL · CHENNAI-MAS', category: 'Travel', categoryTone: 'warn', account: 'HDFC CC ××21', accentKey: 's3', amount: 4250, dir: 'D' },
  { date: '2026-04-12', desc: 'AMAZON.IN · GROCERY', category: 'Groceries', categoryTone: 'neutral', account: 'ICICI AP ××88', accentKey: 's2', amount: 2840, dir: 'D' },
];

function ymToMonthLabel(ym: string): string {
  const [y, m] = ym.split('-');
  return `${MONTH_SHORT[Number(m) - 1]} ${y}`;
}

function ymToShort(ym: string): string {
  const [, m] = ym.split('-');
  return MONTH_SHORT[Number(m) - 1];
}

function pctDelta(curr: number, prev: number): number | undefined {
  if (prev === 0) return undefined;
  return ((curr - prev) / prev) * 100;
}

function accountIdToMask(id: string): { account: string; accentKey: TxnRow['accentKey'] } {
  // 'hdfc:XXXX1851' → 'HDFC ××51'
  const [bank, mask] = id.split(':');
  const last = mask?.replace(/^XXXX/, '') ?? '';
  const palette: Record<string, TxnRow['accentKey']> = {
    hdfc: 's1',
    'hdfc-cc': 's3',
    'icici-cc': 's2',
  };
  const accentKey = palette[bank] ?? 's5';
  const label = bank.replace(/-/g, ' ').toUpperCase() + ' ××' + (last || '··');
  return { account: label, accentKey };
}

export function Dashboard() {
  const state = useStoreState();
  const live = hasData(state);

  if (!live) return <DashboardEmpty />;

  const ym = latestMonth(state);
  const prevYm = previousMonth(ym);
  const cf = cashflow(state, ym, 12);
  const k = monthlyKpi(state, ym);
  const kPrev = monthlyKpi(state, prevYm);
  const portfolio = portfolioSummary(state);
  const recent = recentTransactions(state, 8).map(categorize).map<TxnRow>(t => {
    const { account, accentKey } = accountIdToMask(t.accountId);
    return {
      date: t.date,
      desc: t.description,
      category: categoryLabel(t.category),
      categoryTone: t.category ? 'accent' : 'neutral',
      account,
      accentKey,
      amount: t.amount,
      dir: t.direction,
    };
  });

  const monthLabel = ymToMonthLabel(ym);
  const docCount = Object.keys(state.documents).length;
  const txnsThisMonth = k.txnCount;
  const incomeDelta = pctDelta(k.income, kPrev.income);
  const outflowDelta = pctDelta(k.outflow, kPrev.outflow);
  const cashflowSeries = cf.map(b => ({ month: ymToShort(b.month), income: b.income, outflow: b.outflow }));

  return (
    <div className="flex flex-col h-full min-w-0">
      <TopBar
        title="Dashboard"
        subtitle={`${monthLabel} · ${docCount} document${docCount === 1 ? '' : 's'} parsed`}
        period={ymToMonthLabel(ym).replace(' 20', ' ').slice(0, 7)}
      />
      <div className="flex-1 p-6 flex flex-col gap-4 overflow-auto min-w-0">
        <div className="grid grid-cols-4 gap-3">
          <KPICard
            label={`Income · ${ymToShort(ym)}`}
            value={formatINR(k.income, { compact: k.income > 999999 })}
            delta={incomeDelta}
            deltaLabel={`vs ${ymToShort(prevYm)}`}
          />
          <KPICard
            label={`Outflow · ${ymToShort(ym)}`}
            value={formatINR(k.outflow, { compact: k.outflow > 999999 })}
            delta={outflowDelta}
            deltaLabel={`vs ${ymToShort(prevYm)}`}
          />
          <KPICard
            label={`Free cash · ${ymToShort(ym)}`}
            value={formatINR(k.freeCash, { compact: Math.abs(k.freeCash) > 999999 })}
            footer={`${txnsThisMonth} txns`}
          />
          <KPICard
            label="Portfolio"
            value={formatINR(portfolio.currentValue, { compact: true })}
            delta={portfolio.pnlPct}
            deltaLabel="returns"
            footer={`${portfolio.count} instruments`}
          />
        </div>

        <Card padding={16} className="flex flex-col gap-3 min-h-0">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-[0.04em] mb-1">
                Cashflow · last 12 months
              </div>
              <div className="text-[15px] text-ink">
                Income vs outflow across the period covered by your statements.
              </div>
            </div>
            <div className="flex gap-3.5 text-[11px] text-ink-muted">
              <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-accent" /> Income</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-s4 opacity-85" /> Outflow</span>
            </div>
          </div>
          <CashflowChart data={cashflowSeries} width={620} height={200} />
        </Card>

        <Card padding={0} className="overflow-hidden min-h-0">
          <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
            <div>
              <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-[0.04em]">
                Recent transactions
              </div>
              <div className="text-[13px] text-ink mt-0.5">
                {Object.keys(state.transactions).length} total · {txnsThisMonth} in {ymToShort(ym)}
              </div>
            </div>
            <Link to="/transactions">
              <Button variant="ghost" size="sm" trailingIcon={<ArrowRight size={13} />}>
                See all
              </Button>
            </Link>
          </div>
          <TransactionTable rows={recent} />
        </Card>
      </div>
    </div>
  );
}

function DashboardEmpty() {
  return (
    <div className="flex flex-col h-full min-w-0">
      <TopBar
        title="Dashboard"
        subtitle="Showing illustrative data · upload a statement to see your real numbers"
        period="Sample"
      />
      <div className="flex-1 p-6 flex flex-col gap-4 overflow-auto min-w-0">
        <Card padding={16} className="flex items-center justify-between bg-accent-soft border-accent-soft">
          <div className="text-[13px] text-accent-ink">
            <span className="font-semibold">No data yet.</span>{' '}
            The numbers below are illustrative. Drop a statement on the Upload page and the dashboard fills in automatically.
          </div>
          <Link to="/upload">
            <Button variant="primary" size="sm" leadingIcon={<UploadIcon size={13} />}>
              Upload a file
            </Button>
          </Link>
        </Card>

        <div className="grid grid-cols-4 gap-3">
          <KPICard label="Monthly income" value={formatINR(218400)} sparkData={[180,185,190,200,210,205,212,218,222,218,224,218]} sparkColor="var(--accent)" delta={4.2} deltaLabel="vs March" />
          <KPICard label="Committed outflow" value={formatINR(142800)} sparkData={[120,124,128,130,134,136,138,140,141,142,142,143]} sparkColor="var(--s4)" delta={1.8} deltaLabel="vs March" />
          <KPICard label="Free cash · April" value={formatINR(75600)} delta={-6.4} deltaLabel="vs March" footer="3rd of 30 days" />
          <KPICard label="Net worth" value={formatINR(8420000, { compact: true })} sparkData={[60,62,65,68,70,73,76,78,80,82,83,84]} sparkColor="var(--gain)" delta={12.6} deltaLabel="YTD" />
        </div>

        <div className="grid gap-3 min-h-0" style={{ gridTemplateColumns: '2fr 1fr' }}>
          <Card padding={16} className="flex flex-col gap-3 min-h-0">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-[0.04em] mb-1">Cashflow · 12 months</div>
                <div className="text-[18px] font-semibold text-ink -tracking-[0.01em]">Watch out for <span className="text-warn">March</span> — HDFC Life premium hits.</div>
              </div>
              <div className="flex gap-3.5 text-[11px] text-ink-muted">
                <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-accent" /> Income</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-s4 opacity-85" /> Outflow</span>
              </div>
            </div>
            <CashflowChart data={mockCashflow} width={620} height={200} />
          </Card>
          <Card padding={16} className="flex flex-col gap-3.5 min-h-0">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-[0.04em]">Upcoming · next 60 days</div>
              <Badge tone="neutral">{mockUpcoming.length}</Badge>
            </div>
            <div className="flex flex-col gap-2.5 flex-1">
              {mockUpcoming.map((u, i) => {
                const short = formatDate(u.date, { short: true });
                const [day, mon] = short.split(' ');
                return (
                  <div key={i} className={'flex items-center gap-2.5 ' + (i < mockUpcoming.length - 1 ? 'pb-2.5 border-b border-divider' : '')}>
                    <div className="w-[38px] text-center py-1 border border-border rounded-sm bg-surface-alt">
                      <div className="text-[9px] text-ink-subtle font-mono uppercase tracking-[0.05em]">{mon}</div>
                      <div className="text-sm font-semibold text-ink font-mono leading-[1.1]">{day}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-ink truncate">{u.label}</div>
                      <Badge tone={u.tone}>{upcomingLabel[u.tone]}</Badge>
                    </div>
                    <div className="font-mono text-[13px] text-ink tabular">{formatINR(u.amount, { compact: u.amount >= 100000 })}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <Card padding={0} className="overflow-hidden min-h-0">
          <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
            <div>
              <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-[0.04em]">Recent transactions</div>
              <div className="text-[13px] text-ink mt-0.5">Sample data — uploads will replace this.</div>
            </div>
            <Button variant="ghost" size="sm" trailingIcon={<ArrowRight size={13} />}>See all</Button>
          </div>
          <TransactionTable rows={mockRecent} />
        </Card>
      </div>
    </div>
  );
}

function previousMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
