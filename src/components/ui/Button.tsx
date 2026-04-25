import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'soft' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: Variant;
  size?: Size;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  children?: ReactNode;
}

const sizeClass: Record<Size, string> = {
  sm: 'h-7 px-2.5 text-xs gap-1.5',
  md: 'h-8 px-3 text-[13px] gap-1.5',
  lg: 'h-[38px] px-4 text-sm gap-2',
};

const variantClass: Record<Variant, string> = {
  primary: 'bg-accent text-ink-on-accent border border-accent hover:bg-accent-hover',
  secondary: 'bg-surface text-ink border border-border-strong hover:bg-surface-alt',
  ghost: 'bg-transparent text-ink border border-transparent hover:bg-surface-alt',
  soft: 'bg-accent-soft text-accent-ink border border-transparent',
  danger: 'bg-surface text-loss border border-border-strong',
};

export function Button({
  variant = 'primary',
  size = 'md',
  leadingIcon,
  trailingIcon,
  children,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-md whitespace-nowrap transition-colors',
        '-tracking-[0.005em]',
        sizeClass[size],
        variantClass[variant],
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  );
}
