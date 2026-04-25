import { Button } from '@/components/ui/Button';
import { Drive } from '@/components/ui/Icon';
import { authStore } from '@/auth/google';
import { useAuth } from '@/auth/hooks';

/**
 * TopBar auth control. Visibility rules:
 *   - unconfigured (no VITE_GOOGLE_CLIENT_ID): render nothing.
 *   - signed-in: small avatar-only chip; click to sign out.
 *   - signed-out: "Sign in to Drive" button.
 *   - loading / signing-in / error: small status pill (no sign-in button).
 */
export function SignInButton() {
  const status = useAuth();

  if (status.kind === 'unconfigured') return null;

  if (status.kind === 'loading' || status.kind === 'signing-in') {
    return (
      <span className="inline-flex items-center gap-1.5 h-8 px-3 text-[12px] text-ink-muted bg-surface-alt border border-border rounded-md">
        {status.kind === 'signing-in' ? 'Signing in…' : 'Loading…'}
      </span>
    );
  }

  if (status.kind === 'signed-in') {
    const { user } = status;
    return (
      <button
        onClick={() => {
          if (confirm(`Sign out ${user.email}?`)) authStore.signOut();
        }}
        className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:ring-2 hover:ring-accent transition-shadow"
        title={`Signed in as ${user.email} — click to sign out`}
        aria-label={`Signed in as ${user.email}`}
      >
        {user.picture ? (
          <img src={user.picture} alt="" className="w-8 h-8 rounded-full" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-accent text-ink-on-accent flex items-center justify-center font-semibold text-[12px]">
            {user.email.slice(0, 1).toUpperCase()}
          </div>
        )}
      </button>
    );
  }

  // signed-out (and 'error' — give the user a way to retry)
  return (
    <Button variant="secondary" size="sm" leadingIcon={<Drive size={13} />} onClick={() => authStore.signIn()}>
      {status.kind === 'error' ? 'Retry sign-in' : 'Sign in to Drive'}
    </Button>
  );
}
