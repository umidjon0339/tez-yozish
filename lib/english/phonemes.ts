// Static reference data for the 50 English phonemes (Cambridge dictionary
// symbol set), used by /english/phonemes — the phoneme analogue of
// lib/english/letters.ts. Every example / pair word is lowercase a–z only: the words
// are typed in the gym stages and fed to the keyboard highlight layer.
//
// `spell` is the substring of `word` that writes the sound ("ee" in "sheep");
// the MEET stage highlights its first occurrence. `rival` is the phoneme this
// one is classically confused with (minimal pairs), and `pairs` are
// [this-sound word, rival-sound word] rows for the listening test and the
// sound-sort game. /h/ has no rival phoneme — its pairs contrast the word
// with and without the sound (hear/ear) and `rival` stays undefined.

export type PhonemeType = "vowel" | "consonant";
export type PhonemeRegion = "both" | "uk" | "us";

export interface PhonemeInfo {
  symbol: string; // IPA symbol, e.g. "iː"
  slug: string; // URL id, e.g. "ee" (/english/phonemes/ee)
  type: PhonemeType;
  diphthong?: boolean; // double vowels (eɪ, aɪ, …)
  triphthong?: boolean; // triple vowels (aɪə, aʊə) — also marked diphthong
  region: PhonemeRegion; // both = UK + US, or UK / US only
  voiced?: boolean; // consonants: vocal cords on/off
  pairWith?: string; // slug of the voiced/voiceless partner (p↔b)
  examples: { word: string; spell: string }[];
  rival?: string; // slug of the phoneme it's mixed up with
  pairs: [string, string][]; // [own-sound word, rival word]
}

