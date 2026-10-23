# components/keyboard/ — keycap + hands SVG layers

Read **`docs/keyboard.md`** before editing.

`KeyboardStage.tsx` is the shared keycap+hands composite
(`KeyboardWithHands`) — used by the lesson runtime and the home page hero.
The two viewBox baselines are aligned by `KEYBOARD_CONFIG`/`HANDS_CONFIG`
there; retune them together.

Two hand styles ship: `classic` (`hands.tsx`) and `female`
(`handsFemale.tsx` — anatomically reshaped geometry: slender tapered fingers,
narrower palm, slimmer wrist — + `.theme-rose`). Chosen from a dropdown in
the lesson header (`HandStyleSwitcher.tsx`, stored by `handStyle.ts`). The
same dropdown picks a per-style custom color and layer opacity
(`handColor.ts`, `tz-hand-colors-v1` / `tz-hand-opacity-v1`; opacity is
applied by `KeyboardStage` on the hands wrapper div): one base hex expanded by
`handTintVars()` into `--hand-*` CSS variables that every color rule in
`hands.tsx` reads with the built-in look as fallback — keep new color rules on
that pattern, and keep the attribute defaults on the rose gradient stops /
feFloods (the standalone export relies on them).

The dropdown's last row is the **"Color every finger"** switch: on, every finger
of every visible hand is drawn in the color of the keys it types (the `--fz-*`
zone variables, i.e. the keycap colors — that identity is the whole point).
There is no per-finger geometry in the art, so the colors come from a gradient
across the hand whose stops sit on derived finger boundaries, baked per pose by
`npm run build:finger-bands` into `fingerBands.{classic,female}.generated.ts`
and applied by `paintBand` (`fingerBands.ts`). Read **`docs/keyboard.md` §3c**
before touching `scripts/lib/finger-bands.mjs` — every rule in it is a scar from
a pose that broke.

Hard rules:
- **Never hand-edit `fingerBands.*.generated.ts`** — rebuild it. The finger
  bands are measured off the geometry, so re-run `npm run build:finger-bands`
  (or `hands:rebuild`, which includes it) after any change to the hand art, and
  eyeball `-- --sheet` / `-- --check` afterwards. Correct a bad pose in
  `scripts/lib/finger-band-overrides.mjs`, never in the generated file.
- The finger colors must stay the **same variables as the keycaps**
  (`--fz-<zone>`); never give the hands their own palette.
- **Never edit SVG path `d=` data** in `hands.tsx` or `NewKeyboard.tsx`.
  All visual changes go through the inline `<style>` blocks and the
  `--fz` / `--hands-accent` CSS variables. One exception: **keycap
  size/position** in `NewKeyboard.tsx` is layout, not art, and CSS can't
  change it without distorting the corner radii — match the grid in
  `docs/keyboard.md` §2 and move the cap's legend with it. Hand poses have
  no exception.
- Skin colors for `female` live in **`skinTones.mjs`** — the single source
  read by `hands.tsx`, the preview baker (`scripts/hands-previews.mjs`) and
  the standalone export. Change them there and run `npm run hands:rebuild`;
  never edit hexes in `public/hands/*.svg` (generated, overwritten).
- **`handsFemale.tsx` is generated — never hand-edit it.** Edit `hands.tsx`,
  then run `npm run hands:rebuild`; otherwise the reshaped variant silently
  keeps the old geometry. It must stay a drop-in for `<Keyboard />` (same
  props, same pose ids, same viewBox). The shape lives in
  `scripts/lib/hand-profiles.mjs` (inset 3.2 at fingers → 1.3 at wrist, wide
  tangent window + extra smoothing for straight edges, `gapR` gap closing so
  finger slits don't open into background-colored cracks), the maths in
  `hand-geometry.mjs`; keep the fingertip inset ≤ ~4 units — well under half
  a key width — so every pose keeps pointing at its own key. The rose theme
  also strokes `.st1` with the skin gradient to seal the hairline slits the
  source art itself carries — keep that stroke.
- The `.theme-rose` filters re-rasterise on **every keystroke**. Keep them to
  one Gaussian blur each, keep the filter regions tight, and keep
  `color-interpolation-filters="sRGB"` (the linearRGB default costs about as
  much as a blur). Re-measure pose-swap time after any change — see
  `docs/keyboard.md` §3b for the numbers.
- `keymap.ts` ids are load-bearing in three places: keycap `path#id`
  (NewKeyboard), pose `g#id` (hands), and the `.kb-stage :is(…)`
  finger-zone lists in `app/globals.css`. Adding a key touches all three
  (plus `text#text-<id>` legends).
- Both components mutate the DOM imperatively via refs — keep highlighting
  out of React render. They're `memo`'d shallowly: parents must keep
  `expectedKey`/`activeKeys`/`lastPress` referentially stable.
- The two layers have different viewBox baselines; alignment comes from
  `KEYBOARD_CONFIG`/`HANDS_CONFIG` in `KeyboardStage.tsx` — retune together.
- Hands style: frosted-glass fill, single steady `.st5` guide-finger stroke
  (no glow, no opacity pulse — deliberate, see comments).
