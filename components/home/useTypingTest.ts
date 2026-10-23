"use client";

// The typing engine behind the home-page test. It copies Monkeytype's input
// model exactly, because that model is what people already have in their
// fingers (see docs/home-test.md §2):
//
//   • space commits the word even if it is half-typed — the rest counts as
//     "missed", and you move on. It never blocks you.
//   • letters typed past the end of a word are kept as "extra", not dropped.
//   • backspace at the start of a word steps back into the previous word only
//     if that word was imperfect; ctrl/alt+backspace wipes a whole word.
//   • the test ends the moment the last word is typed correctly — no trailing
//     space needed.
//
// The reference's `zen` mode is not implemented; that slot in the config bar is
// our curriculum picker instead (docs/home-test.md §1).
//
// The live model lives in one mutable ref (same idiom as the canvas games) so
// the keydown handler never reads a stale closure. Rendering reads a *snapshot*
// published after each keystroke, never the ref itself — that keeps React's
// rules satisfied and, because <Word> is memo'd, a keystroke still only
// re-renders the one word being typed.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildTest,
  consistencyOf,
  countChars,
  generateWords,
  modeValueLabel,
  TIME_BATCH,
  wpmOf,
  type Sample,
  type TestConfig,
  type TestResult,
  type TestText,
} from "@/lib/typing/typingTest";
import { createStatsSession, recordAttempt, type StatsSession } from "@/lib/typing/stats";

export type TestStatus = "idle" | "running" | "done";

interface Model {
  words: string[];
  /** committed words, index-aligned with `words` */
  typed: string[];
  /** the word being typed right now */
  input: string;
  wordIdx: number;
  status: TestStatus;
  startedAt: number | null;
  source?: string;
  infinite: boolean;
  totalKeys: number;
  correctKeys: number;
  problemKeys: Record<string, number>;
  samples: Sample[];
  /** whole seconds already sampled */
  sampledTo: number;
  /** seconds left in a `time` test */
  timeLeft: number;
  result: TestResult | null;
  stats: StatsSession | null;
}

/** What the UI is allowed to see. Republished after every keystroke. */
interface Snapshot {
  words: string[];
  typed: string[];
  input: string;
  wordIdx: number;
  status: TestStatus;
  result: TestResult | null;
  source?: string;
  timeLeft: number;
}

/** What both the server and the very first client render show: nothing yet. */
const BLANK_SNAPSHOT: Omit<Snapshot, "timeLeft"> = {
  words: [],
  typed: [],
  input: "",
  wordIdx: 0,
  status: "idle",
  result: null,
};

function snapshotOf(m: Model): Snapshot {
  return {
    words: m.words,
    typed: m.typed,
    input: m.input,
    wordIdx: m.wordIdx,
    status: m.status,
    result: m.result,
    source: m.source,
    timeLeft: m.timeLeft,
  };
}

/**
 * `withText: false` builds the same model with no words in it. The words are
 * random, so building them during render would hand the server one set and the
 * client another — the first real set is generated in a mount effect instead.
 */
function emptyModel(cfg: TestConfig, withText = true): Model {
  const text: TestText = withText ? buildTest(cfg) : { words: [], infinite: false };
  return {
    words: text.words,
    typed: [],
    input: "",
    wordIdx: 0,
    status: "idle",
    startedAt: null,
    source: text.source,
    infinite: text.infinite,
    totalKeys: 0,
    correctKeys: 0,
    problemKeys: {},
    samples: [],
    sampledTo: 0,
    timeLeft: cfg.time,
    result: null,
    stats: null,
  };
}

/** Keep the buffer well ahead of the caret in the endless modes. */
const REFILL_AT = 25;

/** The clock starts on the first keystroke, not when the page loads. */
function start(m: Model) {
  if (m.status !== "idle") return;
  m.status = "running";
  m.startedAt = performance.now();
  m.stats = createStatsSession();
}

function refill(m: Model, cfg: TestConfig) {
  if (!m.infinite) return;
  if (m.words.length - m.wordIdx > REFILL_AT) return;
  m.words = [...m.words, ...generateWords(cfg, TIME_BATCH)];
}

/** Score whatever has been typed so far, including the word in progress. */
function charsSoFar(m: Model) {
  const typed = [...m.typed];
  if (m.input) typed[m.wordIdx] = m.input;
  return countChars(m.words, typed, m.input ? m.wordIdx + 1 : m.wordIdx);
}

