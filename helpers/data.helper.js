/**
 * data.helper.js — random value generators for test data.
 *
 * All functions return plain values — no API calls, no side effects.
 * Use these to produce unique, deterministic-enough strings and numbers
 * so tests don't collide on shared state when running in parallel.
 *
 * Strategy for uniqueness: Date.now() + a counter suffix.
 * This is lightweight and reliable for test isolation without a UUID library.
 */

let counter = 0;

/**
 * Increment and return an ever-increasing counter.
 * @returns {number}
 */
function nextId() {
  return ++counter;
}

/**
 * Generate a random first name from a small stable list.
 * Using a fixed list avoids unicode/special-character issues with APIs.
 * @returns {string}
 */
export function randomFirstName() {
  const names = ['Alice', 'Bob', 'Carol', 'David', 'Eve', 'Frank', 'Grace', 'Henry'];
  return names[Math.floor(Math.random() * names.length)];
}

/**
 * Generate a random last name from a small stable list.
 * @returns {string}
 */
export function randomLastName() {
  const names = ['Smith', 'Jones', 'Taylor', 'Brown', 'Wilson', 'Davis', 'Moore', 'Clark'];
  return names[Math.floor(Math.random() * names.length)];
}

/**
 * Generate a unique username safe for ParaBank registration.
 * Format: test_<timestamp>_<counter>
 * @returns {string}
 */
export function randomUsername() {
  return `test_${Date.now()}_${nextId()}`;
}

/**
 * Generate a random US street address.
 * @returns {string}
 */
export function randomStreet() {
  const num = Math.floor(Math.random() * 9000) + 1000;
  const streets = ['Main St', 'Oak Ave', 'Elm Blvd', 'Park Rd', 'Lake Dr', 'Hill Ln'];
  return `${num} ${streets[Math.floor(Math.random() * streets.length)]}`;
}

/**
 * Generate a random city name from a small fixed list.
 * @returns {string}
 */
export function randomCity() {
  const cities = ['Springfield', 'Shelbyville', 'Riverside', 'Madison', 'Portland'];
  return cities[Math.floor(Math.random() * cities.length)];
}

/**
 * Generate a random US state abbreviation.
 * @returns {string}
 */
export function randomState() {
  const states = ['CA', 'NY', 'TX', 'FL', 'WA', 'OR', 'CO', 'IL'];
  return states[Math.floor(Math.random() * states.length)];
}

/**
 * Generate a random 5-digit US ZIP code as a string.
 * @returns {string}
 */
export function randomZip() {
  return String(Math.floor(Math.random() * 90000) + 10000);
}

/**
 * Generate a random US-format phone number.
 * Format: 555-NXX-XXXX (555 prefix avoids real numbers)
 * @returns {string}
 */
export function randomPhone() {
  const mid = String(Math.floor(Math.random() * 900) + 100);
  const end = String(Math.floor(Math.random() * 9000) + 1000);
  return `555-${mid}-${end}`;
}

/**
 * Generate a random SSN-format string.
 * Uses 999-XX-XXXX prefix which is not assigned to real people.
 * @returns {string}
 */
export function randomSsn() {
  const mid = String(Math.floor(Math.random() * 90) + 10);
  const end = String(Math.floor(Math.random() * 9000) + 1000);
  return `999-${mid}-${end}`;
}

/**
 * Generate a random dollar amount between min and max (inclusive), rounded to 2 decimal places.
 * @param {number} [min=10] - Minimum amount
 * @param {number} [max=500] - Maximum amount
 * @returns {number}
 */
export function randomAmount(min = 10, max = 500) {
  const raw = Math.random() * (max - min) + min;
  return Math.round(raw * 100) / 100;
}

/**
 * Generate a full address object compatible with ParaBank's customer update API.
 * @param {object} [overrides] - Fields to override
 * @returns {{ street: string, city: string, state: string, zipCode: string }}
 */
export function randomAddress(overrides = {}) {
  return {
    street: randomStreet(),
    city: randomCity(),
    state: randomState(),
    zipCode: randomZip(),
    ...overrides,
  };
}
