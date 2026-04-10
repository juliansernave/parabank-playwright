import { test, expect } from '../../../fixtures/index.js';
import { validateSchema } from '../../../helpers/schema.helper.js';
import transactionSchema from '../../../api/schemas/transaction.schema.json' with { type: 'json' };

/**
 * Transactions API test suite.
 *
 * Account IDs are resolved at runtime via the `accountIds` fixture — tests
 * never hardcode account numbers.
 *
 * TC-TXN-API-004 note: ParaBank's transfer endpoint is forgiving about missing
 * params — we document the actual status code returned rather than asserting
 * a theoretical 400. See inline comment for observed behavior.
 *
 * Schema validation runs before value assertions in every test.
 */
test.describe('Transactions API', () => {

  /**
   * TC-TXN-API-001
   * Verify that a valid fund transfer between two real accounts returns 200.
   * Uses accountIds[0] as source and accountIds[1] as destination.
   * Requires at least two accounts to exist on the customer (john/demo has many).
   */
  test('TC-TXN-API-001: POST /transfer with valid accounts and amount returns 200 @smoke @api', async ({
    transactionService,
    accountIds,
    testAmount,
  }) => {
    // Need at least two accounts to transfer between
    expect(accountIds.length).toBeGreaterThanOrEqual(2);

    const fromAccountId = accountIds[0];
    const toAccountId = accountIds[1];

    const response = await transactionService.transfer(fromAccountId, toAccountId, testAmount);

    expect(response.status()).toBe(200);
  });

  /**
   * TC-TXN-API-002
   * Verify that listing transactions for an account returns 200, at least one
   * transaction, and the first transaction passes the transaction schema.
   * We use accountIds[0] — after TC-TXN-API-001 runs there is at least one
   * debit on that account, but this test is not order-dependent: john/demo
   * always has pre-existing transactions.
   */
  test('TC-TXN-API-002: GET /accounts/:id/transactions returns 200 and schema-valid list @smoke @api', async ({
    transactionService,
    accountIds,
  }) => {
    const accountId = accountIds[0];

    const response = await transactionService.getTransactionsByAccount(accountId);

    await transactionService.assertStatus(response, 200);

    const transactions = await transactionService.json(response);

    // Shape assertion
    expect(Array.isArray(transactions)).toBe(true);
    expect(transactions.length).toBeGreaterThan(0);

    // Schema assertion — contract check before value checks
    validateSchema(transactions[0], transactionSchema);
  });

  /**
   * TC-TXN-API-003
   * Verify that filtering transactions by amount=100 returns only transactions
   * with an amount of exactly 100. The TC-TXN-API-001 transfer seeds this data,
   * but john/demo also has existing $100 transactions from the staging environment.
   */
  test('TC-TXN-API-003: GET /accounts/:id/transactions/amount/100 returns only $100 transactions @regression @api', async ({
    transactionService,
    accountIds,
    testAmount,
  }) => {
    const accountId = accountIds[0];

    const response = await transactionService.getTransactionsByAmount(accountId, testAmount);

    await transactionService.assertStatus(response, 200);

    const transactions = await transactionService.json(response);

    // Shape assertion
    expect(Array.isArray(transactions)).toBe(true);
    expect(transactions.length).toBeGreaterThan(0);

    // Value assertion — every returned transaction must match the requested amount
    // ParaBank stores amounts as positive numbers regardless of debit/credit direction
    for (const txn of transactions) {
      expect(Math.abs(txn.amount)).toBe(testAmount);
    }
  });

  /**
   * TC-TXN-API-004
   * Verify behavior when `amount` is omitted from a transfer request.
   *
   * Observed behavior: ParaBank returns 500 (Internal Server Error) when amount
   * is missing, rather than a validation-layer 400. This is a known quirk of
   * the demo application — the server throws an unhandled exception rather than
   * returning a structured error response. We assert 500 as the documented
   * actual behavior.
   */
  test('TC-TXN-API-004: POST /transfer missing amount returns error (400 or 500 depending on env) @regression @api', async ({
    transactionService,
    accountIds,
  }) => {
    const fromAccountId = accountIds[0];
    const toAccountId = accountIds[1];

    // Omit amount — pass undefined so transferRaw builds the URL without it
    const response = await transactionService.transferRaw(fromAccountId, toAccountId, undefined);

    // ParaBank does not return 200 for a transfer with no amount.
    // Local Docker: returns 500 (unhandled null-pointer).
    // Staging:      returns 400 (input validation layer).
    // Either is acceptable — the key assertion is that the transfer was not processed.
    expect(response.status()).not.toBe(200);
    expect([400, 500]).toContain(response.status());
  });

  /**
   * TC-TXN-API-005
   * Schema validation regression: validate all required transaction fields
   * (id, date, amount, type, description) across the full transaction list.
   * Catches regressions where a newly-introduced transaction type omits a field.
   */
  test('TC-TXN-API-005: transaction schema validates all required fields across full list @regression @api', async ({
    transactionService,
    accountIds,
  }) => {
    const accountId = accountIds[0];

    const response = await transactionService.getTransactionsByAccount(accountId);
    await transactionService.assertStatus(response, 200);

    const transactions = await transactionService.json(response);
    expect(transactions.length).toBeGreaterThan(0);

    // Validate every transaction — not just the first
    for (const txn of transactions) {
      validateSchema(txn, transactionSchema);
    }
  });

});
