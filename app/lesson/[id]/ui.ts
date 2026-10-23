import type { Locale } from "@/lib/core/locale";

// Small chrome strings (lesson data itself is localized in lessons.json)
export const UI = {
  step: { en: "Step", uz: "Qadam", ru: "Шаг" },
  home: { en: "Home", uz: "Bosh sahifa", ru: "Главная" },
  backToCourse: { en: "Back to course", uz: "Kursga qaytish", ru: "Назад к курсу" },
  colorfulKeys: { en: "Key colors", uz: "Tugma ranglari", ru: "Цвета клавиш" },
  handsOverlay: { en: "Show hands", uz: "Qo'llarni ko'rsatish", ru: "Показать руки" },
  sound: { en: "Sound", uz: "Ovoz", ru: "Звук" },
  darkMode: { en: "Dark mode", uz: "Tungi rejim", ru: "Тёмная тема" },
  viewportNames: {
    POSTURE_CHECK: { en: "Posture", uz: "Holat", ru: "Поза" },
    KEY_INTRO: { en: "New Key", uz: "Yangi tugma", ru: "Новая клавиша" },
    STANDARD_GYM: { en: "Practice", uz: "Mashq", ru: "Практика" },
    GAME_NINJA_RUN: { en: "Game", uz: "O'yin", ru: "Игра" },
    CHAT_SIM: { en: "Chat", uz: "Chat", ru: "Чат" },
    SHORTCUT_DOJO: { en: "Shortcuts", uz: "Tez tugmalar", ru: "Комбинации" },
  } as Record<string, Record<Locale, string>>,
  chapterShort: { en: "Ch", uz: "Bob", ru: "Гл." },
  keysLabel: { en: "Keys", uz: "Tugmalar", ru: "Клавиши" },
  practiceHeading: { en: "Practice", uz: "Mashqlar", ru: "Практика" },
  gamesHeading: { en: "Games", uz: "O'yinlar", ru: "Игры" },
  prev: { en: "← Prev", uz: "← Orqaga", ru: "← Назад" },
  skip: { en: "Skip →", uz: "O'tkazish →", ru: "Пропустить →" },
  layoutWarning: {
    en: "Your keyboard is typing Cyrillic letters — switch it to the English (Latin) layout to practice.",
    uz: "Klaviaturangiz kirill harflarini yozmoqda — mashq qilish uchun ingliz (lotin) alifbosiga o'tkazing.",
    ru: "Ваша клавиатура печатает кириллицу — переключите раскладку на английскую (латиницу).",
  },
  mobileTitle: {
    en: "A real keyboard is needed",
    uz: "Haqiqiy klaviatura kerak",
    ru: "Нужна настоящая клавиатура",
  },
  mobileBody: {
    en: "This trainer teaches ten-finger typing, so it needs a computer with a physical keyboard. Open this page on a computer!",
    uz: "Bu trenajyor o'n barmoqda yozishni o'rgatadi, shuning uchun unga klaviaturali kompyuter kerak. Bu sahifani kompyuterda oching!",
    ru: "Этот тренажёр учит десятипальцевой печати, поэтому нужен компьютер с клавиатурой. Откройте эту страницу на компьютере!",
  },
  backToCourses: {
    en: "← Back to Courses",
    uz: "← Kurslarga qaytish",
    ru: "← К курсам",
  },
  lockedTitle: {
    en: "This lesson is locked",
    uz: "Bu dars hali yopiq",
    ru: "Этот урок пока закрыт",
  },
  lockedNeedStars: {
    en: 'Earn {n}★ in "{title}" to unlock it',
    uz: '"{title}" darsida {n}★ oling — shunda bu dars ochiladi',
    ru: 'Наберите {n}★ в уроке «{title}», чтобы открыть его',
  },
  lockedNeedFinish: {
    en: 'Finish "{title}" first',
    uz: 'Avval "{title}" darsini tugating',
    ru: 'Сначала завершите урок «{title}»',
  },
  goToPrev: {
    en: "Go to lesson",
    uz: "Darsga o'tish",
    ru: "Перейти к уроку",
  },
  unlockHint: {
    en: "Earn {n}★ to unlock the next lesson",
    uz: "Keyingi darsni ochish uchun {n}★ oling",
    ru: "Наберите {n}★, чтобы открыть следующий урок",
  },
  pressHintRetry: {
    en: "Enter — practice again",
    uz: "Enter — qayta mashq",
    ru: "Enter — ещё раз",
  },
};
