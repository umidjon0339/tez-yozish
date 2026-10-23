import type { Str } from "./types";

export const home = {
  titleLine1: {
    en: "Type with your reflexes.",
    uz: "Qo'llaring o'zi yozsin.",
    ru: "Пусть пальцы печатают сами.",
  },
  titleLine2: {
    en: "Think with your mind.",
    uz: "Sen esa faqat o'ylab tur.",
    ru: "А ты просто думай.",
  },
  bodyStart: {
    en: "Learn to type fast with all ten fingers — without looking at the keyboard. Put the mouse away, rest your index fingers on",
    uz: "O'n barmoqda, klaviaturaga qaramasdan tez yozishni o'rgan. Sichqonchani chetga qo'y, ko'rsatkich barmoqlaringni",
    ru: "Научись быстро печатать всеми десятью пальцами — не глядя на клавиатуру. Отложи мышку, поставь указательные пальцы на",
  },
  bodyAnd: { en: "and", uz: "va", ru: "и" },
  bodyEnd: {
    en: ", and start!",
    uz: " tugmalariga qo'y va boshla!",
    ru: " — и вперёд!",
  },
  learnKeyboard: {
    en: "Learn the Keyboard",
    uz: "Klaviaturani o'rganish",
    ru: "Изучить клавиатуру",
  },
  playGames: { en: "Play Games", uz: "O'yin o'ynash", ru: "Играть в игры" },
  /* Hero stage above the keyboard */
  typeHint: {
    en: "Type these keys — your hands will show you how",
    uz: "Shu tugmalarni bos — qo'llar yo'l ko'rsatadi",
    ru: "Нажми эти клавиши — руки покажут как",
  },
  typeDone: {
    en: "Nice! Opening your first lesson…",
    uz: "Zo'r! Birinchi dars ochilmoqda…",
    ru: "Отлично! Открываем первый урок…",
  },
  startHere: { en: "Start here", uz: "Shu yerdan boshla", ru: "Начни здесь" },
  /* Menu cards under the keyboard */
  cardKeyboard: {
    en: "Learn key by key",
    uz: "Tugma-tugma o'rgan",
    ru: "Клавиша за клавишей",
  },
  cardGames: {
    en: "Play and get faster",
    uz: "O'ynab tezlash",
    ru: "Играй и ускоряйся",
  },
  cardEnglish: {
    en: "Sounds and spelling",
    uz: "Tovush va imlo",
    ru: "Звуки и письмо",
  },
  cardSubjects: { en: "All courses", uz: "Barcha kurslar", ru: "Все курсы" },
  cardCompete: {
    en: "Race other typists",
    uz: "Boshqalar bilan bellash",
    ru: "Соревнуйся с другими",
  },
  cardStats: {
    en: "See your progress",
    uz: "O'sishingni ko'r",
    ru: "Смотри свой рост",
  },
  menuTitle: {
    en: "Where do you want to go?",
    uz: "Qayerga bormoqchisan?",
    ru: "Куда хочешь пойти?",
  },
} satisfies Record<string, Str>;
