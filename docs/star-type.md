# Star Type — the 2D space typing shooter (`/games/star-type`)

Enemy drones dive at your ship, each carrying one word. Type a word's **first
letter** to lock on, then type the rest to shoot the drone down. One drone
reaching your ship ends the run. Endless waves.

Files:

| File | Holds |
|---|---|
| `app/games/star-type/page.tsx` | the route; `next/dynamic` with `ssr: false` |
| `app/games/star-type/sim.ts` | data + tuning only — no React, no canvas |
| `app/games/star-type/render.ts` | every canvas draw call; pure, never mutates state |
| `app/games/star-type/sound.ts` | the inline oscillator synth |
| `app/games/star-type/StarTypeWorld.tsx` | `step()`, input, HUD, menus |

Hard rules live in `app/games/star-type/CLAUDE.md`. This doc explains the *why*.

---

## 1. What this route is

A faithful re-build of the **ZType** arcade loop. It is the first game in the
app built from a "copy the reference" brief rather than a "take the idea and
make it ours" one, and that changes what good looks like here: the interesting
decisions are almost all about what was left OUT.

**Deliberately absent** (the reference has none of them):

- no difficulty picker — the wave ramp *is* the difficulty
- no lives, no health bar, no shield — one drone reaching you ends the run
- no power-ups, no medic/gold variants, no screen-clearing move
- no combo multiplier — the streak is a *stat*, not a scoring mechanic
- no in-run score, accuracy or streak read-out

That last one matters most. The in-run HUD is the wave badge and three chrome
buttons and nothing else, because the reference's restraint is what keeps your
eyes on the falling words instead of on a scoreboard. Everything the player
earned is shown once, on the results screen, at the end.

**The one intentional departure** is layout. The reference is a portrait phone
game. This fills a landscape window, so `layoutFor` scales off
`min(H, W × 0.62)` (an ultrawide monitor must not blow the sprites up), drones
spawn across the whole width, and they *converge* on the ship rather than
dropping straight down — on a wide screen a vertical rain reads as a wall
rather than as an attack.

---

## 2. The lock-on model

This is the whole game, so it is worth stating precisely.

```
no lock  →  the key must be the FIRST letter of some live word.
            Of every match, the drone NEAREST THE SHIP is locked.
            No match → miss (streak resets, accuracy drops).

locked   →  the key must be word[typed].
            Correct → typed++, fire a bolt, streak++.
            Wrong   → miss. The lock is NOT dropped.
            typed === word.length → the drone is doomed, the lock frees.
```

Three parts of that are load-bearing:

**Nearest-to-ship wins.** When two words start with the same letter (which the
spawner works hard to prevent, but cannot always), the player must be able to
predict which one they get, and "the one about to kill me" is the only answer
that never punishes correct play.

**A typo does not drop the lock.** Hunting for a key already costs you a
keystroke and your streak; also losing the target you committed to would punish
the same mistake twice, and it makes the game unrecoverable for a beginner.

**Two live words never share a first letter.** `pickWord()` is passed
`liveInitials(s)` and rejects any word whose initial is already in the sky. A
locked word's initial stays reserved until the drone is doomed, so a new drone
cannot steal it mid-word. With 26 drones on screen late on the pool can be
exhausted — the function gives up after 24 tries and the nearest-drone rule
covers the rest.

---

## 3. Doomed drones, and why they exist

Finishing a word does **not** delete the drone. It sets `doomed = true`; the
drone dies when its killing bolt lands, exactly like the reference — that
quarter-second of a bolt crossing the screen is most of the game's feel.

That split creates three obligations, all of them handled in `step()`:

1. **A doomed drone cannot kill you.** The collision check skips them. Dying to
   something you had already typed out is technically consistent and reads as
   the game cheating; the killing bolt is only ~0.2 s behind anyway.
2. **A doomed drone must always die.** If its bolt were ever lost, it would fly
   on for ever — un-targetable (`findTarget` skips doomed) and un-killable. The
   safety net destroys any doomed drone with `incoming === 0`.
3. **Bolts can land out of order.** The drone closes on the ship as you type, so
   a later bolt has a *shorter* flight than an earlier one and can overtake it.
   The landing code tolerates a missing target rather than assuming the killing
   bolt lands last.

---

## 4. The wave ramp

