/* eslint-disable react-hooks/exhaustive-deps */
"use client";

// =========================================================================
// 🛰️ STAR TYPE — 2D canvas typing game (no three.js, no image assets).
//
// A faithful re-build of the ZType arcade loop: enemy drones fall toward your
// ship carrying words, you type a word's first letter to LOCK ON, then type it
// out to destroy the drone. One drone reaching the ship ends the run.
//
// The brief was to copy the reference, not to extend it, so there is no
// difficulty picker, no lives, no power-ups, no combo multiplier and no in-run
// score read-out — the reference has none of those, and the wave ramp is the
// whole difficulty model. The one thing that IS changed is the layout: the
// reference is a portrait phone game, this fills a landscape window, so drones
// spawn across the full width and converge on the ship.
//
// Architecture (same contract as the other games):
//   • ALL simulation state lives in `stateRef.current` (one mutable object)
//     and is mutated inside `step()` — never in React state.
//   • React state is only the ~20 Hz HUD snapshot + menu flags. Words and their
//     typed prefixes are painted on the canvas straight from `stateRef`, so a
//     keystroke costs zero re-renders.
//   • One rAF loop runs the whole time the component is mounted.
// =========================================================================

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocale, type Locale } from "@/lib/locale";
import { createStatsSession, recordAttempt, type StatsSession } from "@/lib/stats";
import { sfx } from "./sound";
import { draw, drawShip, layoutFor, muzzleOf, type Layout } from "./render";
import {
    BOLT_LIFE, BOLT_SPEED, DRONE_SWAY, SHIP_DEATH_TIME, WAVE_BREAK,
    getInitialState, resetRun, spawnDrone, spawnExplosion, spawnHit,
    spawnShipDeath, waveCount, waveGap,
    type Drone, type StarTypeState,
} from "./sim";

type GameState = "MENU" | "PLAYING" | "PAUSED" | "GAME_OVER";

const PARTICLE_DRAG = 1.6;

// ==========================================
// LOCALISED STRINGS (en/uz/ru). The game's NAME stays English in every locale,
// like Beam Break / Sky Hop / Alien Drop — it is a brand.
// Keep the words short: the audience is school students.
// ==========================================

const UI = {
    tagline: {
        en: "Enemy drones are diving at your ship. Type the first letter of a word to lock on, then type the rest to shoot it down.",
        uz: "Dushman dronlari kemangga tushmoqda. Nishonga olish uchun so'zning birinchi harfini yoz, keyin qolganini yozib uni otib tushir.",
        ru: "Вражеские дроны летят на твой корабль. Напечатай первую букву слова, чтобы взять цель, потом набери слово целиком.",
    },
    howTo: {
        en: "One drone reaches you and the run is over. There is only one ship.",
        uz: "Bitta dron yetib kelsa, o'yin tugaydi. Kema bitta.",
        ru: "Один дрон долетит — и всё. Корабль только один.",
    },
    play: { en: "PLAY", uz: "BOSHLASH", ru: "ИГРАТЬ" },
    best: { en: "BEST", uz: "REKORD", ru: "РЕКОРД" },
    finalScore: { en: "FINAL SCORE", uz: "YAKUNIY BALL", ru: "ИТОГОВЫЙ СЧЁТ" },
    youReached: { en: "YOU REACHED", uz: "SEN YETDING", ru: "ТЫ ДОШЁЛ ДО" },
    wave: { en: "WAVE", uz: "TO'LQIN", ru: "ВОЛНА" },
    accuracy: { en: "ACCURACY", uz: "ANIQLIK", ru: "ТОЧНОСТЬ" },
    longestStreak: { en: "LONGEST STREAK", uz: "ENG UZUN SERIYA", ru: "ЛУЧШАЯ СЕРИЯ" },
    newRecord: { en: "NEW RECORD", uz: "YANGI REKORD", ru: "НОВЫЙ РЕКОРД" },
    backToTitle: { en: "back to title", uz: "boshiga qaytish", ru: "в начало" },
    playAgain: { en: "play again", uz: "yana o'ynash", ru: "играть снова" },
    moreGames: { en: "more games", uz: "boshqa o'yinlar", ru: "другие игры" },
    paused: { en: "PAUSED", uz: "TO'XTATILDI", ru: "ПАУЗА" },
    resume: { en: "resume", uz: "davom etish", ru: "продолжить" },
    quit: { en: "quit", uz: "chiqish", ru: "выйти" },
    unmute: { en: "Unmute", uz: "Ovozni yoqish", ru: "Включить звук" },
    mute: { en: "Mute", uz: "Ovozni o'chirish", ru: "Выключить звук" },
    pause: { en: "Pause", uz: "To'xtatish", ru: "Пауза" },
};

