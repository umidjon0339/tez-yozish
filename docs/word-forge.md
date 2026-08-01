# Word Forge — the 2D lane-defence game (`/word-forge`)

A top-down forge corridor. Scrap-bots march down it at your gate, and **every
bot carries the thing you have to type** — one key on EASY, a word after that.
Type it and your turret shoots that bot. Nothing fires by itself.

**SPACE** switches between the two modes:

- **FIGHT** — keys go at the bots.
- **LOADOUT** — keys go at the two menus beside the lane: a WEAPON name equips
  it, a PERK name buys a level. The lane keeps moving while you shop.

Endless waves, three difficulties, one gate. The wave you die on is your score.

Files:

| File | Holds |
|---|---|
| `app/word-forge/page.tsx` | the route; `next/dynamic` with `ssr: false` |
| `app/word-forge/sim.ts` | data + tuning only — no React, no canvas |
| `app/word-forge/render.ts` | every canvas draw call; pure, never mutates state |
| `app/word-forge/sound.ts` | the inline oscillator synth + the forge drone |
| `app/word-forge/WordForgeWorld.tsx` | `step()`, input, HUD, menus |

Hard rules live in `app/word-forge/CLAUDE.md`. This doc explains the *why*.

---

## 1. Where it came from, and what changed

The brief was a screen recording of the Steam game **Typing Break** (Jan 2026):
a top-down lane with an auto-firing turret, enemies marching down it, and two
columns of upgrade plates either side that you buy by typing their names.

What was taken: the corridor, the gate, the two columns of named upgrade plates
with levels, the currency from kills, and the reading that the whole screen is
something you play with the keyboard.

What is different, and why:

| Here | There | Why |
|---|---|---|
| **You** shoot. Every bot carries a word; one correct key is one shot. | The turret fires on a timer; typing only shops. | A typing trainer cannot have an auto-attack. The first build of this route did, and a player who never touched the keyboard cleared wave after wave. |
| **SPACE opens the loadout**, and the columns are a mode. | The upgrade names share one input space with everything else. | With bot words *and* menu words live at once, the first letter you press is ambiguous. A mode makes "what are my keys doing right now" a thing you can see, not a thing you have to infer. |
| **No weapon range.** | — | An earlier build here gated firing on a range arc so bots would survive long enough to be seen. Once the player is the trigger, a rule of the form "your shot does not work over there" is just a punishment. |
| **The columns sit hard against the lane.** | Out by the screen edges. | They are read in peripheral vision while something is walking at you. |
| **Heat** — keys and kills stoke the forge, it decays, it multiplies damage. | — | Even with manual firing, typing *rate* has to matter and not just typing *correctness*. |
| **REPAIR** and a difficulty picker. | — | A comeback move bought with typing, and a nine-year-old and a fluent typist cannot share one curve. |

---

## 2. The core loop

```
bots spawn above the top edge  →  they march down, each carrying a word
you type a bot's FIRST letter  →  it becomes the locked target
every following correct key    →  one shot at it, one weapon's worth of damage
its HP reaches 0               →  it bursts, you get scrap
its word runs out first        →  it gets a NEW word and you keep going
a bot reaches the gate line    →  gate -= its damage; gate 0 ends the run

SPACE                          →  LOADOUT: keys go to the menus instead
a finished menu word           →  equips / buys, and drops you back to FIGHT
```

**One word kills one bot at wave 1 with a level-1 PISTOL, exactly.** Bot HP is
`word length × HP_PER_LETTER × tough × hpMul(wave)`, and `HP_PER_LETTER` *is* the
PISTOL's damage. That identity is the whole tutorial: the player learns "a word
is a bot" in the first ten seconds and never has to be told anything else. Every
upgrade after that is read against it — a stronger gun kills before the word runs
out, a later wave needs more than one word unless you have upgraded.

### The lock

The first letter you press picks a target: of every bot whose word starts with
it, the one **nearest the gate**. After that only `word[typed]` counts.

- A wrong key costs the streak and is recorded in `lib/stats.ts` against the
  letter that *was* expected. It does **not** drop the lock — hunting for a key
  must not also cost you the target you already committed to.
- The lock is released the instant the word runs out, **before the shot lands**,
  so you are never waiting on a bullet to start the next bot. If that bot
  survives, `damageBot` gives it a fresh word (`refreshWord`) and it can be
  locked again.

`pickCarry` avoids first letters already in the lane, so the choosing key is
usually unambiguous. On EASY it cannot always — nine home-row keys and a dozen
bots — and there the nearest-the-gate rule carries it.

---

## 3. The two modes

FIGHT is the default and it is where the run is won. LOADOUT is where it is
planned. The switch is SPACE in both directions, Esc also backs out of LOADOUT,
and finishing a menu word returns you automatically — you should never have to
think about how to get back to the fight.

Everything about the presentation exists to answer "where are my keys going":

| | FIGHT | LOADOUT |
|---|---|---|
| lane | full brightness | dimmed, with a pulsing amber frame |
| panel columns | 62% opacity, a reference card | full opacity, live |
| the bar under the gate | one line: *type what a bot is carrying · SPACE = loadout* | the menu's input line, with the ghost completion |