`waveCount` / `waveSpeed` / `waveGap` in `sim.ts` are the whole difficulty
model:

| | wave 1 | wave 5 | wave 10 |
|---|---|---|---|
| drones | 10 | 18 | 26 (cap) |
| speed (px/s @ scale 1) | 29 | 43 | 60 |
| release gap (s) | 1.35 | 0.89 | 0.52 |

A wave is cleared when the queue is empty *and* the sky is empty; then
`WAVE_BREAK` seconds of "WAVE 00N" and the next one starts.

Word length rides the same ramp: `pickWord` unlocks `2 + floor(wave / 2)`
length buckets and rolls twice keeping the smaller, so short words stay common
even once long ones are available. That is what produces the reference's
signature mix of `raw` and `inserting` on the same screen.

---

## 5. Scoring

`score += word.length` for each destroyed drone — one point per letter, which
is what the reference's numbers imply (a 4-wave run with a 22 streak scored
000096). It is shown zero-padded to six digits.

The results screen is the reference's four figures: **FINAL SCORE**, **YOU
REACHED WAVE**, **ACCURACY**, **LONGEST STREAK**. Best score persists in
`localStorage["tz-startype-best"]`.

The title and results screens are dark and cyan rather than the cream/ink card
the other five games use. That is deliberate — they are the reference's
screens, and this route's whole brief was to look like it.

---

## 6. The look

Three things carry it, and they get the most care in `render.ts`:

1. **A very dark blue-green field** with six huge, near-invisible nebula washes
   and 150 twinkling stars.
2. **The drifting grid** — rotated ≈3.2° and scrolling downward. The tilt is
   the point: axis-aligned it reads as a spreadsheet, and the slight rotation
   is what makes empty space feel like a surface in motion.
3. **The word labels.** Solid black box, word in white; once locked, only the
   letters you have LEFT are drawn, in amber, **at their true x position** —
   the typed prefix is not drawn but its width is still reserved by the box.
   Letting the remaining text slide left as you type makes the game unplayable
   at speed, and getting this detail right is most of why it feels like the
   reference.

Drones are a dark disc in a glowing amber ring with a heading arrow; the radius
grows with the word length and the big ones get outrigger arms, so how much
work a drone is reads before you have read its word. The ship is a cyan
wireframe with a pulsing engine flare.

The death beat is a flash, a cyan blast, and a **slice glitch** that redraws
strips of the already-painted canvas offset sideways — the reference datamoshes
the frame and this is that. Its randomness is `hash(slice, tick)` so it stutters
deterministically instead of buzzing, and the additive channel split is kept at
very low alpha: at any real strength a full-screen fill stops reading as a
glitch and just turns the frame blue.

---

## 7. Audio

Oscillators and noise only; no mp3s. Every sound is a one-shot: a shot pip
whose pitch climbs through the word (so a long word sings upward and you *hear*
how close the kill is), a kill burst, a soft miss thud, a wave chime and the
ship's death. There is **no music and no drone** — the reference is near-silent
between shots, and that silence is what makes twenty drones feel tense.

---

## 8. Persistence

- Best score → `localStorage["tz-startype-best"]`.
- Every keystroke goes through `createStatsSession().stroke()`; a miss records
  the letter that *was* expected, so `/stats` per-key data stays meaningful.
- The run is logged with `recordAttempt({ lessonId: "star-type", type: "game", … })`.

---

## 9. Dev hook

`window.__starType` exposes the live state object in development only (behind
`NODE_ENV === "production"`). The whole game is a canvas, so the headless
driver in `.claude/skills/verify` has no DOM to read the words from:

```js
const key = await page.evaluate(() => {
  const s = window.__starType;
  if (s.locked) {                                   // mid-word: the next letter
    const d = s.drones.find(x => x.id === s.locked);
    if (d && d.typed < d.word.length) return d.word[d.typed];
  }
  const live = s.drones.filter(d => !d.doomed && d.born > 0.2);
  live.sort((a, b) => b.y - a.y);                   // nearest the ship first
  return live[0]?.word[0];                          // …its initial locks on
});
await page.keyboard.press(key);
```

To test the death beat, move a drone onto the ship:
`s.drones[0].x = innerWidth / 2; s.drones[0].y = innerHeight * 0.855;`
