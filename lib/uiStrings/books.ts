import type { Str } from "./types";

/* Typing practice over long-form text — lib/books.ts */
export const books = {
  title: { en: "Books", uz: "Kitoblar", ru: "Книги" },
  desc: {
    en: "Type real pages, one at a time.",
    uz: "Sahifama-sahifa yozib mashq qil.",
    ru: "Набирай настоящие страницы, одну за другой.",
  },
  chapters: { en: "chapters", uz: "bob", ru: "глав" },
  topics: { en: "topics", uz: "mavzu", ru: "тем" },
  /* Fallback names for an unnamed chapter/topic — a plain paste with no
     `#` markers gets one chapter, and it should not be titled "" */
  chapter: { en: "Chapter", uz: "Bob", ru: "Глава" },
  topic: { en: "Topic", uz: "Mavzu", ru: "Тема" },
  words: { en: "words", uz: "so'z", ru: "слов" },
  add: { en: "Add a book", uz: "Kitob qo'shish", ru: "Добавить книгу" },
  bookTitle: { en: "Title", uz: "Nomi", ru: "Название" },
  bookText: { en: "Paste the text", uz: "Matnni joylashtir", ru: "Вставь текст" },
  save: { en: "Save", uz: "Saqlash", ru: "Сохранить" },
  cancel: { en: "Cancel", uz: "Bekor qilish", ru: "Отмена" },
  remove: { en: "Delete book", uz: "Kitobni o'chirish", ru: "Удалить книгу" },
  backToBooks: { en: "Back to books", uz: "Kitoblarga", ru: "К книгам" },
  backToChapters: { en: "Back to chapters", uz: "Boblarga", ru: "К главам" },
  backToTopics: { en: "Back to topics", uz: "Mavzularga", ru: "К темам" },
  yourBook: { en: "Your book", uz: "Sening kitobing", ru: "Твоя книга" },
  /* The two ways a real book is split, picked before pasting */
  structure: { en: "Split by", uz: "Bo'linishi", ru: "Деление" },
  onlyChapters: { en: "Chapters", uz: "Boblar", ru: "Главы" },
  chaptersTopics: {
    en: "Chapters + topics",
    uz: "Boblar + mavzular",
    ru: "Главы + темы",
  },
  addChapter: { en: "Add chapter", uz: "Bob qo'shish", ru: "Добавить главу" },
  addTopic: { en: "Add topic", uz: "Mavzu qo'shish", ru: "Добавить тему" },
  chapterName: { en: "Chapter name", uz: "Bob nomi", ru: "Название главы" },
  topicName: { en: "Topic name", uz: "Mavzu nomi", ru: "Название темы" },
  removeItem: { en: "Remove", uz: "O'chirish", ru: "Убрать" },
  editBook: { en: "Edit book", uz: "Kitobni tahrirlash", ru: "Изменить книгу" },
  tooShort: {
    en: "Add more than 20 words",
    uz: "20 tadan ko'p so'z yoz",
    ru: "Нужно больше 20 слов",
  },
  /* The anti-gaming gate: `a a a a a` types absurdly fast and would
     poison the learner's own records. */
  tooRepetitive: {
    en: "Use real sentences — this text repeats too much",
    uz: "Haqiqiy gaplar yoz — bu matn juda takrorlanadi",
    ru: "Нужны настоящие предложения — здесь слишком много повторов",
  },
} satisfies Record<string, Str>;
