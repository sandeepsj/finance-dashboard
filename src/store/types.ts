// AppState — the single typed shape that flows through dev (mock), local
// storage, and (later) Google Drive sync. All records keyed by id.

import type {
  Document,
  IncomeStream,
  Obligation,
  SavingsInstrument,
  Transaction,
} from '@/domain/types';

export const SCHEMA_VERSION = 1;

export interface AppState {
  schemaVersion: number;
  documents: Record<string, Document>;
  transactions: Record<string, Transaction>;
  savingsInstruments: Record<string, SavingsInstrument>;
  obligations: Record<string, Obligation>;
  incomeStreams: Record<string, IncomeStream>;
  /** Last write timestamp — for last-write-wins conflict resolution. */
  updatedAt: string;
}

export const emptyState = (): AppState => ({
  schemaVersion: SCHEMA_VERSION,
  documents: {},
  transactions: {},
  savingsInstruments: {},
  obligations: {},
  incomeStreams: {},
  updatedAt: new Date().toISOString(),
});
