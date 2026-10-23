// Static reference data for the /english units page — split out of page.tsx
// so these large typed literals type-check in isolation and keep the page
// component light for Turbopack HMR and the editor. Pure data, no JSX.
import { STR } from "@/lib/core/uiStrings";
import { GRAPHEMES } from "@/lib/english/graphemes";

/* Tile tints: plain white, soft UK / US colors, soft vowel color, plus
   the morpheme card's free (emerald) / bound (violet) pair. */
export type Tint = "plain" | "uk" | "us" | "vowel" | "free" | "bound";
export type Tile = { s: string; r: Tint };

export const ALPHABET: Tile[] = "abcdefghijklmnopqrstuvwxyz"
  .split("")
  .map((c) => ({ s: c, r: "aeiou".includes(c) ? "vowel" : "plain" }));

/* IPA symbols (Cambridge dictionary set) — symbols only, no example words.
   r = where the phoneme is used: plain = UK + US, or UK / US only. */

export const IPA_VOWELS: Tile[] = [
  { s: "iː", r: "plain" }, { s: "ɪ", r: "plain" }, { s: "ɑː", r: "plain" },
  { s: "æ", r: "plain" }, { s: "ʌ", r: "plain" }, { s: "ɔː", r: "plain" },
  { s: "ɒ", r: "uk" }, { s: "uː", r: "plain" }, { s: "ʊ", r: "plain" },
  { s: "e", r: "plain" }, { s: "ɜː", r: "uk" }, { s: "ɝː", r: "us" },
  { s: "ə", r: "plain" }, { s: "ɚ", r: "us" }, { s: "eɪ", r: "plain" },
  { s: "aɪ", r: "plain" }, { s: "ɔɪ", r: "plain" }, { s: "əʊ", r: "uk" },
  { s: "oʊ", r: "us" }, { s: "aʊ", r: "plain" }, { s: "ɪə", r: "uk" },
  { s: "eə", r: "uk" }, { s: "ʊə", r: "uk" }, { s: "aɪə", r: "uk" },
  { s: "aʊə", r: "uk" },
];
export const IPA_CONSONANTS: Tile[] = [
  { s: "p", r: "plain" }, { s: "b", r: "plain" }, { s: "t", r: "plain" },
  { s: "t̬", r: "us" }, { s: "d", r: "plain" }, { s: "k", r: "plain" },
  { s: "g", r: "plain" }, { s: "f", r: "plain" }, { s: "v", r: "plain" },
  { s: "θ", r: "plain" }, { s: "ð", r: "plain" }, { s: "s", r: "plain" },
  { s: "z", r: "plain" }, { s: "ʃ", r: "plain" }, { s: "ʒ", r: "plain" },
  { s: "tʃ", r: "plain" }, { s: "dʒ", r: "plain" }, { s: "m", r: "plain" },
  { s: "n", r: "plain" }, { s: "ŋ", r: "plain" }, { s: "l", r: "plain" },
  { s: "r", r: "plain" }, { s: "w", r: "plain" }, { s: "j", r: "plain" },
  { s: "h", r: "plain" },
];
/* Per-region phoneme counts: a region uses its own symbols + the shared ones. */
export const IPA_ALL = [...IPA_VOWELS, ...IPA_CONSONANTS];
export const UK_SOUNDS = IPA_ALL.filter((t) => t.r !== "us").length;
export const US_SOUNDS = IPA_ALL.filter((t) => t.r !== "uk").length;

/* Graphemes (spellings), grouped by size: 1 / 2 / 3 / 4 letters. */
export const GRAPHEME_SIZES = [
  STR.english.monograph,
  STR.english.digraph,
  STR.english.trigraph,
  STR.english.tetragraph,
];
/* Derived from the grapheme dataset so this card always matches the
   /english/graphemes hub. Each tile keeps its sounds for the second row. */
export type GraphemeTile = { s: string; sounds: string[] };
export const graphemeTiles = (kind: "vowel" | "consonant"): GraphemeTile[][] =>
  [1, 2, 3, 4].map((size) =>
    GRAPHEMES.filter((x) => x.kind === kind && x.size === size).map((x) => ({
      s: x.spelling,
      sounds: x.sounds.map((sd) => sd.ipa),
    })),
  );
export const VOWEL_GRAPHEMES = graphemeTiles("vowel");
export const CONSONANT_GRAPHEMES = graphemeTiles("consonant");

/* Phoneme → its most common spellings. r = region, like the IPA tiles. */
export type Mapping = { s: string; r: Tint; g: string[] };

/* Fewest spellings first, so the tiles grow evenly across the grid. */
export const bySpellings = (list: Mapping[]): Mapping[] =>
  [...list].sort((a, b) => a.g.length - b.g.length);

export const SPELL_MONO: Mapping[] = bySpellings([
  { s: "iː", r: "plain", g: ["ee", "e"] },
  { s: "ɪ", r: "plain", g: ["i", "y"] },
  { s: "e", r: "plain", g: ["e", "ea"] },
  { s: "æ", r: "plain", g: ["a"] },
  { s: "ʌ", r: "plain", g: ["u", "o"] },
  { s: "ɑː", r: "plain", g: ["ar", "a"] },
  { s: "ɒ", r: "uk", g: ["o"] },
  { s: "ɔː", r: "plain", g: ["or", "au", "aw"] },
  { s: "ʊ", r: "plain", g: ["oo", "u"] },
  { s: "uː", r: "plain", g: ["oo", "ue", "ew"] },
  { s: "ɜː", r: "uk", g: ["er", "ir", "ur"] },
  { s: "ɝː", r: "us", g: ["er", "ir", "ur"] },
  { s: "ə", r: "plain", g: ["a", "e"] },
  { s: "ɚ", r: "us", g: ["er", "or"] },
]);
export const SPELL_DI: Mapping[] = bySpellings([
  { s: "eɪ", r: "plain", g: ["a", "ai", "ay"] },
  { s: "aɪ", r: "plain", g: ["i", "igh", "y"] },
  { s: "ɔɪ", r: "plain", g: ["oi", "oy"] },
  { s: "aʊ", r: "plain", g: ["ou", "ow"] },
  { s: "əʊ", r: "uk", g: ["o", "oa", "ow"] },
  { s: "oʊ", r: "us", g: ["o", "oa", "ow"] },
  { s: "ɪə", r: "uk", g: ["ear", "eer"] },
  { s: "eə", r: "uk", g: ["air", "are"] },
  { s: "ʊə", r: "uk", g: ["oor", "ure"] },
]);
export const SPELL_TRI: Mapping[] = bySpellings([
  { s: "aɪə", r: "uk", g: ["ire"] },
  { s: "aʊə", r: "uk", g: ["our", "ower"] },
]);
export const SPELL_CONS: Mapping[] = bySpellings([
  { s: "p", r: "plain", g: ["p", "pp"] },
  { s: "b", r: "plain", g: ["b", "bb"] },
  { s: "t", r: "plain", g: ["t", "tt"] },
  { s: "t̬", r: "us", g: ["t", "tt"] },
  { s: "d", r: "plain", g: ["d", "dd"] },
  { s: "k", r: "plain", g: ["c", "k", "ck"] },
  { s: "g", r: "plain", g: ["g", "gg"] },
  { s: "f", r: "plain", g: ["f", "ph"] },
  { s: "v", r: "plain", g: ["v"] },
  { s: "θ", r: "plain", g: ["th"] },
  { s: "ð", r: "plain", g: ["th"] },
  { s: "s", r: "plain", g: ["s", "ss", "c"] },
  { s: "z", r: "plain", g: ["z", "s"] },
  { s: "ʃ", r: "plain", g: ["sh", "ti"] },
  { s: "ʒ", r: "plain", g: ["si", "su"] },
  { s: "tʃ", r: "plain", g: ["ch", "tch"] },
  { s: "dʒ", r: "plain", g: ["j", "g", "dge"] },
  { s: "m", r: "plain", g: ["m", "mm"] },
  { s: "n", r: "plain", g: ["n", "kn"] },
  { s: "ŋ", r: "plain", g: ["ng", "n"] },
  { s: "l", r: "plain", g: ["l", "ll"] },
  { s: "r", r: "plain", g: ["r", "wr"] },
  { s: "w", r: "plain", g: ["w", "wh"] },
  { s: "j", r: "plain", g: ["y"] },
  { s: "h", r: "plain", g: ["h"] },
]);

