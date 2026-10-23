# Keyboard visualization — `components/keyboard/`

Two SVG layers stack inside a `.kb-stage` wrapper under the typing arena:
the **keycap layer** (`NewKeyboard.tsx`, `NewKeyboard`) at `z-0` and the
translucent **hands layer** (`hands.tsx`, exported as `Keyboard`, imported
as `HandsKeyboard`) at `z-10`. They share one id vocabulary defined in
`keymap.ts` and are themed by the `--fz` finger-zone CSS variables in
`app/globals.css`.

The composite is `KeyboardWithHands` in
**`components/keyboard/KeyboardStage.tsx`** — the only place that knows how
the two different viewBox baselines line up (`KEYBOARD_CONFIG` /
`HANDS_CONFIG`, retune together). Consumers: the lesson runtime
(`app/lesson/[id]/page.tsx`, which overrides the numbers through its
`config` / `LayoutConfig` prop) and the home page hero (`app/page.tsx`,
lazy-loaded with `next/dynamic` so the landing page doesn't ship ~0.5 MB of
path data up front). `components/english/stage-kit.tsx` still carries its own
older copy for the English units (no hand styles/colors) — fold it into this
one if you touch it.

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

Keycap geometry is a rounded rect written by hand, all on the same grid: the
bottom row runs `y 191 → 239` (`v-42` + 3-unit corners), and the arrow
cluster splits that height — `arrow-left`/`arrow-right` are full-height like
`control-right`, `arrow-up`/`arrow-down` are the half-height pair between
them (`v-16.8`, split at y 213.8/216.2). A cap's glyph is centred on the cap:
the ◀/▶ triangles sit at y 212.3 (centre of the full height), ▲/▼ at 199.5 /
224.9. **Changing a cap's size is the one reason to touch `d=` here** (see
§9) — keep the corner curves identical to the neighbouring cap you're
matching and move its legend with it.

## 3. `Keyboard` / hands layer (`hands.tsx`, ~2400 lines)

**Established project rule: never edit the SVG path `d=` data.** The hand
poses are hand-authored art; all visual changes (colors, opacity, themes)
go through the inline `<style>` block only. Same rule applies to
`NewKeyboard.tsx` geometry.

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

## 3b. Hand styles — `classic`, `female`

The learner picks which hand drawing they get, from a dropdown in the lesson
header. Both styles are the *same* poses, so every pose still points at the
key it was drawn for — but `female` draws with anatomically reshaped geometry
(slender tapered fingers, narrower palm, slimmer wrist — modeled on average
male/female hand differences) plus the rose skin:

| Style | Art (component) | Theme |
|---|---|---|
| `classic` | `hands.tsx` | light/dark pair |
| `female` | `handsFemale.tsx` (generated) | `theme-rose` |

`HAND_STYLES` in `handStyle.ts` carries `variant` (which component) and
optional `theme` (which replaces the usual light/dark pair, keeping
`theme-dark` only as a modifier); the lesson page resolves the variant through
`HANDS_BY_VARIANT`. Adding a style is one entry there plus a thumbnail — and a
`PROFILES` entry too, if it needs new geometry.

| File | Role |
|---|---|
| `hands.tsx` | the hand artwork — **the source of truth, edit this one** |
| `skinTones.mjs` | every skin-tone hex (`SKIN.rose`) — **edit colors here** |
| `handsFemale.tsx` | the reshaped hand — **GENERATED, never hand-edit** |
| `scripts/lib/hand-profiles.mjs` | the shape: how deep to erode |
| `handStyle.ts` | which style is active (`localStorage["tz-hand-style"]`) |
| `handColor.ts` | per-style custom color + opacity (`tz-hand-colors-v1`, `tz-hand-opacity-v1`) |
| `HandStyleSwitcher.tsx` | the header dropdown (styles + color swatches) |
| `public/hands/*.svg` | standalone copies + the picker thumbnails |

