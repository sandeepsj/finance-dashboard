# Personal Finance Dashboard — Architecture Plan

> ⚠️ **This is a PUBLIC repository.** No personal financial data is ever committed
> here. All real statements, transactions, balances, policy numbers, and
> account details live exclusively in each user's own Google Drive. The plan
> and codebase are generic — designed so any user can fork and run it for
> their own finances.

## Context

A manual personal-finance audit (downloading PDFs from multiple banks,
insurers, and brokerages, parsing them with throwaway scripts, building a
spreadsheet) takes hours and goes stale the next month. The goal here is a
**self-service dashboard** that automates the audit and runs it continuously,
while keeping all sensitive data on the user's own machine + Drive. The
dashboard should:

1. Aggregates **income streams** (salary, family pension, annual insurance benefits) and total monthly/yearly income.
2. Shows **committed outflows** (rent, SIPs, RD, LIC + HDFC Life premiums, EMIs, partner support, subscriptions).
3. Tracks **savings instruments** of many different types (mutual funds, LIC endowment plans, HDFC Life par/non-par plans, money-back plans, single-premium plans, postal RD, bank FD, EPF, NPS, stocks, etc.) — each with its own schema: amount, frequency, start date, maturity date, projected returns, payout schedule.
4. Generates **future projections** for cash flow + savings maturity.
5. Stores raw documents (CC bills, bank statements, insurance docs) **as references** linked to derived data, with monthly upload workflow.
6. Runs a **Claude-powered monthly review agent** that ingests new statements and gives suggestions.

