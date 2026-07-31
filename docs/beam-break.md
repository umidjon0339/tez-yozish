# Beam Break — `app/beam-break/`

2D **canvas** typing game (no three.js, no image assets, no mp3s), fourth
sibling of typing-ninja, rhino-dash and sky-hop. Single entry point:
`/beam-break` (`page.tsx`, `next/dynamic` + `ssr: false`, fullscreen fixed
overlay). Not embedded in the lesson runtime — arcade only, linked from
`/games` by a uniform thumbnail card like its siblings.

Files:

| File | Holds |
|---|---|
| `sim.ts` | tuning constants, the **animal roster** (`SPECIES`), word tiers, sky palettes, state type, `getInitialState`/`resetRun`, particle emitters. **No React, no canvas.** |
| `animals.ts` | the parametric animal painter (`drawAnimal`, `drawAnimalHead`) + `footOffset`. **Pure draw code**, same contract as `render.ts`. |
| `render.ts` | every scene draw call (`draw(ctx, s, W, H, labels)`), the `Layout` + `grabToY`/`screenX`/`ufoX` mapping. **Pure — reads state, never mutates it.** |
| `sound.ts` | `BeamBreakSound` oscillator synth (short one-shots only) + the shared `sfx` instance. |
| `BeamBreakWorld.tsx` | React shell: the rAF loop, `step()` (the only writer of state), keyboard input, the localised `UI` dict, HUD and menus. |
| `page.tsx` | dynamic import wrapper. |

Its `/games` card is a normal `DynamicThumbnail` tile — `BEAM_BREAK_COVER` in
`components/thumbnails/SvgLibrary.tsx` (§6).

## 1. Game design

A cute animal is caught in a UFO's tractor beam over a dune desert. The word
to type is painted as a row of chunky keycap **tiles** at the top of the
screen: typed letters go emerald, the awaited letter is an amber tile with a
glow and a caret, the rest stay cream. The **animal is a different species
every run** (`resetRun` re-rolls `s.animal`), which is the "who am I saving
today?" hook.

**Tug of war** — the whole game is one equation:

```
grab += pull * dt          the beam, always winning
grab -= keyYank            per correct key
grab -= wordYank           per finished word
```

`grab` is 0 with the animal's feet on the sand and 1 with it inside the
saucer. Holding station therefore needs `pull / keyYank` correct keys per
second, which is how the difficulties are tuned — EASY ≈ 12 WPM, MEDIUM ≈ 25,
HARD ≈ 35 (see `DIFFICULTY_CONFIG`, whose comments record the arithmetic; the
menu prints the same numbers). Above `MERCY_GRAB` the beam eases off to
`MERCY_FACTOR` so a struggling kid gets a fighting chance near the saucer.
Yank that would push `grab` below 0 pays out as score instead, so typing
faster than you need to is never wasted.

**Typos are FLOW MODE.** A wrong key flashes the tile red, adds `MISS_PULL` to
`grab` and breaks the combo, but the word does **not** need repairing —
`typed` neither advances nor resets. A slow typist can never get stuck on one
letter while the beam eats them. Do not "improve" this into a blocking model
without changing the difficulty tuning with it.

**Distance is the score**, like the reference game. The world scrolls at
`scrollV`, which eases toward `SCROLL_MIN + keyRate * SCROLL_PER_KPS` where
`keyRate` is an exponential moving average of your keys/sec (time constant
`KPS_TAU`). `distance += scrollV * dt / PX_PER_M`. So the metre counter is
literally an integral of how fast you have been typing, and finishing a word
adds an instant `WORD_SURGE` kick. Record: `tz-beambreak-best`, the best
distance in metres.

**Endless, 3 lives.** `grab` reaching 1 is an abduction: the animal is sucked
into the saucer over `ABDUCT_TIME`, one life is spent, then it is spat back
out at `GRAB_RESPAWN` with `IMMUNE_TIME` of grace. At 0 lives the run ends
(distance / WPM / accuracy / time / score / level / words / streak / rings).