// ==========================================
// SIMULATION STEP — the only writer of state
// ==========================================

interface StepApi {
    onShipDead: () => void;
    /** true while the player is actually playing (false in menu attract mode). */
    scoring: boolean;
}

/** The drone closest to the ship whose word starts with `ch`. */
function findTarget(s: StarTypeState, ch: string, L: Layout): Drone | null {
    let best: Drone | null = null;
    let bestD = Infinity;
    for (const d of s.drones) {
        if (d.doomed || d.word[0] !== ch) continue;
        const dist = Math.hypot(d.x - L.shipX, d.y - L.shipY);
        if (dist < bestD) {
            bestD = dist;
            best = d;
        }
    }
    return best;
}

/** Fire one bolt from the ship at `drone`. */
function fireAt(s: StarTypeState, drone: Drone, L: Layout, killing: boolean, scoring: boolean) {
    const m = muzzleOf(L);
    const dx = drone.x - m.x;
    const dy = drone.y - m.y;
    const dist = Math.max(1, Math.hypot(dx, dy));
    const speed = BOLT_SPEED * L.scale;
    s.bolts.push({
        x: m.x, y: m.y,
        vx: (dx / dist) * speed, vy: (dy / dist) * speed,
        target: drone.id, remain: dist, life: 0, killing,
    });
    drone.incoming++;
    s.shipRecoil = 1;
    if (scoring) {
        sfx.playShot(drone.typed / Math.max(1, drone.word.length), (drone.x / L.W) * 2 - 1);
    }
}

