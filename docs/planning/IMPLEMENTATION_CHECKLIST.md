# ParaBank Playwright Framework — Implementation Checklist

**Use this doc to resume work after a session expires.**  
Each item maps to a deliverable from `ARCHITECTURE_PLAN.md`. Check off items as they are completed.

---

## Phase 1 — Foundation
**Goal:** Runnable framework skeleton with one working E2E test. CI passing.  
**Done signal:** `npm run test:ui` and `npm run test:api` pass locally. GitHub Actions green on push.

- [x] `package.json` — Playwright, AJV, allure-playwright, dotenv dependencies
- [x] `playwright.config.js` — chromium only, Allure reporter, baseURL from env
- [x] `playwright.api.config.js` — no browser, shorter timeouts
- [x] `config/environments.js` — staging URL for ParaBank
- [x] `data/users.js` — JOHN_SMITH credentials
- [x] `data/constants.js` — base URLs, app route paths
- [x] `api/ApiClient.js` — base HTTP wrapper (get, post, put, assertStatus)
- [x] `api/AuthService.js` — login endpoint only
- [x] `helpers/auth.helper.js` — loginViaApi function
- [x] `fixtures/index.js` — mergeTests composition root
- [x] `fixtures/ui.fixtures.js` — base UI fixtures
- [x] `fixtures/api.fixtures.js` — base API fixtures
- [x] `pages/LoginPage.js` — login method only
- [x] `tests/ui/auth/login.spec.js` — positive login + negative login tests
- [x] `tests/api/customers/customers.spec.js` — GET customers with status assertion
- [x] `.github/workflows/ui-tests.yml` — single browser, Allure artifact
- [x] `.github/workflows/api-tests.yml` — API job only
- [x] `.env.example`, `.gitignore`

---

## Phase 2 — Core Feature Coverage
**Goal:** All major ParaBank features covered. API layer complete. Fixture composition in use.  
**Done signal:** Full suite runs. Schema validation active on all API tests. Authenticated UI tests use storageState.

### Agents used (in order)
1. **test-designer-agent** — produced scenario matrix (37 scenarios, 9 spec files)
2. **api-playwright-agent** — built API layer
3. **playwright-ui-specialist** — built UI layer

### API Layer

#### Services
- [x] `api/AccountService.js` — getAccountsByCustomer, getAccountById
- [x] `api/TransactionService.js` — transfer, transferRaw, getTransactionsByAccount, getTransactionsByAmount
- [x] `api/LoanService.js` — applyForLoan, applyForLoanRaw
- [x] `api/CustomerService.js` — getCustomer, updateCustomer

#### Schemas
- [x] `api/schemas/account.schema.json`
- [x] `api/schemas/transaction.schema.json`
- [x] `api/schemas/loan.schema.json`
- [x] `api/schemas/customer.schema.json`

#### Helpers
- [x] `helpers/schema.helper.js` — AJV wrapper (validateSchema throws on failure)
- [x] `helpers/data.helper.js` — random value generators (name, amount, phone, address)
- [x] `helpers/date.helper.js` — formatDate, today(), daysAgo(n) → MM-DD-YYYY

#### Fixtures
- [x] `fixtures/api.fixtures.js` — updated with accountService, transactionService, loanService, customerService
- [x] `fixtures/data.fixtures.js` — authenticatedUser, accountIds, testAmount, newUserCredentials
- [x] `fixtures/index.js` — updated mergeTests to include dataFixtures

#### API Specs (37 scenarios total across all specs)
- [x] `tests/api/accounts/accounts.spec.js` — 4 tests (TC-ACCT-API-001 to 004)
- [x] `tests/api/transactions/transactions.spec.js` — 5 tests (TC-TXN-API-001 to 005)
- [x] `tests/api/loans/loans.spec.js` — 4 tests (TC-LOAN-API-001 to 004)
- [x] `tests/api/customers/update-profile.spec.js` — 4 tests (TC-CUST-API-001 to 004)

### UI Layer

#### Page Objects
- [x] `pages/AccountOverviewPage.js` — parseCurrency, getAllBalances, getDisplayedTotalBalance
- [x] `pages/TransferFundsPage.js` — composes two AccountSelector instances
- [x] `pages/BillPayPage.js` — inputs targeted by name attribute
- [x] `pages/FindTransactionsPage.js` — four separate search submit buttons
- [x] `pages/RequestLoanPage.js` — waits for AJAX result panel, getNewAccountId()

#### Page Components
- [x] `pages/components/NavigationBar.js` — scoped to #leftPanel
- [x] `pages/components/AccountSelector.js` — reusable dropdown, accepts pre-built locator
- [x] `pages/components/ErrorMessage.js` — handles #validationErrors and p.error patterns

#### Fixtures
- [x] `fixtures/ui.fixtures.js` — updated with all new page object fixtures (worker-scoped authenticatedContext)

