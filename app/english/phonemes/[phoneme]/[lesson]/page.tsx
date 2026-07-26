"use client";

// One phoneme lesson (/english/phonemes/ee/meet, …/ee/shade-2, …). The
// lesson is looked up in the phoneme's own list (phonemeLessonsFor);
// unknown or not-yet-implemented ids fall back to the hub link. The unlock
// chain is ENFORCED here too — deep links to a locked lesson show a
// locked card instead of the runner (the check runs after mount, when
// localStorage progress is available).

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Lock } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { STR } from "@/lib/uiStrings";
import { PHONEME_BY_SLUG } from "@/lib/phonemes";
import { phonemeHubHref, phonemeLessonsFor } from "@/lib/phonemeCurriculum";
import {
  phonemeUnlockedMap,
  usePhonemeProgress,
} from "@/lib/phonemeProgress";
import { PhonemeLessonRunner } from "@/components/phonemes/PhonemeLessonRunner";

export default function PhonemeLessonPage() {
  const params = useParams<{ phoneme: string; lesson: string }>();
  const { locale } = useLocale();
  const progress = usePhonemeProgress();
  const info = PHONEME_BY_SLUG[(params.phoneme ?? "").toLowerCase()];
  const lesson = info
    ? phonemeLessonsFor(info.slug).find(
        (l) => l.id === params.lesson && l.implemented,
      )
    : undefined;

  // Progress lives in localStorage — decide locks only after mount so the
  // server snapshot (empty progress) never flashes a wrong verdict.
  const [mounted, setMounted] = useState(false);
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => setMounted(true), []);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!info || !lesson) {
    return (
      <div className="flex-1 bg-[#FAFAFA] min-h-screen pt-24 px-6 text-center">
        <p className="text-neutral-600">
          {STR.phonemes.unknownPhoneme[locale]}
        </p>
        <Link
          href={info ? phonemeHubHref(info.slug) : "/english/phonemes"}
          className="mt-4 inline-block text-sm font-medium text-neutral-900 underline underline-offset-4"
        >
          {STR.phonemes.backToPhonemes[locale]}
        </Link>
      </div>
    );
  }

  if (!mounted) return null;

  if (!phonemeUnlockedMap(info.slug, progress)[lesson.id]) {
    return (
      <div className="flex-1 bg-[#FAFAFA] min-h-screen pt-24 px-6 flex flex-col items-center gap-4 text-center animate-in fade-in duration-300">
        <span className="w-14 h-14 rounded-full bg-white border border-neutral-200 shadow-sm flex items-center justify-center text-neutral-400">
          <Lock className="w-6 h-6" />
        </span>
        <p className="text-neutral-600 max-w-sm">
          {STR.phonemes.lockedLesson[locale]}
        </p>
        <Link
          href={phonemeHubHref(info.slug)}
          className="text-sm font-semibold bg-neutral-950 text-white hover:bg-neutral-800 px-4 py-2 rounded-md transition-colors shadow-sm"
        >
          {STR.letters.allLessons[locale]}
        </Link>
      </div>
    );
  }

  return (
    <PhonemeLessonRunner
      key={`${info.slug}-${lesson.id}`}
      info={info}
      lesson={lesson}
    />
  );
}
