# app/typing-ninja/ — the 3D game

Read **`docs/typing-ninja.md`** before editing.

Hard rules:
- Simulation state lives in `stateRef.current` (one mutable object from
  `getInitialState()`), mutated in `useFrame` — React state is only the
  entity ID lists + throttled HUD. Don't introduce React state into the
  loop.
- Clamp `dt = Math.min(delta, 0.1)` in every `useFrame`.
- Clone skinned GLTF instances with `SkeletonUtils.clone`, never `.clone()`.
- Embedded contract (`GAME_NINJA_RUN`): words from `step.content`, pace from
  `step.rules.gameSpeed`, fail on `step.rules.maxMistakesAllowed`,
  `onComplete()` exactly once on victory; `window._isNinjaEmbedded` /
  `window._ninjaOnComplete` are set in `startGame` and cleared on unmount.
- Audio is the inline oscillator `SoundSynthesizer` (module singleton
  `sfx`) — no mp3 files here.
- The eslint disables at the top of these files are intentional (mutable-ref
  architecture); don't "fix" them.
