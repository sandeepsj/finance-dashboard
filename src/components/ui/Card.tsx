import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface CardProps {
  children: ReactNode;
  padding?: number;
  elevation?: 0 | 1 | 2 | 3 | 4;
  className?: string;
  style?: CSSProperties;
}

const elevClass: Record<NonNullable<CardProps['elevation']>, string> = {
  0: '',
  1: 'shadow-e1',
  2: 'shadow-e2',
  3: 'shadow-e3',
  4: 'shadow-e4',
};

export function Card({ children, padding = 16, elevation = 1, className, style }: CardProps) {
  return (
    <div
      className={cn('bg-surface border border-border rounded-md transition-shadow', elevClass[elevation], className)}
      style={{ padding, ...style }}
    >
      {children}
    </div>
  );
}