function step(s: StarTypeState, dtRaw: number, L: Layout, api: StepApi) {
    const dt = Math.min(dtRaw, 0.1); // never let a tab-switch teleport the sim

    s.t += dt;
    s.shipRecoil = Math.max(0, s.shipRecoil - dt * 6);
    s.flash = Math.max(0, s.flash - dt * 2.4);
    s.glitch = Math.max(0, s.glitch - dt * 1.1);

    // ---- the wave pump ----
    if (s.phase === "wave-intro") {
        s.introT -= dt;
        if (s.introT <= 0) {
            s.phase = "fighting";
            s.spawnTimer = 0;
        }
    } else if (s.phase === "fighting") {
        if (api.scoring) s.runTimeMs += dt * 1000;
        if (s.queue > 0) {
            s.spawnTimer -= dt;
            if (s.spawnTimer <= 0) {
                spawnDrone(s, L.W, L.H, L.scale);
                s.queue--;
                s.spawnTimer = waveGap(s.wave);
            }
        } else if (s.drones.length === 0) {
            // wave cleared
            s.wave++;
            s.queue = waveCount(s.wave);
            s.phase = "wave-intro";
            s.introT = WAVE_BREAK;
            if (api.scoring) sfx.playWave();
        }
    } else if (s.phase === "dying") {
        s.deathT += dt;
        if (s.deathT >= SHIP_DEATH_TIME) api.onShipDead();
    } else if (s.phase === "attract") {
        // the menu backdrop plays itself: drones drift in and are picked off
        s.spawnTimer -= dt;
        if (s.spawnTimer <= 0 && s.drones.length < 4) {
            spawnDrone(s, L.W, L.H, L.scale);
            s.spawnTimer = 1.5;
        }
        if (!s.locked) {
            const target = s.drones.find((d) => !d.doomed && d.y > L.H * 0.18);
            if (target) s.locked = target.id;
        }
        // type the locked word out at a steady, human-looking pace
        s.introT -= dt;
        if (s.introT <= 0) {
            s.introT = 0.16;
            const d = s.drones.find((x) => x.id === s.locked);
            if (d) {
                d.typed++;
                const done = d.typed >= d.word.length;
                if (done) {
                    d.doomed = true;
                    s.locked = 0;
                }
                fireAt(s, d, L, done, false);
            }
        }
    }

    // ---- drones fly ----
    for (const d of s.drones) {
        d.born = Math.min(1, d.born + dt * 3);
        d.spin += dt * 1.1;
        d.sway += dt * 1.3;
        d.hit = Math.max(0, d.hit - dt * 5);
        // a lazy lateral wobble so a formation never looks like a ruler
        d.vx += Math.sin(d.sway) * DRONE_SWAY * L.scale * dt * 60;
        d.x += d.vx * dt;
        d.y += d.vy * dt;
    }

    // ---- collision with the ship ----
    // Doomed drones are skipped: dying to something you have already typed out
    // reads as the game cheating, and the killing bolt is only ~0.2 s behind.
    if (s.phase === "fighting" && api.scoring) {
        for (const d of s.drones) {
            if (d.doomed) continue;
            if (Math.hypot(d.x - L.shipX, d.y - L.shipY) < L.killR + d.r * 0.6) {
                s.phase = "dying";
                s.deathT = 0;
                s.locked = 0;
                s.flash = 1;
                s.glitch = 1;
                spawnShipDeath(s, L.shipX, L.shipY, L.scale);
                sfx.playShipDeath();
                break;
            }
        }
    }

    // ---- bolts fly, then land ----
    const landed: typeof s.bolts = [];
    for (const b of s.bolts) {
        b.remain -= Math.hypot(b.vx, b.vy) * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life += dt;
        if (b.remain <= 0 || b.life > BOLT_LIFE) landed.push(b);
    }
    s.bolts = s.bolts.filter((b) => b.remain > 0 && b.life <= BOLT_LIFE);

    for (const b of landed) {
        const d = s.drones.find((x) => x.id === b.target);
        if (!d) continue;
        d.incoming = Math.max(0, d.incoming - 1);
        if (b.killing) {
            spawnExplosion(s, d.x, d.y, d.r, L.scale);
            if (api.scoring) {
                s.kills++;
                // the reference's scoring: one point per letter of the word
                s.score += d.word.length;
                sfx.playKill((d.x / L.W) * 2 - 1);
            }
            s.drones = s.drones.filter((x) => x.id !== d.id);
            if (s.locked === d.id) s.locked = 0;
        } else {
            d.hit = 1;
            spawnHit(s, d.x, d.y, L.scale);
        }
    }

    // Safety net: a doomed drone is waiting for its killing bolt. Every bolt
    // resolves within BOLT_LIFE, but if one were ever lost the drone would fly
    // on for ever, un-targetable and un-killable. Blow it up instead.
    for (const d of s.drones) {
        if (d.doomed && d.incoming === 0) {
            spawnExplosion(s, d.x, d.y, d.r, L.scale);
            if (api.scoring) {
                s.kills++;
                s.score += d.word.length;
            }
        }
    }
    s.drones = s.drones.filter((d) => !(d.doomed && d.incoming === 0));

    // drop anything that has flown off the bottom of the screen
    s.drones = s.drones.filter((d) => d.y < L.H + 140 * L.scale);

    // ---- particles ----
    for (const p of s.particles) {
        p.life += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const drag = 1 - Math.min(0.9, PARTICLE_DRAG * dt);
        p.vx *= drag;
        p.vy *= drag;
    }
    s.particles = s.particles.filter((p) => p.life < p.ttl);
}

// ==========================================
// SMALL CANVAS BADGE — the ship, drawn by the game's own painter so the menu
// can never show a ship that looks different from the real thing.
// ==========================================

