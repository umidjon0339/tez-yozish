// Teaching layer over ALLOPHONES (lib/english/phonemes.ts): every allophone variant
// is classified into a phonetic PROCESS (aspiration, nasalization, flap, …)
// by reading the IPA diacritics in its symbol, and every process carries a
// kid-friendly localized name + hint. The SHADES learn stage and the MASTER
// test render these — so adding a new variant to ALLOPHONES automatically
// gets an explanation with zero extra wiring (unknown marks fall back to
// the generic "shifted" card).
//
// Detection notes:
// - Symbols are NFD-normalized first: "ĩ" (precomposed) and "ʌ̃" (combining)
//   both expose U+0303 that way.
// - Whole-symbol replacements (ʔ ɾ ɱ ç ɦ ʍ ɻ ɫ) and yod coalescence
//   (t→tʃ, d→dʒ, s→ʃ, z→ʒ) are checked before the diacritic scan.
// - The FIRST variant of a phoneme with no marks of its own is "plain".

import {
  ALLOPHONES,
  wordsForPhoneme,
  type Allophone,
  type PhonemeInfo,
} from "@/lib/english/phonemes";
import { SPELLING_BY_SLUG } from "@/lib/english/graphemes";
import type { LocalizedString } from "@/types/lesson";

export type AlloProcess =
  | "plain"
  | "aspirated"
  | "unreleased"
  | "ejective"
  | "devoiced"
  | "dental"
  | "nasalrelease"
  | "lateralrelease"
  | "rounded"
  | "palatal"
  | "dark"
  | "syllabic"
  | "nasalized"
  | "clipped"
  | "longer"
  | "centralized"
  | "fronted"
  | "backed"
  | "smoothed"
  | "coalesced"
  | "glottal"
  | "flap"
  | "labiodental"
  | "palatalfric"
  | "breathy"
  | "voicelessw"
  | "retroflex"
  | "darkl"
  | "shifted";

export interface AlloProcessInfo {
  /** Short label under the symbol tile ("with a puff of air"). */
  name: LocalizedString;
  /** One kid-friendly sentence: what the mouth does / when it happens. */
  hint: LocalizedString;
}

