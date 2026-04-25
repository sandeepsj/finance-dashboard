# Roadmap — Finance Dashboard to Production

> Phased plan from current state to a working, private, browser-only personal
> finance dashboard. Each phase is shippable on its own. Reference architecture
> lives in [`PLAN.md`](./PLAN.md); the design system lives in [`design/`](./design).

## Where we are (snapshot)

- ✅ Vite + React + TypeScript + Tailwind toolchain (HashRouter, dark mode, GH-Pages-ready build)
- ✅ Design tokens (light + dark, oklch palette, Inter + JetBrains Mono) → `src/index.css` + `tailwind.config.js`
- ✅ UI primitives: `Card`, `Button`, `Badge`, `Delta`, `Sparkline`, `KPICard`, `CashflowChart`, `TransactionTable`, `Progress`, `PortfolioDonut`, `Icon`
- ✅ App shell (SideNav, TopBar with theme toggle)
- ✅ **Domain store** — `useSyncExternalStore`-based singleton, debounced persistence (`Strategy` interface, `LocalStoragePersistence` default), idempotent ingestion of `ParseResult`
- ✅ **Parser pipeline (Phase D)** — Strategy/Chain-of-Responsibility/Adapter/Template-Method/Registry/Observer; readers for PDF / XLSX / CSV / Text; HDFC bank, HDFC credit card (Regalia + Swiggy), ICICI credit card, Groww MF Holdings parsers — all validated on real files
- ✅ **Upload page (Phase D6)** — drag-drop + file picker, per-file detection, password prompt for protected PDFs, post-parse summary ("what we found"), records flow into the store
- ✅ **Dashboard** — derives KPIs / cashflow / recent txns from the store; mock fallback for empty state
- ✅ **Income (Phase A1)** — derives income streams from credit txns (heuristic classification by description); KPI strip, streams list, composition bar, 12-month annual cadence dot grid
- ✅ **Savings (Phase A3, index)** — portfolio donut by type, hero totals, per-type group cards with instrument rows (current vs invested, XIRR, folio/policy id)
- ✅ **Transactions (Phase A4)** — full ledger with search, direction filter, account filter, paginated
- ✅ **Documents (Phase A5)** — grid of uploaded files with parse-status badges, record counts, remove cascades
- ✅ **Outflows (Phase A2, Month view)** — KPI strip (recurring vs variable), category breakdown table with merchant previews, top merchants list, daily debit chart, period switcher across all months in the data. FY/Next variants from the design deferred — they need historical/projection data.
- ✅ **Categorizer rule pack** — India-flavored merchant rules covering SIP/EMI/insurance/utility/subscription/groceries/dining/travel/fuel/healthcare/shopping/pets/cc-payment/fees/cash/transfer; applied at derive-time so refinements retro-apply without re-upload
- ✅ **Drive sync (Phase C)** — Google Identity Services token client (`drive.file openid email profile`), Drive REST client (folder lookup/creation, multipart upload for `data.json` and raw documents), `DrivePersistence` + `CompositePersistence` (Drive primary + LocalStorage fallback). Sign-in button in TopBar. Session restored from `sessionStorage` on reload, silent token refresh ahead of expiry. Falls back to local-only mode if `VITE_GOOGLE_CLIENT_ID` is not configured. OAuth setup documented in `README.md`.
- ✅ **Monthly Review (Phase A6 + E)** — narrative review page wired to `https://llm-proxy-smoky.vercel.app/api/proxy` (Sonnet 4.6). Builds a structured prompt from store derivations (income streams, outflow KPIs, category breakdown, top merchants, 6-month cashflow, portfolio summary). Period switcher across all months in data. Local cache keyed by `(ym, doc-hash digest)` — re-running the same month with no new uploads is a free hit. Falls back to "copy prompt to clipboard" if proxy is unreachable. Lightweight inline markdown renderer for the response.
- ✅ **Phase F1 — Code-splitting** — `Upload` and `MonthlyReview` routes lazy-loaded; vendor chunks split (`vendor-react`, `vendor-router`, `vendor-pdfjs`, `vendor-xlsx`, `vendor-papaparse`). Initial bundle: **82 KB gzipped** (down from 343 KB).
- ✅ **Phase F2 — ErrorBoundary + Suspense** — class-component boundary catches render errors with reload/retry actions; `PageLoading` covers code-split chunk loads.
- ✅ **Phase F3 — Deploy** — `.github/workflows/deploy.yml` runs typecheck + build on push to `main`, publishes `dist/` to GitHub Pages. `VITE_GOOGLE_CLIENT_ID` plumbed from a repo secret (optional — without it the deployed app runs in local-only mode).
- ✅ **Phase F4 — Vitest** — 27 tests covering format helpers, categorizer rules (incl. concatenated-merchant edge cases like `PHARMABANGALORE` and `CLOUDMUMBAI`), and the core derivation functions (`monthlyKpi`, `cashflow`, `derivedIncomeStreams`, `outflowKpis`, `portfolioSummary` / `portfolioByType`). `npm test` runs the suite; `npm run test:watch` for dev.
- 🚧 **Phase F5 — Mobile responsive** — design has 390px artboards for Income / Outflows / Savings, but TSX implementation is desktop-only at fixed grid widths. Defer until needed; would touch ~6 files.

