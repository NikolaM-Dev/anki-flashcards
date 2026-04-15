import { v7 as uuidv7 } from 'uuid';

import {
  findNotesByDeck,
  getNotesInfo,
  storeMediaFile,
  updateNoteFields,
} from '../shared/anki';
import type { OllamaResponse } from '../shared/types';
import { titleCase, capitalize } from '../lib/string';
import { generateAudio } from '../lib/tts';

export const VOCABULARY_DECK = 'english::vocabulary';

type VocabJsonResponse = {
  word: string;
  partOfSpeech: string;
  definition: string;
  examples: Array<string>;
  synonyms: Array<string>;
  antonyms: Array<string>;
  relatedPhrases: Array<string>;
  notes: string;
};

type VocabularyDeckFieldKey =
  | 'context'
  | 'contextAudio'
  | 'definition'
  | 'id'
  | 'sentence'
  | 'sentenceAudio';

async function main() {
  console.log('🔍 Finding notes in deck:', VOCABULARY_DECK);
  const noteIds = await findNotesByDeck(VOCABULARY_DECK);

  if (noteIds.length === 0) {
    console.log('No notes found in deck:', VOCABULARY_DECK);

    return;
  }

  console.log(`📝 Found ${noteIds.length} notes`);

  const notesInfo = await getNotesInfo<VocabularyDeckFieldKey>(noteIds);
  for (const note of notesInfo) {
    if (note.fields.id.value !== '') {
      console.log(`  ✅ Note ${note.fields.id.value} already updated`);

      continue;
    }

    const nextFields: Record<VocabularyDeckFieldKey, string> = {
      context: titleCase(note.fields.context.value).replace(/&nbsp;/g, ' '),
      contextAudio: note.fields.contextAudio.value || '',
      definition: note.fields.definition.value || '',
      id: note.fields.id.value || uuidv7(),
      sentence: titleCase(note.fields.sentence.value).replace(/&nbsp;/g, ' '),
      sentenceAudio: note.fields.sentenceAudio.value || '',
    };

    if (note.fields.context.value === '' || note.fields.sentence.value === '') {
      console.error(
        `❌ Error processing note ${note.noteId}:`,
        'Context and Sentence are not defined',
      );
    }

    if (note.fields.definition.value === '') {
      nextFields.definition = await getDefinition(
        note.fields.sentence.value,
        note.fields.context.value,
      );
    } else {
      nextFields.definition = note.fields.definition.value;
    }

    if (nextFields.sentenceAudio === '') {
      const audioFilename = `${nextFields.id}_sentence.mp3`;

      console.log(
        `  🎵 Generating audio for note ${nextFields.id}: "${nextFields.sentence.substring(0, 50)}..."`,
      );

      try {
        // Generate audio (base64)
        const base64Audio = await generateAudio(nextFields.sentence);

        // Store audio file in Anki
        console.log(`  💾 Storing audio file: ${audioFilename}`);
        await storeMediaFile(audioFilename, base64Audio);

        // Update audio field with Anki audio tag
        nextFields.sentenceAudio = `[sound:${audioFilename}]`;

        console.log(
          `  ✅ Audio generated and stored for note ${nextFields.id}`,
        );
      } catch (error) {
        console.error(
          `  ❌ Error generating audio for note ${nextFields.id}:`,
          error,
        );
      }
    }

    if (nextFields.contextAudio === '') {
      const audioFilename = `${nextFields.id}_context.mp3`;

      console.log(
        `  🎵 Generating audio for note ${nextFields.id}: "${nextFields.context.substring(0, 50)}..."`,
      );

      try {
        // Generate audio (base64)
        const base64Audio = await generateAudio(nextFields.context);

        // Store audio file in Anki
        console.log(`  💾 Storing audio file: ${audioFilename}`);
        await storeMediaFile(audioFilename, base64Audio);

        // Update audio field with Anki audio tag
        nextFields.contextAudio = `[sound:${audioFilename}]`;

        console.log(
          `  ✅ Audio generated and stored for note ${nextFields.id}`,
        );
      } catch (error) {
        console.error(
          `  ❌ Error generating audio for note ${nextFields.id}:`,
          error,
        );
      }
    }

    console.log('  ✏️ Updating Fields');
    try {
      await updateNoteFields(note.noteId, nextFields);

      console.log(`  ✅ Note ${nextFields.id} updated successfully`);
    } catch (error) {
      console.error(`  ❌ Error processing note ${nextFields.id}:`, error);
    }
  }

  console.log('✨ Done!');
}

