import type { Str } from "./types";

export const courses = {
  title: { en: "Courses", uz: "Kurslar", ru: "Курсы" },
  backToSections: {
    en: "Back to Sections",
    uz: "Bo'limlarga qaytish",
    ru: "К разделам",
  },
  /* The exam catalogue (lib/exams.ts) */
  examsGroup: { en: "Exams", uz: "Imtihonlar", ru: "Экзамены" },
  /* Counted ("4 parts") vs used as a heading — Russian needs a different
     case for each, so they cannot be the same string. */
  parts: { en: "parts", uz: "qism", ru: "частей" },
  partsLabel: { en: "Parts", uz: "Qismlar", ru: "Части" },
  /* Badge on the house certificate, so it is not mistaken for a third
     party's exam sitting in the same grid. */
  ourExam: { en: "Ours", uz: "Bizniki", ru: "Наш" },
  score: { en: "Score", uz: "Ball", ru: "Балл" },
  backToExams: {
    en: "Back to Exams",
    uz: "Imtihonlarga qaytish",
    ru: "К экзаменам",
  },
  /* The K-12 grade → subject tree (lib/k12.ts) */
  k12Group: {
    en: "School subjects",
    uz: "Maktab fanlari",
    ru: "Школьные предметы",
  },
  backToGrades: {
    en: "Back to Grades",
    uz: "Sinflarga qaytish",
    ru: "К классам",
  },
  subjectsGroup: {
    en: "Subjects",
    uz: "Fanlar",
    ru: "Предметы",
  },
  subjectCount: {
    en: "subjects",
    uz: "ta fan",
    ru: "предметов",
  },
} satisfies Record<string, Str>;
