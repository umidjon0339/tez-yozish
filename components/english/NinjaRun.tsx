"use client";

// Ninja Run — the shared 3D typing-ninja embed of the English units.
// Reuses the arcade's embedded contract (docs/typing-ninja.md §4): words
// from step.content, pace from step.rules.gameSpeed, fail budget from
// step.rules.maxMistakesAllowed; onComplete fires once on victory with
// keystroke stats that grade the lesson (accuracy-only).
//
// NinjaWorld is a WebGL canvas — loaded client-only; mount this OUTSIDE
// any StageScaler (a scale-transformed canvas would render blurry).

import React, { useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { shuffled, type StageStats } from "@/components/english/stage-kit";

const NinjaWorld = dynamic(() => import("@/app/games/typing-ninja/NinjaWorld"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <span className="font-mono text-[12px] uppercase tracking-widest text-neutral-400 animate-pulse">
        …
      </span>
    </div>
  ),
});

const GAME_SPEED = 1;
const MISTAKE_BUDGET = 12;
const RUN_LENGTH = 14;

export function NinjaRun({
  words,
  hudLabel,
  onDone,
}: {
  /** Single a–z words — shuffled once, spawned in sequence. */
  words: string[];
  /** Overlay label above the arena ("/iː/ · type the words…"). */
  hudLabel: string;
  onDone: (stats: StageStats) => void;
}) {
  const done = useRef(false);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  const step = useMemo(
    () => ({
      content: shuffled(words).slice(0, RUN_LENGTH),
      rules: { gameSpeed: GAME_SPEED, maxMistakesAllowed: MISTAKE_BUDGET },
    }),
    [words],
  );

  return (
    <div className="flex-1 min-h-0 w-full relative">
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 font-mono text-[12px] uppercase tracking-widest text-white/70 pointer-events-none drop-shadow">
        {hudLabel}
      </div>
      <NinjaWorld
        step={step}
        isEmbedded
        onComplete={(stats) => {
          if (done.current) return;
          done.current = true;
          onDoneRef.current(
            stats ?? {
              // No stats (shouldn't happen) — count the run as clean.
              correct: step.content.join("").length,
              mistakes: 0,
              timeMs: 0,
              perKeyMistakes: {},
            },
          );
        }}
      />
    </div>
  );
}
