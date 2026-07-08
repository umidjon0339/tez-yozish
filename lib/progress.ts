// Lesson progress & typing statistics — stored in localStorage (key: tz-progress-v1).
// All reads/writes are guarded so this is safe to import from server components.

export interface StepStats {
  correct: number; // correct keystrokes
  mistakes: number;
  timeMs: number; // active typing time for the step
  perKeyMistakes: Record<string, number>; // expected char -> mistake count
}

export interface LessonRunStats {
  correct: number;
  mistakes: number;
  timeMs: number;
  perKeyMistakes: Record<string, number>;
  skippedSteps: number;
}

export interface LessonResult {
  stars: 0 | 1 | 2 | 3 | 4 | 5;
  wpm: number;
  accuracy: number; // 0-100
  mistakes: number;
  timeMs: number;
  hardestKey: string | null;
  skipped: boolean;
}

export interface StoredLessonProgress {
  completed: boolean;
  stars: number; // best ever
  bestWpm: number;
  bestAccuracy: number;
  lastPlayedAt: string;
}

export type ProgressMap = Record<string, StoredLessonProgress>;

const STORAGE_KEY = "tz-progress-v1";

export function getProgress(): ProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

export function getLessonProgress(
  lessonId: string,
): StoredLessonProgress | null {
  return getProgress()[lessonId] ?? null;
}

export function saveLessonResult(
  lessonId: string,
  result: LessonResult,
): ProgressMap {
  if (typeof window === "undefined") return {};
  const all = getProgress();
  const prev = all[lessonId];
  all[lessonId] = {
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
  return all;
}

// ─── SEQUENTIAL UNLOCKING ───
// A lesson is "passed" when it's completed with at least its passStars.
// Lesson i is unlocked when every lesson before it in the section is passed.

export interface UnlockRef {
  lessonId: string;
  passStars: number;
}

export function isLessonPassed(
  ref: UnlockRef,
  progress: ProgressMap,
): boolean {
  const p = progress[ref.lessonId];
  return !!p?.completed && (p.stars ?? 0) >= ref.passStars;
}

export function computeUnlocked(
  lessons: UnlockRef[],
  progress: ProgressMap,
): boolean[] {
  let allPassedSoFar = true;
  return lessons.map((l, i) => {
    const unlocked = i === 0 || allPassedSoFar;
    allPassedSoFar = allPassedSoFar && isLessonPassed(l, progress);
    return unlocked;
  });
}

// Standard WPM: 5 characters = 1 word.
export function computeLessonResult(
  stats: LessonRunStats,
  targetWpm: number,
): LessonResult {
  const totalKeys = stats.correct + stats.mistakes;
  const accuracy =
    totalKeys === 0 ? 100 : Math.round((stats.correct / totalKeys) * 100);
  const minutes = stats.timeMs / 60000;
  const wpm = minutes > 0 ? Math.round(stats.correct / 5 / minutes) : 0;

  let hardestKey: string | null = null;
  let worst = 1; // require at least 2 mistakes on a key to call it "hardest"
  for (const [key, count] of Object.entries(stats.perKeyMistakes)) {
    if (count > worst) {
      worst = count;
      hardestKey = key;
    }
  }

  // 5-star ladder. Speed only gates the top tiers, accuracy drives the rest:
  //   5★  ≥97% accuracy AND at target speed
  //   4★  ≥93% accuracy AND at 80% of target speed
  //   3★  ≥85% accuracy
  //   2★  ≥75% accuracy
  //   1★  completed
  //   0★  skipped steps
  const skipped = stats.skippedSteps > 0;
  let stars: LessonResult["stars"];
  if (skipped) {
    stars = 0;
  } else if (accuracy >= 97 && (targetWpm === 0 || wpm >= targetWpm)) {
    stars = 5;
  } else if (accuracy >= 93 && (targetWpm === 0 || wpm >= targetWpm * 0.8)) {
    stars = 4;
  } else if (accuracy >= 85) {
    stars = 3;
  } else if (accuracy >= 75) {
    stars = 2;
  } else {
    stars = 1;
  }

  return { stars, wpm, accuracy, mistakes: stats.mistakes, timeMs: stats.timeMs, hardestKey, skipped };
}
