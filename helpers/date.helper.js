/**
 * date.helper.js — date formatting utilities for ParaBank API and UI tests.
 *
 * ParaBank's transaction search endpoints and date display use MM-DD-YYYY format.
 * These helpers centralize that formatting so tests never construct date strings inline.
 */

/**
 * Format a Date object as MM-DD-YYYY.
 * This is the format ParaBank uses for transaction date filter parameters.
 *
 * @param {Date} date
 * @returns {string} e.g. "04-08-2026"
 *
 * @example
 * formatDate(new Date()) // "04-08-2026"
 */
export function formatDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}-${day}-${year}`;
}

/**
 * Format today's date as MM-DD-YYYY.
 * Convenience wrapper around formatDate(new Date()).
 * @returns {string}
 */
export function today() {
  return formatDate(new Date());
}

/**
 * Return a date N days in the past formatted as MM-DD-YYYY.
 * Useful for constructing date-range filters in transaction search tests.
 *
 * @param {number} daysAgo - Number of days before today
 * @returns {string}
 *
 * @example
 * daysAgo(30) // "03-09-2026" (if today is 04-08-2026)
 */
export function daysAgo(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return formatDate(d);
}

/**
 * Parse a Unix epoch timestamp (milliseconds) to a formatted date string MM-DD-YYYY.
 * ParaBank transaction objects carry `date` as epoch millis.
 *
 * @param {number} epochMs - Unix timestamp in milliseconds
 * @returns {string}
 */
export function formatEpoch(epochMs) {
  return formatDate(new Date(epochMs));
}
