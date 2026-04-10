import { ROUTES } from '../data/constants.js';

/**
 * LoginPage — page object for the ParaBank login page.
 *
 * Selectors are private fields to prevent tests from reaching into the DOM directly.
 * All navigation and interaction are exposed as named, intent-revealing methods.
 *
 * @example
 * const loginPage = new LoginPage(page);
 * await loginPage.navigate();
 * await loginPage.login('john', 'demo');
 */
export class LoginPage {
  // Selectors — the login form uses name="login" (no id on the form element)
  #usernameInput = 'form[name="login"] input[name="username"]';
  #passwordInput = 'form[name="login"] input[name="password"]';
  #submitButton = 'form[name="login"] input[type="submit"]';
  #errorMessage = 'p.error';

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  /** Navigate to the login page. */
  async navigate() {
    await this.page.goto(ROUTES.LOGIN);
  }

  /**
   * Fill credentials and submit the login form.
   * @param {string} username
   * @param {string} password
   */
  async login(username, password) {
    await this.page.fill(this.#usernameInput, username);
    await this.page.fill(this.#passwordInput, password);
    await this.page.click(this.#submitButton);
  }

  /**
   * Return the visible error message text after a failed login attempt.
   * @returns {Promise<string>}
   */
  async getErrorMessage() {
    const error = this.page.locator(this.#errorMessage).first();
    await error.waitFor({ state: 'visible' });
    return error.textContent();
  }
}
