// Per-LESSON progress for the /english/graphemes and /english/spellings
// units. Keys are graphemeLessonKey() strings ("graphemes/sh/type",
// "spellings/ee/which") so every element's every lesson has its own
// best-ever record — same model as letter progress (tz-letters-v2), same
// max-merge semantics, same house useSyncExternalStore idiom (locale.tsx).
//
// PASSING is accuracy-based (NOT star-based): a graded lesson passes —
// and unlocks the next one — at bestAccuracy ≥ PASS_ACCURACY (50%).
// Ungraded lessons pass on completion. Stars remain quality feedback.
//
// localStorage key "tz-graphemes-v1" is a compatibility contract — bump it
// if the shape changes.

import { useSyncExternalStore } from "react";
import type { LessonResult } from "@/lib/typing/progress";
import {
  GRAPHEME_TRACKS,
  PASS_ACCURACY,
  graphemeLessonKey,
  type GraphemeLesson,
  type GraphemeTrackId,
} from "@/lib/english/graphemeCurriculum";
import { LESSON_TYPES } from "@/lib/typing/lessonTypes";

export interface StoredGraphemeProgress {
  completed: boolean;
  stars: number; // best ever, 0-5
  bestWpm: number;
  bestAccuracy: number;
  lastPlayedAt: string;
}

export type GraphemeProgressMap = Record<string, StoredGraphemeProgress>;

const STORAGE_KEY = "tz-graphemes-v1";

export function getGraphemeProgress(): GraphemeProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GraphemeProgressMap) : {};
  } catch {
    return {};
  }
}

let cache: GraphemeProgressMap | null = null;
const listeners = new Set<() => void>();
const SERVER_SNAPSHOT: GraphemeProgressMap = {};

function readCached(): GraphemeProgressMap {
  if (cache === null) cache = getGraphemeProgress();
  return cache;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useGraphemeProgress(): GraphemeProgressMap {
  return useSyncExternalStore(subscribe, readCached, () => SERVER_SNAPSHOT);
}

export function saveGraphemeLessonResult(
  key: string,
  result: LessonResult,
): GraphemeProgressMap {
  if (typeof window === "undefined") return {};
  const all = getGraphemeProgress();
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
export function isGraphemeLessonPassed(
  progress: GraphemeProgressMap,
  track: GraphemeTrackId,
  slug: string,
  lesson: GraphemeLesson,
): boolean {
  const p = progress[graphemeLessonKey(track, slug, lesson.id)];
  if (!p?.completed) return false;
  if (!LESSON_TYPES[lesson.type].graded) return true;
  return (p.bestAccuracy ?? 0) >= PASS_ACCURACY;
}

/** lessonId → unlocked, sequential over the track's IMPLEMENTED lessons
 *  ("SOON" cards are always locked and never gate what follows them). */
export function graphemeUnlockedMap(
  track: GraphemeTrackId,
  slug: string,
  progress: GraphemeProgressMap,
): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  let allPassedSoFar = true;
  let first = true;
  for (const lesson of GRAPHEME_TRACKS[track].lessons) {
    if (!lesson.implemented) continue;
    map[lesson.id] = first || allPassedSoFar;
    first = false;
    allPassedSoFar =
      allPassedSoFar && isGraphemeLessonPassed(progress, track, slug, lesson);
  }
  return map;
}

// ── Per-element aggregates (overview pages, hubs, rails) ────────────────

function implementedLessons(track: GraphemeTrackId): GraphemeLesson[] {
  return GRAPHEME_TRACKS[track].lessons.filter((l) => l.implemented);
}

/** Sum of best stars over one element's GRADED lessons. */
export function graphemeStars(
  progress: GraphemeProgressMap,
  track: GraphemeTrackId,
  slug: string,
): number {
  return implementedLessons(track)
    .filter((l) => LESSON_TYPES[l.type].graded)
    .reduce(
      (sum, l) =>
        sum + (progress[graphemeLessonKey(track, slug, l.id)]?.stars ?? 0),
      0,
    );
}

/** An element is done when every implemented lesson is passed. */
export function graphemeDone(
  progress: GraphemeProgressMap,
  track: GraphemeTrackId,
  slug: string,
): boolean {
  return implementedLessons(track).every((l) =>
    isGraphemeLessonPassed(progress, track, slug, l),
  );
}

/** How many of one element's implemented lessons are completed. */
export function graphemeCompletedCount(
  progress: GraphemeProgressMap,
  track: GraphemeTrackId,
  slug: string,
): number {
  return implementedLessons(track).filter(
    (l) => progress[graphemeLessonKey(track, slug, l.id)]?.completed,
  ).length;
}
