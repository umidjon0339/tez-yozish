"use client";

// MASTER — the element's typed exam: a shuffled mix of two round kinds.
//   echo — a word is spoken with NO context tiles; type what you heard
//   slot — a word is spoken and shown with the element's spelling as
//          empty slots; type the missing letters
// Graded accuracy-only, one point per round.

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import { type Locale } from "@/lib/core/locale";
import { STR } from "@/lib/core/uiStrings";
import { type ChoiceSpec, type SlotRound } from "@/lib/english/graphemes";
import { speakWord } from "@/lib/english/phonemeAudio";
import {
  AnswerLine,
  LetterSlots,
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

const TOTAL_ROUNDS = 12;

type MasterRound =
  | { kind: "echo"; speak: string }
  | { kind: "slot"; word: string; spelling: string };

function buildRounds(spec: ChoiceSpec, slots: SlotRound[]): MasterRound[] {
  const echoPool: MasterRound[] = shuffled(spec.rounds).map((r) => ({
    kind: "echo",
    speak: r.speak,
  }));
  const slotPool: MasterRound[] = shuffled(slots).map((r) => ({
    kind: "slot",
    word: r.word,
    spelling: r.spelling,
  }));
  const rounds = [...echoPool.slice(0, 6), ...slotPool.slice(0, 6)];
  for (const next of [...echoPool.slice(6), ...slotPool.slice(6)]) {
    if (rounds.length >= TOTAL_ROUNDS) break;
    rounds.push(next);
  }
  return shuffled(rounds).slice(0, TOTAL_ROUNDS);
}

export function MasterStage({
  head,
  spec,
  slots,
  locale,
  isAudioEnabled,
  onDone,
}: {
  head: string;
  spec: ChoiceSpec;
  slots: SlotRound[];
  locale: Locale;
  isAudioEnabled: boolean;
  onDone: (stats: StageStats) => void;
}) {
  const [rounds, setRounds] = useState<MasterRound[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [answered, setAnswered] = useState<AnswerState>(null);
  const stats = useRef({ correct: 0, mistakes: 0 });
  const startTime = useRef<number | null>(null);
  const done = useRef(false);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  // Built once per mount (runtime randomness — hydration-safe).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setRounds(buildRounds(spec, slots));
  }, [spec, slots]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const round = rounds?.[idx];

  useEffect(() => {
    if (!round) return;
    if (startTime.current === null) startTime.current = performance.now();
    const say = round.kind === "echo" ? round.speak : round.word;
    const t = setTimeout(() => speakWord(say), 350);
    return () => clearTimeout(t);
  }, [round]);

  const submit = useCallback(
    (typed: string) => {
      if (!rounds || !round || answered || done.current) return;
      const expected =
        round.kind === "echo" ? round.speak : round.spelling;
      const correct = typed.trim() === expected;
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
        correct ? 800 : 1400,
      );
    },
    [rounds, round, answered, idx, isAudioEnabled],
  );

  const { typed, reset } = useAnswerInput({
    active: !answered,
    maxLen: round?.kind === "slot" ? round.spelling.length : undefined,
    isAudioEnabled,
    onSubmit: submit,
  });

  useEffect(() => {
    reset();
  }, [idx, reset]);

  if (!rounds || !round) return null;

  const gap = round.kind === "slot" ? round.word.indexOf(round.spelling) : 0;

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

      <p
        key={`${idx}-prompt`}
        className="text-lg text-neutral-600 dark:text-neutral-300 animate-in fade-in duration-300"
      >
        {round.kind === "echo"
          ? P.echoPrompt[locale]
          : P.spellTypedPrompt[locale]}
      </p>

      <button
        type="button"
        onClick={() =>
          speakWord(round.kind === "echo" ? round.speak : round.word)
        }
        title={L.playAgain[locale]}
        className="w-14 h-14 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex items-center justify-center text-neutral-500 hover:text-neutral-950 dark:hover:text-white hover:border-neutral-400 transition-colors cursor-pointer shadow-sm"
      >
        <Volume2 className="w-6 h-6" />
      </button>

      {round.kind === "slot" ? (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-8 py-5 font-mono text-4xl font-bold text-neutral-900 dark:text-white shadow-sm">
          {round.word.slice(0, gap)}
          <LetterSlots
            length={round.spelling.length}
            typed={typed}
            state={answered}
            reveal={round.spelling}
          />
          {round.word.slice(gap + round.spelling.length)}
        </div>
      ) : (
        <AnswerLine typed={typed} state={answered} />
      )}

      <p className="font-mono text-[12px] uppercase tracking-widest text-neutral-400">
        {P.typeEnterHint[locale]}
      </p>
    </div>
  );
}
