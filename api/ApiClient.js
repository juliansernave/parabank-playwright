/**
 * ApiClient — thin wrapper around Playwright's APIRequestContext.
 *
 * Responsibilities:
 *   - Centralize request defaults (Accept header, base URL composition)
 *   - Provide assertion helpers so individual service classes stay focused on domain logic
 *
 * Usage:
 *   const client = new ApiClient(request, apiURL);
 *   const response = await client.get('/customers/12212');
 *   await client.assertStatus(response, 200);
 *   const data = await client.json(response);
 */
export class ApiClient {
  #request;
  #baseURL;

  constructor(request, baseURL) {
    this.#request = request;
    this.#baseURL = baseURL;
  }

  /**
   * HTTP GET
   * @param {string} path - Path relative to baseURL
   * @param {object} [options] - Additional Playwright fetch options
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async get(path, options = {}) {
    return this.#request.get(`${this.#baseURL}${path}`, {
      headers: {
        Accept: 'application/json',
        ...options.headers,
      },
      ...options,
    });
  }

  /**
   * HTTP POST
   * @param {string} path - Path relative to baseURL
   * @param {object} [body] - JSON body (will be serialized)
   * @param {object} [options] - Additional Playwright fetch options
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async post(path, body = {}, options = {}) {
    return this.#request.post(`${this.#baseURL}${path}`, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
      data: body,
      ...options,
    });
  }

  /**
   * HTTP PUT
   * @param {string} path - Path relative to baseURL
   * @param {object} [body] - JSON body (will be serialized)
   * @param {object} [options] - Additional Playwright fetch options
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async put(path, body = {}, options = {}) {
    return this.#request.put(`${this.#baseURL}${path}`, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
      data: body,
      ...options,
    });
  }

  /**
   * Assert that a response has the expected HTTP status code.
   * Throws with a descriptive message on mismatch so failures are immediately readable.
   * @param {import('@playwright/test').APIResponse} response
   * @param {number} expectedStatus
   */
  async assertStatus(response, expectedStatus) {
    if (response.status() !== expectedStatus) {
      const body = await response.text();
      throw new Error(
        `Expected status ${expectedStatus} but got ${response.status()}.\nURL: ${response.url()}\nBody: ${body}`
      );
    }
  }

  /**
   * Parse response body as JSON.
   * @param {import('@playwright/test').APIResponse} response
   * @returns {Promise<object>}
   */
  async json(response) {
    return response.json();
  }
}
