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

Hard rules:
- **Never edit SVG path `d=` data** in `hands.tsx` or `new_keyboard.tsx`.
  All visual changes go through the inline `<style>` blocks and the
  `--fz` / `--hands-accent` CSS variables.
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
  (new_keyboard), pose `g#id` (hands), and the `.kb-stage :is(…)`
  finger-zone lists in `app/globals.css`. Adding a key touches all three
  (plus `text#text-<id>` legends).
- Both components mutate the DOM imperatively via refs — keep highlighting
  out of React render. They're `memo`'d shallowly: parents must keep
  `expectedKey`/`activeKeys`/`lastPress` referentially stable.
- The two layers have different viewBox baselines; alignment comes from
  `KEYBOARD_CONFIG`/`HANDS_CONFIG` in `KeyboardStage.tsx` — retune together.
- Hands style: frosted-glass fill, single steady `.st5` guide-finger stroke
  (no glow, no opacity pulse — deliberate, see comments).
