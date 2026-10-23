// Normalizes data/phonemeLessons.json into the runtime model for the
// /english/phonemes lesson hubs. The JSON holds one lesson TEMPLATE; every
// phoneme gets the same list EXCEPT the "shades" slot: sounds in the
// SHADE_WORDS pilot (lib/english/allophones.ts) replace the single SHADES gallery
// with one generated SHADE lesson per allophone — so the lesson list is
// per-phoneme (phonemeLessonsFor), not global.
//
// Unlocking is ACCURACY-based, not star-based: a graded lesson passes at
// PASS_ACCURACY (see lib/english/phonemeProgress.ts); ungraded lessons pass on
// completion. Stars stay as quality feedback only.
//
// Run `npm run validate:phonemes` after editing data/phonemeLessons.json.

import rawData from "@/data/phonemeLessons.json";
import { PHONEME_BY_SLUG } from "@/lib/english/phonemes";
import { ALLO_PROCESS_INFO, shadesFor } from "@/lib/english/allophones";
import type { LessonType, LocalizedString } from "@/types/lesson";

export type PhonemeLessonKind =
  | "MEET" // learn: symbol, spellings, example words, rival
  | "SHADES" // learn: allophone gallery (sounds not in the SHADE pilot)
  | "SHADE" // learn: ONE allophone — visual intro + type its words
  | "TYPE" // practice: type the sound's words (gym)
  | "HEAR" // practice: dictation (gym, hidden text)
  | "SPELL" // practice: type the missing letters of the spelling
  | "PAIRS" // test: minimal-pair listening — type the word you heard
  | "MASTER" // test: typed exam (hearing + spelling + shades)
  | "RAIN" // game: type the falling words
  | "NINJA" // game: embedded 3D typing-ninja run
  | "SOON";

/** A graded lesson passes (unlocks the next) at this accuracy %. */
export const PASS_ACCURACY = 50;

export interface PhonemeLesson {
  id: string;
  type: LessonType;
  kind: PhonemeLessonKind;
  title: LocalizedString;
  /** SHADE lessons: index into ALLOPHONES[symbol] / SHADE_WORDS[symbol]. */
  shadeIndex?: number;
  /** kind !== "SOON" — a runner stage exists for this lesson. */
  implemented: boolean;
  thumbnail: { svgId: string; parameters?: Record<string, unknown> };
}

export interface PhonemeTrack {
  /** Speed gate for computeLessonResult; non-gym stages grade accuracy-only. */
  targetWpm: number;
  lessons: PhonemeLesson[];
}

const raw = rawData.tracks[0];

/** The shared template (with the SHADES gallery slot). */
export const PHONEME_TRACK: PhonemeTrack = {
  targetWpm: raw.targetWpm,
  lessons: raw.lessons.map((l) => ({
    id: l.id,
    type: l.type as LessonType,
    kind: l.kind as PhonemeLessonKind,
    title: l.title,
    implemented: l.kind !== "SOON",
    thumbnail: l.thumbnail,
  })),
};

const lessonsCache = new Map<string, PhonemeLesson[]>();

/** This phoneme's lesson list: the template, with the "shades" slot
 *  expanded into per-allophone SHADE lessons for pilot sounds. */
export function phonemeLessonsFor(slug: string): PhonemeLesson[] {
  const cached = lessonsCache.get(slug);
  if (cached) return cached;

  const info = PHONEME_BY_SLUG[slug];
  const shades = info ? shadesFor(info) : null;
  const lessons = PHONEME_TRACK.lessons.flatMap((l): PhonemeLesson[] => {
    if (l.kind !== "SHADES" || !shades || !info) return [l];
    return shades.map((shade, i) => ({
      id: `shade-${i + 1}`,
      type: "lesson",
      kind: "SHADE",
      shadeIndex: i,
      title: {
        en: `${shade.symbol} · ${ALLO_PROCESS_INFO[shade.process].name.en}`,
        uz: `${shade.symbol} · ${ALLO_PROCESS_INFO[shade.process].name.uz}`,
        ru: `${shade.symbol} · ${ALLO_PROCESS_INFO[shade.process].name.ru}`,
      },
      implemented: true,
      thumbnail: {
        svgId: "PHONEME_STAGE",
        parameters: { motif: "shade", shade: shade.symbol },
      },
    }));
  });
  lessonsCache.set(slug, lessons);
  return lessons;
}

/** Progress-map key for one phoneme's lesson (see lib/english/phonemeProgress.ts). */
export function phonemeLessonKey(slug: string, lessonId: string): string {
  return `phonemes/${slug}/${lessonId}`;
}

export function phonemeHubHref(slug: string): string {
  return `/english/phonemes/${slug}`;
}

export function phonemeLessonHref(slug: string, lessonId: string): string {
  return `${phonemeHubHref(slug)}/${lessonId}`;
}
