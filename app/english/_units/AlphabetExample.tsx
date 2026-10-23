import Link from "next/link";
import { ChevronRight, Star } from "lucide-react";
import { useLocale } from "@/lib/core/locale";
import { STR } from "@/lib/core/uiStrings";
import { LETTERS } from "@/lib/english/letters";
import { useLetterProgress } from "@/lib/english/letterProgress";
import { PHONEMES } from "@/lib/english/phonemes";
import {
  phonemeDone,
  phonemeStars,
  usePhonemeProgress,
} from "@/lib/english/phonemeProgress";
import {
  ALPHABET,
  IPA_VOWELS,
  IPA_CONSONANTS,
  UK_SOUNDS,
  US_SOUNDS,
} from "../_data";
import { GroupLabel, TileGrid, IpaTileGrid } from "../_components";

const E = STR.english;

// Unit 1: the Latin alphabet and the IPA sound chart, each linking to its course.
export function AlphabetExample() {
  const { locale } = useLocale();
  const letterProgress = useLetterProgress();
  const lettersDone = LETTERS.filter(
    (l) => letterProgress[l.char]?.completed,
  ).length;
  const letterStars = LETTERS.reduce(
    (sum, l) => sum + (letterProgress[l.char]?.stars ?? 0),
    0,
  );
  const soundProgress = usePhonemeProgress();
  const soundsDone = PHONEMES.filter((p) =>
    phonemeDone(soundProgress, p.slug),
  ).length;
  const soundStars = PHONEMES.reduce(
    (sum, p) => sum + phonemeStars(soundProgress, p.slug),
    0,
  );

  return (
    <div className="flex flex-col gap-4">
      {/* English Latin alphabet → /english/letters */}
      <Link
        href="/english/letters"
        className="block rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm transition-all hover:border-neutral-950 dark:hover:border-white hover:ring-1 hover:ring-neutral-950 dark:hover:ring-white hover:shadow-md"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            {E.alphabet[locale]}
          </span>
          <span className="flex items-center gap-2.5">
            <span className="font-mono text-[12px] font-semibold text-neutral-500 dark:text-neutral-400">
              {E.countLetters[locale].replace(
                "{n}",
                String(ALPHABET.length),
              )}
            </span>
            {lettersDone > 0 && (
              <>
                <span className="font-mono text-[12px] font-semibold text-neutral-500 dark:text-neutral-400">
                  {lettersDone} / {LETTERS.length}
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-[12px] font-semibold text-neutral-500 dark:text-neutral-400">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  {letterStars}
                </span>
              </>
            )}
            <ChevronRight className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
          </span>
        </div>
        <div className="mt-3 flex flex-col gap-4">
          <TileGrid symbols={ALPHABET} />
          {/* vowel / consonant legend */}
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm border border-emerald-500/30 bg-emerald-500/10" />
              {STR.letters.filterVowels[locale]}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900" />
              {STR.letters.filterConsonants[locale]}
            </span>
          </div>
        </div>
      </Link>

      {/* International Phonetic Alphabet → /english/phonemes */}
      <Link
        href="/english/phonemes"
        className="block rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm transition-all hover:border-neutral-950 dark:hover:border-white hover:ring-1 hover:ring-neutral-950 dark:hover:ring-white hover:shadow-md"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            {E.ipa[locale]}
          </span>
          <span className="flex items-center gap-2.5">
            <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-sky-900">
              UK{" "}
              {E.countSounds[locale].replace("{n}", String(UK_SOUNDS))}
            </span>
            <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-rose-900">
              US{" "}
              {E.countSounds[locale].replace("{n}", String(US_SOUNDS))}
            </span>
            {soundsDone > 0 && (
              <>
                <span className="font-mono text-[12px] font-semibold text-neutral-500 dark:text-neutral-400">
                  {soundsDone} / {PHONEMES.length}
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-[12px] font-semibold text-neutral-500 dark:text-neutral-400">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  {soundStars}
                </span>
              </>
            )}
            <ChevronRight className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
          </span>
        </div>
        <p className="mt-1.5 text-[12px] text-neutral-400 dark:text-neutral-500">
          {E.soundLessons[locale]}
        </p>
        <div className="mt-3 flex flex-col gap-4">
          <div>
            <GroupLabel>{STR.letters.filterVowels[locale]}</GroupLabel>
            <IpaTileGrid symbols={IPA_VOWELS} />
          </div>
          <div>
            <GroupLabel>{STR.letters.filterConsonants[locale]}</GroupLabel>
            <IpaTileGrid symbols={IPA_CONSONANTS} />
          </div>
          {/* UK / US legend */}
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900" />
              UK + US
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm border border-sky-500/30 bg-sky-500/10" />
              {E.ukOnly[locale]}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm border border-rose-500/30 bg-rose-500/10" />
              {E.usOnly[locale]}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="font-mono text-[10px] font-semibold text-neutral-400 dark:text-neutral-500">
                [tʰ ʔ]
              </span>
              {E.allophones[locale]}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
