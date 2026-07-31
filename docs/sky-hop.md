# Sky Hop — `app/sky-hop/`

2D **canvas** typing game (no three.js, no image assets, no mp3s), third
sibling of typing-ninja and rhino-dash. Single entry point: `/sky-hop`
(`page.tsx`, `next/dynamic` + `ssr: false`, fullscreen fixed overlay). Not
embedded in the lesson runtime — arcade only, linked from `/games`.

Files:

| File | Holds |
|---|---|
| `sim.ts` | tuning constants, word tiers, sky palettes, state type, `getInitialState`/`resetRun`, particle emitters. **No React, no canvas.** |
| `render.ts` | every draw call (`draw(ctx, s, W, H)`), the `Layout` + `altToY`/`screenX` mapping. **Pure — reads state, never mutates it.** |
| `sound.ts` | `SkyHopSound` oscillator synth + the shared `sfx` instance. |
| `SkyHopWorld.tsx` | React shell: the rAF loop, `step()` (the only writer of state), keyboard input, the localised `UI` dict, HUD and menus. |
| `page.tsx` | dynamic import wrapper. |

## 1. Game design

The hero (a ninja, matching typing-ninja) dangles from a balloon over the
ocean. A chain of labelled balloons climbs away to the right; the next one is
the target — it glows and gets the green chevrons. Type its label and the hero
**hops** onto it.

**Flight model** — the whole game is one equation. The balloon leaks air
constantly (`cfg.sink`, ramped by stage), each correct key adds `cfg.keyLift`
and finishing a word adds `cfg.hopLift`. Holding altitude therefore needs a
steady keys/sec ≈ `sink / liftPerKey`, which is how the difficulties are
tuned — EASY ≈ 12 WPM to hold, MEDIUM ≈ 25, HARD ≈ 35. A typo costs
`MISS_DROP`; below `MERCY_ALT` the leak slows to `MERCY_FACTOR` so a
struggling kid gets a fighting chance near the water. Lift that would overflow
`alt = 1` pays out as score instead, so typing faster than needed is never
wasted.

**Endless, 3 lives.** `alt` hitting 0 is a splash: one life gone, then the hero
is rescued at `ALT_RESPAWN` with `IMMUNE_TIME` of grace. At 0 lives the run
ends (WPM / accuracy / time / balloons / streak / gold / crows).

**Stages.** Every `HOPS_PER_STAGE` balloons is a checkpoint: an island slides
past, the word pool climbs a tier (every `TIER_EVERY` stages), the leak gets
`STAGE_SINK_RAMP` faster (up to `STAGE_SINK_CAP` = 4×, ≈100 WPM to hold — an
endless game must eventually outpace anyone), the sky changes palette
(`PALETTES`, cycling every 6 stages: morning → noon → golden hour → dusk →
starlight → thunderhead), and every `LIFE_EVERY` stages returns a life.

**Crows** (from stage 1): every `CROW_MIN`–`CROW_MAX` seconds one caws,
telegraphs on screen for `CROW_TELE`, then dives for `CROW_DIVE` at the balloon
index it committed to. Hop off that balloon before it lands and it grabs
rubber (+75, `crowsDodged`); otherwise your balloon bursts, you drop
`CROW_DROP`, and a spare inflates. This is the game's urgency beat — the same
role rhino-dash's rage-shove plays.

**Golden balloons** — every `GOLD_EVERY`th balloon in the chain, carrying a
word one tier longer, worth double score plus a sparkle burst.

## 2. Simulation model: refs, not React state

Same contract as the other two games (see `docs/typing-ninja.md` §1):

- One mutable object from `getInitialState()` lives in `stateRef`; `step()` in
  `SkyHopWorld.tsx` is its **only** writer. Every frame clamps
  `dt = Math.min(delta, 0.1)`.
- React state is only the ~20 Hz `hud` snapshot plus menu flags. Unlike the
  other two games there is **no per-keystroke React state at all** — the word
  and its typed prefix are painted from `stateRef` by the canvas, so a
  keystroke costs zero re-renders.
- One rAF loop runs for the whole mount: it always draws, and steps only while
  `PLAYING` (or `MENU`, which runs the attract mode). `PAUSED` and `GAME_OVER`
  freeze the sim but keep the last frame on screen behind the modal.

