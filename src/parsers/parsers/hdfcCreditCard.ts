// HDFC Bank Credit Card statements (Regalia Gold / Swiggy / etc).
//
// Format characteristics (position-aware text extraction):
//
//   1. Simple txn (one line):
//        DD/MM/YYYY| HH:MM  <description>  [+N|-N]  [+]  C <amount> l
//
//   2. EMI prefix:
//        DD/MM/YYYY| HH:MM  EMI <description>  ...  C <amount> l
//
//   3. IGST / Payment-received pattern (description on line above, ref# split
//      across two lines):
//        IGST-VPS...-RATE 18.0 -32 (Ref#
//        DD/MM/YYYY| HH:MM            C 53.82 l
//        09999999980321000315763)
//
//      The line carrying the date has empty description; the actual
//      description is the line directly above (ending with "(Ref#"); the line
//      directly below has the trailing reference id and closing paren.
//
//   4. International transactions: same shapes, optional `EMI` prefix, and a
//      USD prefix in the description.
//
// Direction: leading `+` before the `C` indicates a credit (payment received
// or refund). Otherwise debit (purchase or fee).

import type { Transaction } from '@/domain/types';
import { StatementParser, type ParseContext } from './base';
import type { ExtractedDocument, ProducedRecordKind } from '../types';

const CARD_LINE_RE = /Credit\s*Card\s*No\.?\s*(\d{4,6}X+\d{4})/i;
const PRODUCT_NAME_RE = /(Regalia\s*Gold|Swiggy|MoneyBack|Diners[^\s]*|Millennia|Infinia|Tata\s*Neu|Marriott\s*Bonvoy)\s*(?:HDFC\s*Bank\s*)?Credit\s*Card/i;

// One-line transaction pattern. Captures:
//   1: date, 2: time, 3: description, 4: rewards (optional, e.g. '+ 8' or '- 32'),
//   5: credit-sign prefix ('+' or empty), 6: amount.
const TXN_RE =
  /^(\d{2}\/\d{2}\/\d{4})\s*\|\s*(\d{2}:\d{2})\s*(.*?)\s*(?:([+\-]\s*\d+)\s+)?(\+\s*)?C\s*([\d,]+\.\d{2})\s*l\s*$/;

const SECTION_HEADERS = [
  /^DATE\s*&\s*TIME/i,
  /^Domestic Transactions/i,
  /^International Transactions/i,
  /^DUPLICATE.*Credit Card Statement/i,
  /^Offers on your card/i,
  /^HSN Code:/i,
  /^HDFC Bank Credit Cards GSTIN/i,
  /^Page\s+\d+\s+of\s+\d+/i,
];

function parseAmount(s: string): number {
  return Number(s.replace(/,/g, ''));
}

function toIsoDate(dd: string): string {
  const m = dd.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return dd;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function isSectionHeader(line: string): boolean {
  return SECTION_HEADERS.some(re => re.test(line));
}

function extractCardMask(text: string): string {
  const m = text.match(CARD_LINE_RE);
  if (!m) return 'XXXX';
  return `XXXX${m[1].slice(-4)}`;
}

// Cardholder name appears as an all-caps line above some IGST txn rows. We
// skip it when picking the description from the line above the date row.
const CARDHOLDER_NAME_RE = /^[A-Z][A-Z\s]{2,40}[A-Z]$/;

function extractProductName(text: string): string | null {
  const m = text.match(PRODUCT_NAME_RE);
  return m ? m[1].replace(/\s+/g, ' ').trim() : null;
}

export class HdfcCreditCardParser extends StatementParser {
  readonly id = 'parser.hdfc.credit-card';
  readonly version = '1.0.0';
  readonly displayName = 'HDFC Bank credit card statement';
  readonly produces: readonly ProducedRecordKind[] = ['transactions'];

  detect(doc: ExtractedDocument): boolean {
    const t = doc.text;
    return /HDFC\s*Bank\s*Credit\s*Cards?\s*GSTIN/i.test(t)
      && /Credit\s*Card\s*No\.?/i.test(t);
  }

  protected extractTransactions(doc: ExtractedDocument, ctx: ParseContext): Transaction[] {
    const lines = (doc.pages ?? [{ pageNumber: 1, text: doc.text }])
      .flatMap(p => p.text.split('\n').map(l => l.trim()))
      .filter(l => l.length > 0);

    const cardMask = extractCardMask(doc.text);
    const product = extractProductName(doc.text) ?? 'HDFC Card';
    const accountId = `hdfc-cc:${cardMask}`;
    const sourceDocId = doc.sourceFile.hash;

    const out: Transaction[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const m = line.match(TXN_RE);
      if (!m) continue;

      const date = toIsoDate(m[1]);
      let description = (m[3] ?? '').replace(/\s+/g, ' ').trim();
      const rawAmount = parseAmount(m[6]);
      const isCredit = !!m[5]; // leading '+' before 'C' marks credit

      // Multi-line description (IGST / CC payment pattern). When the txn
      // line has an empty description, the description lives on the line
      // above (ending with "(Ref#"); the line below has the trailing
      // ref-number and ")".
      if (!description) {
        const above = lines[i - 1];
        const below = lines[i + 1];
        const aboveLooksLikeDesc = above && /\(Ref#$/.test(above);
        if (aboveLooksLikeDesc) {
          const belowMatchesRef = below && /\)\s*$/.test(below) && !TXN_RE.test(below);
          description = belowMatchesRef ? `${above} ${below}` : above;
          description = description.replace(/\s+/g, ' ').trim();
        } else if (above && !TXN_RE.test(above) && !isSectionHeader(above) && !CARDHOLDER_NAME_RE.test(above)) {
          description = above;
        } else {
          this.warn(ctx, 'empty-description', `${date}: empty description, no candidate above`, { rowIndex: i });
          description = '(no description)';
        }
      }

      out.push({
        id: this.makeTxnId({ date, amount: rawAmount, description, accountId }),
        date,
        amount: rawAmount,
        direction: isCredit ? 'C' : 'D',
        description,
        rawDescription: description,
        accountId,
        sourceDocId,
      });
    }

    if (out.length === 0) {
      this.warn(ctx, 'no-rows', `Detected as HDFC ${product} but extracted 0 transactions.`);
    }

    return out;
  }
}
