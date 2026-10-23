import type { Str } from "./types";

export const games = {
  title: { en: "Games", uz: "O'yinlar", ru: "Игры" },
  /* Labels for the like heart and the play counter on a game card. The
     counters are this browser's own (lib/gameStats.ts), so the words say
     "you", not "players". */
  like: { en: "I like this game", uz: "Bu o'yin menga yoqdi", ru: "Мне нравится эта игра" },
  plays: { en: "times you played", uz: "marta o'ynading", ru: "раз ты играл" },
} satisfies Record<string, Str>;
