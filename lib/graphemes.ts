// Static reference data for English graphemes (spellings) — the
// grapheme↔phoneme correspondence table behind /english/graphemes and
// /english/spellings. One dataset drives BOTH directions: each grapheme
// lists the sounds it writes (reading), and SPELLINGS inverts the table so
// every phoneme lists the graphemes that write it (spelling).
//
// Every word is lowercase a–z only (typed in the gym stages) and MUST
// contain its grapheme's spelling as a substring — the MEET stages highlight
// its first occurrence. `sounds[].phoneme` links to lib/phonemes.ts slugs
// when a sound page exists (x → "ks" and qu → "kw" are two phonemes at once,
// so they carry only a display ipa). `rival` is a look-alike / same-sound
// spelling used by the choice test and the sort game when a grapheme has
// only one sound of its own.

import { PHONEMES, type PhonemeInfo } from "@/lib/phonemes";

export type GraphemeKind = "vowel" | "consonant";

export interface GraphemeSound {
  /** Display symbol, e.g. "iː" — always present. */
  ipa: string;
  /** lib/phonemes.ts slug when this sound has its own page. */
  phoneme?: string;
  /** Example words; each contains the grapheme's spelling. */
  words: string[];
}

export interface GraphemeInfo {
  /** The spelling itself — also the URL slug (/english/graphemes/sh). */
  spelling: string;
  slug: string;
  kind: GraphemeKind;
  /** 1 monograph · 2 digraph · 3 trigraph · 4 tetragraph. */
  size: 1 | 2 | 3 | 4;
  /** Most common sound first. */
  sounds: GraphemeSound[];
  /** Look-alike / same-sound spelling (choice + sort fallback). */
  rival?: string;
}

function g(
  spelling: string,
  kind: GraphemeKind,
  sounds: GraphemeSound[],
  rival?: string,
): GraphemeInfo {
  return {
    spelling,
    slug: spelling,
    kind,
    size: spelling.length as GraphemeInfo["size"],
    sounds,
    rival,
  };
}

