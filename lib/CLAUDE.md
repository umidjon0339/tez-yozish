# lib/ — shared logic

Grouped by area:
- `core/` — app-wide: `locale.tsx`, `theme.tsx`, `auth.ts`, `firebase.ts`,
  `uiStrings/` (one file per `STR` namespace)
- `typing/` — the typing course engine: `curriculum.ts`, `keyTokens.ts`,
  `dojoSim.ts`, `lessonTypes.tsx`, `progress.ts`, `stats.ts`, `typingTest.ts`
- `english/` — the /english units: letters, phonemes (+ `allophones`,
  `phonemeAudio`) and graphemes, each with its curriculum and progress store
- `catalog/` — data behind the browse pages: `k12`, `exams`, `coding`,
  `books`, `games`, `gameStats`, `monkeytype`

Per-file docs (read before editing):
- `typing/curriculum.ts`, `typing/keyTokens.ts`, `typing/dojoSim.ts`,
  `typing/lessonTypes.tsx` → **`docs/curriculum.md`**
- `typing/progress.ts` → **`docs/progress.md`**
- `typing/stats.ts` → **`docs/stats.md`**
- `core/locale.tsx`, `core/uiStrings/`, `core/theme.tsx` → **`docs/app-shell.md`**
- `core/auth.ts`, `core/firebase.ts` → **`docs/auth.md`**
- `typing/dojoSim.ts` consumers → **`docs/lesson-runtime.md`** (ShortcutDojo)

Hard rules:
- `scripts/validate-lessons.mjs` mirrors `typing/keyTokens.ts`, `typing/dojoSim.ts`,
  `typing/lessonTypes.tsx`, and `MODE_PRESETS` in plain JS — changing any of them
  means updating the validator in the same commit.
- Pages import `course` from `@/lib/typing/curriculum`, never the raw JSON.
- localStorage keys are compatibility contracts: `tz-progress-v1`,
  `tz-stats-v1`, `tz-locale`, `tz-fz-palette`, `tz-games-v1` (plus
  `tz-prefs-v1`, `tz-ninja-highscore` elsewhere). Bump the key if you change a
  shape.
- `catalog/gameStats.ts` counters are **local to the browser** — they are the player's
  own likes and plays, never a community total, and the `/games` labels say so.
  `read()`/`write()` are the seam a server would replace; nothing else there
  touches storage. Its snapshot is cached because `useSyncExternalStore`
  compares by identity — parsing on every read would loop forever.
- `tz-prefs-v1` has two owners: `core/theme.tsx` owns its `dark` field, the lesson
  runtime owns `audio`/`colorful`/`hands`. Both **merge** on write — never
  `setItem` a freshly built object over that key.
- Global client state uses the module-level `useSyncExternalStore` idiom
  (`core/locale.tsx`, `core/auth.ts`, `PaletteSwitcher`) — no Providers/Context.
- `saveLessonResult` keeps best-ever values (max-merge); don't make it
  overwrite.
