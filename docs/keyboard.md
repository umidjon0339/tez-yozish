# Keyboard visualization — `components/keyboard/`

Two SVG layers stack inside a `.kb-stage` wrapper under the typing arena:
the **keycap layer** (`new_keyboard.tsx`, `NewKeyboard`) at `z-0` and the
translucent **hands layer** (`hands.tsx`, exported as `Keyboard`, imported
as `HandsKeyboard`) at `z-10`. They share one id vocabulary defined in
`keymap.ts` and are themed by the `--fz` finger-zone CSS variables in
`app/globals.css`.

The composite is `KeyboardWithHands` (defined inside
`app/lesson/[id]/page.tsx`), the only consumer of both layers.

## 1. `keymap.ts` — the single source of truth

Maps `KeyboardEvent.key` values (lowercased at call sites) to SVG element
ids. Shifted symbols alias to their physical key (`!`→`key-1`, `{`→
`open-bracket`, `:`→`semicolon`, …). Letters a–z are *not* in the map — call
sites fall back to the char itself as the id. Named keys: `backspace`,
`tab`, `capslock`, `enter`, `control`, `shift`→`shift-left` (default),
`alt`→`alt-left`, `altgraph`→`alt-right`, `meta`→`win`, `' '`→`space`.

Also exports:
- `LEFT_HAND_KEYS: Set<string>` — ids typed by the left hand; decides which
  neutral hand hides when a pose shows, and which pinky presses Shift.
- `requiresShift(char)` — true for capitals and shifted symbols (US layout).
- `shiftIdFor(targetId)` — Shift is pressed by the **opposite** hand's
  pinky: left-hand key → `shift-right`, else `shift-left`.

## 2. `NewKeyboard` (keycap layer)

Props: `expectedKey: string | string[] | null`, `activeKeys?: string[]`,
`offsetX?/offsetY?/scale?` (viewBox pan/zoom over a fixed 683.3×254
baseline), `lastPress?: { key, isCorrect, id }`.

All highlighting is **imperative DOM mutation** via `svgRef` in effects — no
React re-render of the SVG tree:
- Effect on `[expectedKey, activeKeys]`: clears all `.active`/`.pressed`,
  then adds `.active` to `path#<id>` (resolved through `KEY_ID_MAP` with
  char fallback) and its legend `text#text-<id>`; if `requiresShift`, also
  activates the opposite Shift. `activeKeys` get `.pressed`.
- Effect on `[lastPress]`: adds `.correct`/`.incorrect` to the pressed path,
  removed after 100 ms (with cleanup). `lastPress.id` exists so repeating
  the same key still re-triggers the flash (new object identity).

The inline `<style>` block is the styling contract: keycaps hold their zone
color at `fill-opacity: 0` (not `fill: none`) so tints can fade in;
`path.active` fills with `var(--fz, #3b82f6)` and pulses via a drop-shadow
on `currentColor` (a `var()` inside `@keyframes` resolved wrongly);
`.pressed/.correct/.incorrect` have `transition: none` (instant feedback);
the MacBook case (`.kb-case`) sits outside `#keys` so colorful tints never
touch it.

Markup: `<g id="keys">` has one `<path id="…">` per keycap using exactly the
keymap ids; `<g id="letters">` holds legends (`text-<id>` ids for word
legends).

## 3. `Keyboard` / hands layer (`hands.tsx`, ~2400 lines)

**Established project rule: never edit the SVG path `d=` data.** The hand
poses are hand-authored art; all visual changes (colors, opacity, themes)
go through the inline `<style>` block only. Same rule applies to
`new_keyboard.tsx` geometry.

Structure: one `<g id="<keyId>">` per key (ids match keymap), each holding a
full hand pose reaching for that key with the correct finger already drawn
extended; plus `neutral-left`/`neutral-right` resting poses. Shared poses
live in `<defs>` as `<g id="pose-…">`, instantiated by `<use href>` with a
horizontal translate (e.g. `pose-a` serves both `#a` and `#capslock`).

Animation = **group visibility toggling**, nothing else. Effect on
`[expectedKey]`: show both neutral hands, hide all poses; resolve the target
id (`singleChar` → `KEY_ID_MAP` fallback); show that pose group and hide the
corresponding neutral hand (`LEFT_HAND_KEYS` decides which); if the char
`requiresShift`, additionally show the opposite `shift-*` pose.

Style classes: `.st0` hidden, `.st1` frosted-glass hand fill
(`rgba(255,255,255,0.55)` + soft drop shadow), `.st2` outline, `.st3/.st4`
shading, **`.st5` = the guide finger** — a single steady stroke colored
`var(--fz, var(--hands-accent, #3b82f6))`; deliberately no glow and no
opacity pulse (documented in the comment). Theme classes on the root svg:
`theme-bone` (default light), `theme-dark`, `theme-robot`, `theme-kingfish`
— each sets `--hands-accent` and restyles the fill/outline.

