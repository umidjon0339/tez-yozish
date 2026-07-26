# app/lesson/ — the typing engine

Read **`docs/lesson-runtime.md`** before editing `[id]/page.tsx` (~2700
lines, everything module-local).

Hard rules:
- Per-keystroke feedback is imperative: `LetterHandle`s + refs. Never move
  tracker bookkeeping (buffer/cursor/mistakes/timing) into React state.
- Each viewport owns one `window` keydown listener, mounted via the
  `key={step.stepId}` remount, removed in the effect cleanup.
- Space/Tab stay `preventDefault`'d; chord-aware handlers suppress real
  browser shortcuts (Ctrl/Alt/Meta combos, Arrows).
- Graded viewports report `StepStats { correct, mistakes, timeMs,
  perKeyMistakes }` to `onComplete` — the contract with `lib/progress.ts`.
- Sounds only through the shared SFX layer (`press_key4.mp3`/`error2.mp3`),
  gated on `isAudioEnabled`.
- Chrome strings live in the local `UI` dict — all three locales.
- The embedded NinjaWorld `onComplete` passes StepStats-shaped keystroke
  totals (empty `perKeyMistakes`); game steps add them to the run totals.
