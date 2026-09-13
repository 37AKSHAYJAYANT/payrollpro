/**
 * Shared formatting and localization utilities for PayrollPro SaaS.
 */

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Format numeric value as Indian Rupees (INR).
 * Example: 15420.5 -> "₹15,420.50"
 *
 * @param {number|string} amount
 * @param {number} fractionDigits
 * @returns {string}
 */
export function formatCurrency(amount, fractionDigits = 2) {
  const num = Number(amount);
  if (isNaN(num)) return '₹0.00';
  return `₹${num.toLocaleString('en-IN', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  })}`;
}

/**
 * Format ISO date string to DD-MMM-YYYY.
 * Example: "2026-03-31" -> "31 Mar 2026"
 *
 * @param {string|Date} dateVal
 * @returns {string}
 */
export function formatDate(dateVal) {
  if (!dateVal) return '-';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return String(dateVal);
  }
}

/**
 * Safely retrieve the JWT token from localStorage.
 *
 * @returns {string|null}
 */
export function getAuthToken() {
  try {
    const stored = localStorage.getItem('payrollpro_auth');
    if (!stored) return null;
    return JSON.parse(stored).token || null;
  } catch {
    return null;
  }
}
