// ParsePipeline — Facade over readers/parsers/categorizers, with a typed
// Observer event stream so the UI can update DocumentTile parse status as
// each step completes.

import type { CategorizerChain } from './categorizers';
import type { ParserRegistry } from './parsers/registry';
import type { ReaderRegistry } from './readers';
import { PasswordRequiredError } from './readers/pdfReader';
import { Err, Ok, type Result } from './result';
import type { ParseError, ParseResult, RawFile, ReadOptions } from './types';

export type PipelineEvent =
  | { type: 'reader-selected'; readerId: string }
  | { type: 'extracted'; pageCount?: number; rowCount?: number }
  | { type: 'parser-selected'; parserId: string }
  | { type: 'parsed'; recordCounts: { transactions: number; obligations: number; incomeStreams: number; savingsInstruments: number } }
  | { type: 'warning'; code: string; message: string }
  | { type: 'done'; result: ParseResult }
  | { type: 'failed'; error: ParseError };

export interface PipelineOptions {
  readOptions?: ReadOptions;
  /** Skip detection and force a specific parser by id. */
  forceParserId?: string;
  /** Subscribe to step-by-step events (parse-status badges, progress, etc). */
  onEvent?: (event: PipelineEvent) => void;
}

export class ParsePipeline {
  constructor(
    private readers: ReaderRegistry,
    private parsers: ParserRegistry,
    private categorizers: CategorizerChain,
  ) {}

  async run(file: RawFile, opts: PipelineOptions = {}): Promise<Result<ParseResult, ParseError>> {
    const emit = opts.onEvent ?? (() => {});

    // ── 1. Reader selection (Strategy) ───────────────────────────────────
    const reader = this.readers.findFor(file);
    if (!reader) {
      const err: ParseError = { code: 'no-reader-for-mime', mimeType: file.mimeType, sourceName: file.name };
      emit({ type: 'failed', error: err });
      return Err(err);
    }
    emit({ type: 'reader-selected', readerId: reader.id });

    // ── 2. Extraction ────────────────────────────────────────────────────
    let extracted;
    try {
      extracted = await reader.read(file, opts.readOptions);
    } catch (e) {
      if (e instanceof PasswordRequiredError) {
        const err: ParseError = { code: 'password-required', sourceName: file.name };
        emit({ type: 'failed', error: err });
        return Err(err);
      }
      const err: ParseError = { code: 'reader-failed', sourceName: file.name, cause: stringifyError(e) };
      emit({ type: 'failed', error: err });
      return Err(err);
    }
    emit({
      type: 'extracted',
      pageCount: extracted.pages?.length,
      rowCount: extracted.tables?.reduce((n, t) => n + t.rows.length, 0),
    });

    // ── 3. Parser selection (Chain of Responsibility) ────────────────────
    const parser = opts.forceParserId
      ? this.parsers.byId(opts.forceParserId)
      : this.parsers.detect(extracted);
    if (!parser) {
      const err: ParseError = { code: 'no-parser-matched', sourceName: file.name };
      emit({ type: 'failed', error: err });
      return Err(err);
    }
    emit({ type: 'parser-selected', parserId: parser.id });

    // ── 4. Parse (Adapter + Template Method) ─────────────────────────────
    let result: ParseResult;
    try {
      result = parser.parse(extracted);
    } catch (e) {
      const err: ParseError = { code: 'parser-failed', parserId: parser.id, sourceName: file.name, cause: stringifyError(e) };
      emit({ type: 'failed', error: err });
      return Err(err);
    }

    // ── 5. Categorize transactions (Chain of Responsibility) ─────────────
    result = {
      ...result,
      transactions: this.categorizers.categorizeAll(result.transactions),
    };

    // ── 6. Emit and return ───────────────────────────────────────────────
    for (const w of result.warnings) emit({ type: 'warning', code: w.code, message: w.message });
    emit({
      type: 'parsed',
      recordCounts: {
        transactions: result.transactions.length,
        obligations: result.obligations.length,
        incomeStreams: result.incomeStreams.length,
        savingsInstruments: result.savingsInstruments.length,
      },
    });
    emit({ type: 'done', result });
    return Ok(result);
  }
}

function stringifyError(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}