export const ALLO_PROCESS_INFO: Record<AlloProcess, AlloProcessInfo> = {
  plain: {
    name: { en: "the plain sound", uz: "oddiy tovush", ru: "обычный звук" },
    hint: {
      en: "The normal way to say it — nothing extra.",
      uz: "Oddiy aytilishi — hech narsa qo'shilmaydi.",
      ru: "Обычное произношение — ничего лишнего.",
    },
  },
  aspirated: {
    name: { en: "with a puff of air", uz: "havo pufi bilan", ru: "с выдохом" },
    hint: {
      en: "Hold your palm near your mouth — you will feel a little wind.",
      uz: "Kaftingni og'zingga yaqin tut — kichik shamolni sezasan.",
      ru: "Поднеси ладонь ко рту — почувствуешь лёгкий ветерок.",
    },
  },
  unreleased: {
    name: { en: "not let go", uz: "ochilmaydigan", ru: "без взрыва" },
    hint: {
      en: "At the end of a word the mouth closes for the sound and just stays closed — no pop.",
      uz: "So'z oxirida og'iz tovush uchun yopiladi va shunday qoladi — portlash yo'q.",
      ru: "В конце слова рот закрывается для звука и остаётся закрытым — без хлопка.",
    },
  },
  ejective: {
    name: { en: "an extra-hard pop", uz: "kuchli portlash", ru: "резкий хлопок" },
    hint: {
      en: "At the very end of a sentence it can pop out extra sharp — Stop!",
      uz: "Gap oxirida u juda keskin chiqishi mumkin — Stop!",
      ru: "В самом конце фразы он может выстрелить особенно резко — Stop!",
    },
  },
  devoiced: {
    name: { en: "whispered", uz: "shivirlangan", ru: "шёпотом" },
    hint: {
      en: "The throat buzz switches off and the sound turns into a whisper.",
      uz: "Tomoq titrashi o'chadi va tovush shivirlashga aylanadi.",
      ru: "Дрожь в горле выключается, и звук превращается в шёпот.",
    },
  },
  dental: {
    name: { en: "on the teeth", uz: "tishlarda", ru: "на зубах" },
    hint: {
      en: "The tongue touches the teeth, getting ready for a th next door.",
      uz: "Til tishlarga tegadi — yonidagi th tovushiga tayyorlanadi.",
      ru: "Язык касается зубов, готовясь к соседнему th.",
    },
  },
  nasalrelease: {
    name: { en: "opens into the nose", uz: "burunga ochiladi", ru: "выход в нос" },
    hint: {
      en: "The air escapes through the nose, straight into an n.",
      uz: "Havo burun orqali chiqadi — to'g'ridan-to'g'ri n tovushiga.",
      ru: "Воздух выходит через нос — прямо в звук n.",
    },
  },
  lateralrelease: {
    name: { en: "opens into an l", uz: "l tovushiga ochiladi", ru: "выход в l" },
    hint: {
      en: "The air escapes over the sides of the tongue, straight into an l.",
      uz: "Havo tilning yon tomonlaridan chiqadi — to'g'ridan-to'g'ri l tovushiga.",
      ru: "Воздух выходит по бокам языка — прямо в звук l.",
    },
  },
  rounded: {
    name: { en: "with round lips", uz: "dumaloq lablar bilan", ru: "с круглыми губами" },
    hint: {
      en: "The lips make a little circle because a w-like sound comes next.",
      uz: "Keyin w-ga o'xshash tovush kelgani uchun lablar doira yasaydi.",
      ru: "Губы складываются в кружок, потому что дальше идёт звук вроде w.",
    },
  },
  palatal: {
    name: { en: "with a y flavor", uz: "y tusi bilan", ru: "с оттенком y" },
    hint: {
      en: "The middle of the tongue rises toward a y right after the sound.",
      uz: "Tovushdan keyin tilning o'rtasi y tomon ko'tariladi.",
      ru: "Середина языка поднимается к y сразу после звука.",
    },
  },
  dark: {
    name: { en: "extra dark", uz: "juda quyuq", ru: "очень тёмный" },
    hint: {
      en: "The back of the tongue squeezes down — a deep, dark color.",
      uz: "Tilning orqa qismi pastga siqiladi — chuqur, quyuq rang.",
      ru: "Задняя часть языка сжимается — глубокий, тёмный оттенок.",
    },
  },
  syllabic: {
    name: { en: "its own beat", uz: "o'zi bir bo'g'in", ru: "сам себе слог" },
    hint: {
      en: "No vowel needed — this sound fills a whole syllable by itself.",
      uz: "Unli kerak emas — bu tovush bo'g'inni o'zi to'ldiradi.",
      ru: "Гласный не нужен — этот звук сам заполняет целый слог.",
    },
  },
  nasalized: {
    name: { en: "through the nose", uz: "burun orqali", ru: "через нос" },
    hint: {
      en: "A nose sound (m, n, ng) comes next, so some air already goes through the nose.",
      uz: "Keyin burun tovushi (m, n, ng) kelgani uchun havoning bir qismi burundan o'tadi.",
      ru: "Дальше идёт носовой звук (m, n, ng), поэтому часть воздуха уже идёт через нос.",
    },
  },
  clipped: {
    name: { en: "cut short", uz: "qisqartirilgan", ru: "укороченный" },
    hint: {
      en: "A quiet sound (p, t, k, s) comes next, so the vowel gets shorter.",
      uz: "Keyin jarangsiz tovush (p, t, k, s) kelgani uchun unli qisqaradi.",
      ru: "Дальше идёт глухой звук (p, t, k, s), поэтому гласный становится короче.",
    },
  },
  longer: {
    name: { en: "stretched", uz: "cho'zilgan", ru: "растянутый" },
    hint: {
      en: "Before a buzzing (voiced) sound the vowel lasts a little longer.",
      uz: "Jarangli tovush oldidan unli biroz uzunroq aytiladi.",
      ru: "Перед звонким звуком гласный звучит немного дольше.",
    },
  },
  centralized: {
    name: { en: "pulled to the middle", uz: "o'rtaga tortilgan", ru: "к центру" },
    hint: {
      en: "The tongue relaxes toward the middle of the mouth.",
      uz: "Til og'izning o'rtasiga qarab bo'shashadi.",
      ru: "Язык расслабляется к середине рта.",
    },
  },
  fronted: {
    name: { en: "pushed forward", uz: "oldinga surilgan", ru: "вперёд" },
    hint: {
      en: "The tongue slides a little forward in the mouth.",
      uz: "Til og'izda biroz oldinga siljiydi.",
      ru: "Язык немного сдвигается вперёд.",
    },
  },
  backed: {
    name: { en: "pulled back", uz: "orqaga tortilgan", ru: "назад" },
    hint: {
      en: "The tongue slides a little back in the mouth.",
      uz: "Til og'izda biroz orqaga siljiydi.",
      ru: "Язык немного сдвигается назад.",
    },
  },
  smoothed: {
    name: { en: "smoothed flat", uz: "silliqlangan", ru: "сглаженный" },
    hint: {
      en: "Fast speech irons the glide into one long, flat vowel.",
      uz: "Tez nutq sirpanishni bitta uzun, tekis unliga aylantiradi.",
      ru: "В быстрой речи скольжение выпрямляется в один долгий гласный.",
    },
  },
  coalesced: {
    name: { en: "melted with y", uz: "y bilan qo'shilgan", ru: "слился с y" },
    hint: {
      en: "Before a y (like in \"you\") the two sounds melt into one new sound.",
      uz: "y oldidan (\"you\" dagidek) ikki tovush qo'shilib yangi tovush hosil qiladi.",
      ru: "Перед y (как в \"you\") два звука сливаются в один новый звук.",
    },
  },
  glottal: {
    name: { en: "a throat stop", uz: "tomoq to'xtashi", ru: "гортанная смычка" },
    hint: {
      en: "The air stops in the throat instead of the tongue — very common in fast speech.",
      uz: "Havo til o'rniga tomoqda to'xtaydi — tez nutqda juda ko'p uchraydi.",
      ru: "Воздух останавливается в горле, а не на языке — очень часто в быстрой речи.",
    },
  },
  flap: {
    name: { en: "a quick tap", uz: "tez urish", ru: "быстрый удар" },
    hint: {
      en: "The tongue taps the ridge once, super fast — it sounds almost like a d.",
      uz: "Til tanglayga bir marta juda tez uriladi — deyarli d kabi eshitiladi.",
      ru: "Язык один раз очень быстро ударяет по нёбу — звучит почти как d.",
    },
  },
  labiodental: {
    name: { en: "lip on teeth", uz: "lab tishda", ru: "губа на зубах" },
    hint: {
      en: "The lip touches the teeth, getting ready for an f or v next door.",
      uz: "Lab tishlarga tegadi — yonidagi f yoki v tovushiga tayyorlanadi.",
      ru: "Губа касается зубов, готовясь к соседнему f или v.",
    },
  },
  palatalfric: {
    name: { en: "a hissy h", uz: "shitirlagan h", ru: "шипящий h" },
    hint: {
      en: "Before a y the h turns sharp and hissy, like an angry cat.",
      uz: "y oldidan h keskin va shitirlagan bo'ladi — jahli chiqqan mushukdek.",
      ru: "Перед y звук h становится резким и шипящим, как сердитый кот.",
    },
  },
  breathy: {
    name: { en: "a soft breathy h", uz: "yumshoq nafasli h", ru: "мягкий h с придыханием" },
    hint: {
      en: "Between vowels the h gets soft and full of breath.",
      uz: "Unlilar orasida h yumshoq va nafasga to'la bo'ladi.",
      ru: "Между гласными h становится мягким и полным дыхания.",
    },
  },
  voicelessw: {
    name: { en: "a whispered w", uz: "shivirlangan w", ru: "шёпотный w" },
    hint: {
      en: "Some speakers whisper the w in wh-words like which and white.",
      uz: "Ba'zi so'zlovchilar which va white kabi wh-so'zlarda w ni shivirlab aytadi.",
      ru: "Некоторые говорящие шепчут w в словах на wh, как which и white.",
    },
  },
  retroflex: {
    name: { en: "tongue curled back", uz: "til orqaga qayrilgan", ru: "язык загнут назад" },
    hint: {
      en: "The tongue tip curls back — the classic American r.",
      uz: "Til uchi orqaga qayriladi — klassik amerikacha r.",
      ru: "Кончик языка загибается назад — классический американский r.",
    },
  },
  darkl: {
    name: { en: "the dark l", uz: "quyuq l", ru: "тёмный l" },
    hint: {
      en: "At the end of words the l sounds deep and dark — the back of the tongue rises.",
      uz: "So'z oxirida l chuqur va quyuq eshitiladi — tilning orqasi ko'tariladi.",
      ru: "В конце слов l звучит глубоко и темно — задняя часть языка поднимается.",
    },
  },
  shifted: {
    name: { en: "a different shade", uz: "boshqa tus", ru: "другой оттенок" },
    hint: {
      en: "In this position the sound changes its shade a little.",
      uz: "Bu o'rinda tovush tusini biroz o'zgartiradi.",
      ru: "В этой позиции звук немного меняет свой оттенок.",
    },
  },
};

