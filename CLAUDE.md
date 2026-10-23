# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Subsystem docs — read before editing

Detailed contracts, data flow, and invariants live in **`docs/`**. Before editing a subsystem, read its doc (index in `docs/README.md`):

| Editing… | Read first |
|---|---|
| `data/lessons.json`, `lib/curriculum.ts`, `lib/keyTokens.ts`, `lib/dojoSim.ts`, `lib/lessonTypes.tsx`, the validator | `docs/curriculum.md` (+ `data/lessondoc.txt`) |
| `app/lesson/[id]/page.tsx`, `components/lesson/Rails.tsx` | `docs/lesson-runtime.md` |
| `components/keyboard/*`, finger-zone CSS, `PaletteSwitcher` | `docs/keyboard.md` |
| `app/typing-ninja/*` | `docs/typing-ninja.md` |
| `app/rhino-dash/*` | `docs/rhino-dash.md` |
| `app/sky-hop/*` | `docs/sky-hop.md` |
| `app/tug-of-typing/*` | `docs/tug-of-typing.md` |
| `app/beam-break/*` | `docs/beam-break.md` |
| `app/alien-drop/*` | `docs/alien-drop.md` |
| `app/star-type/*` | `docs/star-type.md` |
| `app/word-forge/*` | `docs/word-forge.md` |
| `app/page.tsx`, `components/home/*`, `lib/typingTest.ts`, `data/typing-texts.json` | `docs/home-test.md` |
| `lib/progress.ts` | `docs/progress.md` |
| pages, `NavBar`, `lib/locale.tsx`, `lib/uiStrings.ts`, `app/globals.css` | `docs/app-shell.md` |
| `app/courses/page.tsx`, `lib/k12.ts`, `lib/exams.ts`, `data/k-12-curriculum.json`, `data/exams.json` | `docs/app-shell.md` (`/courses` row) |
| `app/coding/*`, `lib/coding.ts`, `data/coding-curriculum.json` | `docs/coding.md` |
| `app/books/*`, `components/books/*`, `lib/books.ts`, `data/books.json` | `docs/books.md` |
| `lib/auth.ts`, `lib/firebase.ts`, `app/auth/*`, `UserMenu` | `docs/auth.md` |
| `components/thumbnails/*` | `docs/thumbnails.md` |
| `app/pricing/*`, `components/pricing/*` | `docs/pricing.md` |

Directories with tricky invariants also carry a local `CLAUDE.md` (`data/`, `lib/`, `app/lesson/`, `app/typing-ninja/`, `app/rhino-dash/`, `app/sky-hop/`, `app/beam-break/`, `app/alien-drop/`, `app/star-type/`, `app/word-forge/`, `app/tug-of-typing/`, `app/auth/`, `components/home/`, `components/keyboard/`, `components/lesson/`, `components/thumbnails/`) listing the hard rules for that directory.

## Next.js version warning

This project runs **Next.js 16 / React 19**. APIs differ from older training data. Before writing framework code, read the relevant guide under `node_modules/next/dist/docs/` (see `AGENTS.md`). Notably, route `params` and `searchParams` are **Promises** — unwrap them with React's `use()` (see `app/courses/[id]/page.tsx`, which unwraps `searchParams` this way) rather than accessing properties synchronously; client pages use the `useParams()` hook instead (see `app/lesson/[id]/page.tsx`).

## Commands

```bash
npm run dev     # dev server at http://localhost:3000
npm run build   # production build
npm run start   # serve production build
npm run lint    # eslint (flat config, eslint-config-next core-web-vitals + typescript)
```

There is no test runner configured. `scripts/validate-typing-texts.mjs` guards the home test's content via `npm run validate:texts` — run it after editing `data/typing-texts.json` **or** `data/k-12-curriculum.json`, which join on a subject slug and fail silently when they drift. `scripts/validate-lessons.mjs` validates lesson data via `npm run validate:lessons` — run it after every `data/lessons.json` edit. The validator mirrors TS logic (`lib/keyTokens.ts`, `lib/dojoSim.ts`, `lib/lessonTypes.tsx`, `MODE_PRESETS`) in plain JS; change them together.

## Architecture

This is a touch-typing trainer ("tez/yozish"). Four pillars: a JSON-driven curriculum engine, a parametric SVG thumbnail registry, a self-contained 3D arcade game, and Firebase SSO auth shared with the parent app edify-student (`docs/auth.md`).

### Curriculum is data, not code

The entire course lives in **`data/lessons.json`**, written in the **v4 authoring format** (5-tier hierarchy **Course → Chapter → Section → Lesson → Step**, uniform `id`/`title` keys, no `*Number` fields, step `text` as one space-separated string, `mode` presets instead of raw rules). The spec is **`data/lessondoc.txt`** (v4) — read it before editing lesson content, and run `npm run validate:lessons` after.

