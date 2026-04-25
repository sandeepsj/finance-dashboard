import { Button } from './ui/Button';
import { SignInButton } from './SignInButton';
import { useTheme } from '@/lib/theme';

interface TopBarProps {
  title: string;
  subtitle?: string;
  period?: string;
}

export function TopBar({ title, subtitle, period }: TopBarProps) {
  const { theme, toggle } = useTheme();
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg">
      <div>
        <div className="text-[22px] font-semibold text-ink leading-[1.15]" style={{ letterSpacing: '-0.015em' }}>
          {title}
        </div>
        {subtitle && <div className="text-xs text-ink-muted mt-0.5">{subtitle}</div>}
      </div>
      <div className="flex items-center gap-2">
        {period && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-surface border border-border rounded-md text-xs text-ink font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            {period}
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={toggle} title="Toggle theme">
          {theme === 'dark' ? '☀' : '☾'}
        </Button>
        <SignInButton />
      </div>
    </div>
  );
}
