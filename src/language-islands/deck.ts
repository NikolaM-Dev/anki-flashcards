import {
  findNotesByDeck,
  getNotesInfo,
  updateNoteFields,
} from '../shared/anki';
import { denoteIdScheme } from '../lib/date';
import { titleCase } from '../lib/string';

const LANGUAGE_ISLANDS_DECK = 'english::language-islands';

type LanguageIslandsDeckFieldKey = 'id' | 'nativeLanguage' | 'targetLanguage';

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
    const nextFields = {
      id: denoteIdScheme(new Date(note.noteId)),
      nativeLanguage: titleCase(note.fields.nativeLanguage.value),
      targetLanguage: titleCase(note.fields.targetLanguage.value),
    };

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
