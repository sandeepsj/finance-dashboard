// ParserRegistry — Chain of Responsibility for parser selection.
// Walk registered parsers in order; first whose `detect()` returns true wins.
// New parsers slot in via `.register()` with no changes to orchestration.

import type { ExtractedDocument, Parser } from '../types';

export class ParserRegistry {
  private parsers: Parser[] = [];

  register(parser: Parser): this {
    this.parsers.push(parser);
    return this;
  }

  /** First registered parser that recognizes the document, or null. */
  detect(extracted: ExtractedDocument): Parser | null {
    for (const p of this.parsers) {
      try {
        if (p.detect(extracted)) return p;
      } catch {
        // A buggy detect() should not break the chain — skip and continue.
      }
    }
    return null;
  }

  byId(id: string): Parser | null {
    return this.parsers.find(p => p.id === id) ?? null;
  }

  list(): readonly Parser[] {
    return this.parsers;
  }
}
