// HDFC Bank Account Statement (PDF, password-protected with customer ID).
//
// Format characteristics (from real statements, position-aware text extraction):
//   - Header section with personal info; transactions table starts after the
//     literal column header row "Date Narration Chq./Ref.No. ..."
//   - Each transaction's first line starts with a 2-digit DD/MM/YY date
//   - Continuation lines (multi-line narrations) don't start with a date —
//     they belong to the preceding transaction
//   - Per row, after the date: narration ref-no value-date <amount> [amount]
//     <closing-balance>. Either Withdrawal or Deposit column is filled, never
//     both. After position-aware extraction we see only one amount per row.
//   - Direction is determined by closing-balance differential between
//     consecutive rows (with a fallback heuristic for the first row).

import type { Transaction } from '@/domain/types';
import { StatementParser, type ParseContext } from './base';
import type { ExtractedDocument, ProducedRecordKind } from '../types';

const HEADER_LINE_RE = /Date\s+Narration\s+Chq\.?\/Ref\.?No\.?\s+Value\s*Dt/i;
const FOOTER_MARKERS = [
  /STATEMENT SUMMARY/i,
  /HDFC BANK LIMITED/i,
  /This is a computer generated/i,
  /Page No\b/i,
  /Generated On:/i,
];
const DATE_LINE_RE = /^(\d{2})\/(\d{2})\/(\d{2})\s+(.*)$/;
const AMOUNT_TOKEN = String.raw`(\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?)`;
// Match the trailing "<refNo> <DD/MM/YY> [<amt1>] <amt2OrBal> <closingBal>" patterns.
// The narration is everything before the long ref number on the same line.
const TRAIL_RE = new RegExp(
  String.raw`(\S+)\s+(\d{2}\/\d{2}\/\d{2})\s+(?:` + AMOUNT_TOKEN + String.raw`\s+)?` + AMOUNT_TOKEN + `$`,
);

function parseAmount(s: string): number {
  return Number(s.replace(/,/g, ''));
}

function toIsoDate(dd: string, mm: string, yy: string): string {
  const year = Number.parseInt(yy, 10);
  const fullYear = year >= 70 ? 1900 + year : 2000 + year;
  return `${fullYear}-${mm}-${dd}`;
}

function isFooter(line: string): boolean {
  return FOOTER_MARKERS.some(re => re.test(line));
}

function detectFirstRowDirection(narration: string): 'D' | 'C' | null {
  const n = narration.toUpperCase();
  if (/\bACH\s*D-?\b/.test(n)) return 'D';
  if (/\bACH\s*C-?\b/.test(n)) return 'C';
  if (/\b(SALARY|JUSPAY|REFUND|REVERSAL|INT\.?\s*PD|CASHBACK|DIVIDEND)\b/.test(n)) return 'C';
  if (/\bUPI[- ]/.test(n)) return 'D';
  if (/\bATM[- ]/.test(n)) return 'D';
  return null;
}

interface RawRow {
  date: string;
  narration: string;
  refNo: string;
  amount: number;
  closingBalance: number;
}

