// Small form checks used by the auth pages.

/** True when the text is empty or only spaces. */
export function isBlank(text) {
  return !text || text.trim().length === 0;
}

/**
 * Bangladesh mobile number, e.g. 01712345678 (also accepts +8801712345678).
 * @param {string} text
 */
export function isValidPhone(text) {
  const cleaned = (text || '').replace(/[\s-]/g, '');
  return /^(\+?88)?01[3-9]\d{8}$/.test(cleaned);
}

/**
 * Check a new password and its confirmation before sending. The server has its own (admin set) rules for
 * length and characters and explains them in its answer, so only the obvious mistakes are caught here.
 * @param {string} password
 * @param {string} confirmation
 * @returns {string|null} A message for the customer, or null when it is fine to send
 */
export function validateNewPassword(password, confirmation) {
  if (isBlank(password)) {
    return 'Enter a new password';
  }
  if (password !== confirmation) {
    return 'The two passwords do not match';
  }
  return null;
}