**Coordinates.** One mapping: `screenX(worldX) = worldX - camX + W*HERO_X_FRAC`,
with chain balloon `ix` at `worldX = ix * SPACING`. There is no camera Y — the
hero moves inside the frame via `alt`, and `altToY()` maps `alt = 0` to the
waterline **for the hero**, which hangs `HERO_DROP` below the envelope centre.
`camX` eases toward `heroIx * SPACING`, so a hop puts the hero ahead of the
anchor and the camera reels them back: that lag *is* the swing.

**Feel channels** read by the renderer only: `lift`, `errFlash`, `redFlash`,
`goldFlash`, `trauma` (screen shake), `stageBanner`, `splashT`, `lightning`,
`sway`, `hopT`, `combo` (wind streaks at ≥20).

`GameState = MENU | PLAYING | PAUSED | GAME_OVER`; `phase` (`idle`,
`countdown`, `flying`, `splash`, `over`) is the sub-state inside PLAYING.
Typing input is accepted **only** in `flying`. Esc pauses, Enter starts or
restarts.

**Attract mode.** In `MENU` the sim runs with `phase = "idle"`: it types the
target word itself one letter every 0.17 s and hops, so the menu backdrop
plays the game. `backToMenu()` must reset `phase = "idle"` (and stage/islands)
or the backdrop keeps the finished run's sky.

## 3. Rendering

`render.ts` paints, back to front: sky gradient (+ stars/crescent at night) →
far hills → far clouds → sea (wave bands, foam, sun glitter) → near clouds →
checkpoint islands → air-puff particles (`drawParticles(…, "back")` — they vent
from under the hero, so they belong behind everything) → free/burst balloons →
chain balloons (far to near, so the target reads on top) → hero rigging → hero →
crow → the remaining particles (`"front"`: pops, sparkles, feathers, spray) →
overlays (rain, lightning, danger vignette, flashes, wind streaks).

Everything is procedural and scaled by `Layout.scale` (`H / 800`, clamped), so
the composition holds from phone to 4K. Infinite background layers (hills,
clouds, stars) are generated from `hash(i)` over the visible index range —
deterministic, so they never shimmer as the camera moves.

**Labels.** Single letters are painted inside the envelope (dark outline then
white face, so they stay legible on every balloon hue); words ride a pill under
the basket. Typed characters go emerald, the awaited character gets an amber
box (red on a typo), the rest stay slate. Balloons up to 5 ahead show their
label dimmed — that's the look-ahead the game teaches.

## 4. Invariants

- `step()` is the only writer of `stateRef.current`; `render.ts` never mutates.
- `dt` is clamped to 0.1 s in `step()`.
- The chain always has a balloon at `heroIx` — anything that pops it (splash,
  crow hit) must remove it and call `refillChain()`, which re-creates the
  ridden index as well as topping up `QUEUE_AHEAD` ahead.
- `flyTimeMs` (the WPM clock) advances only in `phase === "flying"`.
- Particles are capped (`PARTICLE_CAP` in `addParticle`); free balloons expire
  by `ttl`; islands are dropped once `ix < heroIx - 4`.
- Audio is the inline oscillator synth — no mp3 assets on this route. `init()`
  is only called from the click that starts a run.
- All player-facing text goes through the localised `UI` dict (en/uz/ru) in
  `SkyHopWorld.tsx`, including the sky names (keyed by `SkyPalette.key`).
- Score/record: `tz-skyhop-highscore`. Keystrokes feed `lib/stats.ts` through
  `createStatsSession()`, and the run logs one `recordAttempt({ lessonId:
  "sky-hop", type: "game" })`.

## 5. Testing

The game has no DOM to read the live word from, so `SkyHopWorld` exposes
`window.__skyHop` (the live state object) **in dev builds only**. The headless
driver recipe in `.claude/skills/verify` uses it to play correctly:

```js
const ch = await page.evaluate(() => {
  const s = window.__skyHop;
  const t = s.balloons.find((b) => b.ix === s.heroIx + 1);
  return t ? t.word[s.typed] : null;
});
await page.keyboard.press(ch);
```

Mutating that object from the console is also the fastest way to reach a state
for a screenshot (`s.stage = 5`, `s.crowTimer = 0.01`, `s.alt = 0.01`).
