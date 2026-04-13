# ParaBank Playwright Framework

A portfolio-grade test automation framework for [ParaBank](https://parabank.parasoft.com) — a demo banking application maintained by Parasoft. Built with Playwright and JavaScript, this project demonstrates production patterns for both UI and API test automation: fixture-based dependency injection, Page Object Model with Page Component Model, API-first state setup, JSON Schema contract validation, and a sharded CI pipeline with published Allure reporting.

---

## Prerequisites

- Node.js 20 or later
- npm 9 or later

Playwright manages its own browser binaries — no separate browser installation is required.

---

## Setup

```bash
git clone https://github.com/<your-username>/parabank-playwright.git
cd parabank-playwright
npm install
npx playwright install chromium
```

For the full browser matrix (used in nightly runs):

```bash
npx playwright install
```

---

## Environment Configuration

Tests run against the public ParaBank staging environment by default. No `.env` file is required to get started.

To override the target environment, copy `.env.example` and edit it:

```bash
cp .env.example .env
```

**.env.example:**

```
TEST_ENV=staging    # local | staging
```

Environment-to-URL mapping lives in `config/environments.js`. `TEST_ENV` selects the active entry. `BASE_URL` in that file is the only place URLs are defined — tests never hardcode them.

---

## Running Tests Locally

| Command | What it runs |
|---|---|
| `npm run test:ui` | All UI tests against staging (Chromium, headless) |
| `npm run test:ui:headed` | All UI tests against staging with the browser visible |
| `npm run test:ui:staging` | All UI tests against staging (explicit — same as `test:ui`) |
| `npm run test:ui:staging:headed` | All UI tests against staging with the browser visible |
| `npm run test:api` | All API tests (no browser) |
| `npm run test:smoke` | Tests tagged `@smoke` across both UI and API |
| `npm run test:regression` | Tests tagged `@regression` across both UI and API |
| `npm run report` | Generate Allure report and open it in the browser |
| `npm run report:generate` | Generate Allure report without opening it |

### Tag reference

Every test title carries one or more tags used for suite filtering:

| Tag | Meaning |
|---|---|
| `@smoke` | Happy-path / positive flows — fast, blocking on PR |
| `@regression` | Error handling, edge cases, contract checks |
| `@ui` | UI tests only (browser required) |
| `@api` | API tests only (no browser) |

Examples:

```bash
# Run only smoke tests through the UI config
npx playwright test --config=playwright.config.js --grep @smoke

# Run only API regression tests
npx playwright test --config=playwright.api.config.js --grep @regression
```

---

## Running Locally with Docker

Instead of hitting the shared public staging server, you can spin up your own ParaBank instance in Docker and run tests against it.

**Prerequisites:** Docker Desktop installed and running.

```bash
# Start ParaBank in the background — waits until the healthcheck passes before returning
npm run docker:up

# Run UI tests against the local container
npm run test:local

# Or run API tests against the local container
npm run test:local:api

# Stop and remove the container when you're done
npm run docker:down
```

Tail the container logs at any time with:

```bash
npm run docker:logs
```

**Clean state on every restart.** ParaBank uses an in-memory HSQLDB — no data is persisted to disk. Every `docker:down` / `docker:up` cycle starts with a fresh database. This is intentional: it guarantees test isolation and eliminates leftover state from previous runs.

**Pre-seeded accounts.** The Docker image ships with the same `john`/`demo` demo account that the public staging environment uses. Tests that reference `USERS.JOHN_SMITH` in `data/users.js` work against the local container without any credential changes.

---

## Project Structure

```
parabank-playwright/
├── playwright.config.js          # UI test config (Chromium, Allure, JUnit reporters)
├── playwright.api.config.js      # API test config (no browser, shorter timeouts)
├── config/environments.js        # Base URLs per environment — single source of truth
├── data/
│   ├── users.js                  # Known demo credentials (john/demo, etc.)
│   └── constants.js              # Route paths, app-wide constants
├── api/
│   ├── ApiClient.js              # Base HTTP wrapper around Playwright request context
│   ├── AuthService.js            # Login endpoint
│   ├── AccountService.js         # Account endpoints
│   ├── TransactionService.js     # Transfer and transaction query endpoints
│   ├── LoanService.js            # Loan application endpoints
│   ├── CustomerService.js        # Customer profile endpoints
│   └── schemas/                  # JSON Schema draft-07 files for response validation
├── pages/
│   ├── LoginPage.js
│   ├── AccountOverviewPage.js
│   ├── TransferFundsPage.js
│   ├── BillPayPage.js
│   ├── FindTransactionsPage.js
│   ├── RequestLoanPage.js
│   └── components/               # Shared UI fragments (NavBar, AccountSelector, ErrorMessage)
├── fixtures/
│   ├── index.js                  # Composition root — all test files import from here
│   ├── ui.fixtures.js            # Page object fixtures
│   ├── api.fixtures.js           # API service fixtures
│   └── data.fixtures.js          # Test data fixtures (authenticatedUser, accountIds, etc.)
├── helpers/
│   ├── auth.helper.js            # API-based login for UI storageState setup
│   ├── schema.helper.js          # AJV wrapper — validateSchema() throws on failure
│   ├── data.helper.js            # Random value generators
│   └── date.helper.js            # Date formatting for transaction filters
├── tests/
│   ├── ui/                       # UI specs organized by feature area
│   └── api/                      # API specs organized by service domain
└── .github/workflows/
    ├── ui-tests.yml              # 3-shard UI pipeline with Allure publish to GitHub Pages
    └── api-tests.yml             # Single-runner API pipeline
```

See `docs/planning/ARCHITECTURE_PLAN.md` for the full layer diagram, design pattern justification, and growth plan.

---

## Architecture Highlights

### Fixture-based Dependency Injection

All test files import `{ test, expect }` from `fixtures/index.js`, never directly from `@playwright/test`. The fixture system composes page objects, API services, and test data into injectable parameters. Tests declare what they need; the framework wires it up. There are no `beforeEach` setup blocks in test files.

```js
// A test declares its dependencies — it does not construct them
test('TC-XFER-UI-001: successful transfer shows confirmation @smoke @ui', async ({
  transferPage,   // instantiated and pre-authenticated by the fixture
  accountIds,     // real account IDs fetched from the API at fixture setup time
  testAmount,     // randomly generated valid transfer amount
}) => {
  await transferPage.navigate();
  await transferPage.transfer(String(testAmount), accountIds[0], accountIds[1]);
  await expect(transferPage.confirmationHeading).toBeVisible();
});
```

### Page Object Model + Page Component Model

One class per page, exposing semantic methods (`login(username, password)`) rather than raw locator interactions. UI fragments that appear on multiple pages (the account `<select>` dropdown on Transfer, Bill Pay, and Find Transactions) are extracted into `pages/components/` and composed rather than duplicated.

### API-First State Setup for UI Tests

Authenticated UI tests never go through the login page to set up state. `helpers/auth.helper.js` performs login via the API and produces a `storageState.json`. The `authenticatedContext` fixture (worker-scoped, runs once per Playwright worker) applies this state to the browser context. Login UI tests remain isolated and test the login flow explicitly. This eliminates hundreds of redundant login interactions across the suite.

### JSON Schema Contract Validation

Every API test validates the response shape against a JSON Schema draft-07 definition before asserting on specific values. A schema failure (renamed field, wrong type, missing required property) is surfaced immediately rather than appearing as a misleading value assertion failure. AJV is wrapped in `helpers/schema.helper.js` — `validateSchema(body, schema)` throws a descriptive error listing every violation.

---

## CI/CD

### Workflows

**`ui-tests.yml` — triggers on push and PR to `main`**

Runs the UI test suite split across three parallel shards. Each shard uploads its Allure results as a separate artifact. After all shards complete (even on failure), the `publish-report` job downloads all three shard artifacts plus the API results artifact, merges them, generates a combined Allure report, and publishes it to GitHub Pages.

**`api-tests.yml` — triggers on push and PR to `main`**

Runs the full API test suite on a single runner (no sharding needed — the suite completes in under 2 minutes without browser overhead). Uploads Allure results as `allure-results-api`, which the UI workflow's publish job picks up.

### Allure Report

The published Allure report is available at:

```
https://<owner>.github.io/<repo>/
```

GitHub Pages must be configured to serve from the `gh-pages` branch in repository Settings. The report is overwritten on every run — it always reflects the most recent pipeline results.

### Secrets Required

| Secret | Purpose |
|---|---|
| `GITHUB_TOKEN` | Built-in — used by `peaceiris/actions-gh-pages` to push to `gh-pages` |

No additional secrets are required for the staging environment. If running against a protected environment, add the appropriate credentials as repository secrets and reference them via `${{ secrets.SECRET_NAME }}` in the workflow env block.

---

## Tech Stack

| Tool | Version | Role |
|---|---|---|
| [Playwright](https://playwright.dev) | ^1.43 | Browser automation + API request context |
| [Node.js](https://nodejs.org) | 20 | Runtime |
| [AJV](https://ajv.js.org) | ^8.12 | JSON Schema validation (API contract tests) |
| [allure-playwright](https://allurereport.org) | ^3.0 | Test reporter — results consumed by Allure CLI |
| [Allure CLI](https://allurereport.org/docs/install-for-nodejs/) | latest | Report generation in CI |
| [dotenv](https://github.com/motdotla/dotenv) | ^16.4 | Local `.env` file loading |
| [peaceiris/actions-gh-pages](https://github.com/peaceiris/actions-gh-pages) | v3 | GitHub Pages deployment in CI |
