// Store — typed in-memory state with subscribe/notify, debounced persistence,
// and helpers for ingesting parser output. React talks to it through
// useSyncExternalStore (see hooks.ts).

import type { Document, ParseStatus, SavingsInstrument } from '@/domain/types';
import type { ParseResult, PaymentEvent } from '@/parsers';
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
   *  document parse-status, link derivedRecordIds back. Apply paymentEvents
   *  to existing records (mark policy premiums paid, etc). Idempotent —
   *  calling twice with the same result is a no-op. */
  ingestParseResult(result: ParseResult): void {
    this.mutate(prev => {
      const txns = { ...prev.transactions };
      let savings = { ...prev.savingsInstruments };
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

      // Apply payment events — find the matching SavingsInstrument and mark
      // the closest-by-date premium as paid. Receipts arriving before the
      // policy itself become orphans (warned about below).
      for (const event of result.paymentEvents ?? []) {
        savings = applyPaymentEvent(savings, event);
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

  setDocumentDriveStatus(fileHash: string, status: NonNullable<Document['driveSyncStatus']>, driveFileId?: string): void {
    this.mutate(prev => {
      const existing = prev.documents[fileHash];
      if (!existing) return prev;
      return {
        ...prev,
        documents: {
          ...prev.documents,
          [fileHash]: {
            ...existing,
            driveSyncStatus: status,
            driveFileId: driveFileId ?? existing.driveFileId,
          },
        },
      };
    });
  }

  /** Synchronously write the current state to localStorage. Used by the
   *  beforeunload handler so a tab close can't drop the last debounced save. */
  flush(): void {
    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }
    // Best-effort fire-and-forget; localStorage is sync, Drive is async-but-safe-to-skip.
    void this.persistence.save(this.state).catch(err => console.error('[store] flush save failed', err));
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

// ── Payment-event application ────────────────────────────────────────────
//
// A receipt parser emits a `PaymentEvent` saying "this payment confirms the
// premium for policy X paid on date Y". We find the matching
// SavingsInstrument and snap the event onto the closest scheduled payment
// (by date) within a reasonable tolerance, marking it paid.
//
// Same shape works for any future SavingsInstrument with a `premiumSchedule`
// field (LIC, Postal RD, etc).

const MATCH_TOLERANCE_DAYS = 90;

function applyPaymentEvent(
  savings: Record<string, SavingsInstrument>,
  event: PaymentEvent,
): Record<string, SavingsInstrument> {
  const target = findMatchingInstrument(savings, event);
  if (!target) {
    console.warn('[store] payment event has no matching record', event);
    return savings;
  }
  if (!('premiumSchedule' in target) || !target.premiumSchedule) return savings;

  // Pick the closest scheduled payment by absolute date diff.
  let bestIdx = -1;
  let bestDiff = Infinity;
  for (let i = 0; i < target.premiumSchedule.length; i++) {
    const diff = Math.abs(daysBetween(target.premiumSchedule[i].dueDate, event.paidDate));
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i;
    }
  }
  if (bestIdx < 0 || bestDiff > MATCH_TOLERANCE_DAYS) {
    console.warn('[store] payment event outside tolerance', { event, bestDiff });
    return savings;
  }

  const updatedSchedule = target.premiumSchedule.map((p, i) =>
    i === bestIdx
      ? { ...p, paidDate: event.paidDate, receiptDocId: event.receiptDocId, paidTransactionId: p.paidTransactionId }
      : p,
  );
  return {
    ...savings,
    [target.id]: { ...target, premiumSchedule: updatedSchedule } as SavingsInstrument,
  };
}

function findMatchingInstrument(
  savings: Record<string, SavingsInstrument>,
  event: PaymentEvent,
): SavingsInstrument | null {
  if (event.matchTo.kind === 'instrument') {
    return savings[event.matchTo.instrumentId] ?? null;
  }
  // matchTo.kind === 'policy'
  const { policyNumber } = event.matchTo;
  for (const inst of Object.values(savings)) {
    if ('policyNumber' in inst && inst.policyNumber === policyNumber) return inst;
  }
  return null;
}

function daysBetween(a: string, b: string): number {
  const da = Date.parse(a);
  const db = Date.parse(b);
  if (Number.isNaN(da) || Number.isNaN(db)) return Infinity;
  return Math.round((da - db) / 86_400_000);
}

// Singleton — one store per app instance.
export const store = new Store();
