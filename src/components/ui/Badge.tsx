import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type BadgeTone = 'neutral' | 'accent' | 'gain' | 'loss' | 'warn' | 'info' | 'pending';

interface BadgeProps {
  tone?: BadgeTone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

const toneClass: Record<BadgeTone, { bg: string; fg: string; dot: string }> = {
  neutral: { bg: 'bg-surface-alt', fg: 'text-ink-muted', dot: 'bg-ink-subtle' },
  accent: { bg: 'bg-accent-soft', fg: 'text-accent-ink', dot: 'bg-accent' },
  gain: { bg: 'bg-gain-soft', fg: 'text-gain', dot: 'bg-gain' },
  loss: { bg: 'bg-loss-soft', fg: 'text-loss', dot: 'bg-loss' },
  warn: { bg: 'bg-warn-soft', fg: 'text-warn', dot: 'bg-warn' },
  info: { bg: 'bg-info-soft', fg: 'text-info', dot: 'bg-info' },
  pending: { bg: 'bg-pending-soft', fg: 'text-pending', dot: 'bg-pending' },
};

export function Badge({ tone = 'neutral', dot, children, className }: BadgeProps) {
  const c = toneClass[tone];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 h-5 px-2 rounded-sm text-[11px] font-semibold tracking-wide',
        c.bg,
        c.fg,
        className,
      )}
    >
      {dot && <span className={cn('w-[6px] h-[6px] rounded-full', c.dot)} />}
      {children}
    </span>
  );
}