// prettier-ignore
export const GRAPHEMES: GraphemeInfo[] = [
  /* ── Vowel spellings ─────────────────────────────────────────────────── */
  g("a", "vowel", [
    { ipa: "æ", phoneme: "a", words: ["cat", "hat", "bag", "map", "fan", "sand"] },
    { ipa: "eɪ", phoneme: "ay", words: ["paper", "table", "apron", "baby", "lady", "bacon"] },
    { ipa: "ɑː", phoneme: "ar", words: ["father", "palm", "calm", "drama", "spa", "lava"] },
    { ipa: "ə", phoneme: "schwa", words: ["about", "ago", "away", "banana", "sofa", "panda"] },
  ]),
  g("e", "vowel", [
    { ipa: "e", phoneme: "e", words: ["bed", "ten", "red", "pen", "leg", "wet"] },
    { ipa: "iː", phoneme: "ee", words: ["me", "he", "we", "be", "she", "even"] },
    { ipa: "ɪ", phoneme: "ih", words: ["begin", "pretty", "before", "become", "behind", "report"] },
    { ipa: "ə", phoneme: "schwa", words: ["the", "taken", "seven", "open", "happen", "hundred"] },
  ]),
  g("i", "vowel", [
    { ipa: "ɪ", phoneme: "ih", words: ["sit", "big", "fish", "milk", "win", "ship"] },
    { ipa: "aɪ", phoneme: "eye", words: ["time", "find", "kind", "mind", "wild", "child"] },
    { ipa: "iː", phoneme: "ee", words: ["ski", "pizza", "police", "machine", "taxi", "kiwi"] },
    { ipa: "ə", phoneme: "schwa", words: ["pencil", "family", "animal", "holiday", "capital", "editor"] },
  ]),
  g("o", "vowel", [
    { ipa: "ɑː", phoneme: "o", words: ["hot", "not", "box", "top", "dog", "rock"] },
    { ipa: "oʊ", phoneme: "oh-us", words: ["go", "no", "cold", "most", "both", "hero"] },
    { ipa: "ʌ", phoneme: "uh", words: ["son", "love", "money", "month", "mother", "other"] },
    { ipa: "ə", phoneme: "schwa", words: ["today", "police", "lemon", "carrot", "common", "wagon"] },
    
  ]),
  g("u", "vowel", [
    
    { ipa: "ʊ", phoneme: "u", words: ["put", "push", "full", "pull", "bush", "sugar"] },
   
    { ipa: "uː", phoneme: "oo", words: ["flute", "ruby", "truth", "ruler", "super", "duty"] },
    { ipa: "ʌ", phoneme: "uh", words: ["cup", "sun", "bus", "fun", "run", "mud"] },
    { ipa: "ə", phoneme: "schwa", words: ["album", "circus", "support", "campus", "focus", "minus"] },
  ]),
  g("ai", "vowel", [
    { ipa: "eɪ", phoneme: "ay", words: ["rain", "train", "paint", "tail", "sail", "brain"] },
  ], "ay"),
  g("ay", "vowel", [
    { ipa: "eɪ", phoneme: "ay", words: ["day", "play", "say", "way", "stay", "may"] },
  ], "ai"),
  g("ea", "vowel", [
    { ipa: "iː", phoneme: "ee", words: ["team", "sea", "read", "eat", "mean", "beach"] },
    { ipa: "e", phoneme: "e", words: ["head", "bread", "ready", "dead", "heavy", "weather"] },
  ]),
  g("ee", "vowel", [
    { ipa: "iː", phoneme: "ee", words: ["sheep", "tree", "green", "feet", "seed", "sleep"] },
  ], "ea"),
  g("ie", "vowel", [
    { ipa: "aɪ", phoneme: "eye", words: ["pie", "tie", "lie", "die", "tried", "cried"] },
    { ipa: "iː", phoneme: "ee", words: ["field", "movie", "chief", "piece", "cookie", "believe"] },
  ]),
  g("oa", "vowel", [
    { ipa: "oʊ", phoneme: "oh-us", words: ["boat", "coat", "road", "goat", "soap", "toast"] },
  ], "ow"),
  g("oo", "vowel", [
    { ipa: "uː", phoneme: "oo", words: ["moon", "food", "school", "soon", "room", "pool"] },
    { ipa: "ʊ", phoneme: "u", words: ["book", "foot", "look", "good", "wood", "cook"] },
  ]),
  g("ou", "vowel", [
    { ipa: "aʊ", phoneme: "ow", words: ["out", "house", "mouth", "sound", "cloud", "round"] },
    { ipa: "uː", phoneme: "oo", words: ["soup", "group", "you", "youth", "wound", "coupon"] },
  ]),
  g("ow", "vowel", [
    { ipa: "aʊ", phoneme: "ow", words: ["now", "cow", "town", "how", "down", "brown"] },
    { ipa: "oʊ", phoneme: "oh-us", words: ["snow", "grow", "window", "show", "slow", "yellow"] },
  ]),
  g("oi", "vowel", [
    { ipa: "ɔɪ", phoneme: "oy", words: ["coin", "oil", "point", "soil", "join", "voice"] },
  ], "oy"),
  g("oy", "vowel", [
    { ipa: "ɔɪ", phoneme: "oy", words: ["boy", "toy", "enjoy", "joy", "royal", "loyal"] },
  ], "oi"),
  g("au", "vowel", [
    { ipa: "ɔː", phoneme: "aw", words: ["sauce", "pause", "autumn", "auto", "author", "launch"] },
  ], "aw"),
  g("aw", "vowel", [
    { ipa: "ɔː", phoneme: "aw", words: ["saw", "law", "draw", "paw", "claw", "straw"] },
  ], "au"),
  g("ew", "vowel", [
    { ipa: "uː", phoneme: "oo", words: ["new", "few", "grew", "news", "chew", "flew"] },
  ], "ue"),
  g("ue", "vowel", [
    { ipa: "uː", phoneme: "oo", words: ["blue", "glue", "true", "clue", "due", "rescue"] },
  ], "ew"),
  g("ar", "vowel", [
    { ipa: "ɑː", phoneme: "ar", words: ["car", "star", "park", "farm", "dark", "garden"] },
  ], "or"),
  g("er", "vowel", [
    { ipa: "ə", phoneme: "schwa", words: ["teacher", "winter", "under", "water", "sister", "summer"] },
    { ipa: "ɜː", phoneme: "er", words: ["her", "verb", "herb", "term", "person", "perfect"] },
  ]),
  g("ir", "vowel", [
    { ipa: "ɜː", phoneme: "er", words: ["bird", "girl", "first", "shirt", "dirt", "third"] },
  ], "ur"),
  g("or", "vowel", [
    { ipa: "ɔː", phoneme: "aw", words: ["for", "fork", "horse", "storm", "north", "corner"] },
  ], "ar"),
  g("ur", "vowel", [
    { ipa: "ɜː", phoneme: "er", words: ["turn", "nurse", "burn", "hurt", "purple", "curl"] },
  ], "ir"),
  g("igh", "vowel", [
    { ipa: "aɪ", phoneme: "eye", words: ["high", "night", "light", "right", "bright", "fight"] },
  ], "ie"),
  g("ear", "vowel", [
    { ipa: "ɪə", phoneme: "eer", words: ["ear", "hear", "year", "near", "dear", "clear"] },
    { ipa: "ɜː", phoneme: "er", words: ["earth", "learn", "early", "heard", "search", "earn"] },
  ]),
  g("air", "vowel", [
    { ipa: "eə", phoneme: "air", words: ["air", "hair", "chair", "fair", "pair", "stairs"] },
  ], "ear"),
  g("ure", "vowel", [
    { ipa: "ʊə", phoneme: "oor", words: ["pure", "cure", "sure", "secure", "mature", "endure"] },
  ], "our"),
  g("ire", "vowel", [
    { ipa: "aɪə", phoneme: "ire", words: ["fire", "hire", "tired", "wire", "desire", "admire"] },
  ], "our"),
  g("our", "vowel", [
    { ipa: "aʊə", phoneme: "our", words: ["hour", "sour", "flour", "our", "devour", "hours"] },
  ], "ire"),
  g("ough", "vowel", [
    { ipa: "oʊ", phoneme: "oh-us", words: ["though", "dough", "although"] },
    { ipa: "uː", phoneme: "oo", words: ["through", "throughout"] },
  ]),
  g("eigh", "vowel", [
    { ipa: "eɪ", phoneme: "ay", words: ["eight", "weigh", "eighty", "eighteen", "weight", "neighbor"] },
  ], "igh"),
  g("augh", "vowel", [
    { ipa: "ɔː", phoneme: "aw", words: ["caught", "taught", "daughter", "naughty"] },
  ], "aw"),
  g("ower", "vowel", [
    { ipa: "aʊə", phoneme: "our", words: ["flower", "power", "tower", "shower"] },
  ], "our"),

  /* ── Consonant spellings ─────────────────────────────────────────────── */
  g("b", "consonant", [
    { ipa: "b", phoneme: "b", words: ["book", "ball", "job", "bed", "bag", "web"] },
  ], "d"),
  g("c", "consonant", [
    { ipa: "k", phoneme: "k", words: ["cat", "car", "cup", "cold", "coat", "cap"] },
    { ipa: "s", phoneme: "s", words: ["city", "ice", "race", "face", "mice", "cell"] },
  ]),
  g("d", "consonant", [
    { ipa: "d", phoneme: "d", words: ["day", "dog", "red", "desk", "door", "dad"] },
  ], "b"),
  g("f", "consonant", [
    { ipa: "f", phoneme: "f", words: ["fish", "fan", "leaf", "fun", "off", "gift"] },
  ], "ph"),
  g("g", "consonant", [
    { ipa: "g", phoneme: "g", words: ["go", "big", "bag", "game", "leg", "glad"] },
    { ipa: "dʒ", phoneme: "j", words: ["giant", "magic", "page", "gem", "cage", "energy"] },
  ]),
  g("h", "consonant", [
    { ipa: "h", phoneme: "h", words: ["hand", "hat", "home", "house", "help", "hot"] },
  ], "wh"),
  g("j", "consonant", [
    { ipa: "dʒ", phoneme: "j", words: ["jump", "jam", "just", "jet", "joke", "joy"] },
  ], "dge"),
  g("k", "consonant", [
    { ipa: "k", phoneme: "k", words: ["key", "kind", "book", "king", "kid", "milk"] },
  ], "c"),
  g("l", "consonant", [
    { ipa: "l", phoneme: "l", words: ["look", "lion", "ball", "leg", "lake", "line"] },
  ], "r"),
  g("m", "consonant", [
    { ipa: "m", phoneme: "m", words: ["moon", "map", "sum", "man", "make", "home"] },
  ], "n"),
  g("n", "consonant", [
    { ipa: "n", phoneme: "n", words: ["name", "nose", "ten", "nine", "night", "nice"] },
  ], "kn"),
  g("p", "consonant", [
    { ipa: "p", phoneme: "p", words: ["pen", "pig", "cap", "map", "top", "pan"] },
  ], "b"),
  g("r", "consonant", [
    { ipa: "r", phoneme: "r", words: ["run", "red", "rain", "rice", "rock", "room"] },
  ], "wr"),
  g("s", "consonant", [
    { ipa: "s", phoneme: "s", words: ["sun", "say", "bus", "six", "sea", "song"] },
    { ipa: "z", phoneme: "z", words: ["is", "his", "has", "was", "does", "dogs"] },
    { ipa: "ʒ", phoneme: "zh", words: ["pleasure", "usual", "television", "measure", "treasure", "vision"] },
  ]),
  g("t", "consonant", [
    { ipa: "t", phoneme: "t", words: ["ten", "town", "cat", "top", "take", "sit"] },
  ], "d"),
  g("v", "consonant", [
    { ipa: "v", phoneme: "v", words: ["van", "very", "love", "visit", "five", "seven"] },
  ], "f"),
  g("w", "consonant", [
    { ipa: "w", phoneme: "w", words: ["we", "water", "window", "win", "wall", "walk"] },
  ], "wh"),
  g("x", "consonant", [
    { ipa: "ks", words: ["fox", "box", "six", "fix", "mix", "taxi"] },
  ], "z"),
  g("y", "consonant", [
    { ipa: "j", phoneme: "y", words: ["yes", "you", "yellow", "year", "young", "yard"] },
    { ipa: "aɪ", phoneme: "eye", words: ["my", "fly", "sky", "why", "try", "cry"] },
    { ipa: "ɪ", phoneme: "ih", words: ["gym", "myth", "system", "symbol", "crystal", "mystery"] },
  ]),
  g("z", "consonant", [
    { ipa: "z", phoneme: "z", words: ["zoo", "zebra", "buzz", "zero", "zip", "size"] },
  ], "s"),
  g("sh", "consonant", [
    { ipa: "ʃ", phoneme: "sh", words: ["she", "shoe", "fish", "ship", "show", "wash"] },
  ], "ch"),
  g("ch", "consonant", [
    { ipa: "tʃ", phoneme: "ch", words: ["cheese", "chair", "much", "chicken", "lunch", "teach"] },
    { ipa: "k", phoneme: "k", words: ["school", "echo", "chemist", "stomach", "anchor", "character"] },
  ]),
  g("th", "consonant", [
    { ipa: "θ", phoneme: "th", words: ["think", "three", "mouth", "thin", "bath", "teeth"] },
    { ipa: "ð", phoneme: "dh", words: ["this", "that", "mother", "then", "father", "brother"] },
  ]),
  g("ph", "consonant", [
    { ipa: "f", phoneme: "f", words: ["phone", "photo", "graph", "phrase", "dolphin", "elephant"] },
  ], "f"),
  g("wh", "consonant", [
    { ipa: "w", phoneme: "w", words: ["what", "when", "white", "which", "why", "wheel"] },
  ], "w"),
  g("ng", "consonant", [
    { ipa: "ŋ", phoneme: "ng", words: ["sing", "ring", "long", "song", "king", "wing"] },
  ], "n"),
  g("ck", "consonant", [
    { ipa: "k", phoneme: "k", words: ["back", "clock", "duck", "black", "rock", "kick"] },
  ], "k"),
  g("kn", "consonant", [
    { ipa: "n", phoneme: "n", words: ["knee", "knife", "know", "knock", "knot", "knight"] },
  ], "n"),
  g("wr", "consonant", [
    { ipa: "r", phoneme: "r", words: ["write", "wrong", "wrist", "wrap", "wreck", "writer"] },
  ], "r"),
  g("qu", "consonant", [
    { ipa: "kw", words: ["queen", "quick", "quiz", "quiet", "quite", "question"] },
  ], "k"),
  g("tch", "consonant", [
    { ipa: "tʃ", phoneme: "ch", words: ["watch", "catch", "kitchen", "match", "witch", "stretch"] },
  ], "ch"),
  g("dge", "consonant", [
    { ipa: "dʒ", phoneme: "j", words: ["bridge", "edge", "badge", "judge", "fridge", "hedge"] },
  ], "j"),
];

