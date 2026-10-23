"use client";

// Lesson hub for one grapheme (/english/graphemes/sh, …/ea, …) — lists the
// spelling's lessons grouped Learn → Practice → Tests → Games, course-style.
// The lessons themselves run at /english/graphemes/[grapheme]/[lesson].

import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale } from "@/lib/core/locale";
import { STR } from "@/lib/core/uiStrings";
import { GRAPHEME_BY_SLUG } from "@/lib/english/graphemes";
import { GraphemeLessonHub } from "@/components/graphemes/GraphemeLessonHub";

export default function GraphemeHubPage() {
  const params = useParams<{ grapheme: string }>();
  const { locale } = useLocale();
  const info = GRAPHEME_BY_SLUG[(params.grapheme ?? "").toLowerCase()];

  if (!info) {
    return (
      <div className="flex-1 bg-[#FAFAFA] min-h-screen pt-24 px-6 text-center">
        <p className="text-neutral-600">{STR.graphemes.unknown[locale]}</p>
        <Link
          href="/english/graphemes"
          className="mt-4 inline-block text-sm font-medium text-neutral-900 underline underline-offset-4"
        >
          {STR.graphemes.backToGraphemes[locale]}
        </Link>
      </div>
    );
  }

  return (
    <GraphemeLessonHub
      key={info.slug}
      el={{ track: "graphemes", info }}
    />
  );
}
