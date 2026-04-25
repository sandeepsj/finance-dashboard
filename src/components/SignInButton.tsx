import { Button } from '@/components/ui/Button';
import { Drive } from '@/components/ui/Icon';
import { authStore } from '@/auth/google';
import { useAuth } from '@/auth/hooks';

export function SignInButton() {
  const status = useAuth();

  if (status.kind === 'unconfigured') {
    return (
      <span
        className="inline-flex items-center gap-1.5 h-8 px-3 text-[12px] text-ink-muted bg-surface-alt border border-border rounded-md"
        title="Set VITE_GOOGLE_CLIENT_ID in .env.local to enable Drive sync"
      >
        <Drive size={13} /> Local-only
      </span>
    );
  }

  if (status.kind === 'loading' || status.kind === 'signing-in') {
    return (
      <Button variant="secondary" size="sm" disabled leadingIcon={<Drive size={13} />}>
        {status.kind === 'signing-in' ? 'Signing in…' : 'Loading…'}
      </Button>
    );
  }

  if (status.kind === 'signed-in') {
    const { user } = status;
    return (
      <button
        onClick={() => {
          if (confirm(`Sign out ${user.email}?`)) authStore.signOut();
        }}
        className="inline-flex items-center gap-2 h-8 pl-1 pr-3 bg-surface border border-border rounded-md hover:bg-surface-alt transition-colors"
        title={`Signed in as ${user.email} — click to sign out`}
      >
        {user.picture ? (
          <img src={user.picture} alt="" className="w-6 h-6 rounded-full" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-accent text-ink-on-accent flex items-center justify-center font-semibold text-[10px]">
            {user.email.slice(0, 1).toUpperCase()}
          </div>
        )}
        <span className="text-[12px] text-ink font-mono max-w-[140px] truncate">{user.email}</span>
      </button>
    );
  }

  if (status.kind === 'error') {
    return (
      <Button variant="secondary" size="sm" leadingIcon={<Drive size={13} />} onClick={() => authStore.signIn()}>
        Retry sign-in
      </Button>
    );
  }

  return (
    <Button variant="secondary" size="sm" leadingIcon={<Drive size={13} />} onClick={() => authStore.signIn()}>
      Sign in to Drive
    </Button>
  );
}