export const GRAPHEME_BY_SLUG: Record<string, GraphemeInfo> =
  Object.fromEntries(GRAPHEMES.map((x) => [x.slug, x]));

export function graphemeAt(offset: number, from: GraphemeInfo): GraphemeInfo {
  const i = GRAPHEMES.findIndex((x) => x.slug === from.slug);
  return GRAPHEMES[(i + offset + GRAPHEMES.length) % GRAPHEMES.length];
}

/* ── The spelling direction: phoneme → its graphemes ──────────────────────
   Derived by inverting GRAPHEMES, one entry per phoneme (PHONEMES order).
   Twin phonemes (regional / allophone symbols with no graphemes of their
   own) borrow the spellings recorded for their partner. */

const TWIN: Record<string, string> = {
  "er-us": "er", // ɝː spelled like ɜː (er / ir / ur / ear)
  "oh-uk": "oh-us", // əʊ spelled like oʊ (o / oa / ow / ough)
  "schwa-r": "er", // ɚ — the r-colored spellings (mother, doctor)
  tt: "t", // t̬ (US flap) is written t / tt (water, better)
};

export interface SpellingEntry {
  grapheme: GraphemeInfo;
  words: string[];
}

export interface SpellingInfo {
  /** The sound itself — slug/symbol/region/type come from here. */
  phoneme: PhonemeInfo;
  /** Ways to write it, dataset order (most common spellings first). */
  spellings: SpellingEntry[];
}

