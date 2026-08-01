# data/ — curriculum content

Read **`docs/curriculum.md`** and the authoring spec **`lessondoc.txt`**
before editing `lessons.json`. Run `npm run validate:lessons` after every
edit.

**`typing-texts.json`** is a separate, self-describing file: every word,
sentence and quote the home-page typing test can produce (`docs/home-test.md`
§9). Its `subjects` are keyed by the **`lib/k12.ts` subject slug**, which is
also how `k-12-curriculum.json` joins to it — renaming a subject in one file
without the other silently serves generic text instead of failing. Run
**`npm run validate:texts`** after editing either file.

Hard rules:
- v4 format only: no `*Number` fields, no hand-written step ids, `mode`
  presets instead of raw rules.
- Every `title`/`instruction`/`goal`/`say` needs all three locales
  (`en`/`uz`/`ru`), short simple words (school students).
- Ids are globally unique across the whole tree.
- `GAME_NINJA_RUN` steps: plain word tokens only (no specials/chords).
- `CHAT_SIM` uses `chat` (≥1 `you` turn), `SHORTCUT_DOJO` uses `dojo`
  (validator simulates the task script) — both omit `text`.
- `thumbnail.svgId` must exist in `ThumbnailRegistry`
  (`components/thumbnails/SvgLibrary.tsx`).
