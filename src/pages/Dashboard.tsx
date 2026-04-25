import { Link } from 'react-router-dom';
import { KPICard } from '@/components/ui/KPICard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CashflowChart } from '@/components/ui/CashflowChart';
import { TransactionTable, type TxnRow } from '@/components/ui/TransactionTable';
import { ArrowRight, Upload as UploadIcon } from '@/components/ui/Icon';
import { TopBar } from '@/components/TopBar';
import { formatINR } from '@/lib/format';
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
      <TopBar title="Dashboard" subtitle="Drop a statement to populate" />
      <div className="flex-1 p-6 overflow-auto">
        <Card padding={32} className="flex flex-col items-center gap-3 max-w-lg mx-auto text-center">
          <div className="text-[20px] font-semibold text-ink">Nothing here yet</div>
          <div className="text-[13px] text-ink-muted max-w-sm">
            Upload a bank statement, credit-card bill, or broker report and the dashboard fills in with your own numbers — KPIs, cashflow, recent transactions, portfolio.
          </div>
          <Link to="/upload">
            <Button variant="primary" size="sm" leadingIcon={<UploadIcon size={13} />}>
              Open upload page
            </Button>
          </Link>
          <div className="text-[11px] text-ink-subtle font-mono mt-2">
            Files are read in your browser. Sign in to Google Drive to sync across devices.
          </div>
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