// prettier-ignore
export const PHONEMES: PhonemeInfo[] = [
  /* ── Vowels ─────────────────────────────────────────────────────────── */
  {
    symbol: "iː", slug: "ee", type: "vowel", region: "both",
    examples: [
      { word: "sheep", spell: "ee" },
      { word: "tree", spell: "ee" },
      { word: "team", spell: "ea" },
    ],
    rival: "ih",
    pairs: [["sheep", "ship"], ["feet", "fit"], ["seat", "sit"], ["heel", "hill"], ["leak", "lick"], ["green", "grin"]],
  },
  {
    symbol: "ɪ", slug: "ih", type: "vowel", region: "both",
    examples: [
      { word: "ship", spell: "i" },
      { word: "fish", spell: "i" },
      { word: "gym", spell: "y" },
    ],
    rival: "ee",
    pairs: [["ship", "sheep"], ["bit", "beat"], ["hill", "heel"], ["sit", "seat"], ["chip", "cheap"], ["live", "leave"]],
  },
  {
    symbol: "ɑː", slug: "ar", type: "vowel", region: "both",
    examples: [
      { word: "father", spell: "a" },
      { word: "car", spell: "ar" },
      { word: "start", spell: "ar" },
    ],
    rival: "uh",
    pairs: [["heart", "hut"], ["calm", "come"], ["barn", "bun"], ["cart", "cut"]],
  },
  {
    symbol: "æ", slug: "a", type: "vowel", region: "both",
    examples: [
      { word: "hat", spell: "a" },
      { word: "cat", spell: "a" },
      { word: "apple", spell: "a" },
    ],
    rival: "e",
    pairs: [["bad", "bed"], ["pan", "pen"], ["sat", "set"], ["man", "men"], ["had", "head"]],
  },
  {
    symbol: "ʌ", slug: "uh", type: "vowel", region: "both",
    examples: [
      { word: "cup", spell: "u" },
      { word: "sun", spell: "u" },
      { word: "love", spell: "o" },
    ],
    rival: "a",
    pairs: [["cup", "cap"], ["cut", "cat"], ["luck", "lack"], ["fun", "fan"], ["hut", "hat"]],
  },
  {
    symbol: "ɔː", slug: "aw", type: "vowel", region: "both",
    examples: [
      { word: "horse", spell: "or" },
      { word: "door", spell: "oor" },
      { word: "law", spell: "aw" },
    ],
    rival: "o",
    pairs: [["caught", "cot"], ["port", "pot"], ["sport", "spot"], ["stalk", "stock"]],
  },
  {
    symbol: "ɒ", slug: "o", type: "vowel", region: "uk",
    examples: [
      { word: "sock", spell: "o" },
      { word: "hot", spell: "o" },
      { word: "box", spell: "o" },
    ],
    rival: "aw",
    pairs: [["cot", "caught"], ["pot", "port"], ["spot", "sport"], ["stock", "stalk"]],
  },
  {
    symbol: "uː", slug: "oo", type: "vowel", region: "both",
    examples: [
      { word: "blue", spell: "ue" },
      { word: "moon", spell: "oo" },
      { word: "food", spell: "oo" },
    ],
    rival: "u",
    pairs: [["pool", "pull"], ["fool", "full"], ["suit", "soot"], ["food", "foot"]],
  },
  {
    symbol: "ʊ", slug: "u", type: "vowel", region: "both",
    examples: [
      { word: "foot", spell: "oo" },
      { word: "book", spell: "oo" },
      { word: "push", spell: "u" },
    ],
    rival: "oo",
    pairs: [["pull", "pool"], ["full", "fool"], ["soot", "suit"], ["foot", "food"]],
  },
  {
    symbol: "e", slug: "e", type: "vowel", region: "both",
    examples: [
      { word: "head", spell: "ea" },
      { word: "bed", spell: "e" },
      { word: "ten", spell: "e" },
    ],
    rival: "ih",
    pairs: [["pen", "pin"], ["ten", "tin"], ["bet", "bit"], ["desk", "disk"]],
  },
  {
    symbol: "ɜː", slug: "er", type: "vowel", region: "uk",
    examples: [
      { word: "bird", spell: "ir" },
      { word: "girl", spell: "ir" },
      { word: "nurse", spell: "ur" },
    ],
    rival: "ar",
    pairs: [["firm", "farm"], ["burn", "barn"], ["hurt", "heart"], ["fur", "far"]],
  },
  {
    symbol: "ɝː", slug: "er-us", type: "vowel", region: "us",
    examples: [
      { word: "bird", spell: "ir" },
      { word: "hurt", spell: "ur" },
      { word: "work", spell: "or" },
    ],
    rival: "ar",
    pairs: [["firm", "farm"], ["burn", "barn"], ["hurt", "heart"], ["fur", "far"]],
  },
  {
    symbol: "ə", slug: "schwa", type: "vowel", region: "both",
    examples: [
      { word: "above", spell: "a" },
      { word: "banana", spell: "a" },
      { word: "teacher", spell: "er" },
    ],
    rival: "e",
    pairs: [["ago", "ego"], ["affect", "effect"], ["accept", "except"], ["allusion", "illusion"]],
  },
  {
    symbol: "ɚ", slug: "schwa-r", type: "vowel", region: "us",
    examples: [
      { word: "mother", spell: "er" },
      { word: "doctor", spell: "or" },
      { word: "color", spell: "or" },
    ],
    rival: "schwa",
    pairs: [["better", "beta"], ["manner", "manna"], ["pander", "panda"], ["tuner", "tuna"]],
  },
  {
    symbol: "eɪ", slug: "ay", type: "vowel", diphthong: true, region: "both",
    examples: [
      { word: "day", spell: "ay" },
      { word: "name", spell: "a" },
      { word: "rain", spell: "ai" },
    ],
    rival: "e",
    pairs: [["pain", "pen"], ["late", "let"], ["taste", "test"], ["gate", "get"], ["paper", "pepper"]],
  },
  {
    symbol: "aɪ", slug: "eye", type: "vowel", diphthong: true, region: "both",
    examples: [
      { word: "eye", spell: "eye" },
      { word: "time", spell: "i" },
      { word: "my", spell: "y" },
    ],
    rival: "ay",
    pairs: [["like", "lake"], ["buy", "bay"], ["my", "may"], ["time", "tame"]],
  },
  {
    symbol: "ɔɪ", slug: "oy", type: "vowel", diphthong: true, region: "both",
    examples: [
      { word: "boy", spell: "oy" },
      { word: "coin", spell: "oi" },
      { word: "toy", spell: "oy" },
    ],
    rival: "eye",
    pairs: [["boy", "buy"], ["toy", "tie"], ["voice", "vice"], ["foil", "file"]],
  },
  {
    symbol: "əʊ", slug: "oh-uk", type: "vowel", diphthong: true, region: "uk",
    examples: [
      { word: "nose", spell: "o" },
      { word: "go", spell: "o" },
      { word: "boat", spell: "oa" },
    ],
    rival: "aw",
    pairs: [["coat", "caught"], ["so", "saw"], ["boat", "bought"], ["cold", "called"], ["woke", "walk"]],
  },
  {
    symbol: "oʊ", slug: "oh-us", type: "vowel", diphthong: true, region: "us",
    examples: [
      { word: "nose", spell: "o" },
      { word: "go", spell: "o" },
      { word: "boat", spell: "oa" },
    ],
    rival: "aw",
    pairs: [["coat", "caught"], ["so", "saw"], ["boat", "bought"], ["cold", "called"], ["woke", "walk"]],
  },
  {
    symbol: "aʊ", slug: "ow", type: "vowel", diphthong: true, region: "both",
    examples: [
      { word: "mouth", spell: "ou" },
      { word: "now", spell: "ow" },
      { word: "house", spell: "ou" },
    ],
    rival: "oh-uk",
    pairs: [["now", "know"], ["loud", "load"], ["town", "tone"], ["found", "phoned"], ["house", "hose"]],
  },
  {
    symbol: "ɪə", slug: "eer", type: "vowel", diphthong: true, region: "uk",
    examples: [
      { word: "ear", spell: "ear" },
      { word: "here", spell: "ere" },
      { word: "beer", spell: "eer" },
    ],
    rival: "air",
    pairs: [["ear", "air"], ["here", "hair"], ["beer", "bear"], ["cheer", "chair"]],
  },
  {
    symbol: "eə", slug: "air", type: "vowel", diphthong: true, region: "uk",
    examples: [
      { word: "hair", spell: "air" },
      { word: "bear", spell: "ear" },
      { word: "care", spell: "are" },
    ],
    rival: "eer",
    pairs: [["air", "ear"], ["hair", "here"], ["bear", "beer"], ["chair", "cheer"]],
  },
  {
    symbol: "ʊə", slug: "oor", type: "vowel", diphthong: true, region: "uk",
    examples: [
      { word: "pure", spell: "ure" },
      { word: "tour", spell: "our" },
      { word: "cure", spell: "ure" },
    ],
    rival: "aw",
    pairs: [["tour", "tore"], ["sure", "shore"], ["poor", "pour"], ["cure", "core"]],
  },
  {
    symbol: "aɪə", slug: "ire", type: "vowel", diphthong: true, triphthong: true, region: "uk",
    examples: [
      { word: "fire", spell: "ire" },
      { word: "tired", spell: "ire" },
      { word: "liar", spell: "iar" },
    ],
    rival: "our",
    pairs: [["tire", "tower"], ["hire", "hour"], ["shire", "shower"], ["fire", "flower"]],
  },
  {
    symbol: "aʊə", slug: "our", type: "vowel", diphthong: true, triphthong: true, region: "uk",
    examples: [
      { word: "hour", spell: "our" },
      { word: "flower", spell: "ower" },
      { word: "power", spell: "ower" },
    ],
    rival: "ire",
    pairs: [["tower", "tire"], ["hour", "hire"], ["shower", "shire"], ["flower", "fire"]],
  },

  /* ── Consonants ─────────────────────────────────────────────────────── */
  {
    symbol: "p", slug: "p", type: "consonant", region: "both",
    voiced: false, pairWith: "b",
    examples: [
      { word: "pen", spell: "p" },
      { word: "pig", spell: "p" },
      { word: "cap", spell: "p" },
    ],
    rival: "b",
    pairs: [["pin", "bin"], ["pig", "big"], ["pat", "bat"], ["cap", "cab"], ["pack", "back"]],
  },
  {
    symbol: "b", slug: "b", type: "consonant", region: "both",
    voiced: true, pairWith: "p",
    examples: [
      { word: "book", spell: "b" },
      { word: "ball", spell: "b" },
      { word: "job", spell: "b" },
    ],
    rival: "p",
    pairs: [["bin", "pin"], ["big", "pig"], ["bat", "pat"], ["cab", "cap"], ["back", "pack"]],
  },
  {
    symbol: "t", slug: "t", type: "consonant", region: "both",
    voiced: false, pairWith: "d",
    examples: [
      { word: "town", spell: "t" },
      { word: "ten", spell: "t" },
      { word: "cat", spell: "t" },
    ],
    rival: "d",
    pairs: [["town", "down"], ["ten", "den"], ["two", "do"], ["coat", "code"], ["write", "ride"]],
  },
  {
    symbol: "t̬", slug: "tt", type: "consonant", region: "us",
    voiced: true, pairWith: "t",
    examples: [
      { word: "cutting", spell: "tt" },
      { word: "water", spell: "t" },
      { word: "better", spell: "tt" },
    ],
    rival: "d",
    pairs: [["latter", "ladder"], ["writer", "rider"], ["metal", "medal"], ["petal", "pedal"]],
  },
  {
    symbol: "d", slug: "d", type: "consonant", region: "both",
    voiced: true, pairWith: "t",
    examples: [
      { word: "day", spell: "d" },
      { word: "dog", spell: "d" },
      { word: "red", spell: "d" },
    ],
    rival: "t",
    pairs: [["down", "town"], ["den", "ten"], ["do", "two"], ["code", "coat"], ["ride", "write"]],
  },
  {
    symbol: "k", slug: "k", type: "consonant", region: "both",
    voiced: false, pairWith: "g",
    examples: [
      { word: "cat", spell: "c" },
      { word: "key", spell: "k" },
      { word: "back", spell: "ck" },
    ],
    rival: "g",
    pairs: [["coat", "goat"], ["came", "game"], ["back", "bag"], ["class", "glass"], ["curl", "girl"]],
  },
  {
    symbol: "g", slug: "g", type: "consonant", region: "both",
    voiced: true, pairWith: "k",
    examples: [
      { word: "give", spell: "g" },
      { word: "go", spell: "g" },
      { word: "bag", spell: "g" },
    ],
    rival: "k",
    pairs: [["goat", "coat"], ["game", "came"], ["bag", "back"], ["glass", "class"], ["girl", "curl"]],
  },
  {
    symbol: "f", slug: "f", type: "consonant", region: "both",
    voiced: false, pairWith: "v",
    examples: [
      { word: "fish", spell: "f" },
      { word: "fan", spell: "f" },
      { word: "leaf", spell: "f" },
    ],
    rival: "v",
    pairs: [["fan", "van"], ["fine", "vine"], ["leaf", "leave"], ["safe", "save"], ["few", "view"]],
  },
  {
    symbol: "v", slug: "v", type: "consonant", region: "both",
    voiced: true, pairWith: "f",
    examples: [
      { word: "very", spell: "v" },
      { word: "van", spell: "v" },
      { word: "love", spell: "v" },
    ],
    rival: "w",
    pairs: [["vet", "wet"], ["vine", "wine"], ["verse", "worse"], ["vest", "west"]],
  },
  {
    symbol: "θ", slug: "th", type: "consonant", region: "both",
    voiced: false, pairWith: "dh",
    examples: [
      { word: "think", spell: "th" },
      { word: "three", spell: "th" },
      { word: "mouth", spell: "th" },
    ],
    rival: "s",
    pairs: [["think", "sink"], ["thing", "sing"], ["mouth", "mouse"], ["path", "pass"], ["thick", "sick"]],
  },
  {
    symbol: "ð", slug: "dh", type: "consonant", region: "both",
    voiced: true, pairWith: "th",
    examples: [
      { word: "this", spell: "th" },
      { word: "mother", spell: "th" },
      { word: "breathe", spell: "th" },
    ],
    rival: "d",
    pairs: [["they", "day"], ["there", "dare"], ["though", "dough"], ["then", "den"]],
  },
  {
    symbol: "s", slug: "s", type: "consonant", region: "both",
    voiced: false, pairWith: "z",
    examples: [
      { word: "say", spell: "s" },
      { word: "sun", spell: "s" },
      { word: "bus", spell: "s" },
    ],
    rival: "sh",
    pairs: [["sea", "she"], ["sip", "ship"], ["so", "show"], ["sign", "shine"], ["save", "shave"]],
  },
  {
    symbol: "z", slug: "z", type: "consonant", region: "both",
    voiced: true, pairWith: "s",
    examples: [
      { word: "zoo", spell: "z" },
      { word: "zebra", spell: "z" },
      { word: "buzz", spell: "zz" },
    ],
    rival: "s",
    pairs: [["zip", "sip"], ["buzz", "bus"], ["prize", "price"], ["rise", "rice"], ["zoo", "sue"]],
  },
  {
    symbol: "ʃ", slug: "sh", type: "consonant", region: "both",
    voiced: false, pairWith: "zh",
    examples: [
      { word: "she", spell: "sh" },
      { word: "shoe", spell: "sh" },
      { word: "fish", spell: "sh" },
    ],
    rival: "ch",
    pairs: [["ship", "chip"], ["sheep", "cheap"], ["wash", "watch"], ["share", "chair"], ["shoes", "choose"]],
  },
  {
    symbol: "ʒ", slug: "zh", type: "consonant", region: "both",
    voiced: true, pairWith: "sh",
    examples: [
      { word: "vision", spell: "si" },
      { word: "pleasure", spell: "s" },
      { word: "television", spell: "si" },
    ],
    rival: "sh",
    pairs: [["pleasure", "pressure"], ["glazier", "glacier"], ["vision", "mission"]],
  },
  {
    symbol: "tʃ", slug: "ch", type: "consonant", region: "both",
    voiced: false, pairWith: "j",
    examples: [
      { word: "cheese", spell: "ch" },
      { word: "chair", spell: "ch" },
      { word: "watch", spell: "tch" },
    ],
    rival: "sh",
    pairs: [["chip", "ship"], ["cheap", "sheep"], ["watch", "wash"], ["chair", "share"], ["choose", "shoes"]],
  },
  {
    symbol: "dʒ", slug: "j", type: "consonant", region: "both",
    voiced: true, pairWith: "ch",
    examples: [
      { word: "jump", spell: "j" },
      { word: "jam", spell: "j" },
      { word: "bridge", spell: "dge" },
    ],
    rival: "ch",
    pairs: [["joke", "choke"], ["jeep", "cheap"], ["gin", "chin"], ["edge", "etch"], ["jeer", "cheer"]],
  },
  {
    symbol: "m", slug: "m", type: "consonant", region: "both",
    voiced: true,
    examples: [
      { word: "moon", spell: "m" },
      { word: "map", spell: "m" },
      { word: "sum", spell: "m" },
    ],
    rival: "n",
    pairs: [["mine", "nine"], ["map", "nap"], ["sum", "sun"], ["mail", "nail"], ["mice", "nice"]],
  },
  {
    symbol: "n", slug: "n", type: "consonant", region: "both",
    voiced: true,
    examples: [
      { word: "name", spell: "n" },
      { word: "nose", spell: "n" },
      { word: "ten", spell: "n" },
    ],
    rival: "m",
    pairs: [["nine", "mine"], ["nap", "map"], ["sun", "sum"], ["nail", "mail"], ["nice", "mice"]],
  },
  {
    symbol: "ŋ", slug: "ng", type: "consonant", region: "both",
    voiced: true,
    examples: [
      { word: "sing", spell: "ng" },
      { word: "ring", spell: "ng" },
      { word: "long", spell: "ng" },
    ],
    rival: "n",
    pairs: [["sing", "sin"], ["thing", "thin"], ["wing", "win"], ["bang", "ban"], ["rang", "ran"]],
  },
  {
    symbol: "l", slug: "l", type: "consonant", region: "both",
    voiced: true,
    examples: [
      { word: "look", spell: "l" },
      { word: "lion", spell: "l" },
      { word: "ball", spell: "ll" },
    ],
    rival: "r",
    pairs: [["light", "right"], ["lock", "rock"], ["late", "rate"], ["fly", "fry"], ["glass", "grass"]],
  },
  {
    symbol: "r", slug: "r", type: "consonant", region: "both",
    voiced: true,
    examples: [
      { word: "run", spell: "r" },
      { word: "red", spell: "r" },
      { word: "rain", spell: "r" },
    ],
    rival: "l",
    pairs: [["right", "light"], ["rock", "lock"], ["rate", "late"], ["fry", "fly"], ["grass", "glass"]],
  },
  {
    symbol: "w", slug: "w", type: "consonant", region: "both",
    voiced: true,
    examples: [
      { word: "we", spell: "w" },
      { word: "water", spell: "w" },
      { word: "window", spell: "w" },
    ],
    rival: "v",
    pairs: [["wet", "vet"], ["wine", "vine"], ["west", "vest"], ["worse", "verse"]],
  },
  {
    symbol: "j", slug: "y", type: "consonant", region: "both",
    voiced: true,
    examples: [
      { word: "yes", spell: "y" },
      { word: "yellow", spell: "y" },
      { word: "you", spell: "y" },
    ],
    rival: "j",
    pairs: [["yet", "jet"], ["year", "jeer"], ["yoke", "joke"], ["use", "juice"], ["yam", "jam"]],
  },
  {
    symbol: "h", slug: "h", type: "consonant", region: "both",
    voiced: false,
    examples: [
      { word: "hand", spell: "h" },
      { word: "hat", spell: "h" },
      { word: "home", spell: "h" },
    ],
    // No rival phoneme: the pairs contrast the word with and without /h/.
    pairs: [["hear", "ear"], ["hair", "air"], ["hold", "old"], ["heat", "eat"], ["hand", "and"]],
  },
];

