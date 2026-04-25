import { Link } from 'react-router-dom';
import { TopBar } from '@/components/TopBar';
import { Card } from '@/components/ui/Card';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { KPICard } from '@/components/ui/KPICard';
import { Progress } from '@/components/ui/Progress';
import { Plus, Upload as UploadIcon } from '@/components/ui/Icon';
import { useStoreState } from '@/store/hooks';
import {
  derivedIncomeStreams,
  hasData,
  incomeKpis,
  latestMonth,
  type DerivedIncomeStream,
  type IncomeStreamType,
} from '@/store/derive';
import { formatINR, formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';

const TYPE_BADGE: Record<IncomeStreamType, { label: string; tone: BadgeTone }> = {
  salary: { label: 'SALARY', tone: 'accent' },
  pension: { label: 'PENSION', tone: 'info' },
  rental: { label: 'RENTAL', tone: 'warn' },
  'insurance-payout': { label: 'INSURANCE', tone: 'gain' },
  reimbursement: { label: 'REIMBURSEMENT', tone: 'pending' },
  other: { label: 'OTHER', tone: 'neutral' },
};

const FREQ_LABEL: Record<DerivedIncomeStream['frequency'], string> = {
  monthly: 'Monthly',
  yearly: 'Yearly',
  'one-time': 'Variable',
};

const ACCENT_KEYS: Array<'s1' | 's2' | 's3' | 's4' | 's5'> = ['s1', 's2', 's3', 's4', 's5'];
function accentForIndex(i: number): string {
  return `var(--${ACCENT_KEYS[i % ACCENT_KEYS.length]})`;
}

export function Income() {
  const state = useStoreState();
  if (!hasData(state)) return <IncomeEmpty />;

  const ym = latestMonth(state);
  const streams = derivedIncomeStreams(state);
  const k = incomeKpis(state, ym);

  return (
    <div className="flex flex-col h-full min-w-0">
      <TopBar
        title="Income"
        subtitle={`${k.active} stream${k.active === 1 ? '' : 's'} · monthly equivalent ${formatINR(k.monthEquivalent, { compact: k.monthEquivalent > 999999 })}`}
        period={ymLabel(ym)}
      />
      <div className="flex-1 p-6 flex flex-col gap-4 overflow-auto min-w-0">
        {/* KPI strip */}
        <div className="grid gap-3" style={{ gridTemplateColumns: '1.4fr 1fr 1fr 1fr' }}>
          <Card padding={16} className="flex flex-col gap-3 min-w-0">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-[0.04em]">
                {ymLabel(ym)} · received
              </div>
              <Badge tone="gain" dot>
                {`${monthlyOccurrences(streams, ym)} of ${streams.filter(s => s.frequency === 'monthly').length} in`}
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono font-medium text-ink leading-[1.05] tabular" style={{ fontSize: 32, letterSpacing: '-0.02em' }}>
                {formatINR(k.monthReceived)}
              </span>
              {k.monthExpected > 0 && (
                <span className="font-mono text-[13px] text-ink-subtle tabular">
                  / {formatINR(k.monthExpected)} expected
                </span>
              )}
            </div>
            {k.monthExpected > 0 && (
              <Progress value={k.monthReceived} max={k.monthExpected} tone="accent" height={6} />
            )}
            <div className="text-[11px] text-ink-muted">
              {k.variableCount > 0
                ? `${k.variableCount} variable stream${k.variableCount === 1 ? '' : 's'} not counted in expected`
                : 'All streams accounted for'}
            </div>
          </Card>

          <KPICard
            label="Monthly equivalent"
            value={formatINR(k.monthEquivalent, { compact: k.monthEquivalent > 999999 })}
            footer={`${streams.length} stream${streams.length === 1 ? '' : 's'}`}
          />
          <KPICard
            label="Annual run rate"
            value={formatINR(k.annualRunRate, { compact: true })}
            footer="extrapolated"
          />
          <KPICard
            label="Active streams"
            value={String(k.active)}
            footer={`${streams.filter(s => s.frequency === 'monthly').length} fixed · ${k.variableCount} variable`}
          />
        </div>

        {/* Streams list + composition */}
        <div className="grid gap-3 min-h-0" style={{ gridTemplateColumns: '2fr 1fr' }}>
          <Card padding={0} className="overflow-hidden min-h-0 flex flex-col">
            <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
              <div>
                <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-[0.04em]">Streams</div>
                <div className="text-[13px] text-ink mt-0.5">
                  {streams.length} active · sorted by monthly value
                </div>
              </div>
              <Button variant="primary" size="sm" leadingIcon={<Plus size={13} />} disabled>
                Add stream
              </Button>
            </div>
            <div
              className="grid items-center gap-3.5 px-4 h-7 bg-surface-alt border-t border-b border-border text-[10px] font-semibold text-ink-muted uppercase tracking-[0.05em]"
              style={{ gridTemplateColumns: '24px 1fr 120px 90px 130px' }}
            >
              <div />
              <div>Stream</div>
              <div className="text-right">Amount</div>
              <div className="text-right">Mo eq.</div>
              <div className="text-right">YTD</div>
            </div>
            {streams.map((s, i) => (
              <StreamRow key={s.id} stream={s} accent={accentForIndex(i)} />
            ))}
          </Card>

          <Card padding={16} className="flex flex-col gap-3.5 min-h-0">
            <div>
              <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-[0.04em] mb-2">
                Composition · monthly equivalent
              </div>
              <CompositionBar streams={streams} />
            </div>
            <div className="border-t border-divider pt-3">
              <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-[0.04em] mb-2">Notes</div>
              <div className="flex flex-col gap-2">
                {k.variableCount > 0 && (
                  <div className="flex gap-2 items-start">
                    <Badge tone="pending" dot>Variable</Badge>
                    <span className="text-xs text-ink leading-relaxed">
                      {k.variableCount} stream{k.variableCount === 1 ? '' : 's'} appeared once in your data — treated as one-off.
                    </span>
                  </div>
                )}
                <div className="flex gap-2 items-start">
                  <Badge tone="info" dot>Heuristic</Badge>
                  <span className="text-xs text-ink leading-relaxed">
                    Streams are derived from credits in your statements. As more months upload, the cadence sharpens. A future income-mandate parser will replace these heuristics.
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <YearGrid streams={streams} latestYm={ym} />
      </div>
    </div>
  );
}

function StreamRow({ stream: s, accent }: { stream: DerivedIncomeStream; accent: string }) {
  const tb = TYPE_BADGE[s.type];
  return (
    <div
      className="grid items-center gap-3.5 px-4 py-3.5 border-b border-divider"
      style={{ gridTemplateColumns: '24px 1fr 120px 90px 130px' }}
    >
      <span className="w-2 h-2 rounded-full" style={{ background: accent }} />
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[13px] font-semibold text-ink truncate">{s.label}</span>
          <Badge tone={tb.tone}>{tb.label}</Badge>
          {s.frequency === 'one-time' && <Badge tone="warn" dot>Variable</Badge>}
        </div>
        <div className="text-[11px] text-ink-muted font-mono">
          {FREQ_LABEL[s.frequency]} · {s.occurrences} occurrence{s.occurrences === 1 ? '' : 's'} · last {formatDate(s.lastDate, { short: true })}
        </div>
      </div>
      <div className="font-mono text-[14px] text-ink tabular text-right">{formatINR(s.amount)}</div>
      <div className="font-mono text-[11px] text-ink-subtle tabular text-right">
        {s.frequency !== 'monthly' && s.frequency !== 'one-time' ? `≈${formatINR(Math.round(s.monthlyEquivalent))}/mo` : ''}
      </div>
      <div className="font-mono text-[12px] text-ink-muted tabular text-right">
        YTD {formatINR(s.ytd, { compact: true })}
      </div>
    </div>
  );
}

function CompositionBar({ streams }: { streams: DerivedIncomeStream[] }) {
  const total = streams.reduce((a, s) => a + s.monthlyEquivalent, 0);
  if (total === 0) {
    return <div className="text-[12px] text-ink-muted">No monthly streams detected yet.</div>;
  }
  const segments = streams
    .filter(s => s.monthlyEquivalent > 0)
    .map((s, i) => ({
      label: s.label,
      type: s.type,
      pct: (s.monthlyEquivalent / total) * 100,
      color: accentForIndex(i),
    }));
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex h-3 rounded-full overflow-hidden bg-surface-alt">
        {segments.map((seg, i) => (
          <div key={i} title={`${seg.label} · ${seg.pct.toFixed(1)}%`} style={{ width: `${seg.pct}%`, background: seg.color }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-[11px]">
        {segments.map((seg, i) => (
          <div key={i} className="inline-flex items-center gap-1.5 text-ink-muted">
            <span className="w-2 h-2 rounded-sm" style={{ background: seg.color }} />
            <span className="text-ink">{TYPE_BADGE[seg.type].label.toLowerCase()}</span>
            <span className="font-mono tabular">{seg.pct.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function YearGrid({ streams, latestYm }: { streams: DerivedIncomeStream[]; latestYm: string }) {
  // Build last 12 months ending at latestYm.
  const months: { ym: string; label: string }[] = [];
  const [yStr, mStr] = latestYm.split('-');
  const endY = Number.parseInt(yStr, 10);
  const endM = Number.parseInt(mStr, 10);
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(endY, endM - 1 - i, 1));
    const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    const label = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getUTCMonth()];
    months.push({ ym, label });
  }

  return (
    <Card padding={14}>
      <div className="flex items-baseline justify-between mb-2.5">
        <div>
          <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-[0.04em]">Annual cadence</div>
          <div className="text-[13px] text-ink mt-0.5">Income hits, last 12 months</div>
        </div>
        <div className="text-[11px] text-ink-subtle font-mono">● received  ◯ no data</div>
      </div>
      <div className="grid items-center gap-1.5" style={{ gridTemplateColumns: '180px repeat(12, 1fr)' }}>
        <div />
        {months.map(m => (
          <div key={m.ym} className="text-[10px] font-mono text-ink-subtle text-center tracking-[0.04em]">{m.label}</div>
        ))}
        {streams.slice(0, 6).map((s, idx) => {
          const accent = accentForIndex(idx);
          return (
            <YearGridRow key={s.id} stream={s} months={months} accent={accent} />
          );
        })}
      </div>
    </Card>
  );
}

function YearGridRow({ stream, months, accent }: { stream: DerivedIncomeStream; months: { ym: string }[]; accent: string }) {
  const state = useStoreState();
  // Mark a month as "received" if the stream had at least one credit in that month.
  const hits = new Set<string>();
  for (const t of Object.values(state.transactions)) {
    if (t.direction !== 'C') continue;
    if (t.description !== stream.label) continue;
    hits.add(t.date.slice(0, 7));
  }
  return (
    <>
      <div className="flex items-center gap-2 text-[12px] text-ink min-w-0">
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: accent }} />
        <span className="truncate">{stream.label}</span>
      </div>
      {months.map(m => {
        const had = hits.has(m.ym);
        return (
          <div key={m.ym} className="flex justify-center">
            <span
              className={cn('w-2 h-2 rounded-full', had ? '' : 'bg-divider')}
              style={had ? { background: accent } : undefined}
            />
          </div>
        );
      })}
    </>
  );
}

function monthlyOccurrences(streams: DerivedIncomeStream[], ym: string): number {
  let n = 0;
  for (const s of streams) {
    if (s.frequency !== 'monthly') continue;
    if (s.lastDate.slice(0, 7) >= ym) n += 1;
  }
  return n;
}

function ymLabel(ym: string): string {
  const [y, m] = ym.split('-');
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(m) - 1] + ' ' + y;
}

function IncomeEmpty() {
  return (
    <div className="flex flex-col h-full min-w-0">
      <TopBar title="Income" subtitle="Upload a statement to see your real income streams" />
      <div className="flex-1 p-6 overflow-auto">
        <Card padding={32} className="flex flex-col items-center gap-3 max-w-md mx-auto text-center">
          <div className="text-[20px] font-semibold text-ink">No income streams yet</div>
          <div className="text-[13px] text-ink-muted">
            Upload a bank statement and the dashboard will derive your salary, rent, and other recurring credits automatically.
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