**Levels.** Every `WORDS_PER_LEVEL` words the alien leans out of the dome with
a "Level N" bubble: the word pool climbs a tier (every `TIER_EVERY` levels),
the beam gets `LEVEL_PULL_RAMP` stronger (up to `LEVEL_PULL_CAP` = 3.4×, which
an endless game needs so a good run eventually ends), the sky changes palette
(`PALETTES`, cycling: sunrise → daylight → sunset → dusk → night → aurora), a
numbered milestone post is planted on the sand, and every `LIFE_EVERY` levels
returns a life.

**Capture rings** (from `cfg.snareFrom`): every `SNARE_MIN`–`SNARE_MAX`
seconds the saucer charges a ring at the emitter for `SNARE_TELE`, then slides
it down the beam over `SNARE_FALL`. Finish the current word before it lands
and it shatters (+120, `snaresBroken`); let it land and the beam takes
`SNARE_PULL` for free. This is the urgency beat — a telegraphed deadline you
beat by typing faster, and the same role the crow plays in sky-hop.

**Golden words** — every `GOLD_EVERY`th word, drawn from one tier up, worth
double score with a 1.7× yank and a sparkle burst.

## 2. Smooth motion, and no screen shake ever

Unlike the sibling games this one has **no `trauma` channel and no vibration
of any kind** — a deliberate design constraint. Every reaction is an eased
0..1 feel channel that the renderer turns into colour, scale or glow: `yank`,
`errFlash`, `goldFlash`, `freeFlash`, `beamPulse`, `levelBanner`, `alienT`,
`abductT`, `rescueT`, `panic`, `blink`, `kick`. Rising danger is **shown, not
heard**: the beam brightens and its scan rings speed up, the danger vignette
closes in, and the animal's face widens into a panic (all driven off
`grabView`).

If you add a new impact, add a channel — do not offset the scene.

**The animal's motion is sprung, not stepped.** `grab` is the logical grip and
it changes *instantly* on every correct key, because the rules and the
abduction threshold need that. Drawing `grab` directly is wrong twice over:
each keystroke teleports the animal, and at a steady 2 keys/second `grab` is a
sawtooth (down `keyYank` per key, drifting back up between them) which reads as
a vibrating animal.

So the renderer draws **`grabView`**, which follows `grab` through a
**critically damped spring** (`GRAB_STIFFNESS` / `GRAB_DAMPING =
2·√stiffness`, integrated in `GRAB_SUBSTEP` slices so a tab-switch `dt` cannot
destabilise it). Two properties matter:

- A spring starts from **zero velocity**, so there is no first-frame lurch. An
  exponential ease moves furthest on the very first frame — precisely the jolt
  being removed. Measured on a fast run: raw `grab` steps up to 16% of the beam
  in one frame, while `grabView` never moves more than **1.5%**.
- At ω ≈ 6.6 rad/s the spring **low-passes the per-keystroke sawtooth**, so the
  animal glides along the trend of your typing. Per-key feedback is already
  carried by the tile going green, the key tick, the spark burst and the beam
  pulse — the body does not need to twitch as well.

`grabVelView` is that spring's velocity, and it is what drives squash/stretch
and the body lean (`AnimalPose.vel`), so those are continuous too. Critical
damping means no overshoot or bounce; keep the damping at `2·√stiffness`.

## 3. Simulation model: refs, not React state

Same contract as the other three games (see `docs/typing-ninja.md` §1):

- One mutable object from `getInitialState()` lives in `stateRef`; `step()` in
  `BeamBreakWorld.tsx` is its **only** writer. Every frame clamps
  `dt = Math.min(delta, 0.1)`.
- React state is only the ~20 Hz `hud` snapshot plus menu flags. There is **no
  per-keystroke React state** — the canvas paints the word and its typed
  prefix from `stateRef`, so a keystroke costs zero re-renders.
- One rAF loop runs for the whole mount: it always draws, and steps only while
  `PLAYING` (or `MENU`, which runs the attract mode). `PAUSED` and `GAME_OVER`
  freeze the sim but keep the last frame behind the modal.

