# app/word-forge/ — the 2D lane-defence game

Read **`docs/word-forge.md`** before editing.

The scene comes from the Steam game *Typing Break* (a top-down lane, an
auto-firing turret, two columns of upgrade plates you buy by typing). The
mechanic does **not**: here nothing fires by itself, and the two columns are a
mode you switch into.

Hard rules:

- **Nothing fires by itself.** Every shot is one keystroke. If a change would
  make the turret shoot on a timer, it is the wrong change — that was the first
  build of this route and it was replaced on purpose.
- **Every bot carries what you type**, and the label above its head is the only
  thing in the lane the player is reading. `drawBotWord` runs for all bots in
  its own pass after the sprites, clamps into the lane, and flips below the bot
  when there is no room above (a bot walks in from off the top edge).
- **Two modes, and SPACE is the only switch.** FIGHT sends keys at bots,
  LOADOUT sends them at the menus. The lane keeps running in LOADOUT — that is
  the cost that makes *when* to shop a decision, so never pause it there. Esc
  backs out of LOADOUT before it pauses the game.
- **There is no weapon range.** The turret hits anywhere in the lane. An earlier
  build gated firing on a range arc; it is gone, and nothing may reintroduce a
  rule of the form "your shot does not work over there".
- **The panel columns sit hard against the lane** (`PANEL_PAD` in
  `layoutFor`). They are read in peripheral vision while a bot walks at you.
  Whatever is left on the outside is forge-hall scenery and does not need to be
  near anything. Don't centre the columns in their gutters.
- **One word kills one bot at wave 1 with a level-1 PISTOL, exactly.** Bot HP is
  `word length × HP_PER_LETTER × tough × hpMul(wave)`, and `HP_PER_LETTER`
  equals the PISTOL's damage. That identity is how the game teaches itself, and
  every upgrade is read against it. Changing either number without the other
  breaks the lesson.
- **A bot that outlives its word gets a new one** (`refreshWord`), never a word
  that "did not work". The swap flashes (`Bot.refresh`) so it is never silent.
- **The lock is released the moment the word runs out, before the shot lands.**
  Otherwise the player waits on a bullet before they can start the next bot.
  `damageBot` is what discovers the bot survived and refreshes it.
- **A wrong key never breaks the word.** In FIGHT it costs the streak and is
  recorded against the letter that *was* expected, and the lock is kept —
  hunting for a key must not also cost you the target. In LOADOUT the buffer
  only grows on a key that keeps some name alive.
- **No panel word may be a prefix of another**, and two live bots should not
  share a first letter. The first is a hand-checked property of the `WEAPONS` /
  `PERKS` tables; the second is `pickCarry`'s job, and where it cannot (nine
  keys on EASY, a dozen bots) `findTarget`'s nearest-the-gate rule keeps it fair.
- **Heat is the reason this is a typing game and not a shooting gallery.**
  Correct keys and kills stoke it, it decays when you stop, and it multiplies
  DAMAGE. If you change `HEAT_*`, re-run the slow-typist measurement in
  `docs/word-forge.md` §6 in the same commit.
- **Bot walking speed is the difficulty model.** Your time to kill a bot is how
  long it takes to walk the lane, not the spawn gap. See the comment over
  `BOT_DEFS`; do not raise HP when what you meant was to slow it down.
- **Only the lane shakes.** `draw()` applies `trauma` to everything up to the
  popups and nothing after. Panel popups carry `fixed: true` and are painted
  *after* the plates, or they hide the word. Damage numbers go BESIDE a bot,
  never above it — that is where its word is.
- Layering is strict: `sim.ts` is data + tuning only (no React, no canvas),
  `render.ts` only draws (pure — it reads state, never mutates it), and
  `step()` in `WordForgeWorld.tsx` is the **only** writer of `stateRef.current`.
  `render.ts` may not import from `WordForgeWorld.tsx` (that would be circular).
- Simulation state lives in one mutable object from `getInitialState()`. React
  state is only the ~20 Hz `hud` snapshot and menu flags — there is deliberately
  **no per-keystroke React state**.
- Clamp `dt = Math.min(delta, 0.1)` in `step()`.
- One rAF loop for the whole mount: always draws, steps only in `PLAYING`
  (and `MENU`, which runs the self-playing attract mode). Never start a second
  loop. **Attract mode must stay silent** — every `sfx` call inside `step()`
  and its helpers is behind `api.scoring`.
- `sfx.startBed()` / `stopBed()` are paired. The forge drone is the only
  continuous sound in the game and must be stopped on pause, quit, game over
  and unmount, or it plays on over the results card.
- Background layers must stay deterministic (`hash(i)`) or they shimmer. Don't
  use `Math.random()` in `render.ts` at all — per-frame randomness belongs in
  `step()`.
- Particles stay bounded via `addParticle` (`PARTICLE_CAP`), popups via
  `addPopup` (`POPUP_CAP`), bots via `MAX_BOTS`.
- All player-facing text goes through the localised `UI` dict (en/uz/ru) at the
  top of `WordForgeWorld.tsx`. Two exceptions, both deliberate: the game's NAME,
  and **the words in the lane and on the panels** — they are the content the
  player is learning to type, and they are English on every locale, like the
  word pools in Star Type and Sky Hop.
- Everything is procedural: no image assets and no mp3s on this route. Audio is
  the inline oscillator synth in `sound.ts`; `sfx.init()` is only called from the
  click that starts a run.
- `window.__wordForge` is a dev-only test hook; it must stay behind the
  `NODE_ENV === "production"` guard.
- The eslint disable at the top of `WordForgeWorld.tsx` is intentional
  (mutable-ref architecture); don't "fix" it.
- The `/games` card is `WORD_FORGE_COVER` in
  `components/thumbnails/covers/games/wordForge.tsx`, rendered in the same uniform tile as
  the other games. All game cards are the same size on purpose.
