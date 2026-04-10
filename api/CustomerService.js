import { ApiClient } from './ApiClient.js';

/**
 * CustomerService — all operations against ParaBank customer endpoints.
 *
 * Endpoints covered:
 *   GET /customers/:customerId         — retrieve customer profile
 *   POST /customers/update/:customerId — update customer profile (query params, not JSON body)
 *
 * The customer object shape:
 *   { id, firstName, lastName, address: { street, city, state, zipCode }, phoneNumber, ssn }
 *
 * Usage:
 *   const customerService = new CustomerService(request, apiURL);
 *   const resp = await customerService.getCustomer(12212);
 *   const customer = await customerService.json(resp);
 *
 *   await customerService.updateCustomer(12212, { firstName: 'John', lastName: 'Smith', street: '456 Test Ave', ... });
 */
export class CustomerService extends ApiClient {
  /**
   * @param {import('@playwright/test').APIRequestContext} request
   * @param {string} baseURL - API base URL
   */
  constructor(request, baseURL) {
    super(request, baseURL);
  }

  /**
   * Retrieve a customer by ID.
   * @param {number|string} customerId
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async getCustomer(customerId) {
    return this.get(`/customers/${customerId}`);
  }

  /**
   * Update a customer's profile.
   * The body must be the full customer object — ParaBank does not support partial updates.
   * @param {number|string} customerId
   * @param {object} customerData - Full customer object to write
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  /**
   * Update a customer's profile.
   * WADL-confirmed endpoint: POST /customers/update/:customerId with query params.
   * ParaBank does NOT accept a JSON body for this endpoint.
   * @param {number|string} customerId
   * @param {object} fields - { firstName, lastName, street, city, state, zipCode, phoneNumber, ssn }
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async updateCustomer(customerId, fields) {
    // username and password are required by the /customers/update endpoint even though
    // the WADL marks them as optional — omitting them causes a 500 internal error.
    const params = new URLSearchParams({
      firstName: fields.firstName ?? '',
      lastName: fields.lastName ?? '',
      street: fields.address?.street ?? fields.street ?? '',
      city: fields.address?.city ?? fields.city ?? '',
      state: fields.address?.state ?? fields.state ?? '',
      zipCode: fields.address?.zipCode ?? fields.zipCode ?? '',
      phoneNumber: fields.phoneNumber ?? '',
      ssn: fields.ssn ?? '',
      username: fields.username ?? '',
      password: fields.password ?? '',
    });
    return this.post(`/customers/update/${customerId}?${params.toString()}`);
  }
}
