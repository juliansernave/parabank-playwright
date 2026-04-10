import { test, expect } from '../../../fixtures/index.js';

/**
 * Customers API — validates the customer data endpoint.
 *
 * Customer ID 12212 is the pre-seeded account for john/demo in the public
 * ParaBank staging environment.
 *
 * Note: ParaBank's public staging instance does not enforce session auth on
 * read-only GET endpoints. The login call here validates the auth service
 * itself and demonstrates the auth flow; the customers call validates the
 * data contract.
 */
test.describe('Customers API', () => {
  test('GET /customers/:id returns 200 with customer data @smoke @api', async ({ authService }) => {
    // Validate the login endpoint returns 200 and correct customer data
    const loginResponse = await authService.login('john', 'demo');
    await authService.assertStatus(loginResponse, 200);

    const loggedInCustomer = await authService.json(loginResponse);
    expect(loggedInCustomer).toHaveProperty('id', 12212);

    // Validate the customers endpoint independently
    const customerResponse = await authService.get('/customers/12212');
    await authService.assertStatus(customerResponse, 200);

    const customer = await authService.json(customerResponse);
    expect(customer).toHaveProperty('id', 12212);
    expect(customer).toHaveProperty('firstName');
    expect(customer).toHaveProperty('lastName');
  });
});
