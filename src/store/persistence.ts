// Persistence — Strategy pattern. Default backend is localStorage; Drive
// sync ships later as a drop-in replacement.

import type { AppState } from './types';
import { emptyState, SCHEMA_VERSION } from './types';

export interface Persistence {
  readonly id: string;
  load(): Promise<AppState | null>;
  save(state: AppState): Promise<void>;
  /** Optional clear; useful for sign-out. */
  clear?(): Promise<void>;
}

const KEY = 'fd:state:v1';

export class LocalStoragePersistence implements Persistence {
  readonly id = 'persist.localstorage';

  async load(): Promise<AppState | null> {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Partial<AppState>;
      if (parsed.schemaVersion !== SCHEMA_VERSION) return null;
      return { ...emptyState(), ...parsed } as AppState;
    } catch {
      return null;
    }
  }

  async save(state: AppState): Promise<void> {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(KEY, JSON.stringify(state));
  }

  async clear(): Promise<void> {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(KEY);
  }
}
