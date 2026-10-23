import type { Str } from "./types";

export const nav = {
  keyboard: { en: "Keyboard", uz: "Klaviatura", ru: "Клавиатура" },
  english: { en: "English", uz: "Ingliz tili", ru: "Английский" },
  /* "Кодинг", not "Программирование" — a short title like its neighbours in
     the Learn menu and the mobile sheet. */
  coding: { en: "Coding", uz: "Dasturlash", ru: "Кодинг" },
  subject: { en: "Subjects", uz: "Fanlar", ru: "Предметы" },
  books: { en: "Books", uz: "Kitoblar", ru: "Книги" },
  /* The "Learn" menu: one short line under each learning area. */
  learn: { en: "Learn", uz: "O'rganish", ru: "Обучение" },
  keyboardDesc: {
    en: "Type fast with all ten fingers",
    uz: "O'n barmoq bilan tez yozing",
    ru: "Печатай быстро десятью пальцами",
  },
  englishDesc: {
    en: "Letters, sounds and spelling",
    uz: "Harflar, tovushlar va imlo",
    ru: "Буквы, звуки и правописание",
  },
  codingDesc: {
    en: "Learn to code by typing",
    uz: "Kod yozib dasturlashni o'rganing",
    ru: "Учись программировать, печатая код",
  },
  subjectDesc: {
    en: "School subjects for every grade",
    uz: "Har bir sinf uchun maktab fanlari",
    ru: "Школьные предметы по классам",
  },
  booksDesc: {
    en: "Type pages from real books",
    uz: "Haqiqiy kitoblardan sahifa yozing",
    ru: "Печатай страницы из настоящих книг",
  },
  games: { en: "Games", uz: "O'yinlar", ru: "Игры" },
  compete: { en: "Compete", uz: "Bellashuv", ru: "Соревнование" },
  stats: { en: "Stats", uz: "Statistika", ru: "Статистика" },
  pricing: { en: "Pricing", uz: "Narxlar", ru: "Цены" },
  login: { en: "Log in", uz: "Kirish", ru: "Войти" },
  signup: { en: "Sign up", uz: "Ro'yxatdan o'tish", ru: "Регистрация" },
  language: { en: "Language", uz: "Til", ru: "Язык" },
  darkMode: { en: "Dark mode", uz: "Qorong'i rejim", ru: "Тёмная тема" },
  lightMode: { en: "Light mode", uz: "Yorug' rejim", ru: "Светлая тема" },
  logout: { en: "Log out", uz: "Chiqish", ru: "Выйти" },
  account: { en: "Account", uz: "Hisob", ru: "Аккаунт" },
  menu: { en: "Menu", uz: "Menyu", ru: "Меню" },
  closeMenu: { en: "Close menu", uz: "Menyuni yopish", ru: "Закрыть меню" },
} satisfies Record<string, Str>;