/* ——— The 10 parts of speech table (Word unit). Names, definitions and
   classification chips carry all three locales; example words stay
   English. Shared group labels are hoisted so rows reuse them. ——— */
export type L3 = { en: string; uz: string; ru: string };

export const POS_G: Record<string, L3> = {
  formation: { en: "Formation", uz: "Yasalishi", ru: "Образование" },
  types: { en: "Types", uz: "Turlari", ru: "Типы" },
  func: { en: "Function", uz: "Vazifasi", ru: "Функция" },
  meaning: { en: "Meaning", uz: "Ma'nosi", ru: "Значение" },
  degrees: { en: "Degrees", uz: "Darajalari", ru: "Степени" },
  order: { en: "Order", uz: "Tartibi", ru: "Порядок" },
  voice: { en: "Voice", uz: "Nisbat", ru: "Залог" },
  begins: { en: "Begins with", uz: "Boshlanishi", ru: "Начинается с" },
};

/* A nested classification (the verb Types tree): a node has a name,
   optional inline leaf chips, and optional child nodes drawn indented
   under a left rail. */
export type PosNode = { t: L3; leaves?: L3[]; kids?: PosNode[] };

export const VERB_TYPES: PosNode[] = [
  {
    t: { en: "Finite", uz: "Tuslangan", ru: "Личный" },
    kids: [
      {
        t: { en: "Main · Lexical", uz: "Asosiy", ru: "Основной" },
        kids: [
          {
            t: { en: "Action · Dynamic", uz: "Harakat", ru: "Динамический" },
            kids: [
              {
                t: {
                  en: "Ambitransitive",
                  uz: "Ambitranzitiv",
                  ru: "Амбипереходный",
                },
              },
              {
                t: { en: "Intransitive", uz: "O'timsiz", ru: "Непереходный" },
                leaves: [
                  { en: "Causative", uz: "Orttirma", ru: "Каузативный" },
                  { en: "Cognate", uz: "Kognat", ru: "Когнатный" },
                  { en: "Impersonal", uz: "Shaxssiz", ru: "Безличный" },
                ],
              },
              {
                t: { en: "Transitive", uz: "O'timli", ru: "Переходный" },
                leaves: [
                  { en: "Reflexive", uz: "O'zlik", ru: "Возвратный" },
                  { en: "Reciprocal", uz: "Birgalik", ru: "Взаимный" },
                  { en: "Factitive", uz: "Faktitiv", ru: "Фактитивный" },
                  {
                    en: "Quasi-passive",
                    uz: "Kvazi-passiv",
                    ru: "Квазипассивный",
                  },
                ],
              },
            ],
          },
          {
            t: {
              en: "Stative · Non-action",
              uz: "Holat",
              ru: "Статический",
            },
            leaves: [
              { en: "Linking", uz: "Bog'lovchi", ru: "Связочный" },
              { en: "State", uz: "Holat", ru: "Состояния" },
            ],
          },
          {
            t: {
              en: "Reporting",
              uz: "Xabar beruvchi",
              ru: "Глагол говорения",
            },
          },
        ],
      },
      {
        t: { en: "Helping", uz: "Yordamchi", ru: "Вспомогательный" },
        leaves: [
          { en: "Primary", uz: "Birlamchi", ru: "Первичный" },
          { en: "Modal", uz: "Modal", ru: "Модальный" },
        ],
      },
      { t: { en: "Delexical", uz: "Deleksik", ru: "Делексический" } },
    ],
  },
  {
    t: { en: "Non-finite", uz: "Tuslanmagan", ru: "Неличный" },
    kids: [
      { t: { en: "Gerund", uz: "Gerundiy", ru: "Герундий" } },
      {
        t: { en: "Infinitive", uz: "Infinitiv", ru: "Инфинитив" },
        leaves: [
          { en: "Bare", uz: "To'siz", ru: "Голый" },
          { en: "Split", uz: "Bo'lingan", ru: "Разделённый" },
          { en: "Perfect", uz: "Perfekt", ru: "Перфектный" },
          { en: "Absolute", uz: "Mutlaq", ru: "Абсолютный" },
          { en: "Abridged", uz: "Qisqargan", ru: "Сокращённый" },
        ],
      },
      {
        t: { en: "Participle", uz: "Sifatdosh", ru: "Причастие" },
        leaves: [
          { en: "Present", uz: "Hozirgi", ru: "Настоящее" },
          { en: "Past", uz: "O'tgan", ru: "Прошедшее" },
          { en: "Perfect", uz: "Perfekt", ru: "Перфектное" },
        ],
      },
    ],
  },
];

/* The phrase table (Syntax unit, Phrase card): one row per phrase kind.
   Structure is a mini table — one column per element (req = obligatory,
   drawn dark), with the matching piece of the example under each. */