**Coordinates.** The animal is pinned to screen x `ANIMAL_X_FRAC`; the world
scrolls past it. Anything with a `wx` lives in scroll space and is drawn at
`screenX(wx) = wx - s.scrollPx`. There is no camera Y: the animal rides the
grip through `grabToY(s, L)` — which reads **`grabView`, never `grab`** (§2) —
and whose stand height comes from `footOffset(species)` so a long-legged fox
and a squat turtle both touch the sand exactly. Everything visual in
`render.ts` reads `grabView` for the same reason: the beam's heat and scan
speed, the contact shadow, the beam wash and the danger vignette.
`Particle.fixed` distinguishes screen-space particles (beam sparks, sparkles,
shock rings) from world-space ones (ground dust).

`GameState = MENU | PLAYING | PAUSED | GAME_OVER`; `phase` (`idle`,
`countdown`, `playing`, `abducted`, `over`) is the sub-state inside PLAYING.
Typing input is accepted **only** in `playing`. Esc pauses, Enter starts or
restarts.

**Attract mode.** In `MENU` the sim runs with `phase = "idle"`: it types the
target word itself one letter every 0.16 s and bobs the animal in the beam, so
the menu backdrop plays the game. `backToMenu()` must reset `phase = "idle"`
(and level/palette/signs) or the backdrop keeps the finished run's sky.

## 4. The animal roster

Ten species (`SPECIES` in `sim.ts`) share **one body plan** in `animals.ts` —
body ellipse → four legs → tail → head → ears → snout → eyes — driven by
per-species knobs (`ear`, `snout`, `tail`, `pattern`, `bodyW/bodyH`, `headR`,
`earSize`, `legLen`, `tusks`, colours). Ten cute animals therefore cost one
painter, not ten. To add a species, add a `Species` entry plus its name in the
`UI.animals` dict — no new draw code.

Two geometry rules matter:

- `BODY_W/BODY_H/LEG_H/HEAD_R` in `animals.ts` are shared by `drawAnimal` and
  `footOffset`. Change one and the animal floats above the sand or sinks into
  it, because `grabToY` derives the stand height from `footOffset`.
- The head sits *on top* of the body (`headY = y - bh - headR * 0.55`), and
  round ears are capped at `headR * 0.42 * earSize`. Bury the head deeper or
  let the ears reach head-size and every species reads as one grey blob.

The face is the panic read: eyes widen and the pupils drift up, the brows tilt
in, ears trail upward, legs pedal faster and a worried mouth fades in — all
driven by `panic`, which eases toward `grab`. `drawAnimalHead` reuses the same
painter for the HUD life pips, the beam-meter thumb, the distance card and the
menu, so those can never drift out of sync with the character on screen.

## 5. Rendering and audio

`render.ts` paints back to front: sky gradient (+ stars / aurora curtains at
night) → sun or moon → far dunes → clouds → near dunes → horizon haze →
ground (with scrolling speckles that carry the sense of speed) → plants
(palms / cacti / rocks) → level signs → ground drifters → sky drifters →
beam cone (with scan rings and a pool of light) → UFO → alien → capture ring →
animal → beam front glow → particles → letter tiles → overlays (danger
vignette, flashes, speed streaks).

Everything is procedural and scaled by `Layout.scale` (`H / 800`, clamped), so
the composition holds from a phone to 4K. Infinite layers (dunes, clouds,
stars, plants, speckles) come from `hash(i)` over the visible index range —
deterministic, so they never shimmer as the world scrolls.

**Layout budget.** The canvas owns the top centre for the tile row (its plate
reaches ~170 px down at a 860 px viewport). Nothing in the React HUD or on the
canvas may sit there: the level chip lives in the left-hand stack, the capture
ring warning sits below the tiles, and the alien's speech bubble is drawn
*below and right* of the alien for the same reason.