The generated component comes from `npm run build:hands`, which rewrites only
the path `d` data and copies classes, theme rules, the `--hand-*`/`--fz` color
plumbing and the pose-toggling effect through untouched. That parity is
deliberate: the lesson page swaps `<Keyboard />` for `<FemaleKeyboard />` and
nothing else has to change — same props, same viewBox, so `HANDS_CONFIG`
covers every variant and the custom-color variables land on the reshaped art
too. It is ~480 KB of path data, so the lesson page loads it through
`next/dynamic` — picking `classic` fetches nothing extra.
**After editing `hands.tsx`, run `npm run hands:rebuild`** or the reshaped
variant silently keeps the old geometry.

How the reshaping works (`scripts/lib/hand-geometry.mjs`): each silhouette is
eroded along its own normals, deepest at the fingertip end and tapering toward
the wrist, so fingers lose real width while the palm keeps its mass — that
gradient *is* the taper. A pose is not one path, though: it is a silhouette,
an outline tracing the same contour, tendon lines, guide highlights and
shading blobs. Moving only the silhouette tears them apart, so its
displacement becomes a field the other paths sample, fading with distance.
The `female` profile insets 3.2 units at the fingers → 1.3 at the wrist, with
a widened tangent window (13) and extra displacement smoothing (5 passes) —
wobble in the offset scales with depth, and at this depth the defaults leave
fingers visibly lumpy. Keep the fingertip inset ≤ ~4 units (well under half a
key width, ~25 units) so every pose keeps pointing at its own key. Two traps
if you retune it: tangents must be measured over an arc-length window (anchors
are spaced very unevenly, and adjacent-anchor tangents kink the offset at
fingertips), and the displacement field needs *dense* samples or paths that
used to sit on the contour drift off it.

Two guards against background-colored cracks between pressed-together fingers
(the source art keeps hairline slits there — invisible under the translucent
classic look, bright cracks under a skin fill, and erosion widens them):
`closeGaps` in `hand-geometry.mjs` (profile `gapR`/`gapKeep`/`gapArcSep`)
blends near-touching contour walls' displacements and pulls them to ~0.5 units
apart — never let them overlap: the walls wind in opposite directions, so an
overlap winds to zero and the fill rule punches a hole — and `.theme-rose
.st1` additionally *strokes* the silhouette with its own skin gradient
(width 2.8), sealing whatever hairline the geometry pass can't reach on any of
the 58 poses.

### Custom hand colors (`handColor.ts`)

