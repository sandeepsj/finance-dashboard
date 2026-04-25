# `src/parsers/` — Adapter architecture for statements & reports

Generic, plugin-style pipeline that converts any uploaded file (bank PDF,
credit-card PDF, broker XLSX, generic CSV, …) into typed domain records.

```
RawFile ──► ExtractedDocument ──► ParseResult ──► (categorized) ──► store
        Reader              Parser              CategorizerChain
       (Strategy)    (Adapter / Template Method)   (Chain of Resp.)
```

## Patterns in play

| Pattern | Where | Why |
|---|---|---|
| **Strategy** | `Reader` interface (CSV / XLSX / PDF / Text) | Same output (`ExtractedDocument`) from very different file formats. |
| **Chain of Responsibility** | `ParserRegistry.detect()` walks parsers in order; first match wins | Parsers self-describe detection; registry stays dumb. |
| **Adapter** | Each `Parser` adapts source format → domain `ParseResult` | Source-specific logic stays in one file per institution. |
| **Template Method** | `StatementParser` abstract base | Subclasses fill `extractTransactions` etc; the algorithm is fixed. |
| **Registry / Service Locator** | `ReaderRegistry`, `ParserRegistry`, `CategorizerChain` | Plugin-style; new things drop in without touching orchestration. |
| **Observer** | `pipeline.run(file, { onEvent })` | UI subscribes to `reader-selected`, `extracted`, `parsed`, `warning`, `done`, `failed` to update parse-status badges. |
| **Facade** | `ParsePipeline.run(file)` | One call from UI; internals pluggable. |
| **Builder** (light) | `ParseResult` accumulator (warnings + records added incrementally) | Real PDFs are messy — partial success > all-or-nothing. |

## Module layout

```
src/parsers/
  index.ts                — public API + createDefaultPipeline()
  types.ts                — RawFile, ExtractedDocument, ParseResult, …
  result.ts               — Result<T, E>
  hash.ts                 — SHA-256 of file bytes (idempotency key)
  pipeline.ts             — ParsePipeline (facade + observer)

  readers/                — Strategy: file format → ExtractedDocument
    registry.ts             — ReaderRegistry
    csvReader.ts            — papaparse → tables
    xlsxReader.ts           — sheetjs → tables
    pdfReader.ts            — pdfjs-dist → pages of text (handles passwords)
    textReader.ts           — plain text fallback

  parsers/                — Adapter + Template Method: extract domain records
    base.ts                 — abstract StatementParser
    registry.ts             — ParserRegistry (chain of responsibility)
    genericCsvBank.ts       — generic CSV template — copy this for new bank/CC CSV parsers
    hdfcBankStatement.ts    — HDFC Bank account statement (PDF, password = customer ID)
    hdfcCreditCard.ts       — HDFC credit cards (Regalia / Swiggy / etc — same format)
    iciciCreditCard.ts      — ICICI Bank credit card (full statement form)
    growwMutualFunds.ts     — Groww mutual fund holdings (XLSX) → MutualFundHolding[]

  categorizers/           — Chain of Responsibility: txn → category
    index.ts                — CategorizerChain + regexRule helper
    starterRules.ts         — small starter pack (salary, SIPs, common merchants)
```

## Quick usage

```ts
import { createDefaultPipeline } from '@/parsers';

const { pipeline, parsers } = createDefaultPipeline();
parsers.register(new HdfcRegaliaParser()); // your parser

const result = await pipeline.run(
  { name: 'hdfc-apr-2026.pdf', mimeType: 'application/pdf', size: file.size, data: await file.arrayBuffer() },
  {
    onEvent: e => console.log(e),
    readOptions: { password: '12345' }, // for password-protected PDFs
  },
);

if (result.ok) {
  console.log(`${result.value.transactions.length} transactions parsed`);
} else {
  console.error(result.error);
}
```

## Adding a new parser — the workflow

The shortest path: **copy `parsers/genericCsvBank.ts` to `parsers/<institution>.ts` and edit two methods.**

1. **Pick a stable id and version.**
   ```ts
   readonly id = 'parser.hdfc.regalia';
   readonly version = '1.0.0';
   readonly displayName = 'HDFC Regalia credit card statement';
   readonly produces = ['transactions'] as const;
   ```