export const PHRASE_TABLE: {
  name: L3;
  sub?: string;
  struct: { t: L3; req?: boolean; ex?: string }[];
  func: L3[];
}[] = [
  {
    name: { en: "Noun Phrase", uz: "Ot birikmasi", ru: "Именная группа" },
    struct: [
      {
        t: { en: "Determiner", uz: "Determiner", ru: "Определитель" },
        ex: "the",
      },
      {
        t: { en: "Premodifier", uz: "Old aniqlovchi", ru: "Премодификатор" },
        ex: "red",
      },
      {
        t: { en: "Head noun", uz: "Bosh ot", ru: "Ядро (сущ.)" },
        req: true,
        ex: "ball",
      },
      {
        t: {
          en: "Postmodifier",
          uz: "Keyingi aniqlovchi",
          ru: "Постмодификатор",
        },
        ex: "in the box",
      },
    ],
    func: [
      { en: "Subject", uz: "Ega", ru: "Подлежащее" },
      {
        en: "Direct object",
        uz: "To'g'ri to'ldiruvchi",
        ru: "Прямое дополнение",
      },
      {
        en: "Indirect object",
        uz: "Vositali to'ldiruvchi",
        ru: "Косвенное дополнение",
      },
      {
        en: "Object of preposition",
        uz: "Predlog to'ldiruvchisi",
        ru: "Дополнение предлога",
      },
      {
        en: "Subject complement",
        uz: "Ega komplementi",
        ru: "Комплемент подлежащего",
      },
      { en: "Appositive", uz: "Izohlovchi", ru: "Приложение" },
    ],
  },
  {
    name: { en: "Verb Phrase", uz: "Fe'l birikmasi", ru: "Глагольная группа" },
    struct: [
      {
        t: { en: "Auxiliary", uz: "Yordamchi", ru: "Вспомогательный" },
        ex: "has been",
      },
      {
        t: { en: "Main verb", uz: "Asosiy fe'l", ru: "Основной глагол" },
        req: true,
        ex: "telling",
      },
      {
        t: { en: "Complement", uz: "Komplement", ru: "Комплемент" },
        ex: "the truth",
      },
      {
        t: { en: "Modifier", uz: "Aniqlovchi", ru: "Модификатор" },
        ex: "lately",
      },
    ],
    func: [{ en: "Predicate", uz: "Kesim", ru: "Сказуемое" }],
  },
  {
    name: {
      en: "Gerund Phrase",
      uz: "Gerundiy birikmasi",
      ru: "Герундиальная группа",
    },
    struct: [
      { t: { en: "V-ing", uz: "V-ing", ru: "V-ing" }, req: true, ex: "making" },
      {
        t: { en: "Object", uz: "To'ldiruvchi", ru: "Дополнение" },
        ex: "him",
      },
      {
        t: { en: "Complement", uz: "Komplement", ru: "Комплемент" },
        ex: "happy",
      },
      {
        t: { en: "Modifier", uz: "Aniqlovchi", ru: "Модификатор" },
        ex: "every day",
      },
    ],
    func: [
      { en: "Acts as a noun", uz: "Ot vazifasida", ru: "Как существительное" },
    ],
  },
  {
    name: {
      en: "Infinitive Phrase",
      uz: "Infinitiv birikmasi",
      ru: "Инфинитивная группа",
    },
    struct: [
      {
        t: { en: "to + Base verb", uz: "to + Fe'l", ru: "to + Глагол" },
        req: true,
        ex: "to make",
      },
      {
        t: { en: "Object", uz: "To'ldiruvchi", ru: "Дополнение" },
        ex: "her",
      },
      {
        t: { en: "Complement", uz: "Komplement", ru: "Комплемент" },
        ex: "proud",
      },
      {
        t: { en: "Modifier", uz: "Aniqlovchi", ru: "Модификатор" },
        ex: "someday",
      },
    ],
    func: [
      { en: "As noun", uz: "Ot kabi", ru: "Как сущ." },
      { en: "As adjective", uz: "Sifat kabi", ru: "Как прил." },
      { en: "As adverb", uz: "Ravish kabi", ru: "Как нареч." },
    ],
  },
  {
    name: {
      en: "Participle Phrase",
      uz: "Sifatdosh birikmasi",
      ru: "Причастная группа",
    },
    sub: "Present · Past · Perfect",
    struct: [
      {
        t: { en: "Participle", uz: "Sifatdosh", ru: "Причастие" },
        req: true,
        ex: "painting",
      },
      {
        t: { en: "Object", uz: "To'ldiruvchi", ru: "Дополнение" },
        ex: "the wall",
      },
      {
        t: { en: "Complement", uz: "Komplement", ru: "Комплемент" },
        ex: "green",
      },
      {
        t: { en: "Modifier", uz: "Aniqlovchi", ru: "Модификатор" },
        ex: "carefully",
      },
    ],
    func: [
      { en: "Modifies a noun", uz: "Otni izohlaydi", ru: "Определяет сущ." },
    ],
  },
  {
    name: {
      en: "Adjective Phrase",
      uz: "Sifat birikmasi",
      ru: "Адъективная группа",
    },
    struct: [
      {
        t: { en: "Premodifier", uz: "Old aniqlovchi", ru: "Премодификатор" },
        ex: "very",
      },
      {
        t: { en: "Head adjective", uz: "Bosh sifat", ru: "Ядро (прил.)" },
        req: true,
        ex: "happy",
      },
      {
        t: { en: "Complement", uz: "Komplement", ru: "Комплемент" },
        ex: "with the result",
      },
    ],
    func: [
      { en: "Modifier", uz: "Aniqlovchi", ru: "Определение" },
      { en: "Complement", uz: "Komplement", ru: "Комплемент" },
    ],
  },
  {
    name: {
      en: "Adverb Phrase",
      uz: "Ravish birikmasi",
      ru: "Наречная группа",
    },
    struct: [
      {
        t: { en: "Premodifier", uz: "Old aniqlovchi", ru: "Премодификатор" },
        ex: "more",
      },
      {
        t: { en: "Head adverb", uz: "Bosh ravish", ru: "Ядро (нареч.)" },
        req: true,
        ex: "quickly",
      },
      {
        t: { en: "Complement", uz: "Komplement", ru: "Комплемент" },
        ex: "than before",
      },
    ],
    func: [{ en: "Adverbial", uz: "Hol", ru: "Обстоятельство" }],
  },
  {
    name: {
      en: "Prepositional Phrase",
      uz: "Predlogli birikma",
      ru: "Предложная группа",
    },
    struct: [
      {
        t: { en: "Preposition", uz: "Predlog", ru: "Предлог" },
        req: true,
        ex: "in",
      },
      {
        t: {
          en: "Object (NP)",
          uz: "To'ldiruvchi (OB)",
          ru: "Дополнение (ИГ)",
        },
        req: true,
        ex: "the garden",
      },
    ],
    func: [
      { en: "As adjective", uz: "Sifat kabi", ru: "Как прил." },
      { en: "Adverbial", uz: "Hol", ru: "Обстоятельство" },
    ],
  },
  {
    name: {
      en: "Absolute Phrase",
      uz: "Mutlaq birikma",
      ru: "Абсолютная группа",
    },
    struct: [
      {
        t: { en: "Noun phrase", uz: "Ot birikmasi", ru: "Именная группа" },
        req: true,
        ex: "weather",
      },
      {
        t: {
          en: "Participle · Adjective · PP",
          uz: "Sifatdosh · Sifat · PP",
          ru: "Причастие · Прил. · PP",
        },
        req: true,
        ex: "permitting",
      },
    ],
    func: [
      {
        en: "Sentence modifier",
        uz: "Gap aniqlovchisi",
        ru: "Модификатор предложения",
      },
    ],
  },
  {
    name: {
      en: "Appositive Phrase",
      uz: "Izohlovchi birikma",
      ru: "Аппозитивная группа",
    },
    struct: [
      {
        t: { en: "Noun phrase", uz: "Ot birikmasi", ru: "Именная группа" },
        req: true,
        ex: "a doctor",
      },
    ],
    func: [
      {
        en: "Renames a noun",
        uz: "Otga izoh beradi",
        ru: "Поясняет существительное",
      },
    ],
  },
];

