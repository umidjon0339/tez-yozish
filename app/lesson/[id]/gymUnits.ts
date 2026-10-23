import {
  chordKeys,
  isSpecialToken,
  parseChordToken,
  type ChordToken,
} from "@/lib/typing/keyTokens";

// Special-key tokens render as icons or short labels on their keycap.
export const KEY_TOKEN_GLYPHS: Record<string, string> = {
  Enter: "↵",
  Backspace: "⌫",
  Tab: "⇥",
  CapsLock: "caps",
  Control: "ctrl",
  Alt: "alt",
  Shift: "⇧",
};

// ─── GYM TYPING UNITS ───
// STANDARD_GYM text is a sequence of units: plain characters (the space
// between two word tokens is typed), inline special keys (Enter really
// breaks the line, Tab indents it) and shortcut chords ("Ctrl+C"). No
// space is typed next to a key/chord unit — only between two plain words.
export type GymUnit =
  | { kind: "char"; char: string }
  | { kind: "key"; key: string; label: string }
  | { kind: "chord"; chord: ChordToken; label: string };

export function buildGymUnits(tokens: string[]): GymUnit[] {
  const units: GymUnit[] = [];
  let prevPlain = false;
  for (const token of tokens) {
    if (isSpecialToken(token)) {
      units.push({
        kind: "key",
        key: token,
        label: KEY_TOKEN_GLYPHS[token] ?? token,
      });
      prevPlain = false;
      continue;
    }
    const chord = parseChordToken(token);
    if (chord) {
      units.push({ kind: "chord", chord, label: token });
      prevPlain = false;
      continue;
    }
    if (prevPlain) units.push({ kind: "char", char: " " });
    for (const ch of token) units.push({ kind: "char", char: ch });
    prevPlain = true;
  }
  return units;
}

// What the on-screen keyboard should light up for a unit (chords light
// every key of the combo at once).
export function unitExpectedKeys(unit: GymUnit): string | string[] {
  if (unit.kind === "char") return unit.char;
  if (unit.kind === "key") return unit.key;
  return chordKeys(unit.chord);
}

// The label a unit's mistakes are counted under ("e", "Enter", "Ctrl+C")
export function unitStatKey(unit: GymUnit): string {
  return unit.kind === "char"
    ? unit.char
    : unit.kind === "key"
      ? unit.key
      : unit.label;
}