Geometry baseline (825×306.68, anchored at −53.86, 110.2) differs from the
keycap layer, so alignment depends entirely on the constants in the lesson
page: `KEYBOARD_CONFIG = { scale: 0.75 }` and `HANDS_CONFIG =
{ scale: 1.33, offsetX: 37, offsetY: 105 }`. Changing one layer's transform
means re-tuning the other.

## 3b. Hand styles — `classic`, `slim`, `realistic`, `female`

The learner picks which hand drawing they get, from a dropdown in the lesson
header. All four are the *same artwork*, so every pose still points at the key
it was drawn for. Two independent axes vary — geometry and shading:

| Style | Art variant (component) | Theme |
|---|---|---|
| `classic` | `hands.tsx` | light/dark pair |
| `slim` | `handsSlim.tsx` | light/dark pair |
| `realistic` | `handsSlim.tsx` | `theme-flesh` |
| `female` | `handsFemale.tsx` | `theme-rose` |

`realistic` adds no geometry at all — it is `slim` wearing a different theme.
`HAND_STYLES` in `handStyle.ts` carries `variant` (which component) and
optional `theme` (which replaces the usual light/dark pair, keeping
`theme-dark` only as a modifier); the lesson page resolves the variant through
`HANDS_BY_VARIANT`. Adding a style is one entry there plus a thumbnail — and a
`PROFILES` entry too, if it needs new geometry.

| File | Role |
|---|---|
| `hands.tsx` | the `classic` hand — **the source of truth, edit this one** |
| `skinTones.mjs` | every skin-tone hex (flesh + rose) — **edit colors here** |
| `handsSlim.tsx`, `handsFemale.tsx` | reshaped hands — **GENERATED, never hand-edit** |
| `scripts/lib/hand-profiles.mjs` | the shapes: how deep to erode, per variant |
| `handStyle.ts` | which style is active (`localStorage["tz-hand-style"]`) |
| `HandStyleSwitcher.tsx` | the header dropdown |
| `public/hands/*.svg` | standalone copies + the picker thumbnails |

The generated components come from `npm run build:hands`, which rewrites only
the path `d` data and copies classes, theme rules, the `--fz` guide colour and
the pose-toggling effect through untouched. That parity is deliberate: the
lesson page swaps `<Keyboard />` for another component and nothing else has to
change — same props, same viewBox, so `HANDS_CONFIG` covers every variant.

**After editing `hands.tsx`, run `npm run hands:rebuild`** or the reshaped
variants silently keep the old geometry.

How the reshaping works (`scripts/lib/hand-geometry.mjs`): each silhouette is
eroded along its own normals, deepest at the fingertip end and tapering to
almost nothing at the wrist, so fingers lose real width while the palm keeps
its mass — that gradient *is* the taper. A pose is not one path, though: it is
a silhouette, an outline tracing the same contour, tendon lines, guide
highlights and shading blobs. Moving only the silhouette tears them apart, so
its displacement becomes a field the other paths sample, fading with distance.

| Profile | inset (fingers → wrist) | worst-case point movement |
|---|---|---|
| `slim` | 2.5 → 0.7 | 2.48 units = 4.9% of a key |
| `female` | 4.1 → 1.5 | 4.07 units = 8.0% of a key |

Those movement figures are the honesty check — measure them after any change to
`PROFILES`, because they are what keep each pose pointing at its own key.

Two traps if you retune it: tangents must be measured over an arc-length window
(anchors here are spaced very unevenly, and adjacent-anchor tangents kink the
offset at fingertips), and the displacement field needs *dense* samples or
paths that used to sit on the contour drift off it.

Each reshaped component is ~470 KB of path data, so the lesson page loads them
through `next/dynamic` — verified that picking `classic` fetches none, `slim`
and `realistic` fetch only `handsSlim`, and `female` only `handsFemale`.

### The `theme-flesh` (realistic) and `theme-rose` (female) looks

Every hex these looks use — gradients, crease lines, nails, the filter
floods — lives in **`skinTones.mjs`** (`SKIN.flesh`, `SKIN.rose`,
`SKIN_LIGHTING`). `hands.tsx` interpolates it into its style block and defs;
`scripts/hands-previews.mjs` bakes it into the picker thumbnails;
`scripts/extract-hands-svg.mjs` resolves the refs when exporting the
standalone svg. To recolor a hand, change the palette there and run
`npm run hands:rebuild` — never touch the hexes anywhere downstream.

