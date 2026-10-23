import type { Str } from "./types";

export const nav = {
  keyboard: { en: "Keyboard", uz: "Klaviatura", ru: "Клавиатура" },
  english: { en: "English", uz: "Ingliz tili", ru: "Английский" },
  /* "Кодинг", not "Программирование" — the long form is ~130px and would
     cost the centred link row every laptop under ~1400px (app-shell.md §2). */
  coding: { en: "Coding", uz: "Dasturlash", ru: "Кодинг" },
  subject: { en: "Subjects", uz: "Fanlar", ru: "Предметы" },
  books: { en: "Books", uz: "Kitoblar", ru: "Книги" },
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
