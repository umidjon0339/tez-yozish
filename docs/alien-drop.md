# Alien Drop — the 2D falling-pod game (`/games/alien-drop`)

Alien drop-pods fall out of the sky over a colony, each one carrying **one
character** on its porthole. Type that character and the hero's blaster snaps
onto that pod and shoots it out of the air. Let a pod reach the ground and it
cracks open on the colony: the shield bar drops. Shield at zero ends the run.
Endless, with a new wave every 12 pods.

Files:

| File | Holds |
|---|---|
| `app/games/alien-drop/page.tsx` | the route; `next/dynamic` with `ssr: false` |
| `app/games/alien-drop/sim.ts` | data + tuning only — no React, no canvas |
| `app/games/alien-drop/render.ts` | every canvas draw call; pure, never mutates state |
| `app/games/alien-drop/sound.ts` | the inline oscillator synth |
| `app/games/alien-drop/AlienDropWorld.tsx` | `step()`, input, HUD, menus |

Hard rules live in `app/games/alien-drop/CLAUDE.md`. This doc explains the *why*.

---

## 1. What makes it different from the other five games

Ninja Run, Rhino Dash, Sky Hop, Tug of Typing and Beam Break are all **word**
games: you type a word, something happens. Alien Drop is the only game whose
whole mechanic is **one keystroke per target**. (Beam Break's tier-0 pool
happens to be single letters, but it is structurally a word game — the letter
is a one-character *word* inside a tile row, and the difficulty model is about
sustaining a rate, not about reacting to one arrival.)

That is a deliberate gap-filler, not a shortcut:

- It trains **letter recognition and reaction** — find the key, hit it, now —
  rather than sustained flow. That is the skill a beginner is missing before
  words are even possible.
- It is the cleanest possible feed for `lib/typing/stats.ts`. Every keystroke is an
  isolated, unambiguous sample of "how fast can you find this one key", with no
  neighbouring letters priming the finger. The `/stats` per-key heatmap is
  noticeably sharper after a few Alien Drop runs than after any word game.
- On EASY the pool is the nine home-row keys, so it works as a first-week drill
  that still looks like a real arcade game.

Do not turn it into a word game. If a word-based falling-object game is ever
wanted, that is a different route.

---

## 2. The core loop

```
spawn pod (one char)  →  it falls, accelerating
                      →  player types that char
                      →  pod is TAGGED and frozen; score/streak/wave/nova bank NOW
                      →  the blaster fires; the bolt catches up ~0.2 s later
                      →  detonate(): burst, sound, pod removed
      …or the pod reaches the ground → impact, shield -= cfg.damage
```

**The kill is banked on the keystroke; the bolt is theatre.** `scoreKill()`
moves everything the player cares about the moment the key lands, and
`detonate()` only does particles, sound and removal when the bolt arrives. This
is what makes the game feel instant despite having a travelling projectile —
the "+10" popup and the streak chip react in the same frame as the key.

The cost of that split is that a tagged pod is a pod with an outstanding
promise. Three independent mechanisms guarantee it is always kept:

1. the bolt's `remain <= 0` (normal case),
2. the bolt's `life > 1.2 s` cap (a bolt that somehow never arrives),
3. the `deadT > 1.6 s` safety net in `step()` (a bolt that was deleted).

and `fireNova()` clears **all** pods, tagged ones included, before emptying
`s.bolts`. Removing any one of these leaves a ghost pod frozen in the sky.

### Targeting

Of every live pod showing the pressed character, the **lowest** one dies. With
nine keys on EASY, duplicates on screen are unavoidable — `pickChar()` tries
ten times to pick an unused letter and then gives up — so the rule has to be
one the player can predict, and "the one about to land" is the only rule that
never punishes them for playing correctly.

A key that is in `cfg.keys` but matches no pod costs the streak and nothing
else. A key that is **not** in `cfg.keys` (a `z` on EASY) is ignored entirely —
no miss, no accuracy hit. This game punishes pods that **land**, not wrong
guesses; a beginner hunting for a key is never put further behind than the
falling pods already put them.

---

## 3. Difficulty and the three accelerations

`DIFFICULTY_CONFIG` sets the character pool, the starting pace and the damage.
Everything about how the run tightens comes from three stacked accelerations:

| # | Scope | Knob | Effect |
|---|---|---|---|
| 1 | per pod | `POD_ACCEL_FRAC` | a pod is fired at `speed × 0.62` and accelerates to `× 1.5`, so the last metres are always the tense ones |
| 2 | per wave | `gapDecay`, `speedRamp` | the spawn gap decays geometrically and the fall speed ramps, every 12 kills |
| 3 | per run | `ACCEL_PER_SEC` | a slow global multiplier on time alone, capped at `ACCEL_CAP` |

`gapAt(cfg, wave, runSec)` and `speedAt(cfg, wave, runSec)` are the **only**
place those three are combined. #3 is what guarantees a run ends: without it a
player who clears every wave instantly would stall at a fixed pace for ever.

`wpmAt(cfg, wave)` derives the menu's WPM figures from `gapAt` — one pod is one
keystroke, so the pace the spawner demands is exactly `60 / gap / 5` WPM. **The
menu prints that function's output**, so a config change updates the advertised
difficulty automatically and the menu can never lie about the game.

Current figures (wave 6): EASY ≈ 10 WPM, MEDIUM ≈ 16 WPM, HARD ≈ 25 WPM. The
floors (`gapMin`) put the eventual ceilings at ≈ 15 / 22 / 30 WPM.

### Pod kinds