**The lane keeps running while the loadout is open.** That is the cost, and it is
the entire reason the mode exists — *when* to duck out and shop is the decision
the player is actually making. Nothing may pause the lane there.

### The menu input

Plain prefix matching over the unlocked panels (`menuMatch`). The buffer only
grows on a key that keeps some name alive; the plate shows the letters typed in
white with the rest of the single matching name ghosted behind them, and a count
when more than one still matches. Two properties keep "the buffer equals a name"
unambiguous, and both must be preserved:

1. **No panel word is a prefix of another.** Hand-checked; see the comment above
   `WEAPONS`.
2. Names are 4–7 letters and say what they do.

---

## 4. Heat

`heat` is 0→1.

- Every correct key adds `HEAT_PER_KEY`, every kill `HEAT_PER_KILL`, a finished
  menu word `HEAT_PER_PANEL`.
- It decays at `HEAT_DECAY`, so holding it at white heat costs about
  `HEAT_DECAY / HEAT_PER_KEY` ≈ 2.2 keys a second ≈ 26 WPM. A beginner at 12 WPM
  sits near half heat: everybody gets some of the bonus, nobody gets all of it
  for free.
- **Damage** is multiplied by `1 + heat × HEAT_DMG_BONUS` — up to 2×.
- At `FORGED_AT` the forge is white hot: shots go golden, hit 35% harder and
  punch through two extra bodies.

There is no heat bar. The fire pit under the turret grows, brightens and throws
more embers with `heatView` (a smoothed follow, so the per-key jumps do not
strobe), and `sfx.setHeat` opens the filter on the forge drone. A dim pit and
silence mean the same thing, and both mean *type*.

`FORGED_COOLDOWN` rate-limits the celebration: at speed you re-cross the
threshold every few seconds and the banner would never leave the screen.

---

## 5. Weapons and perks

`turretStats(s)` is the **single source of truth for what one keystroke does**:
the equipped weapon at its level, every perk folded in, heat applied to the
damage. The renderer and `fireAt` both read it, so a panel can never claim
something the simulation does not do.

Five weapons, not seven — each has to answer "what does ONE key do?" in a
sentence a nine-year-old can repeat, and past five the answers overlap:

| | one key does |
|---|---|
| PISTOL | one clean hit |
| SHOTGUN | a hit, plus two bots standing near the target |
| SNIPER | a hard hit that punches through the line behind it |
| CANNON | a hit that explodes |
| LASER | a beam that lands at once and burns the whole line |

Six perks: SHARP (damage), REPAIR (heal the gate, action not level), BLAST
(your shots explode), FROST (hits slow), CHAIN (shots jump), GOLD (more scrap).

---

## 6. Difficulty, and how it was set

`DIFFICULTY_CONFIG` sets gate HP, starting scrap, pace, pay — and, uniquely to
this route, **how long the thing a bot carries is**. A length of 1 means a
single key, which is what makes EASY a real first-week drill and still an arcade
game.

| | bots carry | gate |
|---|---|---|
| EASY | 1 key from the home row (tanks 3, brutes 5) | 150 |
| MEDIUM | 3 letters (tanks 5, brutes 7) | 110 |
| HARD | 4 letters (tanks 6, brutes 8) | 85 |

The difficulty buttons print those numbers straight from the config, so the menu
cannot lie about the game.

But the number that decides whether the game is a game is **bot walking speed**.
Your time to deal with a bot is how long it takes to walk the lane, not the gap
between spawns. The first build had a grunt crossing in about thirty seconds —
thirty seconds to find one word — and the lane silted up with bots nobody was in
any hurry about. Ten seconds is the figure these tables are built around.

**The measurement to re-run after touching `BOT_DEFS`, `waveBudget`, `waveGap`,
`HP_RAMP`, `HP_PER_LETTER` or any weapon's damage** — drive a run at a realistic
pace and watch the gate:

| Setting | ~24 WPM, 12% typos | ~30 WPM, 70–75% accuracy |
|---|---|---|
| EASY | gate untouched past wave 6 | comfortable |
| MEDIUM | — | first damage at wave 4, dead at wave 7 (~3.5 min) |
| HARD | — | pressure from wave 2 |

If a beginner is dying on EASY inside two minutes, or a competent typist is
still at full gate on MEDIUM at wave 8, the balance has drifted.

### Waves

`buildRoster(wave, cfg)` builds the whole wave's release order up front, so the
spawner is a dumb queue and a wave's shape is decided in one readable place. A
brute leads every `BRUTE_EVERY`-th wave (two from wave 15); everything after the
brutes is shuffled so the heavies are not all at the back.

`WAVE_BREAK` seconds of calm sit between waves. **Typing is live during the
calm** — that is when you are meant to be shopping, and the phase check in the
key handler admits `intro` for exactly that reason.

