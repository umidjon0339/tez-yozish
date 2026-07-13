# components/lesson/ — workspace rails

Read **`docs/lesson-runtime.md`** §8 before editing `Rails.tsx`.

Hard rules:
- Rails are pure overlays (`absolute`, drawer pattern) — they must never
  shift the typing arena layout.
- Drawers close on Escape, Backspace, any single-char keystroke, and
  outside pointerdown (`useDrawer`) so typing always wins.
- Progress/locale come in via props (`ProgressMap`, `locale`) — no own
  storage; unlock logic is `computeUnlocked` from `lib/progress.ts`.
- Collapsed ChapterRail shows one dash per **chapter** (per-section was too
  dense); LessonRail groups by `LESSON_TYPE_ORDER`.
- Locked lessons render as non-links.
