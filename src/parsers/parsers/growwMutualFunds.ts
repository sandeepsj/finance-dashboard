// Groww Mutual Funds — Holdings export.
//
// XLSX with one "Holdings" sheet. Personal details + portfolio summary at the
// top, then a "HOLDINGS AS ON <date>" header, then a column header row
// followed by one row per scheme/folio. The column layout (zero-indexed):
//   0: Scheme Name              5: Source
//   1: AMC                      6: Units
//   2: Category                 7: Invested Value
//   3: Sub-category             8: Current Value
//   4: Folio No.                9: Returns
//                              10: XIRR (e.g., "5.7%")
//
// Output: one SavingsInstrument per row, type='mutualFund'.

import type { MutualFundHolding, SavingsInstrument } from '@/domain/types';
import { StatementParser, type ParseContext } from './base';
import type { ExtractedDocument, ProducedRecordKind } from '../types';

const HEADER_RE = /Scheme\s*Name.*AMC.*Category.*Folio.*Units.*Invested.*Current/i;

function parseNumber(s: string): number {
  const n = Number((s ?? '').replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : NaN;
}

function parsePercent(s: string): number | undefined {
  const m = (s ?? '').match(/(-?\d+(?:\.\d+)?)\s*%?/);
  if (!m) return undefined;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : undefined;
}

function makeId(folio: string, scheme: string): string {
  const norm = `${folio}|${scheme}`.toLowerCase().replace(/\s+/g, '_');
  return `mf_${norm.slice(0, 60)}`;
}

export class GrowwMutualFundsParser extends StatementParser {
  readonly id = 'parser.groww.mutual-funds';
  readonly version = '1.0.0';
  readonly displayName = 'Groww Mutual Funds holdings';
  readonly produces: readonly ProducedRecordKind[] = ['savingsInstruments'];

  detect(doc: ExtractedDocument): boolean {
    const t = doc.text;
    if (!/Groww/i.test(t)) return false;
    if (!/HOLDING\s*SUMMARY/i.test(t)) return false;
    return doc.tables?.some(tab => tab.rows.some(r => HEADER_RE.test(r.join(' ')))) ?? false;
  }

  protected extractTransactions(): never[] {
    return [];
  }

  protected extractSavingsInstruments(doc: ExtractedDocument, ctx: ParseContext): SavingsInstrument[] {
    const table = doc.tables?.find(t => t.rows.some(r => HEADER_RE.test(r.join(' '))));
    if (!table) {
      this.warn(ctx, 'no-holdings-sheet', 'Could not find a sheet with the holdings header row.');
      return [];
    }

    // Find the header row and start parsing from the next non-empty row.
    let headerIdx = -1;
    for (let i = 0; i < table.rows.length; i++) {
      if (HEADER_RE.test(table.rows[i].join(' '))) { headerIdx = i; break; }
    }
    if (headerIdx < 0) return [];

    const sourceDocId = doc.sourceFile.hash;
    const out: MutualFundHolding[] = [];

    for (let i = headerIdx + 1; i < table.rows.length; i++) {
      const row = table.rows[i];
      const scheme = (row[0] ?? '').trim();
      if (!scheme) continue;
      const amc = (row[1] ?? '').trim();
      const category = (row[2] ?? '').trim();
      const sub = (row[3] ?? '').trim();
      const folio = (row[4] ?? '').trim();
      const units = parseNumber(row[6] ?? '');
      const invested = parseNumber(row[7] ?? '');
      const current = parseNumber(row[8] ?? '');
      const xirr = parsePercent(row[10] ?? '');

      if (!folio) {
        this.warn(ctx, 'missing-folio', `Row ${i + 1}: scheme "${scheme}" has no folio number`, { rowIndex: i });
        continue;
      }
      if (!Number.isFinite(invested) || !Number.isFinite(current)) {
        this.warn(ctx, 'bad-amount', `Row ${i + 1}: missing invested/current value`, { rowIndex: i });
        continue;
      }

      out.push({
        id: makeId(folio, scheme),
        type: 'mutualFund',
        label: scheme,
        institution: amc || 'Mutual Fund',
        // SIP amount and frequency are unknown from a holdings export — the
        // user (or a future SIP-mandate parser) fills these in.
        amountPerInstallment: 0,
        frequency: 'monthly',
        startDate: '',
        totalPaidToDate: invested,
        currentValue: current,
        expectedXIRR: xirr,
        sourceDocIds: [sourceDocId],
        folio,
        amc: amc || 'Mutual Fund',
        scheme,
        category: [category, sub].filter(Boolean).join(' / '),
        units: Number.isFinite(units) ? units : 0,
        nav: Number.isFinite(units) && units > 0 ? +(current / units).toFixed(4) : 0,
      });
    }

    return out;
  }
}
