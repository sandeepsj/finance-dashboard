// Singleton categorizer chain. Used at derive-time so when rules are added
// or refined, they retro-apply to transactions already in the store — no
// re-upload needed.

import type { Transaction } from '@/domain/types';
import { CategorizerChain } from '@/parsers/categorizers';
import { merchantRules } from '@/parsers/categorizers/merchantRules';
import { starterRules } from '@/parsers/categorizers/starterRules';

const chain = new CategorizerChain();
// Order: specific merchant rules first, then the broader starter rules,
// then a final fallback (`other`).
for (const r of [...merchantRules, ...starterRules]) chain.register(r);

export function categorize(txn: Transaction): Transaction {
  // Always run the chain — that way refining the rule pack retro-applies to
  // transactions already in the store (no re-upload required).
  return chain.categorize(txn);
}

export function categorizeAll(txns: readonly Transaction[]): Transaction[] {
  return txns.map(categorize);
}

export const CATEGORY_LABEL: Record<string, string> = {
  salary: 'Salary',
  refund: 'Refund',
  sip: 'SIP',
  rent: 'Rent',
  emi: 'EMI',
  'insurance-premium': 'Insurance',
  utility: 'Utility',
  subscription: 'Subscription',
  groceries: 'Groceries',
  dining: 'Dining',
  travel: 'Travel',
  fuel: 'Fuel',
  healthcare: 'Healthcare',
  shopping: 'Shopping',
  pets: 'Pets',
  'cc-payment': 'CC payment',
  fees: 'Fees & GST',
  cash: 'Cash',
  transfer: 'Transfer',
  other: 'Other',
};

/** Stable accent color per category — keeps the same merchant the same color
 *  across pages. */
export const CATEGORY_ACCENT: Record<string, string> = {
  salary: 'var(--gain)',
  refund: 'var(--gain)',
  sip: 'var(--accent)',
  rent: 'var(--warn)',
  emi: 'var(--loss)',
  'insurance-premium': 'var(--info)',
  utility: 'var(--s3)',
  subscription: 'var(--s2)',
  groceries: 'var(--s1)',
  dining: 'var(--s4)',
  travel: 'var(--warn)',
  fuel: 'var(--s4)',
  healthcare: 'var(--info)',
  shopping: 'var(--s5)',
  pets: 'var(--s3)',
  'cc-payment': 'var(--ink-subtle)',
  fees: 'var(--ink-muted)',
  cash: 'var(--pending)',
  transfer: 'var(--ink-subtle)',
  other: 'var(--ink-subtle)',
};

export function categoryLabel(c: string | undefined): string {
  if (!c) return 'Other';
  return CATEGORY_LABEL[c] ?? c[0].toUpperCase() + c.slice(1);
}
