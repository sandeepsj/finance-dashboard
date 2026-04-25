// ReaderRegistry — Strategy selector. Picks the first reader whose `canRead`
// returns true. Order of registration = priority.

import type { RawFile, Reader } from '../types';

export class ReaderRegistry {
  private readers: Reader[] = [];

  register(reader: Reader): this {
    this.readers.push(reader);
    return this;
  }

  findFor(file: RawFile): Reader | null {
    for (const r of this.readers) {
      if (r.canRead(file)) return r;
    }
    return null;
  }

  list(): readonly Reader[] {
    return this.readers;
  }
}
