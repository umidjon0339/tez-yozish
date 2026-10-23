"use client";

// Word Rain — the shared 2D typing game of the English units (phonemes,
// graphemes, spellings). Words fall inside chips; type a word
// letter-by-letter to burst its chip (first letter locks the lowest
// matching chip, ninja-style). A chip that reaches the ground costs a
// heart. Pure SVG + one rAF loop; the simulation lives in a mutable ref
// (the ninja idiom) and each frame commits once through setView. Reports
// accuracy-only stats; every keystroke feeds the all-time stats layer.

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";
import { createStatsSession, type StatsSession } from "@/lib/typing/stats";
import {
  playErrSound,
  playKeySound,
  shuffled,
  type StageStats,
} from "@/components/english/stage-kit";

interface Chip {
  id: number;
  word: string;
  typed: number; // letters completed
  x: number; // svg coords, chip center
  y: number;
  speed: number; // px per second
  color: string;
  poppedAt: number | null; // sim time ms, for the burst animation
}

const W = 900;
const H = 520;
const GROUND_Y = 468;
const CHIP_H = 34;
const TOTAL_SPAWNS = 20;
const START_HEARTS = 3;
const COLORS = ["#38BDF8", "#34D399", "#FBBF24", "#A78BFA", "#FB7185"];

interface Sim {
  phase: "idle" | "play" | "over";
  chips: Chip[];
  spawned: number;
  hearts: number;
  score: number;
  correct: number;
  mistakes: number;
  perKey: Record<string, number>;
  targetId: number | null;
  simTime: number;
  nextSpawnAt: number;
  lastFrame: number | null;
  nextId: number;
}

function freshSim(): Sim {
  return {
    phase: "idle",
    chips: [],
    spawned: 0,
    hearts: START_HEARTS,
    score: 0,
    correct: 0,
    mistakes: 0,
    perKey: {},
    targetId: null,
    simTime: 0,
    nextSpawnAt: 400,
    lastFrame: null,
    nextId: 1,
  };
}

interface View {
  phase: Sim["phase"];
  chips: Chip[];
  spawned: number;
  hearts: number;
  score: number;
  targetId: number | null;
  simTime: number;
}

function snapshot(s: Sim): View {
  return {
    phase: s.phase,
    chips: s.chips.map((c) => ({ ...c })),
    spawned: s.spawned,
    hearts: s.hearts,
    score: s.score,
    targetId: s.targetId,
    simTime: s.simTime,
  };
}

function chipWidth(word: string): number {
  return word.length * 15 + 30;
}

