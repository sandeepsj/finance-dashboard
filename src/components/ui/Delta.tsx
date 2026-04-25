import { cn } from '@/lib/cn';
import { formatINR } from '@/lib/format';

interface DeltaProps {
  value: number;
  decimals?: number;
  currency?: boolean;
  size?: number;
  className?: string;
}

export function Delta({ value, decimals = 1, currency, size = 13, className }: DeltaProps) {
  const positive = value > 0;
  const negative = value < 0;
  const colorClass = positive ? 'text-gain' : negative ? 'text-loss' : 'text-ink-muted';
  const arrow = positive ? '▲' : negative ? '▼' : '–';
  const formatted = currency
    ? formatINR(value, { decimals, compact: Math.abs(value) >= 100000 })
    : (value >= 0 ? '+' : '') + value.toFixed(decimals) + '%';
  return (
    <span
      className={cn('inline-flex items-baseline gap-1 font-mono font-medium tabular', colorClass, className)}
      style={{ fontSize: size }}
    >
      <span style={{ fontSize: size * 0.75 }}>{arrow}</span>
      {formatted}
    </span>
  );
}
