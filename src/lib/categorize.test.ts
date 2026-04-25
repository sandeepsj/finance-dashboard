import { describe, expect, it } from 'vitest';
import { categorize, categoryLabel } from './categorize';
import type { Transaction } from '@/domain/types';

function txn(description: string, overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'test',
    date: '2026-04-15',
    amount: 100,
    direction: 'D',
    description,
    rawDescription: description,
    accountId: 'hdfc:XXXX1234',
    sourceDocId: 'doc1',
    ...overrides,
  };
}

describe('categorize', () => {
  it('detects SIP from ACH-D INDIAN CLEARING CORP', () => {
    const t = categorize(txn('ACH D- INDIAN CLEARING CORP-0000XZQ5JRTR'));
    expect(t.category).toBe('sip');
  });

  it('detects salary from common payroll keywords', () => {
    expect(categorize(txn('ACME PAYROLL CR APR 2026', { direction: 'C' })).category).toBe('salary');
    expect(categorize(txn('SAL CR FOR 04/2026', { direction: 'C' })).category).toBe('salary');
  });

  it('detects subscription for Anthropic / Google Cloud / Netflix', () => {
    expect(categorize(txn('ANTHROPICANTHROPIC')).category).toBe('subscription');
    expect(categorize(txn('GOOGLE CLOUDMUMBAI')).category).toBe('subscription');
    expect(categorize(txn('NETFLIX')).category).toBe('subscription');
  });

  it('detects groceries for Blinkit, Zepto, BigBasket, DMart, Amazon Pay grocery', () => {
    expect(categorize(txn('UPI-BLINKIT')).category).toBe('groceries');
    expect(categorize(txn('ZEPTO MARKET')).category).toBe('groceries');
    expect(categorize(txn('AMAZON PAY IN GROCERY BANGALORE IN')).category).toBe('groceries');
  });

  it('detects dining for Swiggy / Zomato / Bundl', () => {
    expect(categorize(txn('SWIGGY')).category).toBe('dining');
    expect(categorize(txn('PYU*Swiggy FoodBangalore')).category).toBe('dining');
    expect(categorize(txn('BUNDL TECHNOLOGIES')).category).toBe('dining');
  });

  it('detects travel for IRCTC / MakeMyTrip / Uber', () => {
    expect(categorize(txn('IRCTC TRAVEL CHENNAI-MAS')).category).toBe('travel');
    expect(categorize(txn('MAKEMYTRIP INDIA PVT LNEW DELHI')).category).toBe('travel');
    expect(categorize(txn('UBER INDIA')).category).toBe('travel');
  });

  it('detects healthcare for pharmacies / hospitals', () => {
    expect(categorize(txn('GREENVIEW PHARMABANGALORE')).category).toBe('healthcare');
    expect(categorize(txn('GREENVIEW HEALTHCARE PVBENGALURU')).category).toBe('healthcare');
    expect(categorize(txn('APOLLO PHARMACY')).category).toBe('healthcare');
  });

  it('detects EMI', () => {
    expect(categorize(txn('OFFUS EMI,PRIN NB:02')).category).toBe('emi');
  });

  it('detects credit-card payments', () => {
    expect(categorize(txn('CREDIT CARD PAYMENTNet Banking')).category).toBe('cc-payment');
    expect(categorize(txn('BBPS Payment received')).category).toBe('cc-payment');
  });

  it('falls back to transfer for generic UPI rows', () => {
    expect(categorize(txn('UPI-SOMASEKHAR')).category).toBe('transfer');
  });
});

describe('categoryLabel', () => {
  it('uses friendly labels', () => {
    expect(categoryLabel('insurance-premium')).toBe('Insurance');
    expect(categoryLabel('cc-payment')).toBe('CC payment');
    expect(categoryLabel('sip')).toBe('SIP');
  });

  it('falls back to capitalised category for unknown keys', () => {
    expect(categoryLabel('unknown-thing')).toBe('Unknown-thing');
  });
});
