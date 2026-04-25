// Plain-text fallback reader. Useful for hand-extracted statements pasted into
// a .txt file, or when a regex parser only needs the raw text.

import type { ExtractedDocument, RawFile, Reader } from '../types';
import { hashString } from '../hash';

export class TextReader implements Reader {
  readonly id = 'reader.text';

  canRead(file: RawFile): boolean {
    return file.mimeType === 'text/plain' || /\.(txt|log)$/i.test(file.name);
  }

  async read(file: RawFile): Promise<ExtractedDocument> {
    const text = typeof file.data === 'string' ? file.data : new TextDecoder().decode(file.data);
    return {
      sourceFile: { name: file.name, mimeType: file.mimeType, hash: await hashString(text) },
      text,
    };
  }
}
