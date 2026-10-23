import type { Str } from "./types";

/* The coding catalogue — stages → tracks → module blocks (lib/coding.ts) */
export const coding = {
  title: { en: "Coding", uz: "Dasturlash", ru: "Кодинг" },
  subtitle: {
    en: "Learn to code and to type it fast — in the same place.",
    uz: "Kod yozishni va uni tez terishni bir joyda o'rgan.",
    ru: "Учись писать код и быстро его набирать — в одном месте.",
  },
  ladder: {
    en: "From first click to master, step by step.",
    uz: "Birinchi bosishdan ustalikkacha — bosqichma-bosqich.",
    ru: "От первого клика до мастера — шаг за шагом.",
  },
  stagesLabel: { en: "stages", uz: "bosqich", ru: "ступеней" },
  tracksLabel: { en: "tracks", uz: "yo'nalish", ru: "направлений" },
  modulesLabel: { en: "blocks", uz: "blok", ru: "блоков" },
  stage: { en: "Stage", uz: "Bosqich", ru: "Ступень" },
  blocks: { en: "Blocks", uz: "Bloklar", ru: "Блоки" },
  typingFocus: {
    en: "Keys you will drill",
    uz: "Mashq qilinadigan tugmalar",
    ru: "Клавиши для отработки",
  },
  youWillType: { en: "You will type", uz: "Sen teradigan kod", ru: "Ты будешь набирать" },
  backToTracks: {
    en: "Back to all tracks",
    uz: "Barcha yo'nalishlarga",
    ru: "Ко всем направлениям",
  },
  notReady: {
    en: "Lessons are still being written. This is the plan you will follow.",
    uz: "Darslar hali yozilmoqda. Bu — sen boradigan reja.",
    ru: "Уроки ещё пишутся. Это план, по которому ты пойдёшь.",
  },
} satisfies Record<string, Str>;
