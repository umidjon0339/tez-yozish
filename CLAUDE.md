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
| `lib/progress.ts` | `docs/progress.md` |
| pages, `NavBar`, `lib/locale.tsx`, `lib/uiStrings.ts`, `app/globals.css` | `docs/app-shell.md` |
| `lib/auth.ts`, `lib/firebase.ts`, `app/auth/*`, `UserMenu` | `docs/auth.md` |
| `components/thumbnails/*` | `docs/thumbnails.md` |

Directories with tricky invariants also carry a local `CLAUDE.md` (`data/`, `lib/`, `app/lesson/`, `app/typing-ninja/`, `app/auth/`, `components/keyboard/`, `components/lesson/`, `components/thumbnails/`) listing the hard rules for that directory.

## Next.js version warning

This project runs **Next.js 16 / React 19**. APIs differ from older training data. Before writing framework code, read the relevant guide under `node_modules/next/dist/docs/` (see `AGENTS.md`). Notably, route `params` and `searchParams` are **Promises** — unwrap them with React's `use()` (see `app/courses/[id]/page.tsx`, which unwraps `searchParams` this way) rather than accessing properties synchronously; client pages use the `useParams()` hook instead (see `app/lesson/[id]/page.tsx`).

## Commands

```bash
npm run dev     # dev server at http://localhost:3000
npm run build   # production build
npm run start   # serve production build
npm run lint    # eslint (flat config, eslint-config-next core-web-vitals + typescript)
```

There is no test runner configured. `scripts/validate-lessons.mjs` validates lesson data via `npm run validate:lessons` — run it after every `data/lessons.json` edit. The validator mirrors TS logic (`lib/keyTokens.ts`, `lib/dojoSim.ts`, `lib/lessonTypes.tsx`, `MODE_PRESETS`) in plain JS; change them together.

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

### The game (independent of the lesson engine)