/**
 * Fill in the per-second speed samples up to `elapsed`, which the result chart
 * and the consistency figure are built from.
 *
 * Called from the clock AND from every keystroke, deliberately. The clock alone
 * is not trustworthy: a 100 ms interval can be starved for the whole length of
 * a test (measured: `sampledTo` still 0 after ten seconds of typing), and when
 * that happens the chart silently vanishes and consistency reports a fake
 * 100 %. Backfilling on each keystroke makes the series depend on the typing
 * itself, which is the thing being measured.
 */
function sampleUpTo(m: Model, elapsedMs: number) {
  const secs = Math.floor(elapsedMs / 1000);
  while (m.sampledTo < secs) {
    m.sampledTo++;
    const chars = charsSoFar(m);
    const at = m.sampledTo * 1000;
    m.samples.push({
      t: m.sampledTo,
      wpm: Math.round(wpmOf(chars.correct, at)),
      raw: Math.round(wpmOf(chars.correct + chars.incorrect + chars.extra, at)),
      errors: chars.incorrect,
    });
  }
}

export interface TypingTest {
  words: string[];
  typed: string[];
  input: string;
  wordIdx: number;
  status: TestStatus;
  result: TestResult | null;
  source?: string;
  /** what the keyboard + hands should point at, or null when nothing is due */
  expectedKey: string | null;
  /** the big number over the text: seconds left, or `12/25` */
  progressLabel: string;
  restart: () => void;
  /** the same words again — the reference's "repeat test" */
  repeat: () => void;
}

