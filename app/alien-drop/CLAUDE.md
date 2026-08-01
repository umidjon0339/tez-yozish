# app/alien-drop/ — the 2D falling-pod game

Read **`docs/alien-drop.md`** before editing.

Hard rules:
- **One keystroke per target is the whole mechanic.** Every pod carries exactly
  one character and one key kills it. Do not "improve" it into a word game —
  reaction and letter recognition are the point, and it is the activity that
  feeds `lib/stats.ts` the cleanest per-key sample (no neighbouring letters
  priming the finger).
- **Targeting is always the LOWEST matching pod.** With a 9-key pool on EASY,
  two pods showing the same letter is unavoidable; the lowest-first rule is the
  only one that never punishes a player for clearing the most urgent pod.
  Anything else (nearest to the crosshair, first spawned, random) is a bug.
- **The kill is banked on the KEYSTROKE, the bolt is theatre.** `scoreKill()`
  moves score / streak / wave / nova charge immediately and marks the pod
  `hit`; the bolt catches up ~0.2 s later and `detonate()` only does particles,
  sound and removal. Never move scoring into `detonate` — the scoreboard has to
  react to the key, not to the impact.
- **Every tagged (`hit`) pod must eventually be removed.** It is frozen, not
  targetable and not dangerous, so a pod whose bolt is lost would hang in the
  sky for ever. Three things guarantee it goes: the bolt's `remain <= 0`, the
  bolt's `life > 1.2` cap, and the `deadT > 1.6` safety net in `step()`. A nova
  clears **all** pods, tagged ones included, and then empties `s.bolts`.
- **`s.pods` is never mutated while it is being iterated.** `step()` collects
  kills into a local array and resolves them after the loop. Landed pods are
  marked with the `deadT = 99` sentinel and filtered in one pass at the end.
- **Three accelerations, one source of truth.** Per-pod (`POD_ACCEL_FRAC`),
  per-wave (`gapDecay` / `speedRamp`) and per-run (`ACCEL_PER_SEC`). `gapAt()`
  and `speedAt()` in `sim.ts` are the only place they are combined, and
  `wpmAt()` derives the menu's WPM figures from `gapAt` — so the menu can never
  advertise a pace the game does not actually demand. Change a config and the
  menu text follows automatically; do not hard-code a WPM anywhere.
- **A key outside `cfg.keys` is ignored entirely** — no miss, no stat. A key
  that IS in the pool but matches no pod costs the streak and nothing else.
  This game punishes pods that LAND, not wrong guesses.
- **The hero mirrors.** `hero.face` (±1, switched with the `FACE_FLIP`
  deadzone) flips the whole sprite so the blaster is always on the side he is
  shooting at and can never cross his own visor. `drawHero` rotates the gun by
  `aim * face` inside that mirror, and **`muzzleOf()` must stay in step with
  `drawHero`'s skeleton** — same `heroU`, same body offsets, same pivot. They
  are the reason bolts appear to leave the barrel; a mismatch is immediately
  visible. The hero is drawn at `Layout.heroU` (`HERO_SCALE` × world scale),
  never at `L.scale`.
- Hero draw order is **backpack → legs → torso → helmet → arms → gun**. The
  helmet goes down before the things he is holding, so the face is readable at
  every aim angle. Do not move the gun earlier "so it looks held".
- Layering is strict: `sim.ts` is data + tuning only (no React, no canvas),
  `render.ts` only draws (pure — it reads state, never mutates it), and
  `step()` in `AlienDropWorld.tsx` is the **only** writer of `stateRef.current`.
  `render.ts` may not import from `AlienDropWorld.tsx` (that would be circular).
- Simulation state lives in one mutable object from `getInitialState()`. React
  state is only the ~20 Hz `hud` snapshot and menu flags — there is
  deliberately **no per-keystroke React state**, because the canvas paints the
  pods and their characters straight from `stateRef`.
- Clamp `dt = Math.min(delta, 0.1)` in `step()`.
- One rAF loop for the whole mount: always draws, steps only in `PLAYING`
  (and `MENU`, which runs the self-playing attract mode). Never start a second
  loop. Attract mode must stay **silent** — `fireAt`/`detonate` take a
  `scoring` flag for exactly that.
- **This game DOES have screen shake** (`trauma`), unlike beam-break: a pod
  cracking open on the colony is a real impact. It is a deterministic sine
  pair in `draw()`, never `Math.random()`, and it is the only thing that
  offsets the scene.
- **The siren is a pulsed one-shot on a timer, not a drone.** `sfx.setAlarm()`
  reschedules a two-tone beep whose rate follows the nearest pod; it opens up
  only in the bottom half of the red zone and stops the instant the sky is
  clear. Silence must always mean "nothing is about to land". Do not turn it
  into a continuous oscillator, and always `stopAlarm()` on pause, quit,
  game-over and unmount.
- SPACE is reserved for the nova — pods never carry a space, so the key is
  free. The nova needs a full `hero.charge` (`NOVA_COMBO` kills) and is the
  only screen-clearing move.
- Background layers must stay deterministic (`hash(i)`) or they shimmer. Don't
  use `Math.random()` in `render.ts` at all — per-frame randomness belongs in
  `step()`.
- Particles stay bounded via `addParticle` (`PARTICLE_CAP`); popups via
  `addPopup` (`POPUP_CAP`).
- All player-facing text goes through the localised `UI` dict (en/uz/ru) at the
  top of `AlienDropWorld.tsx`, including the sky names (keyed by
  `Palette.key`). The single exception is the game's NAME, which stays English
  in every locale like Beam Break / Sky Hop / Rhino Dash / Ninja Run.
- Everything is procedural: no image assets and no mp3s on this route. Audio is
  the inline oscillator synth in `sound.ts`; `sfx.init()` is only called from
  the click that starts a run.
- `window.__alienDrop` is a dev-only test hook; it must stay behind the
  `NODE_ENV === "production"` guard.
- The eslint disable at the top of `AlienDropWorld.tsx` is intentional
  (mutable-ref architecture); don't "fix" it.
- The `/games` card is `ALIEN_DROP_COVER` in
  `components/thumbnails/SvgLibrary.tsx`, rendered in the same uniform tile as
  the other five games. All game cards are the same size on purpose.
