/**
 * AnkiConnect API Client
 *
 * Provides TypeScript bindings for the AnkiConnect add-on (https://ankiweb.net/shared/info/2055492152).
 * Allows external applications to interact with Anki via its REST API.
 *
 * @module anki
 */

const ANKI_CONNECT_URL = 'http://localhost:8765';

/**
 * Represents an Anki note with typed fields.
 * @template T - Union of field names for type-safe field access
 */
interface AnkiNote<T extends string> {
  noteId: number;
  fields: Record<T, { value: string; order: number }>;
}

/**
 * Standard response format from AnkiConnect API.
 */
interface AnkiConnectResponse {
  result: unknown;
  error: string | null;
}

/**
 * Configuration options for the AnkiConnect client.
 */
interface AnkiConnectOptions {
  /** Base URL of the AnkiConnect instance (default: http://localhost:8765) */
  url?: string;
  /** Request timeout in milliseconds (default: 10000) */
  timeout?: number;
}

// Default options with sensible timeouts
const defaultOptions: Required<AnkiConnectOptions> = {
  url: ANKI_CONNECT_URL,
  timeout: 10000,
};

/**
 * Makes a request to the AnkiConnect API.
 *
 * @param action - The AnkiConnect action to invoke
 * @param params - Parameters for the action
 * @param options - Client configuration options
 * @returns Promise resolving to the API response
 * @throws Error if the API returns an error or the request fails
 *
 * @example
 * ```ts
 * const result = await request("deckNames");
 * ```
 */
async function request(
  action: string,
  params: Record<string, unknown> = {},
  options: AnkiConnectOptions = {},
): Promise<AnkiConnectResponse> {
  const { url, timeout } = { ...defaultOptions, ...options };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, version: 6, params }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as AnkiConnectResponse;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`AnkiConnect request timed out after ${timeout}ms`);
      }
      throw new Error(`AnkiConnect request failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Finds all notes in a specific deck.
 *
 * @param deck - The deck name to search in
 * @param options - Client configuration options
 * @returns Promise resolving to array of note IDs
 * @throws Error if the AnkiConnect call fails
 *
 * @example
 * ```ts
 * const noteIds = await findNotesByDeck("Japanese::JLPT N5");
 * ```
 */
export async function findNotesByDeck(
  deck: string,
  options?: AnkiConnectOptions,
): Promise<number[]> {
  if (!deck.trim()) {
    throw new Error('Deck name cannot be empty');
  }

  const result = await request('findNotes', { query: `deck:${deck}` }, options);
  if (result.error) throw new Error(`AnkiConnect error: ${result.error}`);
  return result.result as number[];
}

/**
 * Retrieves detailed information about multiple notes.
 *
 * @template T - Field names for the notes
 * @param noteIds - Array of note IDs to fetch
 * @param options - Client configuration options
 * @returns Promise resolving to array of notes with their fields
 * @throws Error if the AnkiConnect call fails
 *
 * @example
 * ```ts
 * interface NoteFields {
 *   Front: string;
 *   Back: string;
 * }
 * const notes = await getNotesInfo<NoteFields>([12345, 67890]);
 * ```
 */
export async function getNotesInfo<T extends string>(
  noteIds: number[],
  options?: AnkiConnectOptions,
): Promise<AnkiNote<T>[]> {
  if (!noteIds.length) {
    return [];
  }

  const result = await request('notesInfo', { notes: noteIds }, options);
  if (result.error) throw new Error(`AnkiConnect error: ${result.error}`);

  return result.result as AnkiNote<T>[];
}

/**
 * Stores a media file in the Anki collection.
 *
 * @param filename - Name of the file (will be placed in the media folder)
 * @param data - Base64-encoded file data
 * @param options - Client configuration options
 * @returns Promise resolving to the filename as stored by Anki
 * @throws Error if the AnkiConnect call fails
 *
 * @example
 * ```ts
 * const filename = await storeMediaFile("image.png", "iVBORw0KGgo...");
 * ```
 */
async function storeMediaFile(
  filename: string,
  data: string,
  options?: AnkiConnectOptions,
): Promise<string> {
  if (!filename.trim()) {
    throw new Error('Filename cannot be empty');
  }

  const result = await request('storeMediaFile', { filename, data }, options);
  if (result.error) throw new Error(`AnkiConnect error: ${result.error}`);
  return result.result as string;
}

/**
 * Updates fields on an existing note.
 *
 * @param noteId - ID of the note to update
 * @param fields - Record of field names to new values
 * @param options - Client configuration options
 * @returns Promise that resolves when the note is updated
 * @throws Error if the AnkiConnect call fails
 *
 * @example
 * ```ts
 * await updateNoteFields(12345, {
 *   Front: "New front text",
 *   Back: "New back text",
 * });
 * ```
 */
export async function updateNoteFields(
  noteId: number,
  fields: Record<string, string>,
  options?: AnkiConnectOptions,
): Promise<void> {
  if (noteId <= 0) {
    throw new Error('Invalid note ID');
  }

  if (!fields || Object.keys(fields).length === 0) {
    throw new Error('At least one field must be provided');
  }

  const result = await request(
    'updateNoteFields',
    {
      note: {
        id: noteId,
        fields,
      },
    },
    options,
  );
  if (result.error) throw new Error(`AnkiConnect error: ${result.error}`);
}

/**
 * Checks if AnkiConnect is available and responsive.
 *
 * @param options - Client configuration options
 * @returns Promise resolving to true if connected, false otherwise
 *
 * @example
 * ```ts
 * const isReady = await isAnkiConnectReady();
 * if (!isReady) console.log("Anki is not running");
 * ```
 */
async function isAnkiConnectReady(
  options?: AnkiConnectOptions,
): Promise<boolean> {
  try {
    const result = await request('version', {}, options);
    // version returns a number, error will be null if successful
    return result.error === null && typeof result.result === 'number';
  } catch {
    return false;
  }
}

/**
 * Gets the version of AnkiConnect API.
 *
 * @param options - Client configuration options
 * @returns Promise resolving to the API version number
 * @throws Error if the AnkiConnect call fails
 *
 * @example
 * ```ts
 * const version = await getVersion();
 * console.log(`AnkiConnect version: ${version}`);
 * ```
 */
async function getVersion(
  options?: AnkiConnectOptions,
): Promise<number> {
  const result = await request('version', {}, options);
  if (result.error) throw new Error(`AnkiConnect error: ${result.error}`);
  return result.result as number;
}
