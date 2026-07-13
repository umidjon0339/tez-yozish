import { ThumbnailParams } from './thumbnail';

export interface LocalizedString {
  en: string;
  uz: string;
  ru: string;
}

export type ViewportMode =
  | 'POSTURE_CHECK'
  | 'KEY_INTRO'
  | 'STANDARD_GYM'
  | 'GAME_NINJA_RUN'
  | 'CHAT_SIM'
  | 'SHORTCUT_DOJO';

/**
 * One message of a CHAT_SIM conversation. "them" bubbles appear by
 * themselves; "you" turns must be typed and sent with Enter. Turn text is
 * plain typable ASCII (like all step text) — the localized `instruction`
 * carries the scenario framing.
 */
export interface ChatTurn {
  from: 'them' | 'you';
  text: string;
}

/**
 * One task card of a SHORTCUT_DOJO step. `do` is the shortcut to perform
 * (one of lib/dojoSim.ts DOJO_ACTIONS, e.g. "Ctrl+C"); `say` is the
 * localized task text ("Copy the selected words!").
 */
export interface DojoTask {
  do: string;
  say: LocalizedString;
}

/** SHORTCUT_DOJO payload: a small document the shortcuts really act on. */
export interface DojoSource {
  /** Space-separated plain words, e.g. "the quick brown fox". */
  doc: string;
  tasks: DojoTask[];
}

export interface StepRules {
  allowBackspace: boolean;
  blockOnTypo: boolean;
  maxMistakesAllowed: number;
  minimumWPM: number;
  /** GAME_NINJA_RUN only: enemy speed/spawn multiplier (1 = normal pace). */
  gameSpeed: number;
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
  /**
   * "f f fj jf" — split on whitespace into tokens. An array is also accepted.
   * Besides plain typed text, a token may be a SPECIAL KEY (Enter, Backspace,
   * Tab, CapsLock, Control, Alt, Shift) or a CHORD ("Ctrl+C") — see
   * lib/keyTokens.ts for the exact rules and where each kind is allowed.
   * CHAT_SIM steps use `chat` INSTEAD of `text`.
   */
  text?: string | string[];
  /** CHAT_SIM only: the conversation script (replaces `text`). */
  chat?: ChatTurn[];
  /** SHORTCUT_DOJO only: the document + task script (replaces `text`). */
  dojo?: DojoSource;
  /**
   * Fix-the-typo drills (STANDARD_GYM only): what is ALREADY typed — wrongly —
   * when the step starts. Tokenized like `text`; must be a prefix of the text
   * tokens with the same per-token lengths, e.g. text "the cat", prefill "teh".
   * The learner backspaces the wrong letters and retypes them, so the step's
   * mode must allow backspace ('careful' or 'strict').
   */
  prefill?: string | string[];
  /** Defaults to 'careful'. */
  mode?: StepMode;
  targetWPM?: number;
  /** Overrides the mode preset's mistake limit. */
  maxMistakes?: number;
  /**
   * GAME_NINJA_RUN only: multiplies enemy speed and spawn rate.
   * 1 = normal, 0.85 = slightly slower, 1.2 = faster. Defaults to 1.
   */
  gameSpeed?: number;
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
  /** Pre-typed wrong tokens for fix-the-typo drills (see StepSource.prefill). */
  prefill?: string[];
  /** CHAT_SIM only: the conversation script. */
  chat?: ChatTurn[];
  /** SHORTCUT_DOJO only: the document + task script. */
  dojo?: DojoSource;
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
