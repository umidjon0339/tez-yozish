"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

/* Likes and play counters for the /games cards.

   These are LOCAL counters. The store is this browser's localStorage, so every
   number a player sees is their own: how many times they opened each game, and
   whether they hearted it. Nothing is sent anywhere.

   If the counts ever have to become community-wide, `read()` and `write()` are
   the only two functions that change — the components only ever see the
   snapshot and the two actions below. */

const STORAGE_KEY = "tz-games-v1";

export type GameCounters = {
  /** plays: how many times this browser opened each game */
  views: Record<string, number>;
  /** hearted games (a slug is present only while it is liked) */
  liked: Record<string, boolean>;
};

const EMPTY: GameCounters = { views: {}, liked: {} };

const listeners = new Set<() => void>();

/* useSyncExternalStore compares snapshots by identity, so the parsed object is
   cached and only rebuilt when something writes (or another tab does). */
let cache: GameCounters | null = null;
let wired = false;

function read(): GameCounters {
  if (cache) return cache;
  let next = EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<GameCounters> | null;
      next = {
        views: p && typeof p.views === "object" && p.views ? p.views : {},
        liked: p && typeof p.liked === "object" && p.liked ? p.liked : {},
      };
    }
  } catch {}
  cache = next;
  return next;
}

function write(next: GameCounters) {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((cb) => cb());
}

function subscribe(cb: () => void) {
  /* another tab liking a game should move the heart here too */
  if (!wired && typeof window !== "undefined") {
    wired = true;
    window.addEventListener("storage", (e) => {
      if (e.key !== null && e.key !== STORAGE_KEY) return;
      cache = null;
      listeners.forEach((f) => f());
    });
  }
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** The whole store, plus the one action a card needs. */
export function useGameCounters() {
  const snap = useSyncExternalStore(subscribe, read, () => EMPTY);

  const toggleLike = useCallback((slug: string) => {
    const cur = read();
    const liked = { ...cur.liked };
    if (liked[slug]) delete liked[slug];
    else liked[slug] = true;
    write({ views: cur.views, liked });
  }, []);

  return { views: snap.views, liked: snap.liked, toggleLike };
}

/** Count one play. Call it from a game route — it fires once per visit. */
export function useGameView(slug: string) {
  /* the ref survives React's StrictMode double-invoke, so opening a game in
     dev does not count two plays */
  const counted = useRef(false);
  useEffect(() => {
    if (counted.current) return;
    counted.current = true;
    const cur = read();
    write({
      liked: cur.liked,
      views: { ...cur.views, [slug]: (cur.views[slug] ?? 0) + 1 },
    });
  }, [slug]);
}

/** 940 → "940", 1240 → "1.2k", 26400 → "26k" — the card has no room for more. */
export function formatCount(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0";
  if (n < 1000) return String(Math.round(n));
  if (n < 10000) return (Math.floor(n / 100) / 10).toFixed(1) + "k";
  if (n < 1_000_000) return Math.round(n / 1000) + "k";
  return (Math.floor(n / 100_000) / 10).toFixed(1) + "M";
}