/**
 * One figure on the results screen: a small grey caps label over a big light
 * cyan number with a hairline rule under it — the reference's exact layout.
 */
function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-[11px] tracking-[0.22em] text-[#7c9c99] font-medium">{label}</span>
            <span className="text-4xl sm:text-5xl font-light text-[#3ff0d0] tabular-nums leading-none">
                {value}
            </span>
            <span className="h-px bg-[#3ff0d0]/45 mt-2" />
        </div>
    );
}

function ShipBadge({ size = 96 }: { size?: number }) {
    const ref = useRef<HTMLCanvasElement | null>(null);
    useEffect(() => {
        const c = ref.current;
        if (!c) return;
        const dpr = Math.min(2, typeof window === "undefined" ? 1 : window.devicePixelRatio || 1);
        c.width = Math.round(size * dpr);
        c.height = Math.round(size * dpr);
        const ctx = c.getContext("2d");
        if (!ctx) return;
        let raf = 0;
        const t0 = performance.now();
        const frame = (now: number) => {
            raf = requestAnimationFrame(frame);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, size, size);
            const s = getInitialState();
            s.t = (now - t0) / 1000;
            const L = layoutFor(size, size / 0.62);
            drawShip(ctx, s, { ...L, shipX: size / 2, shipY: size * 0.62, scale: size / 78 });
        };
        raf = requestAnimationFrame(frame);
        return () => cancelAnimationFrame(raf);
    }, [size]);
    return <canvas ref={ref} style={{ width: size, height: size }} className="block" />;
}

// ==========================================
// COMPONENT
// ==========================================