export function WordRain({
  words,
  hudLabel,
  helpText,
  startText,
  scoreLabel,
  isAudioEnabled,
  onDone,
}: {
  /** Single a–z words (no phrases) — the falling pool, cycled reshuffled. */
  words: string[];
  /** Shown in the HUD next to the spawn counter ("/iː/", "ea", …). */
  hudLabel: string;
  helpText: string;
  startText: string;
  scoreLabel: string;
  isAudioEnabled: boolean;
  onDone: (stats: StageStats) => void;
}) {
  const sim = useRef<Sim>(freshSim());
  const [view, setView] = useState<View>(() => snapshot(freshSim()));
  const session = useRef<StatsSession | null>(null);
  const audioRef = useRef(isAudioEnabled);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    audioRef.current = isAudioEnabled;
    onDoneRef.current = onDone;
  });

  // Word picker: a reshuffled cycle so every word appears before repeats.
  // The queue lives in a ref — it is only touched from the rAF loop.
  const wordQueue = useRef<string[]>([]);
  const nextWord = useCallback(() => {
    if (wordQueue.current.length === 0) wordQueue.current = shuffled(words);
    return wordQueue.current.pop() as string;
  }, [words]);

  // One rAF loop for the whole game; ends itself and reports stats.
  useEffect(() => {
    let raf = 0;
    const step = (now: number) => {
      const s = sim.current;
      if (s.phase === "play") {
        const dt = s.lastFrame === null ? 16 : Math.min(48, now - s.lastFrame);
        s.simTime += dt;

        // Spawn until the budget is used up, slightly faster over time.
        if (s.spawned < TOTAL_SPAWNS && s.simTime >= s.nextSpawnAt) {
          const word = nextWord();
          const w = chipWidth(word);
          s.chips.push({
            id: s.nextId++,
            word,
            typed: 0,
            x: w / 2 + 30 + Math.random() * (W - w - 60),
            y: -CHIP_H,
            speed: Math.min(64, 26 + s.spawned * 2.4),
            color: COLORS[s.nextId % COLORS.length],
            poppedAt: null,
          });
          s.spawned++;
          s.nextSpawnAt = s.simTime + Math.max(2100, 3400 - s.spawned * 90);
        }

        // Fall + ground hits.
        for (const c of s.chips) {
          if (c.poppedAt !== null) continue;
          c.y += (c.speed * dt) / 1000;
          if (c.y >= GROUND_Y - CHIP_H) {
            c.poppedAt = s.simTime;
            s.hearts--;
            s.mistakes++;
            const blame = c.word[c.typed] ?? c.word[0];
            s.perKey[blame] = (s.perKey[blame] ?? 0) + 1;
            session.current?.stroke(blame, false);
            if (s.targetId === c.id) s.targetId = null;
            if (audioRef.current) playErrSound();
          }
        }

        // Drop finished burst animations.
        s.chips = s.chips.filter(
          (c) => c.poppedAt === null || s.simTime - c.poppedAt < 300,
        );

        const outOfHearts = s.hearts <= 0;
        const cleared = s.spawned >= TOTAL_SPAWNS && s.chips.length === 0;
        if (outOfHearts || cleared) {
          s.phase = "over";
          session.current?.end();
          session.current = null;
          const stats: StageStats = {
            correct: s.correct,
            mistakes: s.mistakes,
            timeMs: s.simTime,
            perKeyMistakes: s.perKey,
          };
          setTimeout(() => onDoneRef.current(stats), 650);
        }
      }
      sim.current.lastFrame = now;
      // Only push a React re-render while there's motion. On the idle
      // "press a key to start" screen the scene is static, so re-rendering
      // the SVG at 60fps just pins a CPU core for nothing. `over` is bounded
      // (onDone unmounts after 650ms) so its end animation still plays.
      if (s.phase !== "idle") setView(snapshot(sim.current));
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [nextWord]);

  // Flush the stats session if the player leaves mid-game.
  useEffect(() => {
    const s = session;
    return () => s.current?.end();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length !== 1 || !/[a-z]/i.test(e.key)) return;
      e.preventDefault();
      const s = sim.current;
      if (s.phase === "idle") {
        s.phase = "play";
        s.simTime = 0;
        s.nextSpawnAt = 400;
        session.current = createStatsSession();
        return;
      }
      if (s.phase !== "play") return;

      const key = e.key.toLowerCase();
      const live = (c: Chip) => c.poppedAt === null;
      let target = s.chips.find((c) => c.id === s.targetId && live(c));

      // No lock (or stale): the lowest chip whose next letter matches.
      if (!target || target.word[target.typed] !== key) {
        const candidate = s.chips
          .filter((c) => live(c) && c.word[c.typed] === key)
          .sort((a, b) => b.y - a.y)[0];
        if (candidate) target = candidate;
      }

      if (target && target.word[target.typed] === key) {
        s.targetId = target.id;
        target.typed++;
        s.correct++;
        session.current?.stroke(key, true);
        if (audioRef.current) playKeySound();
        if (target.typed >= target.word.length) {
          target.poppedAt = s.simTime;
          s.score += target.word.length * 10;
          s.targetId = null;
        }
      } else {
        s.mistakes++;
        const blame = target ? target.word[target.typed] : key;
        s.perKey[blame] = (s.perKey[blame] ?? 0) + 1;
        session.current?.stroke(blame, false);
        if (audioRef.current) playErrSound();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const s = view;

  return (
    <div className="w-full flex flex-col gap-3 px-4">
      {/* HUD */}
      <div className="flex items-center justify-between w-full">
        <span className="flex items-center gap-1">
          {Array.from({ length: START_HEARTS }, (_, i) => (
            <Heart
              key={i}
              className={`w-5 h-5 transition-colors ${
                i < s.hearts
                  ? "text-rose-500 fill-rose-500"
                  : "text-neutral-300 dark:text-neutral-700"
              }`}
            />
          ))}
        </span>
        <span className="font-mono text-[13px] text-neutral-500 dark:text-neutral-400">
          {s.spawned} / {TOTAL_SPAWNS} · {hudLabel}
        </span>
        <span className="font-mono text-sm font-bold text-neutral-900 dark:text-white">
          {scoreLabel}: {s.score}
        </span>
      </div>

      <div className="relative w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full select-none">
          {/* ground */}
          <line
            x1={40}
            x2={W - 40}
            y1={GROUND_Y}
            y2={GROUND_Y}
            stroke="#d4d4d4"
            strokeWidth={3}
            strokeLinecap="round"
          />
          {Array.from({ length: 24 }, (_, i) => (
            <line
              key={i}
              x1={58 + i * 34}
              x2={62 + i * 34}
              y1={GROUND_Y - 8}
              y2={GROUND_Y - 1}
              stroke="#a3e635"
              strokeWidth={3}
              strokeLinecap="round"
            />
          ))}

          {s.chips.map((c) => {
            const w = chipWidth(c.word);
            if (c.poppedAt !== null) {
              // burst: expanding spokes fading out
              const t = Math.min(1, (s.simTime - c.poppedAt) / 300);
              return (
                <g key={c.id} opacity={1 - t}>
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
                    const rad = (a * Math.PI) / 180;
                    const r1 = 14 * (0.4 + t);
                    const r2 = 14 * (0.9 + t * 1.6);
                    return (
                      <line
                        key={a}
                        x1={c.x + Math.cos(rad) * r1}
                        y1={c.y + Math.sin(rad) * r1}
                        x2={c.x + Math.cos(rad) * r2}
                        y2={c.y + Math.sin(rad) * r2}
                        stroke={c.color}
                        strokeWidth={4}
                        strokeLinecap="round"
                      />
                    );
                  })}
                </g>
              );
            }
            const isTarget = c.id === s.targetId;
            return (
              <g key={c.id}>
                <rect
                  x={c.x - w / 2}
                  y={c.y - CHIP_H / 2}
                  width={w}
                  height={CHIP_H}
                  rx={CHIP_H / 2}
                  fill="#ffffff"
                  stroke={c.color}
                  strokeWidth={isTarget ? 4 : 2.5}
                />
                {isTarget && (
                  <rect
                    x={c.x - w / 2 - 5}
                    y={c.y - CHIP_H / 2 - 5}
                    width={w + 10}
                    height={CHIP_H + 10}
                    rx={(CHIP_H + 10) / 2}
                    fill="none"
                    stroke={c.color}
                    strokeWidth={1.5}
                    opacity={0.5}
                  />
                )}
                <text
                  x={c.x}
                  y={c.y + 7}
                  textAnchor="middle"
                  fontSize={21}
                  fontWeight={800}
                  fontFamily="monospace"
                >
                  <tspan fill="#10c373">{c.word.slice(0, c.typed)}</tspan>
                  <tspan fill="#18181B">{c.word.slice(c.typed)}</tspan>
                </text>
              </g>
            );
          })}
        </svg>

        {s.phase === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/80 dark:bg-neutral-950/70 backdrop-blur-[2px] text-center px-6">
            <p className="text-lg font-bold text-neutral-900 dark:text-white">
              {helpText}
            </p>
            <p className="font-mono text-[12px] uppercase tracking-widest text-neutral-400 animate-pulse">
              {startText}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
