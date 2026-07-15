// Learning data for the staged letter workspace
// (/english/letters/[letter]): common letter sounds, classic confusion
// pairs, and the builders for the Find-it / Capitals / Hear-and-type /
// Don't-mix-up stages. Pure data + deterministic builders — no randomness,
// so a letter's stages are identical on every visit (and hydration-safe).

import { FINGER_OF_KEY_ID } from "@/components/keyboard/keymap";
import { wordsForLetter, WORD_POOL } from "@/lib/letterWords";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");

// The letter's usual SOUND (not its name): shown as "/f/ as in fish".
// The letter name (IPA) lives in lib/letters.ts.
export interface LetterSound {
  ipa: string;
  word: string;
}

export const LETTER_SOUNDS: Record<string, LetterSound> = {
  a: { ipa: "/æ/", word: "apple" },
  b: { ipa: "/b/", word: "ball" },
  c: { ipa: "/k/", word: "cat" },
  d: { ipa: "/d/", word: "dog" },
  e: { ipa: "/e/", word: "egg" },
  f: { ipa: "/f/", word: "fish" },
  g: { ipa: "/ɡ/", word: "goat" },
  h: { ipa: "/h/", word: "hat" },
  i: { ipa: "/ɪ/", word: "ink" },
  j: { ipa: "/dʒ/", word: "jam" },
  k: { ipa: "/k/", word: "kite" },
  l: { ipa: "/l/", word: "lion" },
  m: { ipa: "/m/", word: "moon" },
  n: { ipa: "/n/", word: "nose" },
  o: { ipa: "/ɒ/", word: "orange" },
  p: { ipa: "/p/", word: "pen" },
  q: { ipa: "/kw/", word: "queen" },
  r: { ipa: "/r/", word: "rain" },
  s: { ipa: "/s/", word: "sun" },
  t: { ipa: "/t/", word: "tree" },
  u: { ipa: "/ʌ/", word: "umbrella" },
  v: { ipa: "/v/", word: "van" },
  w: { ipa: "/w/", word: "water" },
  x: { ipa: "/ks/", word: "box" },
  y: { ipa: "/j/", word: "yellow" },
  z: { ipa: "/z/", word: "zebra" },
};

// Letters students classically mix up — mirror shapes (b/d, p/q),
// near shapes (m/n, u/v) and near sounds (c/k/s, g/j, f/v).
const RIVALS: Record<string, string[]> = {
  a: ["e"],
  b: ["d", "p"],
  c: ["k", "s"],
  d: ["b", "q"],
  e: ["a"],
  f: ["v", "t"],
  g: ["j", "q"],
  h: ["n"],
  i: ["l", "j"],
  j: ["g", "i"],
  k: ["c", "x"],
  l: ["i", "t"],
  m: ["n", "w"],
  n: ["m", "u"],
  o: ["u"],
  p: ["q", "b"],
  q: ["p", "g"],
  r: ["l"],
  s: ["c", "z"],
  t: ["f", "l"],
  u: ["n", "v"],
  v: ["w", "u"],
  w: ["v", "m"],
  x: ["k", "s"],
  y: ["j"],
  z: ["s", "x"],
};

// Letters typed by the same finger — where real typing mix-ups come from.
export function sameFingerLetters(char: string): string[] {
  const finger = FINGER_OF_KEY_ID[char];
  if (!finger) return [];
  return ALPHABET.filter((c) => c !== char && FINGER_OF_KEY_ID[c] === finger);
}

// The letters this one gets confused with: curated pairs first, then
// same-finger keyboard neighbours to fill up to three rivals.
export function rivalsFor(char: string): string[] {
  const out = [...(RIVALS[char] ?? [])];
  for (const c of sameFingerLetters(char)) {
    if (out.length >= 3) break;
    if (!out.includes(c)) out.push(c);
  }
  return out.slice(0, 3);
}

// Where the letter appears in words: one example per position, searched
// over the whole pool (the 12 drill words often lack an end/middle case).
export function positionWords(
  char: string,
): { word: string; pos: "start" | "middle" | "end" }[] {
  const out: { word: string; pos: "start" | "middle" | "end" }[] = [];
  const start = WORD_POOL.find((w) => w.startsWith(char));
  const end = WORD_POOL.find((w) => w.endsWith(char) && !w.startsWith(char));
  const middle = WORD_POOL.find(
    (w) =>
      w.indexOf(char) > 0 &&
      w.indexOf(char) < w.length - 1 &&
      w !== start &&
      w !== end,
  );
  if (start) out.push({ word: start, pos: "start" });
  if (middle) out.push({ word: middle, pos: "middle" });
  if (end) out.push({ word: end, pos: "end" });
  return out;
}

// ── Stage builders ────────────────────────────────────────────────────

// Capitals stage: short words starting with the letter, capitalized —
// teaches Shift with the opposite hand's pinky.
export function capsWords(char: string): string[] {
  const words = wordsForLetter(char);
  const starting = words.filter((w) => w.startsWith(char));
  const picked = (starting.length >= 4 ? starting : words).slice(0, 6);
  return picked.map((w) => w[0].toUpperCase() + w.slice(1));
}

// Hear-and-type stage: four short words, spoken aloud and typed unseen.
export function dictationWords(char: string): string[] {
  const words = wordsForLetter(char);
  const short = words.filter((w) => w.length <= 5);
  return (short.length >= 4 ? short : words).slice(0, 4);
}
