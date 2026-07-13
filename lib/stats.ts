// Keystroke statistics — stored in localStorage (key: tz-stats-v1).
// Aggregates only (no raw keystroke log): lifetime per-key counters,
// per-day activity, a capped list of recent lesson attempts and records.
// All reads/writes are SSR-guarded, same contract style as lib/progress.ts.
//
// Reactivity follows the house useSyncExternalStore idiom (lib/locale.tsx):
// a module-level snapshot cache + subscriber set — no Provider.

import { useSyncExternalStore } from "react";
import {
  FINGER_OF_KEY_ID,
  ROW_OF_KEY_ID,
  keyIdForChar,
  LEFT_HAND_KEYS,
  type Finger,
  type KeyRow,
} from "@/components/keyboard/keymap";

// ─── STORAGE SHAPE (compatibility contract — bump the key on change) ───

export interface KeyAgg {
  presses: number; // correct presses of this expected key
  errors: number; // wrong key pressed when this key was expected
  totalMs: number; // sum of timed inter-key intervals (correct presses only)
  samples: number; // how many intervals are in totalMs
}

export interface DayAgg {
  ms: number; // active typing time
  keys: number; // keystrokes (correct + errors)
  errors: number;
  lessons: number; // lesson completions
  wpmSum: number; // per-attempt wpm sum   (avg = wpmSum / wpmCount)
  wpmCount: number;
  accSum: number; // per-attempt accuracy sum
  accCount: number;
  bestWpm: number;
}

export interface AttemptRec {
  lessonId: string;
  at: string; // ISO datetime
  type: string; // lesson type: lesson / practice / test / game
  wpm: number;
  accuracy: number; // 0-100
  stars: number; // 0-5
  timeMs: number;
  errors: number;
  problemKeys: Record<string, number>; // expected char -> mistakes (top 8)
}

export interface StatsRecords {
  bestWpm: number;
  bestAccuracy: number;
  bestCombo: number; // longest run of correct keystrokes
}

export interface StatsStore {
  version: 1;
  keys: Record<string, KeyAgg>; // normalized char -> lifetime agg
  days: Record<string, DayAgg>; // "YYYY-MM-DD" (local) -> day agg
  attempts: AttemptRec[]; // oldest → newest, capped
  records: StatsRecords;
}

const STORAGE_KEY = "tz-stats-v1";
const MAX_ATTEMPTS = 200;
const MAX_STROKE_GAP_MS = 2500; // longer pauses don't count as typing time
const MIN_STROKE_GAP_MS = 25; // guard against key-repeat artifacts

export function emptyStats(): StatsStore {
  return {
    version: 1,
    keys: {},
    days: {},
    attempts: [],
    records: { bestWpm: 0, bestAccuracy: 0, bestCombo: 0 },
  };
}

// ─── EXTERNAL STORE (read side) ───

let cache: StatsStore | null = null;
const listeners = new Set<() => void>();

function readStore(): StatsStore {
  if (typeof window === "undefined") return emptyStats();
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as StatsStore) : null;
    cache = parsed && parsed.version === 1 ? parsed : emptyStats();
  } catch {
    cache = emptyStats();
  }
  return cache;
}

function writeStore(store: StatsStore) {
  cache = store;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // storage full/blocked — stats just aren't persisted
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const SERVER_SNAPSHOT = emptyStats();

export function getStats(): StatsStore {
  return readStore();
}

export function useStats(): StatsStore {
  return useSyncExternalStore(subscribe, readStore, () => SERVER_SNAPSHOT);
}

export function resetStats() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  cache = emptyStats();
  listeners.forEach((l) => l());
}

// ─── HELPERS ───