**`lib/curriculum.ts`** normalizes the v4 source (`*Source` types in `types/lesson.ts`) into the runtime model (`CourseNode`, `ChapterNode`, `SectionNode`, `LessonNode`, `StepNode`): it derives numbers from array order, generates step ids, splits `text` into `content` tokens, expands `mode` presets into `StepRules`, and derives `unlockedKeys`. Pages import `course` from `@/lib/curriculum` — never the raw JSON.

Key conventions:
- All user-facing text is a `LocalizedString { en, uz, ru }` — all three locales are required (enforced by the validator).
- Every step has a `viewport` field (`ViewportMode`) that selects which UI mounts at runtime: `POSTURE_CHECK`, `KEY_INTRO`, `STANDARD_GYM`, `GAME_NINJA_RUN`, `CHAT_SIM` (messenger — Enter sends each typed reply; step carries `chat` turns instead of `text`), `SHORTCUT_DOJO` (task cards drive real shortcut effects on a mini document; step carries `dojo` — model in **`lib/dojoSim.ts`**, the validator simulates the task script).
- Step `text` tokens can be more than plain characters (v4.1, rules in **`lib/keyTokens.ts`**): special keys (`Enter`/`Tab` inline in gym text render as keycaps and really break/indent the line; all seven in `KEY_INTRO`) and chords (`Ctrl+C` — matched with real modifier state, browser default suppressed). A `prefill` step field makes fix-the-typo drills: the wrong text starts pre-typed and must be backspaced and repaired. Games accept plain words only.
- Lesson `type` is one of `lesson` / `practice` / `test` / `game`. All per-type behavior (graded or not, default `passStars`, group labels/order, badge icon) is centralized in **`lib/lessonTypes.tsx`** — `lesson` and `practice` are ungraded (completing = passing, no stars), `test` and `game` earn 0–5 stars. Adding a type = one config entry there + the `TYPES` list in the validator.
- Lesson progress/stars persist in `localStorage` via **`lib/progress.ts`** (`tz-progress-v1`; star rules and standard 5-chars-per-word WPM live in `computeLessonResult`).
- All-time keystroke statistics persist via **`lib/stats.ts`** (`tz-stats-v1`, aggregate-only: per-key/per-day counters, last 200 attempts, records — see `docs/stats.md`). Every typing viewport and the ninja game record through `createStatsSession()`; the `/stats` dashboard (`app/stats/page.tsx` + `components/stats/`, hand-built SVG charts) visualizes them.

### The lesson runtime

`app/lesson/[id]/page.tsx` (~2700 lines, `"use client"`) is the core typing engine. It finds the lesson by `lessonId` in the JSON, then renders per-step by branching on `step.viewport`. Character state is tracked with numeric constants (`UNTYPED`/`CORRECT`/`INCORRECT`/`CORRECT_FIXED`) and imperative letter handles (`useImperativeHandle`) for zero-latency per-keystroke DOM updates rather than re-rendering the whole text. The gym (`PracticeTracker`) types over a `GymUnit` list (plain chars / inline special keys / chords) built by `buildGymUnits`, so one step can mix words, real line breaks and shortcut presses; `ChatSim` and `ShortcutDojo` live in the same file. It composes the keyboard visualizations (`components/keyboard/`) and plays mp3 keystroke/error sounds (`press_key4.mp3`/`error2.mp3`) through a Web-Audio layer. Workspace toggles (dark/audio/colorful/hands) persist in `localStorage` (`tz-prefs-v1`); the sidebar rails (`components/lesson/Rails.tsx`) are ephemeral overlay drawers.

