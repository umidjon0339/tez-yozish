# components/keyboard/ — keycap + hands SVG layers

Read **`docs/keyboard.md`** before editing.

Hard rules:
- **Never edit SVG path `d=` data** in `hands.tsx` or `new_keyboard.tsx`.
  All visual changes go through the inline `<style>` blocks and the
  `--fz` / `--hands-accent` CSS variables.
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
