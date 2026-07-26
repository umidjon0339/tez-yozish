# docs/ — subsystem documentation

Read the doc for a subsystem **before editing its code**. Each doc records the
contracts, data flow, and invariants that are not obvious from a single file.
Root `CLAUDE.md` holds the short overview; these hold the details.

| Doc | Covers | Key files |
|---|---|---|
| [curriculum.md](curriculum.md) | v4 authoring format, normalization, token grammar, dojo model, lesson types, validator | `data/lessons.json`, `data/lessondoc.txt`, `lib/curriculum.ts`, `types/lesson.ts`, `lib/keyTokens.ts`, `lib/dojoSim.ts`, `lib/lessonTypes.tsx`, `scripts/validate-lessons.mjs` |
| [lesson-runtime.md](lesson-runtime.md) | The typing engine: viewports, character state, keystroke flow, sounds, progression, results | `app/lesson/[id]/page.tsx`, `components/lesson/Rails.tsx` |
| [keyboard.md](keyboard.md) | Keycap + hands SVG layers, key-id contract, `--fz` finger-zone theming | `components/keyboard/*`, `app/globals.css`, `components/PaletteSwitcher.tsx` |
| [typing-ninja.md](typing-ninja.md) | The 3D game: simulation model, embedded vs arcade, sound synth, GLTF characters | `app/typing-ninja/*`, `public/models/*` |
| [progress.md](progress.md) | localStorage progress store, star ladder, WPM/accuracy formulas, unlocking | `lib/progress.ts` |
| [app-shell.md](app-shell.md) | Layout, NavBar, pages, localization (`useLocale`/`STR`), palette switcher, global CSS | `app/layout.tsx`, `app/page.tsx`, `app/courses/*`, `app/games/*`, `components/NavBar.tsx`, `lib/locale.tsx`, `lib/uiStrings.ts`, `app/globals.css` |
| [auth.md](auth.md) | Firebase SSO with edify-student, auth store, callback route, UserMenu | `lib/firebase.ts`, `lib/auth.ts`, `app/auth/callback/page.tsx`, `components/UserMenu.tsx` |
| [thumbnails.md](thumbnails.md) | Parametric SVG registry, every template, params contract | `components/thumbnails/*`, `types/thumbnail.ts` |
| [../app/english/phonemes/README.md](../app/english/phonemes/README.md) | The IPA sounds unit: writing-first track, per-allophone SHADE lessons, pass gate, audio setup | `app/english/phonemes/*`, `components/phonemes/*`, `components/english/*`, `lib/phonemes.ts`, `lib/allophones.ts`, `lib/phonemeAudio.ts`, `data/phonemeLessons.json` |
| [../app/english/graphemes/README.md](../app/english/graphemes/README.md) | The spelling units (graphemes + spellings tracks): writing-first lessons, typed WHICH/MASTER, shared games | `app/english/graphemes/*`, `app/english/spellings/*`, `components/graphemes/*`, `components/english/*`, `lib/graphemes.ts`, `data/graphemeLessons.json` |

Conventions used in these docs:

- `file:line` references were accurate when written (July 2026). Line numbers
  drift — trust the **symbol names** first and use line numbers as hints.
- "Invariants" sections list rules that must hold after any edit. Breaking one
  is a bug even if the app still compiles.
- Cross-cutting localStorage keys: `tz-progress-v1` (progress), `tz-locale`
  (language), `tz-fz-palette` (finger-zone palette), `tz-prefs-v1` (lesson
  workspace toggles), `tz-ninja-highscore` (arcade only).