Keyboard components (all `memo`'d, driven by an `expectedKey` prop): `new_keyboard.tsx` (`NewKeyboard`, the primary one) and `hands.tsx` (`Keyboard`, the animated hands overlay — largest component).

### Thumbnail registry (parametric SVGs)

Course/section/lesson cards reference a thumbnail by string id + params in the JSON:
```json
"thumbnail": { "svgId": "TWO_KEYS_FOCUS", "parameters": { "keys": ["f","j"], "accentColor": "emerald" } }
```
`components/thumbnails/DynamicThumbnail.tsx` looks `svgId` up in **`ThumbnailRegistry`** (bottom of `SvgLibrary.tsx`) and renders the matched component, passing `params`. Missing ids render a visible fallback, never crash.

To add a thumbnail: write a `React.FC<SvgTemplateProps>` in `SvgLibrary.tsx` (props typed in `types/thumbnail.ts`; **every `ThumbnailParams` field must stay optional** with a default), then register it in `ThumbnailRegistry`. A thumbnail can alternatively be a raster via `thumbnail.imageSrc` (e.g. the course cover uses `/course-cover.svg`).

### The games (independent of the lesson engine)

- **`/typing-ninja`** → `app/typing-ninja/NinjaWorld.tsx` (~1400 lines; GLTF characters in `characters.tsx`, scenery/camera in `environment.tsx`, models in `public/models/`): 3D WebGL survival game using `@react-three/fiber` + `drei` + `three`. Loaded via `next/dynamic` with `ssr: false` (also embedded in the lesson runtime for `GAME_NINJA_RUN` steps — words from `step.content`, pace/mistake budget from `step.rules`; its `onComplete` reports no stats, so game steps don't feed lesson grading).

The game embeds its own inline `SoundSynthesizer` class (Web Audio API oscillators), separate from the lesson runtime's mp3-file playback. Its simulation lives in a mutable `stateRef`, not React state — see `docs/typing-ninja.md` before touching it.

- **`/rhino-dash`** → `app/rhino-dash/RhinoWorld.tsx`: a second arcade game on the same architecture (mutable `stateRef` + inline sound synth) — a cliff-top tug-of-war typing endurance duel: endless waves of stronger rivals with longer words, one life, linked from `/games`. Its character model `public/models/rhino.glb` is authored in-repo by `scripts/build-rhino-model.mjs` (`npm run model:rhino`). See `docs/rhino-dash.md` before touching it.

- **`/sky-hop`** → `app/sky-hop/` (`SkyHopWorld.tsx` + `sim.ts` / `render.ts` / `sound.ts`): the **2D** arcade game — a hand-drawn `<canvas>` scene (no three.js, no image assets, no mp3s) where the hero dangles from a balloon over the ocean and types the labels on a climbing chain of balloons to hop along it. Every correct key is a puff of lift against a constant air leak, so slow typing sinks you into the sea (3 lives); endless stages bring longer words, a faster leak, new skies, diving crows and golden balloons. Same mutable-`stateRef` architecture, but the typed word is painted straight from the ref (zero re-renders per keystroke). See `docs/sky-hop.md` before touching it.

- **`/beam-break`** → `app/beam-break/` (`BeamBreakWorld.tsx` + `sim.ts` / `animals.ts` / `render.ts` / `sound.ts`): the second **2D** canvas game — a cute animal is caught in a UFO's tractor beam over a dune desert, and the word to type is a row of keycap tiles at the top of the screen. The beam raises `grab` every second; each correct key yanks it back down and finishing a word breaks the grip and shoves the world forward, so the score is the **distance** travelled (an integral of your keys/sec). Endless, 3 lives, levels every 10 words with capture rings and golden words. **A different one of 10 animals every run**, all drawn by one parametric painter in `animals.ts`. Three things make it unlike its siblings: it has **no screen shake and no music at all** by design (rising danger is shown, not heard), the animal's position is drawn from a **critically damped spring** (`grabView`) so fast typing never makes it judder, and typos are **flow mode** — they cost you ground but never block the word. See `docs/beam-break.md` before touching it.

- **`/alien-drop`** → `app/alien-drop/` (`AlienDropWorld.tsx` + `sim.ts` / `render.ts` / `sound.ts`): the third **2D** canvas game — alien drop-pods fall on a colony, each carrying **one character**, and the space-suit hero blasts the one you type out of the air. Let a pod land and the shield bar drops; shield at zero ends the run. It is the only game whose whole mechanic is **one keystroke per target** (every other one is word-based), which makes it the cleanest feed for the per-key data in `lib/stats.ts` and a genuine first-week drill on EASY (home row only). Three things define it: targeting is always the **lowest matching pod**; the kill is banked on the **keystroke** while the blaster bolt is pure theatre that catches up a beat later; and difficulty comes from **three stacked accelerations** (per pod, per wave, per run) whose single source of truth, `gapAt()`/`speedAt()`, also generates the WPM figures the menu prints. Unlike beam-break it *does* have screen shake, and it has a pulsed danger siren. See `docs/alien-drop.md` before touching it.

- **`/star-type`** → `app/star-type/` (`StarTypeWorld.tsx` + `sim.ts` / `render.ts` / `sound.ts`): the fourth **2D** canvas game and the only one built from a **"copy the reference"** brief rather than a "take the idea" one — a faithful re-build of the ZType space shooter. Enemy drones dive at your ship carrying words; type a word's **first letter to lock on**, then type it out to shoot the drone down. One drone reaching the ship ends the run. What defines this route is what is deliberately **absent**: no difficulty picker, no lives, no power-ups, no combo multiplier and no in-run score read-out — the wave ramp is the whole difficulty model and the bare HUD is the point. The one intentional departure from the reference is layout: it is a portrait phone game, this fills a landscape window. Its title and results screens are dark/cyan rather than the sibling games' cream card, on purpose. See `docs/star-type.md` before touching it.

- **`/word-forge`** → `app/word-forge/` (`WordForgeWorld.tsx` + `sim.ts` / `render.ts` / `sound.ts`): the fifth **2D** canvas game, whose scene is taken from the Steam game *Typing Break* — a top-down forge corridor where scrap-bots march at your gate. **Nothing fires by itself**: every bot carries the thing you type (one key on EASY, a word after that) and one correct key is one shot. What makes it unlike the other word games here is the second mode: **SPACE** opens the LOADOUT, where your keys stop talking to the bots and start talking to the two columns of WEAPON and PERK plates beside the lane — and the lane keeps running while you shop, so *when* to duck out is the real decision. The tuning identity everything is built on is that **one word kills one bot at wave 1 with a level-1 PISTOL, exactly** (`HP_PER_LETTER` is the pistol's damage); a bot that outlives its word is given a new one. **HEAT** — stoked by correct keys and kills, decaying when you stop — multiplies damage, so typing rate matters and not just correctness. Bot walking speed *is* the difficulty model (a lane crossing is ~10 s). See `docs/word-forge.md` before touching it.

- **`/tug-of-typing`** → `app/tug-of-typing/` (`TugWorld.tsx` + `sim.ts` / `render.ts` / `sound.ts`): the top-down **2D** tug-of-war — you and a rival kid race on the **same word**, every correct letter pulls the rope your way, and whoever finishes first lands a heave. **Endless levels**: clear the rope and the next rival types 4 WPM faster, forever; lose it once and the run ends, so the level you die on *is* your typing speed. What separates it from rhino-dash (also a tug-of-war) is that the opponent types at a **stated WPM shown on screen** (starting 18 / 30 / 45), so the game is an honest speed target rather than an abstract enemy — anything that quietly slows the rival is a bug. There is no timer anywhere: a level that stalls is ended by the rival visibly digging in. See `docs/tug-of-typing.md` before touching it.

### Pricing

`/pricing` sells a single plan (**Pro**) over three periods — 1 month, 6
months (25% off), 12 months (50% off). `MONTHLY_PRICE` in
`app/pricing/page.tsx` is the only number to edit; every price, per-month
line, discount and savings figure on the page is derived from it, and the
course-size claims are read from `lib/curriculum` rather than typed into
copy. It is deliberately a **one-screen page** — the Get Pro button stays
above the fold at 1366×768, so new copy has to earn its vertical space. The
left column is a 7-tab showcase whose animated SVG scenes live in
`components/pricing/FeatureScenes.tsx` (same namespacing/theming rules as the
thumbnail registry). `startCheckout()` is the seam a payment provider hooks
into. See `docs/pricing.md` before touching it.

## Conventions

- Import alias `@/*` maps to the repo root (`tsconfig.json`), e.g. `@/data/lessons.json`, `@/components/...`.
- All pages are `"use client"` — the UI is fully localized (en/uz/ru) and must react to the language switch. The selected locale lives in `localStorage` (`tz-locale`) behind the `useLocale()` hook in **`lib/locale.tsx`** (a `useSyncExternalStore`-based store, same pattern as `PaletteSwitcher`); chrome/page strings live in **`lib/uiStrings.ts`** (the lesson runtime keeps its own `UI` dict). The switcher UI is `components/LanguageSwitcher.tsx` (globe dropdown), used in the navbar (`components/NavBar.tsx`) and the lesson header. New user-facing text must be added in all three locales — use short, simple words (the audience is school students).
- Header/toolbar icons come from `lucide-react` — no hand-rolled inline SVGs for standard glyphs.
- Styling is Tailwind CSS v4 (via `@tailwindcss/postcss`), utility classes inline. The visual language is a monochrome "Notion-style" neutral palette (`#FAFAFA` background, `neutral-*`) with mono/sans fonts (`Inter`, `JetBrains_Mono`) wired in `app/layout.tsx`.
- **Dark mode is global and class-based** — `lib/theme.tsx` (`useTheme()`) toggles `.dark` on `<html>`, persisted in the `dark` field of `tz-prefs-v1` and applied pre-paint by the boot script in `app/layout.tsx`. The switch is `components/ThemeToggle.tsx` in the navbar; the lesson header switch is the same setting. Every new page/component must ship `dark:` variants (mapping table in `docs/app-shell.md` §2b); SVG charts use the `--chart-*`/`--ramp-*` variables instead of hex. The in-canvas games keep their own authored palettes.
