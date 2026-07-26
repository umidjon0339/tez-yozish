"use client";

// PAIRS — the listening test, writing-first: one side of a minimal pair is
// spoken; the student TYPES the word they heard (both words are shown as
// reference — the choice is made by writing, not clicking). Graded
// accuracy-only, one point per round.

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import { type Locale } from "@/lib/locale";
import { STR } from "@/lib/uiStrings";
import { PHONEME_BY_SLUG, type PhonemeInfo } from "@/lib/phonemes";
import { speakWord } from "@/lib/phonemeAudio";
import {
  AnswerLine,
  RoundHeader,
  playErrSound,
  playKeySound,
  useAnswerInput,
  type AnswerState,
  type StageStats,
} from "@/components/english/stage-kit";

const P = STR.phonemes;
const L = STR.letters;

const PAIRS_ROUNDS = 10;

export function PairsStage({
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
  const rival = info.rival ? PHONEME_BY_SLUG[info.rival] : undefined;
  const [round, setRound] = useState(0);
  // `spoken` snapshots the ref at answer time so render never reads the ref.
  const [answered, setAnswered] = useState<null | {
    state: AnswerState;
    spoken: string;
  }>(null);

  const pair = info.pairs[round % info.pairs.length];
  // Which side is spoken this round — picked at round start (runtime, not
  // render, so replays differ and hydration stays clean).
  const spokenSide = useRef(0);
  const stats = useRef({ correct: 0, mistakes: 0 });
  const startTime = useRef<number | null>(null);
  const done = useRef(false);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  const speakRound = useCallback(() => {
    speakWord(pair[spokenSide.current]);
  }, [pair]);

  useEffect(() => {
    spokenSide.current = Math.random() < 0.5 ? 0 : 1;
    if (startTime.current === null) startTime.current = performance.now();
    const t = setTimeout(() => speakWord(pair[spokenSide.current]), 350);
    return () => clearTimeout(t);
  }, [round, pair]);

  const submit = useCallback(
    (typed: string) => {
      if (answered || done.current) return;
      const spoken = pair[spokenSide.current];
      const correct = typed.trim() === spoken;
      if (correct) stats.current.correct++;
      else stats.current.mistakes++;
      if (isAudioEnabled) (correct ? playKeySound : playErrSound)();
      setAnswered({ state: correct ? "correct" : "wrong", spoken });
      setTimeout(() => {
        if (round + 1 >= PAIRS_ROUNDS) {
          done.current = true;
          onDoneRef.current({
            correct: stats.current.correct,
            mistakes: stats.current.mistakes,
            timeMs: performance.now() - (startTime.current ?? 0),
            perKeyMistakes: {},
          });
        } else {
          setAnswered(null);
          setRound((r) => r + 1);
        }
      }, 1100);
    },
    [answered, round, pair, isAudioEnabled],
  );

  // `answered` stays set through the final feedback pause, so it also
  // covers the done state (the runner unmounts us right after onDone).
  const { typed, reset } = useAnswerInput({
    active: !answered,
    isAudioEnabled,
    onSubmit: submit,
  });

  // Clear the buffer when a new round begins.
  useEffect(() => {
    reset();
  }, [round, reset]);

  const chipCls = (word: string) => {
    const base =
      "rounded-lg border px-4 py-2 font-mono text-xl font-semibold transition-colors ";
    if (answered && word === answered.spoken) {
      return base + "border-emerald-500 bg-emerald-500/10 text-emerald-600";
    }
    return (
      base +
      "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400"
    );
  };

  return (
    <div className="flex flex-col items-center justify-center gap-7 w-full flex-1">
      <RoundHeader
        label={P.roundOf[locale]
          .replace("{a}", String(round + 1))
          .replace("{b}", String(PAIRS_ROUNDS))}
      >
        <div className="flex items-center gap-4 font-mono text-lg font-bold text-neutral-400">
          <span>/{info.symbol}/</span>
          <span className="text-neutral-300">·</span>
          <span>{rival ? `/${rival.symbol}/` : P.noSound[locale]}</span>
        </div>
      </RoundHeader>

      <p className="text-lg text-neutral-600 dark:text-neutral-300">
        {P.echoPrompt[locale]}
      </p>

      <button
        type="button"
        onClick={speakRound}
        title={L.playAgain[locale]}
        className="w-16 h-16 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex items-center justify-center text-neutral-500 hover:text-neutral-950 dark:hover:text-white hover:border-neutral-400 transition-colors cursor-pointer shadow-sm"
      >
        <Volume2 className="w-7 h-7" />
      </button>

      {/* Reference chips — read them, then WRITE the one you heard */}
      <div className="flex items-center gap-4 flex-wrap justify-center">
        <span className={chipCls(pair[0])}>{pair[0]}</span>
        <span className={chipCls(pair[1])}>{pair[1]}</span>
      </div>

      <AnswerLine typed={typed} state={answered?.state ?? null} />

      <p className="font-mono text-[12px] uppercase tracking-widest text-neutral-400">
        {P.typeEnterHint[locale]}
      </p>
    </div>
  );
}