/* ── Symbol → process detection ─────────────────────────────────────────── */

// Whole-symbol replacements checked before the diacritic scan.
const WHOLE_SYMBOL: [test: (v: string) => boolean, p: AlloProcess][] = [
  [(v) => v === "ʔ", "glottal"],
  [(v) => v.startsWith("ɾ"), "flap"],
  [(v) => v === "ɱ", "labiodental"],
  [(v) => v === "ç", "palatalfric"],
  [(v) => v === "ɦ", "breathy"],
  [(v) => v === "ʍ", "voicelessw"],
  [(v) => v === "ɻ", "retroflex"],
  [(v) => v === "ɫ", "darkl"],
];

// base phoneme symbol → the sound it coalesces into before "you".
const COALESCED: Record<string, string> = {
  t: "tʃ",
  d: "dʒ",
  s: "ʃ",
  z: "ʒ",
};

// Combining marks / modifier letters, checked in NFD form. Order matters:
// the first hit wins, so release/phonation marks come before place shifts.
const MARKS: [mark: string, p: AlloProcess][] = [
  ["ʰ", "aspirated"],
  ["̚", "unreleased"], // ̚
  ["ʼ", "ejective"],
  ["̥", "devoiced"], // ̥
  ["̊", "devoiced"], // ̊
  ["̪", "dental"], // ̪
  ["ⁿ", "nasalrelease"],
  ["ˡ", "lateralrelease"],
  ["ʷ", "rounded"],
  ["ʲ", "palatal"],
  ["ˤ", "dark"],
  ["̩", "syllabic"], // ̩
  ["̍", "syllabic"], // ̍
  ["̃", "nasalized"], // ̃ (also matches precomposed ĩ ẽ õ ũ ã via NFD)
  ["ˑ", "clipped"],
  ["̈", "centralized"], // ̈
  ["̟", "fronted"], // ̟
  ["̠", "backed"], // ̠
];

