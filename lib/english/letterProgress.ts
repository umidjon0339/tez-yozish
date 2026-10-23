// Per-LESSON progress for the /english/letters and /english/codes units.
// Keys are letterLessonKey() strings ("letters/a/mix", "codes/b/learn") so
// every letter's every lesson has its own best-ever record — the same model
// as lesson progress (tz-progress-v1), same max-merge semantics, same house
// useSyncExternalStore idiom (see locale.tsx).
//
// localStorage key "tz-letters-v2" is a compatibility contract — bump it if
// the shape changes. (v1 stored one record per letter for the old single-run
// flow; it is intentionally not migrated.)

import { useSyncExternalStore } from "react";
import type { LessonResult } from "@/lib/typing/progress";
import { isLessonPassed } from "@/lib/typing/progress";
import {
  LETTER_TRACKS,
  letterLessonKey,
  letterUnlockRefs,
  type LetterTrackId,
} from "@/lib/english/letterCurriculum";
import { LESSON_TYPES } from "@/lib/typing/lessonTypes";

export interface StoredLetterProgress {
  completed: boolean;
  stars: number; // best ever, 0-5
  bestWpm: number;
  bestAccuracy: number;
  lastPlayedAt: string;
}

export type LetterProgressMap = Record<string, StoredLetterProgress>;

const STORAGE_KEY = "tz-letters-v2";

export function getLetterProgress(): LetterProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LetterProgressMap) : {};
  } catch {
    return {};
  }
}

let cache: LetterProgressMap | null = null;
const listeners = new Set<() => void>();
const SERVER_SNAPSHOT: LetterProgressMap = {};

function readCached(): LetterProgressMap {
  if (cache === null) cache = getLetterProgress();
  return cache;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useLetterProgress(): LetterProgressMap {
  return useSyncExternalStore(subscribe, readCached, () => SERVER_SNAPSHOT);
}

export function saveLetterLessonResult(
  key: string,
  result: LessonResult,
): LetterProgressMap {
  if (typeof window === "undefined") return {};
  const all = getLetterProgress();
  const prev = all[key];
  all[key] = {
    completed: true,
    stars: Math.max(prev?.stars ?? 0, result.stars),
    bestWpm: Math.max(prev?.bestWpm ?? 0, result.wpm),
    bestAccuracy: Math.max(prev?.bestAccuracy ?? 0, result.accuracy),
    lastPlayedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // storage full/blocked — progress just isn't persisted
  }
  cache = all;
  listeners.forEach((l) => l());
  return all;
}

// ── Per-letter aggregates (overview page, hubs, rails) ─────────────────

/** Sum of best stars over one letter's GRADED lessons in a track (0–10). */
export function letterStars(
  progress: LetterProgressMap,
  char: string,
  track: LetterTrackId = "letters",
): number {
  return LETTER_TRACKS[track].lessons
    .filter((l) => l.implemented && LESSON_TYPES[l.type].graded)
    .reduce(
      (sum, l) =>
        sum + (progress[letterLessonKey(track, char, l.id)]?.stars ?? 0),
      0,
    );
}

/** A letter is done when every implemented lesson in the track is passed. */
export function letterDone(
  progress: LetterProgressMap,
  char: string,
  track: LetterTrackId = "letters",
): boolean {
  return letterUnlockRefs(track, char).every((ref) =>
    isLessonPassed(ref, progress),
  );
}

/** How many of one letter's implemented lessons are completed. */
export function letterCompletedCount(
  progress: LetterProgressMap,
  char: string,
  track: LetterTrackId = "letters",
): number {
  return letterUnlockRefs(track, char).filter(
    (ref) => progress[ref.lessonId]?.completed,
  ).length;
}