export const SPELLINGS: SpellingInfo[] = PHONEMES.map((p) => ({
  phoneme: p,
  spellings: GRAPHEMES.flatMap((gr) =>
    gr.sounds
      // s.phoneme may be undefined (x, qu) — it must never match a missing
      // TWIN entry (undefined === undefined).
      .filter(
        (s) =>
          s.phoneme !== undefined &&
          (s.phoneme === p.slug || s.phoneme === TWIN[p.slug]),
      )
      .map((s) => ({ grapheme: gr, words: s.words })),
  ),
}));

export const SPELLING_BY_SLUG: Record<string, SpellingInfo> =
  Object.fromEntries(SPELLINGS.map((s) => [s.phoneme.slug, s]));

export function spellingAt(offset: number, from: SpellingInfo): SpellingInfo {
  const i = SPELLINGS.findIndex((s) => s.phoneme.slug === from.phoneme.slug);
  return SPELLINGS[(i + offset + SPELLINGS.length) % SPELLINGS.length];
}

/* ── Stage content builders (deterministic, hydration-safe) ───────────────
   Both tracks feed the same runner stages:
   - MEET  → MeetRow[]  (a tile per sound/spelling + highlightable words)
   - TYPE  → words[]    (typed in the gym)
   - HEAR  → words[]    (dictation: shortest words)
   - WHICH → ChoiceSpec (hear a word, pick the sound or the spelling)
   - SORT  → SortSpec   (sort words between two bins)                     */

