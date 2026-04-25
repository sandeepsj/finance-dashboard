import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { TopBar } from '@/components/TopBar';
import { Card } from '@/components/ui/Card';
import type { BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { TransactionTable, type TxnRow } from '@/components/ui/TransactionTable';
import { ArrowRight, Search, Upload as UploadIcon } from '@/components/ui/Icon';
import { useStoreState } from '@/store/hooks';
import { hasData } from '@/store/derive';
import { formatINR } from '@/lib/format';
import { categorize, categoryLabel } from '@/lib/categorize';
import { cn } from '@/lib/cn';

type DirFilter = 'all' | 'D' | 'C';

const PAGE_SIZE = 50;

export function Transactions() {
  const state = useStoreState();
  const [search, setSearch] = useState('');
  const [dir, setDir] = useState<DirFilter>('all');
  const [accountId, setAccountId] = useState<string>('all');
  const [page, setPage] = useState(0);

  const allTxns = useMemo(
    () => Object.values(state.transactions).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
    [state.transactions],
  );

  const accountIds = useMemo(() => {
    const set = new Set<string>();
    for (const t of allTxns) set.add(t.accountId);
    return [...set];
  }, [allTxns]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allTxns.filter(t => {
      if (dir !== 'all' && t.direction !== dir) return false;
      if (accountId !== 'all' && t.accountId !== accountId) return false;
      if (q && !t.description.toLowerCase().includes(q) && !t.accountId.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allTxns, dir, accountId, search]);

  const totalDebits = useMemo(() => filtered.filter(t => t.direction === 'D').reduce((a, t) => a + t.amount, 0), [filtered]);
  const totalCredits = useMemo(() => filtered.filter(t => t.direction === 'C').reduce((a, t) => a + t.amount, 0), [filtered]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages - 1);
  const visible = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const rows = visible.map(categorize).map<TxnRow>(t => {
    const { account, accentKey } = accountIdToMask(t.accountId);
    const tone: BadgeTone | undefined = t.category ? 'accent' : undefined;
    return {
      date: t.date,
      desc: t.description,
      category: categoryLabel(t.category),
      categoryTone: tone ?? 'neutral',
      account,
      accentKey,
      amount: t.amount,
      dir: t.direction,
    };
  });

  if (!hasData(state)) return <TransactionsEmpty />;

  return (
    <div className="flex flex-col h-full min-w-0">
      <TopBar
        title="Transactions"
        subtitle={`${allTxns.length} total · ${filtered.length} match current filter`}
      />
      <div className="flex-1 p-6 flex flex-col gap-3 overflow-auto min-w-0">
        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Match" value={String(filtered.length)} sub="rows" />
          <Stat label="Debits" value={formatINR(totalDebits, { compact: totalDebits > 99999 })} sub="filtered" />
          <Stat label="Credits" value={formatINR(totalCredits, { compact: totalCredits > 99999 })} sub="filtered" />
        </div>

        {/* Filter bar */}
        <Card padding={12} className="flex flex-col gap-3">
          <div className="flex items-center gap-2 h-9 px-3 bg-surface-alt rounded-md border border-border">
            <Search size={14} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search description or account…"
              className="flex-1 bg-transparent border-0 outline-none text-[13px] text-ink placeholder:text-ink-subtle"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-ink-subtle hover:text-ink text-sm">×</button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[12px]">
            <FilterGroup label="Direction">
              <Pill active={dir === 'all'} onClick={() => { setDir('all'); setPage(0); }}>All</Pill>
              <Pill active={dir === 'D'} onClick={() => { setDir('D'); setPage(0); }} tone="loss">Debits</Pill>
              <Pill active={dir === 'C'} onClick={() => { setDir('C'); setPage(0); }} tone="gain">Credits</Pill>
            </FilterGroup>

            <div className="w-px h-5 bg-border" />

            <FilterGroup label="Account">
              <Pill active={accountId === 'all'} onClick={() => { setAccountId('all'); setPage(0); }}>All</Pill>
              {accountIds.map(id => {
                const { account } = accountIdToMask(id);
                return (
                  <Pill key={id} active={accountId === id} onClick={() => { setAccountId(id); setPage(0); }}>
                    {account}
                  </Pill>
                );
              })}
            </FilterGroup>
          </div>
        </Card>

        <Card padding={0} className="overflow-hidden min-h-0">
          {rows.length > 0 ? (
            <TransactionTable rows={rows} dense />
          ) : (
            <div className="px-6 py-10 text-center text-[13px] text-ink-muted">
              No transactions match the current filter.
            </div>
          )}
        </Card>

        {pages > 1 && (
          <div className="flex items-center justify-between text-[12px] text-ink-muted">
            <div>
              Page {safePage + 1} of {pages} · showing {visible.length} of {filtered.length}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={safePage === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>
                ← Previous
              </Button>
              <Button variant="secondary" size="sm" disabled={safePage >= pages - 1} onClick={() => setPage(p => Math.min(pages - 1, p + 1))} trailingIcon={<ArrowRight size={13} />}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Card padding={14} className="flex flex-col gap-1">
      <div className="text-[10px] font-semibold text-ink-muted uppercase tracking-[0.04em]">{label}</div>
      <div className="font-mono font-medium text-ink tabular text-[20px]">{value}</div>
      <div className="text-[11px] text-ink-subtle">{sub}</div>
    </Card>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-ink-muted">{label}</span>
      <div className="flex gap-1">{children}</div>
    </div>
  );
}

function Pill({ active, tone, onClick, children }: { active: boolean; tone?: 'gain' | 'loss'; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'h-6 px-2.5 rounded-full text-[11px] font-medium transition-colors',
        active
          ? tone === 'gain' ? 'bg-gain-soft text-gain' :
            tone === 'loss' ? 'bg-loss-soft text-loss' :
            'bg-accent-soft text-accent-ink'
          : 'bg-surface-alt text-ink-muted hover:text-ink',
      )}
    >
      {children}
    </button>
  );
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

function TransactionsEmpty() {
  return (
    <div className="flex flex-col h-full min-w-0">
      <TopBar title="Transactions" subtitle="Upload a statement to see your full ledger" />
      <div className="flex-1 p-6 overflow-auto">
        <Card padding={32} className="flex flex-col items-center gap-3 max-w-md mx-auto text-center">
          <div className="text-[20px] font-semibold text-ink">No transactions yet</div>
          <div className="text-[13px] text-ink-muted">
            Drop a bank or credit-card statement on the Upload page and the ledger fills in automatically.
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
