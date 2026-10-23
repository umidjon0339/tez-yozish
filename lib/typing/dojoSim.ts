// The Shortcut Dojo's tiny document model. SHORTCUT_DOJO lessons act on a
// real (word-level) document so every shortcut shows its true effect:
// select, copy, cut, paste, undo, redo.
//
// Deliberately simplified for teaching:
//   - the document is a list of words
//   - the selection is a contiguous word range; Shift+ArrowRight grows it
//     one word to the right (starting from the first word), Shift+ArrowLeft
//     shrinks it back
//   - paste replaces the selection when one exists, otherwise appends
//   - only Ctrl+X / Ctrl+V change the document, so only they are undoable
//
// The validator (scripts/validate-lessons.mjs) simulates these same rules
// to reject impossible task scripts — keep the two in sync.

export const DOJO_ACTIONS = [
  'Ctrl+A',
  'Ctrl+C',
  'Ctrl+V',
  'Ctrl+X',
  'Ctrl+Z',
  'Ctrl+Y',
  'Shift+ArrowRight',
  'Shift+ArrowLeft',
] as const;

export type DojoAction = (typeof DOJO_ACTIONS)[number];

export function isDojoAction(x: string): x is DojoAction {
  return (DOJO_ACTIONS as readonly string[]).includes(x);
}

interface DojoSnapshot {
  words: string[];
  /** [start, end) word range, or null when nothing is selected. */
  sel: [number, number] | null;
}

export interface DojoState extends DojoSnapshot {
  clip: string[];
  undoStack: DojoSnapshot[];
  redoStack: DojoSnapshot[];
}

export function initialDojoState(doc: string): DojoState {
  return {
    words: doc.split(/\s+/).filter(Boolean),
    sel: null,
    clip: [],
    undoStack: [],
    redoStack: [],
  };
}

const snap = (s: DojoState): DojoSnapshot => ({ words: s.words, sel: s.sel });

export type DojoResult =
  | { ok: true; next: DojoState }
  | { ok: false; error: string };

export function applyDojoAction(s: DojoState, action: DojoAction): DojoResult {
  const ok = (next: DojoState): DojoResult => ({ ok: true, next });
  const err = (error: string): DojoResult => ({ ok: false, error });

  switch (action) {
    case 'Ctrl+A':
      if (s.words.length === 0) return err('the document is empty');
      return ok({ ...s, sel: [0, s.words.length] });

    case 'Shift+ArrowRight': {
      if (s.words.length === 0) return err('the document is empty');
      if (!s.sel) return ok({ ...s, sel: [0, 1] });
      if (s.sel[1] >= s.words.length)
        return err('the selection already reaches the end');
      return ok({ ...s, sel: [s.sel[0], s.sel[1] + 1] });
    }

    case 'Shift+ArrowLeft': {
      if (!s.sel || s.sel[1] - s.sel[0] <= 1)
        return err('no selection to shrink');
      return ok({ ...s, sel: [s.sel[0], s.sel[1] - 1] });
    }

    case 'Ctrl+C':
      if (!s.sel) return err('nothing is selected to copy');
      return ok({ ...s, clip: s.words.slice(s.sel[0], s.sel[1]) });

    case 'Ctrl+X': {
      if (!s.sel) return err('nothing is selected to cut');
      const clip = s.words.slice(s.sel[0], s.sel[1]);
      const words = [...s.words.slice(0, s.sel[0]), ...s.words.slice(s.sel[1])];
      return ok({
        ...s,
        undoStack: [...s.undoStack, snap(s)],
        redoStack: [],
        words,
        sel: null,
        clip,
      });
    }

    case 'Ctrl+V': {
      if (s.clip.length === 0) return err('the clipboard is empty');
      const undoStack = [...s.undoStack, snap(s)];
      const words = s.sel
        ? [...s.words.slice(0, s.sel[0]), ...s.clip, ...s.words.slice(s.sel[1])]
        : [...s.words, ...s.clip];
      return ok({ ...s, undoStack, redoStack: [], words, sel: null });
    }

    case 'Ctrl+Z': {
      if (s.undoStack.length === 0) return err('nothing to undo');
      const prev = s.undoStack[s.undoStack.length - 1];
      return ok({
        ...s,
        undoStack: s.undoStack.slice(0, -1),
        redoStack: [...s.redoStack, snap(s)],
        words: prev.words,
        sel: prev.sel,
      });
    }

    case 'Ctrl+Y': {
      if (s.redoStack.length === 0) return err('nothing to redo');
      const next = s.redoStack[s.redoStack.length - 1];
      return ok({
        ...s,
        redoStack: s.redoStack.slice(0, -1),
        undoStack: [...s.undoStack, snap(s)],
        words: next.words,
        sel: next.sel,
      });
    }
  }
}
