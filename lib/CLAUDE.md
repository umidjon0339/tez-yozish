# lib/ — shared logic

Per-file docs (read before editing):
- `curriculum.ts`, `keyTokens.ts`, `dojoSim.ts`, `lessonTypes.tsx` →
  **`docs/curriculum.md`**
- `progress.ts` → **`docs/progress.md`**
- `stats.ts` → **`docs/stats.md`**
- `locale.tsx`, `uiStrings.ts`, `theme.tsx` → **`docs/app-shell.md`**
- `auth.ts`, `firebase.ts` → **`docs/auth.md`**
- `dojoSim.ts` consumers → **`docs/lesson-runtime.md`** (ShortcutDojo)

Hard rules:
- `scripts/validate-lessons.mjs` mirrors `keyTokens.ts`, `dojoSim.ts`,
  `lessonTypes.tsx`, and `MODE_PRESETS` in plain JS — changing any of them
  means updating the validator in the same commit.
- Pages import `course` from `@/lib/curriculum`, never the raw JSON.
- localStorage keys are compatibility contracts: `tz-progress-v1`,
  `tz-stats-v1`, `tz-locale`, `tz-fz-palette`, `tz-games-v1` (plus
  `tz-prefs-v1`, `tz-ninja-highscore` elsewhere). Bump the key if you change a
  shape.
- `gameStats.ts` counters are **local to the browser** — they are the player's
  own likes and plays, never a community total, and the `/games` labels say so.
  `read()`/`write()` are the seam a server would replace; nothing else there
  touches storage. Its snapshot is cached because `useSyncExternalStore`
  compares by identity — parsing on every read would loop forever.
- `tz-prefs-v1` has two owners: `theme.tsx` owns its `dark` field, the lesson
  runtime owns `audio`/`colorful`/`hands`. Both **merge** on write — never
  `setItem` a freshly built object over that key.
- Global client state uses the module-level `useSyncExternalStore` idiom
  (`locale.tsx`, `auth.ts`, `PaletteSwitcher`) — no Providers/Context.
- `saveLessonResult` keeps best-ever values (max-merge); don't make it
  overwrite.
