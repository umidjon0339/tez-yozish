# app/beam-break/ — the 2D UFO tractor-beam game

Read **`docs/beam-break.md`** before editing.

Hard rules:
- **No screen shake and no vibration anywhere.** This game deliberately has no
  `trauma` channel: every impact reads as an eased colour / scale / glow
  change. If you add a new impact, add a feel channel — never offset the scene.
- **The renderer draws `grabView`, never `grab`.** `grab` is the logical grip
  and steps instantly on every keystroke; `grabView` follows it through a
  critically damped spring (`GRAB_STIFFNESS` / `GRAB_DAMPING = 2·√stiffness`,
  integrated in `GRAB_SUBSTEP` slices). That spring is what makes the motion
  smooth: it starts from zero velocity, so there is no first-frame lurch, and it
  low-passes the per-keystroke sawtooth so the animal doesn't judder. Squash /
  stretch come from `grabVelView` (the spring's velocity), not from the
  discrete `yank`. Don't swap it for an exponential ease and don't render
  `grab`.
- **No background music and no continuous drone.** Every sound is a short
  one-shot tied to a player action. An earlier build had a beam drone whose
  volume swelled as the animal neared the saucer; it was removed on purpose, so
  don't reintroduce an ambient bed or a `grab`-tracking hum. Rising danger is
  shown, not heard — the beam brightens, the vignette closes in, the face
  panics.
- **The in-run HUD is distance + best distance only** (plus life pips and the
  mute/pause/quit buttons). No beam meter: the animal's height in the beam is
  the gauge. Everything else belongs on the game-over card.
- Layering is strict: `sim.ts` is data + tuning only (no React, no canvas),
  `render.ts` and `animals.ts` only draw (pure — they read state, never mutate
  it), and `step()` in `BeamBreakWorld.tsx` is the **only** writer of
  `stateRef.current`. Neither painter may import from `BeamBreakWorld.tsx`
  (that would be circular).
- Simulation state lives in one mutable object from `getInitialState()`. React
  state is only the ~20 Hz `hud` snapshot and menu flags — there is
  deliberately **no per-keystroke React state**, because the canvas paints the
  word and its typed prefix straight from `stateRef`. Don't "fix" that by
  lifting the word into state.
- Clamp `dt = Math.min(delta, 0.1)` in `step()`.
- One rAF loop for the whole mount: always draws, steps only in `PLAYING`
  (and `MENU`, which runs the self-playing attract mode). Never start a
  second loop.
- **Typos are flow mode**: a wrong key costs `MISS_PULL` of ground and the
  combo, but must never advance *or* reset `typed`. Making the word block on a
  mistake changes the whole difficulty model — retune
  `DIFFICULTY_CONFIG` in the same commit if you ever do.
- The difficulty numbers are derived, not vibes: holding station takes
  `pull / keyYank` keys per second, and the menu prints the resulting WPM
  (12 / 25 / 35). Change a config and update the comment and the menu hint.
- `runTimeMs` (the WPM clock) and `distance` advance only while
  `phase === "playing"`, and typing input is accepted only in that phase.
- One coordinate mapping: the animal is pinned at `ANIMAL_X_FRAC` and the
  world scrolls, so world objects are drawn at `screenX(wx) = wx - scrollPx`.
  There is no camera Y — `grabToY(s, L)` maps `grab` 0→1 from the ground line
  to the saucer's mouth, and its stand height comes from `footOffset(species)`.
- `BODY_W`/`BODY_H`/`LEG_H`/`HEAD_R` in `animals.ts` are shared by
  `drawAnimal` and `footOffset`. Change one without the other and the animal
  floats above the sand or sinks into it.
- Ten species come from ONE parametric painter. Adding an animal = one
  `SPECIES` entry + its name in the `UI.animals` dict, never new draw code.
- The canvas owns the top centre of the screen for the letter-tile row (its
  plate reaches ~170 px down). Nothing may be drawn or positioned there — the
  level chip lives in the left-hand HUD stack, the capture-ring warning sits
  below the tiles, and the alien's speech bubble is drawn below-right of the
  alien for the same reason.
- Everything is procedural: no image assets and no mp3s on this route. Audio
  is the inline oscillator synth in `sound.ts`; `sfx.init()` is only called
  from the click that starts a run.
- Background layers must stay deterministic (`hash(i)` over the visible index
  range) or they shimmer as the world scrolls. Don't use `Math.random()` in
  `render.ts` or `animals.ts` at all — per-frame randomness belongs in
  `step()`.
- Particles stay bounded via `addParticle` (`PARTICLE_CAP`); drifters via
  `MAX_DRIFTS`. `Particle.fixed` marks screen-space particles — world-space
  ones scroll with `screenX`.
- All player-facing text goes through the localised `UI` dict (en/uz/ru) at
  the top of `BeamBreakWorld.tsx`, including animal names (keyed by
  `Species.key`) and sky names (keyed by `Palette.key`). The single exception
  is the game's NAME, which stays English in every locale like Sky Hop /
  Rhino Dash / Ninja Run.
- `window.__beamBreak` is a dev-only test hook (see `docs/beam-break.md` §8);
  it must stay behind the `NODE_ENV === "production"` guard.
- The eslint disable at the top of `BeamBreakWorld.tsx` is intentional
  (mutable-ref architecture); don't "fix" it.
- The `/games` card is `BEAM_BREAK_COVER` in
  `components/thumbnails/SvgLibrary.tsx`, rendered in the same uniform tile as
  the other three games. All four game cards are the same size on purpose —
  don't promote this one to a featured/oversized card.