Each style can be painted any color. The switcher dropdown offers preset
swatches (`HAND_COLOR_PRESETS`) plus a native `<input type="color">` for a free
choice; the pick is stored per style in `localStorage["tz-hand-colors-v1"]`
(same `useSyncExternalStore` idiom as `handStyle.ts`; no stored entry = the
style's built-in look).

Rendering: `handTintVars(styleId, hex)` mixes the one base hex into every
derived shade the artwork needs — classic gets a translucent glass fill +
darker outline; female gets gradient ends, crease, nail and all four filter
floods — and returns them as `--hand-*` CSS variables. `KeyboardWithHands`
passes them (memoized: `Keyboard` is `memo`'d, the style prop must stay
referentially stable) as inline `style` on the hands svg. Every color rule in
the `hands.tsx` style block reads `var(--hand-*, <built-in>)`, so unset
variables render the original art; the rose gradient stops and `feFlood`s carry
tiny hook classes (`.skin-top`, `.rose-shadow`, …) whose CSS overrides the
attribute defaults (CSS beats presentation attributes). The attributes stay for
the standalone export — `extract-hands-svg.mjs` strips the hook classes.

Below the swatches sits an opacity slider (20–100%, default 90% — the
`opacity-90` the hands wrapper used to hard-code, now `DEFAULT_HAND_OPACITY`).
The value is stored per style in `localStorage["tz-hand-opacity-v1"]` (default
values are not stored) and applied by `KeyboardWithHands` (KeyboardStage) as inline `opacity`
on the hands wrapper div, so it fades the whole layer — hand fill, outlines
and guide finger together.

A stored style id that no longer exists (e.g. `slim`/`realistic` from an older
visit) falls back to `classic` in `handStyle.ts`'s `getSnapshot`.

**After editing `hands.tsx`, run `npm run hands:rebuild`** so the standalone
svg and the picker thumbnails pick the change up.

### 3c. Finger colors — every finger, not just the pressing one

The last row of the hand-style dropdown is a switch, **"Color every finger"**
(`setFingerColors`/`useFingerColors` in `handColor.ts`,
`localStorage["tz-hand-finger-colors-v1"]`, one flag for all styles because it
is about what the hands *teach*, not how they look — and cleared by
`resetHandAppearance`). Off (the default) only the finger pressing the current
key is colored, by its `.st5` guide outline. On, **every** finger of every
visible hand is drawn in the color of the keys that finger types, so a learner
can read the whole finger assignment off the hands. The colors are the `--fz-*`
finger-zone variables, i.e. exactly the keycap colors — that identity is the
point of the feature, so never give the hands a palette of their own.

The artwork makes this harder than it sounds: **there is no per-finger
geometry.** A pose is one silhouette, one `.st2` contour tracing it, two or
three crease lines, and one `.st5` guide around the pressing finger. So the
colors come from a gradient laid *across* the hand whose stops sit on the
boundaries between finger columns, masked by a second gradient *along* the
fingers that fades the color out before it reaches the palm (the palm keeps its
plain outline). Per pose that is: an axis, four stop offsets and a fade axis —
baked by **`npm run build:finger-bands`** into
`fingerBands.{classic,female}.generated.ts` (~130 KB each, so `hands.tsx`
`import()`s the table only when the switch is first turned on; the variant build
repoints that specifier, and the standalone `public/hands/*.svg` export does not
carry the feature).

At runtime `paintBand` (`fingerBands.ts`) mutates one gradient/mask set per
visible hand — two are rendered, enough for a pose plus a Shift pose or a
resting hand. Stop colors stay as `var(--fz-…)` so the palette switcher and dark
mode keep working. Nothing re-renders per keystroke, same as pose toggling.

How the boundaries are derived (`scripts/lib/finger-bands.mjs`) — every rule
there is a scar, so read before retuning:

- The **axis along the fingers is the contour's principal axis**, not the guide
  path's direction. A finger reaching sideways swings the guide by 30°+, which
  rotated the whole frame and collapsed the bands.
- The hand's **width is measured across the knuckles** (25–62% along that
  axis), not the whole drawing — a stretched finger sets the outermost point of
  the contour, and measuring there squeezed all four resting fingers into one
  band. If that slice comes back a sliver (< 55% of the full width, which
  happens on steeply angled poses) it falls back to the full contour.
- Boundaries **start at `DEFAULT_SPLIT`** and are only nudged from there:
  snapped onto a crease or a contour slit within `SNAP`, and shifted bodily by
  the guide path's two endpoints. Deriving them from evidence alone and
  extrapolating the rest was the original design and it blew up — one bad
  anchor threw the other three boundaries off the hand.
- Guide endpoints are **rejected unless the finger width they imply is
  believable** (`MIN/MAX_FINGER_SHARE`).
- **Fingertip detection is not used at all.** It misfires on curled poses, the
  same reason this doc gives for not auto-placing nails.
- The **pressing finger is drawn last, from its own guide path**, in its own
  zone color (`guide`/`guideZone` in the table). On `j`, `y` or `1` that finger
  reaches *across* its neighbours, where no left-to-right band model can place
  it — and it is the finger the learner is being told to move, so it is never
  left to the gradient.

`npm run build:finger-bands -- --sheet` writes `.next/finger-bands.svg`, all 68
poses rendered with their colors; `-- --check` lists poses where a band holds
almost no hand, with the stop fractions and the evidence it found. Poses the
automatic pass still gets wrong are pinned by hand in
`scripts/lib/finger-band-overrides.mjs` (four fractions, pinky→thumb, 0 = the
pinky edge of the hand). **Known remaining: `j`, `c`, `i`, `key-1`, `tilda` put
one or two resting fingers in a neighbour's color** — on those the derived width
axis is itself unstable, so pinning fractions against it is fragile; fix the
axis for them before hand-authoring numbers.

### The `theme-rose` (female) look

Every hex this look uses — gradient, crease lines, nails, the filter floods —
lives in **`skinTones.mjs`** (`SKIN.rose`, lighting included). `hands.tsx`
interpolates it into its style block and defs; `scripts/hands-previews.mjs`
bakes it into the picker thumbnails; `scripts/extract-hands-svg.mjs` resolves
the refs when exporting the standalone svg. To recolor the hand, change the
palette there and run `npm run hands:rebuild` — never touch the hexes anywhere
downstream.

