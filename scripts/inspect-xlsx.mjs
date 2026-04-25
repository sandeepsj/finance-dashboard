// Inspect an XLSX file: print sheet names + first N rows of each sheet.
// Usage: node scripts/inspect-xlsx.mjs <file> [maxRows=20]

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import * as XLSX from 'xlsx';

const [, , fileArg, maxRowsArg] = process.argv;
if (!fileArg) {
  console.error('usage: node scripts/inspect-xlsx.mjs <file> [maxRows]');
  process.exit(2);
}

const maxRows = Number.parseInt(maxRowsArg ?? '20', 10);
const path = resolve(fileArg);
const buf = await readFile(path);
const wb = XLSX.read(buf, { type: 'buffer' });

console.log('FILE:', path);
console.log('SHEETS:', wb.SheetNames);

for (const name of wb.SheetNames) {
  console.log('\n──', name, '──');
  const sheet = wb.Sheets[name];
  const range = XLSX.utils.decode_range(sheet['!ref'] ?? 'A1:A1');
  console.log(`range: ${sheet['!ref']}  rows≈${range.e.r - range.s.r + 1} cols≈${range.e.c - range.s.c + 1}`);
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  for (let i = 0; i < Math.min(matrix.length, maxRows); i++) {
    const row = matrix[i].map(c => (c === '' ? '' : String(c)));
    console.log(`r${String(i).padStart(3, '0')}: ${row.join(' | ')}`);
  }
  if (matrix.length > maxRows) console.log(`  …(${matrix.length - maxRows} more rows)`);
}