- **`/typing-ninja`** → `app/typing-ninja/NinjaWorld.tsx` (~1400 lines; GLTF characters in `characters.tsx`, scenery/camera in `environment.tsx`, models in `public/models/`): 3D WebGL survival game using `@react-three/fiber` + `drei` + `three`. Loaded via `next/dynamic` with `ssr: false` (also embedded in the lesson runtime for `GAME_NINJA_RUN` steps — words from `step.content`, pace/mistake budget from `step.rules`; its `onComplete` reports no stats, so game steps don't feed lesson grading).

The game embeds its own inline `SoundSynthesizer` class (Web Audio API oscillators), separate from the lesson runtime's mp3-file playback. Its simulation lives in a mutable `stateRef`, not React state — see `docs/typing-ninja.md` before touching it.

### Inert files (safe to ignore)

- `components/thumbnails/svgsprite-*.svg` are unreferenced assets.

## Conventions

- Import alias `@/*` maps to the repo root (`tsconfig.json`), e.g. `@/data/lessons.json`, `@/components/...`.
- All pages are `"use client"` — the UI is fully localized (en/uz/ru) and must react to the language switch. The selected locale lives in `localStorage` (`tz-locale`) behind the `useLocale()` hook in **`lib/locale.tsx`** (a `useSyncExternalStore`-based store, same pattern as `PaletteSwitcher`); chrome/page strings live in **`lib/uiStrings.ts`** (the lesson runtime keeps its own `UI` dict). The switcher UI is `components/LanguageSwitcher.tsx` (globe dropdown), used in the navbar (`components/NavBar.tsx`) and the lesson header. New user-facing text must be added in all three locales — use short, simple words (the audience is school students).
- Header/toolbar icons come from `lucide-react` — no hand-rolled inline SVGs for standard glyphs.
- Styling is Tailwind CSS v4 (via `@tailwindcss/postcss`), utility classes inline. The visual language is a monochrome "Notion-style" neutral palette (`#FAFAFA` background, `neutral-*`) with mono/sans fonts (`Inter`, `JetBrains_Mono`) wired in `app/layout.tsx`.
se your typing speed? Typingbird is here to give you fun and engaging free typing games designed to get those fingers racing across the keyboard faster. We host unique and exclusive games for typing practise not found elsewhere, and ones that not only help kids to improve typing speed and accuracy but finger dexterity and letter recognition too.

Google ClassroomSymbaloo BookmarksXFacebookPinterest￼
￼
Sort by Most Played
Showing 1–12 of 48 results

1 2 3 4 →
￼
NitroType Pro
￼￼
1k
￼
166.4k
￼
Alien Typing
￼￼
732
￼
160.7k
￼
Frogie Typing
￼￼
898
￼
157.7k
￼
Space Typing
￼￼
222
￼
155.6k
￼
Type The Alphabet
￼￼
753
￼
149.8k
￼
Typing Numbers
￼￼
382
￼
141.4k
￼
Rainbow Popcorn
￼￼
2.6k
￼
139.8k
￼
ZType 3D
￼￼
482
￼
136.5k
￼
Ninja Run
￼￼
1.1k
￼
133.9k
￼
Knight Fight
￼￼
2.3k
￼
134k
￼
MonkeyType Knockout
￼￼
282
￼
131.5k
￼
QWERTY Challenge
￼￼
1.6k
￼
125.6k
￼
Sort by Most Played
Showing 1–12 of 48 results

1 2 3 4 →
Trending Typing Games
￼
NitroType Pro
￼￼
1k
￼
166.4k
￼
Alien Typing
￼￼
732
￼
160.7k
￼
Frogie Typing
￼￼
898
￼
157.7k
￼
Space Typing
￼￼
222
￼
155.6k
￼
Type The Alphabet
￼￼
753
￼
149.8k
￼
Typing Numbers
￼￼
382
￼
141.4k
￼
ZType 3D
￼￼
482
￼
136.5k
￼
Ninja Run
￼￼
1.1k
￼
133.9k
￼
MonkeyType Knockout
￼￼
282
￼
131.5k
Discover the World’s Premier Typing Games
Embark on a grand adventure with our large and growing library of free typing games that make it fun and easy to type speedily and accurately.

Enhance your words per minute (WPM) through fun challenges like NitroType Pro, Save the Captain, Fast Type Racer and master the art of typing while enjoying every keystroke!

Perfect for both kids and adults, typing games make practice an adrenaline-induced experience.

Typingbird offers interactive keyboard games tailored specifically to match your typing ability, helping you master fast typing skills more easily than ever.

No matter if you are an absolute beginner or looking to improve touch typing techniques, our games provide an effective way to advance at your own pace and improve at lightning speed. Get ready to type faster than ever.

Best Typing Games for Newbies and Experienced Users
Our Online keyboarding games can significantly help to increase keyboarding skills, no matter whether you are just starting out or already an old hand.

Games on touch typing for beginners have structured difficulty levels that helps enhance their wpm.

Experienced users may enjoy touch typing games featuring competitive elements or time trials which push speed and test reflexes further.

These games are created to test and perfect existing skills, offering an exciting way to maintain and increase typing efficiency.

Elementary School: The Catalyst for Early Typing Training
Keyboarding engages all three senses at once.
Kids use their vision to find keys while keeping an eye on the screen to track their progress as they type.
The sound of each key being struck serves as confirmation of accurate input, reinforcing learning through auditory feedback.
Tactile interaction allows students to press keys with their fingers for increased hand-eye coordination to ensure their accuracy.
Keyboarding requires coordination between sight, sound and touch, making typing an all-encompassing skill in today’s world ruled by digital devices.
In educational settings involving kindergarteners as well as elementary students, devices like laptops, Chromebooks, PCs or tablets have become indispensable resources (there is no running from it, sorry parents).

Although young learners don’t need to touch-type immediately, becoming acquainted with a keyboard is very beneficial.

Our educational curriculum provides fun typing game for PC that beginners can use to help them get acquainted with this skill. We even have a free typing tutor that can help to build concentration and keyboarding skills by engaging kids’ muscle memory through a collection of typing competition like games.

Kids learn to pair words and letters on the keyboard without prior typing knowledge to lay a solid foundation for effective touch-typing in later years like high school.

This positive gaming experience gives kids an enjoyable way to experience typing, setting them on their path toward advanced skills as best typing ninjas as they mature.

