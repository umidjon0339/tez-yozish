"use client";

// The words of the home-page test, in the reference's three-line window.
//
// Two things are deliberately imperative here: the caret is positioned by
// measuring the active letter, and the line scroll is a transform written
// straight onto the inner div. Neither goes through React state, so a
// keystroke re-renders exactly one <Word> (they are memo'd) and nothing else.
//
// The caret glides rather than jumps — see `.tz-caret` in globals.css and
// docs/home-test.md §8 for why the numbers are what they are.

import React, { memo, useEffect, useLayoutEffect, useRef } from "react";

/** Visible lines — the reference shows three and scrolls the middle one. */
const LINES = 3;

/** How long the caret may stand still before it starts blinking again. */
const IDLE_MS = 700;

const LETTER = {
  pending: "text-neutral-400 dark:text-neutral-600",
  correct: "text-neutral-900 dark:text-neutral-100",
  wrong: "text-rose-500 dark:text-rose-400",
  extra: "text-rose-800/60 dark:text-rose-500/50",
};

const Word = memo(function Word({
  word,
  typed,
  active,
}: {
  word: string;
  typed?: string;
  active: boolean;
}) {
  const got = typed ?? "";
  const len = Math.max(word.length, got.length);
  const cells: React.ReactNode[] = [];

  for (let i = 0; i < len; i++) {
    const target = word[i];
    const ch = got[i];
    let cls: string;
    if (ch === undefined) cls = LETTER.pending;
    else if (target === undefined) cls = LETTER.extra;
    else if (ch === target) cls = LETTER.correct;
    else cls = LETTER.wrong;
    cells.push(
      <span key={i} className={cls}>
        {ch !== undefined && target === undefined ? ch : (target ?? ch)}
      </span>,
    );
  }

  // A finished word that still has something wrong keeps a red rule under it,
  // so mistakes stay visible after the caret has moved on.
  const flawed = typed !== undefined && !active && typed !== word;

  return (
    <span
      data-active={active ? "1" : undefined}
      className={`mr-[0.6em] inline-block ${flawed ? "border-b border-rose-500/60" : ""}`}
    >
      {cells}
    </span>
  );
});

export function TestWords({
  words,
  typed,
  input,
  wordIdx,
  variant = "window",
  maxHeight = "58vh",
}: {
  words: string[];
  typed: string[];
  input: string;
  wordIdx: number;
  /**
   * `window` — the reference's three-line viewport, the block slides under a
   * still caret. This is the home page and must not change.
   *
   * `full` — the whole text is laid out and the *container* scrolls, so a
   * learner can read the rest of a book page and scroll back over it. Used by
   * `/books`, where three lines of a 130-word page reads as truncated. Its
   * scrollbar is hidden (`.tz-noscrollbar`): it is the only scroller that
   * moves *while you type*, and a bar twitching beside the words is a
   * distraction exactly when attention should be on the text.
   */
  variant?: "window" | "full";
  /** `full` only — how tall the scroller may grow before it scrolls. */
  maxHeight?: string;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  const idleTimer = useRef<number | undefined>(undefined);

  // Runs after every keystroke: move the caret to the next letter, and scroll
  // the block so the active line is the middle of the three.
  useLayoutEffect(() => {
    const inner = innerRef.current;
    const caret = caretRef.current;
    if (!inner || !caret) return;

    const activeWord = inner.querySelector<HTMLElement>('[data-active="1"]');
    if (!activeWord) {
      // `visibility`, not `opacity` — the blink animation owns opacity.
      caret.style.visibility = "hidden";
      return;
    }
    caret.style.visibility = "visible";

    const letters = activeWord.children;
    const idx = Math.min(input.length, letters.length);
    let x: number;
    if (letters.length === 0) {
      x = activeWord.offsetLeft;
    } else if (idx >= letters.length) {
      const last = letters[letters.length - 1] as HTMLElement;
      x = last.offsetLeft + last.offsetWidth;
    } else {
      x = (letters[idx] as HTMLElement).offsetLeft;
    }

    const lineH = parseFloat(getComputedStyle(inner).lineHeight) || 1;
    const line = Math.floor(activeWord.offsetTop / lineH);

    if (variant === "window") {
      // Line 0 stays put; from line 1 on, the active line sits in the middle.
      const scroll = Math.max(0, line - 1) * lineH;
      inner.style.transform = `translateY(${-scroll}px)`;
    } else {
      // The text does not move in `full` — the container scrolls instead, so
      // the block must carry no transform of its own.
      inner.style.transform = "";
      const outer = outerRef.current;
      if (outer) {
        // Keep one line of air above and below the caret, and only move when
        // it would otherwise leave the box — so reading ahead is not fought.
        const top = line * lineH;
        const view = outer.scrollTop;
        if (top - lineH < view) {
          outer.scrollTop = Math.max(0, top - lineH);
        } else if (top + 2 * lineH > view + outer.clientHeight) {
          outer.scrollTop = top + 2 * lineH - outer.clientHeight;
        }
      }
    }

    // The caret is a child of the scrolling block, so it rides the scroll for
    // free — no `- scroll` here. Both carry the same 100 ms linear transition,
    // so on a line break the two deltas cancel and the caret holds still while
    // the text slides under it.
    const caretH = caret.offsetHeight;
    caret.style.transform = `translate(${x}px, ${line * lineH + (lineH - caretH) / 2}px)`;

    // Solid while the fingers move; blinking is a *resting* state.
    caret.classList.remove("tz-caret-idle");
    window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(
      () => caret.classList.add("tz-caret-idle"),
      IDLE_MS,
    );
  });

  useEffect(() => () => window.clearTimeout(idleTimer.current), []);

  return (
    <div
      ref={outerRef}
      className={`relative w-full font-mono text-[clamp(1.05rem,2.1vw,1.5rem)] select-none ${
        variant === "window" ? "overflow-hidden" : "overflow-y-auto tz-noscrollbar"
      }`}
      style={
        variant === "window"
          ? { lineHeight: "1.75em", height: `${LINES * 1.75}em` }
          : { lineHeight: "1.75em", maxHeight }
      }
    >
      {/* `relative` so the caret inside it positions against this block */}
      <div ref={innerRef} className="tz-words relative">
        {words.map((w, i) => (
          <Word
            key={i}
            word={w}
            typed={i === wordIdx ? input : typed[i]}
            active={i === wordIdx}
          />
        ))}
        <span
          ref={caretRef}
          aria-hidden
          className="tz-caret pointer-events-none absolute left-0 top-0 h-[1.15em] w-0.5 rounded-full bg-neutral-900 dark:bg-white"
        />
      </div>
    </div>
  );
}