/* Every clause is built on Subject + Predicate — the tiny anatomy strip
   above the clause table, reusing the obligatory shading. */
export const CLAUSE_ANATOMY: L3[] = [
  { en: "Subject", uz: "Ega", ru: "Подлежащее" },
  { en: "Predicate", uz: "Kesim", ru: "Сказуемое" },
];

/* The clause table (Syntax unit, Clause card): one row per clause kind.
   `dep` marks dependent clauses (pale chip, like optional elements);
   `begins` names the word class that opens the clause (main has none);
   the example is [before, clause, after] — the clause is drawn bold. */
export const CLAUSE_TABLE: {
  name: L3;
  sub?: string;
  dep?: boolean;
  def: L3;
  begins?: L3[];
  func: L3[];
  ex: [string, string, string];
}[] = [
  {
    name: { en: "Main Clause", uz: "Bosh klauza", ru: "Главная клауза" },
    sub: "Independent clause",
    def: {
      en: "A complete thought",
      uz: "To'liq fikr — alohida tura oladi.",
      ru: "Полная мысль — стоит отдельно.",
    },
    func: [
      {
        en: "Simple sentence",
        uz: "Sodda gap",
        ru: "Простое предложение",
      },
    ],
    ex: ["", "She smiled", " when she saw me."],
  },
  {
    name: { en: "Noun Clause", uz: "Ot klauza", ru: "Именная клауза" },
    dep: true,
    def: {
      en: "Works like a noun.",
      uz: "Ot kabi ishlaydi.",
      ru: "Работает как существительное.",
    },
    begins: [
      {
        en: "Subordinating conjunction",
        uz: "Ergashtiruvchi bog'lovchi",
        ru: "Подчинительный союз",
      },
      {
        en: "Wh- question word",
        uz: "Wh- so'roq so'zi",
        ru: "Вопросительное слово",
      },
    ],
    func: [
      { en: "Subject", uz: "Ega", ru: "Подлежащее" },
      { en: "Object", uz: "To'ldiruvchi", ru: "Дополнение" },
      { en: "Complement", uz: "Komplement", ru: "Комплемент" },
    ],
    ex: ["I heard ", "what he said", "."],
  },
  {
    name: {
      en: "Adjective Clause",
      uz: "Sifat klauza",
      ru: "Определительная клауза",
    },
    sub: "Relative clause",
    dep: true,
    def: {
      en: "Describes a noun.",
      uz: "Otni izohlaydi.",
      ru: "Описывает существительное.",
    },
    begins: [
      {
        en: "Relative pronoun",
        uz: "Nisbiy olmosh",
        ru: "Относительное местоимение",
      },
      {
        en: "Relative adverb",
        uz: "Nisbiy ravish",
        ru: "Относительное наречие",
      },
    ],
    func: [
      {
        en: "Noun modifier",
        uz: "Ot aniqlovchisi",
        ru: "Модификатор существительного",
      },
    ],
    ex: ["The boy ", "who won", " smiled."],
  },
  {
    name: {
      en: "Adverb Clause",
      uz: "Ravish klauza",
      ru: "Обстоятельственная клауза",
    },
    dep: true,
    def: {
      en: "Tells when, why, how.",
      uz: "Qachon, nega, qanday — aytadi.",
      ru: "Говорит когда, почему, как.",
    },
    begins: [
      {
        en: "Subordinating conjunction",
        uz: "Ergashtiruvchi bog'lovchi",
        ru: "Подчинительный союз",
      },
    ],
    func: [
      {
        en: "Verb modifier",
        uz: "Fe'l aniqlovchisi",
        ru: "Модификатор глагола",
      },
    ],
    ex: ["We stopped ", "when the bell rang", "."],
  },
];

/* The sentence card (Syntax unit): two independent sub-cards.
   Structure — how clauses combine into a sentence; the Main/Dependent
   columns carry the count, and the full example draws main clauses
   bold, dependent clauses underlined.
   Types — what the sentence does, with its end mark.
   SENT_PATTERNS (the seven S·V·O orders) renders in the Subject &
   Predicate card's Patterns table. */
export type SentSeg = { t: string; k?: "m" | "d" };

export const SENT_STRUCT: {
  name: L3;
  m: string;
  d?: string;
  ex: SentSeg[];
}[] = [
  {
    name: { en: "Simple", uz: "Sodda gap", ru: "Простое" },
    m: "1",
    ex: [{ t: "The dog runs.", k: "m" }],
  },
  {
    name: {
      en: "Compound",
      uz: "Bog'langan qo'shma gap",
      ru: "Сложносочинённое",
    },
    m: "2+",
    ex: [
      { t: "The dog runs", k: "m" },
      { t: ", and " },
      { t: "the cat sleeps", k: "m" },
      { t: "." },
    ],
  },
  {
    name: {
      en: "Complex",
      uz: "Ergashgan qo'shma gap",
      ru: "Сложноподчинённое",
    },
    m: "1",
    d: "1+",
    ex: [
      { t: "The dog runs", k: "m" },
      { t: " " },
      { t: "when it rains", k: "d" },
      { t: "." },
    ],
  },
  {
    name: {
      en: "Compound-Complex",
      uz: "Aralash qo'shma gap",
      ru: "Смешанное",
    },
    m: "2+",
    d: "1+",
    ex: [
      { t: "The dog runs", k: "m" },
      { t: ", and " },
      { t: "the cat sleeps", k: "m" },
      { t: " " },
      { t: "when it rains", k: "d" },
      { t: "." },
    ],
  },
];

export const SENT_TYPES: { name: L3; def: L3; mark: string; ex: string }[] = [
  {
    name: { en: "Declarative", uz: "Darak gap", ru: "Повествовательное" },
    def: {
      en: "Tells something.",
      uz: "Xabar beradi.",
      ru: "Сообщает что-то.",
    },
    mark: ".",
    ex: "The dog runs.",
  },
  {
    name: { en: "Interrogative", uz: "So'roq gap", ru: "Вопросительное" },
    def: {
      en: "Asks a question.",
      uz: "Savol so'raydi.",
      ru: "Задаёт вопрос.",
    },
    mark: "?",
    ex: "Does the dog run?",
  },
  {
    name: { en: "Imperative", uz: "Buyruq gap", ru: "Побудительное" },
    def: {
      en: "Gives a command or request.",
      uz: "Buyruq yoki iltimos bildiradi.",
      ru: "Выражает приказ или просьбу.",
    },
    mark: ". !",
    ex: "Close the door.",
  },
  {
    name: { en: "Exclamatory", uz: "Undov gap", ru: "Восклицательное" },
    def: {
      en: "Shows strong feeling.",
      uz: "Kuchli his-tuyg'uni bildiradi.",
      ru: "Выражает сильное чувство.",
    },
    mark: "!",
    ex: "What a fast dog!",
  },
];