/** Which phonetic process turns `base` into this variant. */
export function allophoneProcess(
  variant: string,
  base: string,
  index: number,
): AlloProcess {
  for (const [test, p] of WHOLE_SYMBOL) if (test(variant)) return p;
  if (COALESCED[base] === variant) return "coalesced";

  const v = variant.normalize("NFD");
  for (const [mark, p] of MARKS) if (v.includes(mark)) return p;

  // Vowel-quality changes with no combining marks. Length marks are
  // stripped from BOTH sides so a long vowel's identity variant (iː → iː)
  // never counts as smoothing.
  const strip = (s: string) => s.replace(/ː/g, "");
  if (variant.includes("ʉ")) return "fronted";
  if (strip(variant).length < strip(base).length) {
    return "smoothed"; // ɪə→ɪː, eə→ɛː, ʊə→ɔː, aɪə→aə, aʊə→aə
  }
  if (variant.includes("ː") && !base.includes("ː")) return "longer"; // æ→æː

  // First listed variant with no marks is the default realization.
  if (index === 0 || variant === base) return "plain"; // also r→ɹ, g→ɡ
  return "shifted"; // əʊ→ɒʊ, aɪ→ʌɪ, ə→ɐ, …
}

/* ── Stage helpers ──────────────────────────────────────────────────────── */

export interface AlloCard {
  symbol: string;
  /** Example word as displayed — may carry notes like "stop!" or "(US)". */
  word: string;
  /** The word cleaned to bare a–z (for comparisons), "" if none survives. */
  cleanWord: string;
  process: AlloProcess;
}

/** Every variant of one phoneme as renderable cards. Phonemes with a single
 *  entry mean "this sound (almost) never changes". Always non-empty. */
export function allophoneCards(p: PhonemeInfo): AlloCard[] {
  const variants: Allophone[] = ALLOPHONES[p.symbol] ?? [
    { symbol: p.symbol, word: p.examples[0].word },
  ];
  return variants.map((a, i) => ({
    symbol: a.symbol,
    word: a.word,
    cleanWord: (a.word.match(/[a-z]+(?:\s[a-z]+)*/)?.[0] ?? "").trim(),
    process: allophoneProcess(a.symbol, p.symbol, i),
  }));
}

/** Cards usable in quizzes/games: distinct speakable words, ≥2 variants. */
export function quizableAllophones(p: PhonemeInfo): AlloCard[] {
  const seen = new Set<string>();
  const out: AlloCard[] = [];
  for (const c of allophoneCards(p)) {
    if (!c.cleanWord || seen.has(c.cleanWord)) continue;
    seen.add(c.cleanWord);
    out.push(c);
  }
  return out.length >= 2 ? out : [];
}

/* ── Per-shade word drills (the SHADE lessons) ──────────────────────────
   Curated typing words for each allophone, aligned BY INDEX with
   ALLOPHONES[symbol]. Every phoneme listed here gets one SHADE lesson per
   variant instead of the single SHADES gallery — ALL 50 sounds are
   covered. Words are lowercase a–z (typed in the gym); connected-speech
   variants (yod coalescence, cross-word dentals) use short PHRASES —
   fine in the gym, but excluded from single-word pools/games.

   Each word genuinely carries its shade: the vowel processes are
   triggered by the following letter (clipped before p/t/k/s…, nasalized
   before m/n, longer before a voiced consonant — shadeTriggerIndex()
   highlights it); consonant shades sit in their defining position
   (aspirated word-initial, plain after s, unreleased word-final, …). */

