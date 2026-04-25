// CSV reader — papaparse to a 2D string matrix. Headers are taken from the
// first non-empty row by default; parsers may re-interpret if the export has
// preamble lines (banks often do).

import Papa from 'papaparse';
import type { ExtractedDocument, RawFile, Reader } from '../types';
import { hashString } from '../hash';

export class CsvReader implements Reader {
  readonly id = 'reader.csv';

  canRead(file: RawFile): boolean {
    return (
      file.mimeType === 'text/csv' ||
      file.mimeType === 'application/csv' ||
      /\.csv$/i.test(file.name)
    );
  }

  async read(file: RawFile): Promise<ExtractedDocument> {
    const text =
      typeof file.data === 'string' ? file.data : new TextDecoder().decode(file.data);

    const parsed = Papa.parse<string[]>(text, {
      header: false,
      skipEmptyLines: 'greedy',
    });

    const all = parsed.data.filter(row => row.some(cell => (cell ?? '').trim().length > 0));
    const headers = all[0] ?? [];
    const rows = all.slice(1);

    return {
      sourceFile: { name: file.name, mimeType: file.mimeType, hash: await hashString(text) },
      text,
      tables: [{ name: 'csv', headers, rows }],
      metadata: {
        rowCount: rows.length,
        delimiter: parsed.meta.delimiter,
        errors: parsed.errors,
      },
    };
  }
}
