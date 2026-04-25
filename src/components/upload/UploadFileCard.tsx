import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Doc, Lock } from '@/components/ui/Icon';
import { processFile, type UploadStage } from '@/lib/runUpload';
import { formatINR } from '@/lib/format';

interface UploadFileCardProps {
  file: File;
  onRemove: () => void;
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function UploadFileCard({ file, onRemove }: UploadFileCardProps) {
  const [stage, setStage] = useState<UploadStage>({ kind: 'idle' });
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (pwd?: string) => {
    setBusy(true);
    try {
      const result = await processFile(file, { password: pwd });
      setStage(result);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card padding={16} className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-sm bg-surface-alt text-ink-muted flex items-center justify-center shrink-0">
          <Doc size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-ink truncate">{file.name}</div>
          <div className="text-[11px] font-mono text-ink-subtle mt-0.5">
            {fmtBytes(file.size)} · {file.type || guessType(file.name)}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onRemove}>×</Button>
      </div>

      <Status stage={stage} />

      {stage.kind === 'idle' && (
        <Button variant="primary" size="sm" disabled={busy} onClick={() => run()}>
          {busy ? 'Detecting…' : 'Detect & parse'}
        </Button>
      )}

      {stage.kind === 'password-required' && (
        <div className="flex flex-col gap-2 p-3 bg-warn-soft rounded-md">
          <div className="text-[12px] text-ink-muted flex items-center gap-1.5">
            <Lock size={12} /> This PDF is password-protected.
          </div>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter PDF password"
            className="h-8 px-2.5 text-[13px] bg-surface border border-border rounded-sm font-mono outline-none focus:border-accent"
          />
          <Button variant="primary" size="sm" disabled={busy || !password} onClick={() => run(password)}>
            {busy ? 'Parsing…' : 'Unlock & parse'}
          </Button>
        </div>
      )}

      {stage.kind === 'parsed' && <ParsedSummary stage={stage} />}
    </Card>
  );
}

function guessType(name: string): string {
  if (/\.pdf$/i.test(name)) return 'application/pdf';
  if (/\.xlsx?$/i.test(name)) return 'spreadsheet';
  if (/\.csv$/i.test(name)) return 'csv';
  return '';
}

function Status({ stage }: { stage: UploadStage }) {
  switch (stage.kind) {
    case 'idle':
      return <Badge tone="pending" dot>Ready</Badge>;
    case 'reading':
      return <Badge tone="info" dot>Reading…</Badge>;
    case 'detected':
      return (
        <div className="flex items-center gap-2">
          <Badge tone="info" dot>Detected</Badge>
          <span className="text-[12px] text-ink-muted">{stage.parser.displayName}</span>
        </div>
      );
    case 'password-required':
      return <Badge tone="warn" dot>Password required</Badge>;
    case 'parsing':
      return (
        <div className="flex items-center gap-2">
          <Badge tone="info" dot>Parsing</Badge>
          <span className="text-[12px] text-ink-muted">{stage.parser.displayName}</span>
        </div>
      );
    case 'no-parser-matched':
      return (
        <div className="flex flex-col gap-1">
          <Badge tone="loss" dot>No parser matched</Badge>
          <div className="text-[11px] text-ink-muted">
            Add a parser for this format (see <span className="font-mono">src/parsers/README.md</span>).
          </div>
        </div>
      );
    case 'parsed':
      return (
        <div className="flex items-center gap-2">
          <Badge tone="gain" dot>Parsed</Badge>
          <span className="text-[12px] text-ink-muted">{stage.parser.displayName}</span>
        </div>
      );
    case 'failed':
      return (
        <div className="flex flex-col gap-1">
          <Badge tone="loss" dot>Failed</Badge>
          <div className="text-[11px] text-ink-muted">{stage.reason}</div>
        </div>
      );
  }
}

function ParsedSummary({ stage }: { stage: Extract<UploadStage, { kind: 'parsed' }> }) {
  const r = stage.result;
  const totalDebits = r.transactions.filter(t => t.direction === 'D').reduce((a, t) => a + t.amount, 0);
  const totalCredits = r.transactions.filter(t => t.direction === 'C').reduce((a, t) => a + t.amount, 0);
  const invested = r.savingsInstruments.reduce((a, s) => a + (s.totalPaidToDate ?? 0), 0);
  const currentValue = r.savingsInstruments.reduce((a, s) => a + (s.currentValue ?? 0), 0);

  return (
    <div className="border-t border-divider pt-3 flex flex-col gap-2">
      <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-[0.04em]">What we found</div>

      <div className="grid grid-cols-2 gap-2">
        {r.transactions.length > 0 && (
          <Stat label="Transactions" value={String(r.transactions.length)} />
        )}
        {totalDebits > 0 && <Stat label="Total debits" value={formatINR(totalDebits, { compact: totalDebits > 99999 })} />}
        {totalCredits > 0 && <Stat label="Total credits" value={formatINR(totalCredits, { compact: totalCredits > 99999 })} />}
        {r.savingsInstruments.length > 0 && (
          <Stat label="Savings instruments" value={String(r.savingsInstruments.length)} />
        )}
        {invested > 0 && <Stat label="Invested" value={formatINR(invested, { compact: true })} />}
        {currentValue > 0 && <Stat label="Current value" value={formatINR(currentValue, { compact: true })} />}
        {r.obligations.length > 0 && (
          <Stat label="Obligations" value={String(r.obligations.length)} />
        )}
        {r.incomeStreams.length > 0 && (
          <Stat label="Income streams" value={String(r.incomeStreams.length)} />
        )}
      </div>

      {r.warnings.length > 0 && (
        <div className="text-[11px] text-warn">
          {r.warnings.length} warning{r.warnings.length === 1 ? '' : 's'} — first: {r.warnings[0].message}
        </div>
      )}

      {r.transactions.length > 0 && <TxnPreview rows={r.transactions.slice(0, 4)} />}

      <div className="text-[11px] text-ink-subtle">
        Records are already saved to your local store. Open the Dashboard or Documents page to see them.
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <div className="text-[10px] text-ink-subtle font-mono uppercase tracking-[0.04em]">{label}</div>
      <div className="text-[14px] font-mono font-medium text-ink">{value}</div>
    </div>
  );
}

function TxnPreview({ rows }: { rows: { date: string; description: string; amount: number; direction: 'D' | 'C' }[] }) {
  return (
    <div className="bg-surface-alt rounded-sm p-2 flex flex-col gap-1 mt-1">
      {rows.map((r, i) => (
        <div key={i} className="grid items-center text-[12px] gap-2" style={{ gridTemplateColumns: '70px 1fr 90px' }}>
          <div className="font-mono text-ink-subtle text-[11px]">{r.date}</div>
          <div className="text-ink truncate">{r.description}</div>
          <div className={'text-right font-mono ' + (r.direction === 'C' ? 'text-gain' : 'text-ink')}>
            {r.direction === 'C' ? '+' : '−'}
            {formatINR(r.amount)}
          </div>
        </div>
      ))}
    </div>
  );
}
