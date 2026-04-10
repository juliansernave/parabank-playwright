/**
 * ErrorMessage — component object for ParaBank inline validation errors and
 * error panels.
 *
 * ParaBank surfaces two categories of errors:
 *   1. Field-level validation: `span.error` elements adjacent to individual inputs
 *   2. Page-level errors: `#validationErrors` (a <ul> of error messages) and
 *      `p.error` for general error paragraphs.
 *
 * Locator rationale:
 *   - span.error is used for field-level messages (e.g., "Please enter a valid name").
 *   - #validationErrors is used for the bill-pay and loan forms which render a
 *     summary list of all validation failures.
 *   - p.error is used for page-level messages (e.g., "Error: Internal Error").
 *   - All locators use page.locator() with CSS because ParaBank's error elements
 *     have no ARIA roles or visible labels that would make semantic selectors reliable.
 *
 * This component is composed into page objects that render error states.
 *
 * @example
 * this.errors = new ErrorMessage(page);
 * // In test:
 * await expect(page.errors.validationList).toBeVisible();
 * await expect(page.errors.fieldError('payname')).toBeVisible();
 */
export class ErrorMessage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    // Page-level error panel (bill-pay and loan forms render errors here)
    this.validationList = page.locator('#validationErrors');

    // General paragraph error (login failures, server errors)
    this.errorParagraph = page.locator('p.error').first();
  }

  /**
   * Return the locator for a field-level span.error adjacent to a named input.
   * ParaBank renders span.error as a sibling of each invalid input field.
   *
   * @param {string} inputName - The `name` attribute of the input field
   * @returns {import('@playwright/test').Locator}
   */
  fieldError(inputName) {
    // Target the span.error that follows an input with the given name attribute.
    // CSS sibling combinator works reliably here since span.error immediately
    // follows the invalid input in the DOM.
    return this.page.locator(`[id="input_error_${inputName}"]`);
  }

  /**
   * Return the text of all validation error list items.
   * @returns {Promise<string[]>}
   */
  async getValidationMessages() {
    const items = this.validationList.locator('li');
    const count = await items.count();
    const messages = [];
    for (let i = 0; i < count; i++) {
      const text = await items.nth(i).textContent();
      messages.push(text?.trim() ?? '');
    }
    return messages;
  }

  /**
   * Return the text of the general paragraph error.
   * @returns {Promise<string>}
   */
  async getErrorText() {
    return (await this.errorParagraph.textContent())?.trim() ?? '';
  }
}
