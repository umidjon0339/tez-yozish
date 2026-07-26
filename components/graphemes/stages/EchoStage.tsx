"use client";

// WHICH — the listening test, writing-first: a word from the element's
// choice deck is spoken; the student TYPES the word they heard. The two
// option tiles (sounds for a multi-sound grapheme, spellings otherwise)
// stay on screen as context — the right one lights up after the answer,
// so every round also teaches the mapping. Graded accuracy-only, one
// point per round.

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import { type Locale } from "@/lib/locale";
import { STR } from "@/lib/uiStrings";
import { type ChoiceRound, type ChoiceSpec } from "@/lib/graphemes";
import { speakWord } from "@/lib/phonemeAudio";
import {
  AnswerLine,
  RoundHeader,
  playErrSound,
  playKeySound,
  shuffled,
  useAnswerInput,
  type AnswerState,
  type StageStats,
} from "@/components/english/stage-kit";

const P = STR.phonemes;
const L = STR.letters;

const ROUNDS = 10;

export function EchoStage({
  head,
  spec,
  locale,
  isAudioEnabled,
  onDone,
}: {
  head: string;
  spec: ChoiceSpec;
  locale: Locale;
  isAudioEnabled: boolean;
  onDone: (stats: StageStats) => void;
}) {
  // Rounds shuffled once per mount (runtime randomness, hydration-safe).
  const [rounds, setRounds] = useState<ChoiceRound[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [answered, setAnswered] = useState<AnswerState>(null);
  const stats = useRef({ correct: 0, mistakes: 0 });
  const startTime = useRef<number | null>(null);
  const done = useRef(false);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setRounds(shuffled(spec.rounds).slice(0, ROUNDS));
  }, [spec]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const cur = rounds?.[idx];

  useEffect(() => {
    if (!cur) return;
    if (startTime.current === null) startTime.current = performance.now();
    const t = setTimeout(() => speakWord(cur.speak), 350);
    return () => clearTimeout(t);
  }, [cur]);

  const submit = useCallback(
    (typed: string) => {
      if (!rounds || !cur || answered || done.current) return;
      const correct = typed.trim() === cur.speak;
      if (correct) stats.current.correct++;
      else stats.current.mistakes++;
      if (isAudioEnabled) (correct ? playKeySound : playErrSound)();
      setAnswered(correct ? "correct" : "wrong");
      setTimeout(
        () => {
          if (idx + 1 >= rounds.length) {
            done.current = true;
            onDoneRef.current({
              correct: stats.current.correct,
              mistakes: stats.current.mistakes,
              timeMs: performance.now() - (startTime.current ?? 0),
              perKeyMistakes: {},
            });
          } else {
            setAnswered(null);
            setIdx((i) => i + 1);
          }
        },
        correct ? 900 : 1400,
      );
    },
    [rounds, cur, answered, idx, isAudioEnabled],
  );

  const { typed, reset } = useAnswerInput({
    active: !answered,
    isAudioEnabled,
    onSubmit: submit,
  });

  useEffect(() => {
    reset();
  }, [idx, reset]);

  if (!rounds || !cur) return null;

  const tileCls = (i: number) => {
    const base =
      "min-w-24 rounded-lg border px-4 py-2 font-mono text-xl font-semibold text-center transition-colors ";
    if (answered && i === cur.correct) {
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
          .replace("{a}", String(idx + 1))
          .replace("{b}", String(rounds.length))}
      >
        <span className="font-mono text-lg font-bold text-neutral-400">
          {head}
        </span>
      </RoundHeader>

      <p className="text-lg text-neutral-600 dark:text-neutral-300">
        {P.echoPrompt[locale]}
      </p>

      <button
        type="button"
        onClick={() => speakWord(cur.speak)}
        title={L.playAgain[locale]}
        className="w-16 h-16 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex items-center justify-center text-neutral-500 hover:text-neutral-950 dark:hover:text-white hover:border-neutral-400 transition-colors cursor-pointer shadow-sm"
      >
        <Volume2 className="w-7 h-7" />
      </button>

      {/* Context tiles — the correct one lights up after the answer */}
      <div className="flex items-center gap-4 flex-wrap justify-center">
        {cur.options.map((opt, i) => (
          <span key={opt} className={tileCls(i)}>
            {opt}
          </span>
        ))}
      </div>

      <AnswerLine typed={typed} state={answered} />

      <p className="font-mono text-[12px] uppercase tracking-widest text-neutral-400">
        {P.typeEnterHint[locale]}
      </p>
    </div>
  );
}
