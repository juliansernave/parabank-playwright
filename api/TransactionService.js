import { ApiClient } from './ApiClient.js';

/**
 * TransactionService — all operations against ParaBank transaction endpoints.
 *
 * Endpoints covered:
 *   POST /transfer                                    — transfer funds between accounts
 *   GET  /accounts/:accountId/transactions            — all transactions for an account
 *   GET  /accounts/:accountId/transactions/amount/:amount — transactions by amount
 *
 * ParaBank transfer uses query params, not a JSON body:
 *   POST /transfer?fromAccountId=X&toAccountId=Y&amount=Z
 *
 * Usage:
 *   const txnService = new TransactionService(request, apiURL);
 *   const transferResp = await txnService.transfer(12345, 67890, 100);
 *   const txns = await txnService.getTransactionsByAccount(12345);
 */
export class TransactionService extends ApiClient {
  /**
   * @param {import('@playwright/test').APIRequestContext} request
   * @param {string} baseURL - API base URL
   */
  constructor(request, baseURL) {
    super(request, baseURL);
  }

  /**
   * Transfer funds between two accounts.
   * ParaBank expects query parameters, not a body.
   * @param {number|string} fromAccountId
   * @param {number|string} toAccountId
   * @param {number} amount
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async transfer(fromAccountId, toAccountId, amount) {
    return this.post(
      `/transfer?fromAccountId=${fromAccountId}&toAccountId=${toAccountId}&amount=${amount}`
    );
  }

  /**
   * Transfer with only some parameters — used for negative/edge case testing.
   * Pass undefined for params you want to omit.
   * @param {number|string|undefined} fromAccountId
   * @param {number|string|undefined} toAccountId
   * @param {number|undefined} amount
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async transferRaw(fromAccountId, toAccountId, amount) {
    const params = new URLSearchParams();
    if (fromAccountId !== undefined) params.set('fromAccountId', fromAccountId);
    if (toAccountId !== undefined) params.set('toAccountId', toAccountId);
    if (amount !== undefined) params.set('amount', amount);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.post(`/transfer${qs}`);
  }

  /**
   * Get all transactions for an account.
   * @param {number|string} accountId
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async getTransactionsByAccount(accountId) {
    return this.get(`/accounts/${accountId}/transactions`);
  }

  /**
   * Get transactions for an account filtered by exact amount.
   * @param {number|string} accountId
   * @param {number} amount
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async getTransactionsByAmount(accountId, amount) {
    return this.get(`/accounts/${accountId}/transactions/amount/${amount}`);
  }
}