export const PHONEME_BY_SLUG: Record<string, PhonemeInfo> = Object.fromEntries(
  PHONEMES.map((p) => [p.slug, p]),
);

/* ── Allophones ───────────────────────────────────────────────────────────
   How each phoneme is really said in different positions, keyed by IPA
   symbol (matches PHONEMES[].symbol). The first entry is the default
   realization; `word` is an example word carrying that variant (display
   only — these words are never typed, so regional notes like "(US)" are
   allowed). Symbols are IPA notation and stay untranslated.

   Vowels follow the standard textbook processes: ˑ = pre-fortis clipping
   (shortened before p t k s …), ˜ = nasalized before m n ŋ, ̟ / ̈ =
   fronted / centralized, ː added = lengthening; UK centring diphthongs
   also list their modern smoothed monophthong. Consonants cover the
   standard IPA diacritic families: aspiration (ʰ), release types (̚ no
   release, ⁿ nasal, ˡ lateral), airstream (ʼ ejective, utterance-final
   emphatic stops), phonation (̥ / ̊ devoiced), articulation (̪ dental,
   ̟ / ̠ fronted / backed), secondary articulation (ʷ labialized,
   ʲ palatalized — UK yod clusters, ˤ pharyngealized; velarized lˠ is
   written with its dedicated letter ɫ), yod coalescence in connected
   speech (t d s z + you → tʃ dʒ ʃ ʒ), syllabic (̩ / ̍) forms, and
   glottal/flap/retroflex variants. */