---

## Phase A — Finish the visual pages (mock data)

Goal: every side-nav page renders the design with realistic mock data. After this, the dashboard is fully demo-able offline.

| # | Page | Source design | Net-new components | Size |
|---|------|---------------|--------------------|------|
| A1 | **Income** | `docs/design/project/income.jsx` (435L) | `StreamCard`, `CompositionBar`, `AnnualCadenceDots` | small |
| A2 | **Outflows** | `docs/design/project/outflows.jsx` (1360L) | `Treemap`, `DebitCalendar`, `CategoryCard`, `MonthlyTrend`, `OutflowsProjectionChart`, period switcher (Month / FY / Next) | **large** |
| A3 | **Savings** | `docs/design/project/savings.jsx` + `savings-data.jsx` (~1700L) | Index list (grouped by type, portfolio donut) + 3 polymorphic detail layouts (market-linked / traditional-insurance / fixed-return), 12-month premium calendar, value-vs-invested chart | **large** |
| A4 | **Transactions** | extends existing `TransactionTable` | filter chips, search, multi-select, bulk-recategorize, split | medium |
| A5 | **Documents** | `docs/design/project/components.jsx` (UploadZone + DocumentTile exist) | folder list, search, statement-reconciliation list, password-modal flow | medium |
| A6 | **Monthly Review** | not yet designed | design pass + month-end narrative + chat-with-Claude thread | medium |

**Order:** A1 → A2 → A3 → A4 → A5 → A6. Income first (small, shakedown for patterns); Outflows + Savings are the big ones; Transactions/Documents recombine existing primitives; Monthly Review is last (needs design + LLM proxy).

---

## Phase B — Domain model + state

Goal: pages read from a single typed store; mock data conforms to the same shapes the real Drive sync will produce.

- **B1** TypeScript types from `PLAN.md`:
  - `IncomeStream`, `Obligation`, `Transaction`, `Document`
  - `SavingsInstrument` discriminated union: `MutualFundHolding | LICEndowment | HDFCLifePolicy | RecurringDeposit | BankFD | EPF | NPS | Stock | PPF | SukanyaSamriddhi`
- **B2** Move mock data out of pages into `src/mock/` (one file per type).
- **B3** Pure derivation functions in `src/lib/derive/` — cashflow, monthly KPIs, category rollups, IRR / XIRR.
- **B4** Light state layer (Zustand or `useSyncExternalStore` over a typed in-memory store). No heavy framework.

After Phase B, the same shape flows through dev (mock), tests, and prod (Drive).

---

## Phase D — Parser architecture (active focus before Drive sync)

> Phase C (Auth + Drive) is below; Phase D is detailed first because it's the
> next implementation pass and shapes the Drive schema.

Goal: a generic, plugin-style adapter layer that converts any uploaded file
(bank PDF, credit-card PDF, Groww XLSX, generic CSV, …) into typed domain
records (`Transaction[]`, `SavingsInstrument[]`, `Obligation[]`,
`IncomeStream[]`). New parsers are added one file at a time with no changes to
the orchestration layer.

### GOF patterns in play

| Pattern | Where | Why |
|---|---|---|
| **Strategy** | `Reader` interface (PDF / CSV / XLSX) | File types have different extraction logic; same output (`ExtractedDocument`). |
| **Chain of Responsibility** | `ParserRegistry.detect()` walks parsers in order; first `detect()` wins | Parsers self-describe detection; registry stays dumb; new parser slots in zero-config. |
| **Adapter** | Each `Parser` adapts source-specific format → domain `ParseResult` | Textbook adapter; user explicitly asked for it. |
| **Template Method** | `StatementParser` abstract base — `parse()` runs validate → extractTransactions → enrich → emit, with subclasses filling holes | Most statements share the workflow; only row-extraction and field-mapping differ. |
| **Registry / Service Locator** | `ParserRegistry`, `ReaderRegistry`, `CategorizerChain` | PLAN.md calls for plugin-style; registries make ordering + listing explicit. |
| **Builder** (light) | `ParseResult` accumulator (warnings + records added incrementally) | Real-world PDFs are messy — partial success > all-or-nothing. |
| **Observer** (light) | Pipeline emits typed events (`reader-selected`, `parsed`, `warning`, `done`, `failed`) | The design has parse-status badges (`pending` / `parsed` / `failed`); UI subscribes. |
| **Facade** | `ParsePipeline.run(file)` orchestrates everything | One call from UI; internals pluggable. |

### Module layout

