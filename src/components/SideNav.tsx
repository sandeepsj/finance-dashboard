import { NavLink } from 'react-router-dom';
import { Lock } from './ui/Icon';
import { cn } from '@/lib/cn';

const items = [
  { label: 'Dashboard', glyph: '◇', to: '/' },
  { label: 'Upload', glyph: '↑', to: '/upload' },
  { label: 'Income', glyph: '↗', to: '/income' },
  { label: 'Outflows', glyph: '↘', to: '/outflows' },
  { label: 'Savings', glyph: '◈', to: '/savings' },
  { label: 'Transactions', glyph: '≡', to: '/transactions' },
  { label: 'Documents', glyph: '▤', to: '/documents' },
  { label: 'Monthly review', glyph: '✦', to: '/monthly-review' },
];

export function SideNav() {
  return (
    <div className="w-[220px] bg-surface border-r border-border h-full flex flex-col gap-1 px-3 py-5">
      <div className="flex items-center gap-2.5 px-2 pb-4">
        <div
          className="w-[26px] h-[26px] rounded-[7px] bg-accent text-ink-on-accent flex items-center justify-center font-bold text-sm"
          style={{ letterSpacing: '-0.04em' }}
        >
          fd
        </div>
        <div>
          <div className="text-[13px] font-semibold text-ink -tracking-[0.01em]">finance</div>
          <div className="text-[10px] text-ink-subtle font-mono -mt-0.5">private · Drive</div>
        </div>
      </div>
      {items.map(it => (
        <NavLink
          key={it.label}
          to={it.to}
          end={it.to === '/'}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] cursor-pointer',
              isActive
                ? 'bg-accent-soft text-accent-ink font-semibold'
                : 'text-ink-muted hover:bg-surface-alt font-medium',
            )
          }
        >
          <span className="w-4 text-center font-mono text-[13px]">{it.glyph}</span>
          {it.label}
        </NavLink>
      ))}
      <div className="flex-1" />
      <div className="p-3 border border-border rounded-md text-[11px] text-ink-muted leading-relaxed">
        <div className="flex items-center gap-1.5 mb-1">
          <Lock size={12} />
          <span className="font-semibold text-ink text-xs">End-to-end private</span>
        </div>
        Your statements stay in your Drive. Nothing is sent to the dashboard's servers.
      </div>
    </div>
  );
}
