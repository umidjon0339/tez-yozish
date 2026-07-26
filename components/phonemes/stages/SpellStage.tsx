"use client";

// SPELL — spelling patterns, writing-first: a word of this sound is spoken
// and shown with its spelling as empty slots ("sh · · p"); the student
// TYPES the missing letters. The answer auto-checks when the slots are
// full (Enter also submits). Rounds come from the grapheme↔phoneme table
// (choiceForSpelling in lib/graphemes.ts), so the gaps are the sound's
// real spellings.

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import { type Locale } from "@/lib/locale";
import { STR } from "@/lib/uiStrings";
import { type PhonemeInfo } from "@/lib/phonemes";
import { SPELLING_BY_SLUG, choiceForSpelling } from "@/lib/graphemes";
import { speakWord } from "@/lib/phonemeAudio";
import {
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

const MAX_ROUNDS = 10;

interface SpellRound {
  word: string;
  spelling: string;
}

export function SpellStage({
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
  // Rounds shuffled once per mount (hydration-safe: built in an effect).
  const [rounds, setRounds] = useState<SpellRound[] | null>(null);
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
    const spec = choiceForSpelling(SPELLING_BY_SLUG[info.slug]);
    // Keep only rounds whose word really contains the target spelling.
    const usable = spec.rounds
      .map((r) => ({ word: r.speak, spelling: r.options[r.correct] }))
      .filter((r) => r.word.includes(r.spelling));
    setRounds(shuffled(usable).slice(0, MAX_ROUNDS));
  }, [info]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const round = rounds?.[idx];

  useEffect(() => {
    if (!round) return;
    if (startTime.current === null) startTime.current = performance.now();
    const t = setTimeout(() => speakWord(round.word), 350);
    return () => clearTimeout(t);
  }, [round]);

  const submit = useCallback(
    (typed: string) => {
      if (!rounds || !round || answered || done.current) return;
      const correct = typed === round.spelling;
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
        correct ? 800 : 1400, // wrong answers linger to show the fix
      );
    },
    [rounds, round, answered, idx, isAudioEnabled],
  );

  const { typed, reset } = useAnswerInput({
    active: !answered,
    maxLen: round?.spelling.length,
    isAudioEnabled,
    onSubmit: submit,
  });

  useEffect(() => {
    reset();
  }, [idx, reset]);

  if (!rounds || !round) return null;

  const gap = round.word.indexOf(round.spelling);

  return (
    <div className="flex flex-col items-center justify-center gap-7 w-full flex-1">
      <RoundHeader
        label={P.roundOf[locale]
          .replace("{a}", String(idx + 1))
          .replace("{b}", String(rounds.length))}
      >
        <span className="font-mono text-lg font-bold text-neutral-400">
          /{info.symbol}/
        </span>
      </RoundHeader>

      <p className="text-lg text-neutral-600 dark:text-neutral-300">
        {P.spellTypedPrompt[locale]}
      </p>

      {/* The word with the spelling as typable slots */}
      <button
        type="button"
        onClick={() => speakWord(round.word)}
        title={L.playAgain[locale]}
        className="inline-flex items-center gap-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-8 py-5 font-mono text-4xl font-bold text-neutral-900 dark:text-white shadow-sm hover:border-neutral-400 transition-colors cursor-pointer"
      >
        <span>
          {round.word.slice(0, gap)}
          <LetterSlots
            length={round.spelling.length}
            typed={typed}
            state={answered}
            reveal={round.spelling}
          />
          {round.word.slice(gap + round.spelling.length)}
        </span>
        <Volume2 className="w-5 h-5 text-neutral-400 shrink-0" />
      </button>

      <p className="font-mono text-[12px] uppercase tracking-widest text-neutral-400">
        {P.typeEnterHint[locale]}
      </p>
    </div>
  );
}
