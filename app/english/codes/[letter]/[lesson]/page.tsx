"use client";

// One secret-codes lesson (/english/codes/a/learn, …). Looked up in the
// "codes" track of lib/english/letterCurriculum.ts; unknown or not-yet-implemented
// ids ("coming soon" cards) fall back to the hub link.

import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale } from "@/lib/core/locale";
import { STR } from "@/lib/core/uiStrings";
import { LETTERS } from "@/lib/english/letters";
import { LETTER_TRACKS } from "@/lib/english/letterCurriculum";
import { LetterLessonRunner } from "@/components/letters/LetterLessonRunner";

export default function CodesLessonPage() {
  const params = useParams<{ letter: string; lesson: string }>();
  const { locale } = useLocale();
  const raw = (params.letter ?? "").toLowerCase();
  const info = LETTERS.find((l) => l.char === raw);
  const lesson = LETTER_TRACKS.codes.lessons.find(
    (l) => l.id === params.lesson && l.implemented,
  );

  if (!info || !lesson) {
    return (
      <div className="flex-1 bg-[#FAFAFA] min-h-screen pt-24 px-6 text-center">
        <p className="text-neutral-600">{STR.letters.unknownLetter[locale]}</p>
        <Link
          href={info ? `/english/codes/${info.char}` : "/english/letters"}
          className="mt-4 inline-block text-sm font-medium text-neutral-900 underline underline-offset-4"
        >
          {STR.letters.backToLetters[locale]}
        </Link>
      </div>
    );
  }

  return (
    <LetterLessonRunner
      key={`${info.char}-${lesson.id}`}
      track="codes"
      info={info}
      lesson={lesson}
    />
  );
}