Skin tone plus two lighting filters in the `hands.tsx` `<defs>`. The
non-obvious part is *why there are two*: the silhouette is a **single path**
covering the whole hand, so edge shading can never separate one finger from the
next — the gaps between fingers are `.st2` lines, not silhouette edges.

- `#hands-flesh` on `.st1`: inverts the alpha, blurs it once, and keeps what
  falls back inside — a dark band along every outer edge. The *same* blurred
  buffer offset down-right lights the upper-left rim (offsetting before or
  after a blur is equivalent, so one blur does both). A final `feFuncA` ramp,
  not `fill-opacity`, sets the translucency, so the shading is computed at full
  strength and faded once.
- `#hands-crease` on `.st2`: gives each crease line an offset shadow and a
  facing highlight, turning it into a rounded valley. This is what actually
  makes the fingers read as separate tubes, which lets the drawn line drop to
  `stroke-opacity: 0.45` instead of reading as ink.

`theme-rose` reuses both filters over a pinker gradient, with a finer line and
`.st3` lifted from 0.45 so the nail shapes the artwork already carries read.
There are no *added* nails: fingertip detection on these contours (turning-angle
and radial-maxima) both misfired badly enough that auto-placed nails would land
mid-finger on some of the 58 poses, so nails would have to be authored per pose.

**These re-rasterise on every keystroke**, so they are written for that budget:
one Gaussian blur each, tight filter regions, and
`color-interpolation-filters="sRGB"` — the linearRGB default converts the whole
buffer twice per filter and cost as much as a blur here. Measured over 60 pose
swaps, the filtered styles sit about one frame above `classic` — median 33-50 ms
against 33.3 ms, where 33.3 ms is the double-`requestAnimationFrame`
measurement floor, and p95 67 ms against 34-50 ms. Before optimisation
`realistic` was 66.6/149.9 ms. If you touch
these filters, re-measure — it is easy to add a frame without noticing.

## 4. `--fz` finger-zone theming (`app/globals.css` + `PaletteSwitcher`)

- Nine per-finger variables `--fz-l-pinky … --fz-r-pinky` defined on
  `:root` (light) and `.dark` (brighter). Selectable palettes override them
  via `:root[data-fz="classic-plus" | "vivid" | "soft"]`; no attribute =
  "Classic".
- Key → finger assignment: `.kb-stage :is(#key-1, #q, #a, …) { --fz:
  var(--fz-l-pinky) }` etc. The bare `#id` selectors intentionally match
  **both** the keycap `path#id` and the hands pose `g#id`, so `--fz`
  inherits into whichever SVG sits inside `.kb-stage`. Outside `.kb-stage`
  the hands fall back to `--hands-accent`.
- Colorful mode: `.colorful-mode #keys path { fill: var(--fz);
  fill-opacity: .22 }` (`.32` dark) — `fill-opacity` keeps outlines/legends
  crisp; scoping to `#keys` excludes the case and hands.
- `components/PaletteSwitcher.tsx`: dropdown storing the choice in
  `localStorage["tz-fz-palette"]` and mirroring it to `data-fz` on `<html>`
  (applied pre-paint by the boot script in `app/layout.tsx`). Its `PALETTES`
  swatch arrays **duplicate** the light `--fz-*` values — keep them in sync
  with globals.css by hand. It is mounted in the **lesson workspace
  header** (not the navbar), with `onSelect={() => setIsColorful(true)}`.

## 5. Consumers

- `KeyboardWithHands` (lesson page): renders `NewKeyboard` always and
  `HandsKeyboard` when `isHandsVisible`, toggling `theme-dark`/`theme-bone`
  by dark mode and `colorful-mode` on the `.kb-stage` div. Mounted by all
  five non-game viewport arenas.
- `Mascot` (`components/Mascot.tsx`): stateless SVG ninja mascot with
  `mood: happy | focused | oops | celebrate`; used on the lesson results /
  locked / 404 screens and the ninja game menu. Not part of the keyboard
  stack but shares the "SVG art, style-only edits" spirit.

## Invariants

- **Never edit path `d=` data** in `hands.tsx` or `new_keyboard.tsx`;
  restyle via the inline `<style>` blocks and CSS variables only.
- The keymap ids are load-bearing across three places: keycap `path#id`,
  hands `g#id`, and the `.kb-stage :is(…)` finger lists in globals.css.
  Adding a key touches all three (plus `text#text-<id>` legends).
- Both components are `memo`'d with shallow comparison: parents must keep
  `expectedKey`/`activeKeys`/`lastPress` referentially stable, and a
  repeated key press must come with a new `lastPress.id`.
- `--fz` only resolves inside `.kb-stage`; hands rendered elsewhere use the
  `--hands-accent` theme fallback.
- `PaletteSwitcher.PALETTES` swatches mirror the globals.css `--fz-*` light
  values — update both together.
