# app/games/sky-hop/ — the 2D balloon-hop game

Read **`docs/sky-hop.md`** before editing.

Hard rules:
- Layering is strict: `sim.ts` is data + tuning only (no React, no canvas),
  `render.ts` only draws (pure — reads state, never mutates), `step()` in
  `SkyHopWorld.tsx` is the **only** writer of `stateRef.current`. Keep new
  code in the right file; `render.ts` must never import from
  `SkyHopWorld.tsx` (that would be circular).
- Simulation state lives in one mutable object from `getInitialState()`.
  React state is only the ~20 Hz `hud` snapshot and menu flags — there is
  deliberately **no per-keystroke React state**, because the canvas paints
  the word and its typed prefix straight from `stateRef`. Don't "fix" that
  by lifting the word into state.
- Clamp `dt = Math.min(delta, 0.1)` in `step()`.
- One rAF loop for the whole mount: always draws, steps only in `PLAYING`
  (and `MENU`, which runs the self-playing attract mode). Never start a
  second loop.
- The chain must always have a balloon at `heroIx`. Anything that pops it
  (splash, crow hit) removes it and calls `refillChain()` — which recreates
  the ridden index too, not just the queue ahead.
- `flyTimeMs` (the WPM clock) advances only while `phase === "flying"`, and
  typing input is accepted only in that phase.
- One coordinate mapping: `screenX(worldX) = worldX - camX + W*HERO_X_FRAC`,
  balloon `ix` at `ix * SPACING`, no camera Y. `altToY(0)` puts the HERO
  (which hangs `HERO_DROP` below the envelope) on the waterline — change
  `HERO_DROP` and the splash lines up wrong.
- Everything is procedural: no image assets and no mp3s on this route.
  Audio is the inline oscillator synth in `sound.ts`; `sfx.init()` is only
  called from the click that starts a run.
- Background layers must stay deterministic (`hash(i)` over the visible
  index range) or they shimmer as the camera pans. Don't use `Math.random()`
  in `render.ts` except for per-frame noise like screen shake.
- Particles stay bounded via `addParticle` (`PARTICLE_CAP`).
- All player-facing text goes through the localised `UI` dict (en/uz/ru) at
  the top of `SkyHopWorld.tsx` — including sky names, keyed by
  `SkyPalette.key`. No bare English strings in JSX.
- `window.__skyHop` is a dev-only test hook (see `docs/sky-hop.md` §5); it
  must stay behind the `NODE_ENV === "production"` guard.
- The eslint disable at the top of `SkyHopWorld.tsx` is intentional
  (mutable-ref architecture); don't "fix" it.