export default function StarTypeWorld() {
    const { locale } = useLocale();
    const [gameState, setGameState] = useState<GameState>("MENU");
    const [isMuted, setIsMuted] = useState(sfx.muted);
    const [hud, setHud] = useState({
        score: 0, wave: 1, accuracy: 100, bestStreak: 0, kills: 0,
        phase: "attract" as StarTypeState["phase"], timeMs: 0,
    });
    const [best, setBest] = useState(() => {
        try {
            return typeof window === "undefined"
                ? 0
                : Number(localStorage.getItem("tz-startype-best") || 0);
        } catch {
            return 0;
        }
    });
    const [isNewRecord, setIsNewRecord] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [initState] = useState(getInitialState);
    const stateRef = useRef(initState);
    const gameStateRef = useRef<GameState>("MENU");
    const localeRef = useRef<Locale>(locale);
    const statsSession = useRef<StatsSession | null>(null);
    const sizeRef = useRef({ w: 1280, h: 720 });

    // the rAF loop reads these through refs (it must not re-subscribe)
    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);
    useEffect(() => {
        localeRef.current = locale;
    }, [locale]);

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
        stateRef.current.phase = "over";
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
                step(s, dt, L, { onShipDead: endRun, scoring: gs === "PLAYING" });
            }

            draw(ctx, s, w, h);

            // HUD snapshot at ~20 Hz (never per frame — see CLAUDE.md)
            hudAcc += dt;
            if (hudAcc >= 0.05) {
                hudAcc = 0;
                setHud({
                    score: s.score,
                    wave: s.wave,
                    accuracy: s.totalKeys > 0
                        ? Math.round((s.correctKeys / s.totalKeys) * 1000) / 10
                        : 100,
                    bestStreak: s.bestStreak,
                    kills: s.kills,
                    phase: s.phase,
                    timeMs: s.runTimeMs,
                });
            }
        };

        raf = requestAnimationFrame(frame);
        return () => cancelAnimationFrame(raf);
    }, [endRun]);

    // ---------- start / restart ----------
    const startGame = useCallback(() => {
        sfx.init();
        sfx.resume();
        statsSession.current?.end();
        statsSession.current = createStatsSession();
        setIsNewRecord(false);
        resetRun(stateRef.current);
        setGameState("PLAYING");
    }, []);

    const backToMenu = useCallback(() => {
        const s = stateRef.current;
        s.phase = "attract";
        s.wave = 1;
        s.drones = [];
        s.bolts = [];
        s.particles = [];
        s.locked = 0;
        s.spawnTimer = 0.3;
        s.introT = 0.3;
        s.flash = 0;
        s.glitch = 0;
        s.deathT = 0;
        setGameState("MENU");
    }, []);

    // ---------- run ended: flush stats, log the attempt, update the record ----------
    useEffect(() => {
        if (gameState !== "GAME_OVER") return;
        statsSession.current?.end();
        statsSession.current = null;
        const s = stateRef.current;
        const minutes = s.runTimeMs / 60000;
        const wpm = minutes > 0 ? Math.round(s.correctKeys / 5 / minutes) : 0;
        recordAttempt({
            lessonId: "star-type",
            type: "game",
            wpm,
            accuracy: s.totalKeys > 0 ? Math.round((s.correctKeys / s.totalKeys) * 100) : 0,
            stars: 0,
            timeMs: Math.round(s.runTimeMs),
            errors: s.totalKeys - s.correctKeys,
            problemKeys: {},
        });
        setIsNewRecord(s.score > 0 && s.score > best);
        if (s.score > best) {
            setBest(s.score);
            try {
                localStorage.setItem("tz-startype-best", String(s.score));
            } catch { /* private mode */ }
        }
    }, [gameState]);

    // ---------- typing input: the lock-on model ----------
    useEffect(() => {
        if (gameState !== "PLAYING") return;
        const onKey = (e: KeyboardEvent) => {
            const s = stateRef.current;
            if (s.phase !== "fighting" && s.phase !== "wave-intro") return;
            if (e.ctrlKey || e.altKey || e.metaKey || e.key.length > 1) return;
            if (e.code === "Space") e.preventDefault();

            const char = e.key.toLowerCase();
            if (char < "a" || char > "z") return; // words are lowercase letters only

            const L = layoutFor(sizeRef.current.w, sizeRef.current.h);
            let locked = s.locked ? s.drones.find((d) => d.id === s.locked) : undefined;
            // a locked drone that died (or was already finished) frees the lock
            if (locked && (locked.doomed || locked.typed >= locked.word.length)) {
                s.locked = 0;
                locked = undefined;
            }

            s.totalKeys++;

            if (!locked) {
                // NO LOCK: this key chooses a target. Only a word's FIRST letter
                // can do that, and of the matches the one nearest the ship wins —
                // the most urgent drone is always the one you get.
                const target = findTarget(s, char, L);
                if (!target) {
                    s.streak = 0;
                    statsSession.current?.stroke(char, false);
                    sfx.playMiss();
                    return;
                }
                s.locked = target.id;
                locked = target;
            } else if (locked.word[locked.typed] !== char) {
                // LOCKED: only the next letter of this word counts. The lock is
                // NOT dropped on a mistake — hunting for the right key must not
                // also cost you the target you already committed to.
                s.streak = 0;
                statsSession.current?.stroke(locked.word[locked.typed], false);
                sfx.playMiss();
                return;
            }

            // a hit
            s.correctKeys++;
            s.streak++;
            s.bestStreak = Math.max(s.bestStreak, s.streak);
            statsSession.current?.stroke(char, true);
            locked.typed++;
            const finished = locked.typed >= locked.word.length;
            if (finished) {
                // the drone dies when the LAST bolt lands, not now — but it stops
                // being able to kill you the moment the word is done
                locked.doomed = true;
                s.locked = 0;
            }
            fireAt(s, locked, L, finished, true);
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
            } else if (e.key === "Enter") {
                if (gameState === "GAME_OVER" || gameState === "MENU") startGame();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [gameState, startGame]);

    // Dev-only inspection hook: the whole game draws to a canvas, so the headless
    // browser driver in `.claude/skills/verify` has no DOM to read the live words
    // from. Never exposed in a production build.
    useEffect(() => {
        if (process.env.NODE_ENV === "production") return;
        (window as unknown as { __starType?: StarTypeState }).__starType = stateRef.current;
        return () => {
            delete (window as unknown as { __starType?: StarTypeState }).__starType;
        };
    }, []);

    // ---------- cleanup ----------
    useEffect(() => {
        return () => {
            sfx.audioCtx?.suspend();
            statsSession.current?.end();
        };
    }, []);

    const pad = (n: number, w: number) => String(Math.max(0, n)).padStart(w, "0");

    return (
        <div className="w-full h-full relative overflow-hidden">
            <style>{`
                @keyframes st-fade { from { opacity: 0 } to { opacity: 1 } }
                .st-fade { animation: st-fade .45s ease-out both; }
                @keyframes st-rise { from { transform: translateY(18px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
                .st-rise { animation: st-rise .4s ease-out both; }
                @keyframes st-pulse { 0%,100% { opacity: .55 } 50% { opacity: 1 } }
                .st-pulse { animation: st-pulse 1.6s ease-in-out infinite; }
            `}</style>

            <canvas ref={canvasRef} className="absolute inset-0 block" />

            {/* ---------------- IN-RUN HUD ----------------
                The reference shows a pause control and the wave badge, and
                nothing else — no score, no accuracy, no streak. That restraint is
                the point: your eyes belong on the falling words. The wave badge
                is painted on the canvas; only the buttons live here. */}
            {(gameState === "PLAYING" || gameState === "PAUSED") && (
                <div className="absolute top-4 left-4 z-40 flex gap-2 font-sans">
                    <button
                        title={`${UI.pause[locale]} (Esc)`}
                        onClick={() => {
                            if (gameState === "PLAYING") {
                                sfx.audioCtx?.suspend();
                                setGameState("PAUSED");
                            }
                        }}
                        className="w-9 h-9 rounded border border-[#3ff0d0]/25 text-[#8fd8d0] hover:text-[#3ff0d0] hover:border-[#3ff0d0]/60 transition-colors flex items-center justify-center"
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                    </button>
                    <button
                        title={isMuted ? UI.unmute[locale] : UI.mute[locale]}
                        onClick={() => setIsMuted(sfx.toggleMute())}
                        className="w-9 h-9 rounded border border-[#3ff0d0]/25 text-[#8fd8d0] hover:text-[#3ff0d0] hover:border-[#3ff0d0]/60 transition-colors flex items-center justify-center"
                    >
                        {isMuted ? (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="22" y1="9" x2="16" y2="15" /><line x1="16" y1="9" x2="22" y2="15" /></svg>
                        ) : (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
                        )}
                    </button>
                    <a
                        href="/games"
                        title={UI.quit[locale]}
                        className="w-9 h-9 rounded border border-[#3ff0d0]/25 text-[#8fd8d0] hover:text-[#ff9d2e] hover:border-[#ff9d2e]/60 transition-colors flex items-center justify-center"
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </a>
                </div>
            )}

            {/* ---------------- GAME OVER ---------------- */}
            {gameState === "GAME_OVER" && (
                <div className="absolute inset-0 z-50 bg-[#08181a]/80 backdrop-blur-[2px] flex flex-col items-center justify-center font-sans p-6 st-fade">
                    <div className="w-full max-w-3xl st-rise">
                        <div className="grid grid-cols-2 gap-x-10 gap-y-9">
                            <Stat label={UI.finalScore[locale]} value={pad(hud.score, 6)} />
                            <Stat
                                label={UI.youReached[locale]}
                                value={`${UI.wave[locale]} ${pad(hud.wave, 3)}`}
                            />
                            <Stat label={UI.accuracy[locale]} value={`${hud.accuracy.toFixed(1)}%`} />
                            <Stat label={UI.longestStreak[locale]} value={String(hud.bestStreak)} />
                        </div>

                        {isNewRecord && (
                            <p className="mt-8 text-center text-[#f5c518] text-sm tracking-[0.3em] st-pulse">
                                ★ {UI.newRecord[locale]}
                            </p>
                        )}

                        <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
                            <button
                                onClick={startGame}
                                className="text-[#ff9d2e] text-xl hover:text-[#ffd08a] transition-colors"
                            >
                                {UI.playAgain[locale]}
                                <span className="text-[#7c9c99] text-sm ml-2">↵</span>
                            </button>
                            <button
                                onClick={backToMenu}
                                className="text-[#7c9c99] text-lg hover:text-[#3ff0d0] transition-colors"
                            >
                                {UI.backToTitle[locale]}
                            </button>
                            <a
                                href="/games"
                                className="text-[#7c9c99] text-lg hover:text-[#3ff0d0] transition-colors"
                            >
                                {UI.moreGames[locale]}
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* ---------------- TITLE / PAUSE ---------------- */}
            {(gameState === "MENU" || gameState === "PAUSED") && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center font-sans p-6 bg-[#08181a]/55 backdrop-blur-[1px] st-fade">
                    {gameState === "MENU" ? (
                        <>
                            <h1 className="text-[clamp(3rem,13vw,10rem)] leading-[0.85] font-black tracking-[-0.03em] text-white text-center select-none">
                                STAR<span className="text-[#3ff0d0]">TYPE</span>
                            </h1>

                            <div className="mt-6 mb-2">
                                <ShipBadge size={104} />
                            </div>

                            <p className="max-w-xl text-center text-[#9dc4c0] text-sm sm:text-base leading-relaxed">
                                {UI.tagline[locale]}
                            </p>
                            <p className="mt-2 text-center text-[#6d8f8c] text-xs sm:text-sm">
                                {UI.howTo[locale]}
                            </p>

                            {best > 0 && (
                                <p className="mt-5 text-[#f5c518] text-xs tracking-[0.28em]">
                                    {UI.best[locale]} {pad(best, 6)}
                                </p>
                            )}

                            <button
                                onClick={startGame}
                                className="mt-8 px-14 py-3 border-2 border-[#3ff0d0] text-[#3ff0d0] text-xl tracking-[0.35em] hover:bg-[#3ff0d0] hover:text-[#08181a] transition-colors"
                            >
                                {UI.play[locale]}
                            </button>
                            <div className="mt-5 flex items-center gap-7">
                                <button
                                    onClick={() => setIsMuted(sfx.toggleMute())}
                                    className="text-[#6d8f8c] text-sm hover:text-[#3ff0d0] transition-colors"
                                >
                                    {isMuted ? UI.unmute[locale] : UI.mute[locale]}
                                </button>
                                <a
                                    href="/games"
                                    className="text-[#6d8f8c] text-sm hover:text-[#ff9d2e] transition-colors"
                                >
                                    {UI.moreGames[locale]}
                                </a>
                            </div>
                        </>
                    ) : (
                        <>
                            <h2 className="text-5xl font-light tracking-[0.3em] text-[#3ff0d0]">
                                {UI.paused[locale]}
                            </h2>
                            <div className="mt-10 flex flex-wrap items-center justify-center gap-8">
                                <button
                                    onClick={() => {
                                        sfx.resume();
                                        setGameState("PLAYING");
                                    }}
                                    className="text-[#ff9d2e] text-xl hover:text-[#ffd08a] transition-colors"
                                >
                                    {UI.resume[locale]}
                                    <span className="text-[#7c9c99] text-sm ml-2">Esc</span>
                                </button>
                                <button
                                    onClick={startGame}
                                    className="text-[#7c9c99] text-lg hover:text-[#3ff0d0] transition-colors"
                                >
                                    {UI.playAgain[locale]}
                                </button>
                                <button
                                    onClick={backToMenu}
                                    className="text-[#7c9c99] text-lg hover:text-[#3ff0d0] transition-colors"
                                >
                                    {UI.backToTitle[locale]}
                                </button>
                                <a
                                    href="/games"
                                    className="text-[#7c9c99] text-lg hover:text-[#ff9d2e] transition-colors"
                                >
                                    {UI.quit[locale]}
                                </a>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
