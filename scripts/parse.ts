// Node parser harness — feeds a real file through the parser pipeline so each
// parser can be validated against actual user data before being shipped.
//
// Usage:
//   npx tsx scripts/parse.ts <file>                 # auto-detect parser
//   npx tsx scripts/parse.ts <file> -p <password>   # password for protected PDFs
//   npx tsx scripts/parse.ts <file> --json          # full ParseResult as JSON
//   npx tsx scripts/parse.ts <file> --parser <id>   # force a specific parser
//
// The harness builds an ExtractedDocument in Node (using pdfjs-dist legacy
// build for PDFs, sheetjs for XLSX, papaparse for CSV) and then invokes
// parser.parse() directly. The Vite-specific Reader path is browser-only;
// this harness is the equivalent for development.

import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

import { ParserRegistry } from '../src/parsers/parsers/registry';
import { GenericCsvBankParser } from '../src/parsers/parsers/genericCsvBank';
import { HdfcBankStatementParser } from '../src/parsers/parsers/hdfcBankStatement';
import { HdfcCreditCardParser } from '../src/parsers/parsers/hdfcCreditCard';
import { IciciCreditCardParser } from '../src/parsers/parsers/iciciCreditCard';
import { GrowwMutualFundsParser } from '../src/parsers/parsers/growwMutualFunds';
import { CategorizerChain } from '../src/parsers/categorizers/index';
import { merchantRules } from '../src/parsers/categorizers/merchantRules';
import { starterRules } from '../src/parsers/categorizers/starterRules';
import { hashBytes, hashString } from '../src/parsers/hash';
import type { ExtractedDocument, ExtractedPage, ExtractedTable } from '../src/parsers/types';

const parsers = new ParserRegistry()
  .register(new HdfcBankStatementParser())
  .register(new HdfcCreditCardParser())
  .register(new IciciCreditCardParser())
  .register(new GrowwMutualFundsParser())
  .register(new GenericCsvBankParser());
const categorizers = new CategorizerChain();
for (const r of [...merchantRules, ...starterRules]) categorizers.register(r);

pdfjs.GlobalWorkerOptions.workerSrc = fileURLToPath(
  new URL('../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs', import.meta.url),
);

// ── CLI ───────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const positional: string[] = [];
const flags: Record<string, string | boolean> = {};
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '-p' || a === '--password') flags.password = args[++i];
  else if (a === '--parser') flags.parser = args[++i];
  else if (a === '--json') flags.json = true;
  else if (a === '--max') flags.max = args[++i];
  else if (a === '--show-text') flags.showText = true;
  else positional.push(a);
}
if (positional.length === 0) {
  console.error('usage: tsx scripts/parse.ts <file> [-p <password>] [--parser <id>] [--json] [--show-text] [--max <n>]');
  process.exit(2);
}
const filePath = positional[0];

// ── Reader (Node-compatible) ──────────────────────────────────────────────

interface PdfItem { str: string; transform: number[]; width: number }

/** Group text items into visual lines by y-coordinate (with tolerance), then
 *  order each line by x. Recreates column-aligned text from pdfjs's positional
 *  output — flat .map(it=>it.str).join(' ') loses the layout. */
function reconstructLines(items: PdfItem[]): string {
  const Y_TOLERANCE = 2; // pdf points
  const lines: { y: number; items: PdfItem[] }[] = [];
  for (const it of items) {
    if (!it.str) continue;
    const y = it.transform[5];
    let line = lines.find(l => Math.abs(l.y - y) < Y_TOLERANCE);
    if (!line) {
      line = { y, items: [] };
      lines.push(line);
    }
    line.items.push(it);
  }
  lines.sort((a, b) => b.y - a.y); // PDF coords: higher y = top
  return lines
    .map(line => {
      line.items.sort((a, b) => a.transform[4] - b.transform[4]);
      // Insert a tab between items separated by visible whitespace, otherwise concat directly.
      let out = '';
      let lastEndX = -Infinity;
      for (const it of line.items) {
        const x = it.transform[4];
        if (out.length === 0) {
          out = it.str;
        } else if (x - lastEndX > 6) {
          out += '   ' + it.str;
        } else {
          out += it.str;
        }
        lastEndX = x + it.width;
      }
      return out;
    })
    .join('\n');
}

async function extractPdf(path: string, buf: Uint8Array, password?: string): Promise<ExtractedDocument> {
  // Hash before pdfjs transfers ownership of the buffer.
  const hash = await hashBytes(buf);
  const forPdfjs = new Uint8Array(buf); // fresh copy
  const pdf = await pdfjs.getDocument({ data: forPdfjs, password }).promise;
  const pages: ExtractedPage[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const items = content.items.filter((it): it is PdfItem => 'str' in it && 'transform' in it) as PdfItem[];
    const text = reconstructLines(items);
    pages.push({ pageNumber: i, text });
  }
  return {
    sourceFile: { name: basename(path), mimeType: 'application/pdf', hash },
    text: pages.map(p => p.text).join('\n'),
    pages,
    metadata: { pageCount: pdf.numPages },
  };
}

