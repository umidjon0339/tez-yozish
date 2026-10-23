import type { Str } from "./types";

export const pricing = {
  /* Header */
  title: {
    en: "One plan. Everything open.",
    uz: "Bitta reja. Hammasi ochiq.",
    ru: "Один план. Всё открыто.",
  },
  pillLessons: { en: "{n} lessons", uz: "{n} ta dars", ru: "{n} уроков" },
  pillGames: { en: "{n} games", uz: "{n} ta o'yin", ru: "{n} игр" },
  pillLangs: { en: "3 languages", uz: "3 ta til", ru: "3 языка" },
  /* Feature showcase */
  f1Label: { en: "Full course", uz: "To'liq kurs", ru: "Весь курс" },
  f1Title: {
    en: "The whole course, key by key",
    uz: "Butun kurs — tugma-tugma",
    ru: "Весь курс — клавиша за клавишей",
  },
  f1b1: {
    en: "{n} lessons in {s} sections",
    uz: "{s} ta bo'limda {n} ta dars",
    ru: "{n} уроков в {s} разделах",
  },
  f1b2: {
    en: "Letters, numbers, symbols and shortcuts",
    uz: "Harflar, raqamlar, belgilar va tezkor tugmalar",
    ru: "Буквы, цифры, символы и горячие клавиши",
  },
  f1b3: {
    en: "Tests with stars after every block",
    uz: "Har bir blokdan keyin yulduzli testlar",
    ru: "Тесты со звёздами после каждого блока",
  },
  /* {n} and {names} are filled from lib/games — never type a count or a
     game name here, or the page drifts the moment a game ships. */
  f2Label: { en: "{n} games", uz: "{n} o'yin", ru: "{n} игр" },
  f2Title: {
    en: "{n} typing games",
    uz: "{n} ta yozish o'yini",
    ru: "{n} игр на печать",
  },
  f2b1: { en: "{names}", uz: "{names}", ru: "{names}" },
  f2b2: { en: "{names}", uz: "{names}", ru: "{names}" },
  f2b3: {
    en: "Every game speeds up as you do",
    uz: "Sen tezlashsang, o'yin ham tezlashadi",
    ru: "Чем быстрее ты — тем быстрее игра",
  },
  f3Label: {
    en: "English lab",
    uz: "Ingliz laboratoriyasi",
    ru: "Английская лаборатория",
  },
  f3Title: {
    en: "Letters, sounds and spelling",
    uz: "Harflar, tovushlar va imlo",
    ru: "Буквы, звуки и письмо",
  },
  f3b1: {
    en: "26 letters with their codes: Morse, Braille, ASL",
    uz: "26 harf va kodlari: Morze, Brayl, ASL",
    ru: "26 букв с кодами: Морзе, Брайль, ASL",
  },
  f3b2: {
    en: "50 sounds and their shades",
    uz: "50 ta tovush va ularning tuslari",
    ru: "50 звуков и их оттенки",
  },
  f3b3: {
    en: "Sound → letters spelling practice",
    uz: "Tovush → harflar: imlo mashqi",
    ru: "Звук → буквы: тренировка письма",
  },
  f4Label: { en: "Hands guide", uz: "Qo'l yo'riqchisi", ru: "Подсказка рук" },
  f4Title: {
    en: "A live keyboard and live hands",
    uz: "Jonli klaviatura va jonli qo'llar",
    ru: "Живая клавиатура и живые руки",
  },
  f4b1: {
    en: "A colour zone for every finger",
    uz: "Har bir barmoq uchun rangli zona",
    ru: "Своя цветная зона для каждого пальца",
  },
  f4b2: {
    en: "4 colour palettes, 2 hand styles",
    uz: "4 xil rang to'plami, 2 xil qo'l uslubi",
    ru: "4 палитры, 2 стиля рук",
  },
  f4b3: {
    en: "Key sounds you can switch off",
    uz: "O'chirsa bo'ladigan tugma ovozlari",
    ru: "Звук клавиш можно выключить",
  },
  f5Label: { en: "Statistics", uz: "Statistika", ru: "Статистика" },
  f5Title: {
    en: "Every keystroke, counted",
    uz: "Har bir bosish hisobda",
    ru: "Каждое нажатие посчитано",
  },
  f5b1: {
    en: "Speed and accuracy history",
    uz: "Tezlik va aniqlik tarixi",
    ru: "История скорости и точности",
  },
  f5b2: {
    en: "Error map for every key and finger",
    uz: "Har tugma va barmoq bo'yicha xato xaritasi",
    ru: "Карта ошибок по каждой клавише и пальцу",
  },
  f5b3: {
    en: "Practice calendar and records",
    uz: "Mashq taqvimi va rekordlar",
    ru: "Календарь практики и рекорды",
  },
  f6Label: { en: "Compete", uz: "Bellashuv", ru: "Соревнование" },
  f6Title: {
    en: "See where you stand",
    uz: "Qayerda turganingni ko'r",
    ru: "Узнай, где ты",
  },
  f6b1: {
    en: "Today and all-time leaderboards",
    uz: "Bugungi va umumiy reyting",
    ru: "Рейтинг за сегодня и за всё время",
  },
  f6b2: {
    en: "A world speed map with your place on it",
    uz: "Dunyo tezlik xaritasi va undagi o'rning",
    ru: "Карта скоростей мира и твоё место на ней",
  },
  f6b3: {
    en: "Your own record, always on top",
    uz: "Shaxsiy rekording doim tepada",
    ru: "Твой личный рекорд всегда сверху",
  },
  /* Coding / Books / Exams — the units the product gained after the first
     seven tabs were written. Counts come from lib/coding, lib/exams and
     lib/k12, so these strings never restate a catalogue's size. */
  f8Label: { en: "Coding", uz: "Dasturlash", ru: "Кодинг" },
  f8Title: {
    en: "Learn to code while you type",
    uz: "Yozayotib dasturlashni o'rgan",
    ru: "Учись коду, пока печатаешь",
  },
  f8b1: {
    en: "{n} fields over {s} stages, beginner to master",
    uz: "{s} bosqichda {n} yo'nalish — boshlang'ichdan ustagacha",
    ru: "{n} направлений на {s} ступенях — от новичка до мастера",
  },
  f8b2: {
    en: "{n} chapter blocks, from first steps to hacking",
    uz: "{n} ta blok — birinchi qadamdan xakerlikkacha",
    ru: "{n} блоков — от первых шагов до хакинга",
  },
  f8b3: {
    en: "Drills on the symbol keys code needs most",
    uz: "Kodda eng kerakli belgilar uchun mashq",
    ru: "Тренировка символов, нужных коду чаще всего",
  },
  f9Label: { en: "Books", uz: "Kitoblar", ru: "Книги" },
  f9Title: {
    en: "Type whole books, page by page",
    uz: "Butun kitobni sahifama-sahifa yoz",
    ru: "Печатай целые книги, страница за страницей",
  },
  f9b1: {
    en: "Real long text, not just short drills",
    uz: "Qisqa mashq emas — haqiqiy uzun matn",
    ru: "Настоящий длинный текст, а не короткие упражнения",
  },
  f9b2: {
    en: "Add your own book: paste it and practise",
    uz: "O'z kitobingni qo'sh: matnni joyla va mashq qil",
    ru: "Добавь свою книгу: вставь текст и тренируйся",
  },
  f9b3: {
    en: "Split into chapters and topics, best speed kept",
    uz: "Bob va mavzularga bo'linadi, eng yaxshi tezlik saqlanadi",
    ru: "Делится на главы и темы, лучший результат сохраняется",
  },
  f10Label: { en: "School", uz: "Maktab", ru: "Школа" },
  f10Title: {
    en: "Exams and school subjects",
    uz: "Imtihonlar va maktab fanlari",
    ru: "Экзамены и школьные предметы",
  },
  f10b1: {
    en: "Every subject of grades 1-{s}, {n} in all",
    uz: "1-{s} sinf fanlari — jami {n} ta",
    ru: "Предметы 1-{s} классов — всего {n}",
  },
  f10b2: {
    en: "{n} exams, broken into their real parts",
    uz: "{n} ta imtihon — haqiqiy qismlariga bo'lingan",
    ru: "{n} экзаменов, разобранных по частям",
  },
  f10b3: {
    en: "Our own typing certificate at the end",
    uz: "Oxirida o'zimizning yozuv sertifikatimiz",
    ru: "В конце — наш собственный сертификат по печати",
  },
  f7Label: { en: "Comfort", uz: "Qulaylik", ru: "Удобство" },
  f7Title: {
    en: "Made to sit with for an hour",
    uz: "Bir soat o'tirib mashq qilgani qulay",
    ru: "Чтобы сидеть за ним хоть час",
  },
  f7b1: {
    en: "English, O'zbek, Русский",
    uz: "English, O'zbek, Русский",
    ru: "English, O'zbek, Русский",
  },
  f7b2: {
    en: "Light and dark theme",
    uz: "Yorug' va qorong'i mavzu",
    ru: "Светлая и тёмная тема",
  },
  f7b3: {
    en: "Works on a laptop, tablet or PC",
    uz: "Noutbuk, planshet va kompyuterda ishlaydi",
    ru: "Работает на ноутбуке, планшете и ПК",
  },
  /* Plan card */
  planName: { en: "Pro", uz: "Pro", ru: "Pro" },
  month1: { en: "1 month", uz: "1 oy", ru: "1 месяц" },
  months6: { en: "6 months", uz: "6 oy", ru: "6 месяцев" },
  months12: { en: "12 months", uz: "12 oy", ru: "12 месяцев" },
  perMonth: { en: "{n} / month", uz: "{n} / oy", ru: "{n} / мес" },
  bestValue: { en: "Best value", uz: "Eng foydali", ru: "Самое выгодное" },
  popular: { en: "Most chosen", uz: "Ko'p tanlanadi", ru: "Чаще всего берут" },
  youSave: { en: "You save {n}", uz: "{n} tejaysan", ru: "Экономия {n}" },
  total: { en: "Total", uz: "Jami", ru: "Итого" },
  oncePay: {
    en: "One payment for the whole period",
    uz: "Butun muddat uchun bitta to'lov",
    ru: "Один платёж за весь срок",
  },
  monthlyPay: {
    en: "Paid month by month",
    uz: "Har oy to'lanadi",
    ru: "Оплата помесячно",
  },
  cta: { en: "Get Pro", uz: "Pro olish", ru: "Купить Pro" },
  orderTitle: { en: "Your order", uz: "Buyurtmang", ru: "Твой заказ" },
  orderSoon: {
    en: "Payment isn't connected yet — it will open right here.",
    uz: "To'lov hali ulanmagan — u shu yerda ochiladi.",
    ru: "Оплата ещё не подключена — она откроется прямо здесь.",
  },
  close: { en: "Close", uz: "Yopish", ru: "Закрыть" },
  /* Included list + FAQ */
  includedTitle: {
    en: "Everything in Pro",
    uz: "Pro ichida nima bor",
    ru: "Что входит в Pro",
  },
  faqTitle: { en: "Questions", uz: "Savollar", ru: "Вопросы" },
  q1: {
    en: "Can I try it before I pay?",
    uz: "To'lashdan oldin sinab ko'rsam bo'ladimi?",
    ru: "Можно попробовать до оплаты?",
  },
  a1: {
    en: "Yes. Open the first lessons and the games and see how they feel. Take Pro when you are ready to go all the way.",
    uz: "Ha. Birinchi darslar va o'yinlarni ochib ko'r. Oxirigacha borishga tayyor bo'lganingda Pro ol.",
    ru: "Да. Открой первые уроки и игры, посмотри, как они. А Pro возьми, когда решишь идти до конца.",
  },
  q2: {
    en: "What happens when my period ends?",
    uz: "Muddat tugagach nima bo'ladi?",
    ru: "Что будет, когда срок закончится?",
  },
  a2: {
    en: "Nothing is deleted. Your lessons, stars and statistics stay on your account — turn Pro back on and carry on from the same place.",
    uz: "Hech narsa o'chmaydi. Darslaring, yulduzlaring va statistikang hisobingda qoladi — Pro'ni qayta yoqib, o'sha joydan davom etasan.",
    ru: "Ничего не удаляется. Уроки, звёзды и статистика остаются в аккаунте — включи Pro снова и продолжай с того же места.",
  },
  q3: {
    en: "Is the 6- or 12-month price a single payment?",
    uz: "6 yoki 12 oylik narx bitta to'lovmi?",
    ru: "6 или 12 месяцев — это один платёж?",
  },
  a3: {
    en: "Yes. You pay once for the whole period and the discount is already inside the price. Nothing renews by itself.",
    uz: "Ha. Butun muddat uchun bir marta to'laysan, chegirma narx ichida. Hech narsa o'z-o'zidan uzaytirilmaydi.",
    ru: "Да. Ты платишь один раз за весь срок, скидка уже в цене. Ничего не продлевается само.",
  },
  q4: {
    en: "Can two children share one account?",
    uz: "Ikki bola bitta hisobdan foydalansa bo'ladimi?",
    ru: "Могут ли два ребёнка пользоваться одним аккаунтом?",
  },
  a4: {
    en: "Better not — speed, mistakes and stars are saved per account. With one account each, every child sees their own real progress.",
    uz: "Yaxshisi yo'q — tezlik, xatolar va yulduzlar har bir hisobga alohida yoziladi. Alohida hisobda har bir bola o'z haqiqiy o'sishini ko'radi.",
    ru: "Лучше нет — скорость, ошибки и звёзды пишутся в каждый аккаунт отдельно. С отдельными аккаунтами каждый видит свой настоящий рост.",
  },
  soum: { en: "so'm", uz: "so'm", ru: "сум" },
} satisfies Record<string, Str>;
