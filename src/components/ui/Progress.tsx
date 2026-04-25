import { cn } from '@/lib/cn';

type Tone = 'accent' | 'gain' | 'loss' | 'warn' | 'info';

interface ProgressProps {
  value: number;
  max?: number;
  tone?: Tone;
  height?: number;
  label?: string;
  valueLabel?: string;
}

const toneClass: Record<Tone, string> = {
  accent: 'bg-accent',
  gain: 'bg-gain',
  loss: 'bg-loss',
  warn: 'bg-warn',
  info: 'bg-info',
};

export function Progress({ value, max = 100, tone = 'accent', height = 6, label, valueLabel }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="flex flex-col gap-1.5">
      {(label || valueLabel) && (
        <div className="flex justify-between text-[11px] text-ink-muted">
          <span>{label}</span>
          <span className="font-mono text-ink">{valueLabel}</span>
        </div>
      )}
      <div className="bg-surface-alt rounded-full overflow-hidden" style={{ height }}>
        <div className={cn('h-full rounded-full transition-[width]', toneClass[tone])} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
