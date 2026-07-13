# data/ — curriculum content

Read **`docs/curriculum.md`** and the authoring spec **`lessondoc.txt`**
before editing `lessons.json`. Run `npm run validate:lessons` after every
edit.

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
