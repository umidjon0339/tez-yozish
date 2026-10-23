// Static reference data for the 26 English letters, used by /english/letters.
// Frequencies are the classic Lewand letter-frequency table (% of letters in
// running English text). Letter names are IPA. Example words are chosen so the
// letter is easy to spot (and stay in English — they are the subject matter).
// Code data: NATO/ICAO phonetic alphabet (spelling per the official NATO
// poster, e.g. "Alfa"/"Juliett"), International Morse Code, Braille cell
// dot numbers (1-2-3 = left column top→bottom, 4-5-6 = right column), and
// flag-semaphore positions: two flag angles in degrees clockwise from
// 12 o'clock, viewer's perspective (rendered by components/LetterSignals).

import {
  FINGER_OF_KEY_ID,
  ROW_OF_KEY_ID,
  type Finger,
  type KeyRow,
} from "@/components/keyboard/keymap";

export interface LetterInfo {
  char: string; // lowercase letter
  name: string; // IPA name of the letter, e.g. "/eɪ/"
  freq: number; // % share in English text (Lewand)
  vowel: boolean;
  sometimesVowel?: boolean; // the "y" case
  word: string; // example word containing the letter
  nato: string; // NATO phonetic code word, e.g. "Bravo"
  say: string; // how to say the code word, e.g. "brah-voh"
  morse: string; // International Morse Code, "." and "-" only
  braille: number[]; // filled Braille dots (1..6)
  semaphore: [number, number]; // flag angles, ° clockwise from 12:00, viewer's view
}

