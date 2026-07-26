"use client";

// MASTER — the sound's final exam, writing-first: a shuffled mix of three
// typed question kinds.
//   echo  — one side of a minimal pair is spoken; type the word you heard
//   spell — a word is spoken with its spelling as empty slots; type the
//           missing letters
//   shade — an allophone card is shown and its word spoken; type the word
// Shade rounds use the SHADE_WORDS pilot data when available, otherwise
// the ALLOPHONES example words; sounds without enough get extra echo/spell
// rounds so the exam is always the same length. Graded accuracy-only,
// one point per round.

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import { type Locale } from "@/lib/locale";
import { STR } from "@/lib/uiStrings";
import { type PhonemeInfo } from "@/lib/phonemes";
import { SPELLING_BY_SLUG, choiceForSpelling } from "@/lib/graphemes";
import {
  ALLO_PROCESS_INFO,
  quizableAllophones,
  shadesFor,
  type AlloProcess,
} from "@/lib/allophones";
import { speakWord } from "@/lib/phonemeAudio";
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
  | { kind: "echo"; speak: string; refs: [string, string] }
  | { kind: "spell"; word: string; spelling: string }
  | { kind: "shade"; symbol: string; process: AlloProcess; word: string };

function buildRounds(info: PhonemeInfo): MasterRound[] {
  const echoPool: MasterRound[] = shuffled(info.pairs).map((pair) => ({
    kind: "echo",
    speak: pair[Math.random() < 0.5 ? 0 : 1],
    refs: [pair[0], pair[1]],
  }));

  const spellPool: MasterRound[] = shuffled(
    choiceForSpelling(SPELLING_BY_SLUG[info.slug]).rounds,
  )
    .map((r): MasterRound => ({
      kind: "spell",
      word: r.speak,
      spelling: r.options[r.correct],
    }))
    .filter((r) => r.kind === "spell" && r.word.includes(r.spelling));

  // Shade rounds: SHADE_WORDS lists first, ALLOPHONES example words as
  // fallback. Typed answers are a–z only, so phrase drills are skipped.
  const shades = shadesFor(info);
  const shadePool: MasterRound[] = (
    shades
      ? shuffled(shades).map((s) => ({
          kind: "shade" as const,
          symbol: s.symbol,
          process: s.process,
          word:
            shuffled(s.words.filter((w) => !w.includes(" ")))[0] ?? "",
        }))
      : shuffled(quizableAllophones(info)).map((c) => ({
          kind: "shade" as const,
          symbol: c.symbol,
          process: c.process,
          word: c.cleanWord,
        }))
  ).filter((r) => r.word && !r.word.includes(" "));

  // Target mix 5/4/3 — missing shade rounds backfill from the UNUSED
  // hear/spell rounds so nothing repeats.
  const rounds = [
    ...echoPool.slice(0, 5),
    ...spellPool.slice(0, 4),
    ...shadePool.slice(0, 3),
  ];
  for (const next of [...echoPool.slice(5), ...spellPool.slice(4)]) {
    if (rounds.length >= TOTAL_ROUNDS) break;
    rounds.push(next);
  }
  return shuffled(rounds).slice(0, TOTAL_ROUNDS);
}

export function MasterStage({
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
    setRounds(buildRounds(info));
  }, [info]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const round = rounds?.[idx];

  // Speak the question. Every kind is heard — echo/shade dictate the whole
  // word, spell dictates the word whose letters are missing.
  useEffect(() => {
    if (!round) return;
    if (startTime.current === null) startTime.current = performance.now();
    const say =
      round.kind === "echo"
        ? round.speak
        : round.kind === "spell"
          ? round.word
          : round.word;
    const t = setTimeout(() => speakWord(say), 350);
    return () => clearTimeout(t);
  }, [round]);

  const submit = useCallback(
    (typed: string) => {
      if (!rounds || !round || answered || done.current) return;
      const expected =
        round.kind === "echo"
          ? round.speak
          : round.kind === "spell"
            ? round.spelling
            : round.word;
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
    maxLen: round?.kind === "spell" ? round.spelling.length : undefined,
    isAudioEnabled,
    onSubmit: submit,
  });

  useEffect(() => {
    reset();
  }, [idx, reset]);

  if (!rounds || !round) return null;

  const prompt =
    round.kind === "echo"
      ? P.echoPrompt[locale]
      : round.kind === "spell"
        ? P.spellTypedPrompt[locale]
        : P.masterShadePrompt[locale];

  const replay = () =>
    speakWord(round.kind === "echo" ? round.speak : round.word);

  const gap = round.kind === "spell" ? round.word.indexOf(round.spelling) : 0;

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

      <p
        key={`${idx}-prompt`}
        className="text-lg text-neutral-600 dark:text-neutral-300 animate-in fade-in duration-300"
      >
        {prompt}
      </p>

      {/* The question */}
      {round.kind === "shade" && (
        <div className="flex flex-col items-center gap-1.5">
          <span className="min-w-24 h-24 px-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-center font-mono text-5xl font-bold text-neutral-900 dark:text-white shadow-sm">
            {round.symbol}
          </span>
          <span className="text-[12px] font-medium text-sky-600 dark:text-sky-400">
            {ALLO_PROCESS_INFO[round.process].name[locale]}
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={replay}
        title={L.playAgain[locale]}
        className="w-14 h-14 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex items-center justify-center text-neutral-500 hover:text-neutral-950 dark:hover:text-white hover:border-neutral-400 transition-colors cursor-pointer shadow-sm"
      >
        <Volume2 className="w-6 h-6" />
      </button>

      {round.kind === "echo" && (
        <div className="flex items-center gap-4 flex-wrap justify-center">
          {round.refs.map((w) => (
            <span
              key={w}
              className={`rounded-lg border px-4 py-2 font-mono text-xl font-semibold transition-colors ${
                answered && w === round.speak
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-600"
                  : "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400"
              }`}
            >
              {w}
            </span>
          ))}
        </div>
      )}

      {/* The answer */}
      {round.kind === "spell" ? (
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
