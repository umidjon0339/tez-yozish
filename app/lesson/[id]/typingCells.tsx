// The imperative per-character cells the trackers drive keystroke by keystroke.
import React, { memo, useImperativeHandle, useRef, useState } from "react";

export const UNTYPED = 0;
export const CORRECT = 1;
export const INCORRECT = 2;
export const CORRECT_FIXED = 3;
export type CharState =
  | typeof UNTYPED
  | typeof CORRECT
  | typeof INCORRECT
  | typeof CORRECT_FIXED;

export interface LetterHandle {
  setCharState: (s: CharState) => void;
  setIsCursor: (active: boolean) => void;
  /** Fix-the-typo drills: display this (wrong) character instead of the
   *  target until it is erased. Only Letter implements it. */
  setOverrideChar?: (c: string | null) => void;
  getDomNode: () => HTMLDivElement | null;
}

export const Letter = memo(
  React.forwardRef<LetterHandle, { char: string }>(function Letter(
    { char },
    ref,
  ) {
    const [state, setState] = useState<CharState>(UNTYPED);
    const [isCursor, setIsCursor] = useState(false);
    const [overrideChar, setOverrideChar] = useState<string | null>(null);
    const spanRef = useRef<HTMLSpanElement>(null);

    useImperativeHandle(ref, () => ({
      setCharState: setState,
      setIsCursor,
      setOverrideChar,
      getDomNode: () => spanRef.current as unknown as HTMLDivElement,
    }));

    let charCls = "transition-colors duration-150 inline-block relative ";

    if (state === UNTYPED) {
      if (isCursor) {
        charCls += "text-neutral-900 dark:text-white font-bold drop-shadow-sm ";
      } else {
        charCls += "text-neutral-400 dark:text-neutral-600 ";
      }
    } else if (state === CORRECT) {
      charCls += "text-[#10c373] dark:text-[#50ce95] letter-pop ";
    } else if (state === CORRECT_FIXED) {
      charCls += "text-amber-500 dark:text-amber-400 letter-pop ";
    } else if (state === INCORRECT) {
      charCls +=
        "text-red-500 dark:text-red-400 bg-red-500/10 rounded-sm letter-shake ";
    }

    const shown = overrideChar ?? char;
    return (
      <span className={charCls} ref={spanRef}>
        {shown === " " ? "\u00A0" : shown}
        {state === CORRECT_FIXED && (
          <svg
            viewBox="0 0 24 24"
            className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 sm:w-4 sm:h-4 text-amber-500 dark:text-amber-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        )}
      </span>
    );
  }),
);
Letter.displayName = "Letter";

// Inline keycap for key/chord units inside gym text — same imperative
// handle contract as Letter so the tracker drives both identically.
export const KeyCapUnit = memo(
  React.forwardRef<LetterHandle, { label: string }>(function KeyCapUnit(
    { label },
    ref,
  ) {
    const [state, setState] = useState<CharState>(UNTYPED);
    const [isCursor, setIsCursor] = useState(false);
    const capRef = useRef<HTMLSpanElement>(null);

    useImperativeHandle(ref, () => ({
      setCharState: setState,
      setIsCursor,
      getDomNode: () => capRef.current as unknown as HTMLDivElement,
    }));

    let cls =
      "inline-flex items-center justify-center align-baseline mx-[0.3em] px-[0.3em] rounded-md border-2 font-sans font-semibold text-[0.5em] leading-none h-[1.4em] min-w-[1.7em] -translate-y-[0.12em] transition-colors duration-150 ";
    if (state === UNTYPED) {
      cls += isCursor
        ? "border-neutral-800 text-neutral-900 bg-white shadow-sm dark:border-neutral-300 dark:text-white dark:bg-neutral-900 "
        : "border-neutral-300 text-neutral-400 dark:border-neutral-700 dark:text-neutral-600 ";
    } else if (state === CORRECT) {
      cls +=
        "border-[#50ce95] text-[#10c373] bg-[#e2f7e2] dark:bg-[#e2f7e2]/10 dark:text-[#50ce95] letter-pop ";
    } else if (state === CORRECT_FIXED) {
      cls +=
        "border-amber-400 text-amber-500 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 letter-pop ";
    } else {
      cls += "border-red-400 text-red-500 bg-red-500/10 letter-shake ";
    }

    return (
      <span ref={capRef} className={cls}>
        {label}
      </span>
    );
  }),
);
KeyCapUnit.displayName = "KeyCapUnit";
