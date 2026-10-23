# Thumbnail registry — parametric SVGs

Course/section/lesson cards reference art by string id + params in
`data/lessons.json`:

```json
"thumbnail": { "svgId": "TWO_KEYS_FOCUS",
               "parameters": { "keys": ["f","j"], "accentColor": "emerald" } }
```

`components/thumbnails/DynamicThumbnail.tsx` looks `svgId` up in
`ThumbnailRegistry` (bottom of `SvgLibrary.tsx`) and renders the component
with `params`. Missing ids log a warning and render a visible neutral
fallback — **never crash**.

## Contracts

- `types/thumbnail.ts`: `SvgTemplateProps = { params?: ThumbnailParams;
  className?: string }`. **Every `ThumbnailParams` field must stay
  optional** with an in-component default: `keys?`, `accentColor?
  ('emerald'|'blue'|'red'|'amber'|'slate')`, `pulseEffect?`, `enemyCount?`,
  `targetWPM?`, `showClock?`.
- All templates draw in `viewBox 0 0 400 240`, honor
  `prefers-reduced-motion`, and namespace their `<style>`/filter ids with
  `React.useId()` so multiple instances don't collide.
- The validator scrapes registry ids from `SvgLibrary.tsx` by regex — keep
  the `'ID': Component` literal format in `ThumbnailRegistry`.
- Raster alternative: `thumbnail.imageSrc` renders a plain `<img>` (the
  course cover uses `/course-cover.svg`). **Lesson** thumbnails lose
  `imageSrc` in normalization — only `svgId` survives for lessons
  (course/section keep both). Lesson cards fall back to `TWO_KEYS_FOCUS`
  when no thumbnail is set.

## Two kinds of cover — and only one of them is themed

- **UI covers** — `TWO_KEYS_FOCUS`, `RHYTHM_LOOP`, `PRECISION_TARGET`,
  `SECTION_KEYS_SHOWCASE`, `LETTER_STAGE`, `CODES_STAGE`, `PHONEME_STAGE`,
  `GRAPHEME_STAGE`, `GRADE_COVER`, `SUBJECT_COVER`. These draw the
  product's own UI (a panel, keycaps,
  legends), so a white panel on a dark card reads as a hole. Their neutrals
  come from CSS variables defined in `app/globals.css` and flipped by
  `.dark`:

  | variable | light | dark | used for |
  |---|---|---|---|
  | `--thumb-panel` / `-cool` / `-warm` | `#f4f4f5` / `#f1f5f9` / `#fffbeb` | `#17171a` / `#14161a` / `#221a08` | the 400×240 card background |
  | `--thumb-key` / `--thumb-key-2` | `#ffffff` / `#fafafa` | `#3f3f46` / `#52525b` | keycap faces |
  | `--thumb-edge` / `-cool` | `#e4e4e7` / `#e2e8f0` | `#71717a` / `#64748b` | cap edges, tracks |
  | `--thumb-dim` | `#d4d4d8` | `#52525b` | inactive dots, dashed rules |
  | `--thumb-ink` / `-cool` / `-soft` | `#18181b` / `#0f172a` / `#a1a1aa` | `#fafafa` / `#f8fafc` / `#c4c4cc` | legends |
  | `--thumb-amber-track` / `-ink` | `#fde68a` / `#d97706` | `#4a3a12` / `#fcd34d` | speedometer arc + badge |

  Dark legends land at ~10:1 on the cap. Every cap also carries a
  `var(--thumb-edge)` stroke, because the `feDropShadow` that separated it
  from the panel in light mode does nothing on black.

  **Accent hues stay literal** (`#10B981`, `#0EA5E9`, `#F59E0B`, `#8B5CF6`,
  …) — they're saturated enough to hold up on both backgrounds.

- **Scene covers** — the game art (`NINJA_ARENA_COVER`,
  `MINION_BOSS_COVER`, `SKY_HOP_COVER`, `BEAM_BREAK_COVER`,
  `ALIEN_DROP_COVER`, `STAR_TYPE_COVER`, `TUG_OF_TYPING_COVER`,
  `RHINO_DASH_COVER`, `COURSE_FOUNDATIONS_COVER`). These are pictures of a
  place (a desert at noon, a blue sky). They keep their painted palettes in
  both themes, the same way a photo would.

## Registered templates

