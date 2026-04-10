import { test as base } from '@playwright/test';
import { AuthService } from '../api/AuthService.js';
import { AccountService } from '../api/AccountService.js';
import { TransactionService } from '../api/TransactionService.js';
import { LoanService } from '../api/LoanService.js';
import { CustomerService } from '../api/CustomerService.js';
import { apiURL } from '../config/environments.js';

/**
 * API fixtures — service object instances scoped to each test.
 *
 * Service objects are composed here, not in test files.
 * The `request` fixture is Playwright's built-in APIRequestContext.
 * All service constructors receive the same `request` and `apiURL` —
 * auth (JSESSIONID cookie) is managed by Playwright's cookie jar automatically
 * once a login call has been made against the same context.
 */
export const apiFixtures = base.extend({
  authService: async ({ request }, use) => {
    await use(new AuthService(request, apiURL));
  },

  accountService: async ({ request }, use) => {
    await use(new AccountService(request, apiURL));
  },

  transactionService: async ({ request }, use) => {
    await use(new TransactionService(request, apiURL));
  },

  loanService: async ({ request }, use) => {
    await use(new LoanService(request, apiURL));
  },

  customerService: async ({ request }, use) => {
    await use(new CustomerService(request, apiURL));
  },
});
