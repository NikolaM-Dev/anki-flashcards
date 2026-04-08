# 🛣️️ Road-map

> [👈 Back to README](./README.md)

## 🔥 in Progress

- [ ] Here 🙋
- [ ] Update the GitHub Respository

## 🥶 Wait

## 🔮 Next

- [ ] Document my Anki setup in my second brain
  - [ ] Plugins, and [gTTS text to speech support - AnkiWeb](https://ankiweb.net/shared/info/391644525)
  - [ ] Docs the decks

## 🗂️ Refile

```ts
    const id = nextFields.id.value;
    if (nextFields.targetLanguageAudio.value === "") {
      nextFields.targetLanguageAudio.value = `[sound:${id}.mp3]`;

      const targetLanguage = nextFields.targetLanguage.value;
      const audioFilename = `${id}.mp3`;

      console.log(
        ` 🎵 Generating audio for note ${id}: "${targetLanguage.substring(0, 50)}..."`,
      );

      try {
        // Generate audio (base64)
        const base64Audio = await generateAudio(targetLanguage);

        // Store audio file in Anki
        console.log(`   💾 Storing audio file: ${id}.mp3`);
        await storeMediaFile(audioFilename, base64Audio);

        // Update Back field with audio and add Id field
        console.log(`   ✏️ Updating Back field with audio and Id: ${id}`);
        await updateNoteFields(note.noteId, {
          targetLanguageAudio: nextFields.targetLanguageAudio.value,
          id,
        });

        console.log(`✅ Note ${id} updated successfully`);
      } catch (error) {
        console.error(`❌ Error processing note ${id}:`, error);
      }
```

## 🎒 Backlog

- [x] Clean my anki related repositories in GitHub ✅ 2026-04-08

---

## 🗃️ Archive

- [x] Change the id form using uuid to use a denote id scheme ✅ 2026-04-08
  - [x] Vocab ✅ 2026-04-08
  - [x] Language Islands ✅ 2026-04-08
- [x] Update the deck styles, `max-width` ✅ 2026-04-08
- [x] Change to use the native Anki tts instead of edge-tts ✅ 2026-04-08
  - [x] Remove the audio related fields ✅ 2026-04-08
- [x] Anki connect API ✅ 2026-04-07
- [x] vocab deck using Definer zen-browser extension prompt ✅ 2026-04-08
- [x] Language Islands deck using edge-tts package ✅ 2026-04-07