Skin tone plus two lighting filters in the `hands.tsx` `<defs>`. The
non-obvious part is *why there are two*: the silhouette is a **single path**
covering the whole hand, so edge shading can never separate one finger from the
next — the gaps between fingers are `.st2` lines, not silhouette edges.

- `#hands-rose` on `.st1`: inverts the alpha, blurs it once, and keeps what
  falls back inside — a dark band along every outer edge. The *same* blurred
  buffer offset down-right lights the upper-left rim (offsetting before or
  after a blur is equivalent, so one blur does both). A final `feFuncA` ramp,
  not `fill-opacity`, sets the translucency, so the shading is computed at full
  strength and faded once.
- `#hands-crease-rose` on `.st2`: gives each crease line an offset shadow and a
  facing highlight, turning it into a rounded valley. This is what actually
  makes the fingers read as separate tubes, which lets the drawn line drop to
  `stroke-opacity: 0.45` instead of reading as ink.

The floods are `SKIN.rose`'s own rosy lighting (a warm-brown lighting set, as
the old flesh theme used, reads muddy on the pink skin). `.st3` is lifted from
0.45 so the nail shapes the artwork already carries read.
There are no *added* nails: fingertip detection on these contours (turning-angle
and radial-maxima) both misfired badly enough that auto-placed nails would land
mid-finger on some of the 58 poses, so nails would have to be authored per pose.

**These re-rasterise on every keystroke**, so they are written for that budget:
one Gaussian blur each, tight filter regions, and
`color-interpolation-filters="sRGB"` — the linearRGB default converts the whole
buffer twice per filter and cost as much as a blur here. Measured over 60 pose
swaps, the filtered style sits about one frame above `classic` — median 33-50 ms
against 33.3 ms, where 33.3 ms is the double-`requestAnimationFrame`
measurement floor, and p95 67 ms against 34-50 ms. (Before optimisation the
same filter pipeline was 66.6/149.9 ms.) If you touch
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
- The same dropdown also offers **per-finger custom colors** ("My colors"):
  one `<input type="color">` per zone (`FINGER_ZONES`), stored as
  `localStorage["tz-fz-custom-v1"]` (`{zone: hex}`) and applied as inline
  `--fz-<zone>` variables on `<html>` — inline style beats every palette rule
  and the `.dark` variants, so a custom finger wins in both modes and on top
  of any palette. The boot script re-applies them pre-paint. The inputs show
  each zone's *live* computed color, so they always reflect palette + custom.
  A "Reset to default" button clears the overrides and returns the palette to
  Classic; the hand-style dropdown carries the same reset for hand settings
  (style, per-style color, opacity — `resetHandAppearance()` in
  `handColor.ts`).

## 5. Consumers

- `KeyboardWithHands` (`KeyboardStage.tsx`): renders `NewKeyboard` always and
  `HandsKeyboard` when `isHandsVisible`, toggling `theme-dark`/`theme-bone`
  by dark mode and `colorful-mode` on the `.kb-stage` div. Mounted by all
  five non-game viewport arenas, and by the home page hero — which keeps
  **colorful mode always on** (the lessons make it a toggle; the hero has no
  reason to, and the tinted zones are what advertise the idea to a first-time
  visitor) and passes its own `HERO_LAYOUT` and stage width.
- `Mascot` (`components/Mascot.tsx`): stateless SVG ninja mascot with
  `mood: happy | focused | oops | celebrate`; used on the lesson results /
  locked / 404 screens and the ninja game menu. Not part of the keyboard
  stack but shares the "SVG art, style-only edits" spirit.

## Invariants

- **Never edit path `d=` data** in `hands.tsx` or `NewKeyboard.tsx`;
  restyle via the inline `<style>` blocks and CSS variables only. The single
  exception is **keycap size/position** in `NewKeyboard.tsx` (§2) — a
  layout fact, not artwork, and unreachable from CSS without distorting the
  corner radii. Hand poses stay untouchable either way.
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
