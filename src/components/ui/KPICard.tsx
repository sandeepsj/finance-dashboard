import { Card } from './Card';
import { Sparkline } from './Sparkline';
import { Delta } from './Delta';

interface KPICardProps {
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
  sparkData?: number[];
  sparkColor?: string;
  footer?: string;
  accent?: string;
}

export function KPICard({
  label,
  value,
  delta,
  deltaLabel,
  sparkData,
  sparkColor,
  footer,
  accent,
}: KPICardProps) {
  return (
    <Card padding={16} elevation={1} className="flex flex-col gap-3 min-w-0">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-[0.04em]">{label}</div>
        {accent && <div className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />}
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <div className="font-mono font-medium text-ink tabular leading-[1.1]" style={{ fontSize: 28, letterSpacing: '-0.02em' }}>
          {value}
        </div>
        {sparkData && <Sparkline data={sparkData} color={sparkColor || 'var(--accent)'} width={84} height={28} />}
      </div>
      {(delta != null || deltaLabel || footer) && (
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          {delta != null && <Delta value={delta} size={12} />}
          {deltaLabel && <span>{deltaLabel}</span>}
          {footer && <span className="ml-auto">{footer}</span>}
        </div>
      )}
    </Card>
  );
}
