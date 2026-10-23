/**
 * Exam catalogue — the "Exams" group on `/courses`.
 *
 * Shape: **exam → section**. Two tiers only; an exam's sections are its real
 * papers (IELTS Listening/Reading/Writing/Speaking, SAT's two modules…), so
 * there is nothing below them to invent until lesson content exists.
 *
 * `data/exams.json` deliberately records only the parts of an exam that do
 * not drift: its sections and its score range. Minute counts and question
 * counts change with every format revision and would go stale silently, so
 * they are not stored — see the `_readme` there before adding any.
 */

import raw from '@/data/exams.json';
import { LocalizedString } from '@/types/lesson';
import type { Tone } from '@/types/thumbnail';

export interface ExamSection {
  sectionId: string;
  /** lucide component name, resolved by `EXAM_COVER` / the section list */
  icon: string;
  title: LocalizedString;
  detail: LocalizedString;
}

export interface Exam {
  examId: string;
  title: LocalizedString;
  summary: LocalizedString;
  icon: string;
  tone: Tone;
  /** score range, e.g. `0 – 9` — never translated */
  scale: string;
  /** our own certificate, not a third party's — badged and listed first */
  house: boolean;
  sections: ExamSection[];
}

type RawSection = { id: string; icon: string; title: LocalizedString; detail: LocalizedString };
type RawExam = {
  id: string;
  house?: boolean;
  tone: string;
  icon: string;
  scale: string;
  title: LocalizedString;
  summary: LocalizedString;
  sections: RawSection[];
};

const TONES: readonly string[] = [
  'sky', 'emerald', 'amber', 'violet', 'rose', 'indigo',
  'teal', 'orange', 'lime', 'cyan', 'fuchsia', 'slate',
];

/** An unknown hue must not blank a card — fall back, don't throw. */
const toTone = (v: string): Tone => (TONES.includes(v) ? v : 'slate') as Tone;

export const exams: Exam[] = (raw as unknown as { exams: RawExam[] }).exams.map((e) => ({
  examId: e.id,
  title: e.title,
  summary: e.summary,
  icon: e.icon,
  tone: toTone(e.tone),
  scale: e.scale,
  house: e.house === true,
  sections: e.sections.map((s) => ({
    sectionId: s.id,
    icon: s.icon,
    title: s.title,
    detail: s.detail,
  })),
}));

export function findExam(examId: string | null | undefined): Exam | null {
  if (!examId) return null;
  return exams.find((e) => e.examId === examId) ?? null;
}
