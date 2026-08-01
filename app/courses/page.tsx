'use client';

import { use, useState } from 'react';
import { k12Grades, findGrade, gradeTone, K12Grade } from '@/lib/k12';
import { exams, findExam, type Exam } from '@/lib/exams';
import { DynamicThumbnail } from '@/components/thumbnails/DynamicThumbnail';
import { useLocale } from '@/lib/locale';
import { STR } from '@/lib/uiStrings';
import type { Locale } from '@/lib/locale';

/* One grid shape for every card on this page — the same one the course
   detail page uses for its section/lesson grids, so /courses and
   /courses/[id] read as the same surface. */
const GRID = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5';
const CARD =
  'group bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm transition-all duration-200 flex flex-col overflow-hidden relative';
const CARD_HOVER =
  'hover:border-neutral-400 dark:hover:border-neutral-600 hover:shadow-md cursor-pointer';
const GROUP_LABEL =
  'text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-3 pl-1';

/** Two catalogues, so two things the page can be drilled into. */
type View = { kind: 'grade'; grade: K12Grade } | { kind: 'exam'; exam: Exam } | null;

export default function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ grade?: string; exam?: string }>;
}) {
  const sp = use(searchParams);
  const { locale } = useLocale();

  // Deep-linkable on entry (`?grade=5`, `?exam=ielts`), local state after —
  // the same contract `/courses/[id]` has with `?sectionId=`.
  const [view, setView] = useState<View>(() => {
    const g = findGrade(sp?.grade);
    if (g) return { kind: 'grade', grade: g };
    const e = findExam(sp?.exam);
    return e ? { kind: 'exam', exam: e } : null;
  });

  /* Swapping the view keeps the window's scroll offset — without this,
     picking a grade from the bottom row opens the subject grid already
     scrolled, with its back button under the sticky navbar. */
  const show = (next: View) => {
    setView(next);
    window.scrollTo(0, 0);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFA] dark:bg-neutral-950 text-neutral-950 dark:text-white min-h-screen pt-10 px-6">
      <div className="max-w-5xl mx-auto w-full pb-32">
        {view?.kind === 'grade' ? (
          <SubjectsView grade={view.grade} locale={locale} onBack={() => show(null)} />
        ) : view?.kind === 'exam' ? (
          <ExamView exam={view.exam} locale={locale} onBack={() => show(null)} />
        ) : (
          <div className="animate-in fade-in duration-300">
            <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 mb-8">
              {STR.courses.title[locale]}
            </h1>

            {/* Exams — one card per exam, each divided into its real papers */}
            <div className="mb-10">
              <h2 className={GROUP_LABEL}>{STR.courses.examsGroup[locale]}</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4 pl-1">
                {STR.courses.examsDesc[locale]}
              </p>
              <div className={GRID}>
                {exams.map((exam) => (
                  <div
                    key={exam.examId}
                    onClick={() => show({ kind: 'exam', exam })}
                    className={`${CARD} ${CARD_HOVER}`}
                  >
                    <div className="w-full aspect-[16/10] bg-neutral-50 dark:bg-neutral-900 relative overflow-hidden">
                      <DynamicThumbnail
                        svgId="EXAM_COVER"
                        params={{ codeIcon: exam.icon, codeLine: exam.scale, tone: exam.tone }}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardTitle
                      title={exam.title[locale]}
                      subtitle={`${exam.sections.length} ${STR.courses.parts[locale]}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* The K-12 ladder — one card per grade */}
            <div>
              <h2 className={GROUP_LABEL}>{STR.courses.k12Group[locale]}</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4 pl-1">
                {STR.courses.k12Desc[locale]}
              </p>
              <div className={GRID}>
                {k12Grades.map((g) => (
                  <div
                    key={g.gradeId}
                    onClick={() => show({ kind: 'grade', grade: g })}
                    className={`${CARD} ${CARD_HOVER}`}
                  >
                    <div className="w-full aspect-[16/10] bg-neutral-50 dark:bg-neutral-900 relative overflow-hidden">
                      <DynamicThumbnail
                        svgId="GRADE_COVER"
                        params={{ grade: g.grade, tone: gradeTone(g.grade) }}
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                    </div>
                    <CardTitle
                      title={g.title[locale]}
                      subtitle={`${g.subjects.length} ${STR.courses.subjectCount[locale]}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── One exam, divided into its papers ───────────────────────────────── */

function ExamView({
  exam,
  locale,
  onBack,
}: {
  exam: Exam;
  locale: Locale;
  onBack: () => void;
}) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <BackButton label={STR.courses.backToExams[locale]} onClick={onBack} />

      <div className="grid md:grid-cols-[minmax(0,1fr)_260px] gap-8 items-start">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 mb-2">
            {exam.title[locale]}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-8">
            {exam.summary[locale]}
          </p>

          <h2 className={GROUP_LABEL}>{STR.courses.partsLabel[locale]}</h2>
          <ol className="flex flex-col gap-2">
            {exam.sections.map((s, i) => (
              <li
                key={s.sectionId}
                className="flex items-start gap-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-4 py-3 shadow-sm"
              >
                <span className="shrink-0 mt-0.5 w-6 h-6 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[11px] font-bold text-neutral-500 dark:text-neutral-400 flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                    {s.title[locale]}
                  </span>
                  <span className="block text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {s.detail[locale]}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <aside className="w-full flex flex-col gap-4">
          <div className="rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <DynamicThumbnail
              svgId="EXAM_COVER"
              params={{ codeIcon: exam.icon, codeLine: exam.scale, tone: exam.tone }}
              className="w-full aspect-[16/10]"
            />
          </div>
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 shadow-sm">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1.5">
              {STR.courses.score[locale]}
            </h3>
            <p className="font-mono text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {exam.scale}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ── Subjects of one grade ───────────────────────────────────────────── */

function SubjectsView({
  grade,
  locale,
  onBack,
}: {
  grade: K12Grade;
  locale: Locale;
  onBack: () => void;
}) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <BackButton label={STR.courses.backToGrades[locale]} onClick={onBack} />

      <h1 className="text-2xl font-black text-neutral-900 dark:text-neutral-100 mb-1">
        {grade.title[locale]}
      </h1>
      <h2 className={`${GROUP_LABEL} mt-6`}>{STR.courses.subjectsGroup[locale]}</h2>

      <div className={GRID}>
        {grade.subjects.map((s) => (
          <div key={s.subjectId} className={CARD}>
            <div className="w-full aspect-[16/10] bg-neutral-50 dark:bg-neutral-900 relative overflow-hidden">
              <DynamicThumbnail
                svgId="SUBJECT_COVER"
                params={{ subjectIcon: s.icon, tone: s.tone }}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="border-t border-neutral-100 dark:border-neutral-800 py-2 sm:py-3 px-2 text-center bg-white dark:bg-neutral-900 flex flex-col items-center justify-center min-h-11">
              <span className="text-[10px] sm:text-xs font-medium text-neutral-500 dark:text-neutral-400 line-clamp-2">
                {s.title[locale]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-medium text-sm flex items-center gap-2 mb-8 transition-colors bg-white dark:bg-neutral-900 px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow cursor-pointer"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
      {label}
    </button>
  );
}

function CardTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="border-t border-neutral-100 dark:border-neutral-800 py-2 sm:py-3 px-3 bg-white dark:bg-neutral-900 flex flex-col justify-center min-h-13">
      <span className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">
        {title}
      </span>
      <span className="text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
        {subtitle}
      </span>
    </div>
  );
}