/* Sentence-part labels shared by the pattern rows. */
export const SENT_EL = {
  s: { en: "Subject", uz: "Ega", ru: "Подлежащее" },
  v: { en: "Verb", uz: "Fe'l", ru: "Глагол" },
  o: { en: "Object", uz: "To'ldiruvchi", ru: "Дополнение" },
  c: { en: "Complement", uz: "Komplement", ru: "Комплемент" },
  a: { en: "Adverbial", uz: "Hol", ru: "Обстоятельство" },
  io: {
    en: "Indirect object",
    uz: "Vositali to'ldiruvchi",
    ru: "Косвенное дополнение",
  },
  do: {
    en: "Direct object",
    uz: "Vositasiz to'ldiruvchi",
    ru: "Прямое дополнение",
  },
  oc: {
    en: "Object complement",
    uz: "Obyekt komplementi",
    ru: "Комплемент объекта",
  },
} satisfies Record<string, L3>;

export const SENT_PATTERNS: { code: string; cols: { t: L3; ex: string }[] }[] = [
  {
    code: "S + V",
    cols: [
      { t: SENT_EL.s, ex: "Birds" },
      { t: SENT_EL.v, ex: "fly" },
    ],
  },
  {
    code: "S + V + O",
    cols: [
      { t: SENT_EL.s, ex: "She" },
      { t: SENT_EL.v, ex: "reads" },
      { t: SENT_EL.o, ex: "books" },
    ],
  },
  {
    code: "S + V + C",
    cols: [
      { t: SENT_EL.s, ex: "He" },
      { t: SENT_EL.v, ex: "is" },
      { t: SENT_EL.c, ex: "happy" },
    ],
  },
  {
    code: "S + V + A",
    cols: [
      { t: SENT_EL.s, ex: "She" },
      { t: SENT_EL.v, ex: "lives" },
      { t: SENT_EL.a, ex: "here" },
    ],
  },
  {
    code: "S + V + O + O",
    cols: [
      { t: SENT_EL.s, ex: "He" },
      { t: SENT_EL.v, ex: "gave" },
      { t: SENT_EL.io, ex: "her" },
      { t: SENT_EL.do, ex: "a gift" },
    ],
  },
  {
    code: "S + V + O + C",
    cols: [
      { t: SENT_EL.s, ex: "They" },
      { t: SENT_EL.v, ex: "made" },
      { t: SENT_EL.o, ex: "him" },
      { t: SENT_EL.oc, ex: "captain" },
    ],
  },
  {
    code: "S + V + O + A",
    cols: [
      { t: SENT_EL.s, ex: "She" },
      { t: SENT_EL.v, ex: "put" },
      { t: SENT_EL.o, ex: "the keys" },
      { t: SENT_EL.a, ex: "on the table" },
    ],
  },
];

/* The Subject & Predicate card (Syntax unit): the two halves every
   sentence splits into. The card opens with a demo table that splits
   one sentence into Subject + Predicate and opens the predicate up
   into its parts. Each half is its own sub-card with its kinds
   (simple / compound / complete); the example draws the part bold.
   The subject card adds "what can be a subject" forms. */
export const SP_CARDS: {
  title: L3;
  desc: L3;
  kinds: { name: L3; def: L3; ex: [string, string, string] }[];
  forms?: { t: L3; ex: [string, string, string] }[];
}[] = [
  {
    title: { en: "Subject", uz: "Ega", ru: "Подлежащее" },
    desc: {
      en: "Who or what the sentence is about.",
      uz: "Gap kim yoki nima haqida.",
      ru: "О ком или о чём предложение.",
    },
    kinds: [
      {
        name: { en: "Simple", uz: "Sodda", ru: "Простое" },
        def: {
          en: "Only the main word.",
          uz: "Faqat asosiy so'z.",
          ru: "Только главное слово.",
        },
        ex: ["", "Tom", " runs."],
      },
      {
        name: { en: "Compound", uz: "Uyushiq", ru: "Однородное" },
        def: {
          en: "Two or more, joined by and / or.",
          uz: "Ikki yoki undan ko'p — and / or bilan.",
          ru: "Два и больше — с and / or.",
        },
        ex: ["", "Tom and Ann", " run."],
      },
      {
        name: { en: "Complete", uz: "To'liq", ru: "Полное" },
        def: {
          en: "The main word with all its describers.",
          uz: "Asosiy so'z barcha aniqlovchilari bilan.",
          ru: "Главное слово со всеми определениями.",
        },
        ex: ["", "The old dog with a red collar", " runs."],
      },
    ],
    forms: [
      {
        t: { en: "Noun", uz: "Ot", ru: "Существительное" },
        ex: ["", "The dog", " runs."],
      },
      {
        t: { en: "Pronoun", uz: "Olmosh", ru: "Местоимение" },
        ex: ["", "She", " sings."],
      },
      {
        t: {
          en: "Noun phrase",
          uz: "Ot birikmasi",
          ru: "Именная группа",
        },
        ex: ["", "The little dog", " barks."],
      },
      {
        t: { en: "Gerund", uz: "Gerundiy", ru: "Герундий" },
        ex: ["", "Swimming", " is fun."],
      },
      {
        t: { en: "Infinitive", uz: "Infinitiv", ru: "Инфинитив" },
        ex: ["", "To win", " takes work."],
      },
      {
        t: { en: "Noun clause", uz: "Ot klauza", ru: "Именная клауза" },
        ex: ["", "What he said", " surprised me."],
      },
    ],
  },
  {
    title: { en: "Predicate", uz: "Kesim", ru: "Сказуемое" },
    desc: {
      en: "What the subject does or is.",
      uz: "Ega nima qiladi yoki qanday.",
      ru: "Что подлежащее делает или каково оно.",
    },
    kinds: [
      {
        name: { en: "Simple", uz: "Sodda", ru: "Простое" },
        def: {
          en: "Only the verb.",
          uz: "Faqat fe'l.",
          ru: "Только глагол.",
        },
        ex: ["Tom ", "runs", "."],
      },
      {
        name: { en: "Compound", uz: "Uyushiq", ru: "Однородное" },
        def: {
          en: "Two or more verbs with one subject.",
          uz: "Bitta egaga ikki yoki undan ko'p fe'l.",
          ru: "Два и больше глаголов при одном подлежащем.",
        },
        ex: ["Tom ", "runs and jumps", "."],
      },
      {
        name: { en: "Complete", uz: "To'liq", ru: "Полное" },
        def: {
          en: "The verb with all its words.",
          uz: "Fe'l barcha so'zlari bilan.",
          ru: "Глагол со всеми его словами.",
        },
        ex: ["Tom ", "runs in the park every day", "."],
      },
    ],
  },
  {
    title: SENT_EL.o,
    desc: {
      en: "Receives the action.",
      uz: "Harakatni qabul qiladi.",
      ru: "Принимает действие.",
    },
    kinds: [
      {
        name: { en: "Direct", uz: "Vositasiz", ru: "Прямое" },
        def: {
          en: "Gets the action directly.",
          uz: "Harakatni to'g'ridan-to'g'ri oladi.",
          ru: "Получает действие напрямую.",
        },
        ex: ["She reads ", "books", "."],
      },
      {
        name: { en: "Indirect", uz: "Vositali", ru: "Косвенное" },
        def: {
          en: "Who the action is done for.",
          uz: "Harakat kim uchun qilinadi.",
          ru: "Кому предназначено действие.",
        },
        ex: ["He gave ", "her", " a gift."],
      },
    ],
  },
  {
    title: SENT_EL.c,
    desc: {
      en: "Completes the meaning.",
      uz: "Ma'noni to'ldiradi.",
      ru: "Дополняет смысл.",
    },
    kinds: [
      {
        name: {
          en: "Subject complement",
          uz: "Ega komplementi",
          ru: "Комплемент подлежащего",
        },
        def: {
          en: "Describes the subject after a linking verb.",
          uz: "Bog'lovchi fe'ldan keyin egani izohlaydi.",
          ru: "Описывает подлежащее после связочного глагола.",
        },
        ex: ["He is ", "happy", "."],
      },
      {
        name: {
          en: "Object complement",
          uz: "Obyekt komplementi",
          ru: "Комплемент объекта",
        },
        def: {
          en: "Renames or describes the object.",
          uz: "Obyektni qayta nomlaydi yoki izohlaydi.",
          ru: "Переименовывает или описывает объект.",
        },
        ex: ["They made him ", "captain", "."],
      },
    ],
  },
  {
    title: SENT_EL.a,
    desc: {
      en: "Tells when, where or how.",
      uz: "Qachon, qayerda, qanday — aytadi.",
      ru: "Говорит когда, где, как.",
    },
    kinds: [
      {
        name: { en: "Time", uz: "Vaqt", ru: "Времени" },
        def: {
          en: "When it happens.",
          uz: "Qachon bo'ladi.",
          ru: "Когда происходит.",
        },
        ex: ["She left ", "yesterday", "."],
      },
      {
        name: { en: "Place", uz: "O'rin", ru: "Места" },
        def: {
          en: "Where it happens.",
          uz: "Qayerda bo'ladi.",
          ru: "Где происходит.",
        },
        ex: ["She lives ", "here", "."],
      },
      {
        name: { en: "Manner", uz: "Tarz", ru: "Образа действия" },
        def: {
          en: "How it happens.",
          uz: "Qanday bo'ladi.",
          ru: "Как происходит.",
        },
        ex: ["He speaks ", "slowly", "."],
      },
    ],
  },
];