export interface Allophone {
  symbol: string; // IPA, e.g. "tʰ"
  word: string; // example word showing this variant
}

// prettier-ignore
export const ALLOPHONES: Record<string, Allophone[]> = {
  /* vowels */
  "iː": [{ symbol: "iː", word: "see" }, { symbol: "iˑ", word: "seat" }, { symbol: "ĩː", word: "seem" }],
  "ɪ": [{ symbol: "ɪ", word: "ship" }, { symbol: "ɪ̃", word: "win" }],
  "ɑː": [{ symbol: "ɑː", word: "car" }, { symbol: "ɑˑ", word: "heart" }, { symbol: "ɑ̃ː", word: "calm" }],
  "æ": [{ symbol: "æ", word: "cat" }, { symbol: "æː", word: "bad" }, { symbol: "æ̃", word: "man" }],
  "ʌ": [{ symbol: "ʌ", word: "cup" }, { symbol: "ʌ̃", word: "sun" }],
  "ɔː": [{ symbol: "ɔː", word: "door" }, { symbol: "ɔˑ", word: "short" }, { symbol: "ɔ̃ː", word: "corn" }],
  "ɒ": [{ symbol: "ɒ", word: "hot" }, { symbol: "ɒ̃", word: "gone" }],
  "uː": [{ symbol: "uː", word: "blue" }, { symbol: "ʉː", word: "new" }, { symbol: "uˑ", word: "boot" }, { symbol: "ũː", word: "moon" }],
  "ʊ": [{ symbol: "ʊ", word: "book" }, { symbol: "ʊ̈", word: "good" }, { symbol: "ʊ̃", word: "woman" }],
  "e": [{ symbol: "e", word: "bed" }, { symbol: "ẽ", word: "pen" }],
  "ɜː": [{ symbol: "ɜː", word: "her" }, { symbol: "ɜˑ", word: "hurt" }, { symbol: "ɜ̃ː", word: "learn" }],
  "ɝː": [{ symbol: "ɝː", word: "bird" }, { symbol: "ɝˑ", word: "hurt" }, { symbol: "ɝ̃ː", word: "learn" }],
  "ə": [{ symbol: "ə", word: "about" }, { symbol: "ə̃", word: "lemon" }, { symbol: "ɐ", word: "comma" }],
  "ɚ": [{ symbol: "ɚ", word: "teacher" }, { symbol: "ɚ̃", word: "modern" }],
  "eɪ": [{ symbol: "eɪ", word: "day" }, { symbol: "ẽɪ", word: "name" }],
  "aɪ": [{ symbol: "aɪ", word: "my" }, { symbol: "ãɪ", word: "nine" }, { symbol: "ʌɪ", word: "write (US)" }],
  "ɔɪ": [{ symbol: "ɔɪ", word: "boy" }, { symbol: "ɔ̃ɪ", word: "coin" }],
  "əʊ": [{ symbol: "əʊ", word: "go" }, { symbol: "ɒʊ", word: "gold" }, { symbol: "ə̃ʊ", word: "phone" }],
  "oʊ": [{ symbol: "oʊ", word: "go" }, { symbol: "õʊ", word: "home" }],
  "aʊ": [{ symbol: "aʊ", word: "now" }, { symbol: "ãʊ", word: "down" }],
  "ɪə": [{ symbol: "ɪə", word: "ear" }, { symbol: "ɪː", word: "near" }],
  "eə": [{ symbol: "eə", word: "hair" }, { symbol: "ɛː", word: "square" }],
  "ʊə": [{ symbol: "ʊə", word: "tour" }, { symbol: "ɔː", word: "sure" }],
  "aɪə": [{ symbol: "aɪə", word: "fire" }, { symbol: "aə", word: "fire" }],
  "aʊə": [{ symbol: "aʊə", word: "hour" }, { symbol: "aə", word: "power" }],
  /* consonants */
  "p": [{ symbol: "pʰ", word: "pen" }, { symbol: "p", word: "spin" }, { symbol: "p̚", word: "cup" }, { symbol: "pʼ", word: "stop!" }],
  "b": [{ symbol: "b", word: "book" }, { symbol: "b̥", word: "job" }, { symbol: "b̚", word: "cab" }],
  "t": [{ symbol: "tʰ", word: "ten" }, { symbol: "t", word: "stop" }, { symbol: "ʔ", word: "button" }, { symbol: "tʷ", word: "twin" }, { symbol: "tʲ", word: "tune (UK)" }, { symbol: "tʃ", word: "got you" }, { symbol: "t̪", word: "eighth" }, { symbol: "t̚", word: "cat" }, { symbol: "tʼ", word: "wait!" }],
  "t̬": [{ symbol: "ɾ", word: "water" }, { symbol: "ɾ̃", word: "winter" }],
  "d": [{ symbol: "d", word: "day" }, { symbol: "dⁿ", word: "sudden" }, { symbol: "dˡ", word: "middle" }, { symbol: "dʲ", word: "duke (UK)" }, { symbol: "dʒ", word: "did you" }, { symbol: "d̪", word: "width" }, { symbol: "d̥", word: "bad" }, { symbol: "ɾ", word: "ladder (US)" }],
  "k": [{ symbol: "kʰ", word: "come" }, { symbol: "k", word: "sky" }, { symbol: "k̟", word: "key" }, { symbol: "k̠", word: "cool" }, { symbol: "kʷ", word: "queen" }, { symbol: "kʲ", word: "cute" }, { symbol: "k̚", word: "look" }, { symbol: "kʼ", word: "back!" }],
  "g": [{ symbol: "ɡ", word: "go" }, { symbol: "ɡ̟", word: "geese" }, { symbol: "ɡ̠", word: "goal" }, { symbol: "ɡʷ", word: "penguin" }, { symbol: "ɡʲ", word: "argue" }, { symbol: "ɡ̊", word: "bag" }, { symbol: "ɡ̚", word: "big" }],
  "f": [{ symbol: "f", word: "fan" }, { symbol: "f̪", word: "fifth" }, { symbol: "f̟", word: "feel" }, { symbol: "f̠", word: "fall" }, { symbol: "f̚", word: "soft" }],
  "v": [{ symbol: "v", word: "van" }, { symbol: "v̥", word: "love" }],
  "θ": [{ symbol: "θ", word: "think" }],
  "ð": [{ symbol: "ð", word: "this" }, { symbol: "ð̥", word: "breathe" }],
  "s": [{ symbol: "s", word: "sun" }, { symbol: "sʷ", word: "swim" }, { symbol: "sʲ", word: "assume (UK)" }, { symbol: "ʃ", word: "miss you" }],
  "z": [{ symbol: "z", word: "zoo" }, { symbol: "zʲ", word: "presume (UK)" }, { symbol: "ʒ", word: "as you" }, { symbol: "z̥", word: "buzz" }],
  "ʃ": [{ symbol: "ʃ", word: "she" }, { symbol: "ʃʷ", word: "shoe" }],
  "ʒ": [{ symbol: "ʒ", word: "vision" }, { symbol: "ʒ̊", word: "beige" }],
  "tʃ": [{ symbol: "tʃ", word: "cheese" }],
  "dʒ": [{ symbol: "dʒ", word: "jump" }, { symbol: "dʒ̊", word: "bridge" }],
  "m": [{ symbol: "m", word: "moon" }, { symbol: "ɱ", word: "comfort" }, { symbol: "m̩", word: "rhythm" }],
  "n": [{ symbol: "n", word: "name" }, { symbol: "n̩", word: "button" }, { symbol: "nʲ", word: "new (UK)" }, { symbol: "n̪", word: "tenth" }, { symbol: "ɱ", word: "infant" }],
  "ŋ": [{ symbol: "ŋ", word: "sing" }, { symbol: "ŋ̍", word: "bacon" }],
  "l": [{ symbol: "l", word: "look" }, { symbol: "lʲ", word: "million" }, { symbol: "ɫ", word: "ball" }, { symbol: "lˤ", word: "ball (US)" }, { symbol: "l̩", word: "bottle" }, { symbol: "l̥", word: "please" }, { symbol: "l̪", word: "health" }],
  "r": [{ symbol: "ɹ", word: "run" }, { symbol: "ɹʷ", word: "red" }, { symbol: "ɹ̥", word: "tree" }, { symbol: "ɹ̩", word: "butter (US)" }, { symbol: "ɻ", word: "right (US)" }],
  "w": [{ symbol: "w", word: "we" }, { symbol: "w̥", word: "twin" }, { symbol: "ʍ", word: "which (some accents)" }],
  "j": [{ symbol: "j", word: "yes" }, { symbol: "j̥", word: "cue" }],
  "h": [{ symbol: "h", word: "hat" }, { symbol: "ç", word: "huge" }, { symbol: "ɦ", word: "ahead" }],
};

