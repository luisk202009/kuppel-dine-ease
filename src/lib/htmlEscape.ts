/**
 * HTML escape utility to prevent XSS attacks
 * Use this for all user-controlled data inserted into HTML strings
 */

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param unsafe - User-controlled string that may contain HTML special characters
 * @returns Safe string with HTML entities escaped
 */
export const escapeHtml = (unsafe: string | null | undefined): string => {
  if (unsafe == null) return '';
  if (typeof unsafe !== 'string') return String(unsafe);
  
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Escapes HTML for optional fields - returns empty string if null/undefined
 * @param value - Optional value to escape
 * @param prefix - Optional prefix to add before the value (e.g., "Tel: ")
 * @param suffix - Optional suffix to add after the value
 * @returns Escaped string with optional prefix/suffix, or empty string
 */
export const escapeOptional = (
  value: string | null | undefined,
  prefix: string = '',
  suffix: string = ''
): string => {
  if (!value) return '';
  return `${prefix}${escapeHtml(value)}${suffix}`;
};