export function localDayKey(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function emptyDay(): DayAgg {
  return {
    ms: 0,
    keys: 0,
    errors: 0,
    lessons: 0,
    wpmSum: 0,
    wpmCount: 0,
    accSum: 0,
    accCount: 0,
    bestWpm: 0,
  };
}

// Normalize an expected token to a stats key: single chars lowercase
// ("F" and "f" are the same physical skill), special keys / chords as
// lowercase token names ("enter", "ctrl+c").
export function normalizeStatKey(expected: string): string {
  return expected.toLowerCase();
}

// ─── SESSION RECORDER (write side) ───
// One session per continuous typing activity (a gym step, a chat reply
// screen, a game run…). stroke() buffers in memory; end() merges the
// buffer into the store in a single localStorage write.

export interface StatsSession {
  stroke(expected: string, correct: boolean): void;
  /** Flush buffered strokes into the store. Safe to call once; later calls no-op. */
  end(): void;
}

export function createStatsSession(): StatsSession {
  const buf = new Map<string, KeyAgg>();
  let activeMs = 0;
  let strokes = 0;
  let errors = 0;
  let combo = 0;
  let bestCombo = 0;
  let lastAt: number | null = null;
  let done = false;

  return {
    stroke(expected: string, correct: boolean) {
      if (done || !expected) return;
      const key = normalizeStatKey(expected);
      const now = performance.now();
      const gap = lastAt === null ? null : now - lastAt;
      lastAt = now;

      let agg = buf.get(key);
      if (!agg) {
        agg = { presses: 0, errors: 0, totalMs: 0, samples: 0 };
        buf.set(key, agg);
      }

      strokes++;
      if (correct) {
        agg.presses++;
        combo++;
        if (combo > bestCombo) bestCombo = combo;
        if (gap !== null && gap >= MIN_STROKE_GAP_MS && gap <= MAX_STROKE_GAP_MS) {
          agg.totalMs += gap;
          agg.samples++;
        }
      } else {
        agg.errors++;
        errors++;
        combo = 0;
      }
      if (gap !== null && gap <= MAX_STROKE_GAP_MS) activeMs += gap;
    },

    end() {
      if (done || strokes === 0) {
        done = true;
        return;
      }
      done = true;
      const store = structuredClone(readStore());

      for (const [key, add] of buf) {
        const agg = store.keys[key] ?? {
          presses: 0,
          errors: 0,
          totalMs: 0,
          samples: 0,
        };
        agg.presses += add.presses;
        agg.errors += add.errors;
        agg.totalMs += add.totalMs;
        agg.samples += add.samples;
        store.keys[key] = agg;
      }

      const dayKey = localDayKey();
      const day = store.days[dayKey] ?? emptyDay();
      day.ms += Math.round(activeMs);
      day.keys += strokes;
      day.errors += errors;
      store.days[dayKey] = day;

      if (bestCombo > store.records.bestCombo)
        store.records.bestCombo = bestCombo;

      writeStore(store);
    },
  };
}

// Record a finished lesson/game attempt (call alongside saveLessonResult).
export function recordAttempt(attempt: Omit<AttemptRec, "at">) {
  if (typeof window === "undefined") return;
  const store = structuredClone(readStore());

  const rec: AttemptRec = { ...attempt, at: new Date().toISOString() };
  store.attempts.push(rec);
  if (store.attempts.length > MAX_ATTEMPTS)
    store.attempts = store.attempts.slice(-MAX_ATTEMPTS);

  const dayKey = localDayKey();
  const day = store.days[dayKey] ?? emptyDay();
  day.lessons += 1;
  if (attempt.wpm > 0) {
    day.wpmSum += attempt.wpm;
    day.wpmCount += 1;
    if (attempt.wpm > day.bestWpm) day.bestWpm = attempt.wpm;
  }
  day.accSum += attempt.accuracy;
  day.accCount += 1;
  store.days[dayKey] = day;

  if (attempt.wpm > store.records.bestWpm) store.records.bestWpm = attempt.wpm;
  if (attempt.accuracy > store.records.bestAccuracy)
    store.records.bestAccuracy = attempt.accuracy;

  writeStore(store);
}

// ─── DERIVED STATS (pure functions over a StatsStore snapshot) ───

export interface KeyStat {
  key: string; // normalized char/token
  keyId: string | null; // SVG key id (null → not on the visual keyboard)
  finger: Finger | null;
  row: KeyRow | null;
  presses: number;
  errors: number;
  total: number;
  errorRate: number; // 0-1
  avgMs: number | null; // avg interval per correct press
  keyWpm: number | null; // speed expressed as wpm (5 chars = 1 word)
  confidence: number | null; // 0-100, null until enough data
}

const MIN_CONFIDENCE_PRESSES = 15;
const TARGET_KEY_WPM = 30; // full speed score at this per-key speed
export const CONFIDENCE_LEARNED = 75; // "learned" threshold, 0-100

export function computeKeyStats(store: StatsStore): KeyStat[] {
  return Object.entries(store.keys).map(([key, agg]) => {
    const keyId = keyIdForChar(key);
    const total = agg.presses + agg.errors;
    const errorRate = total > 0 ? agg.errors / total : 0;
    const avgMs = agg.samples > 0 ? agg.totalMs / agg.samples : null;
    const keyWpm = avgMs && avgMs > 0 ? 12000 / avgMs / 5 : null;

    let confidence: number | null = null;
    if (agg.presses >= MIN_CONFIDENCE_PRESSES) {
      const accScore = Math.max(0, 1 - errorRate * 4); // 25% errors → 0
      const speedScore =
        keyWpm === null ? 0 : Math.min(1, keyWpm / TARGET_KEY_WPM);
      confidence = Math.round(100 * (0.55 * accScore + 0.45 * speedScore));
    }

    return {
      key,
      keyId,
      finger: keyId ? (FINGER_OF_KEY_ID[keyId] ?? null) : null,
      row: keyId ? (ROW_OF_KEY_ID[keyId] ?? null) : null,
      presses: agg.presses,
      errors: agg.errors,
      total,
      errorRate,
      avgMs,
      keyWpm,
      confidence,
    };
  });
}

export interface GroupStat {
  presses: number;
  errors: number;
  total: number;
  errorRate: number;
  avgMs: number | null;
  accuracy: number; // 0-100
}

function groupOf(stats: KeyStat[]): GroupStat {
  let presses = 0,
    errors = 0,
    totalMs = 0,
    samples = 0;
  for (const s of stats) {
    presses += s.presses;
    errors += s.errors;
    if (s.avgMs !== null) {
      // re-weight by press count so big keys dominate correctly
      totalMs += s.avgMs * s.presses;
      samples += s.presses;
    }
  }
  const total = presses + errors;
  return {
    presses,
    errors,
    total,
    errorRate: total > 0 ? errors / total : 0,
    avgMs: samples > 0 ? totalMs / samples : null,
    accuracy: total > 0 ? Math.round((presses / total) * 100) : 100,
  };
}

export function computeFingerStats(
  keyStats: KeyStat[],
): Record<Finger, GroupStat> {
  const out = {} as Record<Finger, GroupStat>;
  const byFinger = new Map<Finger, KeyStat[]>();
  for (const s of keyStats) {
    if (!s.finger) continue;
    const arr = byFinger.get(s.finger) ?? [];
    arr.push(s);
    byFinger.set(s.finger, arr);
  }
  for (const [finger, arr] of byFinger) out[finger] = groupOf(arr);
  return out;
}

export function computeRowStats(keyStats: KeyStat[]): Record<KeyRow, GroupStat> {
  const out = {} as Record<KeyRow, GroupStat>;
  const byRow = new Map<KeyRow, KeyStat[]>();
  for (const s of keyStats) {
    if (!s.row) continue;
    const arr = byRow.get(s.row) ?? [];
    arr.push(s);
    byRow.set(s.row, arr);
  }
  for (const [row, arr] of byRow) out[row] = groupOf(arr);
  return out;
}

export function computeHandStats(keyStats: KeyStat[]): {
  left: GroupStat;
  right: GroupStat;
} {
  const left: KeyStat[] = [];
  const right: KeyStat[] = [];
  for (const s of keyStats) {
    if (!s.keyId || s.finger === "thumb") continue; // space is shared
    (LEFT_HAND_KEYS.has(s.keyId) ? left : right).push(s);
  }
  return { left: groupOf(left), right: groupOf(right) };
}

// Daily series for the history charts — last `rangeDays` calendar days,
// each entry present even when empty (charts want a continuous axis).
export interface DayPoint {
  day: string; // YYYY-MM-DD
  date: Date;
  ms: number;
  keys: number;
  errors: number;
  lessons: number;
  avgWpm: number | null;
  avgAcc: number | null;
  bestWpm: number;
}

export function computeDaySeries(
  store: StatsStore,
  rangeDays: number,
): DayPoint[] {
  const out: DayPoint[] = [];
  const today = new Date();
  for (let i = rangeDays - 1; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const day = localDayKey(date);
    const agg = store.days[day];
    out.push({
      day,
      date,
      ms: agg?.ms ?? 0,
      keys: agg?.keys ?? 0,
      errors: agg?.errors ?? 0,
      lessons: agg?.lessons ?? 0,
      avgWpm: agg && agg.wpmCount > 0 ? agg.wpmSum / agg.wpmCount : null,
      avgAcc: agg && agg.accCount > 0 ? agg.accSum / agg.accCount : null,
      bestWpm: agg?.bestWpm ?? 0,
    });
  }
  return out;
}

// A day counts toward the streak when it has any real activity.
const STREAK_MIN_KEYS = 20;

export function computeStreak(store: StatsStore): {
  current: number;
  longest: number;
} {
  const activeDays = new Set(
    Object.entries(store.days)
      .filter(([, d]) => d.keys >= STREAK_MIN_KEYS)
      .map(([day]) => day),
  );
  if (activeDays.size === 0) return { current: 0, longest: 0 };

  // current: walk back from today (today itself may still be empty)
  let current = 0;
  const cursor = new Date();
  if (!activeDays.has(localDayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (activeDays.has(localDayKey(cursor))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // longest: scan sorted active days
  const sorted = [...activeDays].sort();
  let longest = 0,
    run = 0,
    prev: Date | null = null;
  for (const day of sorted) {
    const [y, m, d] = day.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    run =
      prev !== null && date.getTime() - prev.getTime() === 86400000
        ? run + 1
        : 1;
    if (run > longest) longest = run;
    prev = date;
  }
  return { current, longest };
}

export interface Totals {
  ms: number;
  keys: number;
  errors: number;
  lessons: number;
  words: number; // standard 5 chars = 1 word
  activeDays: number;
}

export function computeTotals(store: StatsStore): Totals {
  let ms = 0,
    keys = 0,
    errors = 0,
    lessons = 0,
    activeDays = 0;
  for (const d of Object.values(store.days)) {
    ms += d.ms;
    keys += d.keys;
    errors += d.errors;
    lessons += d.lessons;
    if (d.keys > 0) activeDays++;
  }
  return {
    ms,
    keys,
    errors,
    lessons,
    words: Math.round((keys - errors) / 5),
    activeDays,
  };
}

export interface WeekSummary {
  ms: number;
  lessons: number;
  avgWpm: number | null;
  wpmDelta: number | null; // vs previous 7 days
  worstKey: string | null; // most errors in the last 7 days' attempts
}

export function computeWeekSummary(store: StatsStore): WeekSummary {
  const last7 = computeDaySeries(store, 7);
  const prev7 = computeDaySeries(store, 14).slice(0, 7);

  const avg = (points: DayPoint[]): number | null => {
    const vals = points.filter((p) => p.avgWpm !== null);
    if (vals.length === 0) return null;
    return vals.reduce((a, p) => a + (p.avgWpm as number), 0) / vals.length;
  };

  const avgWpm = avg(last7);
  const prevAvg = avg(prev7);

  // worst key: aggregate problemKeys over this week's attempts
  const weekStart = last7[0].date.getTime();
  const perKey: Record<string, number> = {};
  for (const a of store.attempts) {
    if (new Date(a.at).getTime() < weekStart) continue;
    for (const [k, n] of Object.entries(a.problemKeys))
      perKey[k] = (perKey[k] ?? 0) + n;
  }
  let worstKey: string | null = null;
  let worst = 1; // require ≥2 errors, same bar as progress.ts hardestKey
  for (const [k, n] of Object.entries(perKey)) {
    if (n > worst) {
      worst = n;
      worstKey = k;
    }
  }

  return {
    ms: last7.reduce((a, p) => a + p.ms, 0),
    lessons: last7.reduce((a, p) => a + p.lessons, 0),
    avgWpm,
    wpmDelta:
      avgWpm !== null && prevAvg !== null ? avgWpm - prevAvg : null,
    worstKey,
  };
}
