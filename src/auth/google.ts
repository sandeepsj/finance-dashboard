// Google Identity Services wrapper. Modern token-based OAuth (no third-party
// cookies). Scopes: drive.file (per-app sandbox) + openid email profile.
//
// State is held in a tiny singleton with subscribe/notify so React components
// re-render via useSyncExternalStore.

import type { AccessToken, AuthStatus, User } from './types';

const SCOPES = 'openid email profile https://www.googleapis.com/auth/drive.file';
const TOKEN_KEY = 'fd:auth:v1';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (resp: TokenResponse) => void;
            error_callback?: (err: { type: string; message?: string }) => void;
            prompt?: '' | 'consent' | 'select_account';
          }) => TokenClient;
          revoke: (token: string, done?: () => void) => void;
        };
      };
    };
  }
}

interface TokenClient {
  requestAccessToken: (overrides?: { prompt?: '' | 'consent' | 'select_account' }) => void;
}

interface TokenResponse {
  access_token: string;
  expires_in: string | number;
  scope: string;
  error?: string;
  error_description?: string;
}

interface PersistedSession {
  token: AccessToken;
  user: User;
}

class AuthStore {
  private state: AuthStatus = { kind: 'loading' };
  private listeners = new Set<() => void>();
  private clientId: string | null = null;
  private tokenClient: TokenClient | null = null;
  private userResolver: ((user: User) => void) | null = null;

  configure(clientId: string | null): void {
    this.clientId = clientId;
    if (!clientId) {
      this.set({ kind: 'unconfigured' });
      return;
    }
    void this.bootstrap();
  }

  private async bootstrap(): Promise<void> {
    await waitForGoogle();
    if (!window.google) {
      this.set({ kind: 'error', message: 'Google Identity script failed to load.' });
      return;
    }
    this.tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: this.clientId!,
      scope: SCOPES,
      callback: resp => void this.handleToken(resp),
      error_callback: err => this.set({ kind: 'error', message: err.message ?? err.type }),
    });

    // Restore previous session if the cached token is still valid.
    const restored = readSession();
    if (restored && restored.token.expiresAt > Date.now() + 30_000) {
      this.set({ kind: 'signed-in', user: restored.user, token: restored.token });
      // Schedule silent refresh ahead of expiry.
      this.scheduleRefresh(restored.token.expiresAt);
      return;
    }
    if (restored) {
      // Try silent refresh.
      this.set({ kind: 'signed-out' });
      this.tokenClient.requestAccessToken({ prompt: '' });
      return;
    }
    this.set({ kind: 'signed-out' });
  }

  signIn(): void {
    if (!this.tokenClient) return;
    this.set({ kind: 'signing-in' });
    this.tokenClient.requestAccessToken({ prompt: 'consent' });
  }

  signOut(): void {
    const current = this.state;
    if (current.kind === 'signed-in') {
      window.google?.accounts.oauth2.revoke(current.token.value, () => undefined);
    }
    clearSession();
    this.set({ kind: 'signed-out' });
  }

  /** Refresh silently. Resolves with the new token or null if it failed. */
  refresh(): Promise<AccessToken | null> {
    if (!this.tokenClient) return Promise.resolve(null);
    return new Promise<AccessToken | null>(resolve => {
      const off = this.subscribe(() => {
        const s = this.state;
        if (s.kind === 'signed-in') {
          off();
          resolve(s.token);
        } else if (s.kind === 'error' || s.kind === 'signed-out') {
          off();
          resolve(null);
        }
      });
      this.tokenClient!.requestAccessToken({ prompt: '' });
    });
  }

  private async handleToken(resp: TokenResponse): Promise<void> {
    if (resp.error) {
      this.set({ kind: 'error', message: resp.error_description ?? resp.error });
      return;
    }
    const token: AccessToken = {
      value: resp.access_token,
      expiresAt: Date.now() + Number(resp.expires_in) * 1000,
      scope: resp.scope,
    };
    let user: User;
    try {
      user = await fetchUser(token.value);
    } catch (e) {
      this.set({ kind: 'error', message: 'Failed to fetch user info: ' + (e as Error).message });
      return;
    }
    persistSession({ token, user });
    this.set({ kind: 'signed-in', user, token });
    this.scheduleRefresh(token.expiresAt);
    this.userResolver?.(user);
  }

  private scheduleRefresh(expiresAt: number): void {
    const delay = expiresAt - Date.now() - 60_000;
    if (delay <= 0) return;
    setTimeout(() => {
      const s = this.state;
      if (s.kind === 'signed-in' && this.tokenClient) {
        this.tokenClient.requestAccessToken({ prompt: '' });
      }
    }, delay);
  }

  getSnapshot = (): AuthStatus => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private set(state: AuthStatus): void {
    this.state = state;
    for (const l of this.listeners) l();
  }
}

function waitForGoogle(timeoutMs = 5000): Promise<void> {
  return new Promise(resolve => {
    if (window.google?.accounts?.oauth2) return resolve();
    const start = Date.now();
    const interval = setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        clearInterval(interval);
        resolve();
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(interval);
        resolve();
      }
    }, 50);
  });
}

async function fetchUser(token: string): Promise<User> {
  const r = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`userinfo ${r.status}`);
  const data = (await r.json()) as { sub: string; email: string; name?: string; picture?: string };
  return data;
}

function persistSession(session: PersistedSession): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, JSON.stringify(session));
  } catch {
    // sessionStorage may be disabled; non-fatal — token just won't survive reload.
  }
}

function readSession(): PersistedSession | null {
  try {
    const raw = sessionStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedSession;
  } catch {
    return null;
  }
}

function clearSession(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // no-op
  }
}

export const authStore = new AuthStore();

/** Initialize from build-time env. Pass `import.meta.env.VITE_GOOGLE_CLIENT_ID`. */
export function initAuth(clientId: string | undefined): void {
  authStore.configure(clientId ?? null);
}