#### UI Specs
- [x] `tests/ui/accounts/overview.spec.js` — 4 tests (TC-ACCT-UI-001 to 004)
- [x] `tests/ui/transfers/transfer-funds.spec.js` — 5 tests (TC-XFER-UI-001 to 005)
- [x] `tests/ui/bill-pay/bill-pay.spec.js` — 4 tests (TC-BILL-UI-001 to 004)
- [x] `tests/ui/find-transactions/find-transactions.spec.js` — 4 tests (TC-FIND-UI-001 to 004)
- [x] `tests/ui/loans/request-loan.spec.js` — 4 tests (TC-LOAN-UI-001 to 004)

---

## Phase 3 — Production Polish
**Goal:** CI is production-grade, reporting is portfolio-ready, framework is demonstrably scalable.  
**Done signal:** CI runs sharded, Allure report published and accessible, `npm run test:smoke` works in under 2 minutes from a fresh clone.

**Agent needed:** ci-cd-agent (for workflows upgrade + GitHub Pages publishing)

### CI / Workflow
- [x] Upgrade `ui-tests.yml` to 3-shard matrix (`--shard=1/3`, `2/3`, `3/3`) — `fail-fast: false`, browser cache keyed on package-lock.json
- [x] Allure report merge across shards in CI job — `merge-multiple: true` flattens all 4 artifacts (3 UI + 1 API)
- [x] Publish Allure report to GitHub Pages — `peaceiris/actions-gh-pages@v3`, `force_orphan: true`
- [x] `forbidOnly: true` in CI playwright configs — already present, confirmed
- [x] `retries: 1` in CI, `0` locally — already present, confirmed
- [x] Screenshot and video on failure configured in `playwright.config.js` — `screenshot: only-on-failure`, `video: retain-on-failure`, `trace: retain-on-failure`
- [ ] Allure history/trends configured in CI (allure-history artifact) — not implemented, optional

### Tags & npm Scripts
- [x] Add `@smoke`, `@regression`, `@api`, `@ui` tags to all tests — 23 UI tests + 18 API tests fully tagged
- [x] `npm` scripts: `test:smoke`, `test:regression`, `test:ui`, `test:api`, `test:ui:headed`, `report:generate`

### Documentation
- [x] `README.md` — setup, npm scripts reference, tag grep examples, env config, architecture highlights, CI/CD, tech stack table

### Optional (strong portfolio signal)
- [x] `docker-compose.yml` — `parasoft/parabank`, healthcheck with 2-min boot window, `restart: unless-stopped`
- [x] Update `config/environments.js` with `local` environment entry (`http://localhost:8080`)
- [x] Docker npm scripts: `docker:up`, `docker:down`, `docker:logs`, `test:local`, `test:local:api`
- [x] CI workflows updated with `services:` block (parabank available in CI, staging remains default)
- [x] README updated with "Running Locally with Docker" section

---

## Key Architectural Constraints (never break these)

| Rule | Where it matters |
|------|-----------------|
| All specs import `{ test, expect }` from `fixtures/index.js`, never from `@playwright/test` | Every spec file |
| Fixtures use `mergeTests` — add to `ui.fixtures.js` or `api.fixtures.js`, not directly to `index.js` | When adding fixtures |
| Service objects extend `ApiClient` (inheritance, not composition) | When adding API services |
| Schema validation runs before value assertions | Every API test |
| Tags go in the test title string: `'description @smoke'` | Every test |
| No `beforeEach` in test files — all setup belongs in fixtures | Every spec file |
| `authenticatedContext` is worker-scoped — do not change to test-scoped | `ui.fixtures.js` |
| Node v25 requires `with { type: 'json' }` for JSON imports (not `assert`) | Schema imports in spec files |

---

## Known Implementation Notes

- **Loan tests (TC-LOAN-API-001/003):** Use a fallback loop over `accountIds` to find a working account. On staging, parallel workers can leave `accountIds[0]` temporarily returning 400 "Could not find account". Iterating through all accounts handles this gracefully.
- **TC-LOAN-API-002:** Staging *approves* $0 downPayment loans (returns 200, `approved:true`). Local Docker crashes (400/500). Test accepts both — asserts schema validity if 200, or [400,500] if error.
- **TC-LOAN-API-004 / TC-TXN-API-004:** Missing required params — Local Docker returns 500, Staging returns 400. Tests assert `not.toBe(200)` and `toContain([400, 500])`.
- **`accountIds` fixture:** Sorted by balance descending so `accountIds[0]` is always the highest-balance account — maximises chance of a successful transfer/loan source.
- **`transaction.schema.json`:** `description` is NOT in `required` — some transaction types on staging omit this field.
- **TC-CUST-API-001/002:** `beforeEach` reads current profile, `afterEach` restores it. Tests are idempotent against the shared staging environment.
- **TC-FIND-UI-004:** Retrieves a real transaction ID at runtime via `transactionService.getTransactionsByAccount()`. Uses `test.skip()` if no transactions exist.
- **TC-LOAN-UI-004:** Submits loan in the test, captures new account ID from result page, navigates to overview and verifies — cross-page state consistency test.
- **AJV:** Imported via `createRequire` from ESM context (AJV v8 is CommonJS-only).

## Test Results Status

| Environment | API Tests | Last verified |
|-------------|-----------|---------------|
| Staging (parabank.parasoft.com) | 18/18 ✓ | 2026-04-08 |
| Local Docker (localhost:8080) | 18/18 ✓ | 2026-04-08 |
