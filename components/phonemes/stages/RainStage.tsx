"use client";

// RAIN — Word Rain over this sound's expanded word pool (shared game:
// components/english/WordRain.tsx). Graded accuracy-only.

import React, { useMemo } from "react";
import { type Locale } from "@/lib/core/locale";
import { STR } from "@/lib/core/uiStrings";
import { type PhonemeInfo } from "@/lib/english/phonemes";
import { typingWordsForPhoneme } from "@/lib/english/allophones";
import { WordRain } from "@/components/english/WordRain";
import { type StageStats } from "@/components/english/stage-kit";

export function RainStage({
  info,
  locale,
  isAudioEnabled,
  onDone,
}: {
  info: PhonemeInfo;
  locale: Locale;
  isAudioEnabled: boolean;
  onDone: (stats: StageStats) => void;
}) {
  const words = useMemo(() => typingWordsForPhoneme(info), [info]);
  return (
    <WordRain
      words={words}
      hudLabel={`/${info.symbol}/`}
      helpText={STR.phonemes.rainHelp[locale]}
      startText={STR.letters.rainStart[locale]}
      scoreLabel={STR.letters.scoreLabel[locale]}
      isAudioEnabled={isAudioEnabled}
      onDone={onDone}
    />
  );
}