/** UK / US accent picker for the overview page and charts. */
export type Accent = "us" | "uk";

export function inAccent(p: PhonemeInfo, accent: Accent): boolean {
  return p.region === "both" || p.region === accent;
}

export function phonemeAt(offset: number, from: PhonemeInfo): PhonemeInfo {
  const i = PHONEMES.findIndex((p) => p.slug === from.slug);
  return PHONEMES[(i + offset + PHONEMES.length) % PHONEMES.length];
}

/* ── Word builders for the practice stages (deterministic, a–z only) ──── */

/** All of this phoneme's own words: examples first, then its side of the
 *  minimal pairs — deduped, order stable. */
export function wordsForPhoneme(p: PhonemeInfo): string[] {
  const out: string[] = [];
  for (const e of p.examples) if (!out.includes(e.word)) out.push(e.word);
  for (const [own] of p.pairs) if (!out.includes(own)) out.push(own);
  return out;
}

/** Dictation words: the shortest own words, easiest to type unseen. */
export function dictationWordsForPhoneme(p: PhonemeInfo): string[] {
  return [...wordsForPhoneme(p)]
    .sort((a, b) => a.length - b.length || a.localeCompare(b))
    .slice(0, 4);
}

/** The words of both pair columns, interleaved — the sort-game deck. */
export function sortDeck(p: PhonemeInfo): { word: string; own: boolean }[] {
  const deck: { word: string; own: boolean }[] = [];
  p.pairs.forEach(([own, other], i) => {
    // Alternate which side comes first so the answers don't alternate.
    if (i % 2 === 0) {
      deck.push({ word: own, own: true }, { word: other, own: false });
    } else {
      deck.push({ word: other, own: false }, { word: own, own: true });
    }
  });
  return deck;
}

/** Voiced/voiceless consonant partners, for the overview reference card. */
export const VOICE_PAIRS: [string, string][] = [
  ["p", "b"],
  ["t", "d"],
  ["k", "g"],
  ["f", "v"],
  ["th", "dh"],
  ["s", "z"],
  ["sh", "zh"],
  ["ch", "j"],
];
