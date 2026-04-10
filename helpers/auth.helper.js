import { AuthService } from '../api/AuthService.js';
import { apiURL } from '../config/environments.js';

/**
 * loginViaApi — establishes an authenticated session through the REST API
 * and returns the session cookie for use in UI tests.
 *
 * Using API-based auth setup (rather than UI login) keeps UI tests fast and
 * decoupled from login page behavior. The returned cookieString can be injected
 * into browser context storageState so tests begin in an authenticated state.
 *
 * @param {import('@playwright/test').APIRequestContext} request - Playwright request context
 * @param {{ username: string, password: string }} credentials
 * @returns {Promise<{ cookie: object, cookieString: string }>}
 *
 * @example
 * const { cookieString } = await loginViaApi(request, USERS.JOHN_SMITH);
 */
export async function loginViaApi(request, credentials) {
  const authService = new AuthService(request, apiURL);
  const response = await authService.login(credentials.username, credentials.password);

  await authService.assertStatus(response, 200);

  return authService.getSessionCookie(response);
}
