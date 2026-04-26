import { describe, expect, it } from 'vitest';
import { Store } from './store';
import type { HDFCLifePolicy } from '@/domain/types';
import type { ParseResult, PaymentEvent } from '@/parsers';

function makePolicy(): HDFCLifePolicy {
  return {
    id: 'hdfclife_1234',
    type: 'hdfcLife',
    label: 'Test policy',
    institution: 'HDFC Life',
    productName: 'Sanchay Par Advantage',
    policyNumber: '1234',
    sumAssuredOnDeath: 1000000,
    sumAssuredOnMaturity: 500000,
    premiumPayingTerm: 5,
    policyTerm: 20,
    riskCommencementDate: '2022-03-07',
    maturityDate: '2042-03-07',
    amountPerInstallment: 100000,
    frequency: 'yearly',
    startDate: '2022-03-07',
    totalPaidToDate: 0,
    sourceDocIds: ['docA'],
    premiumSchedule: [
      { dueDate: '2022-03-07', amount: 100000 },
      { dueDate: '2023-03-07', amount: 100000 },
      { dueDate: '2024-03-07', amount: 100000 },
      { dueDate: '2025-03-07', amount: 100000 },
      { dueDate: '2026-03-07', amount: 100000 },
    ],
    payoutSchedule: [],
  };
}

function makeResult(overrides: Partial<ParseResult> = {}): ParseResult {
  return {
    source: { parserId: 'p', parserVersion: '1', fileHash: 'h', sourceName: 'x', parsedAt: '2026-04-26' },
    transactions: [], obligations: [], incomeStreams: [], savingsInstruments: [],
    paymentEvents: [], warnings: [],
    ...overrides,
  };
}

describe('Store.applyPaymentEvent', () => {
  it('marks the closest scheduled premium as paid', () => {
    const store = new Store();
    const policy = makePolicy();
    store.replaceState({
      schemaVersion: 1,
      documents: {},
      transactions: {},
      savingsInstruments: { [policy.id]: policy },
      obligations: {},
      incomeStreams: {},
      updatedAt: '2026-04-26',
    });

    const event: PaymentEvent = {
      id: 'paid_1234_2024-02-12',
      matchTo: { kind: 'policy', institution: 'hdfcLife', policyNumber: '1234' },
      amount: 100000,
      paidDate: '2024-02-12',
      receiptDocId: 'doc_receipt1',
      reference: 'R001',
    };
    store.ingestParseResult(makeResult({ paymentEvents: [event] }));

    const updated = store.getSnapshot().savingsInstruments[policy.id] as HDFCLifePolicy;
    const paid = updated.premiumSchedule!.filter(p => p.paidDate);
    expect(paid).toHaveLength(1);
    expect(paid[0].dueDate).toBe('2024-03-07'); // closest to Feb 12 2024
    expect(paid[0].paidDate).toBe('2024-02-12');
    expect(paid[0].receiptDocId).toBe('doc_receipt1');
  });

  it('multiple receipts mark independent slots', () => {
    const store = new Store();
    const policy = makePolicy();
    store.replaceState({
      schemaVersion: 1,
      documents: {},
      transactions: {},
      savingsInstruments: { [policy.id]: policy },
      obligations: {},
      incomeStreams: {},
      updatedAt: '2026-04-26',
    });

    const events: PaymentEvent[] = [
      { id: 'p1', matchTo: { kind: 'policy', institution: 'hdfcLife', policyNumber: '1234' }, amount: 100000, paidDate: '2023-02-12', receiptDocId: 'r2023' },
      { id: 'p2', matchTo: { kind: 'policy', institution: 'hdfcLife', policyNumber: '1234' }, amount: 100000, paidDate: '2024-02-12', receiptDocId: 'r2024' },
      { id: 'p3', matchTo: { kind: 'policy', institution: 'hdfcLife', policyNumber: '1234' }, amount: 100000, paidDate: '2025-03-07', receiptDocId: 'r2025' },
    ];
    store.ingestParseResult(makeResult({ paymentEvents: events }));

    const updated = store.getSnapshot().savingsInstruments[policy.id] as HDFCLifePolicy;
    const paid = updated.premiumSchedule!.filter(p => p.paidDate).map(p => p.dueDate);
    expect(paid).toEqual(['2023-03-07', '2024-03-07', '2025-03-07']);
  });

  it('ignores events outside the 90-day tolerance', () => {
    const store = new Store();
    const policy = makePolicy();
    store.replaceState({
      schemaVersion: 1,
      documents: {},
      transactions: {},
      savingsInstruments: { [policy.id]: policy },
      obligations: {},
      incomeStreams: {},
      updatedAt: '2026-04-26',
    });

    // 2030 — way outside any scheduled premium.
    const event: PaymentEvent = {
      id: 'p',
      matchTo: { kind: 'policy', institution: 'hdfcLife', policyNumber: '1234' },
      amount: 100000,
      paidDate: '2030-06-01',
    };
    store.ingestParseResult(makeResult({ paymentEvents: [event] }));

    const updated = store.getSnapshot().savingsInstruments[policy.id] as HDFCLifePolicy;
    expect(updated.premiumSchedule!.filter(p => p.paidDate)).toHaveLength(0);
  });
});
