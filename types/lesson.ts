import { ThumbnailParams } from './thumbnail';

export interface LocalizedString {
  en: string;
  uz: string;
  ru: string;
}

export type ViewportMode = 'POSTURE_CHECK' | 'KEY_INTRO' | 'STANDARD_GYM' | 'GAME_NINJA_RUN';

export interface StepRules {
  allowBackspace: boolean;
  blockOnTypo: boolean;
  maxMistakesAllowed: number;
  minimumWPM: number;
}

// ═══════════════════════════════════════════════════════════════════
// v4 AUTHORING FORMAT — the shape of data/lessons.json.
// Simple to write by hand: uniform `id`/`title` keys, no *Number
// fields (derived from array order), `mode` presets instead of raw
// rules, and step text as one space-separated string.
// `lib/curriculum.ts` normalizes this into the runtime *Node types
// below, which the UI consumes.
// ═══════════════════════════════════════════════════════════════════

export type StepMode = 'learn' | 'careful' | 'strict' | 'free';

export interface ThumbnailSource {
  svgId?: string;
  imageSrc?: string;
  parameters?: ThumbnailParams;
}

export interface StepSource {
  viewport: ViewportMode;
  instruction: LocalizedString;
  /** "f f fj jf" — split on whitespace into tokens. An array is also accepted. */
  text: string | string[];
  /** Defaults to 'careful'. */
  mode?: StepMode;
  targetWPM?: number;
  /** Overrides the mode preset's mistake limit. */
  maxMistakes?: number;
}

/**
 * 'lesson'   — teaches something new (key intros, guidance). Ungraded: no stars.
 * 'practice' — judgment-free drilling. Ungraded: mistakes are fine, no stars.
 * 'test'     — proves the skill. Graded 0–5 stars, gates progression.
 * 'game'     — arcade challenge. Graded 0–5 stars.
 * Per-type behavior (grading, passStars defaults, labels) lives in
 * lib/lessonTypes.tsx.
 */
export type LessonType = 'lesson' | 'practice' | 'test' | 'game';

export interface LessonSource {
  id: string;
  type?: LessonType;
  title: LocalizedString;
  goal?: LocalizedString;
  /** Optional — derived from step text when omitted. */
  keys?: string[];
  /**
   * Stars required to pass this lesson and unlock the next one.
   * Defaults: 'lesson'/'practice' → 0 (just complete it), 'game' → 1,
   * 'test' → 3. Must be 0 (or omitted) on ungraded types.
   */
  passStars?: number;
  thumbnail?: ThumbnailSource;
  steps: StepSource[];
}

export interface SectionSource {
  id: string;
  title: LocalizedString;
  thumbnail?: ThumbnailSource;
  lessons: LessonSource[];
}

export interface ChapterSource {
  id: string;
  title: LocalizedString;
  description?: LocalizedString;
  sections: SectionSource[];
}

export interface CourseSource {
  id: string;
  title: LocalizedString;
  audience?: string;
  thumbnail?: ThumbnailSource;
  chapters: ChapterSource[];
}

// ═══════════════════════════════════════════════════════════════════
// RUNTIME MODEL — what the UI components consume (produced by
// lib/curriculum.ts; not written by hand anymore).
// ═══════════════════════════════════════════════════════════════════

export interface StepNode {
  stepId: string;
  stepNumber: number;
  viewport: ViewportMode;
  instruction: LocalizedString;
  content: string[];
  rules: StepRules;
}

export interface LessonNode {
  lessonId: string;
  lessonNumber: number;
  /** Always set by the normalizer (defaults to 'practice'). */
  type: LessonType;
  lessonTitle: LocalizedString;
  pedagogicalGoal: LocalizedString;
  unlockedKeys: string[];
  /** Stars required to pass and unlock the next lesson (normalized, never undefined). */
  passStars: number;
  archetype?: string;
  thumbnail?: {
    svgId: string;
    parameters?: ThumbnailParams;
  };
  steps: StepNode[];
}

export interface SectionNode {
  sectionId: string;
  sectionNumber: number;
  sectionTitle: LocalizedString;
  thumbnail?: {
    svgId?: string;
    imageSrc?: string;
    parameters?: ThumbnailParams;
  };
  lessons: LessonNode[];
}

export interface ChapterNode {
  chapterId: string;
  chapterNumber: number;
  chapterTitle: LocalizedString;
  description: LocalizedString;
  sections: SectionNode[];
}

export interface CourseNode {
  courseId: string;
  courseTitle: LocalizedString;
  targetAudience: string;
  thumbnail?: {
    svgId?: string;
    imageSrc?: string;
    parameters?: ThumbnailParams;
  };
  chapters: ChapterNode[];
}
