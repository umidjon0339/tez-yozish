# app/star-type/ — the 2D space typing shooter

Read **`docs/star-type.md`** before editing.

This route is a deliberate, faithful re-build of the ZType arcade loop. The
brief was to **copy the reference, not extend it**, so the strongest rule here
is about what must NOT be added.

Hard rules:
- **Do not add features the reference does not have.** No difficulty picker, no
  lives or health bar, no power-ups, no combo multiplier, no screen-clearing
  move, no in-run score / accuracy / streak read-out. The wave ramp is the
  entire difficulty model and one drone reaching the ship ends the run. Every
  one of those omissions is a decision, not an oversight — if a future brief
  asks for them, retune `WAVE_*` in the same commit.
- **The in-run HUD is the wave badge and the three chrome buttons, nothing
  else.** The badge is painted on the canvas (`drawWaveBadge`); only
  pause / mute / quit are DOM. Score belongs on the results screen.
- **The lock-on model is the game.** No lock → the key must be some word's
  FIRST letter, and of the matches the drone NEAREST THE SHIP wins. Locked →
  the key must be `word[typed]`; anything else is a miss that costs the streak
  and accuracy but **does not drop the lock**. Dropping the lock on a typo
  would punish hunting twice over. Do not add a "switch target" key.
- **Two live words must never share a first letter.** `pickWord` is passed
  `liveInitials(s)` and avoids them, because the first key is what chooses a
  target and a duplicate initial makes the lock ambiguous. If the pool is
  exhausted it gives up and the nearest-drone rule keeps it fair.
- **A finished word makes the drone `doomed`, not dead.** It dies when its
  killing bolt lands, exactly like the reference. Two things follow, and both
  are load-bearing: a doomed drone is **skipped by the ship collision check**
  (dying to something you already typed out reads as a cheat), and the safety
  net in `step()` blows up any doomed drone left with `incoming === 0` so a
  lost bolt can never strand one in the sky.
- **Bolts can land out of order.** The drone closes on the ship as you type, so
  a later bolt has a shorter flight than an earlier one. The landing code must
  keep tolerating a missing target (`find` → `continue`) — never assume the
  killing bolt lands last.
- **The word label keeps the FULL word's width when locked.** Only the letters
  still to type are drawn, in amber, at their true x — the typed prefix is not
  drawn but its width is still reserved. Letting the remaining text slide left
  as you type makes the game unplayable at speed.
- **Score is one point per letter of each destroyed word** and it is shown
  zero-padded to six digits, like the reference. Don't "improve" it with
  multipliers.
- **Landscape, not portrait.** The reference is a phone game; this fills the
  window. `layoutFor` scales off `min(H, W * 0.62)` so an ultrawide monitor
  does not blow the sprites up, drones spawn across the whole width, and they
  converge on the ship (`CONVERGE_SPREAD`) instead of raining straight down —
  a vertical drop reads as a wall on a wide screen.
- Layering is strict: `sim.ts` is data + tuning only (no React, no canvas),
  `render.ts` only draws (pure — it reads state, never mutates it), and
  `step()` in `StarTypeWorld.tsx` is the **only** writer of `stateRef.current`.
  `render.ts` may not import from `StarTypeWorld.tsx` (that would be circular).
- Simulation state lives in one mutable object from `getInitialState()`. React
  state is only the ~20 Hz `hud` snapshot and menu flags — there is
  deliberately **no per-keystroke React state**, because the canvas paints the
  words and their typed prefixes straight from `stateRef`.
- Clamp `dt = Math.min(delta, 0.1)` in `step()`.
- One rAF loop for the whole mount: always draws, steps only in `PLAYING`
  (and `MENU`, which runs the self-playing attract mode). Never start a second
  loop. Attract mode must stay **silent** — `fireAt` takes a `scoring` flag.
- **`drawShip` must return early for BOTH `dying` (past 0.18 s) and `over`.**
  The results card is translucent by design, so a ship drawn behind it would be
  a ghost of the one the player just lost.
- The death beat is a flash, a cyan blast and a **slice glitch** that redraws
  strips of the already-painted canvas. Its randomness comes from
  `hash(slice, tick)` so it stutters deterministically; the additive channel
  split is kept at very low alpha because at any real strength a full-screen
  fill stops reading as a glitch and just turns the frame blue.
- Background layers must stay deterministic (`hash(i)`) or they shimmer. Don't
  use `Math.random()` in `render.ts` at all — per-frame randomness belongs in
  `step()`.
- Particles stay bounded via `addParticle` (`PARTICLE_CAP`).
- All player-facing text goes through the localised `UI` dict (en/uz/ru) at the
  top of `StarTypeWorld.tsx`. The single exception is the game's NAME, which
  stays English in every locale like Beam Break / Sky Hop / Alien Drop. The
  **words the player types are English** — they are game content, not chrome.
- The title and results screens are dark and cyan, not the cream/ink card the
  other games use. That is on purpose: they are the reference's screens. Don't
  "unify" them with the sibling games.
- Everything is procedural: no image assets and no mp3s on this route. Audio is
  the inline oscillator synth in `sound.ts`; `sfx.init()` is only called from
  the click that starts a run. There is **no music and no drone** — the silence
  between shots is what makes a wave feel tense.
- `window.__starType` is a dev-only test hook; it must stay behind the
  `NODE_ENV === "production"` guard.
- The eslint disable at the top of `StarTypeWorld.tsx` is intentional
  (mutable-ref architecture); don't "fix" it.
- The `/games` card is `STAR_TYPE_COVER` in
  `components/thumbnails/SvgLibrary.tsx`, rendered in the same uniform tile as
  the other games. All game cards are the same size on purpose.
