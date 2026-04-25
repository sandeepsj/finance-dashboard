// ICICI Bank Credit Card statement (full statement form, not the
// "View Last Statement" summary).
//
// Format:
//   <DD/MM/YYYY> <serNo:8+digits> <description...> <rewardPoints> <amount>[ CR]
//
// Direction: trailing "CR" → credit; otherwise debit.
//
// Some descriptions wrap across two visual lines (e.g. "BANGALORE\nIN" when
// the first line ends with "BANGALORE" and the second has just "IN"). Detect
// short continuation lines and append.

import type { Transaction } from '@/domain/types';
import { StatementParser, type ParseContext } from './base';
import type { ExtractedDocument, ProducedRecordKind } from '../types';

const CARD_LINE_RE = /(\d{4}X+\d{4})/;
const TXN_RE =
  /^(\d{2}\/\d{2}\/\d{4})\s+(\d{8,})\s+(.+?)\s+(-?\d+)\s+([\d,]+\.\d{2})(?:\s+(CR))?\s*$/;

const SKIP_SHORT_RE = /^(\d{1,3}%|#?\s*International Spends|Apparel|Others|For exclusive|offers,?|visit|Reward|Points|amount|SPENDS OVERVIEW|STATEMENT|PAYMENT|MINIMUM|Total|Cash|Credit|Limit|Available|Date\s+SerNo)/i;

function parseAmount(s: string): number {
  return Number(s.replace(/,/g, ''));
}

function toIsoDate(dd: string): string {
  const m = dd.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return dd;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function extractCardMask(text: string): string {
  const m = text.match(CARD_LINE_RE);
  return m ? `XXXX${m[1].slice(-4)}` : 'XXXX';
}

export class IciciCreditCardParser extends StatementParser {
  readonly id = 'parser.icici.credit-card';
  readonly version = '1.0.0';
  readonly displayName = 'ICICI Bank credit card statement';
  readonly produces: readonly ProducedRecordKind[] = ['transactions'];

  detect(doc: ExtractedDocument): boolean {
    const t = doc.text;
    return /ICICI\s*Bank/i.test(t)
      && /CREDIT\s*CARD\s*STATEMENT/i.test(t)
      && /STATEMENT\s*SUMMARY/i.test(t);
  }

  protected extractTransactions(doc: ExtractedDocument, ctx: ParseContext): Transaction[] {
    const lines = (doc.pages ?? [{ pageNumber: 1, text: doc.text }])
      .flatMap(p => p.text.split('\n').map(l => l.trim()))
      .filter(l => l.length > 0);

    const cardMask = extractCardMask(doc.text);
    const accountId = `icici-cc:${cardMask}`;
    const sourceDocId = doc.sourceFile.hash;

    const out: Transaction[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const m = line.match(TXN_RE);
      if (!m) continue;

      const date = toIsoDate(m[1]);
      let description = m[3].replace(/\s+/g, ' ').trim();
      const amount = parseAmount(m[5]);
      const isCredit = m[6] === 'CR';

      // Continuation: next line is short, not another txn, not a section header.
      const next = lines[i + 1];
      if (
        next &&
        next.length <= 6 &&
        !TXN_RE.test(next) &&
        !SKIP_SHORT_RE.test(next) &&
        /^[A-Z][A-Z\s]{0,5}$/.test(next)
      ) {
        description = `${description} ${next}`.trim();
      }

      if (!Number.isFinite(amount)) {
        this.warn(ctx, 'bad-amount', `${date}: could not parse amount "${m[5]}"`, { rowIndex: i });
        continue;
      }

      out.push({
        id: this.makeTxnId({ date, amount, description, accountId }),
        date,
        amount,
        direction: isCredit ? 'C' : 'D',
        description,
        rawDescription: description,
        accountId,
        sourceDocId,
      });
    }

    if (out.length === 0) {
      this.warn(ctx, 'no-rows', 'Detected as ICICI credit card but extracted 0 transactions.');
    }

    return out;
  }
}
