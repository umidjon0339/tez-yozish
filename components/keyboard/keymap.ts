// Single source of truth mapping KeyboardEvent.key values to SVG element ids.
// Shared by new_keyboard.tsx (keycap highlight layer) and hands.tsx (hand poses).
// Shifted symbols alias to their physical key (e.g. '_' and '-' → 'minus').

export const KEY_ID_MAP: Record<string, string> = {
  ' ': 'space',
  '1': 'key-1', '2': 'key-2', '3': 'key-3', '4': 'key-4', '5': 'key-5',
  '6': 'key-6', '7': 'key-7', '8': 'key-8', '9': 'key-9', '0': 'key-0',
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
  alt: 'option-left',
  meta: 'option-left',
};

export const LEFT_HAND_KEYS = new Set([
  'key-1', 'key-2', 'key-3', 'key-4', 'key-5',
  'q', 'w', 'e', 'r', 't',
  'a', 's', 'd', 'f', 'g',
  'z', 'x', 'c', 'v', 'b',
  'tilda', 'tab', 'capslock', 'shift-left', 'control', 'option-left',
]);
