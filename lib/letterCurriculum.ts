// Normalizes data/letterLessons.json into the runtime model for the
// /english/letters and /english/codes lesson hubs — the letters analogue of
// lib/curriculum.ts. The JSON holds one lesson TEMPLATE per track; every
// letter a–z gets the same lesson list, and per-letter identity lives in the
// progress key (`${track}/${char}/${lessonId}`, stored by letterProgress.ts).
//
// Lesson `type` semantics (graded/ungraded, group order, pass gates) are the
// course engine's — LESSON_TYPES in lib/lessonTypes.tsx is the single source.
// `kind` picks which stage UI the runner mounts (LetterLessonRunner);
// kind "SOON" marks authored-but-unimplemented lessons: they render as locked
// "coming soon" cards and never block the unlock chain.
//
// Run `npm run validate:letters` after editing data/letterLessons.json.

import rawData from "@/data/letterLessons.json";
import { LESSON_TYPES } from "@/lib/lessonTypes";
import type { LessonType, LocalizedString } from "@/types/lesson";
import type { UnlockRef } from "@/lib/progress";

export type LetterTrackId = "letters" | "codes";

export type LetterLessonKind =
  | "MEET"
  | "TYPE"
  | "CAPS"
  | "HEAR"
  | "MIX"
  | "RAIN"
  | "CODES_LEARN"
  | "SOON";

export interface LetterLesson {
  id: string;
  type: LessonType;
  kind: LetterLessonKind;
  title: LocalizedString;
  passStars: number;
  /** kind !== "SOON" — a runner stage exists for this lesson. */
  implemented: boolean;
  thumbnail: { svgId: string; parameters?: Record<string, unknown> };
}

export interface LetterTrack {
  id: LetterTrackId;
  /** Speed gate for computeLessonResult; 0 = accuracy-only stars. */
  targetWpm: number;
  lessons: LetterLesson[];
}

interface RawLesson {
  id: string;
  type: string;
  kind: string;
  title: LocalizedString;
  passStars?: number;
  thumbnail: { svgId: string; parameters?: Record<string, unknown> };
}

function normalizeTrack(raw: {
  id: string;
  targetWpm: number;
  lessons: RawLesson[];
}): LetterTrack {
  return {
    id: raw.id as LetterTrackId,
    targetWpm: raw.targetWpm,
    lessons: raw.lessons.map((l) => {
      const type = l.type as LessonType;
      return {
        id: l.id,
        type,
        kind: l.kind as LetterLessonKind,
        title: l.title,
        passStars: l.passStars ?? LESSON_TYPES[type].defaultPassStars,
        implemented: l.kind !== "SOON",
        thumbnail: l.thumbnail,
      };
    }),
  };
}

export const LETTER_TRACKS: Record<LetterTrackId, LetterTrack> =
  Object.fromEntries(
    rawData.tracks.map((t) => [t.id, normalizeTrack(t)]),
  ) as Record<LetterTrackId, LetterTrack>;

/** Progress-map key for one letter's lesson (see lib/letterProgress.ts). */
export function letterLessonKey(
  track: LetterTrackId,
  char: string,
  lessonId: string,
): string {
  return `${track}/${char}/${lessonId}`;
}

export function trackHref(track: LetterTrackId, char: string): string {
  return track === "letters" ? `/english/letters/${char}` : `/english/codes/${char}`;
}

export function lessonHref(
  track: LetterTrackId,
  char: string,
  lessonId: string,
): string {
  return `${trackHref(track, char)}/${lessonId}`;
}

/**
 * Unlock chain for one letter, in authored order — implemented lessons only
 * ("SOON" cards are always locked and must not gate what follows them).
 * Feed to computeUnlocked with the letter-progress map.
 */
export function letterUnlockRefs(
  track: LetterTrackId,
  char: string,
): UnlockRef[] {
  return LETTER_TRACKS[track].lessons
    .filter((l) => l.implemented)
    .map((l) => ({
      lessonId: letterLessonKey(track, char, l.id),
      passStars: l.passStars,
    }));
}
