// The home-page typing test — the data model behind the Monkeytype-style
// test on `/`. Pure: modes, text lookup, generation and scoring.
// The React side lives in `components/home/` (see docs/home-test.md).
//
// **No text lives in this file.** Every word, sentence and quote comes from
// `data/typing-texts.json`, which is the one place to edit or add content.
// Subject names come from the normalized `lib/catalog/k12` model; the text file is
// keyed by the same subject slugs, so a subject is named once for the app.
//
// Content is Latin-only on purpose: the on-screen keyboard and hands art are a
// US QWERTY layout, so a Cyrillic word bank would light up nothing. The UI is
// still en/uz/ru — only the *typed text* is limited to English and Uzbek.

import texts from "@/data/typing-texts.json";
import { k12Grades, type K12Subject } from "@/lib/catalog/k12";
import type { Locale } from "@/lib/core/locale";

export type TestMode = "time" | "words" | "quote" | "curriculum" | "custom";
export type TestLang = "en" | "uz";
export type QuoteLength = "short" | "medium" | "long" | "all";

export const TEST_MODES: TestMode[] = ["time", "words", "quote", "curriculum", "custom"];
export const TIME_VALUES = [15, 30, 60, 120] as const;
export const WORD_VALUES = [10, 25, 50, 100] as const;
export const QUOTE_LENGTHS: QuoteLength[] = ["all", "short", "medium", "long"];
export const TEST_LANGS: TestLang[] = ["en", "uz"];

export const LANG_LABEL: Record<TestLang, string> = {
  en: "english",
  uz: "o'zbekcha",
};

// ─── THE TEXT FILE ───

interface LangTexts {
  words?: string[];
  sentences?: string[];
}
type SubjectEntry = Partial<Record<TestLang, LangTexts>>;

export interface Quote {
  text: string;
  source: string;
}

const WORD_BANK = texts.words as Record<TestLang, string[]>;
const QUOTES = texts.quotes as Record<TestLang, Quote[]>;
const SUBJECT_TEXTS = texts.subjects as Record<string, SubjectEntry>;

// ─── SUBJECTS ───
// Names are read through the normalized `lib/catalog/k12` model, never the raw
// curriculum JSON — same rule as `course` from `lib/typing/curriculum`.
// `K12Subject.key` is the slug the text file is keyed by, so a subject is
// named once for the whole app.

/**
 * The five subjects the config bar offers. The test is a warm-up on the way
 * to a lesson, not a course browser: a grade picker in front of a fourteen-item
 * subject list cost two clicks before anyone could type a word, so the bar
 * shows these five straight away and nothing else.
 *
 * **Edit this list to change what the bar offers**; every slug must exist in
 * `data/typing-texts.json` (`npm run validate:texts` proves the whole
 * curriculum is covered, so any taught subject is safe to name here). Order is
 * the order they appear in the pill.
 */
export const FEATURED_SUBJECTS: string[] = [
  "mathematics",
  "physics",
  "biology",
  "literature",
  "economics",
];

export interface SubjectOption {
  /** the `lib/catalog/k12` slug — the key `data/typing-texts.json` uses */
  key: string;
  /** what to show, in the interface language */
  label: string;
}

/** The localized name of a subject slug, from whichever grade teaches it. */
export function subjectTitle(key: string, locale: Locale): string {
  for (const g of k12Grades) {
    const found = g.subjects.find((s: K12Subject) => s.key === key);
    if (found) return found.title[locale];
  }
  return key;
}

export function featuredSubjects(locale: Locale): SubjectOption[] {
  return FEATURED_SUBJECTS.map((key) => ({ key, label: subjectTitle(key, locale) }));
}

/**
 * All of a subject's text, in one pool.
 *
 * The file may split a subject by school band (`mathematics@primary` next to
 * `mathematics`) so a grade picker could hand a seven-year-old easier
 * sentences. There is no grade picker any more, so every band is pooled
 * instead — otherwise the `@primary` sentences would sit in the file unread.
 * Keep the split: it is what a picker would need, and the sentences are short
 * enough that the mix reads as variety.
 */
function subjectTexts(subject: string, lang: TestLang): LangTexts {
  const out: LangTexts = { words: [], sentences: [] };
  for (const [key, entry] of Object.entries(SUBJECT_TEXTS)) {
    if (key !== subject && !key.startsWith(`${subject}@`)) continue;
    const t = entry[lang];
    if (!t) continue;
    if (t.words) out.words!.push(...t.words);
    if (t.sentences) out.sentences!.push(...t.sentences);
  }
  return out;
}

// ─── CONFIG ───

