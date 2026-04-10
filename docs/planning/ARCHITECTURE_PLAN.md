# ParaBank Playwright Framework — Architecture Plan

**Project:** Portfolio-grade Playwright + JavaScript test automation  
**Target:** ParaBank (https://parabank.parasoft.com)  
**Maintainer:** Solo  
**Date:** 2026-04-07  
**Status:** Reference document — use during implementation

---

## 1. Folder Structure

```
parabank-playwright/
│
├── playwright.config.js              # UI test config (chromium default, 3 shards in CI)
├── playwright.api.config.js          # API-only config (no browser, faster feedback)
├── package.json
├── .env.example                      # Template for env vars (never commit .env)
├── .gitignore
├── .github/
│   └── workflows/
│       ├── ui-tests.yml              # UI test pipeline (sharded, Allure upload)
│       └── api-tests.yml             # API test pipeline (single runner, fast)
│
├── tests/
│   ├── ui/                           # UI test specs — organized by feature
│   │   ├── auth/
│   │   │   └── login.spec.js
│   │   ├── accounts/
│   │   │   ├── overview.spec.js
│   │   │   └── activity.spec.js
│   │   ├── transfers/
│   │   │   └── transfer-funds.spec.js
│   │   ├── bill-pay/
│   │   │   └── bill-pay.spec.js
│   │   ├── transactions/
│   │   │   └── find-transactions.spec.js
│   │   └── loans/
│   │       └── request-loan.spec.js
│   │
│   └── api/                          # API test specs — organized by service domain
│       ├── accounts/
│       │   └── accounts.spec.js
│       ├── customers/
│       │   └── customers.spec.js
│       ├── transactions/
│       │   └── transactions.spec.js
│       └── loans/
│           └── loans.spec.js
│
├── pages/                            # Page Object Model — one file per page/feature
│   ├── LoginPage.js
│   ├── AccountOverviewPage.js
│   ├── TransferFundsPage.js
│   ├── BillPayPage.js
│   ├── FindTransactionsPage.js
│   ├── RequestLoanPage.js
│   └── components/                   # Page Component Model — shared UI fragments
│       ├── NavigationBar.js
│       ├── AccountSelector.js        # Reusable <select> for account dropdowns
│       └── ErrorMessage.js           # Reusable error/alert component
│
├── api/                              # API layer — service objects per domain
│   ├── ApiClient.js                  # Base HTTP client (wraps Playwright request)
│   ├── AuthService.js                # Login, session management
│   ├── AccountService.js             # GET /accounts, account details
│   ├── CustomerService.js            # Customer data endpoints
│   ├── TransactionService.js         # Transfer, find transactions
│   ├── LoanService.js                # Request loan endpoints
│   └── schemas/                      # JSON Schema files for response validation
│       ├── account.schema.json
│       ├── customer.schema.json
│       ├── transaction.schema.json
│       └── loan.schema.json
│
├── fixtures/                         # Playwright fixture system — DI composition layer
│   ├── index.js                      # Central export: extend(base, {...all fixtures})
│   ├── ui.fixtures.js                # Page object fixtures (loginPage, overviewPage, etc.)
│   ├── api.fixtures.js               # API service fixtures (accountService, etc.)
│   └── data.fixtures.js              # Test data fixtures (authenticatedUser, newAccount)
│
├── helpers/                          # Pure utility functions — no Playwright dependency
│   ├── auth.helper.js                # API-based login for UI test state setup
│   ├── data.helper.js                # Random name/amount/date generators
│   ├── date.helper.js                # Date formatting for transaction filters
│   └── schema.helper.js              # AJV wrapper for JSON Schema validation
│
├── data/                             # Static test data — not generated at runtime
│   ├── users.js                      # Known demo credentials (john/demo, etc.)
│   └── constants.js                  # App constants (URLs, timeout values, account types)
│
├── config/                           # Environment and runtime configuration
│   └── environments.js               # Base URLs and API roots per environment
│
└── allure-results/                   # Auto-generated — gitignored
```

---

## 2. Layer Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        TEST SPECS                               │
│              tests/ui/**   tests/api/**                         │
│   (consume fixtures, assert behavior, own no setup logic)       │
└────────────────────┬────────────────────────────────────────────┘
                     │ imports via fixture system
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FIXTURE LAYER (fixtures/)                     │
│        index.js — composes ui + api + data fixtures             │
│        Playwright test.extend() — dependency injection          │
│   Owns: page object instantiation, service instantiation,       │
│         pre-authenticated state setup via storageState          │
└────────┬────────────────────────────┬───────────────────────────┘
         │                            │
         ▼                            ▼
┌─────────────────┐        ┌──────────────────────────┐
│   PAGE OBJECTS  │        │      API SERVICES         │
│   pages/        │        │      api/                 │
│                 │        │                           │
│ LoginPage       │        │ ApiClient (base)          │
│ OverviewPage    │        │ AccountService            │
│ TransferPage    │        │ TransactionService        │
│ ...             │        │ LoanService               │
│                 │        │ AuthService               │
│ components/     │        │                           │
│  NavBar         │        │ schemas/ (AJV validation) │
│  AccountSelect  │        │                           │
└────────┬────────┘        └──────────┬────────────────┘
         │                            │
         ▼                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                       HELPERS / DATA                            │
│   helpers/ — pure functions (auth setup, generators, schema)    │
│   data/    — static fixtures (known users, constants)           │
│   config/  — environment URLs, timeouts                         │
└─────────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PLAYWRIGHT CORE                            │
│   playwright.config.js  /  playwright.api.config.js            │
│   Browser, request context, storageState, project config        │
└─────────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                        CI / REPORTING                           │
│   .github/workflows/ui-tests.yml  (3-shard matrix)             │
│   .github/workflows/api-tests.yml (single runner)              │
│   Allure report upload + GitHub Pages or artifact              │
└─────────────────────────────────────────────────────────────────┘
```

**Dependency rule:** Each layer only imports from the layer below it. Test specs never import from `pages/` directly — they go through fixtures. Page objects never import from `api/` — those are separate concerns.

---

## 3. Key Files — Purpose and Interface

### `playwright.config.js`
The primary config for UI tests. Defines:
- `baseURL` sourced from `config/environments.js`
- `use.storageState` pointing to `auth/storageState.json` for pre-authenticated tests
- Three named projects: `chromium` (default), `firefox`, `webkit` (webkit optional/CI-only)
- `reporter`: `['allure-playwright', 'html', ['junit', {outputFile: 'results/junit.xml'}]]`
- `fullyParallel: true` at file level
- `retries: 1` in CI, `0` locally
- `forbidOnly: true` in CI

### `playwright.api.config.js`
Separate config for API test suites. Key differences from UI config:
- No `use.browserName` — API tests use `request` context only
- No `storageState` — API tests handle auth within fixtures
- Single project, no sharding needed
- Faster timeout values (API calls don't need 30s)
- Allows `npm run test:api` to run in isolation without launching browsers

### `fixtures/index.js`
The composition root of the entire framework. All test files import `{ test, expect }` from here, not from `@playwright/test` directly. This file calls `test.extend()` once with the merged fixture set from `ui.fixtures.js`, `api.fixtures.js`, and `data.fixtures.js`. This is the most important architectural file — it is the single integration point.

```js
// fixtures/index.js (interface sketch)
import { test as base } from '@playwright/test';
import { uiFixtures } from './ui.fixtures.js';
import { apiFixtures } from './api.fixtures.js';
import { dataFixtures } from './data.fixtures.js';

export const test = base.extend({ ...uiFixtures, ...apiFixtures, ...dataFixtures });
export { expect } from '@playwright/test';
```

### `fixtures/ui.fixtures.js`
Declares one fixture per page object. Each fixture receives `page` from Playwright and returns an instantiated page object. Scope: `'test'` (default). This is the only place page objects are instantiated — tests never call `new LoginPage(page)` directly.

### `fixtures/api.fixtures.js`
Declares one fixture per API service. Each fixture receives Playwright's `request` context and returns an instantiated service object. For authenticated API tests, this fixture handles session cookie injection so tests start pre-authenticated.

### `fixtures/data.fixtures.js`
Declares computed test data fixtures: `authenticatedUser` (calls API login, returns session + user context), `newUserCredentials` (generates random but valid credentials), `testAmount` (valid dollar amounts for transfers). Separates data setup from test logic.

### `api/ApiClient.js`
Base HTTP client wrapping Playwright's `APIRequestContext`. Provides:
- `get(path, options)`, `post(path, body)`, `put(path, body)`, `delete(path)`
- Automatic base URL prepending
- Response status assertion helper: `assertStatus(response, 200)`
- JSON body extraction with error messaging
- Session cookie attachment for authenticated requests

All service objects extend or compose `ApiClient` — they never call `request.get()` directly.

### `api/schemas/`
One `.json` file per response schema, written in JSON Schema draft-07. Validated using AJV (via `helpers/schema.helper.js`). These are the contracts that make API tests meaningful — not just "status 200" but "the shape is correct." This is a senior-level signal in the portfolio.

### `helpers/auth.helper.js`
Contains `loginViaApi(request, credentials)` — makes the POST to `/parabank/services/bank/login` and returns the session cookie. Used in `fixtures/data.fixtures.js` to set up `storageState` for UI tests that need a logged-in browser without going through the login UI. Keeps login-page tests isolated from all other UI tests.

### `data/users.js`
Static object of known ParaBank demo credentials. Example: `JOHN_SMITH: { username: 'john', password: 'demo' }`. These are the accounts that come pre-seeded in ParaBank. This is a constant, not a factory — it never generates values.

### `config/environments.js`
Exports a configuration object keyed by environment name (`local`, `staging`, `production`). Each entry has `baseURL` and `apiURL`. The active environment is selected via `process.env.TEST_ENV || 'staging'`. Both Playwright configs import from here — there is one source of truth for URLs.

---

## 4. Design Pattern Justification

### Page Object Model (POM)
**Problem it solves:** Selector sprawl. Without POM, the same `#username` selector appears in 12 test files and breaks when the dev renames it.

**How it's applied here:** One class per page. Each class owns its selectors as private locators and exposes semantic methods: `login(username, password)`, not `fill('#username', ...)`. Tests describe behavior, not clicks.

**Why not pure POM for everything:** Some UI fragments appear on multiple pages (the nav bar, account dropdowns). Duplicating those in every page object creates a second maintenance problem.

### Page Component Model (PCM) for shared fragments
**Problem it solves:** The account `<select>` dropdown appears on Transfer Funds, Bill Pay, and Find Transactions. If its selector changes, you want one fix — not three.

**How it's applied here:** `pages/components/` holds self-contained component classes. `TransferFundsPage` composes `AccountSelector` rather than re-implementing it. Components are only created for fragments that appear in 2+ page objects. Do not pre-emptively create components.

### Playwright Fixtures as Dependency Injection
**Problem it solves:** `beforeEach` hooks in test files create hidden coupling. Every test file that needs a logged-in page duplicates the same setup block. When the setup changes, you touch every file.

**How it's applied here:** The fixture system is the composition mechanism. A test that needs a logged-in `TransferFundsPage` declares it as a fixture parameter — the framework wires it up. The test itself contains zero setup code. This is the most important architectural decision for maintainability.

**Why this over beforeEach:** Fixtures are composable and scoped. A `worker`-scoped fixture runs once per Playwright worker, not once per test — critical for expensive operations like API login that would otherwise run hundreds of times in a suite.

### Service Object pattern for API layer
**Problem it solves:** Raw `request.get('/parabank/services/...')` calls scattered through API test files make URL changes painful and test intent unclear.

**How it's applied here:** Each domain (accounts, transactions, loans) gets a service class with semantic methods: `accountService.getAccounts(customerId)` rather than `request.get('/parabank/services/bank/customers/12212/accounts')`. The URL is in one place. Tests read as specifications.

### API-first state setup for UI tests
**Problem it solves:** UI tests that set up their own state through the UI are slow, brittle (UI changes break setup), and create unnecessary dependencies between tests.

**How it's applied here:** `helpers/auth.helper.js` performs login via API and produces a `storageState.json`. UI tests that require authentication start with this state — they never touch the login page. Login page tests are isolated and test the login flow explicitly. This pattern is what separates a senior framework from a beginner one.

### Two Playwright configs
**Problem it solves:** Running API tests with a browser config wastes time launching Chromium. Running UI tests with the API config skips browser-dependent setup.

**How it's applied here:** `playwright.config.js` for UI, `playwright.api.config.js` for API. Each has appropriate timeouts, parallelism, and reporter config. `npm run test:ui` and `npm run test:api` are separate commands. In CI, they run on separate jobs.

### JSON Schema validation in API tests
**Problem it solves:** Asserting `status 200` tells you the server didn't crash. It doesn't tell you the contract is intact. A field renamed on the backend will still return 200 — your tests will miss it.

**How it's applied here:** `api/schemas/` contains draft-07 JSON Schema definitions for each response type. `helpers/schema.helper.js` wraps AJV. Every API test that returns a structured payload runs schema validation as a first assertion before checking specific values. This is contract testing without the overhead of a dedicated contract testing tool.

---

## 5. Growth Plan

### Doubling the test count (20 → 80 tests)
No structural changes needed. The folder-per-feature convention in `tests/ui/` and `tests/api/` handles volume. Add test files, not new folders. The fixture system absorbs new page objects without touching existing tests.

### Adding a second feature area (e.g., admin panel)
Add `pages/AdminPage.js`, `tests/ui/admin/`, and one fixture in `ui.fixtures.js`. No changes to existing tests. The module boundary is clean.

### Adding a second tester
The fixture-as-DI pattern is the main enabler here. A new team member doesn't need to understand setup infrastructure to write a test — they import `{ test }` from `fixtures/index.js`, declare the page objects they need, and write assertions. The contracts are the fixture interfaces.

The naming convention (`*.spec.js`, `*Page.js`, `*Service.js`, `*.helper.js`) makes the role of each file self-evident. A new person can navigate the project without a guide.

### Cross-browser coverage
`playwright.config.js` already defines `firefox` and `webkit` projects. They're excluded from the default run (`--project=chromium`) but available. Add them to the CI matrix when cross-browser coverage is a requirement. No code changes needed.

### Docker isolation (recommended upgrade path)
ParaBank provides a Docker image. When running against shared `parasite.parasoft.com`, test data bleeds between runs. The upgrade: add a `docker-compose.yml` that spins up a local ParaBank instance, update `config/environments.js` with a `local` environment entry, and run `TEST_ENV=local` in CI. All test code is unchanged — only config.

### Parallel pipeline scaling
The 3-shard strategy in `ui-tests.yml` handles the current scope. If the suite grows to 150+ tests, increase shards to 5. Shard count is a single-line change in the workflow matrix. API tests stay on a single runner — they're fast enough.

---

## 6. Phased Build Order

### Phase 1 — Foundation (Build this first)
**Goal:** A runnable framework skeleton with one working end-to-end test. CI passing. No dead code.

Deliverables:
1. `package.json` with Playwright, AJV, allure-playwright, dotenv dependencies
2. `playwright.config.js` — chromium only, Allure reporter, baseURL from env
3. `playwright.api.config.js` — no browser, shorter timeouts
4. `config/environments.js` — staging URL for parabank
5. `data/users.js` — JOHN_SMITH credentials
6. `data/constants.js` — base URLs, app route paths
7. `api/ApiClient.js` — base HTTP wrapper (get, post, assertStatus)
8. `api/AuthService.js` — login endpoint only
9. `helpers/auth.helper.js` — loginViaApi function
10. `fixtures/index.js` — base extend, minimal fixtures
11. `pages/LoginPage.js` — login method only
12. `tests/ui/auth/login.spec.js` — one positive login test, one negative
13. `tests/api/customers/customers.spec.js` — one GET customers test with status assertion
14. `.github/workflows/ui-tests.yml` — single browser, no sharding yet, Allure artifact
15. `.github/workflows/api-tests.yml` — API job only
16. `.env.example`, `.gitignore`

**Done signal:** `npm run test:ui` runs and passes locally. `npm run test:api` runs and passes locally. GitHub Actions green on push.

---

### Phase 2 — Core Feature Coverage (Build this second)
**Goal:** All major ParaBank features have test coverage. API layer complete. Fixture composition in use.

Deliverables:
1. All remaining page objects: `AccountOverviewPage`, `TransferFundsPage`, `BillPayPage`, `FindTransactionsPage`, `RequestLoanPage`
2. All remaining API services: `AccountService`, `TransactionService`, `LoanService`, `CustomerService`
3. All JSON schemas in `api/schemas/` for each response type
4. `helpers/schema.helper.js` — AJV wrapper
5. `helpers/data.helper.js` — random name/amount/date generators
6. `helpers/date.helper.js` — date formatting
7. `fixtures/ui.fixtures.js` — all page object fixtures
8. `fixtures/api.fixtures.js` — all service fixtures
9. `fixtures/data.fixtures.js` — authenticatedUser, newUserCredentials, testAmount
10. UI specs for all features: accounts, transfers, bill-pay, find-transactions, loans
11. API specs for all services with schema validation on every response
12. `pages/components/NavigationBar.js`, `AccountSelector.js`, `ErrorMessage.js`

**Done signal:** Full test suite runs. Schema validation is active on all API tests. UI tests for authenticated flows start via `storageState` (no UI login in setup). Allure report shows all test results categorized.

---

### Phase 3 — Production Polish (Build this third)
**Goal:** CI is production-grade, reporting is portfolio-ready, framework is demonstrably scalable.

Deliverables:
1. Upgrade `ui-tests.yml` to 3-shard matrix with `--shard=1/3`, `2/3`, `3/3`
2. Allure report merge across shards in CI, publish to GitHub Pages
3. Tags on all tests: `@smoke`, `@regression`, `@api`, `@ui`, `@slow`
4. `npm` scripts for filtered runs: `test:smoke`, `test:regression`, `test:ui`, `test:api`
5. Retry logic: `retries: 1` in CI config, `0` locally
6. `forbidOnly: true` in CI playwright configs
7. Screenshot and video on failure configured in `playwright.config.js`
8. Test result trends if using Allure with history (configure allure-history in CI)
9. README.md documenting: setup, running tests locally, running in CI, architecture overview
10. Optional: `docker-compose.yml` for local ParaBank instance (strong portfolio signal)

**Done signal:** CI runs sharded, Allure report is published and accessible, a reviewer can clone the repo, run `npm install && npm run test:smoke` and see results in 2 minutes, and read the README to understand every architectural decision.

---

## 7. npm Scripts Reference

```json
{
  "scripts": {
    "test:ui":         "playwright test --config=playwright.config.js",
    "test:api":        "playwright test --config=playwright.api.config.js",
    "test:smoke":      "playwright test --grep @smoke",
    "test:regression": "playwright test --grep @regression",
    "test:ui:headed":  "playwright test --config=playwright.config.js --headed",
    "report":          "allure serve allure-results",
    "report:generate": "allure generate allure-results --clean -o allure-report"
  }
}
```

---

## 8. CI Workflow Sketches

### `ui-tests.yml` (Phase 3 version)

```yaml
name: UI Tests
on: [push, pull_request]

jobs:
  ui-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: [1, 2, 3]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:ui -- --shard=${{ matrix.shard }}/3
        env:
          TEST_ENV: staging
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: allure-results-${{ matrix.shard }}
          path: allure-results/

  publish-report:
    needs: ui-tests
    if: always()
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          pattern: allure-results-*
          merge-multiple: true
          path: allure-results/
      - run: npm install -g allure-commandline
      - run: allure generate allure-results --clean -o allure-report
      - uses: actions/upload-artifact@v4
        with:
          name: allure-report
          path: allure-report/
```

### `api-tests.yml`

```yaml
name: API Tests
on: [push, pull_request]

jobs:
  api-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:api
        env:
          TEST_ENV: staging
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: allure-results-api
          path: allure-results/
```

---

## 9. Environment Variables

```bash
# .env.example
TEST_ENV=staging          # local | staging | production
BASE_URL=                 # Override base URL (optional — use environments.js instead)
ALLURE_RESULTS_DIR=allure-results
```

---

## 10. Conventions and Rules

| Rule | Rationale |
|------|-----------|
| All tests import `{ test, expect }` from `fixtures/index.js`, never from `@playwright/test` | Ensures fixture composition is always active |
| Page objects take `page` in constructor, nothing else | Keeps page objects framework-portable |
| Service objects take `request` in constructor, nothing else | Same reason |
| No `beforeEach` in test files | All setup is in fixtures |
| Selectors are private to the page object | Prevents selector leakage into tests |
| One `*.spec.js` per feature area, not per test case | Keeps the file list manageable |
| Components are only created when a fragment appears in 2+ page objects | Prevents premature abstraction |
| Schema validation runs before value assertions in API tests | A schema failure means the contract broke — surface it first |
| Tags on every test from day one | Retroactively tagging 80 tests is painful |
