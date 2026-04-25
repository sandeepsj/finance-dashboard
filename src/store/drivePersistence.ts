// Drive-backed persistence: replaces LocalStoragePersistence when the user
// is signed in. Implements the same `Persistence` interface so the store
// doesn't care which backend is active.

import { readDataJson, writeDataJson } from '@/auth/drive';
import type { Persistence } from './persistence';
import { emptyState, SCHEMA_VERSION, type AppState } from './types';

export class DrivePersistence implements Persistence {
  readonly id = 'persist.drive';

  async load(): Promise<AppState | null> {
    try {
      const data = await readDataJson<Partial<AppState>>();
      if (!data) return null;
      if (data.schemaVersion !== SCHEMA_VERSION) return null;
      return { ...emptyState(), ...data } as AppState;
    } catch (e) {
      console.error('[drive] load failed', e);
      return null;
    }
  }

  async save(state: AppState): Promise<void> {
    try {
      await writeDataJson(state);
    } catch (e) {
      console.error('[drive] save failed', e);
    }
  }
}

/**
 * Composite: read prefers `primary`, falls back to `fallback`. Writes go to
 * both (Drive + localStorage) so a brief network outage doesn't mean the
 * user's most recent ingest is lost.
 */
export class CompositePersistence implements Persistence {
  readonly id: string;
  constructor(private primary: Persistence, private fallback: Persistence) {
    this.id = `persist.composite[${primary.id}+${fallback.id}]`;
  }
  async load(): Promise<AppState | null> {
    try {
      const p = await this.primary.load();
      if (p) return p;
    } catch {
      // ignore — try fallback
    }
    return this.fallback.load();
  }
  async save(state: AppState): Promise<void> {
    await Promise.allSettled([this.primary.save(state), this.fallback.save(state)]);
  }
  async clear(): Promise<void> {
    await Promise.allSettled([this.primary.clear?.(), this.fallback.clear?.()]);
  }
}