export interface TestConfig {
  mode: TestMode;
  /** seconds, for `time` */
  time: number;
  /** word count, for `words` */
  words: number;
  /** bucket, for `quote` */
  quote: QuoteLength;
  /** `lib/catalog/k12` subject slug, for `curriculum` */
  subject: string;
  lang: TestLang;
  punctuation: boolean;
  numbers: boolean;
  /** the learner's own text, for `custom` */
  custom: string;
}

export const DEFAULT_CONFIG: TestConfig = {
  mode: "time",
  time: 30,
  words: 25,
  quote: "medium",
  subject: FEATURED_SUBJECTS[0],
  lang: "en",
  punctuation: false,
  numbers: false,
  custom: "",
};

const CONFIG_KEY = "tz-typetest-v1";

export function loadConfig(): TestConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = window.localStorage.getItem(CONFIG_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const saved = JSON.parse(raw) as Partial<TestConfig>;
    const cfg = { ...DEFAULT_CONFIG, ...saved };
    // A saved value from an older build could name a mode or subject we
    // dropped — the subject list shrank to five when the grade picker went.
    if (!TEST_MODES.includes(cfg.mode)) cfg.mode = DEFAULT_CONFIG.mode;
    if (!TEST_LANGS.includes(cfg.lang)) cfg.lang = DEFAULT_CONFIG.lang;
    if (!QUOTE_LENGTHS.includes(cfg.quote)) cfg.quote = DEFAULT_CONFIG.quote;
    if (!FEATURED_SUBJECTS.includes(cfg.subject)) cfg.subject = DEFAULT_CONFIG.subject;
    return cfg;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(cfg: TestConfig) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
  } catch {
    /* private mode — the test still runs, it just forgets the settings */
  }
}

// ─── QUOTES ───

const QUOTE_BOUNDS: Record<Exclude<QuoteLength, "all">, [number, number]> = {
  short: [0, 100],
  medium: [100, 300],
  long: [300, Infinity],
};

export function pickQuote(lang: TestLang, bucket: QuoteLength): Quote {
  const all = QUOTES[lang];
  const pool =
    bucket === "all"
      ? all
      : all.filter((q) => {
          const [lo, hi] = QUOTE_BOUNDS[bucket];
          return q.text.length >= lo && q.text.length < hi;
        });
  const from = pool.length ? pool : all;
  return from[Math.floor(Math.random() * from.length)];
}

// ─── GENERATION ───

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const chance = (p: number) => Math.random() < p;

/** How many words a `time` test pre-generates, and how many it tops up by. */
export const TIME_BATCH = 80;

/**
 * `numbers` swaps roughly one word in eight for a number, exactly like the
 * reference: the number replaces the word rather than being appended, so the
 * word count a learner picked stays the count they type.
 */
function withNumbers(words: string[]): string[] {
  return words.map((w) =>
    chance(0.12) ? String(Math.floor(Math.random() * 1000)) : w,
  );
}

/**
 * `punctuation` rewrites the stream into sentences: capitalised first word,
 * commas inside, a terminator at the end, and the occasional quoted or
 * bracketed word. Sentences run 3–9 words, so a short test still gets a period.
 */
function withPunctuation(words: string[]): string[] {
  const out = [...words];
  let sentenceStart = 0;
  let len = 3 + Math.floor(Math.random() * 7);

  const capitalise = (i: number) => {
    out[i] = out[i].charAt(0).toUpperCase() + out[i].slice(1);
  };

  capitalise(0);
  for (let i = 0; i < out.length; i++) {
    const endOfSentence = i === out.length - 1 || i - sentenceStart >= len;
    if (endOfSentence) {
      out[i] += pick([".", ".", ".", ".", "?", "!", "..."]);
      sentenceStart = i + 1;
      len = 3 + Math.floor(Math.random() * 7);
      if (i + 1 < out.length) capitalise(i + 1);
      continue;
    }
    if (i > sentenceStart && chance(0.1)) {
      out[i] += pick([",", ",", ",", ";", ":", "-"]);
    } else if (chance(0.04)) {
      out[i] = pick(['"', "'", "(", "[", "{"]) === '"' ? `"${out[i]}"` : `(${out[i]})`;
    }
  }
  return out;
}

export function generateWords(cfg: TestConfig, count: number, bank?: string[]): string[] {
  const from = bank?.length ? bank : WORD_BANK[cfg.lang];
  let out: string[] = [];
  // Never the same word twice in a row — repeats read like a bug, not a drill.
  for (let i = 0; i < count; i++) {
    let w = pick(from);
    if (i > 0 && w === out[i - 1]) w = pick(from);
    out.push(w);
  }
  if (cfg.numbers) out = withNumbers(out);
  if (cfg.punctuation) out = withPunctuation(out);
  return out;
}

