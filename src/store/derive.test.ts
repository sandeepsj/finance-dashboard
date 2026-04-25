import { describe, expect, it } from 'vitest';
import {
  cashflow,
  derivedIncomeStreams,
  monthlyKpi,
  outflowKpis,
  portfolioByType,
  portfolioSummary,
} from './derive';
import { emptyState, type AppState } from './types';
import type { Transaction, MutualFundHolding } from '@/domain/types';

function txn(over: Partial<Transaction>): Transaction {
  return {
    id: over.id ?? 't_' + Math.random(),
    date: over.date ?? '2026-04-15',
    amount: over.amount ?? 100,
    direction: over.direction ?? 'D',
    description: over.description ?? 'test',
    rawDescription: over.description ?? 'test',
    accountId: over.accountId ?? 'hdfc:XXXX1234',
    sourceDocId: 'doc1',
    ...over,
  };
}

function stateWithTxns(...txns: Transaction[]): AppState {
  const s = emptyState();
  for (const t of txns) s.transactions[t.id] = t;
  return s;
}

describe('monthlyKpi', () => {
  it('sums income and outflow for the given YM only', () => {
    const s = stateWithTxns(
      txn({ id: 'a', date: '2026-04-01', amount: 100000, direction: 'C' }),
      txn({ id: 'b', date: '2026-04-15', amount: 30000, direction: 'D' }),
      txn({ id: 'c', date: '2026-03-31', amount: 50000, direction: 'D' }), // not in April
    );
    const k = monthlyKpi(s, '2026-04');
    expect(k.income).toBe(100000);
    expect(k.outflow).toBe(30000);
    expect(k.freeCash).toBe(70000);
    expect(k.txnCount).toBe(2);
  });
});

describe('cashflow', () => {
  it('produces n-month bucket array ending at endYm', () => {
    const s = stateWithTxns(
      txn({ id: 'a', date: '2026-04-01', amount: 100, direction: 'C' }),
      txn({ id: 'b', date: '2026-02-01', amount: 50, direction: 'D' }),
    );
    const buckets = cashflow(s, '2026-04', 3);
    expect(buckets).toHaveLength(3);
    expect(buckets.map(b => b.month)).toEqual(['2026-02', '2026-03', '2026-04']);
    expect(buckets[0].outflow).toBe(50);
    expect(buckets[2].income).toBe(100);
  });
});

describe('derivedIncomeStreams', () => {
  it('groups credits by normalized description and computes monthly equivalent', () => {
    const s = stateWithTxns(
      txn({ id: '1', date: '2026-01-01', amount: 100000, direction: 'C', description: 'ACME CORP PAYROLL' }),
      txn({ id: '2', date: '2026-02-01', amount: 100000, direction: 'C', description: 'ACME CORP PAYROLL' }),
      txn({ id: '3', date: '2026-03-01', amount: 100000, direction: 'C', description: 'ACME CORP PAYROLL' }),
    );
    const streams = derivedIncomeStreams(s);
    expect(streams).toHaveLength(1);
    expect(streams[0].type).toBe('salary');
    expect(streams[0].occurrences).toBe(3);
    expect(streams[0].frequency).toBe('monthly');
    expect(streams[0].monthlyEquivalent).toBe(100000);
  });
});

describe('outflowKpis', () => {
  it('splits recurring vs variable correctly', () => {
    const s = stateWithTxns(
      txn({ id: '1', date: '2026-04-01', amount: 5000, direction: 'D', category: 'sip' }),
      txn({ id: '2', date: '2026-04-05', amount: 1000, direction: 'D', category: 'subscription' }),
      txn({ id: '3', date: '2026-04-10', amount: 2000, direction: 'D', category: 'dining' }),
    );
    const k = outflowKpis(s, '2026-04');
    expect(k.total).toBe(8000);
    expect(k.recurring).toBe(6000); // sip + subscription
    expect(k.variable).toBe(2000); // dining
  });
});

describe('portfolioSummary + portfolioByType', () => {
  it('aggregates instruments by type', () => {
    const mf: MutualFundHolding = {
      id: 'mf1',
      type: 'mutualFund',
      label: 'Test MF',
      institution: 'Test AMC',
      amountPerInstallment: 10000,
      frequency: 'monthly',
      startDate: '',
      totalPaidToDate: 100000,
      currentValue: 110000,
      sourceDocIds: ['doc1'],
      folio: 'F1',
      amc: 'Test AMC',
      scheme: 'Test MF',
      category: 'Equity',
      units: 1000,
      nav: 110,
    };
    const s = emptyState();
    s.savingsInstruments[mf.id] = mf;

    const summary = portfolioSummary(s);
    expect(summary.invested).toBe(100000);
    expect(summary.currentValue).toBe(110000);
    expect(summary.pnlPct).toBeCloseTo(10, 5);

    const groups = portfolioByType(s);
    expect(groups).toHaveLength(1);
    expect(groups[0].type).toBe('mutualFund');
    expect(groups[0].instruments).toHaveLength(1);
  });
});