// prettier-ignore
export const SHADE_WORDS: Record<string, string[][]> = {
  /* ── vowels ── */
  "iː": [
    ["see", "tree", "three", "free", "sea", "agree"],          // iː  plain
    ["seat", "feet", "sheep", "leak", "sleep", "sweet"],       // iˑ  clipped
    ["team", "green", "seen", "dream", "clean", "queen"],      // ĩː  nasalized
  ],
  "ɪ": [
    ["ship", "fish", "big", "sit", "six", "gift"],             // ɪ   plain
    ["win", "thin", "swim", "king", "pink", "begin"],          // ɪ̃   nasalized
  ],
  "ɑː": [
    ["car", "far", "star", "bar", "hard", "large"],            // ɑː  plain
    ["heart", "park", "start", "sharp", "dark", "mark"],       // ɑˑ  clipped
    ["calm", "barn", "farm", "palm", "arm", "harm"],           // ɑ̃ː  nasalized
  ],
  "æ": [
    ["cat", "hat", "sat", "black", "back", "snack"],           // æ   plain
    ["bad", "bag", "sad", "mad", "glad", "drag"],              // æː  longer
    ["man", "hand", "jam", "plan", "stand", "land"],           // æ̃   nasalized
  ],
  "ʌ": [
    ["cup", "bus", "cut", "luck", "duck", "must"],             // ʌ   plain
    ["sun", "fun", "run", "jump", "hunt", "month"],            // ʌ̃   nasalized
  ],
  "ɔː": [
    ["door", "floor", "law", "draw", "saw", "jaw"],            // ɔː  plain
    ["short", "sport", "fork", "north", "fort", "sort"],       // ɔˑ  clipped
    ["corn", "born", "storm", "horn", "worn", "torn"],         // ɔ̃ː  nasalized
  ],
  "ɒ": [
    ["hot", "sock", "box", "stop", "rock", "shop"],            // ɒ   plain
    ["gone", "long", "song", "wrong", "on", "pond"],           // ɒ̃   nasalized
  ],
  "uː": [
    ["blue", "true", "glue", "zoo", "food", "cool"],           // uː  plain
    ["new", "news", "tube", "tune", "duke", "cube"],           // ʉː  fronted
    ["boot", "loop", "soup", "root", "scoop", "shoot"],        // uˑ  clipped
    ["moon", "soon", "noon", "room", "spoon", "broom"],        // ũː  nasalized
  ],
  "ʊ": [
    ["book", "foot", "look", "took", "cook", "push"],          // ʊ   plain
    ["good", "wood", "stood", "hood", "shook", "brook"],       // ʊ̈   centralized
    ["woman"],                                                 // ʊ̃   nasalized (rare)
  ],
  "e": [
    ["bed", "ten", "red", "head", "bread", "desk"],            // e   plain
    ["pen", "men", "when", "send", "end", "friend"],           // ẽ   nasalized
  ],
  "ɜː": [
    ["bird", "girl", "her", "fur", "stir", "sir"],             // ɜː  plain
    ["hurt", "shirt", "first", "skirt", "dirt", "burst"],      // ɜˑ  clipped
    ["learn", "turn", "burn", "firm", "term", "earn"],         // ɜ̃ː  nasalized
  ],
  "ɝː": [
    ["bird", "girl", "her", "fur", "stir", "sir"],             // ɝː  plain
    ["hurt", "shirt", "first", "skirt", "dirt", "work"],       // ɝˑ  clipped
    ["learn", "turn", "burn", "firm", "term", "earn"],         // ɝ̃ː  nasalized
  ],
  "ə": [
    ["about", "ago", "away", "banana", "along", "asleep"],     // ə   plain
    ["lemon", "melon", "wagon", "dragon", "seven", "common"],  // ə̃   nasalized
    ["comma", "sofa", "extra", "pizza", "camera", "panda"],    // ɐ   word-final
  ],
  "ɚ": [
    ["teacher", "mother", "doctor", "color", "sister", "father"], // ɚ  plain
    ["modern", "pattern", "western", "lantern", "eastern", "govern"], // ɚ̃  nasalized
  ],
  "eɪ": [
    ["day", "play", "say", "late", "gate", "cake"],            // eɪ  plain
    ["name", "rain", "train", "game", "plane", "main"],        // ẽɪ  nasalized
  ],
  "aɪ": [
    ["my", "ride", "like", "sky", "fly", "tie"],               // aɪ  plain
    ["nine", "line", "mine", "shine", "fine", "climb"],        // ãɪ  nasalized
    ["write", "white", "bike", "nice", "price", "bright"],     // ʌɪ  before voiceless (US)
  ],
  "ɔɪ": [
    ["boy", "toy", "voice", "choice", "oil", "boil"],          // ɔɪ  plain
    ["coin", "join", "point", "joint"],                        // ɔ̃ɪ  nasalized
  ],
  "əʊ": [
    ["go", "nose", "boat", "road", "show", "grow"],            // əʊ  plain
    ["gold", "cold", "old", "told", "hold", "sold"],           // ɒʊ  before dark l
    ["phone", "home", "bone", "stone", "alone", "own"],        // ə̃ʊ  nasalized
  ],
  "oʊ": [
    ["go", "nose", "boat", "road", "show", "grow"],            // oʊ  plain
    ["phone", "home", "bone", "stone", "alone", "own"],        // õʊ  nasalized
  ],
  "aʊ": [
    ["now", "house", "mouth", "loud", "cloud", "shout"],       // aʊ  plain
    ["down", "town", "brown", "found", "round", "sound"],      // ãʊ  nasalized
  ],
  "ɪə": [
    ["ear", "here", "year", "near", "dear", "beer"],           // ɪə  plain
    ["clear", "hear", "appear", "cheer"],                      // ɪː  smoothed
  ],
  "eə": [
    ["hair", "bear", "care", "air", "chair", "pear"],          // eə  plain
    ["square", "spare", "share", "stare"],                     // ɛː  smoothed
  ],
  "ʊə": [
    ["pure", "tour", "cure", "secure", "endure", "mature"],    // ʊə  plain
    ["sure", "poor"],                                          // ɔː  smoothed
  ],
  "aɪə": [
    ["fire", "tired", "liar", "hire", "wire", "desire"],       // aɪə plain
    ["fire", "tired", "wire", "liar"],                         // aə  smoothed
  ],
  "aʊə": [
    ["hour", "flower", "power", "shower", "tower", "sour"],    // aʊə plain
    ["power", "flower", "shower", "hour", "flour", "our"],     // aə  smoothed
  ],
  /* ── consonants ── */
  "p": [
    ["pen", "pig", "pay", "pot", "pan", "push"],               // pʰ  aspirated (initial)
    ["spin", "spot", "speak", "sport", "spell", "spoon"],      // p   plain (after s)
    ["cup", "top", "map", "stop", "keep", "sleep"],            // p̚   unreleased (final)
    ["stop", "top", "help"],                                   // pʼ  ejective (emphatic)
  ],
  "b": [
    ["book", "ball", "big", "boy", "bed", "bag"],              // b   plain
    ["job", "web", "club", "verb", "rub"],                     // b̥   devoiced (final)
    ["cab", "grab", "crab", "lab"],                            // b̚   unreleased (final)
  ],
  "t": [
    ["ten", "town", "take", "tell", "top", "tea"],             // tʰ  aspirated (initial)
    ["stop", "star", "step", "stay", "stone", "still"],        // t   plain (after s)
    ["button", "cotton", "kitten", "written", "mountain"],     // ʔ   glottal
    ["twin", "twelve", "twenty", "twice", "twist"],            // tʷ  rounded
    ["tune", "tube", "student", "stew"],                       // tʲ  palatal (UK)
    ["got you", "meet you", "want you", "let you"],            // tʃ  coalesced
    ["eighth", "at the", "get there"],                         // t̪   dental
    ["cat", "hot", "sit", "not", "eat", "foot"],               // t̚   unreleased (final)
    ["wait", "right", "shout"],                                // tʼ  ejective (emphatic)
  ],
  "t̬": [
    ["water", "better", "letter", "city", "butter", "matter"], // ɾ   flap
    ["winter", "twenty", "plenty", "counter"],                 // ɾ̃   nasal flap
  ],
  "d": [
    ["day", "dog", "door", "desk", "dark", "deep"],            // d   plain
    ["sudden", "garden", "hidden", "wooden"],                  // dⁿ  nasal release
    ["middle", "needle", "noodle", "puddle", "candle", "saddle"], // dˡ  lateral release
    ["duke", "due", "during", "dew"],                          // dʲ  palatal (UK)
    ["did you", "would you", "could you", "need you"],         // dʒ  coalesced
    ["width", "read this", "good thing"],                      // d̪   dental
    ["bad", "red", "road", "food", "good", "side"],            // d̥   devoiced (final)
    ["ladder", "rider", "pedal", "medal"],                     // ɾ   flap (US)
  ],
  "k": [
    ["come", "car", "cap", "kind", "coat", "cake"],            // kʰ  aspirated (initial)
    ["sky", "skin", "skip", "scale", "scout", "school"],       // k   plain (after s)
    ["key", "keen", "king", "kiss", "kick", "kid"],            // k̟   fronted
    ["cool", "cold", "call", "card", "corn"],                  // k̠   backed
    ["queen", "quick", "quiet", "quite", "square", "question"], // kʷ  rounded
    ["cute", "cure", "cue", "queue"],                          // kʲ  palatal
    ["look", "book", "back", "neck", "milk", "black"],         // k̚   unreleased (final)
    ["back", "look", "quick"],                                 // kʼ  ejective (emphatic)
  ],
  "g": [
    ["go", "gate", "gas", "garden", "good", "gun"],            // ɡ   plain
    ["geese", "gift", "gear", "geek"],                         // ɡ̟   fronted
    ["goal", "goose", "goat", "gown"],                         // ɡ̠   backed
    ["penguin", "language", "linguist"],                       // ɡʷ  rounded
    ["argue", "regular", "figure"],                            // ɡʲ  palatal
    ["bag", "dog", "leg", "egg"],                              // ɡ̊   devoiced (final)
    ["big", "frog", "flag", "rug"],                            // ɡ̚   unreleased (final)
  ],
  "f": [
    ["fish", "fan", "fun", "leaf", "off", "safe", "face", "fast", "fifty", "coffee"], // f   plain
    ["fifth", "of them", "if this", "half there"],            // f̪   dental (before θ/ð)
    ["feel", "fee", "fit", "fill", "feet", "field"],          // f̟   fronted (before front vowels)
    ["fall", "four", "food", "foot", "fork", "full"],         // f̠   backed (before back vowels)
    ["soft", "left", "gift", "lift", "craft", "raft"],        // f̚   unreleased (before a consonant)
  ],
  "v": [
    ["very", "van", "visit", "vote", "voice", "value"],        // v   plain
    ["love", "five", "have", "live", "wave", "move"],          // v̥   devoiced (final)
  ],
  "θ": [
    ["think", "three", "thin", "mouth", "bath", "teeth", "north", "tooth", "thirty", "thunder"], // θ  plain
  ],
  "ð": [
    ["this", "that", "mother", "father", "weather", "together"], // ð  plain
    ["breathe", "smooth", "bathe", "clothe"],                  // ð̥   devoiced (final)
  ],
  "s": [
    ["say", "sun", "bus", "six", "sea", "song"],               // s   plain
    ["swim", "sweet", "swan", "swing", "switch"],              // sʷ  rounded
    ["assume", "consume", "pursue"],                           // sʲ  palatal (UK)
    ["miss you", "kiss you", "pass you"],                      // ʃ   coalesced
  ],
  "z": [
    ["zoo", "zebra", "zero", "zip", "zone", "lazy"],           // z   plain
    ["presume", "resume"],                                     // zʲ  palatal (UK)
    ["as you", "is your"],                                     // ʒ   coalesced
    ["buzz", "jazz", "quiz", "size", "nose"],                  // z̥   devoiced (final)
  ],
  "ʃ": [
    ["she", "ship", "show", "fish", "wash", "wish"],           // ʃ   plain
    ["shoe", "shoot", "shore", "should"],                      // ʃʷ  rounded
  ],
  "ʒ": [
    ["vision", "television", "usual", "pleasure", "measure", "treasure"], // ʒ  plain
    ["beige", "garage", "massage"],                            // ʒ̊   devoiced (final)
  ],
  "tʃ": [
    ["cheese", "chair", "watch", "teacher", "chicken", "lunch", "church", "march", "catch", "children"], // tʃ  plain
  ],
  "dʒ": [
    ["jump", "jam", "juice", "job", "joke", "magic"],          // dʒ  plain
    ["bridge", "age", "page", "large", "edge", "village"],     // dʒ̊  devoiced (final)
  ],
  "m": [
    ["moon", "map", "man", "make", "milk", "home"],            // m   plain
    ["comfort", "symphony", "emphasis", "triumph"],            // ɱ   before f/v
    ["rhythm", "prism"],                                       // m̩   syllabic
  ],
  "n": [
    ["name", "nose", "ten", "nine", "night", "nice"],          // n   plain
    ["button", "cotton", "kitten", "seven"],                   // n̩   syllabic
    ["new", "news", "menu", "avenue"],                         // nʲ  palatal (UK)
    ["tenth", "month", "ninth"],                               // n̪   dental
    ["infant", "invite", "envy"],                              // ɱ   before f/v
  ],
  "ŋ": [
    ["sing", "ring", "long", "song", "strong", "thing"],       // ŋ   plain
    ["bacon", "taken"],                                        // ŋ̍   syllabic
  ],
  "l": [
    ["look", "lion", "leg", "light", "lake", "line"],          // l   clear
    ["million", "billion", "brilliant"],                       // lʲ  palatal
    ["ball", "tall", "cool", "feel", "milk", "old"],           // ɫ   dark (final)
    ["full", "pool", "wall"],                                  // lˤ  dark (US)
    ["bottle", "little", "middle", "apple", "table", "people"], // l̩  syllabic
    ["please", "play", "clean", "clock", "slow"],              // l̥   devoiced (after p/k/s)
    ["health", "wealth", "although"],                          // l̪   dental
  ],
  "r": [
    ["run", "rain", "rice", "rock", "read", "room"],           // ɹ   plain
    ["red", "round", "rose", "wrong"],                         // ɹʷ  rounded
    ["tree", "try", "train", "press", "crab"],                 // ɹ̥   devoiced (after t/p/k)
    ["butter", "later", "paper"],                              // ɹ̩   syllabic (US)
    ["right", "hard", "car", "far"],                           // ɻ   retroflex (US)
  ],
  "w": [
    ["we", "water", "window", "wall", "wind", "walk"],         // w   plain
    ["twin", "quick", "queen", "sweet"],                       // w̥   devoiced (after t/k/s)
    ["which", "white", "when", "why", "where", "what"],        // ʍ   voiceless (some accents)
  ],
  "j": [
    ["yes", "yellow", "you", "year", "young", "yard"],         // j   plain
    ["cue", "cute", "few"],                                    // j̥   devoiced (after c/f)
  ],
  "h": [
    ["hand", "hat", "home", "house", "hot", "help"],           // h   plain
    ["huge", "human", "humor", "hue"],                         // ç   before y-sound
    ["ahead", "behind", "perhaps"],                            // ɦ   between vowels
  ],
};

