"use client";

// One grapheme lesson (/english/graphemes/sh/meet, …/sh/which, …). The
// lesson is looked up in lib/english/graphemeCurriculum.ts; unknown or
// not-yet-implemented ids fall back to the hub link. The unlock chain is
// ENFORCED here too — deep links to a locked lesson show a locked card
// instead of the runner (the check runs after mount, when localStorage
// progress is available).

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Lock } from "lucide-react";
import { useLocale } from "@/lib/core/locale";
import { STR } from "@/lib/core/uiStrings";
import { GRAPHEME_BY_SLUG } from "@/lib/english/graphemes";
import { GRAPHEME_TRACKS, graphemeHubHref } from "@/lib/english/graphemeCurriculum";
import {
  graphemeUnlockedMap,
  useGraphemeProgress,
} from "@/lib/english/graphemeProgress";
import { GraphemeLessonRunner } from "@/components/graphemes/GraphemeLessonRunner";

export default function GraphemeLessonPage() {
  const params = useParams<{ grapheme: string; lesson: string }>();
  const { locale } = useLocale();
  const progress = useGraphemeProgress();
  const info = GRAPHEME_BY_SLUG[(params.grapheme ?? "").toLowerCase()];
  const lesson = GRAPHEME_TRACKS.graphemes.lessons.find(
    (l) => l.id === params.lesson && l.implemented,
  );

  // Progress lives in localStorage — decide locks only after mount so the
  // server snapshot (empty progress) never flashes a wrong verdict.
  const [mounted, setMounted] = useState(false);
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => setMounted(true), []);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!info || !lesson) {
    return (
      <div className="flex-1 bg-[#FAFAFA] min-h-screen pt-24 px-6 text-center">
        <p className="text-neutral-600">{STR.graphemes.unknown[locale]}</p>
        <Link
          href={
            info ? graphemeHubHref("graphemes", info.slug) : "/english/graphemes"
          }
          className="mt-4 inline-block text-sm font-medium text-neutral-900 underline underline-offset-4"
        >
          {STR.graphemes.backToGraphemes[locale]}
        </Link>
      </div>
    );
  }

  if (!mounted) return null;

  if (!graphemeUnlockedMap("graphemes", info.slug, progress)[lesson.id]) {
    return (
      <div className="flex-1 bg-[#FAFAFA] min-h-screen pt-24 px-6 flex flex-col items-center gap-4 text-center animate-in fade-in duration-300">
        <span className="w-14 h-14 rounded-full bg-white border border-neutral-200 shadow-sm flex items-center justify-center text-neutral-400">
          <Lock className="w-6 h-6" />
        </span>
        <p className="text-neutral-600 max-w-sm">
          {STR.phonemes.lockedLesson[locale]}
        </p>
        <Link
          href={graphemeHubHref("graphemes", info.slug)}
          className="text-sm font-semibold bg-neutral-950 text-white hover:bg-neutral-800 px-4 py-2 rounded-md transition-colors shadow-sm"
        >
          {STR.letters.allLessons[locale]}
        </Link>
      </div>
    );
  }

  return (
    <GraphemeLessonRunner
      key={`${info.slug}-${lesson.id}`}
      el={{ track: "graphemes", info }}
      lesson={lesson}
    />
  );
}