| svgId | Params used | Draws |
|---|---|---|
| `TWO_KEYS_FOCUS` | `keys` (def `['f','j']`), `accentColor` | N white keycaps with accent glow + dot; keys press down on hover |
| `RHYTHM_LOOP` | `keys[0..1]`, `accentColor` | figure-8 loop track between two circular key pills; dashes flow on hover |
| `PRECISION_TARGET` | `targetWPM` (def 15) | amber speedometer arc + needle + `{wpm} WPM` badge |
| `NINJA_ARENA_COVER` | `keys` as word tags (ignores `enemyCount`/`accentColor` despite receiving them) | always-animated desert scene: running ninja, spinning shurikens, skeleton wave, word tags, lives HUD |
| `MINION_BOSS_COVER` | `accentColor` (def red), `enemyCount` (def 20 → `TARGETS: N` chip), `keys` | hover-animated variant of the ninja scene for lesson cards |
| `COURSE_FOUNDATIONS_COVER` | none (ignores all) | static blue poster: F/G/H/J blocks, keyboard chassis, cartoon hands. Registered but currently unused by data |
| `SECTION_KEYS_SHOWCASE` | `keys` (def `['f','j']`) | N keycaps over hard green floor shadows; staggered press on hover |
| `BEAM_BREAK_COVER` | `keys` (def `['b','e','a','m']`, first 4) | always-animated dune-desert scene for `/beam-break`: bobbing UFO with a scanning tractor beam, a cute animal lifted inside it, big low sun, palms, and the keycap tile row in its typed/current/pending colours |
| `GRADE_COVER` | `grade` (def 1), `tone` | one K-12 grade card: two accent washes, a lucide `GraduationCap` corner mark, the grade numeral at ~150px (126px for the two-digit 11) and a small book-shelf ornament. Numeral scales and the washes drift on hover |
| `SUBJECT_COVER` | `subjectIcon` (def `book`), `tone` | one K-12 subject card: accent-washed panel, corner marks, and a raised `--thumb-key` tile carrying the subject's lucide glyph. Tile lifts on hover |
| `EXAM_COVER` | `codeIcon` (def `Award`), `codeLine` (the score range), `tone` | one `/courses` exam card: a score sheet with a coloured tab, the exam's lucide glyph, its score range in monospace and two ruled answer lines. The range is the **only** text baked in, because it is the one string that is identical in every locale. Lifts on hover |
| `BOOK_COVER` | `tone` | one `/books` card: a cover board with a shaded spine, page edges behind it, and three abstract "title" bars. Carries **no text** — the real title is localized or learner-supplied and is printed on the card below the art. Tilts on hover |
| `CODE_TRACK_COVER` | `codeIcon` (def `FileCode2`), `codeLine`, `tone` | one `/coding` track: an editor window (title bar + dots) holding the track's lucide glyph and its real `sample` line in monospace, with a blinking accent caret. The font size is computed from the line length so any sample up to ~45 chars stays on one row; the window lifts on hover |

### The two K-12 covers use lucide glyphs, not hand-drawn paths

`GRADE_COVER`/`SUBJECT_COVER` (added for the `/courses` grade→subject tree,
`lib/k12.ts`) render lucide components as a **nested `<svg x y width
height>`** inside the 400×240 root — lucide spreads unknown props onto its
own `<svg>`, so `x`/`y` position it. That keeps the repo's "no hand-rolled
inline SVGs for standard glyphs" rule for the 19 subject emblems. Their
accents come from `TONE_HEX` (12 literal hues) keyed by the `tone` param —
`SUBJECT_GLYPHS`/`TONE_HEX` in `SvgLibrary.tsx` are the lookup tables, and
`SUBJECT_ART` in `lib/k12.ts` decides which subject gets which pair. An
unknown `subjectIcon` falls back to `BookOpen`, an unknown `tone` to slate.

Shared internal art helpers (not registered): `ninjaFigure`,
`skeletonFigure`, `letterTag`, `keyLabel` (special-key → glyph). The ninja
covers deliberately mirror the real 3D models (`hero.glb`/`enemy.glb`).

## Adding a template

1. Write a `React.FC<SvgTemplateProps>` in `SvgLibrary.tsx` following the
   contracts above (defaults for every param, `useId`-namespaced styles,
   reduced-motion guard).
2. Register it in `ThumbnailRegistry` as `'MY_ID': MyComponent`.
3. Reference it from `lessons.json` and run `npm run validate:lessons`
   (validates the id exists).

