import type { Str } from "./types";

export const compete = {
  title: { en: "Compete", uz: "Bellashuv", ru: "Соревнование" },
  subtitle: {
    en: "The fastest typists in the world — live from Monkeytype.",
    uz: "Dunyoning eng tez yozuvchilari — Monkeytype'dan jonli.",
    ru: "Самые быстрые печатающие в мире — прямо с Monkeytype.",
  },
  tabDaily: { en: "Today", uz: "Bugun", ru: "Сегодня" },
  tabAllTime: { en: "All time", uz: "Umumiy", ru: "За всё время" },
  yourBest: {
    en: "Your best",
    uz: "Sizning rekordingiz",
    ru: "Твой рекорд",
  },
  fasterThan: {
    en: "Faster than {p}% of the world",
    uz: "Dunyoning {p} foizidan tezroq",
    ru: "Быстрее {p}% мира",
  },
  noPersonal: {
    en: "Finish a lesson to see your speed here.",
    uz: "Tezligingni bu yerda ko'rish uchun bitta darsni tugat.",
    ru: "Пройди урок — и твоя скорость появится здесь.",
  },
  colPlayer: { en: "Player", uz: "O'yinchi", ru: "Игрок" },
  colSpeed: { en: "Speed", uz: "Tezlik", ru: "Скорость" },
  colAccuracy: { en: "Accuracy", uz: "Aniqlik", ru: "Точность" },
  colWhen: { en: "When", uz: "Qachon", ru: "Когда" },
  players: { en: "players", uz: "o'yinchi", ru: "игроков" },
  pageOf: {
    en: "Page {a} of {b}",
    uz: "Sahifa {a} / {b}",
    ru: "Страница {a} из {b}",
  },
  prevPage: {
    en: "Previous page",
    uz: "Oldingi sahifa",
    ru: "Предыдущая страница",
  },
  nextPage: {
    en: "Next page",
    uz: "Keyingi sahifa",
    ru: "Следующая страница",
  },
  errorTitle: {
    en: "Couldn't load the leaderboard",
    uz: "Reyting yuklanmadi",
    ru: "Не удалось загрузить рейтинг",
  },
  errorBody: {
    en: "Check your internet and try again.",
    uz: "Internetni tekshirib, qayta urinib ko'r.",
    ru: "Проверь интернет и попробуй ещё раз.",
  },
  retry: {
    en: "Try again",
    uz: "Qayta urinish",
    ru: "Попробовать ещё раз",
  },
  liveFrom: {
    en: "Live data from monkeytype.com",
    uz: "Jonli ma'lumot: monkeytype.com",
    ru: "Живые данные с monkeytype.com",
  },
  colXp: { en: "XP", uz: "XP", ru: "XP" },
  colLastActive: {
    en: "Last active",
    uz: "Oxirgi faollik",
    ru: "Активность",
  },
  entryBar: {
    en: "To enter today: {n}+ WPM",
    uz: "Kirish uchun: {n}+ so'z/daq",
    ru: "Для входа: {n}+ сл/мин",
  },
  histTitle: {
    en: "World speed map",
    uz: "Dunyo tezlik xaritasi",
    ru: "Карта скоростей мира",
  },
  histDesc: {
    en: "How fast people type on Monkeytype — and where you are.",
    uz: "Odamlar Monkeytype'da qanchalik tez yozadi — va sen qayerdasan.",
    ru: "Как быстро печатают люди на Monkeytype — и где ты.",
  },
  histTests: { en: "tests", uz: "test", ru: "тестов" },
  youLabel: { en: "You", uz: "Sen", ru: "Ты" },
  pulseTests: {
    en: "tests completed on Monkeytype",
    uz: "Monkeytype'da tugatilgan testlar",
    ru: "тестов завершено на Monkeytype",
  },
  pulseYears: {
    en: "years typed by everyone together",
    uz: "hamma birgalikda yozgan yillar",
    ru: "лет печати всеми вместе",
  },
} satisfies Record<string, Str>;
