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

## Inert files

`components/thumbnails/svgsprite-*.svg` are unreferenced assets — safe to
ignore.
