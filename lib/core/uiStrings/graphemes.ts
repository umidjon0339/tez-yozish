import type { Str } from "./types";

export const graphemes = {
  title: { en: "Graphemes", uz: "Grafemalar", ru: "Графемы" },
  soundSpellings: {
    en: "Sound spellings",
    uz: "Tovush yozilishlari",
    ru: "Написание звуков",
  },
  subtitle: {
    en: "Every spelling and the sounds it makes. Click one to learn it.",
    uz: "Har bir yozilish va uning tovushlari. O'rganish uchun bos.",
    ru: "Каждое написание и его звуки. Нажми, чтобы выучить.",
  },
  spellingsSubtitle: {
    en: "Every sound and the ways to write it. Click one to learn it.",
    uz: "Har bir tovush va uni yozish usullari. O'rganish uchun bos.",
    ru: "Каждый звук и способы его записи. Нажми, чтобы выучить.",
  },
  backToGraphemes: {
    en: "← All graphemes",
    uz: "← Barcha grafemalar",
    ru: "← Все графемы",
  },
  backToSpellings: {
    en: "← All sound spellings",
    uz: "← Barcha tovush yozilishlari",
    ru: "← Все написания звуков",
  },
  unknown: {
    en: "This page does not exist.",
    uz: "Bunday sahifa yo'q.",
    ru: "Такой страницы нет.",
  },
  prev: { en: "Previous", uz: "Oldingi", ru: "Предыдущий" },
  next: { en: "Next", uz: "Keyingi", ru: "Следующий" },
  soundsItMakes: {
    en: "Sounds it makes",
    uz: "Chiqaradigan tovushlari",
    ru: "Какие звуки даёт",
  },
  waysToWrite: {
    en: "Ways to write it",
    uz: "Yozish usullari",
    ru: "Способы записи",
  },
  countSpellings: {
    en: "{n} spellings",
    uz: "{n} ta yozilish",
    ru: "{n} написаний",
  },
  multiSoundTitle: {
    en: "One spelling — two sounds",
    uz: "Bitta yozilish — ikki tovush",
    ru: "Одно написание — два звука",
  },
  multiSoundCaption: {
    en: "These spellings can sound different ways. Click one to learn when.",
    uz: "Bu yozilishlar turlicha eshitilishi mumkin. Qachonligini bilish uchun bos.",
    ru: "Эти написания могут звучать по-разному. Нажми, чтобы узнать когда.",
  },
  manySpellTitle: {
    en: "One sound — many spellings",
    uz: "Bitta tovush — ko'p yozilish",
    ru: "Один звук — много написаний",
  },
  manySpellCaption: {
    en: "The same sound can be written in several ways. Click one to learn them.",
    uz: "Bir xil tovush bir necha usulda yoziladi. O'rganish uchun bos.",
    ru: "Один и тот же звук пишется по-разному. Нажми, чтобы выучить.",
  },
} satisfies Record<string, Str>;
