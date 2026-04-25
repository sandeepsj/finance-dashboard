// XLSX reader — SheetJS to per-sheet 2D string matrices. Each sheet becomes
// one ExtractedTable; concatenated cell text becomes ExtractedDocument.text.

import * as XLSX from 'xlsx';
import type { ExtractedDocument, ExtractedTable, RawFile, Reader } from '../types';
import { hashBytes } from '../hash';

export class XlsxReader implements Reader {
  readonly id = 'reader.xlsx';

  canRead(file: RawFile): boolean {
    return (
      file.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimeType === 'application/vnd.ms-excel' ||
      /\.(xlsx|xls)$/i.test(file.name)
    );
  }

  async read(file: RawFile): Promise<ExtractedDocument> {
    if (typeof file.data === 'string') {
      throw new Error('XlsxReader expected ArrayBuffer; got string');
    }
    const buf = new Uint8Array(file.data);
    const wb = XLSX.read(buf, { type: 'array' });

    const tables: ExtractedTable[] = [];
    const allText: string[] = [];

    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, {
        header: 1,
        raw: false,
        defval: '',
      });
      const rowsRaw = matrix.map(r => r.map(c => String(c ?? '')));
      const headers = rowsRaw[0] ?? [];
      const rows = rowsRaw.slice(1).filter(r => r.some(c => c.trim().length > 0));
      tables.push({ name: sheetName, headers, rows });
      allText.push(rowsRaw.map(r => r.join('\t')).join('\n'));
    }

    return {
      sourceFile: { name: file.name, mimeType: file.mimeType, hash: await hashBytes(file.data) },
      text: allText.join('\n\n'),
      tables,
      metadata: { sheetNames: wb.SheetNames },
    };
  }
}
