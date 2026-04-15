import { EdgeTTS } from '@andresaya/edge-tts';

const VOICE = 'en-US-AndrewNeural';

/**
 * Generates base64-encoded audio from text using Edge TTS.
 *
 * @param text - The text to convert to speech
 * @param voice - The voice to use (default: en-US-AndrewNeural)
 * @returns Promise resolving to base64-encoded audio data
 */
export async function generateAudio(
  text: string,
  voice: string = VOICE,
): Promise<string> {
  const tts = new EdgeTTS();

  await tts.synthesize(text, voice);

  return tts.toBase64();
}

