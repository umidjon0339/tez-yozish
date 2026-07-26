"use client";

// Lesson hub for one sound's spellings (/english/spellings/ee, …/ay, …) —
// lists the sound's spelling lessons grouped Learn → Practice → Tests →
// Games. The lessons run at /english/spellings/[phoneme]/[lesson].

import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale } from "@/lib/locale";
import { STR } from "@/lib/uiStrings";
import { SPELLING_BY_SLUG } from "@/lib/graphemes";
import { GraphemeLessonHub } from "@/components/graphemes/GraphemeLessonHub";

export default function SpellingHubPage() {
  const params = useParams<{ phoneme: string }>();
  const { locale } = useLocale();
  const info = SPELLING_BY_SLUG[(params.phoneme ?? "").toLowerCase()];

  if (!info) {
    return (
      <div className="flex-1 bg-[#FAFAFA] min-h-screen pt-24 px-6 text-center">
        <p className="text-neutral-600">{STR.graphemes.unknown[locale]}</p>
        <Link
          href="/english/spellings"
          className="mt-4 inline-block text-sm font-medium text-neutral-900 underline underline-offset-4"
        >
          {STR.graphemes.backToSpellings[locale]}
        </Link>
      </div>
    );
  }

  return (
    <GraphemeLessonHub
      key={info.phoneme.slug}
      el={{ track: "spellings", info }}
    />
  );
}
