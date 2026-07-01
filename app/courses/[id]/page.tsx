'use client';

import React, { useCallback, useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import lessonsData from '@/data/lessons.json';
import { CourseNode, SectionNode } from '@/types/lesson';
import { DynamicThumbnail } from '@/components/thumbnails/DynamicThumbnail';

export default function CourseDetailPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ sectionId?: string }>
}) {
  const sp = use(searchParams);
  const router = useRouter();
  const course = lessonsData as unknown as CourseNode;
  const [isRouting, setIsRouting] = useState(false);
  
  // State to track which section is currently "open"
  const [activeSectionId, setActiveSectionId] = useState<string | null>(sp?.sectionId || null);

  useEffect(() => {
    if (sp?.sectionId) {
      setActiveSectionId(sp.sectionId);
    }
  }, [sp?.sectionId]);

  const launchLesson = useCallback((lessonId: string | number) => {
    setIsRouting(true);
    setTimeout(() => {
      router.push(`/lesson/${lessonId}`);
    }, 150);
  }, [router]);

  // Find active section details if one is selected
  let activeSection: SectionNode | null = null;
  let activeChapterTitle = "";
  if (activeSectionId) {
    for (const chapter of course.chapters || []) {
      const found = chapter.sections?.find(s => s.sectionId === activeSectionId);
      if (found) {
        activeSection = found;
        activeChapterTitle = chapter.chapterTitle.en;
        break;
      }
    }
  }

  return (
    <div className={`flex-1 flex flex-col bg-[#FAFAFA] text-neutral-950 font-sans min-h-screen pt-24 px-6 transition-opacity duration-200 ${isRouting ? 'opacity-0' : 'opacity-100'}`}>
      <div className="max-w-5xl mx-auto w-full">
        <section className="w-full pb-32">
          
          {activeSection ? (
             <div className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
               <button 
                 onClick={() => setActiveSectionId(null)} 
                 className="text-neutral-500 hover:text-neutral-900 font-medium text-sm flex items-center gap-2 mb-8 transition-colors bg-white px-4 py-2 rounded-lg border border-neutral-200 shadow-sm hover:shadow"
               >
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                 Back to Sections
               </button>
               
               <div className="flex items-center gap-4 mb-8">
                 {activeSection.thumbnail && (
                    <div className="w-20 h-12 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0 border border-neutral-200 shadow-sm">
                       {activeSection.thumbnail.imageSrc ? (
                          <img src={activeSection.thumbnail.imageSrc} alt="" className="w-full h-full object-cover" />
                       ) : activeSection.thumbnail.svgId ? (
                          <DynamicThumbnail svgId={activeSection.thumbnail.svgId} params={activeSection.thumbnail.parameters} className="w-full h-full object-cover" />
                       ) : null}
                    </div>
                 )}
                 <div>
                   <h2 className="text-2xl font-black text-neutral-900 leading-tight">{activeSection.sectionTitle.en}</h2>
                   <p className="text-sm text-neutral-500 mt-1">{activeChapterTitle} • Section {activeSection.sectionNumber}</p>
                 </div>
               </div>

               {(() => {
                 const practiceLessons = activeSection.lessons.filter(l => l.type !== 'game');
                 const gameLessons = activeSection.lessons.filter(l => l.type === 'game');

                 const renderLessonCard = (lesson: any) => (
                   <div 
                     key={lesson.lessonId}
                     onClick={() => launchLesson(lesson.lessonId)}
                     className="group bg-white border border-neutral-200 hover:border-neutral-400 hover:shadow-md rounded-lg shadow-sm transition-all duration-200 cursor-pointer flex flex-col overflow-hidden relative"
                   >
                     <div className="absolute top-2 left-3 sm:top-3 sm:left-4 text-xl sm:text-2xl font-extrabold text-neutral-500/80 group-hover:text-neutral-700 transition-colors z-10 mix-blend-multiply">
                       
                     </div>

                     <div className="w-full aspect-[16/10] bg-neutral-50 relative overflow-hidden">
                       <DynamicThumbnail svgId={lesson.thumbnail?.svgId || 'TWO_KEYS_FOCUS'} params={lesson.thumbnail?.parameters} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
                     </div>

                     <div className="border-t border-neutral-100 py-2 sm:py-3 px-2 text-center bg-white flex items-center justify-center min-h-[44px]">
                       <span className="text-[10px] sm:text-xs font-medium text-neutral-500 group-hover:text-neutral-800 transition-colors truncate">
                         {lesson.lessonTitle.en}
                       </span>
                     </div>
                   </div>
                 );

                 return (
                   <div className="flex flex-col gap-8">
                     {practiceLessons.length > 0 && (
                       <div>
                         {gameLessons.length > 0 && <h3 className="text-sm font-bold text-neutral uppercase tracking-widest mb-3 pl-1">Practice</h3>}
                         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
                           {practiceLessons.map(renderLessonCard)}
                         </div>
                       </div>
                     )}
                     
                     {gameLessons.length > 0 && (
                       <div>
                         <h3 className="text-xs font-bold text-neutral uppercase tracking-widest mb-3 pl-1">Games</h3>
                         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
                           {gameLessons.map(renderLessonCard)}
                         </div>
                       </div>
                     )}
                   </div>
                 );
               })()}
             </div>
          ) : (
             <div className="animate-in fade-in duration-300">
               {course.chapters?.map((chapter) => (
                 <div key={chapter.chapterId} className="mb-16">
                   <h2 className="text-2xl font-black text-neutral-900 mb-8 border-b border-neutral-200 pb-4">{chapter.chapterTitle.en}</h2>
                   
                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
                     {chapter.sections?.map((section) => (
                       <div 
                         key={section.sectionId} 
                         onClick={() => setActiveSectionId(section.sectionId)}
                         className="group bg-white border border-neutral-200 hover:border-neutral-400 hover:shadow-md rounded-lg shadow-sm transition-all duration-200 cursor-pointer flex flex-col overflow-hidden relative"
                       >
                         <div className="absolute top-2 left-3 sm:top-3 sm:left-4 text-xl sm:text-2xl font-extrabold text-neutral-500/80 group-hover:text-neutral-700 transition-colors z-10 mix-blend-multiply">
                           {section.sectionNumber}
                         </div>

                         <div className="w-full aspect-[16/10] bg-neutral-50 relative overflow-hidden">
                           {section.thumbnail?.imageSrc ? (
                               <img src={section.thumbnail.imageSrc} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
                           ) : section.thumbnail?.svgId ? (
                               <DynamicThumbnail svgId={section.thumbnail.svgId} params={section.thumbnail.parameters} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
                           ) : (
                               <div className="w-full h-full flex items-center justify-center bg-neutral-100 text-neutral-300">
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                               </div>
                           )}
                         </div>

                         <div className="border-t border-neutral-100 py-2 sm:py-3 px-2 text-center bg-white flex items-center justify-center min-h-[44px]">
                           <span className="text-[10px] sm:text-xs font-medium text-neutral-500 group-hover:text-neutral-800 transition-colors truncate">
                             {section.sectionTitle.en}
                           </span>
                         </div>
                       </div>
                     ))}
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
