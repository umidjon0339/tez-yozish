// Normalizes data/graphemeLessons.json into the runtime model for the
// /english/graphemes and /english/spellings lesson hubs — the two-track
// analogue of lib/phonemeCurriculum.ts. The JSON holds one lesson TEMPLATE
// per track; every grapheme (or sound) gets the same lesson list, and
// per-element identity lives in the progress key
// (`graphemes/${slug}/${lessonId}` / `spellings/${slug}/${lessonId}`,
// stored by graphemeProgress.ts).
//
// Unlocking is ACCURACY-based, not star-based: a graded lesson passes at
// PASS_ACCURACY (see lib/graphemeProgress.ts); ungraded lessons pass on
// completion. Stars stay as quality feedback only.
//
// `kind` picks which stage UI the runner mounts (GraphemeLessonRunner).
// Run `npm run validate:graphemes` after editing data/graphemeLessons.json.

import rawData from "@/data/graphemeLessons.json";
import type { LessonType, LocalizedString } from "@/types/lesson";

export type GraphemeTrackId = "graphemes" | "spellings";

export type GraphemeLessonKind =
  | "MEET" // learn: the element, its sounds/spellings, its words
  | "TYPE" // practice: type the element's words (gym)
  | "HEAR" // practice: dictation (gym, hidden text)
  | "WHICH" // test: hear a word — TYPE the word you heard (echo)
  | "MASTER" // test: typed exam (echo + type-the-missing-letters)
  | "RAIN" // game: type the falling words
  | "NINJA" // game: embedded 3D typing-ninja run
  | "SOON";

/** A graded lesson passes (unlocks the next) at this accuracy %. */
export const PASS_ACCURACY = 50;

export interface GraphemeLesson {
  id: string;
  type: LessonType;
  kind: GraphemeLessonKind;
  title: LocalizedString;
  /** kind !== "SOON" — a runner stage exists for this lesson. */
  implemented: boolean;
  thumbnail: { svgId: string; parameters?: Record<string, unknown> };
}

export interface GraphemeTrack {
  id: GraphemeTrackId;
  /** Speed gate for computeLessonResult; non-gym stages grade accuracy-only. */
  targetWpm: number;
  lessons: GraphemeLesson[];
}

function buildTrack(id: GraphemeTrackId): GraphemeTrack {
  const track = rawData.tracks.find((t) => t.id === id);
  if (!track) throw new Error(`graphemeLessons.json: missing track "${id}"`);
  return {
    id,
    targetWpm: track.targetWpm,
    lessons: track.lessons.map((l) => ({
      id: l.id,
      type: l.type as LessonType,
      kind: l.kind as GraphemeLessonKind,
      title: l.title,
      implemented: l.kind !== "SOON",
      thumbnail: l.thumbnail,
    })),
  };
}

export const GRAPHEME_TRACKS: Record<GraphemeTrackId, GraphemeTrack> = {
  graphemes: buildTrack("graphemes"),
  spellings: buildTrack("spellings"),
};

/** Progress-map key for one element's lesson (see lib/graphemeProgress.ts). */
export function graphemeLessonKey(
  track: GraphemeTrackId,
  slug: string,
  lessonId: string,
): string {
  return `${track}/${slug}/${lessonId}`;
}

export function graphemeTrackHref(track: GraphemeTrackId): string {
  return `/english/${track}`;
}

export function graphemeHubHref(track: GraphemeTrackId, slug: string): string {
  return `/english/${track}/${slug}`;
}

export function graphemeLessonHref(
  track: GraphemeTrackId,
  slug: string,
  lessonId: string,
): string {
  return `${graphemeHubHref(track, slug)}/${lessonId}`;
}
