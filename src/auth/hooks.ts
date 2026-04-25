import { useSyncExternalStore } from 'react';
import { authStore } from './google';
import type { AuthStatus } from './types';

export function useAuth(): AuthStatus {
  return useSyncExternalStore(authStore.subscribe, authStore.getSnapshot, () => ({ kind: 'loading' }));
}

export function useAccessToken(): string | null {
  const status = useAuth();
  return status.kind === 'signed-in' ? status.token.value : null;
}
