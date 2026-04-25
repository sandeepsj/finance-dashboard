// Store — typed in-memory state with subscribe/notify, debounced persistence,
// and helpers for ingesting parser output. React talks to it through
// useSyncExternalStore (see hooks.ts).

import type { Document, ParseStatus } from '@/domain/types';
import type { ParseResult } from '@/parsers';
import { LocalStoragePersistence, type Persistence } from './persistence';
import { emptyState, type AppState, SCHEMA_VERSION } from './types';

export class Store {
  private state: AppState = emptyState();
  private listeners = new Set<() => void>();
  private persistTimer: ReturnType<typeof setTimeout> | null = null;
  private hydrated = false;

  constructor(private persistence: Persistence = new LocalStoragePersistence()) {}

  /** Load persisted state from the configured backend. Call once at app start. */
  async hydrate(): Promise<void> {
    const loaded = await this.persistence.load();
    if (loaded) this.state = loaded;
    this.hydrated = true;
    this.emit();
  }

  isHydrated(): boolean {
    return this.hydrated;
  }

  /** Swap the persistence backend at runtime (e.g. local → composite when the
   *  user signs in). Triggers a hydrate from the new backend; merges with the
   *  current in-memory state so any in-flight ingest isn't lost. */
  async setPersistence(next: Persistence): Promise<void> {
    this.persistence = next;
    const loaded = await next.load();
    if (loaded) {
      // Merge: prefer documents/transactions/etc by id; the loaded snapshot
      // wins on ids it knows, the in-memory snapshot wins on new ids.
      this.state = {
        ...this.state,
        ...loaded,
        documents: { ...this.state.documents, ...loaded.documents },
        transactions: { ...this.state.transactions, ...loaded.transactions },
        savingsInstruments: { ...this.state.savingsInstruments, ...loaded.savingsInstruments },
        obligations: { ...this.state.obligations, ...loaded.obligations },
        incomeStreams: { ...this.state.incomeStreams, ...loaded.incomeStreams },
        updatedAt: new Date().toISOString(),
      };
    }
    this.schedulePersist();
    this.emit();
  }

  getSnapshot = (): AppState => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  /** Schedule a persistence write (debounced 200ms) and notify subscribers now. */
  private schedulePersist(): void {
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => {
      this.persistence.save(this.state).catch(err => console.error('[store] save failed', err));
    }, 200);
  }

  private emit(): void {
    for (const l of this.listeners) l();
  }

  private mutate(updater: (prev: AppState) => AppState): void {
    this.state = { ...updater(this.state), updatedAt: new Date().toISOString() };
    this.schedulePersist();
    this.emit();
  }

  // ── Document lifecycle ────────────────────────────────────────────────

  /** Record a freshly-uploaded file before it's parsed. */
  registerDocument(doc: Omit<Document, 'parseStatus' | 'uploadedAt'> & {
    parseStatus?: ParseStatus;
    uploadedAt?: string;
  }): void {
    this.mutate(prev => {
      const existing = prev.documents[doc.fileHash];
      const next: Document = {
        ...doc,
        parseStatus: doc.parseStatus ?? existing?.parseStatus ?? 'pending',
        uploadedAt: doc.uploadedAt ?? existing?.uploadedAt ?? new Date().toISOString(),
      };
      return { ...prev, documents: { ...prev.documents, [doc.fileHash]: next } };
    });
  }

  /** Apply a parser ParseResult to the store: upsert records by id, update
   *  document parse-status, link derivedRecordIds back. Idempotent — calling
   *  twice with the same result is a no-op. */
  ingestParseResult(result: ParseResult): void {
    this.mutate(prev => {
      const txns = { ...prev.transactions };
      const savings = { ...prev.savingsInstruments };
      const obligations = { ...prev.obligations };
      const incomeStreams = { ...prev.incomeStreams };

      const derivedIds: string[] = [];
      for (const t of result.transactions) {
        txns[t.id] = t;
        derivedIds.push(t.id);
      }
      for (const s of result.savingsInstruments) {
        savings[s.id] = s;
        derivedIds.push(s.id);
      }
      for (const o of result.obligations) {
        obligations[o.id] = o;
        derivedIds.push(o.id);
      }
      for (const i of result.incomeStreams) {
        incomeStreams[i.id] = i;
        derivedIds.push(i.id);
      }

      const docs = { ...prev.documents };
      const existing = docs[result.source.fileHash];
      if (existing) {
        docs[result.source.fileHash] = {
          ...existing,
          parserId: result.source.parserId,
          parseStatus: 'parsed',
          derivedRecordIds: derivedIds,
        };
      }

      return {
        ...prev,
        documents: docs,
        transactions: txns,
        savingsInstruments: savings,
        obligations,
        incomeStreams,
      };
    });
  }

  markDocumentFailed(fileHash: string, _reason: string): void {
    this.mutate(prev => {
      const existing = prev.documents[fileHash];
      if (!existing) return prev;
      return {
        ...prev,
        documents: { ...prev.documents, [fileHash]: { ...existing, parseStatus: 'failed' } },
      };
    });
  }

  /** Remove a document and all records it produced. */
  removeDocument(fileHash: string): void {
    this.mutate(prev => {
      const doc = prev.documents[fileHash];
      if (!doc) return prev;
      const ids = new Set(doc.derivedRecordIds ?? []);
      const filterById = <T extends { id: string }>(rec: Record<string, T>): Record<string, T> => {
        const out: Record<string, T> = {};
        for (const [k, v] of Object.entries(rec)) if (!ids.has(v.id)) out[k] = v;
        return out;
      };
      const docs = { ...prev.documents };
      delete docs[fileHash];
      return {
        ...prev,
        documents: docs,
        transactions: filterById(prev.transactions),
        savingsInstruments: filterById(prev.savingsInstruments),
        obligations: filterById(prev.obligations),
        incomeStreams: filterById(prev.incomeStreams),
      };
    });
  }

  /** Replace state wholesale — used by Drive sync on cold load. */
  replaceState(state: AppState): void {
    if (state.schemaVersion !== SCHEMA_VERSION) {
      console.warn('[store] replaceState: schema version mismatch', state.schemaVersion);
      return;
    }
    this.state = { ...state, updatedAt: new Date().toISOString() };
    this.schedulePersist();
    this.emit();
  }
}

// Singleton — one store per app instance.
export const store = new Store();