export function useTypingTest(cfg: TestConfig, enabled: boolean): TypingTest {
  const m = useRef<Model>(emptyModel(cfg, false));
  const [snap, setSnap] = useState<Snapshot>(() => ({ ...BLANK_SNAPSHOT, timeLeft: cfg.time }));
  const publish = useCallback(() => setSnap(snapshotOf(m.current)), []);

  // Never hand this to onClick directly — see `restart` below.
  const reset = useCallback(
    (keepWords?: string[]) => {
      const next = emptyModel(cfg);
      if (keepWords) next.words = keepWords;
      m.current.stats?.end();
      m.current = next;
      publish();
    },
    [cfg, publish],
  );

  // `reset` takes an optional word list, so wiring it straight to a button
  // would hand it the click event as the words. Both exits are wrapped.
  const restart = useCallback(() => reset(), [reset]);
  const repeat = useCallback(() => reset(m.current.words), [reset]);

  // Also the first fill: `emptyModel(cfg, false)` above deliberately has no
  // words, so this is where the test actually gets its text.
  useEffect(() => {
    reset();
  }, [reset]);

  const finish = useCallback(() => {
    const s = m.current;
    if (s.status === "done") return;
    const ms = s.startedAt === null ? 0 : performance.now() - s.startedAt;

    const chars = charsSoFar(s);
    const typedTotal = chars.correct + chars.incorrect + chars.extra;

    // Close the series on the real end time, so a test that ends mid-second
    // still has an endpoint — and a very short one has a chart at all.
    sampleUpTo(s, ms);
    const samples = [...s.samples];
    const last = samples[samples.length - 1];
    if (!last || ms / 1000 - last.t > 0.25) {
      samples.push({
        t: Math.round((ms / 1000) * 10) / 10,
        wpm: Math.round(wpmOf(chars.correct, ms)),
        raw: Math.round(wpmOf(typedTotal, ms)),
        errors: chars.incorrect,
      });
    }
    const result: TestResult = {
      wpm: Math.round(wpmOf(chars.correct, ms)),
      raw: Math.round(wpmOf(typedTotal, ms)),
      accuracy: s.totalKeys ? (s.correctKeys / s.totalKeys) * 100 : 100,
      consistency: consistencyOf(samples),
      chars,
      timeMs: Math.round(ms),
      samples,
      mode: cfg.mode,
      modeValue: modeValueLabel(cfg),
      lang: cfg.lang,
      source: s.source,
      problemKeys: s.problemKeys,
    };

    s.status = "done";
    s.result = result;
    s.stats?.end();
    s.stats = null;

    // Feed the all-time dashboard. `home_test` is not a lesson id on purpose —
    // nothing resolves attempts back to the curriculum.
    recordAttempt({
      lessonId: "home_test",
      type: "test",
      wpm: result.wpm,
      accuracy: Math.round(result.accuracy),
      stars: 0,
      timeMs: result.timeMs,
      errors: chars.incorrect + chars.extra + chars.missed,
      problemKeys: Object.fromEntries(
        Object.entries(result.problemKeys)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8),
      ),
    });
    publish();
  }, [cfg, publish]);

  // ─── the clock ───
  // One interval drives both the countdown and the per-second speed samples the
  // result chart and the consistency figure are built from.
  useEffect(() => {
    const id = window.setInterval(() => {
      const s = m.current;
      if (s.status !== "running" || s.startedAt === null) return;
      const ms = performance.now() - s.startedAt;
      sampleUpTo(s, ms);

      if (cfg.mode !== "time") return;
      const left = Math.max(0, cfg.time - Math.floor(ms / 1000));
      if (left === s.timeLeft) return;
      s.timeLeft = left;
      if (left === 0) finish();
      else publish();
    }, 100);
    return () => window.clearInterval(id);
  }, [cfg, finish, publish]);

  // ─── keystrokes ───
  const press = useCallback(
    (e: KeyboardEvent) => {
      const s = m.current;
      // Every keystroke is also a clock tick — see sampleUpTo's comment.
      if (s.status === "running" && s.startedAt !== null) {
        sampleUpTo(s, performance.now() - s.startedAt);
      }

      if (e.key === "Tab") {
        e.preventDefault();
        reset();
        return;
      }
      if (s.status === "done") {
        // Enter takes the next test, exactly like the reference.
        if (e.key === "Enter") {
          e.preventDefault();
          reset();
        }
        return;
      }
      if (e.key === "Backspace") {
        e.preventDefault();
        if (s.input.length === 0) {
          // Step back only into a word that still has something wrong with it.
          const prev = s.wordIdx - 1;
          if (prev < 0) return;
          if ((s.typed[prev] ?? "") === (s.words[prev] ?? "")) return;
          s.wordIdx = prev;
          s.input = s.typed[prev] ?? "";
          s.typed = s.typed.slice(0, prev);
        } else if (e.ctrlKey || e.altKey || e.metaKey) {
          s.input = "";
        } else {
          s.input = s.input.slice(0, -1);
        }
        publish();
        return;
      }

      // Everything else with a modifier belongs to the browser.
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length !== 1) return;
      e.preventDefault();

      const target = s.words[s.wordIdx] ?? "";

      if (e.key === " ") {
        if (s.input.length === 0) return; // leading spaces do nothing
        start(s);
        s.totalKeys++;
        if (s.input === target) s.correctKeys++;
        s.stats?.stroke(" ", s.input === target);

        s.typed = [...s.typed];
        s.typed[s.wordIdx] = s.input;
        s.wordIdx++;
        s.input = "";
        refill(s, cfg);
        if (!s.infinite && s.wordIdx >= s.words.length) finish();
        else publish();
        return;
      }

      start(s);
      // A word can grow past its target, but not without limit — the reference
      // stops accepting once you are hopelessly past the end.
      if (s.input.length >= target.length + 12) return;

      const expected = target[s.input.length] ?? null;
      const correct = expected === null || e.key === expected;
      s.totalKeys++;
      if (correct) s.correctKeys++;
      else if (expected) s.problemKeys[expected] = (s.problemKeys[expected] ?? 0) + 1;
      if (expected) s.stats?.stroke(expected, correct);

      s.input += e.key;

      // Finishing the last word correctly ends the test without a trailing space.
      if (!s.infinite && s.wordIdx === s.words.length - 1 && s.input === target) {
        s.typed = [...s.typed];
        s.typed[s.wordIdx] = s.input;
        s.wordIdx++;
        s.input = "";
        finish();
        return;
      }
      publish();
    },
    [cfg, finish, publish, reset],
  );

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      // Never steal keys from a real field (the custom-text box, search…).
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      press(e);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [press, enabled]);

  // Flush whatever was typed into the all-time key stats when the page goes.
  useEffect(() => {
    const model = m;
    return () => model.current.stats?.end();
  }, []);

  const target = snap.words[snap.wordIdx] ?? "";
  const expectedKey =
    snap.status === "done"
      ? null
      : snap.input.length < target.length
        ? target[snap.input.length]
        : " ";

  const progressLabel =
    cfg.mode === "time"
      ? String(snap.timeLeft)
      : `${Math.min(snap.wordIdx, snap.words.length)}/${snap.words.length}`;

  return {
    words: snap.words,
    typed: snap.typed,
    input: snap.input,
    wordIdx: snap.wordIdx,
    status: snap.status,
    result: snap.result,
    source: snap.source,
    expectedKey: expectedKey ?? null,
    progressLabel,
    restart,
    repeat,
  };
}
