// Loads the v4 authoring format from data/lessons.json and normalizes it
// into the runtime CourseNode tree the UI consumes.
//
// v4 semantics implemented here (and only here):
//   - *Number fields derived from array order
//   - stepId derived as `<lessonId>-s<n>`
//   - step `text` (space-separated string) split into content tokens
//   - `mode` presets expanded into StepRules
//   - lesson `keys` derived from step text when not authored

import rawCourse from '@/data/lessons.json';
import { LESSON_TYPES } from '@/lib/lessonTypes';
import {
  CourseNode,
  ChapterNode,
  SectionNode,
  LessonNode,
  StepNode,
  StepRules,
  StepMode,
  CourseSource,
  LessonSource,
  StepSource,
} from '@/types/lesson';

export const MODE_PRESETS: Record<
  StepMode,
  Pick<StepRules, 'allowBackspace' | 'blockOnTypo' | 'maxMistakesAllowed'>
> = {
  // Meeting a new key: no deleting, cursor waits for the right key
  learn: { allowBackspace: false, blockOnTypo: true, maxMistakesAllowed: 2 },
  // Normal practice: fix your mistakes, cursor waits for the right key
  careful: { allowBackspace: true, blockOnTypo: true, maxMistakesAllowed: 2 },
  // Precision test: one uncorrected mistake allowed
  strict: { allowBackspace: true, blockOnTypo: true, maxMistakesAllowed: 1 },
  // Games / free flow: mistakes mark red and the cursor moves on
  free: { allowBackspace: false, blockOnTypo: false, maxMistakesAllowed: 999 },
};

function splitText(text: string | string[]): string[] {
  return Array.isArray(text)
    ? text.filter(Boolean)
    : text.split(/\s+/).filter(Boolean);
}

function buildRules(step: StepSource): StepRules {
  const preset = MODE_PRESETS[step.mode ?? 'careful'];
  return {
    allowBackspace: preset.allowBackspace,
    blockOnTypo: preset.blockOnTypo,
    maxMistakesAllowed: step.maxMistakes ?? preset.maxMistakesAllowed,
    minimumWPM: step.targetWPM ?? 0,
  };
}

export function deriveKeys(steps: StepSource[]): string[] {
  const keys: string[] = [];
  for (const step of steps) {
    for (const token of splitText(step.text)) {
      for (const ch of token.toLowerCase()) {
        if (!keys.includes(ch)) keys.push(ch);
      }
    }
  }
  return keys;
}

function normalizeLesson(lesson: LessonSource, index: number): LessonNode {
  const type = lesson.type ?? 'practice';
  return {
    lessonId: lesson.id,
    lessonNumber: index + 1,
    type,
    lessonTitle: lesson.title,
    pedagogicalGoal: lesson.goal ?? lesson.title,
    unlockedKeys: lesson.keys ?? deriveKeys(lesson.steps),
    passStars: lesson.passStars ?? LESSON_TYPES[type].defaultPassStars,
    thumbnail: lesson.thumbnail?.svgId
      ? { svgId: lesson.thumbnail.svgId, parameters: lesson.thumbnail.parameters }
      : undefined,
    steps: lesson.steps.map(
      (step, i): StepNode => ({
        stepId: `${lesson.id}-s${i + 1}`,
        stepNumber: i + 1,
        viewport: step.viewport,
        instruction: step.instruction,
        content: splitText(step.text),
        rules: buildRules(step),
      }),
    ),
  };
}

function normalize(source: CourseSource): CourseNode {
  return {
    courseId: source.id,
    courseTitle: source.title,
    targetAudience: source.audience ?? '',
    thumbnail: source.thumbnail,
    chapters: source.chapters.map(
      (chapter, ci): ChapterNode => ({
        chapterId: chapter.id,
        chapterNumber: ci + 1,
        chapterTitle: chapter.title,
        description: chapter.description ?? chapter.title,
        sections: chapter.sections.map(
          (section, si): SectionNode => ({
            sectionId: section.id,
            sectionNumber: si + 1,
            sectionTitle: section.title,
            thumbnail: section.thumbnail,
            lessons: section.lessons.map(normalizeLesson),
          }),
        ),
      }),
    ),
  };
}

export const course: CourseNode = normalize(
  rawCourse as unknown as CourseSource,
);
