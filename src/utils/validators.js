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