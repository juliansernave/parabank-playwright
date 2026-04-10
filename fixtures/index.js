import { expect, mergeTests } from '@playwright/test';
import { uiFixtures } from './ui.fixtures.js';
import { apiFixtures } from './api.fixtures.js';
import { dataFixtures } from './data.fixtures.js';

/**
 * Composition root for all test fixtures.
 *
 * All test files import { test, expect } from here — never from @playwright/test directly.
 * mergeTests combines independent fixture sets without requiring one to extend the other,
 * which keeps ui.fixtures.js, api.fixtures.js, and data.fixtures.js decoupled from each other.
 *
 * Fixture availability per test:
 *
 * UI (ui.fixtures.js):
 *   loginPage             — unauthenticated LoginPage (default `page`)
 *   authenticatedContext  — BrowserContext with session cookie (worker-scoped)
 *   authenticatedPage     — Page from authenticated context (per-test)
 *   overviewPage          — AccountOverviewPage on authenticatedPage
 *   transferPage          — TransferFundsPage on authenticatedPage
 *   billPayPage           — BillPayPage on authenticatedPage
 *   findTransactionsPage  — FindTransactionsPage on authenticatedPage
 *   requestLoanPage       — RequestLoanPage on authenticatedPage
 *
 * API (api.fixtures.js):
 *   authService           — AuthService instance
 *   accountService        — AccountService instance
 *   transactionService    — TransactionService instance
 *   loanService           — LoanService instance
 *   customerService       — CustomerService instance
 *
 * Data (data.fixtures.js):
 *   authenticatedUser     — { customerId, cookieString } (worker-scoped)
 *   accountIds            — number[] of real account IDs for john/demo
 *   testAmount            — 100 (constant)
 *   newUserCredentials    — randomly generated credentials
 */
export const test = mergeTests(uiFixtures, apiFixtures, dataFixtures);

export { expect };