export interface MeetRow {
  /** Tile text — "/iː/" for a sound, "ea" for a spelling. */
  tile: string;
  /** Optional cross-link (sound page ↔ spelling page). */
  href?: string;
  words: { word: string; spell: string }[];
}

export type ChoiceAsk = "sound" | "spell";

export interface ChoiceRound {
  speak: string;
  options: string[];
  correct: number;
}

export interface ChoiceSpec {
  ask: ChoiceAsk;
  rounds: ChoiceRound[];
}

export interface SortSpec {
  ask: ChoiceAsk;
  bins: [string, string];
  deck: { word: string; bin: 0 | 1 }[];
}

function dedupe(words: string[]): string[] {
  return [...new Set(words)];
}

/** Interleave two word lists into alternating rounds/deck entries. */
function interleave<T>(a: T[], b: T[]): [T, 0 | 1][] {
  const out: [T, 0 | 1][] = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== undefined) out.push([a[i], 0]);
    if (b[i] !== undefined) out.push([b[i], 1]);
  }
  return out;
}

/* — graphemes track — */

export function meetRowsForGrapheme(x: GraphemeInfo): MeetRow[] {
  return x.sounds.map((s) => ({
    tile: `/${s.ipa}/`,
    href: s.phoneme ? `/english/phonemes/${s.phoneme}` : undefined,
    words: s.words.map((word) => ({ word, spell: x.spelling })),
  }));
}

