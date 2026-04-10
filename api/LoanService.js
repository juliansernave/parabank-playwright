import { ApiClient } from './ApiClient.js';

/**
 * LoanService — all operations against ParaBank loan endpoints.
 *
 * Endpoints covered:
 *   POST /requestLoan — apply for a new loan
 *
 * WADL-confirmed query parameters:
 *   POST /requestLoan?customerId=X&fromAccountId=Y&amount=Z&downPayment=W
 *
 * The response shape on success:
 *   { loanProviderName, loanAmount, downPayment, approved, accountId, message, responseDate }
 *
 * Usage:
 *   const loanService = new LoanService(request, apiURL);
 *   const resp = await loanService.applyForLoan(fromAccountId, 1000, 100);
 *   const data = await loanService.json(resp);
 *   // data.approved === true when downPayment >= 10% of loanAmount
 */
export class LoanService extends ApiClient {
  /**
   * @param {import('@playwright/test').APIRequestContext} request
   * @param {string} baseURL - API base URL
   */
  constructor(request, baseURL) {
    super(request, baseURL);
  }

  /**
   * Submit a loan application.
   * WADL-confirmed params: customerId, fromAccountId, amount, downPayment
   * @param {number|string} customerId - Customer applying for the loan
   * @param {number|string} fromAccountId - Account to draw the down payment from
   * @param {number} amount - Requested loan amount
   * @param {number} downPayment - Down payment amount
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async applyForLoan(customerId, fromAccountId, amount, downPayment) {
    return this.post(
      `/requestLoan?customerId=${customerId}&fromAccountId=${fromAccountId}&amount=${amount}&downPayment=${downPayment}`
    );
  }

  /**
   * Submit a loan application with only the params explicitly provided.
   * Omit a parameter by passing undefined — used for negative testing.
   * @param {number|string|undefined} customerId
   * @param {number|string|undefined} fromAccountId
   * @param {number|undefined} amount
   * @param {number|undefined} downPayment
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async applyForLoanRaw(customerId, fromAccountId, amount, downPayment) {
    const params = new URLSearchParams();
    if (customerId !== undefined) params.set('customerId', customerId);
    if (fromAccountId !== undefined) params.set('fromAccountId', fromAccountId);
    if (amount !== undefined) params.set('amount', amount);
    if (downPayment !== undefined) params.set('downPayment', downPayment);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.post(`/requestLoan${qs}`);
  }
}
