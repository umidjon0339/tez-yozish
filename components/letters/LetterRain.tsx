"use client";

// Letter Rain — the letters-unit game (lesson kind "RAIN").
// Letters fall inside balloons; typing a letter pops the LOWEST balloon
// carrying it. A balloon that reaches the ground costs a heart and counts
// as a mistake on that letter. Spawns are biased toward the current letter
// and its rivals, so the game drills exactly what the letter's test grades.
//
// Pure SVG + one rAF loop; simulation lives in a mutable ref (the ninja
// idiom) and each frame commits once through setTick.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Heart } from "lucide-react";

export interface RainStats {
  correct: number;
  mistakes: number;
  timeMs: number;
  perKeyMistakes: Record<string, number>;
}

interface Balloon {
  id: number;
  char: string;
  x: number; // svg coords
  y: number;
  speed: number; // px per second
  color: string;
  poppedAt: number | null; // sim time ms, for the burst animation
}

const W = 900;
const H = 520;
const GROUND_Y = 468;
const R = 26; // balloon radius
const TOTAL_SPAWNS = 30;
const START_HEARTS = 3;

const COLORS = ["#38BDF8", "#34D399", "#FBBF24", "#A78BFA", "#FB7185"];
const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

interface Sim {
  phase: "idle" | "play" | "over";
  balloons: Balloon[];
  spawned: number;
  hearts: number;
  score: number;
  correct: number;
  mistakes: number;
  perKey: Record<string, number>;
  simTime: number; // ms since start
  nextSpawnAt: number;
  lastFrame: number | null;
  endedAt: number | null;
  nextId: number;
}

interface View {
  phase: Sim["phase"];
  balloons: Balloon[];
  spawned: number;
  hearts: number;
  score: number;
  simTime: number;
}

function snapshot(s: Sim): View {
  return {
    phase: s.phase,
    balloons: [...s.balloons],
    spawned: s.spawned,
    hearts: s.hearts,
    score: s.score,
    simTime: s.simTime,
  };
}

function freshSim(): Sim {
  return {
    phase: "idle",
    balloons: [],
    spawned: 0,
    hearts: START_HEARTS,
    score: 0,
    correct: 0,
    mistakes: 0,
    perKey: {},
    simTime: 0,
    nextSpawnAt: 400,
    lastFrame: null,
    endedAt: null,
    nextId: 1,
  };
}

