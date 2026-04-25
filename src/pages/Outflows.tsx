import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TopBar } from '@/components/TopBar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { KPICard } from '@/components/ui/KPICard';
import { Progress } from '@/components/ui/Progress';
import { DailyDebitChart } from '@/components/ui/DailyDebitChart';
import { Upload as UploadIcon } from '@/components/ui/Icon';
import { useStoreState } from '@/store/hooks';
import {
  dailyDebitTotals,
  hasData,
  latestMonth,
  outflowCategories,
  outflowKpis,
  topMerchants,
} from '@/store/derive';
import { formatINR } from '@/lib/format';
import { CATEGORY_ACCENT, categoryLabel } from '@/lib/categorize';
import { cn } from '@/lib/cn';

const MONTH_LABEL = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function ymLabel(ym: string): string {
  const [y, m] = ym.split('-');
  return `${MONTH_LABEL[Number(m) - 1]} ${y}`;
}

export function Outflows() {
  const state = useStoreState();
  if (!hasData(state)) return <OutflowsEmpty />;

  // Period selector — list of months that have any debits.
  const monthsAvailable = useMemo(() => {
    const set = new Set<string>();
    for (const t of Object.values(state.transactions)) {
      if (t.direction === 'D') set.add(t.date.slice(0, 7));
    }
    return [...set].sort();
  }, [state.transactions]);

  const defaultYm = latestMonth(state);
  const [ym, setYm] = useState<string>(defaultYm);
  const activeYm = monthsAvailable.includes(ym) ? ym : monthsAvailable[monthsAvailable.length - 1] ?? defaultYm;

  const k = outflowKpis(state, activeYm);
  const categories = outflowCategories(state, activeYm);
  const merchants = topMerchants(state, activeYm, 8);
  const daily = dailyDebitTotals(state, activeYm);
  const recurringPct = k.total > 0 ? (k.recurring / k.total) * 100 : 0;

  return (
    <div className="flex flex-col h-full min-w-0">
      <TopBar
        title="Outflows"
        subtitle={`${ymLabel(activeYm)} · ${k.txnCount} debit${k.txnCount === 1 ? '' : 's'} · ${formatINR(k.total, { compact: k.total > 999999 })} total`}
        period={ymLabel(activeYm)}
      />
      <div className="flex-1 p-6 flex flex-col gap-4 overflow-auto min-w-0">
        {/* Period switcher */}
        {monthsAvailable.length > 1 && (
          <div className="flex items-center gap-2 text-[12px]">
            <span className="text-ink-muted">Period</span>
            <div className="flex gap-1 flex-wrap">
              {monthsAvailable.map(m => (
                <button
                  key={m}
                  onClick={() => setYm(m)}
                  className={cn(
                    'h-7 px-3 rounded-full text-[11px] font-medium transition-colors',
                    m === activeYm ? 'bg-accent-soft text-accent-ink' : 'bg-surface-alt text-ink-muted hover:text-ink',
                  )}
                >
                  {ymLabel(m).replace(' 20', ' ')}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* KPI strip */}
        <div className="grid grid-cols-4 gap-3">
          <Card padding={16} className="flex flex-col gap-3 min-w-0">
            <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-[0.04em]">Total spent</div>
            <div className="font-mono font-medium text-ink leading-[1.05] tabular" style={{ fontSize: 28, letterSpacing: '-0.02em' }}>
              {formatINR(k.total, { compact: k.total > 999999 })}
            </div>
            <Progress
              value={k.recurring}
              max={k.total || 1}
              tone="accent"
              height={6}
              label={`Recurring ${formatINR(k.recurring, { compact: true })}`}
              valueLabel={`${recurringPct.toFixed(0)}%`}
            />
            <div className="text-[11px] text-ink-muted">
              Variable {formatINR(k.variable, { compact: true })} · {(100 - recurringPct).toFixed(0)}%
            </div>
          </Card>

          <KPICard
            label="Top category"
            value={k.topCategory ? categoryLabel(k.topCategory.category) : '—'}
            footer={k.topCategory ? formatINR(k.topCategory.spend, { compact: true }) : ''}
          />
          <KPICard
            label="Daily average"
            value={formatINR(k.dailyAverage)}
            footer={`${k.txnCount} txns`}
          />
          <KPICard
            label="Categories"
            value={String(categories.length)}
            footer={categories.slice(0, 2).map(c => categoryLabel(c.category)).join(' · ')}
          />
        </div>

        {/* Daily debit chart */}
        <Card padding={16} className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-[0.04em]">Daily debits</div>
              <div className="text-[13px] text-ink mt-0.5">
                When money left your accounts in {ymLabel(activeYm)}
              </div>
            </div>
            <div className="text-[11px] text-ink-muted">
              max <span className="font-mono text-ink">{formatINR(Math.max(0, ...daily.map(d => d.spend)), { compact: true })}</span>
            </div>
          </div>
          <DailyDebitChart data={daily} />
        </Card>

        {/* Two-column: categories + top merchants */}
        <div className="grid gap-3" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
          <Card padding={0} className="overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
              <div>
                <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-[0.04em]">By category</div>
                <div className="text-[13px] text-ink mt-0.5">{categories.length} categories · sorted by spend</div>
              </div>
            </div>
            <div
              className="grid items-center gap-3 px-4 h-7 bg-surface-alt border-t border-b border-border text-[10px] font-semibold text-ink-muted uppercase tracking-[0.05em]"
              style={{ gridTemplateColumns: '12px 1fr 70px 100px 120px' }}
            >
              <div />
              <div>Category</div>
              <div className="text-right">Txns</div>
              <div className="text-right">Spend</div>
              <div className="text-right">% of total</div>
            </div>
            {categories.map(c => {
              const pct = k.total > 0 ? (c.spend / k.total) * 100 : 0;
              return (
                <div
                  key={c.category}
                  className="grid items-center gap-3 px-4 py-3 border-b border-divider last:border-b-0"
                  style={{ gridTemplateColumns: '12px 1fr 70px 100px 120px' }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: CATEGORY_ACCENT[c.category] ?? 'var(--accent)' }} />
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-ink">{categoryLabel(c.category)}</div>
                    <div className="text-[11px] text-ink-muted truncate font-mono">
                      {c.topMerchants.slice(0, 2).map(m => trimMerchant(m.description)).join(' · ')}
                      {c.topMerchants.length > 2 && ` · +${c.topMerchants.length - 2}`}
                    </div>
                  </div>
                  <div className="text-right font-mono text-[12px] text-ink-muted tabular">{c.txnCount}</div>
                  <div className="text-right font-mono text-[14px] text-ink tabular">
                    {formatINR(c.spend, { compact: c.spend > 99999 })}
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[11px] text-ink-muted tabular">{pct.toFixed(1)}%</div>
                    <div className="h-1 bg-surface-alt rounded-full overflow-hidden mt-1">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: CATEGORY_ACCENT[c.category] ?? 'var(--accent)' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </Card>

          <Card padding={0} className="overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
              <div>
                <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-[0.04em]">Top merchants</div>
                <div className="text-[13px] text-ink mt-0.5">{merchants.length} entities · {ymLabel(activeYm)}</div>
              </div>
            </div>
            {merchants.length === 0 ? (
              <div className="px-4 py-6 text-center text-[13px] text-ink-muted">No debits in this period.</div>
            ) : (
              <div className="flex flex-col">
                {merchants.map(m => (
                  <div
                    key={m.description}
                    className="flex items-center gap-3 px-4 py-3 border-t border-divider"
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CATEGORY_ACCENT[m.category] ?? 'var(--accent)' }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] text-ink truncate">{trimMerchant(m.description)}</div>
                      <div className="text-[11px] text-ink-muted font-mono">
                        <Badge tone="neutral">{categoryLabel(m.category)}</Badge>
                        <span className="ml-2">{m.count}× · last {m.lastDate.slice(8)}</span>
                      </div>
                    </div>
                    <div className="font-mono text-[13px] text-ink tabular text-right">
                      {formatINR(m.spend, { compact: m.spend > 99999 })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function trimMerchant(desc: string): string {
  // Long UPI strings have noise after the merchant name; keep up to the first
  // hyphen group separator.
  const cleaned = desc.replace(/^UPI[- ]/i, '').replace(/-PAYTMQR\S+/, '').replace(/\s+/g, ' ').trim();
  return cleaned.length > 42 ? cleaned.slice(0, 40) + '…' : cleaned;
}

function OutflowsEmpty() {
  return (
    <div className="flex flex-col h-full min-w-0">
      <TopBar title="Outflows" subtitle="Upload a statement to see your spending" />
      <div className="flex-1 p-6 overflow-auto">
        <Card padding={32} className="flex flex-col items-center gap-3 max-w-md mx-auto text-center">
          <div className="text-[20px] font-semibold text-ink">No outflows yet</div>
          <div className="text-[13px] text-ink-muted">
            Drop a bank or credit-card statement on the Upload page and the breakdown by category, top merchants, and daily totals all populate.
          </div>
          <Link to="/upload">
            <Button variant="primary" size="sm" leadingIcon={<UploadIcon size={13} />}>
              Open upload page
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
