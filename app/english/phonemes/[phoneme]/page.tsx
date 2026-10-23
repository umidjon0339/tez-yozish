"use client";

// Lesson hub for one phoneme (/english/phonemes/ee, …/sh, …) — lists the
// sound's lessons grouped Learn → Practice → Tests → Games, course-style.
// The lessons themselves run at /english/phonemes/[phoneme]/[lesson].

import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale } from "@/lib/core/locale";
import { STR } from "@/lib/core/uiStrings";
import { PHONEME_BY_SLUG } from "@/lib/english/phonemes";
import { PhonemeLessonHub } from "@/components/phonemes/PhonemeLessonHub";

export default function PhonemeHubPage() {
  const params = useParams<{ phoneme: string }>();
  const { locale } = useLocale();
  const info = PHONEME_BY_SLUG[(params.phoneme ?? "").toLowerCase()];

  if (!info) {
    return (
      <div className="flex-1 bg-[#FAFAFA] min-h-screen pt-24 px-6 text-center">
        <p className="text-neutral-600">
          {STR.phonemes.unknownPhoneme[locale]}
        </p>
        <Link
          href="/english/phonemes"
          className="mt-4 inline-block text-sm font-medium text-neutral-900 underline underline-offset-4"
        >
          {STR.phonemes.backToPhonemes[locale]}
        </Link>
      </div>
    );
  }

  return <PhonemeLessonHub key={info.slug} info={info} />;
}
