// A small starter pack of categorization rules. These are intentionally
// simple — replace or extend with bank-specific rules over time.

import type { CategorizationRule } from './index';
import { regexRule } from './index';

export const starterRules: CategorizationRule[] = [
  regexRule({ id: 'cat.salary', pattern: /\b(salary|sal cr|payroll)\b/i, category: 'salary' }),
  regexRule({ id: 'cat.sip', pattern: /\bsip\b/i, category: 'sip' }),
  regexRule({ id: 'cat.lic', pattern: /\bLIC\s+(premium|prem)\b/i, category: 'insurance-premium' }),
  regexRule({ id: 'cat.hdfclife', pattern: /\bhdfc\s*life\b/i, category: 'insurance-premium' }),
  regexRule({ id: 'cat.rent', pattern: /\brent\b|RENT TO\b/i, category: 'rent' }),
  regexRule({ id: 'cat.emi', pattern: /\b(emi|loan)\b/i, category: 'emi' }),
  regexRule({ id: 'cat.utility', pattern: /\b(electricity|bescom|airtel|jio|gas|water bill)\b/i, category: 'utility' }),
  regexRule({ id: 'cat.subscription', pattern: /\b(netflix|spotify|prime video|youtube|apple\.com|adobe)\b/i, category: 'subscription' }),
  regexRule({ id: 'cat.groceries', pattern: /\b(bigbasket|grofers|blinkit|zepto|amazon.in.*grocery|dmart)\b/i, category: 'groceries' }),
  regexRule({ id: 'cat.dining', pattern: /\b(swiggy|zomato|dineout)\b/i, category: 'dining' }),
  regexRule({ id: 'cat.travel', pattern: /\b(irctc|uber|ola|indigo|vistara|spicejet|makemytrip|booking\.com|airbnb)\b/i, category: 'travel' }),
];