// prettier-ignore
export const LETTERS: LetterInfo[] = [
  { char: "a", name: "/eɪ/", freq: 8.17, vowel: true, word: "apple", nato: "Alfa", say: "al-fah", morse: ".-", braille: [1], semaphore: [180, 225] },
  { char: "b", name: "/biː/", freq: 1.49, vowel: false, word: "ball", nato: "Bravo", say: "brah-voh", morse: "-...", braille: [1, 2], semaphore: [180, 270] },
  { char: "c", name: "/siː/", freq: 2.78, vowel: false, word: "cat", nato: "Charlie", say: "char-lee", morse: "-.-.", braille: [1, 4], semaphore: [180, 315] },
  { char: "d", name: "/diː/", freq: 4.25, vowel: false, word: "dog", nato: "Delta", say: "dell-tah", morse: "-..", braille: [1, 4, 5], semaphore: [180, 0] },
  { char: "e", name: "/iː/", freq: 12.7, vowel: true, word: "egg", nato: "Echo", say: "eck-oh", morse: ".", braille: [1, 5], semaphore: [180, 45] },
  { char: "f", name: "/ɛf/", freq: 2.23, vowel: false, word: "fish", nato: "Foxtrot", say: "foks-trot", morse: "..-.", braille: [1, 2, 4], semaphore: [180, 90] },
  { char: "g", name: "/dʒiː/", freq: 2.02, vowel: false, word: "goat", nato: "Golf", say: "golf", morse: "--.", braille: [1, 2, 4, 5], semaphore: [180, 135] },
  { char: "h", name: "/eɪtʃ/", freq: 6.09, vowel: false, word: "hat", nato: "Hotel", say: "hoh-tel", morse: "....", braille: [1, 2, 5], semaphore: [270, 225] },
  { char: "i", name: "/aɪ/", freq: 6.97, vowel: true, word: "ice", nato: "India", say: "in-dee-ah", morse: "..", braille: [2, 4], semaphore: [315, 225] },
  { char: "j", name: "/dʒeɪ/", freq: 0.15, vowel: false, word: "jam", nato: "Juliett", say: "jew-lee-ett", morse: ".---", braille: [2, 4, 5], semaphore: [0, 90] },
  { char: "k", name: "/keɪ/", freq: 0.77, vowel: false, word: "kite", nato: "Kilo", say: "key-loh", morse: "-.-", braille: [1, 3], semaphore: [225, 0] },
  { char: "l", name: "/ɛl/", freq: 4.03, vowel: false, word: "lion", nato: "Lima", say: "lee-mah", morse: ".-..", braille: [1, 2, 3], semaphore: [225, 45] },
  { char: "m", name: "/ɛm/", freq: 2.41, vowel: false, word: "moon", nato: "Mike", say: "mike", morse: "--", braille: [1, 3, 4], semaphore: [225, 90] },
  { char: "n", name: "/ɛn/", freq: 6.75, vowel: false, word: "nose", nato: "November", say: "no-vem-ber", morse: "-.", braille: [1, 3, 4, 5], semaphore: [225, 135] },
  { char: "o", name: "/oʊ/", freq: 7.51, vowel: true, word: "orange", nato: "Oscar", say: "oss-cah", morse: "---", braille: [1, 3, 5], semaphore: [270, 315] },
  { char: "p", name: "/piː/", freq: 1.93, vowel: false, word: "pen", nato: "Papa", say: "pah-pah", morse: ".--.", braille: [1, 2, 3, 4], semaphore: [270, 0] },
  { char: "q", name: "/kjuː/", freq: 0.1, vowel: false, word: "queen", nato: "Quebec", say: "keh-beck", morse: "--.-", braille: [1, 2, 3, 4, 5], semaphore: [270, 45] },
  { char: "r", name: "/ɑːr/", freq: 5.99, vowel: false, word: "rain", nato: "Romeo", say: "row-me-oh", morse: ".-.", braille: [1, 2, 3, 5], semaphore: [270, 90] },
  { char: "s", name: "/ɛs/", freq: 6.33, vowel: false, word: "sun", nato: "Sierra", say: "see-air-rah", morse: "...", braille: [2, 3, 4], semaphore: [270, 135] },
  { char: "t", name: "/tiː/", freq: 9.06, vowel: false, word: "tree", nato: "Tango", say: "tang-go", morse: "-", braille: [2, 3, 4, 5], semaphore: [315, 0] },
  { char: "u", name: "/juː/", freq: 2.76, vowel: true, word: "umbrella", nato: "Uniform", say: "you-nee-form", morse: "..-", braille: [1, 3, 6], semaphore: [315, 45] },
  { char: "v", name: "/viː/", freq: 0.98, vowel: false, word: "van", nato: "Victor", say: "vic-tah", morse: "...-", braille: [1, 2, 3, 6], semaphore: [0, 135] },
  { char: "w", name: "/ˈdʌbl juː/", freq: 2.36, vowel: false, word: "water", nato: "Whiskey", say: "wiss-key", morse: ".--", braille: [2, 4, 5, 6], semaphore: [45, 90] },
  { char: "x", name: "/ɛks/", freq: 0.15, vowel: false, word: "box", nato: "Xray", say: "ecks-ray", morse: "-..-", braille: [1, 3, 4, 6], semaphore: [45, 135] },
  { char: "y", name: "/waɪ/", freq: 1.97, vowel: false, sometimesVowel: true, word: "yellow", nato: "Yankee", say: "yang-key", morse: "-.--", braille: [1, 3, 4, 5, 6], semaphore: [315, 90] },
  { char: "z", name: "/ziː/", freq: 0.07, vowel: false, word: "zebra", nato: "Zulu", say: "zoo-loo", morse: "--..", braille: [1, 3, 5, 6], semaphore: [90, 135] },
];

// Frequency rank, 1 = most used ("e").
export const FREQ_RANK: Record<string, number> = Object.fromEntries(
  [...LETTERS]
    .sort((a, b) => b.freq - a.freq)
    .map((l, i) => [l.char, i + 1]),
);

// Letters are their own key ids in the keyboard keymap.
export function fingerOfLetter(char: string): Finger | undefined {
  return FINGER_OF_KEY_ID[char];
}

export function rowOfLetter(char: string): KeyRow | undefined {
  return ROW_OF_KEY_ID[char];
}
