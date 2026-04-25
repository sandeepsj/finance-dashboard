# finance-dashboard

A personal finance dashboard that runs entirely in your browser.

- **Frontend**: React SPA on GitHub Pages (free hosting)
- **Backend**: Your own Google Drive (zero-cost storage, total privacy)
- **Auth**: Google Sign-In via Google Identity Services (OAuth, `drive.file` scope)
- **Parsers**: Deterministic regex parsers for Indian bank / credit-card / insurance statements
- **AI**: Optional monthly review via Claude (through an LLM proxy) — pending

> **Privacy:** No personal data is ever committed to this repo. All statements,
> transactions, and computed results live in the user's own Google Drive. This
> repo contains only code, documentation, and parser logic.

## Status

See [`docs/ROADMAP.md`](./docs/ROADMAP.md) for the phased plan and what's done.

## Getting started

```bash
npm install
cp .env.example .env.local       # optional — only needed for Drive sync (see below)
npm run dev                      # Vite dev server
npm run build                    # production build → dist/
npm run typecheck                # TypeScript-only check
```

The app works **without** Drive sync — without an OAuth client ID, it falls
back to a "local-only" mode where data persists to browser localStorage. Drop
a file on `/upload` and the dashboard fills in.

## Drive sync — OAuth client setup (optional, one-time)

Drive sync is what makes the dashboard usable across devices and scoped to
your Google identity. Each user's data lives in their own Drive folder
(`finance-dashboard/`) — the dashboard can only see files it created
(`drive.file` scope).

1. Open https://console.cloud.google.com/.
2. Create a new project (any name) or select an existing one.
3. Go to **APIs & Services → Library** and enable **Google Drive API**.
4. Go to **APIs & Services → OAuth consent screen**:
   - User type: **External** (works for personal Gmail accounts).
   - Fill app name, support email, developer email.
   - Add yourself as a **test user** while the app is in "Testing" status.
5. Go to **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**.
   - Authorized JavaScript origins: add `http://localhost:5173` for dev, plus
     `https://<you>.github.io` if you'll deploy to GitHub Pages.
   - Save and copy the **Client ID** (looks like `…apps.googleusercontent.com`).
6. Paste it into `.env.local`:
   ```
   VITE_GOOGLE_CLIENT_ID=…apps.googleusercontent.com
   ```
7. `npm run dev`, click **Sign in to Drive** in the top-right of the app.

Sign-in flow uses Google Identity Services (modern token-based OAuth, no
third-party cookies). The token is held in `sessionStorage` for the tab's
lifetime; silent refresh runs ~1 minute before expiry.

## Implemented so far

- ✅ Design system tokens (light + dark, oklch palette, Inter + JetBrains Mono)
- ✅ UI primitives (`Card`, `Button`, `Badge`, `Delta`, `Sparkline`, `KPICard`, `CashflowChart`, `TransactionTable`, `Progress`, `PortfolioDonut`, `DailyDebitChart`, `Icon`)
- ✅ App shell — SideNav, TopBar, HashRouter, dark mode toggle, Sign-In button
- ✅ Domain store — `useSyncExternalStore`-based, debounced persistence with pluggable backends
- ✅ Persistence — `LocalStoragePersistence` (always) + `DrivePersistence` (when signed in) composed with last-write-wins on Drive primary, localStorage fallback
- ✅ Auth — Google Identity Services token client (`drive.file openid email profile` scopes), sign-in/out, silent refresh, session restore on reload
- ✅ Drive client — REST calls, app-folder lookup/creation, multipart upload for `data.json` and raw documents
- ✅ Parser pipeline — Strategy/Chain-of-Responsibility/Adapter/Template-Method/Registry/Observer; readers for PDF / XLSX / CSV / Text
- ✅ Parsers — HDFC bank statement, HDFC credit cards (Regalia + Swiggy), ICICI credit cards, Groww mutual fund holdings
- ✅ Categorizer rule pack — ~60 India-flavored merchant rules, applied at derive-time so refinements retro-apply
- ✅ Pages — Dashboard, Upload, Income, Outflows, Savings, Transactions, Documents (all wired to the store)
- 🚧 Monthly Review — needs LLM proxy wiring (Phase E)

## Design reference

The full design system lives in [`docs/design/`](./docs/design) — a frozen
self-contained bundle exported from claude.ai/design. Open
`docs/design/project/Finance Dashboard Design System.html` in a browser to
view the interactive canvas.

## Architecture

- [`docs/PLAN.md`](./docs/PLAN.md) — original architecture plan
- [`docs/ROADMAP.md`](./docs/ROADMAP.md) — phased delivery plan + current state
- [`src/parsers/README.md`](./src/parsers/README.md) — how to add a new parser

## License

MIT
