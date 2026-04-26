// Parser-side types — the contracts every reader and parser fulfills.
// These are intentionally separate from the domain types: parsers translate
// FROM source-specific shapes TO domain shapes (the Adapter pattern).

import type {
  IncomeStream,
  Obligation,
  SavingsInstrument,
  Transaction,
} from '@/domain/types';

// ── Source side: the raw input ────────────────────────────────────────────

export interface RawFile {
  name: string;
  mimeType: string;
  size: number;
  /** ArrayBuffer for binary (PDF/XLSX), string for text (CSV/TXT). */
  data: ArrayBuffer | string;
}

// ── Reader output: a normalized intermediate ──────────────────────────────

export interface ExtractedTable {
  /** Identifier for the table within the document (e.g. 'transactions'). */
  name?: string;
  headers: string[];
  rows: string[][];
}

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export interface ExtractedDocument {
  sourceFile: { name: string; mimeType: string; hash: string };
  /** Concatenated text across all pages / sheets. Always present. */
  text: string;
  /** Per-page text — populated by PDF reader. */
  pages?: ExtractedPage[];
  /** Tabular data — populated by CSV / XLSX readers. */
  tables?: ExtractedTable[];
  /** Source-specific metadata (XLSX sheet names, PDF info dict, etc). */
  metadata?: Record<string, unknown>;
}

// ── Reader interface (Strategy) ───────────────────────────────────────────

export interface ReadOptions {
  password?: string;
  signal?: AbortSignal;
}

export interface Reader {
  readonly id: string;
  /** True if this reader can handle the given file. */
  canRead(file: RawFile): boolean;
  read(file: RawFile, opts?: ReadOptions): Promise<ExtractedDocument>;
}

// ── Parser output: the typed records produced ─────────────────────────────

export type ProducedRecordKind =
  | 'transactions'
  | 'obligations'
  | 'incomeStreams'
  | 'savingsInstruments'
  | 'paymentEvents';

export interface ParseWarning {
  code: string;
  message: string;
  rowIndex?: number;
  pageNumber?: number;
  raw?: unknown;
}

/**
 * A receipt / confirmation record that mutates an existing record in the
 * store rather than creating a new one. Receipt parsers emit PaymentEvents;
 * the store finds the matching SavingsInstrument (or other target) and marks
 * the corresponding payment as paid + attaches the receipt document.
 *
 * Designed for extension: every insurance / RD / FD receipt parser uses the
 * same shape — the discriminated `matchTo` controls how the store finds the
 * target record.
 */
export interface PaymentEvent {
  /** Stable id derived from receiptDocId + paidDate. */
  id: string;
  matchTo: PaymentMatchKey;
  amount: number;
  /** ISO date the payment was made (per the receipt). */
  paidDate: string;
  /** Receipt number, transaction ref, etc. */
  reference?: string;
  /** Document.id of the receipt PDF. Filled by the base parser from the
   *  source file hash so subclasses don't have to thread it through. */
  receiptDocId?: string;
}

export type PaymentMatchKey =
  /** Match a SavingsInstrument by its `policyNumber` field
   *  (HDFCLifePolicy, LICEndowmentPolicy, etc). */
  | { kind: 'policy'; institution: string; policyNumber: string }
  /** Match by exact instrument id (when the receipt names it directly). */
  | { kind: 'instrument'; instrumentId: string };

export interface ParseResult {
  source: {
    parserId: string;
    parserVersion: string;
    fileHash: string;
    sourceName: string;
    parsedAt: string;
  };
  transactions: Transaction[];
  obligations: Obligation[];
  incomeStreams: IncomeStream[];
  savingsInstruments: SavingsInstrument[];
  /** Mutate existing records (e.g. mark a premium as paid). */
  paymentEvents: PaymentEvent[];
  warnings: ParseWarning[];
}

// ── Parser interface (Adapter + Template Method) ──────────────────────────

export interface Parser {
  readonly id: string;
  readonly version: string;
  readonly displayName: string;
  /** Which kinds of records this parser produces. */
  readonly produces: readonly ProducedRecordKind[];
  /** Self-detection — return true if this parser recognizes the document. */
  detect(extracted: ExtractedDocument): boolean;
  parse(extracted: ExtractedDocument): ParseResult;
}

// ── Errors (typed, exhaustive) ────────────────────────────────────────────

export type ParseError =
  | { code: 'no-reader-for-mime'; mimeType: string; sourceName: string }
  | { code: 'reader-failed'; sourceName: string; cause: string }
  | { code: 'password-required'; sourceName: string }
  | { code: 'no-parser-matched'; sourceName: string }
  | { code: 'parser-failed'; parserId: string; sourceName: string; cause: string };
