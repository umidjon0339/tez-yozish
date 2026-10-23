import type { Str } from "./types";

export const notFound = {
  title: { en: "Page not found", uz: "Sahifa topilmadi", ru: "Страница не найдена" },
  body: {
    en: "The page you're looking for doesn't exist or may have been moved.",
    uz: "Siz izlagan sahifa yo'q yoki boshqa joyga ko'chirilgan.",
    ru: "Такой страницы нет, или её переместили.",
  },
  home: { en: "← Home", uz: "← Bosh sahifa", ru: "← На главную" },
  courses: { en: "Courses", uz: "Kurslar", ru: "Курсы" },
} satisfies Record<string, Str>;
