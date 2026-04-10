import { test, expect } from '../../../fixtures/index.js';
import { validateSchema } from '../../../helpers/schema.helper.js';
import accountSchema from '../../../api/schemas/account.schema.json' with { type: 'json' };

/**
 * Accounts API test suite.
 *
 * Customer 12212 is the pre-seeded john/demo account on the ParaBank staging environment.
 * Account IDs are retrieved at runtime via the `accountIds` fixture so tests remain valid
 * if the staging environment is ever reset and account numbers change.
 *
 * Schema validation runs before value assertions in every test — a schema failure
 * (broken contract) is a different class of failure than a wrong value.
 */
test.describe('Accounts API', () => {

  /**
   * TC-ACCT-API-001
   * Verify that listing all accounts for a known customer returns at least one
   * account and every item in the list matches the account schema.
   */
  test('TC-ACCT-API-001: GET /customers/12212/accounts returns 200 and schema-valid list @smoke @api', async ({
    accountService,
    authenticatedUser,
  }) => {
    const response = await accountService.getAccountsByCustomer(authenticatedUser.customerId);

    // Status assertion
    await accountService.assertStatus(response, 200);

    const accounts = await accountService.json(response);

    // Shape assertion — list must be a non-empty array
    expect(Array.isArray(accounts)).toBe(true);
    expect(accounts.length).toBeGreaterThan(0);

    // Schema assertion — validate the first item before any value checks
    // Validates the contract is intact (required fields present, correct types)
    validateSchema(accounts[0], accountSchema);
  });

  /**
   * TC-ACCT-API-002
   * Verify that fetching a single account by its ID returns 200, passes schema,
   * and the returned id and customerId match what was requested.
   */
  test('TC-ACCT-API-002: GET /accounts/:id returns 200 and schema-valid account @smoke @api', async ({
    accountService,
    authenticatedUser,
    accountIds,
  }) => {
    const targetAccountId = accountIds[0];

    const response = await accountService.getAccountById(targetAccountId);

    // Status assertion
    await accountService.assertStatus(response, 200);

    const account = await accountService.json(response);

    // Schema assertion — validate contract before checking specific values
    validateSchema(account, accountSchema);

    // Value assertions
    expect(account.id).toBe(targetAccountId);
    expect(account.customerId).toBe(authenticatedUser.customerId);
  });

  /**
   * TC-ACCT-API-003
   * Verify that requesting a non-existent account ID returns 404.
   * 9999999 is safely outside the range of ParaBank demo account IDs.
   */
  test('TC-ACCT-API-003: GET /accounts/9999999 returns not-found @regression @api', async ({
    accountService,
  }) => {
    const response = await accountService.getAccountById(9999999);

    // Staging returns 404; local Docker returns 400 for unknown resources.
    // Both signal "not found" — assert neither is a 200 success.
    expect(response.status()).not.toBe(200);
    expect([400, 404]).toContain(response.status());
  });

  /**
   * TC-ACCT-API-004
   * Schema validation regression: every account in the full customer account list
   * must pass the account schema. Catches contract regressions that affect only
   * certain account types (e.g., a new LOAN account type missing a field).
   */
  test('TC-ACCT-API-004: every account in list passes full schema validation @regression @api', async ({
    accountService,
    authenticatedUser,
  }) => {
    const response = await accountService.getAccountsByCustomer(authenticatedUser.customerId);
    await accountService.assertStatus(response, 200);

    const accounts = await accountService.json(response);
    expect(accounts.length).toBeGreaterThan(0);

    // Validate every item — not just the first — so a schema break on a
    // specific account type does not hide behind a passing first item
    for (const account of accounts) {
      validateSchema(account, accountSchema);
    }
  });

});
