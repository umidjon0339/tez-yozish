/**
 * K-12 curriculum — grades 1..11 and the subjects taught in each.
 *
 * The raw source (`data/k-12-curriculum.json`) is written the way a
 * ministry list is written: one entry per grade, holding three PARALLEL
 * arrays (uz / en / ru) of subject names. Index `i` is the same subject in
 * all three languages — that positional pairing is the file's only
 * contract, and this module is the single place that relies on it.
 *
 * Everything downstream consumes the normalized model below, exactly the
 * way pages consume `course` from `@/lib/typing/curriculum` rather than the raw
 * lessons JSON.
 */

import raw from '@/data/k-12-curriculum.json';
import { LocalizedString } from '@/types/lesson';
import type { Tone } from '@/types/thumbnail';

export type { Tone };

type RawGrade = { uz: string[]; en: string[]; ru: string[] };
const source = raw as Record<string, RawGrade>;

export interface K12Subject {
  /** `g3-mathematics` — stable across locales, safe in a URL */
  subjectId: string;
  /** slug of the English name — the key the art/tone tables are keyed by */
  key: string;
  title: LocalizedString;
  /** lucide glyph id drawn by the `SUBJECT_COVER` thumbnail */
  icon: SubjectIcon;
  /** accent hue name shared by every subject in the same family */
  tone: Tone;
}

export interface K12Grade {
  grade: number;
  /** `grade-3` */
  gradeId: string;
  /** "3-sinf" / "Grade 3" / "3 класс" */
  title: LocalizedString;
  subjects: K12Subject[];
}

export type SubjectIcon =
  | 'abc' | 'book' | 'calc' | 'shapes' | 'leaf' | 'flask' | 'atom'
  | 'globe' | 'scroll' | 'laptop' | 'tools' | 'palette' | 'music'
  | 'ball' | 'heart' | 'flag' | 'translate' | 'scales' | 'coin';

/** Subjects that teach the same thing share a glyph AND a hue, so a pupil
 *  scanning grade 9 recognises "the history one" without reading. */
const SUBJECT_ART: Record<string, { icon: SubjectIcon; tone: Tone }> = {
  'alphabet-literacy': { icon: 'abc', tone: 'violet' },
  'mother-tongue': { icon: 'book', tone: 'sky' },
  'reading-literacy': { icon: 'book', tone: 'sky' },
  'reading': { icon: 'book', tone: 'sky' },
  'literature': { icon: 'book', tone: 'indigo' },
  'mathematics': { icon: 'calc', tone: 'emerald' },
  'algebra': { icon: 'calc', tone: 'emerald' },
  'geometry': { icon: 'shapes', tone: 'teal' },
  'technical-drawing': { icon: 'shapes', tone: 'slate' },
  'natural-science': { icon: 'leaf', tone: 'lime' },
  'biology': { icon: 'leaf', tone: 'lime' },
  'chemistry': { icon: 'flask', tone: 'fuchsia' },
  'physics': { icon: 'atom', tone: 'cyan' },
  'geography': { icon: 'globe', tone: 'teal' },
  'history': { icon: 'scroll', tone: 'amber' },
  'history-stories': { icon: 'scroll', tone: 'amber' },
  'world-history': { icon: 'scroll', tone: 'amber' },
  'history-of-uzbekistan': { icon: 'scroll', tone: 'amber' },
  'computer-science': { icon: 'laptop', tone: 'indigo' },
  'technology': { icon: 'tools', tone: 'orange' },
  'visual-arts': { icon: 'palette', tone: 'rose' },
  'music': { icon: 'music', tone: 'fuchsia' },
  'physical-education': { icon: 'ball', tone: 'orange' },
  'character-education': { icon: 'heart', tone: 'rose' },
  'etiquette': { icon: 'heart', tone: 'rose' },
  'patriotism': { icon: 'flag', tone: 'sky' },
  'national-ideology': { icon: 'flag', tone: 'sky' },
  'foreign-language': { icon: 'translate', tone: 'violet' },
  'russian-language': { icon: 'translate', tone: 'violet' },
  'fundamentals-of-law': { icon: 'scales', tone: 'slate' },
  'law': { icon: 'scales', tone: 'slate' },
  'fundamentals-of-economics': { icon: 'coin', tone: 'amber' },
  'economics': { icon: 'coin', tone: 'amber' },
  'entrepreneurship': { icon: 'coin', tone: 'amber' },
};

/** An unmapped subject still gets a card — never a hole in the grid. */
const FALLBACK_ART = { icon: 'book' as SubjectIcon, tone: 'slate' as Tone };

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Each grade's own accent, cycling so neighbours never repeat. */
const GRADE_TONES: Tone[] = [
  'sky', 'emerald', 'amber', 'violet', 'rose', 'indigo',
  'teal', 'orange', 'lime', 'cyan', 'fuchsia',
];

export function gradeTone(grade: number): Tone {
  return GRADE_TONES[(grade - 1) % GRADE_TONES.length];
}

function gradeTitle(grade: number): LocalizedString {
  return {
    en: `Grade ${grade}`,
    uz: `${grade}-sinf`,
    ru: `${grade} класс`,
  };
}

function normalizeGrade(gradeKey: string, entry: RawGrade): K12Grade {
  const grade = Number(gradeKey);
  // uz is the authoritative length — en/ru are read positionally against it,
  // and a short array simply yields no card rather than an `undefined` title.
  const subjects: K12Subject[] = entry.uz.map((uz, i) => {
    const en = entry.en[i] ?? uz;
    const key = slugify(en);
    const art = SUBJECT_ART[key] ?? FALLBACK_ART;
    return {
      subjectId: `g${grade}-${key}`,
      key,
      title: { en, uz, ru: entry.ru[i] ?? en },
      icon: art.icon,
      tone: art.tone,
    };
  });

  return { grade, gradeId: `grade-${grade}`, title: gradeTitle(grade), subjects };
}

/** Grades in ascending order — the JSON keys are strings, so sort numerically. */
export const k12Grades: K12Grade[] = Object.keys(source)
  .sort((a, b) => Number(a) - Number(b))
  .map((k) => normalizeGrade(k, source[k]));

export function findGrade(grade: number | string | null | undefined): K12Grade | null {
  const n = Number(grade);
  if (!Number.isFinite(n)) return null;
  return k12Grades.find((g) => g.grade === n) ?? null;
}
