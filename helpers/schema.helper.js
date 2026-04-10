/**
 * schema.helper.js — AJV wrapper for JSON Schema validation in API tests.
 *
 * AJV v8 ships as CommonJS only. This project uses ESM ("type": "module"),
 * so we import AJV via createRequire — the standard pattern for consuming
 * CJS packages from an ESM context without a bundler.
 *
 * Usage:
 *   import { validateSchema } from '../helpers/schema.helper.js';
 *   import accountSchema from '../api/schemas/account.schema.json' assert { type: 'json' };
 *
 *   const body = await response.json();
 *   validateSchema(body, accountSchema); // throws if invalid
 */

import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const AjvModule = require('ajv');

// AJV v8 CJS exports the class on `.default` when imported via require in an ESM wrapper
const Ajv = AjvModule.default ?? AjvModule;

const ajv = new Ajv({ allErrors: true, strict: false });

/**
 * Validate a response body against a JSON Schema.
 *
 * Throws a descriptive error when validation fails so the Playwright test
 * output pinpoints exactly which field failed the contract, not just "schema
 * invalid". Schema failures are surfaced before value assertions — a renamed
 * field breaking the contract is a different failure class than a wrong value.
 *
 * @param {object|Array} data - The parsed response body to validate
 * @param {object} schema - A JSON Schema draft-07 object (imported from api/schemas/)
 * @throws {Error} If validation fails — message lists all AJV errors
 *
 * @example
 * import accountSchema from '../api/schemas/account.schema.json' assert { type: 'json' };
 * validateSchema(account, accountSchema);
 */
export function validateSchema(data, schema) {
  const validate = ajv.compile(schema);
  const valid = validate(data);

  if (!valid) {
    const errorMessages = validate.errors
      .map((err) => {
        const field = err.instancePath || '(root)';
        return `  ${field} ${err.message}`;
      })
      .join('\n');

    throw new Error(
      `Schema validation failed:\n${errorMessages}\n\nReceived data:\n${JSON.stringify(data, null, 2)}`
    );
  }
}
