import { Link } from 'react-router-dom';
import { TopBar } from '@/components/TopBar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { KPICard } from '@/components/ui/KPICard';
import { Delta } from '@/components/ui/Delta';
import { PortfolioDonut } from '@/components/ui/PortfolioDonut';
import { Plus, Upload as UploadIcon } from '@/components/ui/Icon';
import { useStoreState } from '@/store/hooks';
import {
  hasData,
  portfolioByType,
  portfolioSummary,
  type PortfolioGroup,
} from '@/store/derive';
import { formatINR, formatPercent } from '@/lib/format';
import type { SavingsInstrument } from '@/domain/types';

const TYPE_ACCENT: Partial<Record<SavingsInstrument['type'], string>> = {
  mutualFund: 'var(--s1)',
  lic: 'var(--s2)',
  hdfcLife: 'var(--info)',
  postalRd: 'var(--warn)',
  bankFd: 'var(--warn)',
  epf: 'var(--pending)',
  nps: 'var(--pending)',
  ppf: 'var(--accent)',
  sukanya: 'var(--gain)',
  stock: 'var(--s3)',
  other: 'var(--ink-subtle)',
};

const TYPE_GLYPH: Record<SavingsInstrument['type'], string> = {
  mutualFund: 'MF',
  lic: 'LIC',
  hdfcLife: 'HL',
  postalRd: 'PRD',
  bankFd: 'FD',
  epf: 'EPF',
  nps: 'NPS',
  ppf: 'PPF',
  sukanya: 'SS',
  stock: 'EQ',
  other: '·',
};

export function Savings() {
  const state = useStoreState();
  if (!Object.keys(state.savingsInstruments).length) {
    return <SavingsEmpty hasAnyData={hasData(state)} />;
  }

  const summary = portfolioSummary(state);
  const groups = portfolioByType(state);

  // SIPs / monthly outflow toward instruments. Until parsers extract SIP
  // mandates, derive from MF "amountPerInstallment" if set; else 0.
  const monthlySIP = Object.values(state.savingsInstruments).reduce(
    (a, s) => a + (s.frequency === 'monthly' ? s.amountPerInstallment : 0),
    0,
  );

  return (
    <div className="flex flex-col h-full min-w-0">
      <TopBar
        title="Savings"
        subtitle={`${summary.count} instrument${summary.count === 1 ? '' : 's'} · ${formatINR(summary.currentValue, { compact: true })} portfolio · ${groups.length} type${groups.length === 1 ? '' : 's'}`}
        period={formatPercent(summary.pnlPct, 2)}
      />
      <div className="flex-1 p-6 flex flex-col gap-4 overflow-auto min-w-0">
        {/* Hero strip */}
        <div className="grid gap-3" style={{ gridTemplateColumns: '1.6fr 1fr 1fr 1fr' }}>
          <Card padding={18} className="flex gap-4 items-center min-w-0">
            <PortfolioDonut
              size={130}
              thickness={18}
              segments={groups.map(g => ({ value: g.currentValue, color: TYPE_ACCENT[g.type] ?? 'var(--accent)', label: g.label }))}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-[0.04em] mb-1.5">
                Portfolio · current value
              </div>
              <div className="font-mono font-medium text-ink leading-[1.05] tabular" style={{ fontSize: 36, letterSpacing: '-0.025em' }}>
                {formatINR(summary.currentValue)}
              </div>
              <div className="flex items-baseline gap-2 mt-1.5 text-xs text-ink-muted">
                <span>invested <span className="font-mono text-ink">{formatINR(summary.invested, { compact: true })}</span></span>
                <span>·</span>
                <Delta value={summary.pnlPct} size={12} />
                <span className="font-mono">({formatINR(summary.pnl, { compact: true })})</span>
              </div>
            </div>
          </Card>

          <KPICard
            label="Monthly SIPs"
            value={formatINR(monthlySIP)}
            footer={`${Object.values(state.savingsInstruments).filter(s => s.frequency === 'monthly').length} active`}
          />
          <KPICard
            label="Types"
            value={String(groups.length)}
            footer={groups.slice(0, 2).map(g => g.label).join(' · ')}
          />
          <KPICard
            label="Best performer"
            value={bestPerformerLabel(groups) ?? '—'}
            footer={bestPerformerSub(groups)}
          />
        </div>

        {/* Groups */}
        {groups.map(g => (
          <GroupCard key={g.type} group={g} />
        ))}

        <div className="flex justify-center py-2">
          <Button variant="secondary" size="md" leadingIcon={<Plus size={14} />} disabled>
            Add an instrument
          </Button>
        </div>
      </div>
    </div>
  );
}

function GroupCard({ group: g }: { group: PortfolioGroup }) {
  return (
    <Card padding={0} className="overflow-hidden">
      <div className="flex items-end justify-between px-4 pt-3.5 pb-3 border-b border-border">
        <div>
          <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-[0.04em] mb-1">
            {g.label} · {g.instruments.length}
          </div>
          <div className="text-xs text-ink-muted">{groupSubtitle(g)}</div>
        </div>
        <div className="flex items-baseline gap-3.5 text-xs text-ink-muted">
          <span>value <span className="font-mono text-ink font-medium">{formatINR(g.currentValue)}</span></span>
          <span>invested <span className="font-mono text-ink">{formatINR(g.invested, { compact: true })}</span></span>
          <Delta value={g.pnlPct} size={12} />
        </div>
      </div>
      <div
        className="grid items-center gap-3.5 px-4 h-7 bg-surface-alt border-b border-border text-[10px] font-semibold text-ink-muted uppercase tracking-[0.05em]"
        style={{ gridTemplateColumns: '32px 1.6fr 1fr 1fr 1fr' }}
      >
        <div />
        <div>Instrument</div>
        <div className="text-right">Value · invested</div>
        <div className="text-right">Returns / XIRR</div>
        <div className="text-right">Folio / id</div>
      </div>
      {g.instruments.map(i => (
        <InstrumentRow key={i.id} instr={i} accent={TYPE_ACCENT[i.type] ?? 'var(--accent)'} />
      ))}
    </Card>
  );
}

