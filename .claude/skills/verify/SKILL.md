---
name: verify
description: Build, launch and drive tez-yozish in a headless browser to verify changes at the real surface.
---

# Verifying tez-yozish changes

Static checks (fast, run first):

```bash
npx tsc --noEmit                 # typecheck (no test runner exists)
npx eslint <changed dirs>        # full `npm run lint` has pre-existing
                                 # errors in app/lesson, app/courses,
                                 # app/games/typing-ninja — lint only your files
npm run validate:lessons|letters|phonemes|graphemes   # after data/ edits
npm run build                    # production build must pass
```

Runtime drive:

```bash
npm run dev &                    # http://localhost:3000, turbopack
# headless browser: system chromium + playwright-core (no browser download)
cd <scratchpad> && npm init -y && npm i playwright-core
#   -> set "type": "module" in the scratch package.json or .ts/.mjs
#      imports break
chromium.launch({ executablePath: "/usr/bin/chromium",
                  args: ["--mute-audio"] })
```

Gotchas learned:

- All pages are client components — wait for real text/locators, not load
  events. Dev/turbopack occasionally drops a hydration chunk
  (ERR_CONTENT_LENGTH_MISMATCH → page renders SSR chrome but stage stays
  empty, no interactivity). Reload before calling it a bug.
- Lesson stages listen on `window` keydown — `page.keyboard.press` drives
  them. Choice stages advance ~700–1000 ms after an answer; wait between
  presses.
- English-unit lesson URLs (e.g. /english/phonemes/ee/spell) are directly
  navigable even when locked in the hub — handy for testing single stages.
- Results screen = text "Great job". Progress persists per browser
  context (localStorage), so a fresh context resets the unlock chain.
- speechSynthesis / audio 404s in headless are expected (phonemeAudio
  probes /audio/... recordings, falls back to TTS).
- Node ≥22 can smoke-test lib/*.ts directly:
  `node --experimental-strip-types script.mjs`, after sed-ing `@/...`
  imports to absolute paths (tsconfig aliases don't resolve).
- To drive listening stages deterministically, stub speech in an
  addInitScript with `Object.defineProperty(window, "speechSynthesis", …)`
  (plain assignment fails — it's a readonly accessor) recording
  `u.text` into `window.__lastSpoken`; also stub
  `SpeechSynthesisUtterance`. Speak fires ~350 ms after a round starts —
  sync on the "Round N of" counter, and click the replay button if the
  captured word is empty.
- Typed-answer stages ignore keys during the answer-feedback pause
  (800–1400 ms) — wait for the next round before typing or keystrokes are
  silently dropped.