```
src/parsers/
  index.ts                    — public API + createDefaultPipeline()
  types.ts                    — RawFile, ExtractedDocument, ParseResult, ParseError, Parser, Reader
  result.ts                   — Result<T, E> helpers
  hash.ts                     — SHA-256 of file bytes (idempotency key)
  pipeline.ts                 — ParsePipeline (facade + observer)

  readers/
    index.ts                  — Reader interface + ReaderRegistry (strategy)
    csvReader.ts              — papaparse → ExtractedDocument
    pdfReader.ts              — pdfjs-dist → ExtractedDocument (handles passwords)
    xlsxReader.ts             — sheetjs → ExtractedDocument
    textReader.ts             — fallback for plain text

  parsers/
    base.ts                   — abstract StatementParser (template method)
    registry.ts               — ParserRegistry (chain of responsibility)
    example.ts                — example generic-CSV parser (a working template)

  categorizers/
    index.ts                  — CategorizerChain (chain of responsibility for txn categorization)

  README.md                   — "how to add a parser" — read this first
```

### Pipeline flow

```
RawFile
  │
  ▼  ReaderRegistry.findFor(file)        ← Strategy
ExtractedDocument { text, pages, tables, hash }
  │
  ▼  ParserRegistry.detect(extracted)    ← Chain of Responsibility
Parser
  │
  ▼  parser.parse(extracted)              ← Adapter + Template Method
ParseResult { transactions[], savingsInstruments[], obligations[], incomeStreams[], warnings[] }
  │
  ▼  CategorizerChain.categorizeAll(...)  ← Chain of Responsibility
ParseResult (categorized)
  │
  ▼  emit('done', result)                 ← Observer
```

Each step is replaceable. Each step has a deterministic input → output, so each step is unit-testable in isolation.

### Phasing inside Phase D

- **D1** Types + Result + hash + Reader registry + CSV/text readers (working).
- **D2** PDF reader (pdfjs-dist + worker config) + XLSX reader (sheetjs).
- **D3** `StatementParser` base + `ParserRegistry` + `ParsePipeline` orchestrator.
- **D4** `CategorizerChain` + a starter rule pack (salary, SIPs, common merchants).
- **D5** Example generic-CSV parser as a working template + `parsers/README.md` with the "how to add a parser" walkthrough.
- **D6** Documents page wiring: file picker → pipeline → DocumentTile status badges (Observer subscription).
- **D7** Idempotency: dedupe `Transaction[]` on (date, amount, description, account) hash; skip already-parsed file hashes.
- **D8** Real parsers — added one file at a time as the user provides statements:
  - HDFC Bank account statement (PDF, password-protected)
  - HDFC Regalia / Diners credit card (PDF)
  - ICICI / Amazon Pay credit card (PDF)
  - Groww mutual fund statement (XLSX)
  - LIC premium receipt (PDF)
  - HDFC Life policy schedule (PDF)
  - …more as needed

### Privacy guardrail

Real statements never enter the repo (per `PLAN.md`). Test fixtures in `src/parsers/__fixtures__/` use **synthetic** statements that mimic the real layout but contain only fictional names, account numbers, and transactions.

---

## Phase C — Auth + Google Drive sync

Goal: Drive becomes the single source of truth; the dashboard is a stateless renderer.

- **C1** Google Identity Services SDK; `drive.file` scope; access token in `sessionStorage` (1 hr TTL); silent refresh.
- **C2** Drive client with `appDataFolder`:
  - `finance-dashboard/data.json` — single typed store (versioned schema)
  - `finance-dashboard/documents/<sha256>.<ext>` — raw uploaded files
  - `finance-dashboard/parse-cache/<sha256>.json` — cached `ParseResult` per file (skip re-parse on reload)
- **C3** Sync layer: read-on-load, debounced write-on-change, last-write-wins with toast on conflict.
- **C4** Sign-in screen, sign-out, token-expiry handling, OAuth-consent-screen documentation (one-time setup in Google Cloud Console).
- **C5** Schema migrations (versioned JSON, forward-compatible reads).

---

## Phase E — AI Monthly Review

- **E1** Wire `https://llm-proxy-smoky.vercel.app/api/proxy` (already deployed per `PLAN.md`).
- **E2** Monthly Review page = prompt template + streaming response render.
- **E3** Inputs: this month's transactions + obligations + last-month diff. Outputs: narrative summary + 3 actionable suggestions.
- **E4** Cache the rendered review in Drive — re-opening is instant; replays don't double-bill.

---

## Phase F — Deploy + polish

- **F1** GitHub Actions → GitHub Pages on push to `main` (uses `npm run build` → `dist/`).
- **F2** Mobile responsive pass (the design has 390px artboards for Income / Outflows / Savings — port to Tailwind breakpoints).
- **F3** Empty states, loading skeletons, error boundaries.
- **F4** Vitest unit tests on parsers + projection math (the parts you can't manually verify).
- **F5** Lighthouse pass; should be green easily — static SPA.

---

## Recommended sequencing under usage-limit constraints

Rationing Claude quota until next Friday's reset:

1. **Phase D** (parsers) — high-leverage; the architecture pays off across every subsequent phase.
2. **Phase A1–A3** (Income, Outflows, Savings pages) — visual completion is mostly mechanical translation; primitives already exist.
3. **Phase B** (domain types + state) — small, mostly type definitions.
4. **Phase C** (Drive sync) — quietly significant; needs a focused session.
5. **Phase E** (Monthly Review) + **Phase F** (deploy + polish).

Each phase is shippable independently. If the quota runs out mid-phase, the previous phase's work is still useful.
