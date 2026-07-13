// Shared vocabulary for "special" step-text tokens (v4.1).
//
// v4 step `text` is a space-separated token string. Most tokens are plain
// typed text ("fjf", "cat."), but two other kinds exist:
//
//   SPECIAL KEY tokens — one named key the learner must press:
//       Enter  Backspace  Tab  CapsLock  Control  Alt  Shift
//     These are exactly the KeyboardEvent.key names, so matching is
//     `e.key === token`.
//
//   CHORD tokens — a keyboard shortcut written with "+":
//       "Ctrl+C", "Ctrl+Shift+Z", "Shift+ArrowRight"
//     Leading parts are modifiers (Ctrl / Alt / Shift), the last part is
//     the base key. A token containing "+" is only a chord when every
//     leading part is a modifier name — "1+1", "+=" or "++" stay plain
//     typed text (the + key itself is taught as a character).
//
// The validator (scripts/validate-lessons.mjs) mirrors this logic because
// it cannot import TypeScript — keep the two in sync.

export const SPECIAL_KEY_TOKENS = [
  'Enter',
  'Backspace',
  'Tab',
  'CapsLock',
  'Control',
  'Alt',
  'Shift',
] as const;

export type SpecialKeyToken = (typeof SPECIAL_KEY_TOKENS)[number];

const SPECIAL_SET: ReadonlySet<string> = new Set(SPECIAL_KEY_TOKENS);

export function isSpecialToken(token: string): token is SpecialKeyToken {
  return SPECIAL_SET.has(token);
}

/** Bare special keys that may appear inside STANDARD_GYM text: Enter ends
 *  the line, Tab indents it. The other special keys (Backspace, CapsLock,
 *  Control, Alt, Shift) only make sense as KEY_INTRO keycap sequences. */
export const GYM_INLINE_SPECIALS: ReadonlySet<string> = new Set([
  'Enter',
  'Tab',
]);

export interface ChordToken {
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  /**
   * Base key in KeyboardEvent.key form: single characters lowercased
   * ("c", "1"), named keys verbatim ("ArrowRight").
   */
  key: string;
}

const CHORD_MODIFIERS: Record<string, keyof Omit<ChordToken, 'key'>> = {
  Ctrl: 'ctrl',
  Alt: 'alt',
  Shift: 'shift',
};

const CHORD_NAMED_BASES: ReadonlySet<string> = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
  'Delete',
]);

/** "Ctrl+C" → { ctrl: true, key: "c" }. Returns null for anything that is
 *  not a well-formed chord (including plain math tokens like "1+1"). */
export function parseChordToken(token: string): ChordToken | null {
  if (!token.includes('+')) return null;
  const parts = token.split('+');
  if (parts.length < 2 || parts.some((p) => p === '')) return null;
  const chord: ChordToken = { ctrl: false, alt: false, shift: false, key: '' };
  for (const mod of parts.slice(0, -1)) {
    const flag = CHORD_MODIFIERS[mod];
    if (!flag || chord[flag]) return null; // unknown or duplicated modifier
    chord[flag] = true;
  }
  const base = parts[parts.length - 1];
  if (/^[a-zA-Z0-9]$/.test(base)) chord.key = base.toLowerCase();
  else if (CHORD_NAMED_BASES.has(base)) chord.key = base;
  else return null;
  return chord;
}

export function isChordToken(token: string): boolean {
  return parseChordToken(token) !== null;
}

/** Every physical key a chord involves, in KeyboardEvent.key names —
 *  what the on-screen keyboard should light up ("Ctrl+C" → Control, c). */
export function chordKeys(chord: ChordToken): string[] {
  const keys: string[] = [];
  if (chord.ctrl) keys.push('Control');
  if (chord.alt) keys.push('Alt');
  if (chord.shift) keys.push('Shift');
  keys.push(chord.key);
  return keys;
}

/** Strict match: every modifier state must equal the chord's, so Ctrl+C
 *  does not accept Ctrl+Shift+C, and Meta never participates. */
export function chordMatchesEvent(
  chord: ChordToken,
  e: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'altKey' | 'shiftKey' | 'metaKey'>,
): boolean {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  return (
    key === chord.key &&
    e.ctrlKey === chord.ctrl &&
    e.altKey === chord.alt &&
    e.shiftKey === chord.shift &&
    !e.metaKey
  );
}