export interface TestText {
  words: string[];
  /** set for `quote` and `curriculum`, shown under the result */
  source?: string;
  /** `time` keeps asking for more words as the learner runs out */
  infinite: boolean;
}

export function buildTest(cfg: TestConfig): TestText {
  switch (cfg.mode) {
    case "time":
      return { words: generateWords(cfg, TIME_BATCH), infinite: true };
    case "words":
      return { words: generateWords(cfg, cfg.words), infinite: false };
    case "quote": {
      const q = pickQuote(cfg.lang, cfg.quote);
      return { words: q.text.split(/\s+/), source: q.source, infinite: false };
    }
    case "curriculum": {
      // A sentence is the better drill when the subject has one; a subject with
      // only vocabulary falls back to a word test over that vocabulary.
      const t = subjectTexts(cfg.subject, cfg.lang);
      // The English name: the result screen shows it verbatim, and the
      // interface language is not knowable from here (this module is pure).
      const source = subjectTitle(cfg.subject, "en");
      if (t.sentences?.length) {
        return { words: pick(t.sentences).split(/\s+/), source, infinite: false };
      }
      return {
        words: generateWords(cfg, cfg.words, t.words),
        source: t.words?.length ? source : undefined,
        infinite: false,
      };
    }
    case "custom":
    default: {
      const words = cfg.custom.trim().split(/\s+/).filter(Boolean);
      return words.length
        ? { words, infinite: false }
        : {
            words: generateWords({ ...cfg, punctuation: false, numbers: false }, 25),
            infinite: false,
          };
    }
  }
}

// ─── SCORING ───

export interface CharCounts {
  /** chars typed in the right place, plus the space after each perfect word */
  correct: number;
  /** chars typed in the wrong place inside a word */
  incorrect: number;
  /** chars typed past the end of a word */
  extra: number;
  /** chars of a word that were skipped by hitting space early */
  missed: number;
}

/** Compare what was typed against the target, word by word. */
export function countChars(
  words: string[],
  typed: string[],
  upTo: number,
): CharCounts {
  const c: CharCounts = { correct: 0, incorrect: 0, extra: 0, missed: 0 };
  for (let i = 0; i < upTo; i++) {
    const target = words[i] ?? "";
    const got = typed[i] ?? "";
    const common = Math.min(target.length, got.length);
    for (let j = 0; j < common; j++) {
      if (got[j] === target[j]) c.correct++;
      else c.incorrect++;
    }
    if (got.length > target.length) c.extra += got.length - target.length;
    else c.missed += target.length - got.length;
    // The space that ended the word only counts when the word was perfect.
    if (got === target && i < upTo - 1) c.correct++;
  }
  return c;
}

export interface Sample {
  /** seconds since the first keystroke */
  t: number;
  wpm: number;
  raw: number;
  errors: number;
}

export interface TestResult {
  wpm: number;
  raw: number;
  /** 0–100, correct keypresses over all keypresses */
  accuracy: number;
  /** 0–100, how even the speed was */
  consistency: number;
  chars: CharCounts;
  timeMs: number;
  samples: Sample[];
  mode: TestMode;
  modeValue: string;
  lang: TestLang;
  source?: string;
  /** expected char → how many times it was mistyped */
  problemKeys: Record<string, number>;
}

const GROSS_PER_WORD = 5; // the standard: a "word" is five characters

export function wpmOf(chars: number, ms: number): number {
  if (ms <= 0) return 0;
  return (chars / GROSS_PER_WORD) * (60000 / ms);
}

/**
 * Consistency is the coefficient of variation of the per-second raw speed,
 * turned inside out so that 100 means "never sped up or slowed down".
 */
export function consistencyOf(samples: Sample[]): number {
  const vals = samples.map((s) => s.raw).filter((v) => v > 0);
  if (vals.length < 2) return 100;
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  if (mean <= 0) return 0;
  const variance =
    vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
  const cv = Math.sqrt(variance) / mean;
  return Math.max(0, Math.min(100, 100 * (1 - cv)));
}

export function modeValueLabel(cfg: TestConfig): string {
  switch (cfg.mode) {
    case "time":
      return `${cfg.time}`;
    case "words":
      return `${cfg.words}`;
    case "quote":
      return cfg.quote;
    case "curriculum":
      return subjectTitle(cfg.subject, "en");
    default:
      return cfg.mode;
  }
}
