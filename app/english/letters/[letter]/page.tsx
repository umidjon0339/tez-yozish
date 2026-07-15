"use client";

// Lesson hub for one letter (/english/letters/a … /z) — lists the letter's
// lessons grouped Learn → Practice → Tests → Games, course-style. The
// lessons themselves run at /english/letters/[letter]/[lesson].

import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale } from "@/lib/locale";
import { STR } from "@/lib/uiStrings";
import { LETTERS } from "@/lib/letters";
import { LetterLessonHub } from "@/components/letters/LetterLessonHub";

export default function LetterHubPage() {
  const params = useParams<{ letter: string }>();
  const { locale } = useLocale();
  const raw = (params.letter ?? "").toLowerCase();
  const info = LETTERS.find((l) => l.char === raw);

  if (!info) {
    return (
      <div className="flex-1 bg-[#FAFAFA] min-h-screen pt-24 px-6 text-center">
        <p className="text-neutral-600">{STR.letters.unknownLetter[locale]}</p>
        <Link
          href="/english/letters"
          className="mt-4 inline-block text-sm font-medium text-neutral-900 underline underline-offset-4"
        >
          {STR.letters.backToLetters[locale]}
        </Link>
      </div>
    );
  }

  return <LetterLessonHub key={info.char} track="letters" info={info} />;
}
