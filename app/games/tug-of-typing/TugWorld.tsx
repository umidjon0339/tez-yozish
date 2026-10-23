/* eslint-disable react-hooks/exhaustive-deps */
"use client";

// =========================================================================
// 🪢 TUG OF TYPING — 2D canvas tug-of-war against a rival (no three.js, no
// image assets, no mp3s).
//
// YOU (blue, right) and a RIVAL (red, left) race on the SAME word. Every
// correct letter you type pulls the rope your way; every letter the rival
// "types" at its shown WPM pulls it back. Whoever finishes the word first
// lands a heave and a fresh word drops. Drag the marker past your line and
// you clear the level — the NEXT rival types faster, forever. Lose the rope
// once and the run is over.
//
// The rope is the integral of (your keys/sec − the rival's keys/sec), so the
// rival's WPM is a literal, honest speed target. That is the point of the
// game: not "beat an enemy" but "hold 34 WPM, then 38, then 42".
//
// Architecture (same contract as typing-ninja / rhino-dash / sky-hop):
//   • ALL simulation state lives in `stateRef.current` and is mutated inside
//     `step()` — never in React state.
//   • React state is only the ~20 Hz HUD snapshot + menu flags. The word and
//     its typed prefix are painted from the ref by the canvas, so a keystroke
//     costs zero re-renders.
//   • One rAF loop for the whole mount: it always draws, and only advances
//     the simulation while PLAYING (or MENU, which idles the attract scene).
// =========================================================================

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mascot } from "@/components/Mascot";
import { useLocale } from "@/lib/core/locale";
import { createStatsSession, recordAttempt, type StatsSession } from "@/lib/typing/stats";
import { sfx } from "./sound";
import { draw, layoutFor, botX, playerX, type Layout } from "./render";
import {
    BURST_TAU, DIFFICULTY_CONFIG, FORCE_TAU, HEAVE, KEY_PULL, LEVEL_WPM_STEP,
    MAX_FORCE, RAMP_AFTER, RAMP_MAX, RAMP_RATE, ROPE_EASE, ROPE_SPEED,
    TYPO_FORCE_CUT, TYPO_SLIP, WIN_AT, accuracy, addSkid, botKeysPerSecond,
    getInitialState, nextWord, playerWpm, resetRun, spawnDust, spawnSweat,
    startLevel, type Difficulty, type TugState, type Winner,
} from "./sim";

type GameState = "MENU" | "PLAYING" | "PAUSED" | "GAME_OVER";

const LEVEL_BANNER = 2.4; // seconds the level-result banner holds
const PARTICLE_GRAVITY: Record<string, number> = { dust: -20, chip: 620, sweat: 520 };

// ==========================================
// LOCALISED STRINGS (en/uz/ru) — short words: the audience is school students.
// ==========================================