async function extractCsv(path: string, text: string): Promise<ExtractedDocument> {
  const parsed = Papa.parse<string[]>(text, { header: false, skipEmptyLines: 'greedy' });
  const all = parsed.data.filter(row => row.some(c => (c ?? '').trim().length > 0));
  return {
    sourceFile: { name: basename(path), mimeType: 'text/csv', hash: await hashString(text) },
    text,
    tables: [{ name: 'csv', headers: all[0] ?? [], rows: all.slice(1) }],
  };
}

async function extractXlsx(path: string, buf: Uint8Array): Promise<ExtractedDocument> {
  const wb = XLSX.read(buf, { type: 'array' });
  const tables: ExtractedTable[] = [];
  const allText: string[] = [];
  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name];
    const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false, defval: '' });
    const rowsRaw = matrix.map(r => r.map(c => String(c ?? '')));
    tables.push({ name, headers: rowsRaw[0] ?? [], rows: rowsRaw.slice(1).filter(r => r.some(c => c.trim().length > 0)) });
    allText.push(rowsRaw.map(r => r.join('\t')).join('\n'));
  }
  return {
    sourceFile: { name: basename(path), mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', hash: await hashBytes(buf) },
    text: allText.join('\n\n'),
    tables,
    metadata: { sheetNames: wb.SheetNames },
  };
}

async function extract(path: string, password?: string): Promise<ExtractedDocument> {
  const buf = new Uint8Array(await readFile(path));
  const lower = path.toLowerCase();
  if (lower.endsWith('.pdf')) return extractPdf(path, buf, password);
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) return extractXlsx(path, buf);
  if (lower.endsWith('.csv')) return extractCsv(path, new TextDecoder().decode(buf));
  return {
    sourceFile: { name: basename(path), mimeType: 'text/plain', hash: await hashBytes(buf) },
    text: new TextDecoder().decode(buf),
  };
}

// ── Run ───────────────────────────────────────────────────────────────────

const doc = await extract(filePath, typeof flags.password === 'string' ? flags.password : undefined);

if (flags.showText) {
  const limit = Number.parseInt((flags.max as string) ?? '2000', 10);
  console.log(`── extracted text (first ${limit} chars of ${doc.text.length}) ──`);
  console.log(doc.text.slice(0, limit));
  console.log('── tables ──');
  for (const t of doc.tables ?? []) console.log(`  ${t.name}: ${t.rows.length} rows`);
  process.exit(0);
}

const parser = typeof flags.parser === 'string'
  ? parsers.byId(flags.parser)
  : parsers.detect(doc);

if (!parser) {
  console.error(`No parser matched. Registered: ${parsers.list().map(p => p.id).join(', ')}`);
  console.error('Use --show-text to dump extracted content for parser development.');
  process.exit(1);
}

console.log(`✔ parser: ${parser.id} v${parser.version}`);
const result = parser.parse(doc);
result.transactions = categorizers.categorizeAll(result.transactions);

if (flags.json) {
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

console.log(`  source.fileHash: ${result.source.fileHash.slice(0, 12)}…`);
console.log(`  transactions:    ${result.transactions.length}`);
console.log(`  obligations:     ${result.obligations.length}`);
console.log(`  incomeStreams:   ${result.incomeStreams.length}`);
console.log(`  savings:         ${result.savingsInstruments.length}`);
console.log(`  warnings:        ${result.warnings.length}`);

const max = Number.parseInt((flags.max as string) ?? '15', 10);
if (result.transactions.length > 0) {
  console.log(`\n── first ${Math.min(max, result.transactions.length)} transactions ──`);
  for (const t of result.transactions.slice(0, max)) {
    const dir = t.direction === 'D' ? '−' : '+';
    const amt = t.amount.toFixed(2).padStart(11);
    const cat = t.category ?? '·';
    console.log(`  ${t.date}  ${dir}${amt}  ${cat.padEnd(20)}  ${t.description.slice(0, 70)}`);
  }
}
if (result.savingsInstruments.length > 0) {
  console.log(`\n── savings instruments ──`);
  for (const s of result.savingsInstruments) {
    console.log(`  [${s.type}] ${s.label}  invested=${s.totalPaidToDate}  current=${s.currentValue}`);
  }
}
if (result.warnings.length > 0) {
  console.log(`\n── warnings ──`);
  for (const w of result.warnings.slice(0, 10)) console.log(`  ${w.code}: ${w.message}`);
  if (result.warnings.length > 10) console.log(`  …(${result.warnings.length - 10} more)`);
}
