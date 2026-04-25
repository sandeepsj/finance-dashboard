import { formatDate, formatINR } from '@/lib/format';
import { Badge, type BadgeTone } from './Badge';

export interface TxnRow {
  date: string;
  desc: string;
  category: string;
  categoryTone?: BadgeTone | 'neutral';
  account: string;
  accentKey?: 's1' | 's2' | 's3' | 's4' | 's5' | 'ink-subtle';
  amount: number;
  /** D = debit, C = credit */
  dir: 'D' | 'C';
}

interface TransactionTableProps {
  rows: TxnRow[];
  dense?: boolean;
}

export function TransactionTable({ rows, dense }: TransactionTableProps) {
  const rowH = dense ? 32 : 40;
  return (
    <div className="bg-surface border border-border rounded-md overflow-hidden">
      <div
        className="grid items-center gap-3 px-4 h-8 bg-surface-alt border-b border-border text-[10px] font-semibold text-ink-muted uppercase tracking-[0.05em]"
        style={{ gridTemplateColumns: '90px 1fr 130px 110px 130px' }}
      >
        <div>Date</div>
        <div>Description</div>
        <div>Category</div>
        <div>Account</div>
        <div className="text-right">Amount</div>
      </div>
      {rows.map((r, idx) => (
        <div
          key={idx}
          className={'grid items-center gap-3 px-4 text-[13px] ' + (idx < rows.length - 1 ? 'border-b border-divider' : '')}
          style={{ gridTemplateColumns: '90px 1fr 130px 110px 130px', height: rowH }}
        >
          <div className="font-mono text-ink-muted text-xs">{formatDate(r.date, { short: true })}</div>
          <div className="min-w-0 flex items-center gap-2">
            <span className="text-ink truncate">{r.desc}</span>
          </div>
          <div>
            <Badge tone={(r.categoryTone as BadgeTone) || 'neutral'}>{r.category}</Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: r.accentKey ? `var(--${r.accentKey})` : 'var(--ink-subtle)' }}
            />
            <span className="text-ink-muted text-xs font-mono">{r.account}</span>
          </div>
          <div
            className={'text-right font-mono tabular font-medium ' + (r.dir === 'C' ? 'text-gain' : 'text-ink')}
          >
            {r.dir === 'C' ? '+' : ''}
            {formatINR(r.amount, { decimals: 2 })}
          </div>
        </div>
      ))}
    </div>
  );
}