const UI = {
    tagline: {
        en: "You and the rival race on the SAME word. Every letter you type pulls the rope your way. Win and the next rival types faster — how far can you go?",
        uz: "Siz va raqib BIR XIL so'zni yozasiz. Har bir harf arqonni o'zingizga tortadi. Yutsangiz, keyingi raqib tezroq yozadi — qayergacha chidaysiz?",
        ru: "Ты и соперник печатаете ОДНО И ТО ЖЕ слово. Каждая буква тянет канат к тебе. Победишь — следующий соперник печатает быстрее. Как далеко зайдёшь?",
    },
    rivalTypes: { en: "rival types", uz: "raqib tezligi", ru: "соперник печатает" },
    best: { en: "Best", uz: "Rekord", ru: "Рекорд" },
    newRecord: { en: "New record!", uz: "Yangi rekord!", ru: "Новый рекорд!" },
    easy: { en: "EASY", uz: "OSON", ru: "ЛЕГКО" },
    medium: { en: "MEDIUM", uz: "O'RTA", ru: "СРЕДНЕ" },
    hard: { en: "HARD", uz: "QIYIN", ru: "СЛОЖНО" },
    paused: { en: "Paused", uz: "To'xtatildi", ru: "Пауза" },
    continue: { en: "Continue", uz: "Davom etish", ru: "Продолжить" },
    restart: { en: "Restart", uz: "Boshidan", ru: "Заново" },
    menu: { en: "Menu", uz: "Menyu", ru: "Меню" },
    quit: { en: "Quit", uz: "Chiqish", ru: "Выйти" },
    score: { en: "Score", uz: "Ball", ru: "Счёт" },
    acc: { en: "Acc", uz: "Aniq", ru: "Точн" },
    time: { en: "Time", uz: "Vaqt", ru: "Время" },
    level: { en: "Level", uz: "Daraja", ru: "Уровень" },
    words: { en: "Words", uz: "So'zlar", ru: "Слова" },
    streak: { en: "Streak", uz: "Ketma-ket", ru: "Серия" },
    you: { en: "YOU", uz: "SIZ", ru: "ТЫ" },
    rival: { en: "RIVAL", uz: "RAQIB", ru: "СОПЕРНИК" },
    ready: { en: "Grab the rope!", uz: "Arqonni ushlang!", ru: "Хватай канат!" },
    go: { en: "PULL!", uz: "TORTING!", ru: "ТЯНИ!" },
    levelUp: { en: "Level cleared!", uz: "Daraja o'tildi!", ru: "Уровень пройден!" },
    nextRival: {
        en: (wpm: number) => `Next rival types ${wpm} WPM`,
        uz: (wpm: number) => `Keyingi raqib ${wpm} WPM yozadi`,
        ru: (wpm: number) => `Следующий соперник печатает ${wpm} WPM`,
    },
    gameOver: { en: "The rival won the rope", uz: "Arqonni raqib yutdi", ru: "Соперник перетянул канат" },
    gameOverNote: {
        en: (lvl: number, wpm: number) => `You cleared ${lvl} level${lvl === 1 ? "" : "s"} at ${wpm} WPM.`,
        uz: (lvl: number, wpm: number) => `${wpm} WPM bilan ${lvl} ta darajani o'tdingiz.`,
        ru: (lvl: number, wpm: number) => `Ты прошёл ${lvl} уровн${lvl === 1 ? "ь" : "я"} со скоростью ${wpm} WPM.`,
    },
    gameOverZero: {
        en: "The very first rival was too quick — try an easier one!",
        uz: "Birinchi raqib juda tez edi — osonrog'ini sinab ko'ring!",
        ru: "Первый соперник оказался слишком быстрым — попробуй полегче!",
    },
    playAgain: { en: "Play Again", uz: "Yana o'ynash", ru: "Ещё раз" },
    unmute: { en: "Unmute", uz: "Ovozni yoqish", ru: "Включить звук" },
    mute: { en: "Mute", uz: "Ovozni o'chirish", ru: "Выключить звук" },
    pause: { en: "Pause", uz: "To'xtatish", ru: "Пауза" },
};

// ==========================================
// SIMULATION STEP — the only writer of state
// ==========================================

interface StepApi {
    onLevelEnd: (winner: Winner) => void;
    onLevelDone: () => void;
}

