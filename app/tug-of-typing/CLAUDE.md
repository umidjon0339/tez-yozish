# app/tug-of-typing/ — the top-down tug-of-war game

Read **`docs/tug-of-typing.md`** before editing.

Hard rules:
- Layering is strict: `sim.ts` is data + tuning only (no React, no canvas),
  `render.ts` only draws (pure — reads state, never mutates), `step()` in
  `TugWorld.tsx` is the **only** writer of `stateRef.current`. `render.ts`
  must never import from `TugWorld.tsx` (circular).
- Simulation state lives in one mutable object from `getInitialState()`.
  React state is only the ~20 Hz `hud` snapshot and menu flags — there is
  deliberately **no per-keystroke React state**; the canvas paints the word
  and its typed prefix straight from `stateRef`.
- Clamp `dt = Math.min(delta, 0.1)` in `step()`.
- One rAF loop for the whole mount: always draws, steps only in `PLAYING`
  (and `MENU`, which idles the attract scene). Never start a second loop.
- **The rival's shown WPM is the product — keep it honest.**
  `botKeysPerSecond()` returns exactly `botWpm`; nothing may quietly scale
  it. `BOT_REGRIP` fires only after a word the rival WON; pausing it after
  every word turns a 30 WPM rival into a ~25 WPM one.
- **Endless by design**: clearing a level calls `startLevel(level + 1)` with
  a faster rival, forever. Losing the rope once ends the run. Don't add a
  match structure, a life count or a win screen.
- **No countdown anywhere.** A previous version had a per-level clock and it
  was removed on request. The dig-in ramp (`RAMP_AFTER` / `RAMP_RATE` /
  `RAMP_MAX`) is now the ONLY thing guaranteeing a level ends — it must stay,
  and it must stay silent and visual (strain, dust, red glow), never a timer.
- Comeback aids must stay well below the speed gap they soften. A 25% second
  wind plus a rubber band once cancelled a 25% deficit exactly, parked the
  rope at −0.65 and made losing impossible. Both are gone; don't reintroduce
  them without re-checking that a slower player still loses.
- Keep the game **one idea**. Golden words, best-of-3 rounds, snatch banners
  and a tension drum were all removed to clean it up; adding a mechanic back
  needs a reason better than "it would be fun".
- `pullTimeMs` (the WPM clock) advances only while `phase === "pull"`, and
  typing input is accepted only in that phase.
- The kids are drawn facing left and mirrored, laid out along local x from the
  rope outward (shoes −36 → knees −8 → hips +9 → shoulders +24 → head +45).
  Keep the legs splayed to ±23 or they vanish behind the arms. They are meant
  to read as humans — skin-toned shins and forearms, hair, a face that reacts
  to strain — not as mascots.
- Tiles: typed is ALWAYS emerald, current ALWAYS amber, error red.
- Everything is procedural: no image assets, no mp3s. Audio is the inline
  synth in `sound.ts`, and there is **no music** — only rope ticks, grunts, a
  whistle and the crowd.
- Particles stay bounded via `addParticle` (`PARTICLE_CAP`); skids via
  `addSkid`.
- All player-facing text goes through the localised `UI` dict (en/uz/ru) at
  the top of `TugWorld.tsx`. No bare English strings in JSX.
- `window.__tug` is a dev-only test hook; keep it behind the
  `NODE_ENV === "production"` guard.
- The eslint disable at the top of `TugWorld.tsx` is intentional
  (mutable-ref architecture); don't "fix" it.
