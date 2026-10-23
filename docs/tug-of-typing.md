# Tug of Typing — `app/games/tug-of-typing/`

2D **canvas** typing game (no three.js, no image assets, no mp3s), a top-down
tug-of-war against an endless ladder of rivals. Single entry point:
`/games/tug-of-typing` (`page.tsx`, `next/dynamic` + `ssr: false`, fullscreen fixed
overlay). Arcade only — not embedded in the lesson runtime; linked from
`/games`.

Files: `sim.ts` (tuning, words, state, emitters — no React/canvas),
`render.ts` (all drawing, pure), `sound.ts` (oscillator synth),
`TugWorld.tsx` (rAF loop, `step()`, input, localised `UI` dict, HUD, menus),
`page.tsx` (dynamic import wrapper).

## 1. Why it is not Rhino Dash

Both are tug-of-war typing duels, so the difference is deliberate and worth
keeping: **Rhino Dash** is a 3D endurance ladder against an abstract "enemy
push", one life, no win screen. **Tug of Typing** is a 2D top-down *race
against a stated typing speed* — the rival types the same word you do at a WPM
printed on screen, and clearing a level hands you a faster one. If a change
would make one of them play like the other, it is the wrong change.

## 2. Game design

**The shared word race.** Both sides work on the *same* word. Every correct
letter you type adds an impulse to `playerForce`; every letter the rival
"types" adds one to `botForce`. Both decay with `FORCE_TAU`, so a steady force
≈ `keysPerSecond · FORCE_TAU` — the rope drifts at (your keys/sec − the
rival's keys/sec) × constants, which makes the whole game one honest speed
comparison. Whoever finishes the word first lands a small symmetric `HEAVE`
and a fresh word drops for both; partial progress is lost by both sides.

**Endless levels.** Crossing ±`WIN_AT` decides the level. Win and
`startLevel()` runs again with `botWpm + LEVEL_WPM_STEP` (+4 WPM) and, every
`LEVEL_TIER_EVERY` levels, a longer word pool — forever. Lose the rope once
and the run is over. `DIFFICULTY_CONFIG` only picks where the ladder *starts*
(EASY 18 / MEDIUM 30 / HARD 45 WPM), and that number is printed on the menu
button, in the HUD and on the result screen.

So a run reads as a speed ladder: you climb until the rival's WPM passes what
you can sustain, and the level you died on *is* your typing speed. A 41 WPM
player on EASY reliably ends around level 7 (a 42 WPM rival).

**No clock — the rival digs in instead.** Two pullers matched to the WPM can
hold the middle forever, so past `RAMP_AFTER` seconds in a level the rival's
per-key pull grows by `RAMP_RATE` up to `RAMP_MAX`. It is shown, not counted:
the rival strains harder, kicks up dust continuously, and a red glow builds
under its heels. There is deliberately **no countdown anywhere in the game**.

**Deliberately absent.** Earlier passes had golden double-pull words, a
best-of-3 match structure, a visible round clock, a "bot took that word!"
banner, a second wind, a rubber band and a tension drum. All were removed to
keep the game one clear idea. Two of them were also outright bugs (see §5).
Think hard before adding a mechanic back.

**What is left:** typos slip you back (`TYPO_SLIP`) and cut your force but
never block the word; a combo counter; score from letters, words and cleared
levels.

## 3. Simulation model: refs, not React state

Same contract as the other games (see `docs/sky-hop.md` §2):

- One mutable object from `getInitialState()` lives in `stateRef`; `step()` in
  `TugWorld.tsx` is its **only** writer, and clamps `dt` to 0.1 s.
- React state is only the ~20 Hz `hud` snapshot plus menu flags. The word and
  its typed prefix are painted from `stateRef` by the canvas, so a keystroke
  costs zero re-renders.
- One rAF loop for the whole mount: it always draws, and steps only while
  `PLAYING` (or `MENU`, which idles the attract scene — the rope sways and the
  kids strain behind the menu card).

`GameState = MENU | PLAYING | PAUSED | GAME_OVER`; `phase` (`idle`,
`countdown`, `pull`, `levelover`, `over`) is the sub-state inside PLAYING.
Typing input is accepted **only** in `pull`.

**Geometry.** No camera: the marker sits at `centerX + rope · (lineR −
centerX)` and each puller `GRIP_GAP` to either side of it, so the whole
formation translates as the rope moves — the winner retreats toward its own
line dragging the loser along, exactly like the original.

## 4. Rendering

`render.ts` paints: turf → mown stripes → speckle → mud → stadium bands and
sidelines → skid marks → chalk lines (the boundary flushing red/green as the
marker nears it) → rope (two braided strands, sag inversely proportional to
`tension`, diamond marker) → the two kids → particles → letter tiles + the
rival's race bar → overlays.

**The kids** are drawn facing left and mirrored, laid out along local x from
the rope outward: shoes (−36) → knees (−8) → hips (+9) → shoulders (+24) →
head (+45). That is the real stance — heels braced toward the rope, body
leaning away, arms reaching forward to the grip. They are human, not mascots:
bare shins and forearms in skin tone, a team shirt with short sleeves, shorts,
sneakers with a team stripe, a wristband, hair capping the back of the skull
(the rival has a ponytail), and a face that squints, lowers its brows and opens
into a grimace as `strain` rises. The legs are splayed to ±23 on purpose: any
narrower and they disappear behind the arms, which pass through the same part
of the silhouette.

**The race readout** is the key instrument: the keycap tiles show *your*
progress (typed = emerald, current = amber, error = red) and directly
underneath, a red bar shows *the rival's* progress on the same word with a blue
notch for yours — so "am I winning this word?" is one glance. The only other
readout is one line at the bottom: `RIVAL <wpm> · YOU <live wpm>`, your number
green while you are out-typing the rival and red while you are not.

## 5. Invariants

- `step()` is the only writer of `stateRef.current`; `render.ts` never mutates.
- `dt` is clamped to 0.1 s in `step()`.
- **The rival's shown WPM must stay true.** `botKeysPerSecond()` returns
  exactly `botWpm` — nothing may quietly scale it. `BOT_REGRIP` applies only
  after a word the rival **won**; it compensates the human's reading time after
  being beaten to a word. Pausing it after every word (an earlier bug) silently
  turned a 35 WPM rival into a ~29 WPM one.
- **Every level must be able to end.** The dig-in ramp is the only backstop
  now that the clock is gone. An earlier pass had a 25% second wind *plus* a
  rubber band that slowed the rival when the player was behind; together they
  exactly cancelled a 25% speed deficit, parked the rope at −0.65 and made
  losing impossible. Any comeback aid must stay well under the gap it softens.
- `pullTimeMs` (the WPM clock for stats) advances only in `phase === "pull"`.
- Particles are bounded (`PARTICLE_CAP` in `addParticle`); skids are capped and
  expire by `ttl`.
- Audio is the inline oscillator synth — no mp3s, and **no music at all**: only
  rope ticks, grunts, a whistle and the crowd.
- All player-facing text goes through the localised `UI` dict (en/uz/ru) in
  `TugWorld.tsx`.
- Score/record: `tz-tug-highscore`. Keystrokes feed `lib/typing/stats.ts` via
  `createStatsSession()`, and each run logs one `recordAttempt({ lessonId:
  "tug-of-typing", type: "game" })`.

## 6. Testing

`TugWorld` exposes `window.__tug` (the live state) **in dev builds only**, so
the headless driver can read the current letter and play properly:

```js
const ch = await page.evaluate(() => {
  const s = window.__tug;
  return s.phase === "pull" ? (s.word[s.typed] ?? null) : null;
});
await page.keyboard.press(ch);
```

Balance is verified by driving the browser at a fixed interval — 12000/WPM ms
per key, minus ~35 ms of driver overhead — and checking where the ladder
stops: the run should end within a level or two of the rival's WPM passing the
driver's WPM (a 61 WPM driver on MEDIUM reaches level 10 ≈ 66 WPM; a 41 WPM
driver on EASY ends at level 7 ≈ 42 WPM). Re-run that after touching any
tuning constant.
