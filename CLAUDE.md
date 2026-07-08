# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Next.js version warning

This project runs **Next.js 16 / React 19**. APIs differ from older training data. Before writing framework code, read the relevant guide under `node_modules/next/dist/docs/` (see `AGENTS.md`). Notably, route `params` and `searchParams` are **Promises** — unwrap them with React's `use()` (see `app/courses/[id]/page.tsx`) rather than accessing properties synchronously; client pages use the `useParams()` hook instead (see `app/lesson/[id]/page.tsx`).

## Commands

```bash
npm run dev     # dev server at http://localhost:3000
npm run build   # production build
npm run start   # serve production build
npm run lint    # eslint (flat config, eslint-config-next core-web-vitals + typescript)
```

There is no test runner configured. `scripts/validate-lessons.mjs` (when present) validates lesson data via `npm run validate:lessons`.

## Architecture

This is a touch-typing trainer ("tez/yozish"). Three pillars: a JSON-driven curriculum engine, a parametric SVG thumbnail registry, and a self-contained 3D arcade game.

### Curriculum is data, not code

The entire course lives in **`data/lessons.json`**, written in the **v4 authoring format** (5-tier hierarchy **Course → Chapter → Section → Lesson → Step**, uniform `id`/`title` keys, no `*Number` fields, step `text` as one space-separated string, `mode` presets instead of raw rules). The spec is **`data/lessondoc.txt`** (v4) — read it before editing lesson content, and run `npm run validate:lessons` after.

**`lib/curriculum.ts`** normalizes the v4 source (`*Source` types in `types/lesson.ts`) into the runtime model (`CourseNode`, `ChapterNode`, `SectionNode`, `LessonNode`, `StepNode`): it derives numbers from array order, generates step ids, splits `text` into `content` tokens, expands `mode` presets into `StepRules`, and derives `unlockedKeys`. Pages import `course` from `@/lib/curriculum` — never the raw JSON.

Key conventions:
- All user-facing text is a `LocalizedString { en, uz, ru }` — all three locales are required (enforced by the validator).
- Every step has a `viewport` field (`ViewportMode`) that selects which UI mounts at runtime: `POSTURE_CHECK`, `KEY_INTRO`, `STANDARD_GYM`, `GAME_NINJA_RUN`.
- Lesson `type` is one of `lesson` / `practice` / `test` / `game`. All per-type behavior (graded or not, default `passStars`, group labels/order, badge icon) is centralized in **`lib/lessonTypes.tsx`** — `lesson` and `practice` are ungraded (completing = passing, no stars), `test` and `game` earn 0–5 stars. Adding a type = one config entry there + the `TYPES` list in the validator.
- Lesson progress/stars persist in `localStorage` via **`lib/progress.ts`** (`tz-progress-v1`; star rules and standard 5-chars-per-word WPM live in `computeLessonResult`).

### The lesson runtime

`app/lesson/[id]/page.tsx` (~1500 lines, `"use client"`) is the core typing engine. It finds the lesson by `lessonId` in the JSON, then renders per-step by branching on `step.viewport`. Character state is tracked with numeric constants (`UNTYPED`/`CORRECT`/`INCORRECT`/`CORRECT_FIXED`) and imperative letter handles (`useImperativeHandle`) for zero-latency per-keystroke DOM updates rather than re-rendering the whole text. It composes the keyboard visualizations (`components/keyboard/`) and plays mp3 keystroke/error sounds from `public/`. Sidebar open/closed state persists in `localStorage`.

Keyboard components (all `memo`'d, driven by an `expectedKey` prop): `new_keyboard.tsx` (`NewKeyboard`, the primary one) and `hands.tsx` (`Keyboard`, the animated hands overlay — largest component).

### Thumbnail registry (parametric SVGs)

Course/section/lesson cards reference a thumbnail by string id + params in the JSON:
```json
"thumbnail": { "svgId": "TWO_KEYS_FOCUS", "parameters": { "keys": ["f","j"], "accentColor": "emerald" } }
```
`components/thumbnails/DynamicThumbnail.tsx` looks `svgId` up in **`ThumbnailRegistry`** (bottom of `SvgLibrary.tsx`) and renders the matched component, passing `params`. Missing ids render a visible fallback, never crash.

To add a thumbnail: write a `React.FC<SvgTemplateProps>` in `SvgLibrary.tsx` (props typed in `types/thumbnail.ts`; **every `ThumbnailParams` field must stay optional** with a default), then register it in `ThumbnailRegistry`. A thumbnail can alternatively be a raster via `thumbnail.imageSrc` (e.g. the course cover uses `/cource01.png`).

### The game (independent of the lesson engine)

- **`/typing-ninja`** → `app/typing-ninja/NinjaWorld.tsx` (~1400 lines): 3D WebGL survival game using `@react-three/fiber` + `drei` + `three`. Loaded via `next/dynamic` with `ssr: false` (also embedded in the lesson runtime for `GAME_NINJA_RUN` steps).

The game embeds its own inline `SoundSynthesizer` class (Web Audio API oscillators), separate from the lesson runtime's mp3-file playback.

### Inert files (safe to ignore)

- `components/thumbnails/svgsprite-*.svg` are unreferenced assets.

## Conventions

- Import alias `@/*` maps to the repo root (`tsconfig.json`), e.g. `@/data/lessons.json`, `@/components/...`.
- Interactive pages are `"use client"`; static list pages (`app/courses/page.tsx`, `app/games/page.tsx`) are server components.
- Styling is Tailwind CSS v4 (via `@tailwindcss/postcss`), utility classes inline. The visual language is a monochrome "Notion-style" neutral palette (`#FAFAFA` background, `neutral-*`) with mono/sans fonts (`Inter`, `JetBrains_Mono`) wired in `app/layout.tsx`.