2. **Write `detect(extracted)`** — return `true` if this parser should handle the document. Be specific enough that detection is unambiguous (a substring match on something institution-specific in the text usually does it):
   ```ts
   detect(doc: ExtractedDocument): boolean {
     return doc.text.includes('HDFC BANK CREDIT CARD STATEMENT')
         && doc.text.includes('Regalia');
   }
   ```

3. **Implement `extractTransactions(doc, ctx)`** — return `Transaction[]` (the domain type). Use:
   - `doc.tables` for CSV/XLSX inputs
   - `doc.text` or `doc.pages[].text` for PDF inputs (regex over the flat text usually works for statements with a tabular layout)
   - `this.makeTxnId({ date, amount, description, accountId })` for stable ids — re-parsing the same statement produces the same ids, so the store dedupes naturally.
   - `this.warn(ctx, 'code', 'message', { rowIndex })` for non-fatal issues. Warnings flow to the pipeline's Observer.

4. **(Optional) override `extractObligations` / `extractIncomeStreams` / `extractSavingsInstruments`** — for inputs that produce more than transactions (Groww MF reports → `MutualFundHolding[]`, LIC schedules → `LICEndowmentPolicy` + payment schedule, etc).

5. **Register it.** In `src/parsers/index.ts::createDefaultPipeline()` add `parsers.register(new YourParser())`. Order matters — registered first wins detection ties.

6. **Test it.** Drop a synthetic statement into `src/parsers/__fixtures__/<institution>.<ext>` (✱ no real data) and run the parser against it via a unit test or a tiny dev page.

## Validating a parser against a real file

The repo ships with a Node harness that mirrors the browser pipeline (PDF via
pdfjs-dist, XLSX via sheetjs, CSV via papaparse) so you can iterate on a
parser without spinning up the full app:

```bash
# Auto-detect the parser
npx tsx scripts/parse.ts ~/Downloads/Acct_Statement_XXXXXXXX1234_25042026.pdf -p <password>

# Force a specific parser by id (useful while developing detection logic)
npx tsx scripts/parse.ts <file> --parser parser.hdfc.bank-statement

# Dump the extracted text instead of running a parser (parser dev loop)
npx tsx scripts/parse.ts <file> -p <password> --show-text --max 99999

# Full ParseResult as JSON
npx tsx scripts/parse.ts <file> --json
```

The harness uses pdfjs-dist's text-content API with **position-aware line
reconstruction** (group items by y-coordinate, sort by x). This recreates the
visual line layout from the PDF — without it, multi-line narrations bleed into
adjacent transactions.

Real statements stay in `~/Downloads` (or wherever the user keeps them); the
harness reads them in place and never copies them into the repo.

## Privacy guardrail

**Real statements never enter the repo.** Test fixtures live in
`src/parsers/__fixtures__/` and contain only synthetic data: fictional names,
masked account numbers like `XXXX1234`, and made-up transactions that mirror
the real layout. The repo's `.gitignore` blocks `*.pdf`, `*.csv`, `*.xlsx`,
`*.xls` — the only way to commit one is via the explicit `!docs/**/*.md`
exception, which doesn't apply to fixtures. If you need to verify a parser
against a real statement, run the dev server, drop the file in via the
Documents UI, and confirm the result locally.

## Idempotency

- File-level: `hash.ts` produces a SHA-256 of the file bytes. The store uses
  it as the `Document.fileHash` — re-uploading the same file is a no-op.
- Transaction-level: `StatementParser.makeTxnId(...)` produces a stable id
  from `(date, amount, description, accountId)`. Re-parsing the same
  statement produces the same ids; dedupe is upsert-by-id.

## Error handling

The pipeline returns a `Result<ParseResult, ParseError>` — failures are
values, not thrown exceptions. `ParseError` is a discriminated union over:

- `no-reader-for-mime` — no reader handles this file type (install one or add a `.ext` heuristic).
- `reader-failed` — the reader threw (corrupt file, malformed PDF, etc).
- `password-required` — encrypted PDF; the UI should prompt and retry with `readOptions.password`.
- `no-parser-matched` — no registered parser's `detect()` returned true.
- `parser-failed` — the parser threw mid-extraction; check `cause`.

Non-fatal issues (one bad row in a 200-row statement) flow through the
`warnings: ParseWarning[]` array on the successful `ParseResult`, not as
errors.