function InstrumentRow({ instr: i, accent }: { instr: SavingsInstrument; accent: string }) {
  const invested = i.totalPaidToDate ?? 0;
  const current = i.currentValue ?? 0;
  const pnl = current - invested;
  const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;

  // Type-specific identifier for the right-most column.
  const ident =
    'folio' in i ? `Folio ${i.folio}` :
    'policyNumber' in i ? `Policy ${i.policyNumber}` :
    'accountNumber' in i ? `Acct ${i.accountNumber}` :
    'pran' in i ? `PRAN ${i.pran}` :
    'uan' in i ? `UAN ${i.uan}` :
    'ticker' in i ? `${i.ticker} · ${i.exchange}` :
    '—';

  // Sub-identifier (scheme category for MF, plan name for LIC, etc.)
  const subline =
    'category' in i ? i.category :
    'planNumber' in i ? `Plan ${i.planNumber}` :
    'productName' in i ? i.productName :
    i.institution;

  return (
    <div
      className="grid items-center gap-3.5 px-4 py-3 border-b border-divider last:border-b-0"
      style={{ gridTemplateColumns: '32px 1.6fr 1fr 1fr 1fr' }}
    >
      <div
        className="w-8 h-8 rounded-sm flex items-center justify-center font-mono font-semibold text-[11px] text-white"
        style={{ background: accent }}
      >
        {TYPE_GLYPH[i.type]}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-ink truncate">{i.label}</span>
          {pnlPct < -3 && <Badge tone="warn" dot>Down</Badge>}
        </div>
        <div className="text-[11px] text-ink-muted font-mono mt-0.5 truncate">{subline}</div>
      </div>
      <div className="text-right">
        <div className="font-mono text-[14px] font-medium text-ink tabular">{formatINR(current)}</div>
        <div className="font-mono text-[10px] text-ink-subtle tabular">invested {formatINR(invested, { compact: true })}</div>
      </div>
      <div className="text-right">
        <Delta value={i.expectedXIRR ?? pnlPct} size={13} />
        <div className="text-[10px] text-ink-subtle font-mono mt-0.5">
          {i.expectedXIRR != null ? 'XIRR' : 'returns'}
        </div>
      </div>
      <div className="text-right">
        <div className="font-mono text-[12px] text-ink-muted tabular truncate">{ident}</div>
      </div>
    </div>
  );
}

function bestPerformerLabel(groups: PortfolioGroup[]): string | null {
  let best: { label: string; pct: number } | null = null;
  for (const g of groups) {
    for (const i of g.instruments) {
      const pct = i.expectedXIRR ?? (() => {
        const inv = i.totalPaidToDate ?? 0;
        return inv > 0 ? (((i.currentValue ?? 0) - inv) / inv) * 100 : 0;
      })();
      if (!best || pct > best.pct) best = { label: i.label, pct };
    }
  }
  if (!best) return null;
  return best.label.length > 24 ? best.label.slice(0, 22) + '…' : best.label;
}

function bestPerformerSub(groups: PortfolioGroup[]): string {
  let best: number | null = null;
  for (const g of groups) {
    for (const i of g.instruments) {
      const inv = i.totalPaidToDate ?? 0;
      const pct = i.expectedXIRR ?? (inv > 0 ? (((i.currentValue ?? 0) - inv) / inv) * 100 : 0);
      if (best == null || pct > best) best = pct;
    }
  }
  return best == null ? '—' : formatPercent(best, 1);
}

function groupSubtitle(g: PortfolioGroup): string {
  const monthlyCount = g.instruments.filter(i => i.frequency === 'monthly').length;
  if (g.type === 'mutualFund') {
    return monthlyCount > 0 ? `${monthlyCount} active SIP${monthlyCount === 1 ? '' : 's'}` : 'Holdings only';
  }
  if (g.type === 'lic' || g.type === 'hdfcLife') return 'Premium-paying policies';
  if (g.type === 'epf' || g.type === 'nps') return 'Retirement';
  return `${g.instruments.length} instrument${g.instruments.length === 1 ? '' : 's'}`;
}

function SavingsEmpty({ hasAnyData }: { hasAnyData: boolean }) {
  return (
    <div className="flex flex-col h-full min-w-0">
      <TopBar
        title="Savings"
        subtitle={hasAnyData ? 'No savings data yet — upload a Groww or AMC report' : 'Upload your first statement'}
      />
      <div className="flex-1 p-6 overflow-auto">
        <Card padding={32} className="flex flex-col items-center gap-3 max-w-md mx-auto text-center">
          <div className="text-[20px] font-semibold text-ink">No instruments yet</div>
          <div className="text-[13px] text-ink-muted">
            Upload a Groww mutual-funds export, an LIC policy schedule, or any savings statement and the page populates automatically.
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
