// Single source of truth mapping KeyboardEvent.key values to SVG element ids.
// Shared by new_keyboard.tsx (keycap highlight layer) and hands.tsx (hand poses).
// Shifted symbols alias to their physical key (e.g. '_' and '-' → 'minus').

export const KEY_ID_MAP: Record<string, string> = {
  ' ': 'space',
  '1': 'key-1', '2': 'key-2', '3': 'key-3', '4': 'key-4', '5': 'key-5',
  '6': 'key-6', '7': 'key-7', '8': 'key-8', '9': 'key-9', '0': 'key-0',
  '!': 'key-1', '@': 'key-2', '#': 'key-3', '$': 'key-4', '%': 'key-5',
  '^': 'key-6', '&': 'key-7', '*': 'key-8', '(': 'key-9', ')': 'key-0',
  '`': 'tilda', '~': 'tilda',
  '-': 'minus', '_': 'minus',
  '=': 'equal', '+': 'equal',
  '[': 'open-bracket', '{': 'open-bracket',
  ']': 'close-bracket', '}': 'close-bracket',
  '\\': 'backslash', '|': 'backslash',
  ';': 'semicolon', ':': 'semicolon',
  "'": 'quote', '"': 'quote',
  ',': 'comma', '<': 'comma',
  '.': 'dot', '>': 'dot',
  '/': 'slash', '?': 'slash',
  backspace: 'backspace',
  tab: 'tab',
  capslock: 'capslock',
  enter: 'enter',
  shift: 'shift-left', // defaulting shift to the left key
  control: 'control',
  alt: 'alt-left',
  altgraph: 'alt-right',
  meta: 'win',
};

export const LEFT_HAND_KEYS = new Set([
  'key-1', 'key-2', 'key-3', 'key-4', 'key-5',
  'q', 'w', 'e', 'r', 't',
  'a', 's', 'd', 'f', 'g',
  'z', 'x', 'c', 'v', 'b',
  'tilda', 'tab', 'capslock', 'shift-left', 'control', 'fn', 'win', 'alt-left',
]);

// Every character a US layout produces without Shift. Anything else that is a
// single character ('F', ':', '?') is a shifted keystroke.
const UNSHIFTED_CHARS = new Set(
  " `1234567890-=qwertyuiop[]\\asdfghjkl;'zxcvbnm,./",
);

export function requiresShift(char: string): boolean {
  return char.length === 1 && !UNSHIFTED_CHARS.has(char);
}

// Shift is always pressed by the pinky of the hand that is NOT typing the key.
export function shiftIdFor(targetId: string): 'shift-left' | 'shift-right' {
  return LEFT_HAND_KEYS.has(targetId) ? 'shift-right' : 'shift-left';
}

// ─── FINGER ZONES ───
// Mirrors the `.kb-stage :is(…) { --fz: … }` assignment lists in
// app/globals.css — keep both in sync when a key moves finger.

export type Finger =
  | 'l-pinky' | 'l-ring' | 'l-middle' | 'l-index'
  | 'thumb'
  | 'r-index' | 'r-middle' | 'r-ring' | 'r-pinky';

export const FINGER_ORDER: Finger[] = [
  'l-pinky', 'l-ring', 'l-middle', 'l-index',
  'thumb',
  'r-index', 'r-middle', 'r-ring', 'r-pinky',
];

const FINGER_KEY_IDS: Record<Finger, string[]> = {
  'l-pinky': ['key-1', 'tilda', 'q', 'a', 'z', 'tab', 'capslock', 'shift-left', 'control', 'fn'],
  'l-ring': ['key-2', 'w', 's', 'x'],
  'l-middle': ['key-3', 'e', 'd', 'c'],
  'l-index': ['key-4', 'key-5', 'r', 't', 'f', 'g', 'v', 'b'],
  thumb: ['space', 'win', 'alt-left', 'alt-right', 'control-right'],
  'r-index': ['key-6', 'key-7', 'y', 'u', 'h', 'j', 'n', 'm'],
  'r-middle': ['key-8', 'i', 'k', 'comma'],
  'r-ring': ['key-9', 'o', 'l', 'dot'],
  'r-pinky': ['key-0', 'minus', 'equal', 'p', 'open-bracket', 'close-bracket', 'backslash', 'semicolon', 'quote', 'enter', 'slash', 'shift-right', 'backspace'],
};

export const FINGER_OF_KEY_ID: Record<string, Finger> = Object.fromEntries(
  (Object.entries(FINGER_KEY_IDS) as [Finger, string[]][]).flatMap(
    ([finger, ids]) => ids.map((id) => [id, finger]),
  ),
);

// Physical keyboard rows (letter/symbol keys only — modifiers excluded).
export type KeyRow = 'number' | 'top' | 'home' | 'bottom';

const ROW_KEY_IDS: Record<KeyRow, string[]> = {
  number: ['tilda', 'key-1', 'key-2', 'key-3', 'key-4', 'key-5', 'key-6', 'key-7', 'key-8', 'key-9', 'key-0', 'minus', 'equal'],
  top: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'open-bracket', 'close-bracket', 'backslash'],
  home: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'semicolon', 'quote'],
  bottom: ['z', 'x', 'c', 'v', 'b', 'n', 'm', 'comma', 'dot', 'slash'],
};

export const ROW_OF_KEY_ID: Record<string, KeyRow> = Object.fromEntries(
  (Object.entries(ROW_KEY_IDS) as [KeyRow, string[]][]).flatMap(
    ([row, ids]) => ids.map((id) => [id, row]),
  ),
);

// SVG element id for a typed character (letters are their own ids).
export function keyIdForChar(char: string): string | null {
  const c = char.toLowerCase();
  if (KEY_ID_MAP[c]) return KEY_ID_MAP[c];
  if (/^[a-z]$/.test(c)) return c;
  return null;
}