/* A tense × aspect grid (the 12-tense map): column heads are aspects,
   row heads are tenses, cells are English example forms. */
export type PosMatrix = { cols: L3[]; rows: { t: L3; cells: string[] }[] };

export const POS_TABLE: {
  name: L3;
  def: L3;
  groups: { label: L3; subs?: L3[]; tree?: PosNode[]; matrix?: PosMatrix }[];
  ex: string[];
}[] = [
  {
    name: { en: "Noun", uz: "Ot", ru: "Существительное" },
    def: {
      en: "Names a person, place, thing, or idea.",
      uz: "Shaxs, joy, narsa yoki tushunchani ataydi.",
      ru: "Называет человека, место, предмет или идею.",
    },
    groups: [
      {
        label: POS_G.formation,
        subs: [
          { en: "Simple", uz: "Sodda", ru: "Простое" },
          { en: "Derived", uz: "Yasama", ru: "Производное" },
          { en: "Compound", uz: "Qo'shma", ru: "Сложное" },
        ],
      },
      {
        label: POS_G.types,
        subs: [
          {
            en: "Common · Proper",
            uz: "Turdosh · Atoqli",
            ru: "Нарицательное · Собственное",
          },
          {
            en: "Concrete · Abstract",
            uz: "Aniq · Mavhum",
            ru: "Конкретное · Абстрактное",
          },
          {
            en: "Countable · Uncountable",
            uz: "Sanaladigan · Sanalmaydigan",
            ru: "Исчисляемое · Неисчисляемое",
          },
          {
            en: "Singular · Plural",
            uz: "Birlik · Ko'plik",
            ru: "Единственное · Множественное",
          },
          { en: "Collective", uz: "Jamlovchi", ru: "Собирательное" },
          { en: "Possessive", uz: "Egalik", ru: "Притяжательное" },
          { en: "Partitive", uz: "Partitiv", ru: "Партитивное" },
          { en: "Attributive", uz: "Aniqlovchi", ru: "Атрибутивное" },
          { en: "Verbal", uz: "Harakat nomi", ru: "Отглагольное" },
        ],
      },
      {
        label: POS_G.func,
        subs: [
          { en: "Subject", uz: "Ega", ru: "Подлежащее" },
          { en: "Object", uz: "To'ldiruvchi", ru: "Дополнение" },
          { en: "Modifier", uz: "Aniqlovchi", ru: "Определение" },
        ],
      },
    ],
    ex: ["book", "city", "teacher"],
  },
  {
    name: { en: "Pronoun", uz: "Olmosh", ru: "Местоимение" },
    def: {
      en: "Replaces a noun to avoid repetition.",
      uz: "Takrorlamaslik uchun ot o'rnida keladi.",
      ru: "Заменяет существительное, чтобы не повторяться.",
    },
    groups: [
      {
        label: POS_G.types,
        subs: [
          { en: "Personal", uz: "Kishilik", ru: "Личное" },
          { en: "Demonstrative", uz: "Ko'rsatish", ru: "Указательное" },
          { en: "Indefinite", uz: "Gumon", ru: "Неопределённое" },
          { en: "Interrogative", uz: "So'roq", ru: "Вопросительное" },
          { en: "Reciprocal", uz: "Birgalik", ru: "Взаимное" },
          { en: "Relative", uz: "Nisbiy", ru: "Относительное" },
          { en: "Dummy", uz: "Soxta", ru: "Формальное" },
          { en: "Distributive", uz: "Taqsimlovchi", ru: "Разделительное" },
          { en: "Exclamatory", uz: "Undov", ru: "Восклицательное" },
        ],
      },
      {
        label: POS_G.func,
        subs: [
          { en: "Subject", uz: "Ega", ru: "Подлежащее" },
          { en: "Object", uz: "To'ldiruvchi", ru: "Дополнение" },
          { en: "Possessive", uz: "Egalik", ru: "Притяжательное" },
          { en: "Complement", uz: "Komplement", ru: "Комплемент" },
        ],
      },
    ],
    ex: ["I", "he", "this"],
  },
  {
    name: { en: "Article", uz: "Artikl", ru: "Артикль" },
    def: {
      en: "Shows whether a noun is specific or general.",
      uz: "Ot aniq yoki umumiy ekanini ko'rsatadi.",
      ru: "Показывает, конкретный предмет или любой.",
    },
    groups: [
      {
        label: POS_G.types,
        subs: [
          { en: "Definite", uz: "Aniq", ru: "Определённый" },
          { en: "Indefinite", uz: "Noaniq", ru: "Неопределённый" },
          { en: "Zero", uz: "Nol artikl", ru: "Нулевой" },
        ],
      },
      {
        label: POS_G.func,
        subs: [
          {
            en: "Noun marker",
            uz: "Ot belgisi",
            ru: "Маркер существительного",
          },
        ],
      },
    ],
    ex: ["the", "a", "an"],
  },
  {
    name: { en: "Preposition", uz: "Predlog", ru: "Предлог" },
    def: {
      en: "Shows the relationship between words.",
      uz: "So'zlar orasidagi bog'lanishni ko'rsatadi.",
      ru: "Показывает связь между словами.",
    },
    groups: [
      {
        label: POS_G.formation,
        subs: [
          { en: "Simple", uz: "Sodda", ru: "Простой" },
          { en: "Compound", uz: "Qo'shma", ru: "Сложный" },
          { en: "Complex", uz: "Murakkab", ru: "Составной" },
        ],
      },
      {
        label: POS_G.meaning,
        subs: [
          { en: "Place", uz: "Joy", ru: "Место" },
          { en: "Time", uz: "Vaqt", ru: "Время" },
          { en: "Direction", uz: "Yo'nalish", ru: "Направление" },
          { en: "Cause", uz: "Sabab", ru: "Причина" },
          { en: "Purpose", uz: "Maqsad", ru: "Цель" },
        ],
      },
      {
        label: POS_G.func,
        subs: [
          {
            en: "Prepositional phrase marker",
            uz: "Predlogli birikma belgisi",
            ru: "Маркер предложной группы",
          },
        ],
      },
    ],
    ex: ["in", "on", "under"],
  },
  {
    name: { en: "Adjective", uz: "Sifat", ru: "Прилагательное" },
    def: {
      en: "Describes or modifies a noun or pronoun.",
      uz: "Ot yoki olmoshni tavsiflaydi.",
      ru: "Описывает существительное или местоимение.",
    },
    groups: [
      {
        label: POS_G.formation,
        subs: [
          { en: "Simple", uz: "Sodda", ru: "Простое" },
          { en: "Derived", uz: "Yasama", ru: "Производное" },
          { en: "Compound", uz: "Qo'shma", ru: "Сложное" },
        ],
      },
      {
        label: POS_G.types,
        subs: [
          { en: "Descriptive", uz: "Tavsifiy", ru: "Описательное" },
          { en: "Limiting", uz: "Chegaralovchi", ru: "Ограничительное" },
          { en: "Possessive", uz: "Egalik", ru: "Притяжательное" },
          { en: "Numerical", uz: "Sonli", ru: "Числовое" },
        ],
      },
      {
        label: POS_G.degrees,
        subs: [
          { en: "Positive", uz: "Oddiy", ru: "Положительная" },
          { en: "Comparative", uz: "Qiyosiy", ru: "Сравнительная" },
          { en: "Superlative", uz: "Orttirma", ru: "Превосходная" },
        ],
      },
      {
        label: POS_G.order,
        subs: [
          { en: "1 Opinion", uz: "1 Fikr", ru: "1 Мнение" },
          { en: "2 Size", uz: "2 O'lcham", ru: "2 Размер" },
          { en: "3 Age", uz: "3 Yosh", ru: "3 Возраст" },
          { en: "4 Shape", uz: "4 Shakl", ru: "4 Форма" },
          { en: "5 Color", uz: "5 Rang", ru: "5 Цвет" },
          { en: "6 Origin", uz: "6 Kelib chiqish", ru: "6 Происхождение" },
          { en: "7 Material", uz: "7 Material", ru: "7 Материал" },
          { en: "8 Purpose", uz: "8 Maqsad", ru: "8 Назначение" },
        ],
      },
      {
        label: POS_G.func,
        subs: [
          { en: "Modifier", uz: "Aniqlovchi", ru: "Определение" },
          {
            en: "Subject complement",
            uz: "Ega komplementi",
            ru: "Комплемент подлежащего",
          },
          {
            en: "Object complement",
            uz: "To'ldiruvchi komplementi",
            ru: "Комплемент дополнения",
          },
        ],
      },
    ],
    ex: ["tall", "red", "beautiful"],
  },
  {
    name: { en: "Number", uz: "Son", ru: "Числительное" },
    def: {
      en: "Shows quantity, order, or numerical identity.",
      uz: "Miqdor, tartib yoki raqamni ko'rsatadi.",
      ru: "Показывает количество, порядок или номер.",
    },
    groups: [
      {
        label: POS_G.types,
        subs: [
          { en: "Cardinal", uz: "Sanoq", ru: "Количественное" },
          { en: "Ordinal", uz: "Tartib", ru: "Порядковое" },
          { en: "Multiplicative", uz: "Karrali", ru: "Кратное" },
        ],
      },
      {
        label: POS_G.func,
        subs: [
          { en: "Count", uz: "Sanoq", ru: "Счёт" },
          { en: "Order", uz: "Tartib", ru: "Порядок" },
        ],
      },
    ],
    ex: ["one", "first", "double"],
  },
  {
    name: { en: "Verb", uz: "Fe'l", ru: "Глагол" },
    def: {
      en: "Shows action, state of being.",
      uz: "Harakat yoki holatni bildiradi.",
      ru: "Обозначает действие или состояние.",
    },
    groups: [
      {
        label: POS_G.formation,
        subs: [
          { en: "Simple", uz: "Sodda", ru: "Простой" },
          { en: "Derived", uz: "Yasama", ru: "Производный" },
          { en: "Compound", uz: "Qo'shma", ru: "Сложный" },
          { en: "Phrasal", uz: "Frazali", ru: "Фразовый" },
        ],
      },
      {
        label: { en: "Tenses", uz: "Zamonlar", ru: "Времена" },
        matrix: {
          cols: [
            { en: "Simple", uz: "Oddiy", ru: "Простой" },
            { en: "Continuous", uz: "Davomiy", ru: "Длительный" },
            { en: "Perfect", uz: "Tugallangan", ru: "Совершенный" },
            {
              en: "Perfect Cont.",
              uz: "Tugal. davomiy",
              ru: "Соверш.-длит.",
            },
          ],
          rows: [
            {
              t: { en: "Present", uz: "Hozirgi", ru: "Настоящее" },
              cells: ["do", "am doing", "have done", "have been doing"],
            },
            {
              t: { en: "Past", uz: "O'tgan", ru: "Прошедшее" },
              cells: ["did", "was doing", "had done", "had been doing"],
            },
            {
              t: { en: "Future", uz: "Kelasi", ru: "Будущее" },
              cells: [
                "will do",
                "will be doing",
                "will have done",
                "will have been doing",
              ],
            },
          ],
        },
      },
      {
        label: POS_G.voice,
        subs: [
          { en: "Active", uz: "Aniq", ru: "Действительный" },
          { en: "Passive", uz: "Majhul", ru: "Страдательный" },
        ],
      },
      { label: POS_G.types, tree: VERB_TYPES },
      {
        label: { en: "Moods", uz: "Mayllar", ru: "Наклонения" },
        subs: [
          { en: "Indicative", uz: "Aniqlik", ru: "Изъявительное" },
          { en: "Imperative", uz: "Buyruq", ru: "Повелительное" },
          { en: "Subjunctive", uz: "Istak", ru: "Сослагательное" },
          { en: "Conditional", uz: "Shart", ru: "Условное" },
        ],
      },
      {
        label: POS_G.func,
        subs: [
          {
            en: "Predicate — main part of the sentence",
            uz: "Kesim — gapning bosh bo'lagi",
            ru: "Сказуемое — главный член предложения",
          },
        ],
      },
    ],
    ex: ["run", "write", "is"],
  },
  {
    name: { en: "Adverb", uz: "Ravish", ru: "Наречие" },
    def: {
      en: "Modifies a verb, adjective, adverb.",
      uz: "Fe'l, sifat yoki butun gapni izohlaydi.",
      ru: "Поясняет глагол, прилагательное или всё предложение.",
    },
    groups: [
      {
        label: POS_G.formation,
        subs: [
          { en: "Simple", uz: "Sodda", ru: "Простое" },
          { en: "Derived", uz: "Yasama", ru: "Производное" },
          { en: "Compound", uz: "Qo'shma", ru: "Сложное" },
          { en: "Composite", uz: "Tarkibli", ru: "Составное" },
        ],
      },
      {
        label: POS_G.types,
        subs: [
          { en: "Time", uz: "Payt", ru: "Времени" },
          { en: "Place", uz: "O'rin", ru: "Места" },
          { en: "Manner", uz: "Tarz", ru: "Образа действия" },
          { en: "Degree", uz: "Daraja", ru: "Степени" },
          { en: "Frequency", uz: "Takror", ru: "Частоты" },
          {
            en: "Purpose · Reason",
            uz: "Maqsad · Sabab",
            ru: "Цели · Причины",
          },
          { en: "Focusing", uz: "Fokus", ru: "Фокусное" },
          { en: "Negative", uz: "Inkor", ru: "Отрицания" },
          { en: "Affirmation", uz: "Tasdiq", ru: "Утверждения" },
          { en: "Conjunctive", uz: "Bog'lovchi", ru: "Союзное" },
          { en: "Evaluative", uz: "Baholovchi", ru: "Оценочное" },
          { en: "Viewpoint", uz: "Nuqtai nazar", ru: "Точки зрения" },
          { en: "Comment", uz: "Izoh", ru: "Комментирующее" },
          { en: "Relative", uz: "Nisbiy", ru: "Относительное" },
          { en: "Certainty", uz: "Ishonch", ru: "Уверенности" },
          { en: "Interrogative", uz: "So'roq", ru: "Вопросительное" },
          { en: "Modal", uz: "Modal", ru: "Модальное" },
          { en: "Attitude", uz: "Munosabat", ru: "Отношения" },
          { en: "Doubt", uz: "Gumon", ru: "Сомнения" },
          { en: "Sentence", uz: "Gap", ru: "Предложения" },
          { en: "Duration", uz: "Davomiylik", ru: "Длительности" },
          { en: "Instrumental", uz: "Vosita", ru: "Инструментальное" },
          { en: "Act-related", uz: "Harakat", ru: "Действия" },
          { en: "Stance", uz: "Pozitsiya", ru: "Позиции" },
          { en: "Additive", uz: "Qo'shimcha", ru: "Добавочное" },
          { en: "Restrictive", uz: "Cheklovchi", ru: "Ограничительное" },
          { en: "Quantity", uz: "Miqdor", ru: "Количества" },
        ],
      },
      {
        label: POS_G.degrees,
        subs: [
          { en: "Positive", uz: "Oddiy", ru: "Положительная" },
          { en: "Comparative", uz: "Qiyosiy", ru: "Сравнительная" },
          { en: "Superlative", uz: "Orttirma", ru: "Превосходная" },
        ],
      },
      {
        label: POS_G.func,
        subs: [
          {
            en: "Verb modifier",
            uz: "Fe'l aniqlovchisi",
            ru: "Модификатор глагола",
          },
          {
            en: "Degree modifier",
            uz: "Daraja aniqlovchisi",
            ru: "Модификатор степени",
          },
          {
            en: "Sentence modifier",
            uz: "Gap aniqlovchisi",
            ru: "Модификатор предложения",
          },
        ],
      },
    ],
    ex: ["quickly", "very", "yesterday"],
  },
  {
    name: { en: "Conjunction", uz: "Bog'lovchi", ru: "Союз" },
    def: {
      en: "Joins words, phrases, clauses, or sentences.",
      uz: "So'z, birikma va gaplarni bog'laydi.",
      ru: "Соединяет слова, словосочетания и предложения.",
    },
    groups: [
      {
        label: POS_G.types,
        subs: [
          { en: "Coordinating", uz: "Teng", ru: "Сочинительный" },
          { en: "Subordinating", uz: "Ergashtiruvchi", ru: "Подчинительный" },
          { en: "Correlative", uz: "Juft", ru: "Парный" },
        ],
      },
      {
        label: POS_G.func,
        subs: [
          {
            en: "Connector · Linker",
            uz: "Bog'lagich",
            ru: "Соединитель",
          },
        ],
      },
    ],
    ex: ["and", "but", "or"],
  },
  {
    name: { en: "Interjection", uz: "Undov", ru: "Междометие" },
    def: {
      en: "Expresses sudden feelings or reactions.",
      uz: "To'satdan his-tuyg'uni bildiradi.",
      ru: "Выражает внезапные чувства.",
    },
    groups: [
      {
        label: POS_G.meaning,
        subs: [
          { en: "Emotion", uz: "His", ru: "Эмоция" },
          { en: "Greeting", uz: "Salomlashish", ru: "Приветствие" },
          { en: "Surprise", uz: "Hayrat", ru: "Удивление" },
          { en: "Pain", uz: "Og'riq", ru: "Боль" },
        ],
      },
      {
        label: POS_G.func,
        subs: [
          {
            en: "Independent expression",
            uz: "Mustaqil ifoda",
            ru: "Независимое выражение",
          },
        ],
      },
    ],
    ex: ["wow!", "oh!", "ouch!"],
  },
];