main().catch(console.error);

function getPrompt(sentence: string, context: string): string {
  const prompt = `You are a comprehensive dictionary and thesaurus AI. Your task is to analyze the word or phrase "${sentence}" as used in the provided context and return structured information in JSON format.

CONTEXT: "${context}"

WORD/PHRASE TO ANALYZE: "${sentence}"

INSTRUCTIONS:
1. Analyze how the word/phrase is used in the given context
2. If the word/phrase has multiple meanings, focus on the meaning relevant to the context
3. Provide accurate, comprehensive information in the required JSON format
4. Ensure all examples demonstrate the word/phrase used with the same meaning as in the context

RESPONSE FORMAT (return ONLY valid JSON with no markdown formatting, no explanation text):

{
  "word": "${sentence}",
  "partOfSpeech": "noun, verb, adjective, etc. (use multiple if applicable)",
  "definition": "Clear, concise definition specific to how it's used in the context",
  "examples": [
    "example sentence 1 demonstrating the same usage",
    "example sentence 2 demonstrating the same usage"
  ],
  "synonyms": ["synonym1", "synonym2"],
  "antonyms": ["antonym1", "antonym2"],
  "relatedPhrases": ["phrase1", "phrase2"],
  "notes": "Any additional relevant information about usage or empty string"
}

 ${
   sentence.split(' ').length > 1
     ? 'SPECIAL INSTRUCTION: Since this is a multi-word phrase, determine if it functions as an idiom, compound term, or phrase with special meaning. Reflect this in your definition and set isIdiomOrCompound to true if applicable.'
     : 'SPECIAL INSTRUCTION: Since this is a single word, focus on its specific meaning in the given context.'
 }

CRITICAL: Respond with ONLY the JSON object. No markdown code blocks, no additional text, no explanations.`;

  return prompt;
}

function getFormatedAnkiDefinition(response: string): string {
  const json: VocabJsonResponse = JSON.parse(
    response.replaceAll('```json', '').replaceAll('```', ''),
  );

  json.word = titleCase(json.word);
  json.partOfSpeech = titleCase(json.partOfSpeech);

  const getUl = (
    arr: string[],
    format: 'capitalize' | 'titleCase' = 'capitalize',
  ): string => {
    const listItems = arr
      .map(
        (item) =>
          `<li>${format === 'capitalize' ? capitalize(item) : titleCase(item)}</li>`,
      )
      .join('\n');
    return `<ul>${listItems}</ul>`;
  };

  return `
<p><strong>${json.word}</strong> <i>${json.partOfSpeech}</i></p>
<p><strong>Definition: </strong>${json.definition}</p>

<hr class="flashcard__divider" />

<p><strong>Example Sentences:</strong></p>
${getUl(json.examples, 'titleCase')}

<p><strong>Related Phrases:</strong></p>
${getUl(json.relatedPhrases)}

<p><strong>Synonyms:</strong></p>
${getUl(json.synonyms)}

<p><strong>Antonyms:</strong></p>
${getUl(json.antonyms)}
`;
}

async function getDefinition(
  sentence: string,
  context: string,
): Promise<string> {
  const res = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemma3:4b',
      prompt: getPrompt(sentence, context),
      stream: false,
      options: {
        temperatue: 0.7,
        top_p: 0.67,
      },
    }),
  });
  const data = (await res.json()) as OllamaResponse;

  return getFormatedAnkiDefinition(data.response);
}
