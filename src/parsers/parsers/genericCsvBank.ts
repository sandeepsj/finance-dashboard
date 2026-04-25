// GenericCsvBankParser — a working template for "the simple case": a CSV with
// a header row containing recognizable date/description/amount columns.
//
// Detection is heuristic — it looks for a header row containing both a
// date-ish column and a description-ish column. Use this as a starting point
// for institution-specific parsers; copy this file, rename the class, narrow
// `detect()`, and adjust column matching.

import type { Transaction } from '@/domain/types';
import { StatementParser, type ParseContext } from './base';
import type { ExtractedDocument, ProducedRecordKind } from '../types';

const DATE_HEADERS = ['date', 'txn date', 'transaction date', 'value date', 'posting date'];
const DESC_HEADERS = ['description', 'narration', 'particulars', 'details', 'transaction'];
const DEBIT_HEADERS = ['debit', 'withdrawal', 'dr', 'amount (dr)', 'paid out'];
const CREDIT_HEADERS = ['credit', 'deposit', 'cr', 'amount (cr)', 'paid in'];
const AMOUNT_HEADERS = ['amount', 'transaction amount', 'amt'];

const DATE_FORMATS: { pattern: RegExp; build: (m: RegExpMatchArray) => string }[] = [
  // 16/04/2026 → 2026-04-16
  { pattern: /^(\d{2})[\/\-.](\d{2})[\/\-.](\d{4})$/, build: m => `${m[3]}-${m[2]}-${m[1]}` },
  // 2026-04-16 → 2026-04-16
  { pattern: /^(\d{4})[\/\-.](\d{2})[\/\-.](\d{2})$/, build: m => `${m[1]}-${m[2]}-${m[3]}` },
  // 16-Apr-26 / 16 Apr 2026
  {
    pattern: /^(\d{1,2})[\s\-]([A-Za-z]{3})[\s\-](\d{2,4})$/,
    build: m => {
      const months: Record<string, string> = {
        jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
        jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
      };
      const mm = months[m[2].toLowerCase()];
      const yy = m[3].length === 2 ? `20${m[3]}` : m[3];
      const dd = m[1].padStart(2, '0');
      return mm ? `${yy}-${mm}-${dd}` : '';
    },
  },
];

interface ColumnMap {
  date: number;
  description: number;
  debit?: number;
  credit?: number;
  amount?: number;
}

function findHeader(headers: string[], candidates: string[]): number {
  return headers.findIndex(h => {
    const norm = (h ?? '').trim().toLowerCase();
    return candidates.some(c => norm === c || norm.includes(c));
  });
}

function buildColumnMap(headers: string[]): ColumnMap | null {
  const date = findHeader(headers, DATE_HEADERS);
  const description = findHeader(headers, DESC_HEADERS);
  const debit = findHeader(headers, DEBIT_HEADERS);
  const credit = findHeader(headers, CREDIT_HEADERS);
  const amount = findHeader(headers, AMOUNT_HEADERS);
  if (date < 0 || description < 0) return null;
  if (debit < 0 && credit < 0 && amount < 0) return null;
  return {
    date,
    description,
    debit: debit >= 0 ? debit : undefined,
    credit: credit >= 0 ? credit : undefined,
    amount: amount >= 0 ? amount : undefined,
  };
}

function parseDate(raw: string): string | null {
  const trimmed = (raw ?? '').trim();
  for (const { pattern, build } of DATE_FORMATS) {
    const m = trimmed.match(pattern);
    if (m) {
      const iso = build(m);
      if (iso) return iso;
    }
  }
  return null;
}

function parseAmount(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[₹,\s]/g, '').trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export class GenericCsvBankParser extends StatementParser {
  readonly id = 'parser.generic-csv-bank';
  readonly version = '0.1.0';
  readonly displayName = 'Generic CSV bank statement';
  readonly produces: readonly ProducedRecordKind[] = ['transactions'];

  detect(extracted: ExtractedDocument): boolean {
    const table = extracted.tables?.[0];
    if (!table || table.headers.length === 0) return false;
    return buildColumnMap(table.headers) !== null;
  }

  protected extractTransactions(doc: ExtractedDocument, ctx: ParseContext): Transaction[] {
    const table = doc.tables?.[0];
    if (!table) return [];

    const cols = buildColumnMap(table.headers);
    if (!cols) {
      this.warn(ctx, 'no-columns', 'Could not map header row to date/description/amount.');
      return [];
    }

    const accountId = `csv:${doc.sourceFile.name}`;
    const sourceDocId = doc.sourceFile.hash;
    const out: Transaction[] = [];

    table.rows.forEach((row, idx) => {
      const dateRaw = row[cols.date] ?? '';
      const date = parseDate(dateRaw);
      if (!date) {
        this.warn(ctx, 'bad-date', `Row ${idx + 1}: unrecognized date "${dateRaw}"`, { rowIndex: idx });
        return;
      }

      const description = (row[cols.description] ?? '').trim();
      if (!description) {
        this.warn(ctx, 'empty-description', `Row ${idx + 1}: empty description`, { rowIndex: idx });
        return;
      }

      let amount: number | null = null;
      let direction: 'D' | 'C' = 'D';

      if (cols.debit !== undefined || cols.credit !== undefined) {
        const debit = cols.debit !== undefined ? parseAmount(row[cols.debit]) : null;
        const credit = cols.credit !== undefined ? parseAmount(row[cols.credit]) : null;
        if (debit && debit > 0) {
          amount = debit;
          direction = 'D';
        } else if (credit && credit > 0) {
          amount = credit;
          direction = 'C';
        }
      } else if (cols.amount !== undefined) {
        const a = parseAmount(row[cols.amount]);
        if (a != null) {
          amount = Math.abs(a);
          direction = a < 0 ? 'D' : 'C';
        }
      }

      if (amount == null) {
        this.warn(ctx, 'no-amount', `Row ${idx + 1}: could not extract amount`, { rowIndex: idx });
        return;
      }

      out.push({
        id: this.makeTxnId({ date, amount, description, accountId }),
        date,
        amount,
        direction,
        description,
        rawDescription: description,
        accountId,
        sourceDocId,
      });
    });

    return out;
  }
}
