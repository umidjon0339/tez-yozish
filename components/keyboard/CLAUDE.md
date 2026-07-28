# components/keyboard/ — keycap + hands SVG layers

Read **`docs/keyboard.md`** before editing.

Four hand styles ship, from three components and two themes: `classic`
(`hands.tsx`), `slim` (`handsSlim.tsx`), `realistic` (`handsSlim.tsx` +
`.theme-flesh`) and `female` (`handsFemale.tsx` + `.theme-rose`). Chosen from a
dropdown in the lesson header (`HandStyleSwitcher.tsx`, stored by
`handStyle.ts`).

Hard rules:
- **Never edit SVG path `d=` data** in `hands.tsx` or `new_keyboard.tsx`.
  All visual changes go through the inline `<style>` blocks and the
  `--fz` / `--hands-accent` CSS variables.
- Skin colors for `realistic`/`female` live in **`skinTones.mjs`** — the
  single source read by `hands.tsx`, the preview baker
  (`scripts/hands-previews.mjs`) and the standalone export. Change them there
  and run `npm run hands:rebuild`; never edit hexes in the generated
  components or in `public/hands/*.svg` (all generated, all overwritten).
- **`handsSlim.tsx` and `handsFemale.tsx` are generated — never hand-edit
  them.** Edit `hands.tsx`, then run `npm run hands:rebuild`; otherwise the
  reshaped variants silently keep the old geometry. Each must stay a drop-in
  for `<Keyboard />` (same props, same pose ids, same viewBox), because the
  lesson page just swaps one for another.
- Shapes live in `scripts/lib/hand-profiles.mjs`, the maths in
  `hand-geometry.mjs`. If you retune either, keep the measured worst-case point
  movement well under half a key width — that bound is what keeps every pose
  pointing at its own key. Current: slim 2.48 units, female 4.07 (key ≈ 51).
- The `.theme-flesh` / `.theme-rose` filters re-rasterise on **every keystroke**. Keep them to
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
  `KEYBOARD_CONFIG`/`HANDS_CONFIG` in the lesson page — retune together.
- Hands style: frosted-glass fill, single steady `.st5` guide-finger stroke
  (no glow, no opacity pulse — deliberate, see comments).