export function wordsForGrapheme(x: GraphemeInfo): string[] {
  return dedupe(x.sounds.flatMap((s) => s.words));
}

export function dictationWordsForGrapheme(x: GraphemeInfo): string[] {
  return [...wordsForGrapheme(x)]
    .sort((a, b) => a.length - b.length || a.localeCompare(b))
    .slice(0, 8);
}

/** The rival grapheme (same-sound or look-alike spelling), always defined. */
function rivalOf(x: GraphemeInfo): GraphemeInfo {
  return (x.rival && GRAPHEME_BY_SLUG[x.rival]) || graphemeAt(1, x);
}

export function choiceForGrapheme(x: GraphemeInfo): ChoiceSpec {
  if (x.sounds.length >= 2) {
    // Two sounds of its own: hear a word, pick which sound the spelling
    // makes in it ("ea": team → /iː/, head → /e/).
    const [s0, s1] = x.sounds;
    const options = [`/${s0.ipa}/`, `/${s1.ipa}/`];
    return {
      ask: "sound",
      rounds: interleave(s0.words, s1.words).map(([speak, correct]) => ({
        speak,
        options,
        correct,
      })),
    };
  }
  // One sound: hear a word, pick which spelling writes it (write → wr or r?).
  const rival = rivalOf(x);
  const options = [x.spelling, rival.spelling];
  return {
    ask: "spell",
    rounds: interleave(x.sounds[0].words, rival.sounds[0].words).map(
      ([speak, correct]) => ({ speak, options, correct }),
    ),
  };
}

export function sortForGrapheme(x: GraphemeInfo): SortSpec {
  if (x.sounds.length >= 2) {
    const [s0, s1] = x.sounds;
    return {
      ask: "sound",
      bins: [`/${s0.ipa}/`, `/${s1.ipa}/`],
      deck: interleave(s0.words, s1.words).map(([word, bin]) => ({
        word,
        bin,
      })),
    };
  }
  const rival = rivalOf(x);
  return {
    ask: "spell",
    bins: [x.spelling, rival.spelling],
    deck: interleave(x.sounds[0].words, rival.sounds[0].words).map(
      ([word, bin]) => ({ word, bin }),
    ),
  };
}

/* — spellings track — */

