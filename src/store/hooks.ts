import { useEffect, useSyncExternalStore } from 'react';
import { store } from './store';
import { emptyState, type AppState } from './types';

const empty = emptyState();

export function useStoreState(): AppState {
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    () => empty,
  );
}

export function useStoreSelector<T>(selector: (state: AppState) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getSnapshot()),
    () => selector(empty),
  );
}

/** Trigger a one-time hydrate from persistence on app mount. Safe to mount in
 *  multiple places — only the first call does work. */
export function useHydrate(): void {
  useEffect(() => {
    if (!store.isHydrated()) {
      void store.hydrate();
    }
  }, []);
}
