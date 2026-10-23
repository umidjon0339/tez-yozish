import type { Str } from "./types";

export const auth = {
  signingIn: {
    en: "Signing you in…",
    uz: "Tizimga kiritilmoqda…",
    ru: "Выполняем вход…",
  },
  signInFailed: {
    en: "Sign-in didn't work. Please try again.",
    uz: "Kirish amalga oshmadi. Qaytadan urinib ko'ring.",
    ru: "Войти не получилось. Попробуйте ещё раз.",
  },
  tryAgain: { en: "Try again", uz: "Qayta urinish", ru: "Попробовать ещё раз" },
  backHome: { en: "Back to home", uz: "Bosh sahifaga", ru: "На главную" },
} satisfies Record<string, Str>;
