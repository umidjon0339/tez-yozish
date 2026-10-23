// Chrome strings for the shared navbar and the static pages, one file per
// namespace: STR.<namespace>.<key>[locale]. Lesson data itself is localized
// in lessons.json; the lesson runtime keeps its own strings in
// app/lesson/[id]/ui.ts.
import { nav } from "./nav";
import { auth } from "./auth";
import { home } from "./home";
import { test } from "./test";
import { courses } from "./courses";
import { games } from "./games";
import { books } from "./books";
import { coding } from "./coding";
import { compete } from "./compete";
import { stats } from "./stats";
import { english } from "./english";
import { letters } from "./letters";
import { phonemes } from "./phonemes";
import { graphemes } from "./graphemes";
import { pricing } from "./pricing";
import { notFound } from "./notFound";

export const STR = {
  nav,
  auth,
  home,
  test,
  courses,
  games,
  books,
  coding,
  compete,
  stats,
  english,
  letters,
  phonemes,
  graphemes,
  pricing,
  notFound,
};
