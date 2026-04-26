// StatementParser — abstract Template Method base for statement-shaped
// parsers (bank statements, credit-card statements, broker statements).
//
// Subclasses fill in:
//   - id, version, displayName, produces (declared statics)
//   - detect()                 — return true if this parser should handle the doc
//   - extractTransactions()    — required for bank/CC statements
//   - extractObligations()     — optional (default: [])
//   - extractIncomeStreams()   — optional (default: [])
//   - extractSavingsInstruments() — optional (default: [])
//   - enrich()                 — optional post-process pass
//
// The `parse()` algorithm is fixed: read context, run each extractor,
// enrich, attach source-trace metadata, return.

import type {
  ExtractedDocument,
  ParseResult,
  ParseWarning,
  Parser,
  PaymentEvent,
  ProducedRecordKind,
} from '../types';
import type {
  IncomeStream,
  Obligation,
  SavingsInstrument,
  Transaction,
} from '@/domain/types';

export interface ParseContext {
  doc: ExtractedDocument;
  warnings: ParseWarning[];
}

export abstract class StatementParser implements Parser {
  abstract readonly id: string;
  abstract readonly version: string;
  abstract readonly displayName: string;
  abstract readonly produces: readonly ProducedRecordKind[];

  abstract detect(extracted: ExtractedDocument): boolean;

  parse(extracted: ExtractedDocument): ParseResult {
    const ctx: ParseContext = { doc: extracted, warnings: [] };

    const transactions = this.extractTransactions(extracted, ctx);
    const obligations = this.extractObligations(extracted, ctx);
    const incomeStreams = this.extractIncomeStreams(extracted, ctx);
    const savingsInstruments = this.extractSavingsInstruments(extracted, ctx);
    // Receipt parsers fill in receiptDocId from the source file. The store
    // resolves it against the Document records registered at upload time.
    const sourceDocId = `doc_${extracted.sourceFile.hash.slice(0, 12)}`;
    const paymentEvents = this.extractPaymentEvents(extracted, ctx).map(e => ({
      ...e,
      receiptDocId: e.receiptDocId ?? sourceDocId,
    }));

    const enriched = this.enrich(transactions, ctx);

    return {
      source: {
        parserId: this.id,
        parserVersion: this.version,
        fileHash: extracted.sourceFile.hash,
        sourceName: extracted.sourceFile.name,
        parsedAt: new Date().toISOString(),
      },
      transactions: enriched,
      obligations,
      incomeStreams,
      savingsInstruments,
      paymentEvents,
      warnings: ctx.warnings,
    };
  }

  protected abstract extractTransactions(doc: ExtractedDocument, ctx: ParseContext): Transaction[];

  protected extractObligations(_doc: ExtractedDocument, _ctx: ParseContext): Obligation[] {
    return [];
  }
  protected extractIncomeStreams(_doc: ExtractedDocument, _ctx: ParseContext): IncomeStream[] {
    return [];
  }
  protected extractSavingsInstruments(_doc: ExtractedDocument, _ctx: ParseContext): SavingsInstrument[] {
    return [];
  }
  /** Receipt parsers override this to confirm payments against existing
   *  records (e.g. mark a policy premium as paid). */
  protected extractPaymentEvents(_doc: ExtractedDocument, _ctx: ParseContext): PaymentEvent[] {
    return [];
  }
  protected enrich(transactions: Transaction[], _ctx: ParseContext): Transaction[] {
    return transactions;
  }

  // ── Helpers subclasses can lean on ──────────────────────────────────────

  protected warn(ctx: ParseContext, code: string, message: string, extra?: Partial<ParseWarning>): void {
    ctx.warnings.push({ code, message, ...extra });
  }

  /** Stable, hashable transaction id from natural keys — keeps re-parses idempotent. */
  protected makeTxnId(parts: { date: string; amount: number; description: string; accountId: string }): string {
    const norm = `${parts.date}|${parts.amount.toFixed(2)}|${parts.description.trim().toLowerCase()}|${parts.accountId}`;
    // Cheap fingerprint — full SHA isn't needed for collision resistance at single-user scale.
    let h = 2166136261;
    for (let i = 0; i < norm.length; i++) {
      h ^= norm.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return `txn_${(h >>> 0).toString(36)}`;
  }
}