`kindFor(spawnIndex)` makes every `GOLD_EVERY`-th pod golden (double score) and
every `MEDIC_EVERY`-th a medic pod (`MEDIC_HEAL` shield back). `nextId` restarts
with the run, so the cadence is identical every time rather than drifting with
how much the player played before.

### Waves and swarms

`WAVE_KILLS` pods clears a wave: `+WAVE_BONUS`, a banner, the next sky palette,
and a tighter `gapAt`. Every `SWARM_EVERY` waves the next one opens with a
**swarm** — `SWARM_SIZE` pods dropped at once, evenly spread, after
`SWARM_WARN` seconds of telegraphed warning. A swarm adds no new code path; it
is the ordinary spawner called five times with a forced `x`.

### The nova

Every kill adds `1 / NOVA_COMBO` to `hero.charge`, drawn as the meter on the
hero's own chest plate. At full charge **SPACE** clears the sky for half score
each. Pods never carry a space, so the key is free.

It is the one screen-clearing move and it is deliberately *earned*: a kid who
panics can dig out of a bad wave, but only after 20 clean hits.

---

## 4. Coordinates

There is **no scrolling and no camera** — the simplest of the five games.
Everything is screen space: pods fall from `SPAWN_Y` to `Layout.groundY`, the
hero stands at `Layout.heroX`.

`layoutFor(W, H)` derives one `scale` (1 at 800 px tall, clamped 0.62–1.35) plus
`heroU = scale × HERO_SCALE`. **The hero is drawn at `heroU`, everything else at
`scale`** — he is the star of the scene and is deliberately oversized relative
to the terrain.

`muzzleOf()` and `drawHero()` share that skeleton and must be changed together.
They are the reason bolts appear to leave the barrel.

---

## 5. The hero

A kid in a space suit with an oversized blaster. Three things are load-bearing:

- **He mirrors.** `hero.face` (±1) flips the whole sprite so the blaster is
  always held on the side he is shooting at. Without it, a pod on the far left
  swings the barrel straight across his visor. The flip has a `FACE_FLIP`
  deadzone so a pod near the centre cannot make him spin back and forth, and
  the gun is drawn rotated by `aim * face` — the mirror negates it back.
- **Draw order is backpack → legs → torso → helmet → arms → gun.** The helmet
  goes down before the things he is holding, so his face is readable at every
  aim angle. The shadow is drawn *outside* the mirror so it stays under his
  feet.
- **The barrel tracks the lowest pod between shots.** That is not decoration:
  it is a second, peripheral pointer at the pod that is actually about to land,
  for a player whose eyes are on the middle of the screen.

His chest panel is the nova meter, his backpack thruster brightens with it, and
his face reads the run: a flat line normally, an "o" while firing, a grimace
when the colony is hit.

---

## 6. Feel channels

| Channel | Fires on | Reads as |
|---|---|---|
| `trauma` | a pod landing | screen shake (a deterministic sine pair — never `Math.random()`) |
| `flash` | any kill | a white pop |
| `goldFlash` / `healFlash` / `errFlash` / `hurtFlash` | gold, medic, wrong key, damage | a coloured wash |
| `waveBanner` | wave up | the banner |
| `novaT` | nova | the expanding shockwave ring |
| danger vignette | shield low | red closing in from the edges |

Unlike Beam Break, this game **does** have screen shake — a pod cracking open on
the colony is a real impact and reads wrong without it. It is the only thing
that offsets the scene.

---

## 7. Audio

Oscillators and noise buffers only; no mp3s. Every sound is a short one-shot
tied to a player action, **except the siren**.

`sfx.setAlarm(level)` reschedules a two-tone beep whose rate and pitch follow
how close the nearest pod is to the ground. It is a pulsed timer, not a drone,
and it only opens up in the bottom half of the red zone (`SIREN_FROM`), so
silence genuinely means "nothing is about to land". It is the one piece of
information the player cannot get by looking at where their eyes already are.

It must be stopped on pause, quit, game over and unmount — `stopAlarm()` is
called from all four.

Attract mode is **silent**: `fireAt()` and `detonate()` take a `scoring` flag
so the menu backdrop can play itself without beeping behind the card.

---

## 8. Menus and interactivity

- The menu backdrop is the live game in attract mode: pods fall and the hero
  shoots them down by himself.
- Hovering (or focusing) a difficulty button swaps the row of pods above the
  title and the key list at the bottom to that difficulty's actual pool, so the
  menu answers "what keys will I be pressing?" before you commit.
- `1` / `2` / `3` start a difficulty directly; `Enter` restarts the last one;
  `Esc` pauses.
- The in-run HUD is the reference game's: a heart + shield bar, the score in
  big outlined numerals, and a wave chip whose fill *is* the progress through
  the current wave. Everything else waits for the game-over card.

---

## 9. Persistence

- Best score → `localStorage["tz-aliendrop-best"]`.
- Every keystroke goes through `createStatsSession().stroke()`; a miss records
  the lowest pod's character as the expected key, which is what makes the
  `/stats` per-key data meaningful.
- The run is logged with `recordAttempt({ lessonId: "alien-drop", type: "game", … })`.

---

## 10. Dev hook

`window.__alienDrop` exposes the live state object in development only (behind
`NODE_ENV === "production"`). The whole game is a canvas, so the headless
driver in `.claude/skills/verify` has no DOM to read the pods from:

```js
const ch = await page.evaluate(() => {
  const live = window.__alienDrop.pods.filter(p => p.state === "fall");
  live.sort((a, b) => b.y - a.y);
  return live[0]?.ch;            // the pod the game expects you to shoot
});
await page.keyboard.press(ch);
```

Pods can also be placed by hand to test a specific aim angle — push an object
with the `Pod` shape into `window.__alienDrop.pods`.
