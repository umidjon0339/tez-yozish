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
| [rhino-dash.md](rhino-dash.md) | The 3D cliff-duel game: tug-of-war physics, phases, procedural rhinos, sound synth | `app/rhino-dash/*` |
| [sky-hop.md](sky-hop.md) | The 2D balloon-hop game: canvas renderer, flight/lift model, stages, crows, attract mode | `app/sky-hop/*` |
| [tug-of-typing.md](tug-of-typing.md) | The 2D tug-of-war game: shared word race, honest rival WPM, endless levels, dig-in ramp, top-down kids | `app/tug-of-typing/*` |
| [beam-break.md](beam-break.md) | The 2D UFO-beam game: tug-of-war model, sprung motion, the 10-animal parametric painter, levels, capture rings, no-shake / no-music rules | `app/beam-break/*` |
| [alien-drop.md](alien-drop.md) | The 2D falling-pod game: single-character targeting, the three accelerations, tag-then-bolt kills, the mirroring hero, waves / swarms / nova, the siren | `app/alien-drop/*` |
| [word-forge.md](word-forge.md) | The 2D lane-defence game: one key = one shot, the SPACE loadout mode, the one-word-one-bot HP identity, the heat engine, how the balance was measured | `app/word-forge/*` |
| [star-type.md](star-type.md) | The 2D space shooter (a faithful ZType copy): the lock-on model, doomed drones, the wave ramp, what was deliberately left out | `app/star-type/*` |
| [home-test.md](home-test.md) | The home page's Monkeytype-style test: what was copied and what was not, the input model, the ref+snapshot architecture, scoring, fitting one screen | `app/page.tsx`, `components/home/*`, `lib/typingTest.ts` |
| [progress.md](progress.md) | localStorage progress store, star ladder, WPM/accuracy formulas, unlocking | `lib/progress.ts` |
| [app-shell.md](app-shell.md) | Layout, NavBar, pages, localization (`useLocale`/`STR`), palette switcher, global CSS | `app/layout.tsx`, `app/page.tsx`, `app/courses/*`, `app/games/*`, `components/NavBar.tsx`, `lib/locale.tsx`, `lib/uiStrings.ts`, `app/globals.css` |
| [auth.md](auth.md) | Firebase SSO with edify-student, auth store, callback route, UserMenu | `lib/firebase.ts`, `lib/auth.ts`, `app/auth/callback/page.tsx`, `components/UserMenu.tsx` |
| [thumbnails.md](thumbnails.md) | Parametric SVG registry, every template, params contract | `components/thumbnails/*`, `types/thumbnail.ts` |
| [pricing.md](pricing.md) | The one Pro plan and its three periods, the checkout seam, the 7-tab feature showcase and its animated scenes | `app/pricing/*`, `components/pricing/*` |
| [books.md](books.md) | Typing practice over long-form text: pages as runs, the `mode:"custom"` reuse of the home engine, pasted-book pagination and the `tz-books-v1` store | `app/books/*`, `lib/books.ts`, `data/books.json` |
| [coding.md](coding.md) | The coding catalogue: the stage→track→module ladder, why stage-first, the never-translated `typingFocus`/`sample` seam to the typing engine | `app/coding/*`, `lib/coding.ts`, `data/coding-curriculum.json` |
| [../app/english/phonemes/README.md](../app/english/phonemes/README.md) | The IPA sounds unit: writing-first track, per-allophone SHADE lessons, pass gate, audio setup | `app/english/phonemes/*`, `components/phonemes/*`, `components/english/*`, `lib/phonemes.ts`, `lib/allophones.ts`, `lib/phonemeAudio.ts`, `data/phonemeLessons.json` |
| [../app/english/graphemes/README.md](../app/english/graphemes/README.md) | The spelling units (graphemes + spellings tracks): writing-first lessons, typed WHICH/MASTER, shared games | `app/english/graphemes/*`, `app/english/spellings/*`, `components/graphemes/*`, `components/english/*`, `lib/graphemes.ts`, `data/graphemeLessons.json` |

Conventions used in these docs:

- `file:line` references were accurate when written (July 2026). Line numbers
  drift — trust the **symbol names** first and use line numbers as hints.
- "Invariants" sections list rules that must hold after any edit. Breaking one
  is a bug even if the app still compiles.
- Cross-cutting localStorage keys: `tz-progress-v1` (progress), `tz-locale`
  (language), `tz-fz-palette` (finger-zone palette), `tz-prefs-v1` (lesson
  workspace toggles), `tz-ninja-highscore` (arcade only),
  `tz-rhino-highscore` (rhino-dash),
  `tz-skyhop-highscore` (sky-hop),
  `tz-beambreak-best` (beam-break — best distance in metres),
  `tz-aliendrop-best` (alien-drop — best score),
  `tz-startype-best` (star-type — best score),
  `tz-wordforge-best` (word-forge — best wave reached),
  `tz-games-v1` (`lib/gameStats.ts` — likes and play counts for the `/games`
  cards; `{ views: {slug: n}, liked: {slug: true} }`, local to the browser).
