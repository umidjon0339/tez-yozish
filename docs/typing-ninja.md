# Typing Ninja — `app/typing-ninja/`

3D WebGL survival typing game (`@react-three/fiber` + `drei` + `three`).
Two entry points, both `next/dynamic` with `ssr: false`:

- **Standalone arcade**: `/typing-ninja` (`page.tsx`) — menu, difficulties,
  endless survival, high score.
- **Embedded**: mounted by the lesson runtime for `GAME_NINJA_RUN` steps as
  `<NinjaWorld step={step} onComplete={handleComplete} isEmbedded />`.

Files: `NinjaWorld.tsx` (~1400 lines — state, input, loop, HUD, sound),
`characters.tsx` (`HeroNinja`, `EnemyNinja`, GLTF handling),
`environment.tsx` (`CameraRig`, `SkyDome`, `Mountains`, `Clouds`,
`InstancedScenery`). Models: `public/models/hero.glb` and `enemy.glb`
(all animation clips baked in; there is no separate animations folder).

## 1. Simulation model: refs, not React state

The whole game world is **one mutable object** from `getInitialState()`,
held in `stateRef` and mutated every frame inside `useFrame`. React state is
only a thin projection: the active entity **ID lists** (mount/unmount R3F
nodes), a ~20 Hz throttled `hudState` snapshot for the DOM HUD, plus
`gameState` / `difficulty` / mute / high score.

Consequences for editing:
- Simulation logic must read/write `stateRef.current` — using React state
  inside the loop creates stale closures and re-render storms.
- Entity lists sync to React only when counts change or `fxDirty` is set.
- All `useFrame` bodies clamp `dt = Math.min(delta, 0.1)` (tab-throttling
  guard) — keep that in new frame code.
- The files disable `no-explicit-any` and react-hooks purity lints on
  purpose; this architecture is the reason.

State fields: `enemies[]`, `projectiles[]`, `particles[]`, `ground[]`,
`scenery[]`, `rocks[]`, `targetId`, `spawnTimer`, `score`, `lives (3)`,
`wordsTyped`, `correctKeystrokes`, `totalKeystrokes`, `timeSurvived`,
`embeddedMistakes`, `embeddedQueue[]`, and "game-feel channels" read by
visuals: `heroHandPos`, `throwCount`, `damageCount`, `streak`, `camTrauma`,
`camPunch`, `speedRamp`, `vignette`, `redFlash`, `fxDirty`.

`GameState = MENU | PLAYING | PAUSED | GAME_OVER`. `GameLoop` (the single
authoritative `useFrame`) is mounted **only while PLAYING**, so pause truly
halts the sim. Esc toggles pause (suspends/resumes audio); Enter restarts
from game over.

## 2. Game loop (per frame)

Scroll ground/scenery/rocks toward the camera (wrap-around recycling) →
advance enemies (a living enemy reaching `enemyKillZ = 6` costs a life,
triggers trauma/vignette, 0 lives = game over) → move projectiles (homing
shurikens register hits; ballistic "miss" ones decay) → integrate particles
→ spawn (see modes below) → sync ID lists if counts changed → decay
vignette/red flash → ~20 Hz HUD update (WPM = correct/5/min, accuracy).

Arcade difficulty (`DIFFICULTY_CONFIG`: EASY/MEDIUM/HARD → `baseSpeed`,
`spawnInterval`, `wordsPerEnemy`) plus a survival ramp up to +50% over
~90 s. Score = `word.length * 10` per kill.

## 3. Typing input

