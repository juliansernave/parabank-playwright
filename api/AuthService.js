import { ApiClient } from './ApiClient.js';

/**
 * AuthService — handles all authentication operations against the ParaBank REST API.
 *
 * ParaBank uses path-based auth via GET: /login/{username}/{password}
 * The endpoint returns the customer object and sets a JSESSIONID cookie for
 * subsequent requests to authenticated endpoints.
 *
 * Usage:
 *   const auth = new AuthService(request, apiURL);
 *   const response = await auth.login('john', 'demo');
 *   const { cookie, cookieString } = await auth.getSessionCookie(response);
 */
export class AuthService extends ApiClient {
  /**
   * @param {import('@playwright/test').APIRequestContext} request
   * @param {string} baseURL - The API base URL (e.g. https://parabank.parasoft.com/parabank/services/bank)
   */
  constructor(request, baseURL) {
    super(request, baseURL);
  }

  /**
   * Log in via the ParaBank REST API.
   * ParaBank auth is path-based GET — no body or form data required.
   * @param {string} username
   * @param {string} password
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async login(username, password) {
    return this.get(`/login/${username}/${password}`);
  }

  /**
   * Extract the JSESSIONID session cookie from a login response.
   *
   * Returns both the raw cookie object (for storageState construction in UI tests)
   * and a ready-to-use cookie header string (for direct API calls).
   *
   * @param {import('@playwright/test').APIResponse} response
   * @returns {Promise<{ cookie: object, cookieString: string }>}
   */
  async getSessionCookie(response) {
    const headers = response.headersArray();
    const setCookieHeaders = headers
      .filter((h) => h.name.toLowerCase() === 'set-cookie')
      .map((h) => h.value);

    const jsessionidHeader = setCookieHeaders.find((c) =>
      c.toLowerCase().startsWith('jsessionid=')
    );

    if (!jsessionidHeader) {
      // Local Docker instance does not enforce session auth on the REST API —
      // login returns 200 but sets no cookie. Return empty strings so downstream
      // service calls proceed without a Cookie header.
      return { cookie: null, cookieString: '' };
    }

    // Extract just the value portion (before the first semicolon)
    const cookieValue = jsessionidHeader.split(';')[0];
    const value = cookieValue.split('=')[1];

    const cookie = {
      name: 'JSESSIONID',
      value,
      domain: 'parabank.parasoft.com',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    };

    return {
      cookie,
      cookieString: `JSESSIONID=${value}`,
    };
  }
}
