// CategorizerChain — Chain of Responsibility for assigning categories /
// matching to known obligations / matching to known income streams. Each
// rule decides: do I match this transaction? If yes, return a partial
// override; if no, return null and the next rule runs.
//
// Rules are added via .register() in order. First match wins.

import type { Transaction } from '@/domain/types';

export interface CategorizationRule {
  readonly id: string;
  /**
   * Inspect the transaction; return:
   *   - a `Partial<Transaction>` to override fields (e.g. `{ category: 'sip' }`)
   *   - `null` if this rule doesn't apply
   */
  apply(txn: Transaction): Partial<Transaction> | null;
}

export class CategorizerChain {
  private rules: CategorizationRule[] = [];

  register(rule: CategorizationRule): this {
    this.rules.push(rule);
    return this;
  }

  categorize(txn: Transaction): Transaction {
    for (const rule of this.rules) {
      const override = rule.apply(txn);
      if (override) return { ...txn, ...override };
    }
    return txn;
  }

  categorizeAll(txns: Transaction[]): Transaction[] {
    return txns.map(t => this.categorize(t));
  }

  list(): readonly CategorizationRule[] {
    return this.rules;
  }
}

// ── Starter rule helpers ─────────────────────────────────────────────────

/**
 * Build a regex-based rule. Convenience for the common case
 *   `match description against /sip/i → category = 'sip'`
 * Rules can be hand-rolled too — implement `CategorizationRule` directly.
 */
export function regexRule(opts: {
  id: string;
  pattern: RegExp;
  category: string;
  /** Override the txn description with the cleaned-up version. */
  cleanDescription?: (raw: string) => string;
}): CategorizationRule {
  return {
    id: opts.id,
    apply(txn) {
      if (!opts.pattern.test(txn.description) && !opts.pattern.test(txn.rawDescription)) {
        return null;
      }
      const partial: Partial<Transaction> = { category: opts.category };
      if (opts.cleanDescription) {
        partial.description = opts.cleanDescription(txn.rawDescription);
      }
      return partial;
    },
  };
}