A `window` keydown listener active only while PLAYING. Ignores modified /
non-character keys. An enemy's progress = `typed` (shurikens landed) +
`queuedHits` (shurikens in flight) — the expected letter is at index
`typed.length + queuedHits`, so fast typing queues multiple shurikens before
any land (the word label's red portion advances on keypress, not on impact).

- Correct letter on the locked target → queue a homing shuriken from
  `heroHandPos`; completing the word's last letter clears the target.
- Wrong-for-target letter: **target switching** — if another living enemy
  expects that letter, lock the closest one and fire; otherwise
  `handleMiss()` (vignette, red flash, streak reset, camera trauma, wild
  ballistic shuriken, typo thud).
- Hit **resolution** happens in the loop when the shuriken lands: advance
  `typed`, flinch knockback; final letter kills (death anim, smoke/debris,
  `+score` particle, streak++).

## 4. Standalone vs embedded

| | Arcade (`/typing-ninja`) | Embedded (`GAME_NINJA_RUN`) |
|---|---|---|
| Start | MENU + difficulty buttons | auto-starts PLAYING (MEDIUM) |
| Words | internal 60-word `WORDS` pool, endless | `step.content` copied to `embeddedQueue`, spawned in order |
| Speed | difficulty + survival ramp | ramp disabled; `speedFactor = step.rules.gameSpeed` |
| Lose | lives reach 0 | `embeddedMistakes > step.rules.maxMistakesAllowed` |
| Win | never (survival) | queue empty + no enemies → `onComplete()` fired once |
| HUD | lives, high score, game-over stats, quit links | those hidden; WPM/accuracy/score/streak still shown |
| Persistence | `localStorage["tz-ninja-highscore"]` | none |

Props: `NinjaWorld({ step?, onComplete?, isEmbedded? })`. There are no
`words`/`onExit` props — arcade quit is hardcoded links; embedded exit is
the lesson page's floating Back/Skip buttons.

**Window-global bridge**: `startGame` stashes `window._isNinjaEmbedded` and
`window._ninjaOnComplete` for the loop to read (cleared on unmount;
`onComplete` nulled after first call so victory fires exactly once). Two
simultaneous NinjaWorld instances would collide on these.

`onComplete` receives an optional stats object
`{ correct, mistakes, timeMs }` (keystroke totals from the run). The course
lesson runtime ignores it (ninja steps contribute nothing to course grading,
see lesson-runtime.md §5); the phoneme unit's NINJA lesson uses it to award
stars (`components/phonemes/stages/NinjaStage.tsx`).

## 5. Characters & environment

- GLTF instances **must** be cloned with `SkeletonUtils.clone` (plain
  `.clone()` shares skeletons and breaks animation). `useGLTF.preload` runs
  at module load.
- `HeroNinja`: hides the model pack's showcase weapons except the offhand
  knife; splits `Running_A` into upper/lower-body sub-clips (`subClip` +
  `UPPER_BONES`; GLTFLoader strips `.` from bone names) so throw/flinch
  overlays blend on the upper body while the sprint never breaks. Throw
  overlay retriggers on `throwCount` change; footsteps derive from run-cycle
  phase and emit dust + `playFootstep`. Publishes the throwing-hand world
  position to `state.heroHandPos` (shuriken spawn origin). Streak lerps an
  emissive glow.
- `EnemyNinja`: random run clip (`Running_A`/`Running_C`), randomized
  timeScale 0.9–1.25 and start offset (desyncs the horde); death anim
  latches on `isDead`, flinch on `hitCount` increments.
- `environment.tsx`: `CameraRig` (trauma shake + punch-in + FOV ramp with
  `speedRamp`), shader-gradient `SkyDome`, cone `Mountains`, drifting sprite
  `Clouds`, and `InstancedScenery` (~4 instanced meshes replacing ~320 draw
  calls; matrices rewritten each frame from state). `getSoftTexture()` is a
  module-cached radial-gradient canvas texture shared by shadows/dust/
  smoke/clouds. Skinned + instanced meshes set `frustumCulled = false`.

## 6. Sound — inline `SoundSynthesizer`

All audio is synthesized with Web Audio oscillators/noise — **no files**
(separate from the lesson runtime's mp3 layer). Module singleton `sfx`.
Context is created lazily on `startGame` (autoplay policy), suspended on
pause/unmount. Events: key tap (every accepted key), shuriken whoosh
(correct letter), typo thud, pop (shuriken lands), defeat chime (word kill),
stereo footsteps, distorted damage hit, descending death arpeggio, and a
look-ahead-scheduled procedural bass BGM whose tempo scales with
`wordsTyped` (`setTimeout` scheduler, independent of frame rate; stopped on
game over/unmount).

## Invariants

- dt-clamp every `useFrame`; simulation state lives in `stateRef.current`.
- `SkeletonUtils.clone` for every skinned model instance.
- Keep the embedded contract: words from `step.content`, pace from
  `rules.gameSpeed`, fail on `rules.maxMistakesAllowed`, `onComplete(stats?)`
  exactly once on victory.
- Clear `window._isNinjaEmbedded`/`window._ninjaOnComplete` on unmount.
- Only `GameLoop` mutates game-over/lives; visual components read state,
  they never write gameplay fields (they may write feel channels they own,
  e.g. `heroHandPos`).
- Hero dust particles are capped (~60); keep new particle emitters bounded.