function step(s: TugState, dtRaw: number, L: Layout, api: StepApi) {
    const dt = Math.min(dtRaw, 0.1); // never let a tab-switch teleport the sim

    s.t += dt;
    s.heaveT = Math.max(0, s.heaveT - dt * 3.4);
    s.botHeaveT = Math.max(0, s.botHeaveT - dt * 3.4);
    s.errFlash = Math.max(0, s.errFlash - dt * 3.6);
    s.trauma = Math.max(0, s.trauma - dt * 2.4);
    s.burst = Math.max(0, s.burst - (s.burst * dt) / BURST_TAU);

    if (s.phase === "countdown") {
        const before = Math.ceil(s.countdown);
        s.countdown -= dt;
        const after = Math.ceil(s.countdown);
        if (after !== before) {
            if (after <= 0) sfx.playWhistle();
            else sfx.playCountBeep();
        }
        if (s.countdown <= 0) s.phase = "pull";
        s.tension = 0.45;
    }

    if (s.phase === "pull") {
        s.pullTimeMs += dt * 1000;
        s.levelT += dt;

        // the rival digs in the longer a level runs, so no level can stall
        s.botRamp = Math.min(RAMP_MAX, 1 + Math.max(0, s.levelT - RAMP_AFTER) * RAMP_RATE);

        // --- the rival types the same word at its shown WPM ---
        if (s.botRegrip > 0) {
            s.botRegrip = Math.max(0, s.botRegrip - dt);
        } else {
            const before = Math.floor(s.botTyped);
            s.botTyped += botKeysPerSecond(s) * dt;
            const gained = Math.floor(s.botTyped) - before;
            for (let i = 0; i < gained; i++) {
                s.botForce = Math.min(MAX_FORCE, s.botForce + KEY_PULL * s.botRamp);
            }
            if (s.botTyped >= s.word.length) {
                // the rival beat you to this word
                s.wordsLost++;
                s.rope -= HEAVE;
                s.botHeaveT = 1;
                s.combo = 0;
                spawnDust(s, botX(s, L) + 20 * L.scale, L.fieldY + 22 * L.scale, -1, 5);
                sfx.playHeave(false);
                nextWord(s, true);
            }
        }

        // --- forces decay toward zero, so holding ground needs a steady rate ---
        const decay = Math.exp(-dt / FORCE_TAU);
        s.playerForce *= decay;
        s.botForce *= decay;

        // --- the rope integrates the force gap ---
        const targetVel = (s.playerForce - s.botForce) * ROPE_SPEED;
        s.ropeVel += (targetVel - s.ropeVel) * Math.min(1, dt * ROPE_EASE);
        const prev = s.rope;
        s.rope = Math.max(-1.05, Math.min(1.05, s.rope + s.ropeVel * dt));
        s.tension = Math.min(1, (Math.abs(s.playerForce) + Math.abs(s.botForce)) / 2.6);

        // ground being lost leaves skid marks and kicks up turf
        const moved = s.rope - prev;
        if (Math.abs(moved) > 0.0016) {
            const losing: Winner = moved > 0 ? "bot" : "player";
            if (Math.random() < 0.25) {
                addSkid(s, losing === "player" ? playerX(s, L) : botX(s, L), L.fieldY + 26 * L.scale, losing);
            }
            if (Math.random() < 0.2) {
                spawnDust(
                    s,
                    losing === "player" ? playerX(s, L) + 24 * L.scale : botX(s, L) - 24 * L.scale,
                    L.fieldY + 20 * L.scale,
                    losing === "player" ? 1 : -1,
                    2,
                );
            }
        }
        // the rival kicks up dust continuously once it starts digging in
        if (s.botRamp > 1.05 && Math.random() < 0.25) {
            spawnDust(s, botX(s, L) - 20 * L.scale, L.fieldY + 20 * L.scale, -1, 1);
        }
        if (s.tension > 0.75 && Math.random() < 0.08) {
            spawnSweat(s, playerX(s, L) - 10 * L.scale, L.fieldY, 1);
        }

        if (s.rope >= WIN_AT) api.onLevelEnd("player");
        else if (s.rope <= -WIN_AT) api.onLevelEnd("bot");
    }

    if (s.phase === "levelover") {
        s.levelOverT += dt;
        // the winner keeps hauling the loser over the line
        s.rope += (s.levelWinner === "player" ? 0.22 : -0.22) * dt;
        s.rope = Math.max(-1.3, Math.min(1.3, s.rope));
        s.tension = Math.max(0, s.tension - dt * 0.5);
        if (s.levelOverT >= LEVEL_BANNER) api.onLevelDone();
    }

    // attract mode: the pullers idle and the rope sways
    if (s.phase === "idle") {
        s.rope = Math.sin(s.t * 0.45) * 0.32;
        s.tension = 0.45 + Math.sin(s.t * 1.6) * 0.12;
    }

    // particles
    for (const p of s.particles) {
        p.life += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += (PARTICLE_GRAVITY[p.kind] ?? 300) * dt;
        p.rot += p.vrot * dt;
        if (p.kind === "dust") {
            const drag = 1 - Math.min(0.9, 2.4 * dt);
            p.vx *= drag;
            p.vy *= drag;
        }
    }
    s.particles = s.particles.filter((p) => p.life < p.ttl);

    for (const sk of s.skids) sk.life += dt;
    s.skids = s.skids.filter((sk) => sk.life < sk.ttl);
}

// ==========================================
// COMPONENT
// ==========================================

