import type { Str } from "./types";

export const phonemes = {
  title: { en: "Sounds", uz: "Tovushlar", ru: "Звуки" },
  subtitle: {
    en: "Every English word is built from these sounds. Learn to hear them, say them and type the words they live in.",
    uz: "Har bir inglizcha so'z shu tovushlardan yasaladi. Ularni eshitishni, aytishni va so'zlarini terishni o'rgan.",
    ru: "Каждое английское слово собрано из этих звуков. Научись их слышать, говорить и печатать слова с ними.",
  },
  backToPhonemes: {
    en: "Back to sounds",
    uz: "Tovushlarga qaytish",
    ru: "К звукам",
  },
  unknownPhoneme: {
    en: "There is no such sound in English.",
    uz: "Ingliz tilida bunday tovush yo'q.",
    ru: "Такого звука нет в английском языке.",
  },
  prevSound: { en: "Previous sound", uz: "Oldingi tovush", ru: "Предыдущий звук" },
  nextSound: { en: "Next sound", uz: "Keyingi tovush", ru: "Следующий звук" },
  diphthong: { en: "double vowel", uz: "qo'sh unli", ru: "двойной гласный" },
  accentUs: { en: "US", uz: "AQSH", ru: "США" },
  accentUk: { en: "UK", uz: "Britaniya", ru: "Британия" },
  paleHint: {
    en: "Pale — the other accent",
    uz: "Xira — boshqa talaffuz",
    ru: "Бледные — другой акцент",
  },
  groupMono: {
    en: "Single vowels",
    uz: "Sodda unlilar",
    ru: "Простые гласные",
  },
  groupDi: {
    en: "Double vowels",
    uz: "Qo'sh unlilar",
    ru: "Двойные гласные",
  },
  groupTri: {
    en: "Triple vowels",
    uz: "Uchlik unlilar",
    ru: "Тройные гласные",
  },
  vowelChartTitle: {
    en: "Vowel chart",
    uz: "Unlilar xaritasi",
    ru: "Карта гласных",
  },
  vowelChartCaption: {
    en: "A map of the mouth. Left — tongue at the front. Top — tongue high. Click a sound to learn it.",
    uz: "Og'iz xaritasi. Chapda — til oldinda. Tepada — til yuqorida. Tovushni bos va o'rgan.",
    ru: "Карта рта. Слева — язык впереди. Сверху — язык высоко. Нажми на звук, чтобы выучить его.",
  },
  diphthongChartTitle: {
    en: "Double vowel chart",
    uz: "Qo'sh unlilar xaritasi",
    ru: "Карта двойных гласных",
  },
  diphthongChartCaption: {
    en: "A double vowel is a slide: start at the big dot and glide along the arrow. Click a sound to learn it.",
    uz: "Qo'sh unli — sirpanish: katta nuqtadan boshla va strelka bo'ylab sirpan. Tovushni bos va o'rgan.",
    ru: "Двойной гласный — это скольжение: начни с большой точки и скользи по стрелке. Нажми на звук, чтобы выучить его.",
  },
  consonantChartTitle: {
    en: "Consonant chart",
    uz: "Undoshlar jadvali",
    ru: "Таблица согласных",
  },
  consonantChartCaption: {
    en: "Columns — where the sound is made. Rows — how the air moves. Two sounds in one box: left is voiceless, right is voiced. Click a sound to learn it.",
    uz: "Ustunlar — tovush qayerda hosil bo'ladi. Qatorlar — havo qanday chiqadi. Bir katakda ikki tovush bo'lsa: chapdagisi jarangsiz, o'ngdagisi jarangli. Tovushni bos va o'rgan.",
    ru: "Столбцы — где рождается звук. Строки — как идёт воздух. Два звука в одной клетке: слева глухой, справа звонкий. Нажми на звук, чтобы выучить его.",
  },
  voiced: { en: "voiced", uz: "jarangli", ru: "звонкий" },
  voiceless: { en: "voiceless", uz: "jarangsiz", ru: "глухой" },
  voicedHint: {
    en: "Voiced — your throat buzzes.",
    uz: "Jarangli — tomog'ing titraydi.",
    ru: "Звонкий — горло дрожит.",
  },
  voicelessHint: {
    en: "Voiceless — only air, no buzz.",
    uz: "Jarangsiz — faqat havo, titramaydi.",
    ru: "Глухой — только воздух, без дрожи.",
  },
  voicePairsTitle: {
    en: "Voiced or voiceless?",
    uz: "Jaranglimi yoki jarangsizmi?",
    ru: "Звонкий или глухой?",
  },
  voicePairsCaption: {
    en: "Put your hand on your throat and say the sounds. Same mouth, same tongue — the only difference is the buzz. Voiceless on the left, voiced on the right.",
    uz: "Qo'lingni tomog'ingga qo'yib tovushlarni ayt. Og'iz ham, til ham bir xil — farq faqat titrashda. Chapda jarangsiz, o'ngda jarangli.",
    ru: "Положи руку на горло и произнеси звуки. Рот и язык те же — разница только в дрожи. Слева глухой, справа звонкий.",
  },
  minimalPairsTitle: {
    en: "Minimal pairs",
    uz: "Minimal juftliklar",
    ru: "Минимальные пары",
  },
  minimalPairsCaption: {
    en: "Two words where only one sound is different — like ship and sheep. If you can hear the difference, you know the sound.",
    uz: "Faqat bitta tovushi farq qiladigan ikki so'z — ship va sheep kabi. Farqni eshita olsang, tovushni bilasan.",
    ru: "Два слова, где различается только один звук — как ship и sheep. Слышишь разницу — значит, знаешь звук.",
  },
  spellingsLabel: {
    en: "How to write it",
    uz: "Qanday yoziladi",
    ru: "Как пишется",
  },
  examplesLabel: {
    en: "Hear it in words",
    uz: "So'zlarda eshit",
    ru: "Услышь в словах",
  },
  dontMixLabel: { en: "Don't mix with", uz: "Adashtirma", ru: "Не путай с" },
  listenLabel: { en: "Listen", uz: "Eshit", ru: "Слушай" },
  pairsPrompt: {
    en: "Listen. Which word did you hear?",
    uz: "Eshit. Qaysi so'zni eshitding?",
    ru: "Слушай. Какое слово ты услышал?",
  },
  pairsKeysHint: {
    en: "Press 1 or 2",
    uz: "1 yoki 2 ni bos",
    ru: "Нажми 1 или 2",
  },
  roundOf: {
    en: "Round {a} of {b}",
    uz: "Bosqich {a} / {b}",
    ru: "Раунд {a} из {b}",
  },
  noSound: { en: "no sound", uz: "tovush yo'q", ru: "нет звука" },
  /* Still used by the graphemes runner's SORT stage. */
  sortKeysHint: {
    en: "Press ← or →",
    uz: "← yoki → ni bos",
    ru: "Нажми ← или →",
  },
  /* — SHADES gallery (sounds not yet in the SHADE pilot) — */
  shadesTeaser: { en: "Its shades", uz: "Tuslari", ru: "Оттенки" },
  shadesPrompt: {
    en: "One sound — {n} shades. Tap each card to hear it in a word.",
    uz: "Bitta tovush — {n} tus. Har bir kartani bos va so'zda eshit.",
    ru: "Один звук — {n} оттенков. Нажми на каждую карточку и услышь его в слове.",
  },
  shadesOnlyOne: {
    en: "This sound almost never changes — one steady shade.",
    uz: "Bu tovush deyarli o'zgarmaydi — bitta turg'un tus.",
    ru: "Этот звук почти не меняется — один постоянный оттенок.",
  },
  shadesTapHint: {
    en: "Tap a card to hear it and see what the mouth does.",
    uz: "Kartani bos — eshit va og'iz nima qilishini ko'r.",
    ru: "Нажми на карточку — послушай и узнай, что делает рот.",
  },
  shadesHeardOf: {
    en: "Heard {a} of {b}",
    uz: "{a} / {b} eshitildi",
    ru: "Прослушано {a} из {b}",
  },
  /* — SHADE lessons (one allophone each) — */
  shadeSeeWords: {
    en: "See it in words",
    uz: "So'zlarda ko'r",
    ru: "Посмотри в словах",
  },
  shadeTriggerHint: {
    en: "The blue letter is the one that changes the sound.",
    uz: "Ko'k harf — tovushni o'zgartiradigan harf.",
    ru: "Синяя буква — та, что меняет звук.",
  },
  shadeStartHint: {
    en: "Press Enter to start typing",
    uz: "Terishni boshlash uchun Enter bos",
    ru: "Нажми Enter, чтобы начать печатать",
  },
  /* — typed answers (PAIRS / SPELL / MASTER) — */
  echoPrompt: {
    en: "Listen. Type the word you heard.",
    uz: "Eshit. Eshitgan so'zingni yoz.",
    ru: "Слушай. Напиши слово, которое услышал.",
  },
  spellTypedPrompt: {
    en: "Listen and type the missing letters.",
    uz: "Eshit va tushib qolgan harflarni yoz.",
    ru: "Слушай и впиши пропущенные буквы.",
  },
  masterShadePrompt: {
    en: "This shade is spoken — type its word.",
    uz: "Bu tus aytiladi — so'zini yoz.",
    ru: "Звучит этот оттенок — напиши его слово.",
  },
  typeEnterHint: {
    en: "Type the answer · Enter checks",
    uz: "Javobni yoz · Enter tekshiradi",
    ru: "Напиши ответ · Enter проверит",
  },
  /* — the pass gate — */
  almostTitle: {
    en: "Almost there!",
    uz: "Sal qoldi!",
    ru: "Почти получилось!",
  },
  needAccuracy: {
    en: "Get {n}% or more to unlock the next lesson.",
    uz: "Keyingi darsni ochish uchun {n}% yoki ko'proq to'pla.",
    ru: "Набери {n}% или больше, чтобы открыть следующий урок.",
  },
  lockedLesson: {
    en: "This lesson is locked — pass the previous one first.",
    uz: "Bu dars yopiq — avval oldingisini o'tib ol.",
    ru: "Этот урок закрыт — сначала пройди предыдущий.",
  },
  rainHelp: {
    en: "Type the falling words before they land!",
    uz: "Tushayotgan so'zlarni yerga tegmasidan ter!",
    ru: "Печатай падающие слова, пока они не упали!",
  },
  ninjaHelp: {
    en: "Type the words — defeat the ninjas!",
    uz: "So'zlarni ter — ninjalarni yeng!",
    ru: "Печатай слова — победи ниндзя!",
  },
} satisfies Record<string, Str>;