Constraints: zero recurring infra cost, total privacy (financial data stays in the user's own Google Drive), accessible from phone + laptop, single user (per Drive), deterministic regex-based parsers (no LLM-tax on every parse).

---

## Architecture: React SPA + Google Drive backend

```
┌────────────────────── Browser (React SPA) ──────────────────────┐
│                                                                 │
│  Pages:  Dashboard │ Income │ Outflows │ Savings │ Documents   │
│          │ Monthly Review (Claude chat)                         │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Domain models (TypeScript discriminated unions)          │  │
│  │  Cash flow + projection engines (pure functions)          │  │
│  │  Parser registry → per-doc-type plugins (regex)           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              ↑↓                                  │
│  Google Identity Services (1hr token, sessionStorage)            │
│                              ↑↓                                  │
└──────────────────────────────│──────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ↓                    ↓                    ↓
   Google Drive API      LLM Proxy (Vercel)   GitHub Pages
   (data + docs)         Claude calls         (static hosting)
```

**Stack** (all per existing canonical docs):
- **Vite + React + TypeScript** with **HashRouter**
- **Google Identity Services** (`drive.file` scope), token in `sessionStorage`
- **Google Drive API v3** for storage (data JSON + raw documents)
- **pdfjs-dist** for client-side PDF text extraction (handles password-protected PDFs)
- **xlsx** (SheetJS) for Excel parsing (Groww reports)
- **shadcn/ui + Tailwind** for UI primitives
- **recharts** for charts
- **LLM Proxy** at `https://llm-proxy-smoky.vercel.app/api/proxy` for Claude calls (Sonnet 4.6 for review agent)
- Deployed via **GitHub Actions** to GitHub Pages at `<you>.github.io/finance-dashboard/`

---

## Domain model (TypeScript)

```ts
// src/domain/types.ts

type Frequency = 'monthly' | 'quarterly' | 'half-yearly' | 'yearly' | 'one-time';

interface IncomeStream {
  id: string;
  type: 'salary' | 'pension' | 'rental' | 'reimbursement' | 'insurance-payout' | 'other';
  label: string;                  // "Juspay salary", "Family pension share"
  amount: number;                 // per occurrence
  frequency: Frequency;
  expectedDayOfMonth?: number;    // 16 for pension
  startDate: string;              // ISO
  endDate?: string;
  sourceDocIds: string[];
}

interface Obligation {
  id: string;
  type: 'rent' | 'emi' | 'sip' | 'rd' | 'insurance-premium' | 'subscription' | 'utility' | 'support' | 'other';
  label: string;
  amount: number;
  frequency: Frequency;
  startDate: string;
  endDate?: string;               // for EMIs (auto-derived from tenure)
  autoDebit?: boolean;
  recipient?: string;
  sourceDocIds: string[];
}

// Discriminated union — each savings type has its own metadata schema
type SavingsInstrument =
  | MutualFundHolding
  | LICEndowmentPolicy
  | HDFCLifePolicy
  | PostalRD
  | BankFD
  | EPF | NPS
  | StockHolding
  | OtherSavings;

interface BaseSavings {
  id: string;
  label: string;
  amountPerInstallment: number;
  frequency: Frequency;
  startDate: string;
  maturityDate?: string;
  totalPaidToDate: number;
  currentValue?: number;
  expectedMaturityValue?: number;
  expectedXIRR?: number;
  sourceDocIds: string[];
}
interface MutualFundHolding extends BaseSavings { type: 'mutualFund'; folio: string; amc: string; category: string; units: number; nav: number; }
interface LICEndowmentPolicy extends BaseSavings { type: 'lic'; planNumber: string; policyNumber: string; sumAssured: number; premiumPaymentTerm: number; policyTerm: number; bonusAccrued: number; nominee: string; }
interface HDFCLifePolicy extends BaseSavings { type: 'hdfcLife'; productName: string; policyNumber: string; sumAssured: number; payoutSchedule?: { date: string; amount: number; type: 'survival' | 'maturity' }[]; }
interface PostalRD extends BaseSavings { type: 'postalRd'; accountNumber: string; tenureMonths: number; interestRate: number; }
// ...etc

interface Transaction {
  id: string;
  date: string;
  amount: number;
  direction: 'D' | 'C';
  category: string;
  description: string;
  accountId: string;            // links to Account
  obligationId?: string;        // if matched to a known obligation
  sourceDocId: string;
}

interface Account {
  id: string;
  type: 'savings' | 'creditCard' | 'brokerage' | 'wallet';
  institution: string;          // 'HDFC Bank', 'ICICI Bank'
  label: string;                // user-defined, e.g. 'Salary Account', 'Travel CC'
  identifierMask: string;       // last-4 mask, e.g. 'XXXX1234'
}

interface Document {
  id: string;
  driveFileId: string;
  type: string;                 // 'hdfc.creditCard.regalia', 'lic.policyStatement', 'icici.amazonPay'
  period: string;               // '2026-04' or 'one-time'
  uploadedAt: string;
  parseStatus: 'pending' | 'parsed' | 'failed';
  parsedHash?: string;
  derivedRecordIds?: string[];  // transactions / instruments created from this doc
}
```

---

## Parser plugin architecture

```ts
// src/parsers/types.ts
interface Parser<T = unknown> {
  id: string;
  label: string;
  matches(file: { name: string; firstPageText: string }): boolean;
  parse(file: File, opts: { password?: string }): Promise<ParseResult<T>>;
}

interface ParseResult<T> {
  type: 'transactions' | 'savingsInstrument' | 'incomeStream' | 'mixed';
  data: T;
  warnings: string[];
}

// src/parsers/registry.ts
export const parsers: Parser[] = [
  hdfcCreditCardParser,    // HDFC Regalia Gold + Swiggy + others (single regex family)
  iciciAmazonPayParser,
  hdfcBankAccountParser,
  growwMfHoldingsParser,   // xlsx
  growwSipExportParser,    // xlsx (later)
  licPolicyDocParser,      // PDF (later, when user shares one)
  hdfcLifePolicyDocParser, // PDF (later)
];

export function detectParser(file): Parser | null { /* try .matches() in order */ }
```

**Each parser is a single TS file** (~150 lines). Regex patterns are **ported verbatim from existing Python**:
- HDFC CC: `^\s*(\d{2}/\d{2}/\d{4})\s*\|\s*(\d{2}:\d{2})\s+(.*?)(?:\s{2,}(\+\s*)?C\s*([\d,]+\.\d{2}))` (from `parse.py:24`)
- ICICI: `^\s*(\d{2}/\d{2}/\d{4})\s+(\d{8,})\s+(.*?)\s+([\d,]+\.\d{2})(\s*CR)?` (from `parse.py:50`)
- HDFC Bank: date-anchored line + trailing 2-amount tokens (from `parse_bank.py:23`)
- Categorization rules: 21 regex rules from `analyze.py:11`

PDF text extraction: `pdfjs-dist` with `getDocument({ url, password })`. Password-protected PDFs (HDFC bank statements, customer ID) prompt user for password in a modal.

---

## Google Drive folder layout

```
PersonalFinance/                              ← root app folder, drive.file scope
├── data/
│   ├── accounts.json
│   ├── income.json
│   ├── obligations.json
│   ├── savings.json
│   ├── transactions/
│   │   ├── 2026-04.json                      ← sharded by month
│   │   └── 2026-03.json
│   ├── documents-index.json
│   └── config.json                           ← categorization rules, parser preferences
├── documents/
│   ├── 2026-04/
│   │   ├── hdfc-cc-<mask>.pdf
│   │   ├── hdfc-bank-<mask>.pdf
│   │   └── ...
│   └── one-time/                             ← LIC / HDFC Life / other policies (single docs)
│       ├── lic-<plan>-<policy-no>.pdf
│       └── hdfc-life-<product>.pdf
└── analyses/
    ├── 2026-04-monthly-review.md             ← Claude-generated
    └── 2026-04-cashflow.json                 ← derived numbers cache
```

`drive.file` scope means files are visible only when accessed via the app (no Drive UI browse). If user wants to see them in Drive UI, switch to `drive` scope (`/media/extra/Developer/learnings/GOOGLE_SETUP.md` flags this trade-off).

---

## Repo layout

```
finance-dashboard/
├── .github/workflows/deploy-pages.yml     ← from canonical Vite+GH Pages template
├── index.html                             ← root, not in public/
├── vite.config.ts                         ← base: '/finance-dashboard/'
├── src/
│   ├── main.tsx
│   ├── App.tsx                            ← HashRouter routes
│   ├── pages/
│   │   ├── Dashboard.tsx                  ← summary cards: income, savings, projections
│   │   ├── Income.tsx                     ← list + add/edit income streams
│   │   ├── Outflows.tsx                   ← list + add/edit obligations
│   │   ├── Savings.tsx                    ← list + per-type forms (MF, LIC, HDFCLife, RD)
│   │   ├── SavingsDetail.tsx              ← single instrument, projection chart
│   │   ├── Documents.tsx                  ← upload zone + monthly grid
│   │   ├── Transactions.tsx               ← filter/category/account view
│   │   └── MonthlyReview.tsx              ← Claude chat per month
│   ├── components/
│   │   ├── ui/                            ← shadcn primitives
│   │   ├── DocumentUploader.tsx
│   │   ├── PdfPasswordPrompt.tsx
│   │   ├── SavingsCard.tsx                ← polymorphic by type
│   │   ├── CashFlowChart.tsx
│   │   └── ProjectionChart.tsx
│   ├── domain/
│   │   ├── types.ts                       ← all interfaces above
│   │   ├── projections.ts                 ← MF + LIC + RD + FD maturity calc
│   │   └── cashflow.ts                    ← monthly aggregation
│   ├── parsers/
│   │   ├── types.ts
│   │   ├── registry.ts
│   │   ├── pdfText.ts                     ← pdfjs wrapper + password handling
│   │   ├── hdfcCreditCard.ts
│   │   ├── iciciAmazonPay.ts
│   │   ├── hdfcBankAccount.ts
│   │   ├── growwMfHoldings.ts
│   │   ├── licPolicy.ts                   ← Phase 3
│   │   └── hdfcLifePolicy.ts              ← Phase 3
│   ├── services/
│   │   ├── googleAuth.ts                  ← GIS wrapper, token mgmt
│   │   ├── drive.ts                       ← read/write JSON, upload binary, folder ops
│   │   ├── llmProxy.ts                    ← Claude via existing proxy
│   │   └── repository.ts                  ← typed data access (loadIncome, saveSavings, etc.)
│   ├── hooks/
│   │   ├── useGoogleAuth.ts
│   │   ├── useDocuments.ts
│   │   └── useTransactions.ts
│   ├── agents/
│   │   └── monthlyReview.ts               ← prompt template + Claude call
│   └── types/google.d.ts                  ← GIS type declarations
├── package.json
└── tsconfig.json
```

---

## Phased delivery

### Phase 0 — UI design in Figma (before any code)
**Goal**: nail the visual + interaction design before writing components.
- Use the **Figma MCP** integration with Claude to generate initial layouts:
  - Dashboard (4–6 summary cards, projection chart, quick actions)
  - Income, Outflows, Savings list views
  - Savings detail (per-instrument projection chart)
  - Documents page (monthly grid + drag-drop)
  - Monthly Review (Claude chat panel)
- Produce a small **design system** in Figma (color tokens, type scale, card/button primitives) so every page is coherent and the shadcn/Tailwind translation is mechanical.
- For each screen, capture a Figma node URL — Claude Code can later use `get_design_context` to pull React+Tailwind code stubs directly from each frame.
- Optionally publish a Figma library and use **Code Connect** mappings so generated code references shadcn components by name (e.g. `<Card>`, `<Button>`) instead of producing one-off styled divs.

**Verification**: at least one approved Figma frame per page (Dashboard, Income, Outflows, Savings, Documents, Monthly Review) with annotated layout, colors, type scale.

### Phase 1 — Foundation (MVP)
**Goal**: working SPA, auth, manual data entry, dashboard cards.
- Scaffold Vite + React + TS + HashRouter + Tailwind + shadcn
- Google OAuth wiring (`useGoogleAuth`, login button, sessionStorage token, 1hr expiry handling)
- Drive service: create `PersonalFinance/` folder, read/write `data/*.json`
- Manual entry forms for: income streams, obligations, accounts
- Dashboard page: 4 summary cards (monthly income, monthly committed, free cash, net worth placeholder)
- Deploy to GitHub Pages, verify end-to-end on phone + laptop

**Verification**: log in, add salary + rent + a SIP, see correct math on dashboard, refresh → data persists from Drive.

### Phase 2 — Document parsers
**Goal**: stop manual entry for transactional data.
- Document upload UI (drag/drop), stores under `documents/<YYYY-MM>/` in Drive
- PDF text extraction via `pdfjs-dist`, password prompt modal for HDFC bank
- Port `hdfcCreditCard.ts` parser (Regalia + Swiggy) — regex from `parse.py`
- Port `iciciAmazonPay.ts` parser
- Port `hdfcBankAccount.ts` parser
- Port categorization rules from `analyze.py` to `domain/categorize.ts`
- Transactions page: filter by month/account/category, summary per category
- Documents index links each parsed doc to derived transactions

**Verification**: upload an HDFC credit-card PDF, see all transactions appear categorized, sum-of-debits matches the statement's "PURCHASES/DEBIT (Current Billing Cycle)" line.

### Phase 3 — Savings instruments
**Goal**: track every long-term savings vehicle with type-specific data + projections.
- Per-type forms: MutualFund, LIC, HDFCLife, PostalRD, BankFD, EPF/NPS, StockHolding
- `growwMfHoldings.ts` parser (xlsx)
- `licPolicy.ts` parser (when user uploads a fresh LIC PDF — needs sample)
- `hdfcLifePolicy.ts` parser (same)
- `projections.ts`: maturity-value calc per instrument type
- Savings page: card per instrument, totals by type
- Detail page: projection chart (value over time until maturity)

**Verification**: upload Groww xlsx → MF list and current portfolio value match the Groww UI; manually enter a par-savings life-insurance policy → projection chart correctly shows next scheduled survival/maturity benefit.

### Phase 4 — Projections & cash flow forecast
- Cash flow projection: next 12 months, accounting for SIPs ending, EMIs ending, premium dates
- Calendar view of upcoming big debits (March HDFC Life ₹2.4L, June LIC premiums)
- "What-if" panel: toggle off an LIC policy → see how cash flow changes

**Verification**: forecast correctly shows the March cash crunch caused by HDFC Life premium.

### Phase 5 — Claude monthly review agent
- After uploading a month's documents → "Run monthly review" button
- Builds prompt: this month's transactions + delta vs prior month + savings progress + upcoming obligations
- Calls Claude Sonnet 4.6 via LLM proxy (`POST https://llm-proxy-smoky.vercel.app/api/proxy` with Google OAuth token, per migration doc)
- Streams response, saves as `analyses/<YYYY-MM>-monthly-review.md`
- Renders inline as monthly summary

**Verification**: upload a full month of docs, run review, get back a markdown report that explains where money went, calls out anomalies vs prior month, and lists action items.

---

## Critical files to reuse / port

| Source (Python) | Target (TS) | Pattern to preserve |
|---|---|---|
| Source (Python prototype, kept private outside this repo) | Target (TS) | Pattern to preserve |
| HDFC CC parser | `src/parsers/hdfcCreditCard.ts` | HDFC date-pipe regex `^\s*(\d{2}/\d{2}/\d{4})\s*\|\s*(\d{2}:\d{2})\s+...`; `+ C` → credit, `C` → debit |
| ICICI Amazon Pay parser | `src/parsers/iciciAmazonPay.ts` | ICICI date+serno regex `^\s*(\d{2}/\d{2}/\d{4})\s+(\d{8,})\s+...`; `CR` suffix → credit |
| HDFC Bank account parser | `src/parsers/hdfcBankAccount.ts` | Date-anchored line + trailing 2 amount tokens; closing-balance delta determines D/C |
| Categorization rules (21 regex rules) | `src/domain/categorize.ts` | First-match-wins category list, configurable via `data/config.json` |

---

## End-to-end verification per phase

1. **Phase 1**: open `https://<you>.github.io/finance-dashboard/` on phone → log in with Google → add a salary income stream → close tab → reopen → income card shows the same value (data round-tripped via Drive).
2. **Phase 2**: drag a credit-card statement PDF onto the upload zone → transaction list populates → sum-of-debits matches the statement summary line.
3. **Phase 3**: upload a Groww xlsx → portfolio total + XIRR match the Groww UI exactly.
4. **Phase 4**: cash-flow projection panel correctly anticipates large annual outflows (e.g. yearly insurance premium months) and net-positive months.
5. **Phase 5**: monthly-review agent returns a markdown summary that explains where money went, flags anomalies vs prior month, and lists action items.
