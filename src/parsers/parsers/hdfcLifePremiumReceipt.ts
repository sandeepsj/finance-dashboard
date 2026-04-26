// HDFC Life — Premium Receipt PDF.
//
// Receipts are short single-page confirmations of a paid premium. They emit
// a PaymentEvent referencing the policy by its policy number; the store
// finds the matching SavingsInstrument's premium-schedule entry and marks
// it paid + attaches this receipt as the proof.
//
// Same shape works for any insurance receipt parser (LIC, Postal RD, etc.) —
// the discriminated `PaymentMatchKey` keeps the matching logic generic.

import { StatementParser, type ParseContext } from './base';
import type { ExtractedDocument, PaymentEvent, ProducedRecordKind } from '../types';

const RECEIPT_HEADING_RE = /Premium\s*Receipt/i;
const PRODUCT_RE = /HDFC\s*Life|HDFCLife/i;
const POLICY_NO_RE = /Policy\s*No\.?\s*:?\s*(\d+)/i;
const RECEIPT_NO_RE = /Receipt\s*No\s*:?\s*(\d+)/i;
const AMOUNT_RE = /premium\s*payment\s*of\s*INR\s*([\d,]+(?:\.\d{1,2})?)/i;
const PAID_DATE_RE = /(\d{2})\/(\d{2})\/(\d{4})/;

export class HdfcLifePremiumReceiptParser extends StatementParser {
  readonly id = 'parser.hdfc.life-premium-receipt';
  readonly version = '1.0.0';
  readonly displayName = 'HDFC Life premium receipt';
  readonly produces: readonly ProducedRecordKind[] = ['paymentEvents'];

  detect(doc: ExtractedDocument): boolean {
    const t = doc.text;
    return RECEIPT_HEADING_RE.test(t)
      && PRODUCT_RE.test(t)
      && POLICY_NO_RE.test(t)
      && AMOUNT_RE.test(t);
  }

  protected extractTransactions(): never[] {
    return [];
  }

  protected extractPaymentEvents(doc: ExtractedDocument, ctx: ParseContext): PaymentEvent[] {
    const t = doc.text;
    const policyNumber = t.match(POLICY_NO_RE)?.[1];
    const receiptNo = t.match(RECEIPT_NO_RE)?.[1];
    const amountStr = t.match(AMOUNT_RE)?.[1];
    // The first DD/MM/YYYY in the document is the receipt date.
    const dateMatch = t.match(PAID_DATE_RE);

    if (!policyNumber || !amountStr || !dateMatch) {
      this.warn(ctx, 'incomplete', `Receipt missing field(s) — policy=${policyNumber}, amount=${amountStr}, date=${dateMatch?.[0]}`);
      return [];
    }
    const amount = Number(amountStr.replace(/,/g, ''));
    const paidDate = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
    if (!Number.isFinite(amount)) {
      this.warn(ctx, 'bad-amount', `Could not parse amount "${amountStr}"`);
      return [];
    }
    return [
      {
        id: `paid_${policyNumber}_${paidDate}`,
        matchTo: { kind: 'policy', institution: 'hdfcLife', policyNumber },
        amount,
        paidDate,
        reference: receiptNo,
      },
    ];
  }
}
