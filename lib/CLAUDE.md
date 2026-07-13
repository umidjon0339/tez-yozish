# lib/ — shared logic

Per-file docs (read before editing):
- `curriculum.ts`, `keyTokens.ts`, `dojoSim.ts`, `lessonTypes.tsx` →
  **`docs/curriculum.md`**
- `progress.ts` → **`docs/progress.md`**
- `stats.ts` → **`docs/stats.md`**
- `locale.tsx`, `uiStrings.ts` → **`docs/app-shell.md`**
- `auth.ts`, `firebase.ts` → **`docs/auth.md`**
- `dojoSim.ts` consumers → **`docs/lesson-runtime.md`** (ShortcutDojo)

Hard rules:
- `scripts/validate-lessons.mjs` mirrors `keyTokens.ts`, `dojoSim.ts`,
  `lessonTypes.tsx`, and `MODE_PRESETS` in plain JS — changing any of them
  means updating the validator in the same commit.
- Pages import `course` from `@/lib/curriculum`, never the raw JSON.
- localStorage keys are compatibility contracts: `tz-progress-v1`,
  `tz-stats-v1`, `tz-locale`, `tz-fz-palette` (plus `tz-prefs-v1`,
  `tz-ninja-highscore` elsewhere). Bump the key if you change a shape.
- Global client state uses the module-level `useSyncExternalStore` idiom
  (`locale.tsx`, `auth.ts`, `PaletteSwitcher`) — no Providers/Context.
- `saveLessonResult` keeps best-ever values (max-merge); don't make it
  overwrite.
