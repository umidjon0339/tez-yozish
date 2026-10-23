'use client';

import React, { useCallback, useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { course as courseData } from '@/lib/typing/curriculum';
import { SectionNode, LessonNode } from '@/types/lesson';
import { DynamicThumbnail } from '@/components/thumbnails/DynamicThumbnail';
import { getProgress, computeUnlocked, isLessonPassed, ProgressMap } from '@/lib/typing/progress';
import { LESSON_TYPES, LESSON_TYPE_ORDER } from '@/lib/typing/lessonTypes';
import { useLocale } from '@/lib/core/locale';
import { STR } from '@/lib/core/uiStrings';

export default function CourseDetailPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ sectionId?: string }>
}) {
  const sp = use(searchParams);
  const { locale } = useLocale();
  const router = useRouter();
  const course = courseData;
  const [isRouting, setIsRouting] = useState(false);
  
  // State to track which section is currently "open"
  const [activeSectionId, setActiveSectionId] = useState<string | null>(sp?.sectionId || null);
  const [progress, setProgress] = useState<ProgressMap>({});

  useEffect(() => {
    setProgress(getProgress());
  }, []);

  useEffect(() => {
    if (sp?.sectionId) {
      setActiveSectionId(sp.sectionId);
    }
  }, [sp?.sectionId]);

  const launchLesson = useCallback((lessonId: string | number) => {
    setIsRouting(true);
    router.push(`/lesson/${lessonId}`);
  }, [router]);

  // Find active section details if one is selected
  let activeSection: SectionNode | null = null;
  let activeChapterTitle = "";
  if (activeSectionId) {
    for (const chapter of course.chapters || []) {
      const found = chapter.sections?.find(s => s.sectionId === activeSectionId);
      if (found) {
        activeSection = found;
        activeChapterTitle = chapter.chapterTitle[locale];
        break;
      }
    }
  }

  // Star tally for the section header — only graded lessons (tests, games) award stars
  const gradedLessons = activeSection
    ? activeSection.lessons.filter(l => LESSON_TYPES[l.type].graded)
    : [];
  const earnedStars = gradedLessons.reduce((sum, l) => sum + (progress[l.lessonId]?.stars ?? 0), 0);
  const totalStars = gradedLessons.length * 5;

  return (
    <div className={`flex-1 flex flex-col bg-[#FAFAFA] dark:bg-neutral-950 text-neutral-950 dark:text-white font-sans min-h-screen pt-7 px-6 transition-opacity duration-200 ${isRouting ? 'opacity-0' : 'opacity-100'}`}>
      <div className="max-w-5xl mx-auto w-full">
        <section className="w-full pb-32">
          
          {activeSection ? (
             <div className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
               <button 
                 onClick={() => setActiveSectionId(null)} 
                 className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-medium text-sm flex items-center gap-2 mb-8 transition-colors bg-white dark:bg-neutral-900 px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow"
               >
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                 {STR.courses.backToSections[locale]}
               </button>
               
              

               {(() => {
                 // Groups follow the pedagogical arc: Learn → Practice → Tests → Games
                 const groups = LESSON_TYPE_ORDER
                   .map(t => ({
                     type: t,
                     cfg: LESSON_TYPES[t],
                     lessons: activeSection!.lessons.filter(l => l.type === t),
                   }))
                   .filter(g => g.lessons.length > 0);

                 // Sequential unlocking follows the authored lesson order
                 const unlockedFlags = computeUnlocked(
                   activeSection.lessons.map(l => ({ lessonId: l.lessonId, passStars: l.passStars })),
                   progress,
                 );
                 const unlockedMap: Record<string, boolean> = {};
                 activeSection.lessons.forEach((l, i) => { unlockedMap[l.lessonId] = unlockedFlags[i]; });

                 // The first unlocked-but-not-yet-passed lesson is "up next"
                 const nextUpId = activeSection.lessons.find((l, i) =>
                   unlockedFlags[i] &&
                   !isLessonPassed({ lessonId: l.lessonId, passStars: l.passStars }, progress),
                 )?.lessonId;

                 const renderLessonCard = (lesson: LessonNode) => {
                   const cfg = LESSON_TYPES[lesson.type];
                   const prog = progress[lesson.lessonId];
                   const completed = !!prog?.completed;
                   const locked = !unlockedMap[lesson.lessonId];
                   const isNextUp = lesson.lessonId === nextUpId;
                   const showStars = cfg.graded && completed && (prog?.stars ?? 0) > 0;
                   return (
                   <div
                     key={lesson.lessonId}
                     onClick={locked ? undefined : () => launchLesson(lesson.lessonId)}
                     aria-disabled={locked}
                     className={`group bg-white dark:bg-neutral-900 border rounded-lg shadow-sm transition-all duration-200 flex flex-col overflow-hidden relative ${
                       locked
                         ? 'border-neutral-200 dark:border-neutral-800 cursor-not-allowed'
                         : isNextUp
                           ? 'border-emerald-500 ring-2 ring-emerald-500 hover:shadow-md cursor-pointer'
                           : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 hover:shadow-md cursor-pointer'
                     }`}
                   >
                     <div className="w-full aspect-[16/10] bg-neutral-50 dark:bg-neutral-900 relative overflow-hidden">
                       <DynamicThumbnail
                         svgId={lesson.thumbnail?.svgId || 'TWO_KEYS_FOCUS'}
                         params={lesson.thumbnail?.parameters}
                         className={`w-full h-full object-cover transition-all duration-500 ease-out ${
                           locked ? '' : 'group-hover:scale-105'
                         }`}
                       />

                       {/* Earned stars — big, on top of the thumbnail */}
                       {showStars && !locked && (
                         <div className="absolute top-1.5 left-1/2 -translate-x-1/2 z-10 text-base sm:text-lg tracking-wide leading-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)]">
                           <span className="text-amber-400">{'★'.repeat(prog.stars)}</span>
                           <span className="text-neutral-300/90 dark:text-neutral-600/90">{'★'.repeat(5 - prog.stars)}</span>
                         </div>
                       )}

                       {/* Completed badge — big and unmistakable */}
                       {completed && !locked && (
                         <div className="absolute top-2 right-2 z-10 w-5 h-5 bg-emerald-500 text-white flex items-center justify-center rounded-full shadow-md ring-2 ring-white">
                           <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                         </div>
                       )}

                       {/* Padlock badge — top-right, so the artwork stays visible */}
                       {locked && (
                         <div className="absolute top-2 right-2 z-10 w-7 h-7 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md ring-1 ring-black/5">
                           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-500 dark:text-neutral-400"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                         </div>
                       )}
                     </div>

                     <div className="border-t border-neutral-100 dark:border-neutral-800 py-2 sm:py-3 px-2 text-center bg-white dark:bg-neutral-900 flex flex-col items-center justify-center min-h-[44px] gap-0.5">
                       <span className={`text-[10px] sm:text-xs font-medium truncate transition-colors ${
                         locked ? 'text-neutral-300 dark:text-neutral-600' : 'text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-neutral-200'
                       }`}>
                         {lesson.lessonTitle[locale]}
                       </span>
                     </div>
                   </div>
                   );
                 };

                 return (
                   <div className="flex flex-col gap-8">
                     {groups.map(({ type, cfg, lessons }) => (
                       <div key={type}>
                         <h3 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-3 pl-1">
                           {cfg.label[locale]}
                         </h3>
                         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
                           {lessons.map(renderLessonCard)}
                         </div>
                       </div>
                     ))}
                   </div>
                 );
               })()}
             </div>
          ) : (
             <div className="animate-in fade-in duration-300">
               {course.chapters?.map((chapter) => (
                 <div key={chapter.chapterId} className="mb-10">
                   <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-100 mb-5">{chapter.chapterTitle[locale]}</h2>
                   
                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
                     {chapter.sections?.map((section) => {
                       const totalLessons = section.lessons?.length || 0;
                       const doneLessons =
                         section.lessons?.filter((l) => progress[l.lessonId]?.completed).length || 0;
                       return (
                       <div
                         key={section.sectionId}
                         onClick={() => setActiveSectionId(section.sectionId)}
                         className="group bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 hover:shadow-md rounded-lg shadow-sm transition-all duration-200 cursor-pointer flex flex-col overflow-hidden relative"
                       >
                         {/* multiply keeps the number sitting *in* the light
                             artwork; on a dark thumbnail it would erase it, so
                             dark mode paints it normally in near-white. */}
                         <div className="absolute top-2 left-3 sm:top-3 sm:left-4 text-xl sm:text-2xl font-extrabold text-neutral-500/80 group-hover:text-neutral-700 mix-blend-multiply dark:mix-blend-normal dark:text-neutral-300 dark:group-hover:text-white transition-colors z-10">
                           {section.sectionNumber}
                         </div>

                         <div className="w-full aspect-[16/10] bg-neutral-50 dark:bg-neutral-900 relative overflow-hidden">
                           {section.thumbnail?.imageSrc ? (
                               <img src={section.thumbnail.imageSrc} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
                           ) : section.thumbnail?.svgId ? (
                               <DynamicThumbnail svgId={section.thumbnail.svgId} params={section.thumbnail.parameters} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
                           ) : (
                               <div className="w-full h-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 text-neutral-300 dark:text-neutral-600">
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                               </div>
                           )}
                         </div>

                         {totalLessons > 0 && doneLessons > 0 && (
                           <div className="h-1 w-full bg-neutral-100 dark:bg-neutral-800">
                             <div
                               className="h-full bg-emerald-500 transition-all duration-500"
                               style={{ width: `${(doneLessons / totalLessons) * 100}%` }}
                             />
                           </div>
                         )}
                       </div>
                       );
                     })}
                   </div>
                 </div>
               ))}
             </div>
          )}

        </section>
      </div>
    </div>
  );
}