**Audio** is `sound.ts`, oscillators and noise buffers only. There is
deliberately **no background music and no continuous drone**: every sound is a
short one-shot tied to something the player just did, which keeps the keystroke
feedback crisp and the route quiet between keys. The set: key tick (pitch climbs
through the word), soft typo thud, `playFree` (whoosh + a flourish that
transposes up with the combo), gold shimmer, ring charge / shatter / clamp,
abduction whoop, rescue chord, level fanfare with alien chirps, countdown,
defeat. `init()` is only called from the click that starts a run.

Don't add an ambient bed or a grab-tracking drone back. An earlier build had one
whose volume swelled as the animal neared the saucer, and that swell is exactly
what had to go.

**The in-run HUD is deliberately bare**: the distance, the best distance, the
life pips and the mute/pause/quit buttons, and nothing else. There is **no beam
meter** — the animal's own height in the beam *is* the gauge, and a second
read-out of the same number was clutter. WPM, accuracy, level, score, streak
and rings all get their moment on the game-over card instead.

## 6. The `/games` card

`BEAM_BREAK_COVER` in `components/thumbnails/SvgLibrary.tsx`, rendered through
`DynamicThumbnail` on `/games` in exactly the same tile as Ninja Run, Sky Hop
and Rhino Dash — same grid cell, same 16/10 frame, same caption strip. All four
game cards are uniform on purpose; there is no featured or oversized card.

It draws a miniature of the real scene (bobbing UFO, scanning tractor beam, a
cute animal lifted inside it, big low sun, palms) plus the keycap tile row in
its three real states. Registry conventions apply: `viewBox 0 0 400 240`, ids
namespaced with `React.useId()`, every param optional with a default, and all
animation behind a `prefers-reduced-motion: no-preference` guard.

One trap it documents in place: a CSS `transform` on an SVG element **replaces**
its `transform` attribute, so the animal's placement and its animation live on
separate `<g>`s.

## 7. Invariants

- `step()` is the only writer of `stateRef.current`; `render.ts` and
  `animals.ts` never mutate.
- `dt` is clamped to 0.1 s in `step()`.
- **No screen shake / vibration**, and the renderer draws `grabView` (the
  sprung follower), never the raw `grab` — see §2.
- **No background music and no continuous drone** — every sound is a one-shot
  tied to a player action.
- `runTimeMs` (the WPM clock) and `distance` advance only in
  `phase === "playing"`, and typing input is accepted only there.
- Typos never block the word (flow mode) — see §1.
- `footOffset` must agree with `drawAnimal`'s body-plan constants — see §4.
- Particles are capped (`PARTICLE_CAP` in `addParticle`); drifters are capped
  (`MAX_DRIFTS`) and culled behind the camera; level signs are dropped once
  off the left edge.
- Audio is the inline oscillator synth — no mp3 assets on this route.
  `init()` is only called from the click that starts a run.
- All player-facing text goes through the localised `UI` dict (en/uz/ru) in
  `BeamBreakWorld.tsx`, including animal and sky names. The one exception is
  the game's **name**, which stays English in every locale exactly like Sky
  Hop / Rhino Dash / Ninja Run.
- Keystrokes feed `lib/stats.ts` through `createStatsSession()`, and the run
  logs one `recordAttempt({ lessonId: "beam-break", type: "game" })`.

## 8. Testing

The game has no DOM to read the live word from, so `BeamBreakWorld` exposes
`window.__beamBreak` (the live state object) **in dev builds only**. The
headless driver recipe in `.claude/skills/verify` uses it to play correctly:

```js
const ch = await page.evaluate(() => {
  const s = window.__beamBreak;
  return s && s.phase === "playing" ? (s.word[s.typed] ?? null) : null;
});
if (ch) await page.keyboard.press(ch);
```

Mutating that object from the console is also the fastest way to reach a state
for a screenshot: `s.animal = 3` (pick a species), `s.grab = 0.97` (nearly
abducted), `s.level = 4; s.palette = 4` (night sky), `s.snareTimer = 0.05`
(incoming ring), `s.word = "tremendous"; s.typed = 3` (worst-case tile row),
`s.gold = true`, `s.alienT = 2.5` (level bubble).
