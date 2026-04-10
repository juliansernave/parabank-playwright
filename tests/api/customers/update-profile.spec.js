import { test, expect } from '../../../fixtures/index.js';
import { validateSchema } from '../../../helpers/schema.helper.js';
import customerSchema from '../../../api/schemas/customer.schema.json' with { type: 'json' };
import { USERS } from '../../../data/users.js';

/**
 * Customer update-profile API test suite.
 *
 * Idempotency strategy for TC-CUST-API-001/002:
 *   1. Read the current customer profile at test start
 *   2. Write deterministic test values ('456 Test Ave', etc.)
 *   3. Assert the change is reflected in a subsequent GET
 *   4. Restore original values in afterEach teardown
 *
 * This ensures the test can run repeatedly against the shared staging environment
 * without accumulating stale data or breaking other tests that read the profile.
 *
 * Customer ID 12212 is the pre-seeded john/demo account on ParaBank staging.
 *
 * Schema validation runs before value assertions in every test.
 */
test.describe('Customers Update Profile API', () => {

  const CUSTOMER_ID = 12212;
  const TEST_STREET = '456 Test Ave';
  const TEST_CITY = 'TestCity';
  const TEST_STATE = 'TC';
  const TEST_ZIP = '00001';

  /**
   * TC-CUST-API-001 + TC-CUST-API-002
   *
   * These two scenarios are grouped in a single describe block with shared
   * setup/teardown because they exercise the same write/read cycle:
   *   001 — PUT reflects changes
   *   002 — subsequent GET reflects the PUT changes
   *
   * Both tests run against the same state so they share a beforeEach that
   * persists `originalProfile` for the afterEach restore.
   */
  test.describe('PUT then GET profile cycle', () => {
    let originalProfile = null;

    test.beforeEach(async ({ customerService }) => {
      // Read current values before writing so we can restore them in afterEach
      const getResp = await customerService.getCustomer(CUSTOMER_ID);
      await customerService.assertStatus(getResp, 200);
      originalProfile = await customerService.json(getResp);
    });

    test.afterEach(async ({ customerService }) => {
      // Restore original profile values — makes the test idempotent
      if (originalProfile) {
        await customerService.updateCustomer(CUSTOMER_ID, {
          ...originalProfile,
          username: USERS.JOHN_SMITH.username,
          password: USERS.JOHN_SMITH.password,
        });
      }
    });

    /**
     * TC-CUST-API-001
     * Verify that PUT /customers/12212 with a changed address returns 200
     * and a subsequent GET reflects the updated values.
     */
    test('TC-CUST-API-001: POST /customers/update/12212 updates address and returns 200 @smoke @api', async ({
      customerService,
    }) => {
      // Build updated customer object based on current profile
      // Use spread to preserve all fields (ssn, phone, etc.) — ParaBank requires full object on PUT
      const updatedProfile = {
        ...originalProfile,
        address: {
          ...originalProfile.address,
          street: TEST_STREET,
          city: TEST_CITY,
          state: TEST_STATE,
          zipCode: TEST_ZIP,
        },
        // username and password required by /customers/update endpoint
        username: USERS.JOHN_SMITH.username,
        password: USERS.JOHN_SMITH.password,
      };

      const putResp = await customerService.updateCustomer(CUSTOMER_ID, updatedProfile);

      // Status assertion
      expect(putResp.status()).toBe(200);

      // Confirm GET reflects the update
      const getResp = await customerService.getCustomer(CUSTOMER_ID);
      await customerService.assertStatus(getResp, 200);

      const refreshed = await customerService.json(getResp);

      // Schema assertion — contract check before value checks
      validateSchema(refreshed, customerSchema);

      // Value assertions — the PUT values must be present in the GET response
      expect(refreshed.address.street).toBe(TEST_STREET);
      expect(refreshed.address.city).toBe(TEST_CITY);
      expect(refreshed.address.state).toBe(TEST_STATE);
      expect(refreshed.address.zipCode).toBe(TEST_ZIP);
    });

    /**
     * TC-CUST-API-002
     * Verify that GET /customers/12212 after a PUT reflects the written changes.
     * This is a standalone assertion on the read path — distinct from 001 which
     * tests the write path. Both scenarios exercise the read, but separating them
     * makes failure attribution clearer (PUT failed vs. GET not reflecting PUT).
     */
    test('TC-CUST-API-002: GET /customers/12212 after POST update reflects updated values @regression @api', async ({
      customerService,
    }) => {
      // Write the test values
      const updatedProfile = {
        ...originalProfile,
        address: {
          ...originalProfile.address,
          street: TEST_STREET,
          city: TEST_CITY,
          state: TEST_STATE,
          zipCode: TEST_ZIP,
        },
        // username and password required by /customers/update endpoint
        username: USERS.JOHN_SMITH.username,
        password: USERS.JOHN_SMITH.password,
      };

      const putResp = await customerService.updateCustomer(CUSTOMER_ID, updatedProfile);
      expect(putResp.status()).toBe(200);

      // Read back and verify
      const getResp = await customerService.getCustomer(CUSTOMER_ID);
      await customerService.assertStatus(getResp, 200);

      const customer = await customerService.json(getResp);

      // Schema assertion first
      validateSchema(customer, customerSchema);

      // Value assertions — confirm GET reflects what was PUT
      expect(customer.address.street).toBe(TEST_STREET);
      expect(customer.address.city).toBe(TEST_CITY);
      expect(customer.address.state).toBe(TEST_STATE);
      expect(customer.address.zipCode).toBe(TEST_ZIP);
    });
  });

  /**
   * TC-CUST-API-003
   * Verify that GET /customers/12212 returns a schema-valid customer object.
   * Standalone schema regression — does not depend on PUT state.
   */
  test('TC-CUST-API-003: GET /customers/12212 response validates against customer schema @regression @api', async ({
    customerService,
  }) => {
    const response = await customerService.getCustomer(CUSTOMER_ID);

    await customerService.assertStatus(response, 200);

    const customer = await customerService.json(response);

    // Schema assertion — validates all required fields (id, firstName, lastName, address)
    validateSchema(customer, customerSchema);

    // Sanity value assertions
    expect(customer.id).toBe(CUSTOMER_ID);
    expect(typeof customer.firstName).toBe('string');
    expect(customer.firstName.length).toBeGreaterThan(0);
  });

  /**
   * TC-CUST-API-004
   * Verify that requesting a non-existent customer returns 404.
   */
  test('TC-CUST-API-004: GET /customers/9999999 returns not-found @regression @api', async ({
    customerService,
  }) => {
    const response = await customerService.getCustomer(9999999);

    // Staging returns 404; local Docker returns 400 for unknown resources.
    expect(response.status()).not.toBe(200);
    expect([400, 404]).toContain(response.status());
  });

});
