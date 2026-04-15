import { v7 as uuidv7 } from 'uuid';

import {
  findNotesByDeck,
  getNotesInfo,
  storeMediaFile,
  updateNoteFields,
} from '../shared/anki';
import { generateAudio } from '../lib/tts';
import { titleCase } from '../lib/string';

const LANGUAGE_ISLANDS_DECK = 'english::language-islands';

type LanguageIslandsDeckFieldKey =
  | 'id'
  | 'nativeLanguage'
  | 'targetLanguage'
  | 'targetLanguageAudio';

async function main() {
  console.log('🔍 Finding notes in deck:', LANGUAGE_ISLANDS_DECK);
  const noteIds = await findNotesByDeck(LANGUAGE_ISLANDS_DECK);

  if (noteIds.length === 0) {
    console.log('No notes found in deck:', LANGUAGE_ISLANDS_DECK);
    return;
  }

  console.log(`📝 Found ${noteIds.length} notes`);

  const notesInfo = await getNotesInfo<LanguageIslandsDeckFieldKey>(noteIds);
  for (const note of notesInfo) {
    if (note.fields.id.value !== '') {
      console.log(`  ✅ Note ${note.fields.id.value} already updated`);

      continue;
    }

    const nextFields: Record<LanguageIslandsDeckFieldKey, string> = {
      id: note.fields.id.value || uuidv7(),
      nativeLanguage: titleCase(note.fields.nativeLanguage.value).replace(
        /&nbsp;/g,
        ' ',
      ),
      targetLanguage: titleCase(note.fields.targetLanguage.value).replace(
        /&nbsp;/g,
        ' ',
      ),
      targetLanguageAudio: note.fields.targetLanguageAudio.value || '',
    };

    if (nextFields.targetLanguageAudio === '') {
      const targetLanguage = nextFields.targetLanguage;
      const audioFilename = `${nextFields.id}.mp3`;

      console.log(
        `  🎵 Generating audio for note ${nextFields.id}: "${targetLanguage.substring(0, 50)}..."`,
      );

      try {
        // Generate audio (base64)
        const base64Audio = await generateAudio(targetLanguage);

        // Store audio file in Anki
        console.log(`   💾 Storing audio file: ${audioFilename}`);
        await storeMediaFile(audioFilename, base64Audio);

        // Update audio field with Anki audio tag
        nextFields.targetLanguageAudio = `[sound:${audioFilename}]`;

        console.log(
          `   ✅ Audio generated and stored for note ${nextFields.id}`,
        );
      } catch (error) {
        console.error(
          `   ❌ Error generating audio for note ${nextFields.id}:`,
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
