import { ApiClient } from './ApiClient.js';

/**
 * AccountService — all operations against ParaBank account endpoints.
 *
 * Endpoints covered:
 *   GET /customers/:customerId/accounts   — list accounts for a customer
 *   GET /accounts/:accountId              — single account by ID
 *
 * Usage:
 *   const accounts = new AccountService(request, apiURL);
 *   const list = await accounts.getAccountsByCustomer(12212);
 *   const account = await accounts.getAccountById(list[0].id);
 */
export class AccountService extends ApiClient {
  /**
   * @param {import('@playwright/test').APIRequestContext} request
   * @param {string} baseURL - API base URL (e.g. https://parabank.parasoft.com/parabank/services/bank)
   */
  constructor(request, baseURL) {
    super(request, baseURL);
  }

  /**
   * Get all accounts belonging to a customer.
   * @param {number|string} customerId
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async getAccountsByCustomer(customerId) {
    return this.get(`/customers/${customerId}/accounts`);
  }

  /**
   * Get a single account by its ID.
   * @param {number|string} accountId
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async getAccountById(accountId) {
    return this.get(`/accounts/${accountId}`);
  }
}
