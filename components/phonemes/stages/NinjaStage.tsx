"use client";

// NINJA — the 3D typing-ninja run over this sound's words (shared embed:
// components/english/NinjaRun.tsx — mounts OUTSIDE the StageScaler).

import React, { useMemo } from "react";
import { type Locale } from "@/lib/locale";
import { STR } from "@/lib/uiStrings";
import { type PhonemeInfo } from "@/lib/phonemes";
import { typingWordsForPhoneme } from "@/lib/allophones";
import { NinjaRun } from "@/components/english/NinjaRun";
import { type StageStats } from "@/components/english/stage-kit";

export function NinjaStage({
  info,
  locale,
  onDone,
}: {
  info: PhonemeInfo;
  locale: Locale;
  onDone: (stats: StageStats) => void;
}) {
  const words = useMemo(() => typingWordsForPhoneme(info), [info]);
  return (
    <NinjaRun
      words={words}
      hudLabel={`/${info.symbol}/ · ${STR.phonemes.ninjaHelp[locale]}`}
      onDone={onDone}
    />
  );
}
