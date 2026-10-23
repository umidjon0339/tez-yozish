// Monkeytype public API client — read-only, no API key required.
// Used by /compete for the global leaderboards and the "you" card
// percentile. The endpoints are CORS-open, so the browser talks to
// api.monkeytype.com directly; responses are cached in sessionStorage
// to stay far below the API's rate limit (~500 requests/window).

export type MtBoard = "daily" | "alltime";
export type MtDuration = "15" | "60"; // time-mode test length, seconds

export interface MtEntry {
  rank: number;
  name: string;
  wpm: number;
  acc: number; // 0-100
  raw: number;
  consistency: number;
  timestamp: number; // ms epoch of the record run
  discordId?: string;
  discordAvatar?: string;
  badgeId?: number;
}

export interface MtLeaderboardPage {
  count: number; // total entries on the board (daily is capped at 1000)
  entries: MtEntry[];
  minWpm?: number; // daily board only: today's qualification bar
}

// Weekly XP board — rewards practice volume, not raw speed.
export interface MtXpEntry {
  rank: number;
  name: string;
  totalXp: number;
  timeTypedSeconds: number;
  lastActivityTimestamp: number; // ms epoch
}

export interface MtXpPage {
  count: number;
  entries: MtXpEntry[];
}

export interface MtTypingStats {
  testsCompleted: number;
  testsStarted: number;
  timeTyping: number; // seconds, all users combined
}

export const MT_PAGE_SIZE = 50;

const API = "https://api.monkeytype.com";

// The daily board churns constantly; the all-time board barely moves.
const TTL_MS: Record<MtBoard, number> = {
  daily: 60_000,
  alltime: 5 * 60_000,
};
const HISTOGRAM_TTL_MS = 60 * 60_000;

interface CacheSlot<T> {
  at: number;
  data: T;
}

function cacheGet<T>(key: string, ttl: number): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const slot = JSON.parse(raw) as CacheSlot<T>;
    return Date.now() - slot.at <= ttl ? slot.data : null;
  } catch {
    return null;
  }
}

function cachePut<T>(key: string, data: T) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), data }));
  } catch {
    // cache blocked/full — just refetch next time
  }
}

async function getJson<T>(url: string, cacheKey: string, ttl: number): Promise<T> {
  const hit = cacheGet<T>(cacheKey, ttl);
  if (hit !== null) return hit;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Monkeytype API ${res.status}`);
  const body = (await res.json()) as { data: T };
  cachePut(cacheKey, body.data);
  return body.data;
}

export function fetchLeaderboard(
  board: MtBoard,
  duration: MtDuration,
  page: number,
): Promise<MtLeaderboardPage> {
  const path = board === "daily" ? "/leaderboards/daily" : "/leaderboards";
  const qs = `language=english&mode=time&mode2=${duration}&page=${page}&pageSize=${MT_PAGE_SIZE}`;
  return getJson(
    `${API}${path}?${qs}`,
    `tz-mt:${board}:${duration}:${page}`,
    TTL_MS[board],
  );
}

export function fetchXpLeaderboard(page: number): Promise<MtXpPage> {
  return getJson(
    `${API}/leaderboards/xp/weekly?page=${page}&pageSize=${MT_PAGE_SIZE}`,
    `tz-mt:xp:${page}`,
    60_000,
  );
}

// Site-wide totals (tests completed, cumulative typing time…).
export function fetchTypingStats(): Promise<MtTypingStats> {
  return getJson(
    `${API}/public/typingStats`,
    "tz-mt:pulse",
    HISTOGRAM_TTL_MS,
  );
}

// WPM histogram of recent Monkeytype tests in 10-wpm buckets:
// { "60": 71796, ... } — bucket start → test count.
export function fetchSpeedHistogram(
  duration: MtDuration,
): Promise<Record<string, number>> {
  return getJson(
    `${API}/public/speedHistogram?language=english&mode=time&mode2=${duration}`,
    `tz-mt:hist:${duration}`,
    HISTOGRAM_TTL_MS,
  );
}

// Share of tests slower than `wpm`, 0-100 (linear interpolation inside
// the 10-wpm bucket the value falls in). Capped at 99 — nobody is
// "faster than 100% of the world".
export function percentileForWpm(
  histogram: Record<string, number>,
  wpm: number,
): number {
  let below = 0;
  let total = 0;
  for (const [start, count] of Object.entries(histogram)) {
    const lo = Number(start);
    total += count;
    if (wpm >= lo + 10) below += count;
    else if (wpm > lo) below += count * ((wpm - lo) / 10);
  }
  if (total === 0) return 0;
  return Math.min(99, Math.round((below / total) * 100));
}

// Where a result would land among the tests in the public histogram: how many
// were faster, out of how many were sampled. It is a rank among *tests*, not
// among people or leaderboard entries — the home page labels it as an estimate
// for exactly that reason (docs/home-test.md §7).
export function rankForWpm(
  histogram: Record<string, number>,
  wpm: number,
): { faster: number; total: number; percentile: number } {
  let below = 0;
  let total = 0;
  for (const [start, count] of Object.entries(histogram)) {
    const lo = Number(start);
    total += count;
    if (wpm >= lo + 10) below += count;
    else if (wpm > lo) below += count * ((wpm - lo) / 10);
  }
  return {
    faster: Math.max(1, Math.round(total - below)),
    total,
    percentile: percentileForWpm(histogram, wpm),
  };
}

export function discordAvatarUrl(e: MtEntry): string | null {
  if (!e.discordId || !e.discordAvatar) return null;
  return `https://cdn.discordapp.com/avatars/${e.discordId}/${e.discordAvatar}.png?size=64`;
}
