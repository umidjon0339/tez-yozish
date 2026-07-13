'use client';

import React from 'react';
import Link from 'next/link';
import { course } from '@/lib/curriculum';
import { DynamicThumbnail } from '@/components/thumbnails/DynamicThumbnail';
import { useLocale } from '@/lib/locale';
import { STR } from '@/lib/uiStrings';

export default function CoursesPage() {
  const { locale } = useLocale();
  const courses = course;

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFA] min-h-screen pt-24 px-6">
      <div className="max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-extrabold text-neutral-900 mb-8">{STR.courses.title[locale]}</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link href={`/courses/${courses.courseId}`}>
            <div className="group bg-white border border-neutral-200 rounded-lg shadow-sm transition-all flex flex-col overflow-hidden relative hover:border-neutral-400 hover:shadow-md cursor-pointer">
              
              {/* Thumbnail Container */}
              <div className="w-full aspect-[16/10] bg-neutral-50 relative overflow-hidden">
                {courses.thumbnail && (
                  courses.thumbnail.imageSrc ? (
                    <img 
                      src={courses.thumbnail.imageSrc} 
                      alt={courses.courseTitle[locale]}
                      className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" 
                    />
                  ) : (
                    courses.thumbnail.svgId && (
                      <DynamicThumbnail 
                        svgId={courses.thumbnail.svgId} 
                        params={courses.thumbnail.parameters} 
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                    )
                  )
                )}
              </div>

              {/* Title Area */}
              <div className="border-t border-neutral-100 py-3 px-4 bg-white flex flex-col min-h-[72px] justify-center">
                <h2 className="text-sm font-bold text-neutral-900 mb-0.5 truncate">{courses.courseTitle[locale]}</h2>
                <p className="text-[11px] text-neutral-500 line-clamp-1">{STR.courses.coreDesc[locale]}</p>
              </div>
            </div>
          </Link>
          
         
        </div>
      </div>
    </div>
  );
}
