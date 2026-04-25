import { describe, expect, it } from 'vitest';
import { formatINR, formatDate, formatPercent } from './format';

describe('formatINR', () => {
  it('uses Indian grouping (12,34,567 not 1,234,567)', () => {
    expect(formatINR(1234567)).toBe('₹12,34,567');
    expect(formatINR(123456789)).toBe('₹12,34,56,789');
  });

  it('keeps three trailing digits ungrouped', () => {
    expect(formatINR(1000)).toBe('₹1,000');
    expect(formatINR(999)).toBe('₹999');
  });

  it('handles negative amounts', () => {
    expect(formatINR(-1234)).toBe('-₹1,234');
  });

  it('compact mode picks Cr / L / k thresholds', () => {
    expect(formatINR(15000000, { compact: true })).toBe('₹1.5 Cr');
    expect(formatINR(150000, { compact: true })).toBe('₹1.5 L');
    expect(formatINR(15000, { compact: true })).toBe('₹15k');
  });

  it('returns em-dash for nullish/NaN inputs', () => {
    expect(formatINR(null)).toBe('—');
    expect(formatINR(undefined)).toBe('—');
    expect(formatINR(NaN)).toBe('—');
  });

  it('honours decimals option', () => {
    expect(formatINR(1234.567, { decimals: 2 })).toBe('₹1,234.57');
  });
});

describe('formatDate', () => {
  it('formats DD/MM/YYYY by default', () => {
    expect(formatDate('2026-04-25')).toBe('25/04/2026');
  });

  it('short form is "DD MMM YY"', () => {
    expect(formatDate('2026-04-25', { short: true })).toBe('25 Apr 26');
  });

  it('falls back to em-dash for missing input', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
  });
});

describe('formatPercent', () => {
  it('signs the value', () => {
    expect(formatPercent(4.2)).toBe('+4.2%');
    expect(formatPercent(-3.1)).toBe('-3.1%');
  });
});