export interface ShadeInfo extends AlloCard {
  /** Typing-drill words carrying this shade. */
  words: string[];
}

/** The per-shade lesson list for a phoneme, or null when the sound is
 *  not in the SHADE_WORDS pilot yet. */
export function shadesFor(p: PhonemeInfo): ShadeInfo[] | null {
  const wordSets = SHADE_WORDS[p.symbol];
  if (!wordSets) return null;
  const cards = allophoneCards(p);
  return wordSets.map((words, i) => ({
    ...(cards[i] ?? {
      symbol: p.symbol,
      word: words[0],
      cleanWord: words[0],
      process: "plain" as AlloProcess,
    }),
    words,
  }));
}

/* ── Expanded word pools (long writing drills) ──────────────────────────
   The practice/game stages pull from the phoneme's own words PLUS every
   single-word shade drill word — the more a student types, the better the
   sound sticks. Phrases ("got you") are excluded: pools feed games and
   dictation whose input is a–z only. */

/** Long deduped typing pool for TYPE / RAIN / NINJA. */
export function typingWordsForPhoneme(p: PhonemeInfo, cap = 24): string[] {
  const out: string[] = [];
  const push = (w: string) => {
    if (!w.includes(" ") && !out.includes(w)) out.push(w);
  };
  for (const w of wordsForPhoneme(p)) push(w);
  for (const set of SHADE_WORDS[p.symbol] ?? []) for (const w of set) push(w);
  return out.slice(0, cap);
}

