/**
 * Date Utilities
 *
 * Provides date formatting functions for generating unique identifiers
 * and timestamped strings.
 *
 * @module lib/date
 */

/**
 * Formats a Date object into a unique identifier string.
 *
 * This format is useful for generating deterministic, sortable IDs
 * that embed the creation timestamp. Commonly used for file naming,
 * document IDs, or any situation where a time-based unique identifier is needed.
 *
 * @param date The date to format.
 * @returns The date in `YYYYMMDDTHHmmss` format (e.g., "20240408T143052").
 *
 * @example
 * ```ts
 * denoteIdScheme(new Date("2024-04-08T14:30:52")) // "20240408T143052"
 * denoteIdScheme(new Date()) // Current timestamp like "20260408T120000"
 * ```
 *
 * @example
 * ```ts
 * // Practical usage: generate unique filenames
 * const timestamp = denoteIdScheme(new Date());
 * const filename = `document_${timestamp}.pdf`; // "document_20240408T143052.pdf"
 * ```
 */
export function denoteIdScheme(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}