export default function TugWorld() {
    const { locale } = useLocale();
    const [gameState, setGameState] = useState<GameState>("MENU");
    const [isMuted, setIsMuted] = useState(sfx.muted);
    const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
    const [hud, setHud] = useState({
        score: 0, wpm: 0, accuracy: 100, combo: 0, bestCombo: 0,
        level: 1, botWpm: 30, phase: "idle" as TugState["phase"], countdown: 0,
        levelWinner: null as Winner | null, wordsWon: 0, wordsLost: 0,
        timeMs: 0, burstWpm: 0,
    });
    const [highScore, setHighScore] = useState(() => {
        try {
            return typeof window === "undefined" ? 0 : Number(localStorage.getItem("tz-tug-highscore") || 0);
        } catch {
            return 0;
        }
    });
    const [isNewRecord, setIsNewRecord] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [initState] = useState(getInitialState);
    const stateRef = useRef(initState);
    const gameStateRef = useRef<GameState>("MENU");
    const statsSession = useRef<StatsSession | null>(null);
    const sizeRef = useRef({ w: 1280, h: 720 });

    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    // ---------- canvas sizing (DPR-aware) ----------
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const resize = () => {
            const dpr = Math.min(2, window.devicePixelRatio || 1);
            const w = window.innerWidth;
            const h = window.innerHeight;
            sizeRef.current = { w, h };
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            canvas.style.width = `${w}px`;
            canvas.style.height = `${h}px`;
            const ctx = canvas.getContext("2d");
            if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resize();
        window.addEventListener("resize", resize);
        return () => window.removeEventListener("resize", resize);
    }, []);

    const endRun = useCallback(() => {
        setGameState("GAME_OVER");
    }, []);

    // ---------- the one rAF loop ----------
    useEffect(() => {
        let raf = 0;
        let last = performance.now();
        let hudAcc = 0;

        const frame = (now: number) => {
            raf = requestAnimationFrame(frame);
            const dt = Math.min(0.1, (now - last) / 1000);
            last = now;

            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const { w, h } = sizeRef.current;
            const L = layoutFor(w, h);
            const s = stateRef.current;
            const gs = gameStateRef.current;

            if (gs === "PLAYING" || gs === "MENU") {
                step(s, dt, L, {
                    onLevelEnd: (winner) => {
                        s.phase = "levelover";
                        s.levelWinner = winner;
                        s.levelOverT = 0;
                        s.trauma = Math.max(s.trauma, 0.6);
                        if (winner === "player") {
                            s.score += 150;
                            sfx.playLevelUp();
                        } else {
                            sfx.playDefeat();
                        }
                    },
                    onLevelDone: () => {
                        if (s.levelWinner === "player") {
                            startLevel(s, s.level + 1); // endless: a faster rival
                        } else {
                            s.phase = "over";
                            endRun();
                        }
                    },
                });
            }

            draw(ctx, s, w, h);

            // HUD snapshot at ~20 Hz (never per frame)
            hudAcc += dt;
            if (hudAcc >= 0.05) {
                hudAcc = 0;
                setHud({
                    score: s.score,
                    wpm: playerWpm(s),
                    accuracy: accuracy(s),
                    combo: s.combo,
                    bestCombo: s.bestCombo,
                    level: s.level,
                    botWpm: s.botWpm,
                    phase: s.phase,
                    countdown: s.countdown,
                    levelWinner: s.levelWinner,
                    wordsWon: s.wordsWon,
                    wordsLost: s.wordsLost,
                    timeMs: s.pullTimeMs,
                    burstWpm: Math.round((s.burst * 60) / 5),
                });
            }
        };

        raf = requestAnimationFrame(frame);
        return () => cancelAnimationFrame(raf);
    }, [endRun]);

    // ---------- start / restart ----------
    const startGame = useCallback((diff: Difficulty) => {
        sfx.init();
        sfx.resume();
        statsSession.current?.end();
        statsSession.current = createStatsSession();
        setDifficulty(diff);
        setIsNewRecord(false);
        resetRun(stateRef.current, diff);
        setGameState("PLAYING");
    }, []);

    const backToMenu = useCallback(() => {
        const s = stateRef.current;
        s.phase = "idle";
        s.rope = 0;
        s.particles = [];
        s.skids = [];
        s.levelWinner = null;
        setGameState("MENU");
    }, []);

    // ---------- run ended: flush stats, log the attempt, update the record ----------
    useEffect(() => {
        if (gameState !== "GAME_OVER") return;
        statsSession.current?.end();
        statsSession.current = null;
        const s = stateRef.current;
        recordAttempt({
            lessonId: "tug-of-typing",
            type: "game",
            wpm: playerWpm(s),
            accuracy: accuracy(s),
            stars: 0,
            timeMs: Math.round(s.pullTimeMs),
            errors: s.totalKeystrokes - s.correctKeystrokes,
            problemKeys: {},
        });
        setIsNewRecord(s.score > 0 && s.score > highScore);
        if (s.score > highScore) {
            setHighScore(s.score);
            try {
                localStorage.setItem("tz-tug-highscore", String(s.score));
            } catch {}
        }
    }, [gameState]);

    // ---------- typing input ----------
    useEffect(() => {
        if (gameState !== "PLAYING") return;
        const onKey = (e: KeyboardEvent) => {
            const s = stateRef.current;
            if (s.phase !== "pull") return;
            if (e.ctrlKey || e.altKey || e.metaKey || e.key.length > 1) return;
            if (e.code === "Space") e.preventDefault();

            const L = layoutFor(sizeRef.current.w, sizeRef.current.h);
            const char = e.key.toLowerCase();
            const expected = s.word[s.typed]?.toLowerCase();
            s.totalKeystrokes++;

            if (char === expected) {
                s.typed++;
                s.correctKeystrokes++;
                s.combo++;
                s.bestCombo = Math.max(s.bestCombo, s.combo);
                s.burst += 1 / BURST_TAU;
                statsSession.current?.stroke(char, true);

                s.playerForce = Math.min(MAX_FORCE, s.playerForce + KEY_PULL);
                s.score += 2 + Math.min(6, Math.floor(s.combo / 6));
                sfx.playKey(s.typed / Math.max(1, s.word.length));

                if (s.typed >= s.word.length) {
                    // won the race for this word
                    s.wordsWon++;
                    s.rope += HEAVE;
                    s.heaveT = 1;
                    s.score += 10;
                    spawnDust(s, playerX(s, L) - 20 * L.scale, L.fieldY + 22 * L.scale, 1, 5);
                    sfx.playHeave(true);
                    nextWord(s);
                }
            } else {
                statsSession.current?.stroke(expected ?? char, false);
                s.combo = 0;
                s.rope -= TYPO_SLIP;
                s.playerForce *= TYPO_FORCE_CUT;
                s.errFlash = 1;
                s.trauma = Math.max(s.trauma, 0.3);
                sfx.playTypo();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [gameState]);

    // ---------- control keys ----------
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (gameState === "PLAYING") {
                    sfx.audioCtx?.suspend();
                    setGameState("PAUSED");
                } else if (gameState === "PAUSED") {
                    sfx.resume();
                    setGameState("PLAYING");
                }
            } else if (e.key === "Enter" && (gameState === "GAME_OVER" || gameState === "MENU")) {
                startGame(difficulty);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [gameState, difficulty, startGame]);

    // Dev-only inspection hook: the game draws to a canvas, so the headless
    // driver in `.claude/skills/verify` has no DOM to read the live word from.
    useEffect(() => {
        if (process.env.NODE_ENV === "production") return;
        (window as unknown as { __tug?: TugState }).__tug = stateRef.current;
        return () => {
            delete (window as unknown as { __tug?: TugState }).__tug;
        };
    }, []);

    // ---------- cleanup ----------
    useEffect(() => {
        return () => {
            sfx.audioCtx?.suspend();
            statsSession.current?.end();
        };
    }, []);

    const fmtTime = (ms: number) => {
        const secs = Math.round(ms / 1000);
        return secs >= 60 ? `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}` : `${secs}s`;
    };
    const countdownNum = Math.ceil(hud.countdown);
    const clearedLevels = Math.max(0, hud.level - 1);

    return (
        <div className="w-full h-full relative overflow-hidden">
            <style>{`
                @keyframes tug-pop { 0% { transform: scale(1.3); } 100% { transform: scale(1); } }
                .tug-pop { animation: tug-pop .18s ease-out; }
                @keyframes tug-rise { 0% { transform: translateY(14px); opacity: 0 } 100% { transform: translateY(0); opacity: 1 } }
                .tug-rise { animation: tug-rise .3s ease-out; }
                @keyframes tug-sway { 0%,100% { transform: rotate(-2deg) } 50% { transform: rotate(2deg) } }
                .tug-sway { animation: tug-sway 2.8s ease-in-out infinite; }
            `}</style>

            <canvas ref={canvasRef} className="absolute inset-0 block" />

            {/* ---------------- HUD ---------------- */}
            {(gameState === "PLAYING" || gameState === "PAUSED") && (
                <>
                    {/* score / wpm / accuracy */}
                    <div className="absolute top-4 left-4 z-40 pointer-events-none flex flex-wrap gap-2 font-sans">
                        {[
                            [UI.score[locale], String(hud.score)],
                            ["WPM", String(hud.wpm)],
                            [UI.acc[locale], `${hud.accuracy}%`],
                        ].map(([label, value]) => (
                            <div key={label} className="bg-white/92 backdrop-blur border-2 border-[#14344f] rounded-full px-4 py-1.5 flex items-center gap-2 shadow-[0_3px_0_rgba(20,52,79,0.9)]">
                                <span className="text-[10px] font-black text-[#5d87a5] uppercase tracking-widest">{label}</span>
                                <span className="font-mono font-black text-[#14344f]">{value}</span>
                            </div>
                        ))}
                        {hud.combo >= 5 && (
                            <div className="bg-amber-400/95 backdrop-blur border-2 border-[#14344f] rounded-full px-4 py-1.5 flex items-center gap-2 shadow-[0_3px_0_rgba(20,52,79,0.9)] -rotate-2 tug-pop">
                                <span className="text-sm">🔥</span>
                                <span className="font-mono font-black text-[#14344f]">×{hud.combo}</span>
                            </div>
                        )}
                    </div>

                    {/* level + pause / quit */}
                    <div className="absolute top-4 right-4 z-40 flex items-center gap-2 font-sans">
                        <div className="bg-white/92 border-2 border-[#14344f] rounded-full px-4 py-1.5 shadow-[0_3px_0_rgba(20,52,79,0.9)] flex items-center gap-2">
                            <span className="text-[10px] font-black text-[#5d87a5] uppercase tracking-widest">
                                {UI.level[locale]}
                            </span>
                            <span className="font-mono font-black text-[#14344f]">{hud.level}</span>
                        </div>
                        <button
                            title={`${UI.pause[locale]} (Esc)`}
                            onClick={() => { if (gameState === "PLAYING") { sfx.audioCtx?.suspend(); setGameState("PAUSED"); } }}
                            className="bg-white/92 backdrop-blur border-2 border-[#14344f] text-[#14344f] px-3.5 py-2 rounded-xl font-black text-sm shadow-[0_3px_0_rgba(20,52,79,0.9)] hover:-translate-y-0.5 active:translate-y-[3px] active:shadow-none transition-all flex items-center gap-2"
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                            Esc
                        </button>
                        <a
                            title={UI.quit[locale]}
                            href="/games"
                            className="bg-white/92 backdrop-blur border-2 border-[#14344f] text-red-500 px-3.5 py-2 rounded-xl font-black text-sm shadow-[0_3px_0_rgba(20,52,79,0.9)] hover:-translate-y-0.5 hover:bg-red-50 active:translate-y-[3px] active:shadow-none transition-all flex items-center gap-2"
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            {UI.quit[locale]}
                        </a>
                    </div>

                    {/* the speed race, in one line: your live WPM against the rival's */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none font-sans">
                        <div className="bg-white/92 border-2 border-[#14344f] rounded-full px-5 py-2 shadow-[0_3px_0_rgba(20,52,79,0.9)] flex items-center gap-3">
                            <span className="w-3 h-3 rounded-full bg-[#e03b3b] border-2 border-[#14344f]" />
                            <span className="text-[10px] font-black text-[#5d87a5] uppercase tracking-widest">{UI.rival[locale]}</span>
                            <span className="font-mono font-black text-[#14344f]">{hud.botWpm}</span>
                            <span className="text-[#14344f]/30 font-black">·</span>
                            <span className="w-3 h-3 rounded-full bg-[#2f7fd6] border-2 border-[#14344f]" />
                            <span className="text-[10px] font-black text-[#5d87a5] uppercase tracking-widest">{UI.you[locale]}</span>
                            {/* green while you are out-typing the rival, red while you are not */}
                            <span className={`font-mono font-black ${hud.burstWpm >= hud.botWpm ? "text-emerald-600" : "text-red-500"}`}>
                                {hud.burstWpm}
                            </span>
                            <span className="text-[10px] font-black text-[#5d87a5]">WPM</span>
                        </div>
                    </div>

                    {/* countdown */}
                    {gameState === "PLAYING" && hud.phase === "countdown" && (
                        <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center font-sans">
                            <div className="flex flex-col items-center mt-24">
                                <div className="px-6 py-2 bg-white/92 border-2 border-[#14344f] rounded-full font-black text-lg text-[#14344f] shadow-[0_3px_0_rgba(20,52,79,0.9)] mb-3 -rotate-1">
                                    {UI.level[locale]} {hud.level} — {UI.ready[locale]}
                                </div>
                                <div key={countdownNum} className="text-8xl font-black text-white [text-shadow:0_5px_0_#14344f] tug-pop">
                                    {countdownNum > 0 ? countdownNum : UI.go[locale]}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* level cleared banner */}
                    {hud.phase === "levelover" && hud.levelWinner === "player" && (
                        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-40 pointer-events-none tug-rise">
                            <div className="px-8 py-4 rounded-3xl bg-emerald-400 border-4 border-[#14344f] shadow-[0_6px_0_#14344f] flex flex-col items-center -rotate-1">
                                <span className="text-3xl font-black text-white">🎉 {UI.levelUp[locale]}</span>
                                <span className="text-sm font-black text-white/90 tracking-wide mt-0.5">
                                    {UI.nextRival[locale](hud.botWpm + LEVEL_WPM_STEP)}
                                </span>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ---------------- GAME OVER ---------------- */}
            {gameState === "GAME_OVER" && (
                <div className="absolute inset-0 z-50 bg-[#0c2438]/70 backdrop-blur-sm flex items-center justify-center font-sans">
                    <div className="w-[420px] max-w-[92%] bg-[#f2fbff] rounded-[28px] border-4 border-[#14344f] shadow-[0_10px_0_#14344f,0_28px_60px_rgba(0,0,0,0.35)] p-8 flex flex-col items-center tug-rise">
                        <h1 className="text-3xl font-black tracking-tight text-[#14344f] mb-1 text-center">
                            {UI.gameOver[locale]}
                        </h1>
                        <p className="text-sm font-bold text-[#5d87a5] mb-4 text-center">
                            {clearedLevels > 0
                                ? UI.gameOverNote[locale](clearedLevels, hud.wpm)
                                : UI.gameOverZero[locale]}
                        </p>
                        {isNewRecord && (
                            <p className="-mt-2 mb-4 px-3 py-1 bg-amber-300 border-2 border-[#14344f] rounded-full text-xs font-black text-[#14344f] -rotate-2 shadow-[0_2px_0_#14344f]">★ {UI.newRecord[locale]}</p>
                        )}

                        <div className="grid grid-cols-3 gap-2 w-full mb-6">
                            {[
                                { label: "WPM", value: String(hud.wpm), tint: "bg-sky-200" },
                                { label: UI.acc[locale], value: `${hud.accuracy}%`, tint: "bg-emerald-200" },
                                { label: UI.time[locale], value: fmtTime(hud.timeMs), tint: "bg-rose-200" },
                                { label: UI.score[locale], value: String(hud.score), tint: "bg-amber-200" },
                                { label: UI.best[locale], value: String(highScore), tint: "bg-violet-200" },
                                { label: UI.level[locale], value: String(clearedLevels), tint: "bg-lime-200" },
                                { label: UI.words[locale], value: `${hud.wordsWon}–${hud.wordsLost}`, tint: "bg-orange-200" },
                                { label: UI.streak[locale], value: `×${hud.bestCombo}`, tint: "bg-yellow-200" },
                                { label: UI.rival[locale], value: `${hud.botWpm}`, tint: "bg-teal-200" },
                            ].map((st) => (
                                <div key={st.label} className={`flex flex-col items-center ${st.tint} border-2 border-[#14344f] rounded-2xl px-2 py-3 shadow-[0_3px_0_#14344f]`}>
                                    <span className="font-mono text-lg font-black text-[#14344f]">{st.value}</span>
                                    <span className="text-[9px] uppercase tracking-widest text-[#14344f]/60 font-black mt-0.5">{st.label}</span>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => startGame(difficulty)}
                            className="w-full py-3.5 bg-emerald-500 text-white font-black text-sm tracking-wide rounded-2xl border-2 border-b-[6px] border-[#14344f] [text-shadow:0_1px_0_rgba(20,52,79,0.4)] hover:-translate-y-0.5 hover:brightness-110 active:translate-y-1 active:border-b-2 transition-all"
                        >
                            {UI.playAgain[locale]} <span className="text-white/80 font-mono text-xs ml-1">Enter ↵</span>
                        </button>

                        <div className="flex items-center gap-5 mt-4 text-sm">
                            <button onClick={backToMenu} className="font-bold text-[#5d87a5] hover:text-[#14344f] underline decoration-2 decoration-[#bfe0f2] underline-offset-4 hover:decoration-amber-400 transition-colors">
                                {UI.menu[locale]}
                            </button>
                            <a href="/games" className="font-bold text-red-500 hover:text-red-600 underline decoration-2 decoration-[#bfe0f2] underline-offset-4 hover:decoration-red-300 transition-colors">
                                {UI.quit[locale]}
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* ---------------- MENU / PAUSED ---------------- */}
            {(gameState === "MENU" || gameState === "PAUSED") && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0a2410]/55 backdrop-blur-[2px] font-sans">
                    <div className="w-[420px] max-w-[92%] bg-[#f2fbff] rounded-[28px] border-4 border-[#14344f] shadow-[0_10px_0_#14344f,0_28px_60px_rgba(0,0,0,0.35)] p-7 relative flex flex-col items-center tug-rise">
                        <button
                            onClick={() => setIsMuted(sfx.toggleMute())}
                            title={isMuted ? UI.unmute[locale] : UI.mute[locale]}
                            className="absolute -top-3 -right-3 bg-[#f2fbff] text-[#14344f] border-2 border-[#14344f] w-11 h-11 rounded-full shadow-[0_3px_0_#14344f] hover:brightness-105 active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center z-10"
                        >
                            {isMuted ? (
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="22" y1="9" x2="16" y2="15" /><line x1="16" y1="9" x2="22" y2="15" /></svg>
                            ) : (
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
                            )}
                        </button>

                        <div className="tug-sway">
                            <Mascot mood={gameState === "MENU" ? "focused" : "happy"} className="w-20 h-20 -mt-2 mb-1" />
                        </div>
                        <h2 className="text-3xl font-black tracking-tight text-[#14344f] text-center">
                            {gameState === "MENU" ? <>Tug of <span className="text-amber-500">Typing</span></> : UI.paused[locale]}
                        </h2>

                        {gameState === "MENU" && (
                            <>
                                <p className="text-sm font-medium text-[#5d87a5] text-center leading-snug mt-2">
                                    {UI.tagline[locale]}
                                </p>
                                {highScore > 0 && (
                                    <p className="mt-2 px-3 py-1 bg-amber-300 border-2 border-[#14344f] rounded-full text-xs font-black text-[#14344f] -rotate-1 shadow-[0_2px_0_#14344f]">
                                        ★ {UI.best[locale]}: {highScore}
                                    </p>
                                )}
                            </>
                        )}

                        <div className="flex flex-col gap-3 mt-4 w-full">
                            {gameState === "MENU" && (
                                <>
                                    {([
                                        ["EASY", "🌱", "bg-emerald-500", UI.easy[locale]],
                                        ["MEDIUM", "⚡", "bg-amber-500", UI.medium[locale]],
                                        ["HARD", "🔥", "bg-red-500", UI.hard[locale]],
                                    ] as const).map(([diff, emoji, tint, label]) => (
                                        <button
                                            key={diff}
                                            onClick={() => startGame(diff as Difficulty)}
                                            className={`w-full py-3 rounded-2xl border-2 border-b-[6px] border-[#14344f] ${tint} font-black text-sm tracking-widest text-white [text-shadow:0_1px_0_rgba(20,52,79,0.4)] hover:-translate-y-0.5 hover:brightness-110 active:translate-y-1 active:border-b-2 transition-all flex items-center justify-center gap-2.5`}
                                        >
                                            <span className="text-base [text-shadow:none]">{emoji}</span>
                                            {label}
                                            <span className="text-[10px] font-bold tracking-normal text-white/85 normal-case">
                                                {UI.rivalTypes[locale]} {DIFFICULTY_CONFIG[diff].botWpm} WPM
                                            </span>
                                        </button>
                                    ))}
                                    <a
                                        href="/games"
                                        className="w-full py-3 rounded-2xl border-2 border-b-[6px] border-[#14344f] bg-[#f2fbff] text-red-500 font-black text-sm tracking-wide text-center hover:-translate-y-0.5 hover:bg-red-50 active:translate-y-1 active:border-b-2 transition-all"
                                    >
                                        {UI.quit[locale]}
                                    </a>
                                </>
                            )}

                            {gameState === "PAUSED" && (
                                <>
                                    <button
                                        onClick={() => { sfx.resume(); setGameState("PLAYING"); }}
                                        className="w-full py-3 rounded-2xl border-2 border-b-[6px] border-[#14344f] bg-emerald-500 text-white font-black text-sm tracking-wide [text-shadow:0_1px_0_rgba(20,52,79,0.4)] hover:-translate-y-0.5 hover:brightness-110 active:translate-y-1 active:border-b-2 transition-all"
                                    >
                                        {UI.continue[locale]} <span className="text-white/80 font-mono text-xs ml-1">Esc</span>
                                    </button>
                                    <button
                                        onClick={() => startGame(difficulty)}
                                        className="w-full py-3 rounded-2xl border-2 border-b-[6px] border-[#14344f] bg-[#dbeffc] text-[#14344f] font-black text-sm tracking-wide hover:-translate-y-0.5 hover:brightness-105 active:translate-y-1 active:border-b-2 transition-all"
                                    >
                                        {UI.restart[locale]}
                                    </button>
                                    <button
                                        onClick={backToMenu}
                                        className="w-full py-3 rounded-2xl border-2 border-b-[6px] border-[#14344f] bg-[#f2fbff] text-[#14344f] font-black text-sm tracking-wide hover:-translate-y-0.5 hover:brightness-105 active:translate-y-1 active:border-b-2 transition-all"
                                    >
                                        {UI.menu[locale]}
                                    </button>
                                    <a
                                        href="/games"
                                        className="w-full py-3 rounded-2xl border-2 border-b-[6px] border-[#14344f] bg-[#f2fbff] text-red-500 font-black text-sm tracking-wide text-center hover:-translate-y-0.5 hover:bg-red-50 active:translate-y-1 active:border-b-2 transition-all"
                                    >
                                        {UI.quit[locale]}
                                    </a>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
