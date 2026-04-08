import * as fs from 'fs';
import * as path from 'path';

// --- Helper Functions ---

/**
 * Trim whitespace from both ends of a string.
 * @param payload The string to trim.
 * @returns The trimmed string, or an empty string if the input is null/undefined.
 */
function trim(payload?: string | null): string {
  if (payload == null) {
    return '';
  }
  return payload.trim();
}

/**
 * Check whether a value is null, undefined, empty, or only whitespace.
 * @param payload The string to check.
 * @returns True if the string is empty or whitespace-only, otherwise false.
 */
function isEmpty(payload?: string | null): boolean {
  if (payload == null) {
    return true;
  }
  // If there is any non-space character, then it's not blank
  return !/\S/.test(payload);
}

/**
 * Capitalize the first character of a trimmed string.
 * @param payload The string to capitalize.
 * @returns The capitalized string, or an empty string if the input is empty.
 */
export function capitalize(payload: string | null | undefined): string {
  const trimmedPayload = trim(payload);
  if (isEmpty(trimmedPayload)) {
    return '';
  }
  return trimmedPayload.charAt(0).toUpperCase() + trimmedPayload.slice(1);
}

// --- Main Function ---

type TitleCaseStyle = 'new_york_times' | 'default';

/**
 * Change the case of the payload into Title Case using the selected style.
 * This implementation mirrors the logic of the provided Lua code.
 *
 * NOTE: This function is synchronous and uses `fs.readFileSync`, making it suitable
 * for Node.js environments. For browser or async environments, the file reading
 * part would need to be refactored to be asynchronous.
 *
 * @param payload The string to convert to title case.
 * @param style The title case style to apply ('new_york_times' or 'default').
 * @returns The title-cased string.
 */
export function titleCase(
  payload: string | null | undefined,
  style: TitleCaseStyle = 'new_york_times',
): string {
  let processedPayload = trim(payload);
  if (isEmpty(processedPayload)) {
    return '';
  }

  // Change special characters by standard ones
  processedPayload = processedPayload
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"');

  const STYLES: Record<string, Record<string, string>> = {
    new_york_times: {
      and: 'and',
      for: 'for',
      if: 'if',
      in: 'in',
      or: 'or',
      'v.': 'v.',
      'vs.': 'vs.',
      a: 'a',
      an: 'an',
      as: 'as',
      at: 'at',
      but: 'but',
      by: 'by',
      en: 'en',
      nor: 'nor',
      of: 'of',
      on: 'on',
      the: 'the',
      to: 'to',
      via: 'via',
    },
  };

  let specialWords: Record<string, string> = {};
  try {
    // Attempt to read a special_words.json from the current working directory
    const filePath = path.join(process.cwd(), 'special_words.json');
    const fileData = fs.readFileSync(filePath, 'utf-8');
    const fileWords = JSON.parse(fileData) as Record<string, string>;
    // Merge with default empty object
    specialWords = { ...specialWords, ...fileWords };
  } catch (error) {
    // If file doesn't exist or can't be parsed, we just continue with an empty object
    // This mirrors the Lua code's resilience.
    // console.error(
    //   "Could not read or parse special_words.json. Proceeding without it.",
    // );
  }

  const selectedStyle = STYLES[style]!;
  const words = processedPayload.toLowerCase().split(/\s+/);

  const result = words.map((word, index) => {
    const leading = word.match(/^(\W+)/)?.[1] || '';
    const rest = word.slice(leading.length);
    const punctuation = rest.match(/[!?.%,]+$/)?.[1] || '';
    const core = punctuation ? rest.slice(0, -punctuation.length) : rest;

    if (!core) {
      return word; // It's just punctuation
    }

    let formatted: string;
    if (specialWords[core]) {
      formatted = specialWords[core];
    } else if (core === 'in' && words[index + 1] === 'progress') {
      formatted = capitalize(core);
    } else if (index === 0 || index === words.length - 1) {
      // Capitalize the first and last words
      formatted = capitalize(core);
    } else if (selectedStyle[core]) {
      // Use the style guide for minor words
      formatted = selectedStyle[core];
    } else {
      // Default to capitalizing
      formatted = capitalize(core);
    }

    // Re-attach punctuation and leading characters
    return `${leading}${formatted}${punctuation}`;
  });

  return result.join(' ');
}