/** Dictation words for HEAR: the shortest of the big pool (easiest to
 *  type unseen), more of them than before. */
export function hearWordsForPhoneme(p: PhonemeInfo, count = 8): string[] {
  return [...typingWordsForPhoneme(p)]
    .sort((a, b) => a.length - b.length || a.localeCompare(b))
    .slice(0, count);
}

/* ── Word-highlight helpers for the SHADE intro ─────────────────────── */

/** Where the phoneme's spelling sits inside `word` — longest known
 *  grapheme first (SPELLING_BY_SLUG + the example spells). */
export function findSpelling(
  word: string,
  p: PhonemeInfo,
): { start: number; length: number } | null {
  const candidates = new Set<string>(p.examples.map((e) => e.spell));
  for (const e of SPELLING_BY_SLUG[p.slug]?.spellings ?? []) {
    candidates.add(e.grapheme.spelling);
  }
  for (const spell of [...candidates].sort((a, b) => b.length - a.length)) {
    const start = word.indexOf(spell);
    if (start >= 0) return { start, length: spell.length };
  }
  return null;
}

const TRIGGER_LETTERS: Partial<Record<AlloProcess, string>> = {
  clipped: "ptkscfh", // a following voiceless sound shortens the vowel
  nasalized: "mn", // a following nasal (m, n, ng) opens the nose
  longer: "bdgvzjmnlrw", // a following voiced sound stretches the vowel
};

/** Index of the letter that CAUSES the shade (first matching letter after
 *  the spelling), or -1 when the process has no trigger to point at. */
export function shadeTriggerIndex(
  word: string,
  spellEnd: number,
  process: AlloProcess,
): number {
  const letters = TRIGGER_LETTERS[process];
  if (!letters) return -1;
  for (let i = spellEnd; i < word.length; i++) {
    if (letters.includes(word[i])) return i;
  }
  return -1;
}