function extractRowsFromLines(lines: string[]): RawRow[] {
  const rows: RawRow[] = [];
  let inTable = false;
  let pending: { firstLine: string; cont: string[] } | null = null;

  const flush = () => {
    if (!pending) return;
    const { firstLine, cont } = pending;
    pending = null;
    const m = firstLine.match(DATE_LINE_RE);
    if (!m) return;
    const date = toIsoDate(m[1], m[2], m[3]);
    const rest = m[4];
    const trail = rest.match(TRAIL_RE);
    if (!trail) return;
    // Capture groups: 1=refNo, 2=valueDate, 3=optional firstAmount, 4=secondAmount.
    const refNo = trail[1];
    const firstAmountStr = trail[3];
    const secondAmount = parseAmount(trail[4]);
    if (firstAmountStr == null || !Number.isFinite(secondAmount)) {
      // No transaction amount before the closing balance — not a real txn row.
      return;
    }
    const amount = parseAmount(firstAmountStr);
    const closingBalance = secondAmount;
    if (!Number.isFinite(amount)) return;
    const narration = (rest.slice(0, trail.index ?? 0).trim() + ' ' + cont.join(' '))
      .replace(/\s+/g, ' ')
      .trim();
    rows.push({ date, narration, refNo, amount, closingBalance });
  };

  // skipContinuations: true between a footer marker and the next transaction
  // line. Page breaks dump many lines of header/footer text in the middle of
  // the table; without this, those would get appended as continuation
  // narration to the row that ended the previous page.
  let skipContinuations = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (!inTable) {
      if (HEADER_LINE_RE.test(line)) inTable = true;
      continue;
    }
    if (DATE_LINE_RE.test(line)) {
      flush();
      pending = { firstLine: line, cont: [] };
      skipContinuations = false;
      continue;
    }
    if (isFooter(line)) {
      flush();
      skipContinuations = true;
      continue;
    }
    if (pending && !skipContinuations) pending.cont.push(line);
  }
  flush();
  return rows;
}

function extractAccountMask(text: string): string {
  // "Account No : <16-digit-acct-no> VIRTUAL PREFERRED" → mask using last 4 digits
  const m = text.match(/Account\s*No\s*:?\s*(\d{8,})/i);
  if (m) {
    const num = m[1];
    return `XXXX${num.slice(-4)}`;
  }
  return 'XXXX';
}

export class HdfcBankStatementParser extends StatementParser {
  readonly id = 'parser.hdfc.bank-statement';
  readonly version = '1.0.0';
  readonly displayName = 'HDFC Bank account statement';
  readonly produces: readonly ProducedRecordKind[] = ['transactions'];

  detect(doc: ExtractedDocument): boolean {
    const t = doc.text;
    return /HDFC\s+BANK\s+LIMITED/i.test(t)
      && /Withdrawal\s+Amt/i.test(t)
      && /Closing\s+Balance/i.test(t);
  }

  protected extractTransactions(doc: ExtractedDocument, ctx: ParseContext): Transaction[] {
    const lines = (doc.pages ?? [{ pageNumber: 1, text: doc.text }])
      .flatMap(p => p.text.split('\n'));

    const rows = extractRowsFromLines(lines);
    if (rows.length === 0) {
      this.warn(ctx, 'no-rows', 'Found header but extracted zero transaction rows.');
      return [];
    }

    const accountMask = extractAccountMask(doc.text);
    const accountId = `hdfc:${accountMask}`;
    const sourceDocId = doc.sourceFile.hash;

    // Determine direction by closing-balance differential.
    const out: Transaction[] = [];
    let prevBalance: number | null = null;
    rows.forEach((r, idx) => {
      let direction: 'D' | 'C';
      if (prevBalance == null) {
        const heur = detectFirstRowDirection(r.narration);
        if (heur) {
          direction = heur;
        } else {
          this.warn(ctx, 'first-row-direction-unknown', `Row 1: could not determine direction; assumed debit. Narration: "${r.narration.slice(0, 60)}"`, { rowIndex: idx });
          direction = 'D';
        }
      } else {
        const diff = r.closingBalance - prevBalance;
        if (Math.abs(Math.abs(diff) - r.amount) > 0.5) {
          this.warn(ctx, 'balance-amount-mismatch', `Row ${idx + 1}: balance diff ${diff.toFixed(2)} ≠ amount ${r.amount.toFixed(2)}`, { rowIndex: idx });
        }
        direction = diff >= 0 ? 'C' : 'D';
      }
      prevBalance = r.closingBalance;

      out.push({
        id: this.makeTxnId({ date: r.date, amount: r.amount, description: r.narration, accountId }),
        date: r.date,
        amount: r.amount,
        direction,
        description: r.narration,
        rawDescription: r.narration,
        accountId,
        sourceDocId,
      });
    });

    return out;
  }
}
