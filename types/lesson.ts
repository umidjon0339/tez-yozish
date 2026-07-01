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

export interface StepNode {
  stepId: string;
  stepNumber: number;
  viewport: ViewportMode;
  instruction: LocalizedString;
  content: string[];
  rules: StepRules;
}

import { ThumbnailParams } from './thumbnail';

export interface LessonNode {
  lessonId: string;
  lessonNumber: number;
  type?: 'practice' | 'game';
  lessonTitle: LocalizedString;
  pedagogicalGoal: LocalizedString;
  unlockedKeys: string[];
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