export function meetRowsForSpelling(s: SpellingInfo): MeetRow[] {
  return s.spellings.map((e) => ({
    tile: e.grapheme.spelling,
    href: `/english/graphemes/${e.grapheme.slug}`,
    words: e.words.map((word) => ({ word, spell: e.grapheme.spelling })),
  }));
}

export function wordsForSpelling(s: SpellingInfo): string[] {
  return dedupe(s.spellings.flatMap((e) => e.words)).slice(0, 20);
}

export function dictationWordsForSpelling(s: SpellingInfo): string[] {
  return [...wordsForSpelling(s)]
    .sort((a, b) => a.length - b.length || a.localeCompare(b))
    .slice(0, 8);
}

/** A contrast sound whose spellings can fill the second bin/option when a
 *  sound is written only one way. */
function contrastOf(s: SpellingInfo): SpellingInfo {
  const p = s.phoneme;
  const slug = p.rival ?? p.pairWith;
  if (slug && SPELLING_BY_SLUG[slug]) return SPELLING_BY_SLUG[slug];
  const other = SPELLINGS.find(
    (o) => o.phoneme.type === p.type && o.phoneme.slug !== p.slug,
  );
  return other ?? s;
}

export function choiceForSpelling(s: SpellingInfo): ChoiceSpec {
  if (s.spellings.length >= 2) {
    // Hear a word of this sound, pick which spelling it uses (rain → ai).
    const entries = s.spellings.slice(0, 3);
    const options = entries.map((e) => e.grapheme.spelling);
    const rounds: ChoiceRound[] = [];
    const max = Math.max(...entries.map((e) => e.words.length));
    for (let i = 0; i < max; i++) {
      entries.forEach((e, correct) => {
        const speak = e.words[i];
        if (speak !== undefined) rounds.push({ speak, options, correct });
      });
    }
    return { ask: "spell", rounds };
  }
  // One spelling: contrast with the rival sound's top spelling
  // (æ vs e: hear "bed" → written with e, not a).
  const own = s.spellings[0];
  const rival = contrastOf(s).spellings[0];
  const options = [own.grapheme.spelling, rival.grapheme.spelling];
  return {
    ask: "spell",
    rounds: interleave(own.words, rival.words).map(([speak, correct]) => ({
      speak,
      options,
      correct,
    })),
  };
}

export function sortForSpelling(s: SpellingInfo): SortSpec {
  if (s.spellings.length >= 2) {
    const [e0, e1] = s.spellings;
    return {
      ask: "spell",
      bins: [e0.grapheme.spelling, e1.grapheme.spelling],
      deck: interleave(e0.words, e1.words).map(([word, bin]) => ({
        word,
        bin,
      })),
    };
  }
  const own = s.spellings[0];
  const rival = contrastOf(s).spellings[0];
  return {
    ask: "spell",
    bins: [own.grapheme.spelling, rival.grapheme.spelling],
    deck: interleave(own.words, rival.words).map(([word, bin]) => ({
      word,
      bin,
    })),
  };
}

/* — writing-first additions (typed WHICH echo + MASTER slot rounds) — */

/** Short pools are typed TWICE (Duolingo-style repetition); long pools
 *  are already a workout on their own. */
export function typeDrillWords(words: string[]): string[] {
  return words.length >= 10 ? words : [...words, ...words];
}

/** A word with the element's spelling to mask ("t‸‸m" for ea in team) —
 *  MASTER's type-the-missing-letters rounds. Every word contains its
 *  spelling (dataset contract), the filter is belt-and-braces. */
export interface SlotRound {
  word: string;
  spelling: string;
}

export function slotRoundsForGrapheme(x: GraphemeInfo): SlotRound[] {
  return x.sounds
    .flatMap((s) => s.words.map((word) => ({ word, spelling: x.spelling })))
    .filter((r) => r.word.includes(r.spelling));
}

export function slotRoundsForSpelling(s: SpellingInfo): SlotRound[] {
  return s.spellings
    .flatMap((e) =>
      e.words.map((word) => ({ word, spelling: e.grapheme.spelling })),
    )
    .filter((r) => r.word.includes(r.spelling));
}
