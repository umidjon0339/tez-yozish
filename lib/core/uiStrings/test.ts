import type { Str } from "./types";

/* The Monkeytype-style typing test on the home page (docs/home-test.md) */
export const test = {
  punctuation: {
    en: "punctuation",
    uz: "tinish belgilari",
    ru: "пунктуация",
  },
  numbers: { en: "numbers", uz: "raqamlar", ru: "цифры" },
  time: { en: "time", uz: "vaqt", ru: "время" },
  words: { en: "words", uz: "so'zlar", ru: "слова" },
  quote: { en: "quote", uz: "iqtibos", ru: "цитата" },
  /* The reference's `zen` slot is our school-subject picker instead. */
  curriculum: { en: "subject", uz: "fan", ru: "предмет" },
  custom: { en: "custom", uz: "o'zingniki", ru: "свой текст" },
  short: { en: "short", uz: "qisqa", ru: "короткая" },
  medium: { en: "medium", uz: "o'rta", ru: "средняя" },
  long: { en: "long", uz: "uzun", ru: "длинная" },
  all: { en: "all", uz: "hammasi", ru: "все" },
  language: { en: "Text language", uz: "Matn tili", ru: "Язык текста" },
  customTitle: {
    en: "Type your own text",
    uz: "O'z matningni yoz",
    ru: "Свой текст",
  },
  customPlaceholder: {
    en: "Paste or write the words you want to practise…",
    uz: "Mashq qilmoqchi bo'lgan so'zlaringni yoz…",
    ru: "Вставь или напиши слова для тренировки…",
  },
  save: { en: "Save", uz: "Saqlash", ru: "Сохранить" },
  cancel: { en: "Cancel", uz: "Bekor qilish", ru: "Отмена" },
  edit: { en: "edit", uz: "o'zgartirish", ru: "изменить" },
  hintRestart: {
    en: "tab — new test",
    uz: "tab — yangi test",
    ru: "tab — новый тест",
  },
  hintStart: {
    en: "Just start typing",
    uz: "Shunchaki yoza boshla",
    ru: "Просто начни печатать",
  },
  /* Result screen */
  wpm: { en: "wpm", uz: "so'z/daq", ru: "сл/мин" },
  accuracy: { en: "accuracy", uz: "aniqlik", ru: "точность" },
  raw: { en: "raw", uz: "xom tezlik", ru: "сырая" },
  consistency: {
    en: "consistency",
    uz: "barqarorlik",
    ru: "стабильность",
  },
  characters: { en: "characters", uz: "belgilar", ru: "символы" },
  testType: { en: "test type", uz: "test turi", ru: "тип теста" },
  duration: { en: "time", uz: "vaqt", ru: "время" },
  nextTest: { en: "Next test", uz: "Yangi test", ru: "Новый тест" },
  repeat: { en: "Repeat", uz: "Takrorlash", ru: "Повторить" },
  charsHint: {
    en: "correct / wrong / extra / missed",
    uz: "to'g'ri / xato / ortiqcha / tushib qolgan",
    ru: "верно / ошибки / лишние / пропущено",
  },
  /* The podium at the bottom of the result screen (Standing.tsx) */
  /* Names the podium for what it is — the world's fastest typists — so the
     list is not mistaken for anything local. */
  worldRecord: {
    en: "World record",
    uz: "Jahon rekordi",
    ru: "Мировой рекорд",
  },
  youLabel: { en: "you", uz: "sen", ru: "ты" },
  /* Only the hover hint on the podium heading — the result screen prints no
     caption under the board (STR.compete.fasterThan still does, on /compete). */
  boardAllTime: { en: "all-time", uz: "barcha vaqt", ru: "за всё время" },
} satisfies Record<string, Str>;
