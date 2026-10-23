// Per-LESSON progress for the /english/phonemes unit. Keys are
// phonemeLessonKey() strings ("phonemes/ee/pairs") so every phoneme's every
// lesson has its own best-ever record — same max-merge semantics and house
// useSyncExternalStore idiom as letter progress (see locale.tsx).
//
// PASSING is accuracy-based (NOT star-based): a graded lesson passes —
// and unlocks the next one — at bestAccuracy ≥ PASS_ACCURACY (50%).
// Ungraded lessons pass on completion. Stars remain quality feedback.
//
// localStorage key "tz-phonemes-v1" is a compatibility contract — bump it if
// the shape changes.

import { useSyncExternalStore } from "react";
import type { LessonResult } from "@/lib/typing/progress";
import {
  PASS_ACCURACY,
  phonemeLessonKey,
  phonemeLessonsFor,
  type PhonemeLesson,
} from "@/lib/english/phonemeCurriculum";
import { LESSON_TYPES } from "@/lib/typing/lessonTypes";

export interface StoredPhonemeProgress {
  completed: boolean;
  stars: number; // best ever, 0-5
  bestWpm: number;
  bestAccuracy: number;
  lastPlayedAt: string;
}

export type PhonemeProgressMap = Record<string, StoredPhonemeProgress>;

const STORAGE_KEY = "tz-phonemes-v1";

export function getPhonemeProgress(): PhonemeProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PhonemeProgressMap) : {};
  } catch {
    return {};
  }
}

let cache: PhonemeProgressMap | null = null;
const listeners = new Set<() => void>();
const SERVER_SNAPSHOT: PhonemeProgressMap = {};

function readCached(): PhonemeProgressMap {
  if (cache === null) cache = getPhonemeProgress();
  return cache;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePhonemeProgress(): PhonemeProgressMap {
  return useSyncExternalStore(subscribe, readCached, () => SERVER_SNAPSHOT);
}

export function savePhonemeLessonResult(
  key: string,
  result: LessonResult,
): PhonemeProgressMap {
  if (typeof window === "undefined") return {};
  const all = getPhonemeProgress();
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

/* ── The accuracy pass gate ─────────────────────────────────────────────
   One rule everywhere: hub padlocks, runner results, done aggregates. */

/** Passed = completed, and for graded lessons ≥ PASS_ACCURACY accuracy. */
export function isPhonemeLessonPassed(
  progress: PhonemeProgressMap,
  slug: string,
  lesson: PhonemeLesson,
): boolean {
  const p = progress[phonemeLessonKey(slug, lesson.id)];
  if (!p?.completed) return false;
  if (!LESSON_TYPES[lesson.type].graded) return true;
  return (p.bestAccuracy ?? 0) >= PASS_ACCURACY;
}

/** lessonId → unlocked, sequential over the phoneme's IMPLEMENTED lessons
 *  ("SOON" cards are always locked and never gate what follows them). */
export function phonemeUnlockedMap(
  slug: string,
  progress: PhonemeProgressMap,
): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  let allPassedSoFar = true;
  let first = true;
  for (const lesson of phonemeLessonsFor(slug)) {
    if (!lesson.implemented) continue;
    map[lesson.id] = first || allPassedSoFar;
    first = false;
    allPassedSoFar =
      allPassedSoFar && isPhonemeLessonPassed(progress, slug, lesson);
  }
  return map;
}

// ── Per-phoneme aggregates (overview page, hubs, rails) ─────────────────

function implementedLessons(slug: string): PhonemeLesson[] {
  return phonemeLessonsFor(slug).filter((l) => l.implemented);
}

/** Sum of best stars over one phoneme's GRADED lessons. */
export function phonemeStars(
  progress: PhonemeProgressMap,
  slug: string,
): number {
  return implementedLessons(slug)
    .filter((l) => LESSON_TYPES[l.type].graded)
    .reduce(
      (sum, l) => sum + (progress[phonemeLessonKey(slug, l.id)]?.stars ?? 0),
      0,
    );
}

/** A phoneme is done when every implemented lesson is passed. */
export function phonemeDone(
  progress: PhonemeProgressMap,
  slug: string,
): boolean {
  return implementedLessons(slug).every((l) =>
    isPhonemeLessonPassed(progress, slug, l),
  );
}

/** How many of one phoneme's implemented lessons are completed. */
export function phonemeCompletedCount(
  progress: PhonemeProgressMap,
  slug: string,
): number {
  return implementedLessons(slug).filter(
    (l) => progress[phonemeLessonKey(slug, l.id)]?.completed,
  ).length;
}
