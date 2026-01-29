/**
 * Capitalize the first letter of every word. Supports Unicode/diacritics (ă, ș, ț, î, â).
 * Safe for null/undefined.
 * @param {string} str - Raw string (e.g. from API: "locuri de munca", "AUTO & transport")
 * @returns {string} Title case string (e.g. "Locuri De Munca", "Auto & Transport")
 */
export function capitalizeWords(str) {
  if (str == null || str === '') return '';
  const s = String(str).toLowerCase().trim();
  if (!s) return '';
  return s
    .split(/\s+/)
    .map((word) => {
      if (!word) return '';
      const first = word.charAt(0);
      const rest = word.slice(1);
      return first.toUpperCase() + rest;
    })
    .join(' ');
}
