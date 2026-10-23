// Single source of truth for lesson-type behavior.
// Adding a new lesson type = add one entry here (+ the validator's TYPES list
// in scripts/validate-lessons.mjs, which can't import TS).
//
// graded=false types never earn stars: completing them is passing them.
// graded=true types earn 0-5 stars and gate progression via passStars.

import React from "react";
import { LessonType, LocalizedString } from "@/types/lesson";

export interface LessonTypeConfig {
  /** Earns 0-5 stars and shows star UI. Ungraded types pass on completion. */
  graded: boolean;
  /** Pass gate used when a lesson omits `passStars`. Must be 0 when ungraded. */
  defaultPassStars: number;
  /** Position of this type's group on course pages and rails. */
  order: number;
  /** Group heading shown above the cards. */
  label: LocalizedString;
  /** Chip colors for the type badge (light + dark). */
  badgeClass: string;
}

export const LESSON_TYPES: Record<LessonType, LessonTypeConfig> = {
  lesson: {
    graded: false,
    defaultPassStars: 0,
    order: 0,
    label: { en: "Learn", uz: "O'rganish", ru: "Обучение" },
    badgeClass:
      "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-900",
  },
  practice: {
    graded: false,
    defaultPassStars: 0,
    order: 1,
    label: { en: "Practice", uz: "Mashqlar", ru: "Практика" },
    badgeClass:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900",
  },
  test: {
    graded: true,
    defaultPassStars: 3,
    order: 2,
    label: { en: "Tests", uz: "Testlar", ru: "Тесты" },
    badgeClass:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900",
  },
  game: {
    graded: true,
    defaultPassStars: 1,
    order: 3,
    label: { en: "Games", uz: "O'yinlar", ru: "Игры" },
    badgeClass:
      "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-900",
  },
};

/** Types in display order — drives the group sections on course pages/rails. */
export const LESSON_TYPE_ORDER: LessonType[] = (
  Object.keys(LESSON_TYPES) as LessonType[]
).sort((a, b) => LESSON_TYPES[a].order - LESSON_TYPES[b].order);

export function isGradedType(type: LessonType | undefined): boolean {
  return LESSON_TYPES[type ?? "practice"].graded;
}

export function LessonTypeIcon({
  type,
  size = 12,
  className,
}: {
  type: LessonType;
  size?: number;
  className?: string;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };
  switch (type) {
    case "lesson": // open book
      return (
        <svg {...common}>
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      );
    case "practice": // repeat
      return (
        <svg {...common}>
          <path d="m17 2 4 4-4 4" />
          <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
          <path d="m7 22-4-4 4-4" />
          <path d="M21 13v1a4 4 0 0 1-4 4H3" />
        </svg>
      );
    case "test": // target
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    case "game": // gamepad
      return (
        <svg {...common}>
          <line x1="6" x2="10" y1="11" y2="11" />
          <line x1="8" x2="8" y1="9" y2="13" />
          <line x1="15" x2="15.01" y1="12" y2="12" />
          <line x1="18" x2="18.01" y1="10" y2="10" />
          <path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z" />
        </svg>
      );
  }
}