export function LetterRain({
  char,
  rivals,
  helpText,
  startText,
  scoreText,
  onKeySound,
  onErrSound,
  onStroke,
  onDone,
}: {
  char: string;
  rivals: string[];
  helpText: string;
  startText: string;
  scoreText: string;
  onKeySound: () => void;
  onErrSound: () => void;
  /** Feed the all-time stats layer (createStatsSession) per keystroke. */
  onStroke?: (char: string, correct: boolean) => void;
  onDone: (stats: RainStats) => void;
}) {
  const sim = useRef<Sim>(freshSim());
  // Render reads a per-frame snapshot, never the mutable sim ref.
  const [view, setView] = useState<View>(() => snapshot(freshSim()));
  const onDoneRef = useRef(onDone);
  const sfxRef = useRef({ onKeySound, onErrSound, onStroke });
  useEffect(() => {
    onDoneRef.current = onDone;
    sfxRef.current = { onKeySound, onErrSound, onStroke };
  });

  // Deterministic-enough letter picker: bias toward the letter + rivals.
  const pickChar = useMemo(() => {
    return () => {
      const roll = Math.random();
      if (roll < 0.45 || rivals.length === 0) return char;
      if (roll < 0.8) return rivals[Math.floor(Math.random() * rivals.length)];
      return ALPHABET[Math.floor(Math.random() * 26)];
    };
  }, [char, rivals]);

  // One rAF loop for the whole game; ends itself and reports stats.
  useEffect(() => {
    let raf = 0;
    const step = (now: number) => {
      const s = sim.current;
      if (s.phase === "play") {
        const dt = s.lastFrame === null ? 16 : Math.min(48, now - s.lastFrame);
        s.simTime += dt;

        // Spawn until the budget is used up, faster as the game goes on.
        if (s.spawned < TOTAL_SPAWNS && s.simTime >= s.nextSpawnAt) {
          const speed = Math.min(115, 42 + s.spawned * 2.4);
          s.balloons.push({
            id: s.nextId++,
            char: pickChar(),
            x: 70 + Math.random() * (W - 140),
            y: -R,
            speed,
            color: COLORS[s.nextId % COLORS.length],
            poppedAt: null,
          });
          s.spawned++;
          s.nextSpawnAt = s.simTime + Math.max(750, 1500 - s.spawned * 26);
        }

        // Fall + ground hits.
        for (const b of s.balloons) {
          if (b.poppedAt !== null) continue;
          b.y += (b.speed * dt) / 1000;
          if (b.y >= GROUND_Y - R) {
            b.poppedAt = s.simTime; // bursts on the ground
            s.hearts--;
            s.mistakes++;
            s.perKey[b.char] = (s.perKey[b.char] ?? 0) + 1;
            sfxRef.current.onStroke?.(b.char, false);
            sfxRef.current.onErrSound();
          }
        }

        // Drop finished burst animations.
        s.balloons = s.balloons.filter(
          (b) => b.poppedAt === null || s.simTime - b.poppedAt < 260,
        );

        const outOfHearts = s.hearts <= 0;
        const cleared = s.spawned >= TOTAL_SPAWNS && s.balloons.length === 0;
        if (outOfHearts || cleared) {
          s.phase = "over";
          s.endedAt = s.simTime;
          const stats: RainStats = {
            correct: s.correct,
            mistakes: s.mistakes,
            timeMs: s.simTime,
            perKeyMistakes: s.perKey,
          };
          setTimeout(() => onDoneRef.current(stats), 650);
        }
      }
      sim.current.lastFrame = now;
      // Only re-render while there's motion — the idle "press a key" screen is
      // static, so a 60fps setState there just burns CPU. `over` is bounded
      // (onDone unmounts after 650ms) so its burst animation still plays.
      if (s.phase !== "idle") setView(snapshot(sim.current));
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [pickChar]);

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
        return;
      }
      if (s.phase !== "play") return;

      const key = e.key.toLowerCase();
      // Pop the lowest live balloon carrying this letter.
      const target = s.balloons
        .filter((b) => b.poppedAt === null && b.char === key)
        .sort((a, b) => b.y - a.y)[0];
      if (target) {
        target.poppedAt = s.simTime;
        s.correct++;
        s.score += 10;
        sfxRef.current.onStroke?.(key, true);
        sfxRef.current.onKeySound();
      } else {
        s.mistakes++;
        // Blame the letter the player most likely aimed at: the lowest live one.
        const lowest = s.balloons
          .filter((b) => b.poppedAt === null)
          .sort((a, b) => b.y - a.y)[0];
        const blamed = lowest?.char ?? char;
        s.perKey[blamed] = (s.perKey[blamed] ?? 0) + 1;
        sfxRef.current.onStroke?.(blamed, false);
        sfxRef.current.onErrSound();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [char]);

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
          {s.spawned} / {TOTAL_SPAWNS}
        </span>
        <span className="font-mono text-sm font-bold text-neutral-900 dark:text-white">
          {scoreText}: {s.score}
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

          {s.balloons.map((b) => {
            if (b.poppedAt !== null) {
              // burst: expanding spokes fading out
              const t = Math.min(1, (s.simTime - b.poppedAt) / 260);
              return (
                <g key={b.id} opacity={1 - t}>
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
                    const rad = (a * Math.PI) / 180;
                    const r1 = R * (0.4 + t);
                    const r2 = R * (0.9 + t * 1.1);
                    return (
                      <line
                        key={a}
                        x1={b.x + Math.cos(rad) * r1}
                        y1={b.y + Math.sin(rad) * r1}
                        x2={b.x + Math.cos(rad) * r2}
                        y2={b.y + Math.sin(rad) * r2}
                        stroke={b.color}
                        strokeWidth={4}
                        strokeLinecap="round"
                      />
                    );
                  })}
                </g>
              );
            }
            return (
              <g key={b.id}>
                <path
                  d={`M ${b.x} ${b.y + R} q 6 14 -4 26`}
                  stroke="#a1a1aa"
                  strokeWidth={1.5}
                  fill="none"
                />
                <circle cx={b.x} cy={b.y} r={R} fill={b.color} opacity={0.18} />
                <circle
                  cx={b.x}
                  cy={b.y}
                  r={R}
                  fill="#ffffff"
                  stroke={b.color}
                  strokeWidth={3}
                />
                <polygon
                  points={`${b.x - 5},${b.y + R} ${b.x + 5},${b.y + R} ${b.x},${b.y + R + 7}`}
                  fill={b.color}
                />
                <text
                  x={b.x}
                  y={b.y + 9}
                  textAnchor="middle"
                  fontSize={26}
                  fontWeight={800}
                  fontFamily="monospace"
                  fill="#18181B"
                >
                  {b.char}
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