Panels are hidden until their `unlockWave`, then arrive with a gold halo and a
banner that says *press SPACE to take it*. Wave 1 opens with four
(PISTOL, SHOTGUN, SHARP, and REPAIR at 2) and the board fills to eleven by wave
11. Showing all eleven from the start was tried and is worse: it is a wall of
unreadable words on the one screen where the player is still learning the game.

---

## 7. Coordinates and layout

No camera, no scrolling: everything is screen space, and `layoutFor(W, H)` in
`render.ts` is the one mapping.

The screen is three columns — perks | lane | weapons. The **panel width is chosen
first and the lane takes the rest**, so the lane grows with the window instead of
the margins growing. The columns then sit hard against the lane walls
(`PANEL_PAD`): they are read in peripheral vision, and a menu parked out by the
screen edge is a menu you have to look away to use.

Behind them is the forge hall — brick courses, pipes and a hanging lamp, all
deterministic and very low contrast. It exists so the outer thirds of a wide
screen are a *place* the panels are bolted to rather than flat black.

---

## 8. Feel channels

| Channel | Fires on | Reads as |
|---|---|---|
| `trauma` | a bot reaching the gate, a splash, a brute dying | screen shake — **lane only** |
| `flash` | a brute dying | a warm pop |
| `hurtFlash` | gate damage | a red wash |
| `goldFlash` | the forge going white hot | a gold wash |
| `bufFlash` | a finished word | the bar under the gate glows |
| `modeT` | SPACE | the mode swap |
| panel `flash` / `deny` / `fresh` | bought / could not afford / just unlocked | white pop, red shake, gold halo |
| `Bot.refresh` | a bot outliving its word | the plate flashes white as the word swaps |
| `heatView` | heat | the fire pit's size, brightness and embers |
| danger vignette | gate low | red closing in from the edges |

**Only the lane shakes.** The panel columns, the HUD bar and the mode bar are
outside the offset. They are read under pressure, and a menu that jumps while a
tank is hitting the gate is a menu you cannot read.

Damage numbers pop up **beside** a bot, never above it — above is where its word
is, and a number over the word you are reading is the one popup that can cost
you the round.

---

## 9. Audio

Oscillators and noise buffers only; no mp3s. Two things are not in the sibling
games' synths:

- **The forge bed** — one low sawtooth whose volume and filter cutoff follow
  `heat`. It is the only continuous sound in the game, and it exists because
  heat is invisible when your eyes are on the lane. Paired `startBed()` /
  `stopBed()`; stopped on pause, quit, game over and unmount.
- **Shot throttling** — a fast typist fires many times a second. `playShot`
  drops anything inside `SHOT_MIN_GAP` of the last one.

Attract mode is silent: every `sfx` call inside `step()` and its helpers is
behind `api.scoring`.

---

## 10. Menus and attract mode

The title backdrop is the live game with a **ghost typist** that plays it
properly: it locks the nearest bot, types its word a letter at a time, and every
so often flips into LOADOUT and buys something. So the title screen demonstrates
both modes before the player has read a word of the instructions. When the ghost
has maxed the board it winds the levels back, so a menu left open for a few
minutes does not settle into a wall of MAX denials.

`1` / `2` / `3` start a difficulty directly, `Enter` restarts the last one, `Esc`
pauses (or backs out of LOADOUT first).

The in-run HUD is painted on the canvas: the gate bar, scrap, the wave chip and
the mode bar. Only pause / mute / quit are DOM.

---

## 11. Persistence

- Best **wave** → `localStorage["tz-wordforge-best"]`. Waves are the score here;
  there is no points number, because "how far did you hold" is the thing a kid
  actually brags about.
- Every keystroke goes through `createStatsSession().stroke()`, with a rejected
  key recorded against the letter that was expected — which is what makes the
  `/stats` per-key data from this game meaningful. On EASY, where a bot carries a
  single key, this route is one of the cleanest per-key feeds in the project.
- The run is logged with `recordAttempt({ lessonId: "word-forge", type: "game", … })`.

---

## 12. Dev hook

`window.__wordForge` exposes the live state object in development only (behind
`NODE_ENV === "production"`). The whole game is a canvas, so the headless driver
in `.claude/skills/verify` has no DOM to read the words from:

```js
// what the game currently wants you to type
const next = await page.evaluate(() => {
  const s = window.__wordForge;
  if (s.mode === "loadout") return null;      // panel words are constants in sim.ts
  const live = s.bots.filter(b => b.deadT === 0 && b.born > 0.2);
  live.sort((a, b) => b.y - a.y);             // nearest the gate first
  const b = live[0];
  return b ? b.word.slice(b.typed) : null;
});
```

Driving it a letter at a time through `page.keyboard.press` is accurate but slow;
dispatching a whole word through `window.dispatchEvent(new KeyboardEvent(...))`
in one `page.evaluate` is what makes a multi-wave test finish in under a minute.
Both go through the same `window` keydown listener.

One trap when driving this route with a dev server: **do not `rm -rf` the route
directory to refresh it.** Next's watcher drops the route and every request 404s
until the server restarts with a clean `.next`. Copy files over the existing ones
instead.
