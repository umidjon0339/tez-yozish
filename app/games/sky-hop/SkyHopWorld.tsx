/* eslint-disable react-hooks/exhaustive-deps */
"use client";

// =========================================================================
// 🎈 SKY HOP — 2D canvas typing game (no three.js, no image assets).
//
// The hero dangles from a balloon over the ocean while a chain of labelled
// balloons climbs away to the right. Type the highlighted label to HOP onto
// it: every correct key gives a puff of lift, finishing the word gives a big
// one. The balloon leaks air non-stop, so slow typing sinks you into the sea
// (3 lives). Crows dive at your balloon, golden balloons pay double, and every
// 12 balloons is a new stage — faster leak, longer words, a new sky.
//
// Architecture (same contract as typing-ninja / rhino-dash):
//   • ALL simulation state lives in `stateRef.current` (one mutable object)
//     and is mutated inside `step()` — never in React state.
//   • React state is only the ~20 Hz HUD snapshot + menu flags. The typed
//     word is drawn on the canvas straight from `stateRef`, so keystroke
//     feedback costs zero re-renders.
//   • One rAF loop runs the whole time the component is mounted: it draws
//     always (so the menu has a live backdrop that plays itself) and only
//     advances the simulation while PLAYING.
// =========================================================================

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mascot } from "@/components/Mascot";
import { useLocale } from "@/lib/core/locale";
import { createStatsSession, recordAttempt, type StatsSession } from "@/lib/typing/stats";
import { sfx } from "./sound";
import { draw, layoutFor, altToY, HERO_DROP, type Layout } from "./render";
import {
    ALT_RESPAWN, BALLOON_HUES, COMBO_LIFT_CAP, CROW_DIVE, CROW_MAX, CROW_MIN, CROW_DROP,
    CROW_TELE, GOLD_HUE, HOPS_PER_STAGE, IDLE_NUDGE, IMMUNE_TIME, LIFE_EVERY, MAX_LIVES,
    MERCY_ALT, MERCY_FACTOR, MISS_DROP, SPACING, STAGE_SINK_CAP, STAGE_SINK_RAMP,
    currentBalloon, getInitialState, paletteFor, refillChain, resetRun, spawnFeathers,
    spawnPop, spawnPuff, spawnSparkle, spawnSplash, targetBalloon, tierFor,
    type Difficulty, type PaletteKey, type SkyHopState,
} from "./sim";

type GameState = "MENU" | "PLAYING" | "PAUSED" | "GAME_OVER";

const HOP_TIME = 0.3; // seconds of hop animation
// The crow must hover ON SCREEN while it telegraphs (the hero sits at 30% of
// the width, so anything past ~2.4 balloon spacings would be off the edge).
const CROW_SPAWN_AHEAD = SPACING * 3.1;
const SPLASH_TIME = 1.25;
const PARTICLE_GRAVITY: Record<string, number> = {
    puff: -14, shard: 640, drop: 1100, spark: 380, feather: 130,
};


// ==========================================
// LOCALISED STRINGS (en/uz/ru) — the game keeps its own dict, like the
// lesson runtime. Keep the words short: the audience is school students.
// ==========================================

const UI = {
    tagline: {
        en: "Type the glowing balloon to hop onto it. Every letter is a puff of air — stop typing and you sink into the sea. Watch out for crows!",
        uz: "Yonayotgan sharni yozib, unga o'tib ol. Har bir harf — bir puf havo. Yozishni to'xtatsang, dengizga tushasan. Qarg'alardan ehtiyot bo'l!",
        ru: "Печатай слово на светящемся шаре, чтобы перепрыгнуть на него. Каждая буква — порция воздуха. Перестанешь печатать — упадёшь в море. Берегись ворон!",
    },
    best: { en: "Best", uz: "Rekord", ru: "Рекорд" },
    newRecord: { en: "New record!", uz: "Yangi rekord!", ru: "Новый рекорд!" },
    easy: { en: "EASY", uz: "OSON", ru: "ЛЕГКО" },
    medium: { en: "MEDIUM", uz: "O'RTA", ru: "СРЕДНЕ" },
    hard: { en: "HARD", uz: "QIYIN", ru: "СЛОЖНО" },
    hintEasy: { en: "single letters", uz: "bitta harf", ru: "по одной букве" },
    hintMedium: { en: "short words", uz: "qisqa so'zlar", ru: "короткие слова" },
    hintHard: { en: "long words, fast leak", uz: "uzun so'zlar, tez tushish", ru: "длинные слова, быстрый спуск" },
    paused: { en: "Paused", uz: "To'xtatildi", ru: "Пауза" },
    continue: { en: "Continue", uz: "Davom etish", ru: "Продолжить" },
    restart: { en: "Restart", uz: "Boshidan", ru: "Заново" },
    menu: { en: "Menu", uz: "Menyu", ru: "Меню" },
    quit: { en: "Quit", uz: "Chiqish", ru: "Выйти" },
    score: { en: "Score", uz: "Ball", ru: "Счёт" },
    acc: { en: "Acc", uz: "Aniq", ru: "Точн" },
    time: { en: "Time", uz: "Vaqt", ru: "Время" },
    stage: { en: "Stage", uz: "Bosqich", ru: "Этап" },
    balloons: { en: "Balloons", uz: "Sharlar", ru: "Шары" },
    streak: { en: "Streak", uz: "Ketma-ket", ru: "Серия" },
    gold: { en: "Gold", uz: "Tilla", ru: "Золото" },
    crows: { en: "Crows", uz: "Qarg'alar", ru: "Вороны" },
    alt: { en: "Alt", uz: "Balandlik", ru: "Высота" },
    sea: { en: "Sea", uz: "Dengiz", ru: "Море" },
    toNextIsland: {
        en: "to the next island",
        uz: "keyingi orolgacha",
        ru: "до следующего острова",
    },
    typeGlowing: {
        en: "Type the glowing balloon!",
        uz: "Yonayotgan sharni yoz!",
        ru: "Печатай светящийся шар!",
    },
    go: { en: "GO!", uz: "BOSHLA!", ru: "СТАРТ!" },
    crowIncoming: {
        en: "CROW INCOMING — HOP AWAY!",
        uz: "QARG'A KELDI — TEZ O'TIB OL!",
        ru: "ВОРОНА ЛЕТИТ — ПРЫГАЙ!",
    },
    crowDiving: { en: "DIVING!", uz: "TASHLANDI!", ru: "АТАКУЕТ!" },
    keepTyping: { en: "Keep typing!", uz: "Yozishda davom et!", ru: "Печатай дальше!" },
    stageUpNote: {
        en: "longer words · faster leak",
        uz: "uzunroq so'zlar · tezroq tushish",
        ru: "длиннее слова · быстрее спуск",
    },
    extraBalloon: { en: "+1 balloon", uz: "+1 shar", ru: "+1 шар" },
    splash: { en: "Splash!", uz: "Cholp!", ru: "Бултых!" },
    balloonsLeft: {
        en: (n: number) => `${n} balloon${n > 1 ? "s" : ""} left`,
        uz: (n: number) => `${n} shar qoldi`,
        ru: (n: number) => `осталось шаров: ${n}`,
    },
    lastBalloonGone: {
        en: "last balloon gone…",
        uz: "oxirgi shar ham ketdi…",
        ru: "последний шар лопнул…",
    },
    gameOver: { en: "Down in the Sea!", uz: "Dengizga tushdingiz!", ru: "Ты упал в море!" },
    gameOverNote: {
        en: (hops: number, stage: number) => `You rode ${hops} balloon${hops > 1 ? "s" : ""} and reached stage ${stage}.`,
        uz: (hops: number, stage: number) => `${hops} sharda uchdingiz va ${stage}-bosqichga chiqdingiz.`,
        ru: (hops: number, stage: number) => `Ты пролетел на ${hops} шарах и дошёл до этапа ${stage}.`,
    },
    gameOverZero: {
        en: "The sea got you before the first hop…",
        uz: "Birinchi sakrashgacha dengizga tushdingiz…",
        ru: "Море забрало тебя до первого прыжка…",
    },
    flyAgain: { en: "Fly Again", uz: "Yana uchish", ru: "Ещё раз" },
    unmute: { en: "Unmute", uz: "Ovozni yoqish", ru: "Включить звук" },
    mute: { en: "Mute", uz: "Ovozni o'chirish", ru: "Выключить звук" },
    pause: { en: "Pause", uz: "To'xtatish", ru: "Пауза" },
    skies: {
        morning: { en: "Morning", uz: "Tong", ru: "Утро" },
        noon: { en: "High noon", uz: "Tush payti", ru: "Полдень" },
        golden: { en: "Golden hour", uz: "Oltin soat", ru: "Золотой час" },
        dusk: { en: "Dusk", uz: "Shom", ru: "Сумерки" },
        stars: { en: "Starlight", uz: "Yulduzli tun", ru: "Звёздная ночь" },
        storm: { en: "Thunderhead", uz: "Momaqaldiroq", ru: "Гроза" },
    } as Record<PaletteKey, { en: string; uz: string; ru: string }>,
};

// ==========================================
// SIMULATION STEP — the only writer of state
// ==========================================

interface StepApi {
    onSplashDone: () => void;
}

function step(s: SkyHopState, dtRaw: number, L: Layout, api: StepApi) {
    const dt = Math.min(dtRaw, 0.1); // never let a tab-switch teleport the sim

    s.t += dt;
    // decay the feel channels
    s.lift = Math.max(0, s.lift - dt * 2.4);
    s.errFlash = Math.max(0, s.errFlash - dt * 3.6);
    s.redFlash = Math.max(0, s.redFlash - dt * 3.2);
    s.goldFlash = Math.max(0, s.goldFlash - dt * 2.2);
    s.trauma = Math.max(0, s.trauma - dt * 2.2);
    s.stageBanner = Math.max(0, s.stageBanner - dt);
    s.lightning = Math.max(0, s.lightning - dt * 4);

    // storm lightning
    if (paletteFor(s.stage).storm) {
        s.lightningTimer -= dt;
        if (s.lightningTimer <= 0) {
            s.lightning = 1;
            s.lightningTimer = 3 + Math.random() * 5;
        }
    }

    if (s.phase === "countdown") {
        const before = Math.ceil(s.countdown);
        s.countdown -= dt;
        const after = Math.ceil(s.countdown);
        if (after !== before) sfx.playCountBeep(after <= 0);
        if (s.countdown <= 0) s.phase = "flying";
    }

    if (s.phase === "flying") {
        s.flyTimeMs += dt * 1000;
        s.idleT += dt;
        if (s.immune > 0) s.immune = Math.max(0, s.immune - dt);

        const stageMul = Math.min(STAGE_SINK_CAP, 1 + s.stage * STAGE_SINK_RAMP);
        const mercy = s.alt < MERCY_ALT ? MERCY_FACTOR : 1;
        const prev = s.alt;
        s.alt -= s.cfg.sink * stageMul * mercy * dt;
        s.altVel = (s.alt - prev) / dt;

        if (s.alt <= 0) {
            s.alt = 0;
            s.phase = "splash";
            s.splashT = 0;
            s.trauma = Math.max(s.trauma, 0.8);
            s.combo = 0;
            const b = currentBalloon(s);
            if (b) {
                releaseBalloon(s, L, true);
                s.balloons = s.balloons.filter((x) => x.ix !== b.ix);
            }
            spawnSplash(s, s.heroIx * SPACING, L.seaY, paletteFor(s.stage).foam);
            sfx.playSplash();
        }

        stepCrow(s, dt, L);
    }

    if (s.phase === "splash") {
        s.splashT += dt;
        if (s.splashT >= SPLASH_TIME) api.onSplashDone();
    }

    // idle attract mode: the menu backdrop plays itself
    if (s.phase === "idle") {
        s.alt = 0.62 + Math.sin(s.t * 0.7) * 0.06;
        s.idleT += dt;
        if (s.idleT > 0.17) {
            s.idleT = 0;
            const tb = targetBalloon(s);
            if (tb) {
                s.typed++;
                if (s.typed >= tb.word.length) doHop(s, L, false);
            }
        }
    }

    // camera easing — the hop pushes the hero ahead of the anchor, the camera
    // then reels them back in, which is what sells the swing
    const camTarget = s.heroIx * SPACING;
    s.camX += (camTarget - s.camX) * Math.min(1, dt * 8.5);

    if (s.hopT < 1) s.hopT = Math.min(1, s.hopT + dt / HOP_TIME);

    // body sway follows vertical velocity
    const swayTarget = Math.max(-1, Math.min(1, s.altVel * 6 + (s.hopT < 1 ? 0.6 : 0)));
    s.sway += (swayTarget - s.sway) * Math.min(1, dt * 6);

    // particles
    for (const p of s.particles) {
        p.life += dt;
        p.wx += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += (PARTICLE_GRAVITY[p.kind] ?? 300) * dt;
        p.rot += p.vrot * dt;
        if (p.kind === "puff" || p.kind === "feather") {
            const drag = 1 - Math.min(0.9, 2.2 * dt);
            p.vx *= drag;
            p.vy *= drag;
        }
    }
    s.particles = s.particles.filter((p) => p.life < p.ttl);

    // released / burst balloons
    for (const fb of s.freeBalloons) {
        fb.life += dt;
        fb.wx += fb.vx * dt;
        fb.y += fb.vy * dt;
        fb.vy += (fb.popped ? 900 : -18) * dt;
        fb.rot += fb.vrot * dt;
    }
    s.freeBalloons = s.freeBalloons.filter((fb) => fb.life < fb.ttl);

    // drop islands that have slid past
    s.islands = s.islands.filter((isl) => isl.ix > s.heroIx - 4);
}

/** The balloon the hero is leaving: it floats away, or bursts if `pop`. */
function releaseBalloon(s: SkyHopState, L: Layout, pop: boolean) {
    const b = currentBalloon(s);
    if (!b) return;
    const y = altToY(s.alt, L);
    const hue = b.gold ? GOLD_HUE : BALLOON_HUES[b.hue];
    if (pop) {
        spawnPop(s, b.ix * SPACING, y, hue.body);
        sfx.playPop();
    } else {
        s.freeBalloons.push({
            wx: b.ix * SPACING, y, vy: -70 - Math.random() * 40,
            vx: -20 - Math.random() * 30, hue: b.hue, gold: b.gold,
            rot: 0, vrot: (Math.random() - 0.5) * 1.2, life: 0, ttl: 2.4, popped: false,
        });
        spawnPuff(s, b.ix * SPACING, y + 40 * L.scale, 5);
    }
}

/** Move the hero onto the target balloon. `scoring` is false in attract mode. */
function doHop(s: SkyHopState, L: Layout, scoring: boolean) {
    const target = targetBalloon(s);
    if (!target) return;

    releaseBalloon(s, L, false);

    const comboBonus = Math.min(COMBO_LIFT_CAP, Math.floor(s.combo / 8) * 0.08);
    s.heroIx = target.ix;
    s.typed = 0;
    s.hopT = 0;
    s.alt = Math.min(1, s.alt + s.cfg.hopLift * (1 + comboBonus));
    s.lift = 1;
    s.hops++;
    s.idleT = 0;
    refillChain(s);

    if (!scoring) return;

    s.wordsTyped++;
    const mult = target.gold ? 2 : 1;
    s.score += Math.round(target.word.length * 10 * mult * (1 + comboBonus));
    sfx.playHop();

    if (target.gold) {
        s.goldPopped++;
        s.goldFlash = 1;
        s.alt = Math.min(1, s.alt + 0.06);
        spawnSparkle(s, s.heroIx * SPACING, altToY(s.alt, L), 14);
        sfx.playGold();
    }

    // a crow diving at the balloon we just left grabs nothing but rubber
    if (s.crow && s.crow.phase === "dive" && s.crow.targetIx < s.heroIx) {
        s.crow.phase = "leave";
        s.crow.t = 0;
        s.crowsDodged++;
        s.score += 75;
        spawnFeathers(s, s.crow.wx, s.crow.y);
        sfx.playCaw();
    }

    // stage checkpoint
    if (s.hops % HOPS_PER_STAGE === 0) {
        s.stage++;
        s.stageBanner = 2.6;
        s.score += 200;
        s.islands.push({ ix: s.heroIx + 5, stage: s.stage });
        if (s.stage % LIFE_EVERY === 0 && s.lives < MAX_LIVES) s.lives++;
        // words for the new tier: rebuild the part of the chain not yet reached
        s.balloons = s.balloons.filter((b) => b.ix <= s.heroIx + 1);
        refillChain(s);
        sfx.playStageUp();
    }
}

/** Crow attack cycle: silence → telegraph caw → dive → leave. */
function stepCrow(s: SkyHopState, dt: number, L: Layout) {
    const heroWx = s.heroIx * SPACING;
    // the crow circles above the hero, but never off the top of the frame
    const heroY = Math.max(altToY(s.alt, L), 190 * L.scale);

    if (!s.crow) {
        // no crows in stage 0 — beginners get to learn the flight model first
        if (s.stage < 1) return;
        s.crowTimer -= dt;
        if (s.crowTimer <= 0) {
            const gap = CROW_MAX - (CROW_MAX - CROW_MIN) * Math.min(1, s.stage / 5);
            s.crowTimer = gap + Math.random() * 3;
            s.crow = {
                phase: "tele", t: 0,
                wx: heroWx + CROW_SPAWN_AHEAD, y: heroY - 150 * L.scale,
                fromY: heroY - 150 * L.scale, flap: 0, hit: false,
                targetIx: s.heroIx,
            };
            sfx.playCaw();
        }
        return;
    }

    const c = s.crow;
    c.t += dt;
    c.flap += dt;

    if (c.phase === "tele") {
        // hovers ahead, screaming, so the player knows to hurry
        c.wx = heroWx + CROW_SPAWN_AHEAD - c.t * 80;
        c.y = c.fromY + Math.sin(c.t * 5) * 14 * L.scale;
        c.targetIx = s.heroIx;
        if (c.t >= CROW_TELE) {
            c.phase = "dive";
            c.t = 0;
            c.fromY = c.y;
            c.targetIx = s.heroIx;
        }
        return;
    }

    if (c.phase === "dive") {
        const p = Math.min(1, c.t / CROW_DIVE);
        const ease = p * p;
        const from = heroWx + CROW_SPAWN_AHEAD - CROW_TELE * 80;
        c.wx = from + (c.targetIx * SPACING - from) * ease;
        c.y = c.fromY + (altToY(s.alt, L) - 44 * L.scale - c.fromY) * ease;
        if (p >= 1) {
            c.phase = "leave";
            c.t = 0;
            if (c.targetIx === s.heroIx && s.immune <= 0) {
                // it got you: the balloon bursts, you drop, and a spare inflates
                // (the chain must always have a balloon at the ridden index)
                releaseBalloon(s, L, true);
                s.balloons = s.balloons.filter((b) => b.ix !== s.heroIx);
                refillChain(s);
                s.alt = Math.max(0.02, s.alt - CROW_DROP);
                s.combo = 0;
                s.trauma = Math.max(s.trauma, 0.7);
                s.redFlash = 1;
                spawnFeathers(s, c.wx, c.y);
                c.hit = true;
            } else {
                s.crowsDodged++;
                s.score += 75;
                spawnFeathers(s, c.wx, c.y);
            }
        }
        return;
    }

    // leave: climb away to the right and despawn
    c.wx += 420 * dt;
    c.y -= 190 * dt;
    if (c.t > 2) s.crow = null;
}

// ==========================================
// COMPONENT
// ==========================================

export default function SkyHopWorld() {
    const { locale } = useLocale();
    const [gameState, setGameState] = useState<GameState>("MENU");
    const [isMuted, setIsMuted] = useState(sfx.muted);
    const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
    const [hud, setHud] = useState({
        score: 0, wpm: 0, accuracy: 0, combo: 0, bestCombo: 0, alt: 0.7,
        lives: MAX_LIVES, stage: 0, hops: 0, phase: "idle" as SkyHopState["phase"],
        countdown: 0, stageBanner: 0, idle: 0, crow: "none" as "none" | "tele" | "dive",
        immune: 0, tier: 0, gold: 0, dodged: 0, timeMs: 0,
    });
    const [highScore, setHighScore] = useState(() => {
        try {
            return typeof window === "undefined" ? 0 : Number(localStorage.getItem("tz-skyhop-highscore") || 0);
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

    // the rAF loop reads the game state through a ref (it must not re-subscribe)
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

    // ---------- the one rAF loop: always draws, steps only while PLAYING ----------
    const endRun = useCallback(() => {
        sfx.stopBGM();
        sfx.playDefeat();
        setGameState("GAME_OVER");
    }, []);

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
                    onSplashDone: () => {
                        s.splashT = 0;
                        s.lives--;
                        if (s.lives <= 0) {
                            s.phase = "over";
                            endRun();
                        } else {
                            // rescued: a fresh balloon inflates and you climb back out
                            s.phase = "flying";
                            s.alt = ALT_RESPAWN;
                            s.immune = IMMUNE_TIME;
                            s.typed = 0;
                            s.hopT = 1;
                            refillChain(s);
                            spawnPuff(s, s.heroIx * SPACING, altToY(s.alt, L) + (HERO_DROP + 16) * L.scale, 10);
                            sfx.playHop();
                        }
                    },
                });
            }

            draw(ctx, s, w, h);

            // HUD snapshot at ~20 Hz (never per frame — see CLAUDE.md)
            hudAcc += dt;
            if (hudAcc >= 0.05) {
                hudAcc = 0;
                const minutes = s.flyTimeMs / 60000;
                setHud({
                    score: s.score,
                    wpm: minutes > 0 ? Math.round(s.correctKeystrokes / 5 / minutes) : 0,
                    accuracy: s.totalKeystrokes > 0 ? Math.round((s.correctKeystrokes / s.totalKeystrokes) * 100) : 100,
                    combo: s.combo,
                    bestCombo: s.bestCombo,
                    alt: s.alt,
                    lives: s.lives,
                    stage: s.stage,
                    hops: s.hops,
                    phase: s.phase,
                    countdown: s.countdown,
                    stageBanner: s.stageBanner,
                    idle: s.idleT,
                    crow: s.crow ? (s.crow.phase === "leave" ? "none" : s.crow.phase) : "none",
                    immune: s.immune,
                    tier: tierFor(s),
                    gold: s.goldPopped,
                    dodged: s.crowsDodged,
                    timeMs: s.flyTimeMs,
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
        sfx.startBGM(() => {
            const s = stateRef.current;
            return 1 + Math.min(0.6, s.stage * 0.07) + Math.min(0.3, s.combo / 60);
        });
    }, []);

    const backToMenu = useCallback(() => {
        sfx.stopBGM();
        const s = stateRef.current;
        s.phase = "idle";
        s.typed = 0;
        s.crow = null;
        s.particles = [];
        s.freeBalloons = [];
        s.stage = 0;
        s.combo = 0;
        s.islands = [];
        s.alt = 0.62;
        refillChain(s);
        setGameState("MENU");
    }, []);

    // ---------- run ended: flush stats, log the attempt, update the record ----------
    useEffect(() => {
        if (gameState !== "GAME_OVER") return;
        statsSession.current?.end();
        statsSession.current = null;
        const s = stateRef.current;
        const minutes = s.flyTimeMs / 60000;
        recordAttempt({
            lessonId: "sky-hop",
            type: "game",
            wpm: minutes > 0 ? Math.round(s.correctKeystrokes / 5 / minutes) : 0,
            accuracy: s.totalKeystrokes > 0 ? Math.round((s.correctKeystrokes / s.totalKeystrokes) * 100) : 0,
            stars: 0,
            timeMs: Math.round(s.flyTimeMs),
            errors: s.totalKeystrokes - s.correctKeystrokes,
            problemKeys: {},
        });
        setIsNewRecord(s.score > 0 && s.score > highScore);
        if (s.score > highScore) {
            setHighScore(s.score);
            try {
                localStorage.setItem("tz-skyhop-highscore", String(s.score));
            } catch {}
        }
    }, [gameState]);

    // ---------- typing input ----------
    useEffect(() => {
        if (gameState !== "PLAYING") return;
        const onKey = (e: KeyboardEvent) => {
            const s = stateRef.current;
            if (s.phase !== "flying") return;
            if (e.ctrlKey || e.altKey || e.metaKey || e.key.length > 1) return;
            if (e.code === "Space") e.preventDefault();

            const target = targetBalloon(s);
            if (!target) return;
            const L = layoutFor(sizeRef.current.w, sizeRef.current.h);

            const char = e.key.toLowerCase();
            const expected = target.word[s.typed]?.toLowerCase();
            s.totalKeystrokes++;
            s.idleT = 0;

            if (char === expected) {
                s.typed++;
                s.correctKeystrokes++;
                s.combo++;
                s.bestCombo = Math.max(s.bestCombo, s.combo);
                statsSession.current?.stroke(char, true);

                // every correct key is a puff of lift — this is the core loop
                const comboBonus = Math.min(COMBO_LIFT_CAP, Math.floor(s.combo / 8) * 0.08);
                const ceiling = s.alt >= 0.995; // already at the top of the sky
                s.alt = Math.min(1, s.alt + s.cfg.keyLift * (1 + comboBonus));
                s.lift = 1;
                // lift that would overflow the ceiling pays out as score instead,
                // so typing faster than you need to is never wasted
                s.score += 5 + Math.min(10, Math.floor(s.combo / 5)) + (ceiling ? 4 : 0);
                spawnPuff(s, s.heroIx * SPACING, altToY(s.alt, L) + (HERO_DROP + 22) * L.scale, 2);
                sfx.playKey(s.typed / Math.max(1, target.word.length));
                sfx.playPuff();

                if (s.typed >= target.word.length) doHop(s, L, true);
            } else {
                statsSession.current?.stroke(expected ?? char, false);
                s.combo = 0;
                s.alt = Math.max(0.005, s.alt - MISS_DROP);
                s.errFlash = 1;
                s.redFlash = 1;
                s.trauma = Math.max(s.trauma, 0.35);
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
            } else if (e.key === "Enter") {
                if (gameState === "GAME_OVER") startGame(difficulty);
                else if (gameState === "MENU") startGame(difficulty);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [gameState, difficulty, startGame]);

    // Dev-only inspection hook: the whole game draws to a canvas, so the
    // headless browser driver in `.claude/skills/verify` has no DOM to read the
    // live word from. Never exposed in a production build.
    useEffect(() => {
        if (process.env.NODE_ENV === "production") return;
        (window as unknown as { __skyHop?: SkyHopState }).__skyHop = stateRef.current;
        return () => {
            delete (window as unknown as { __skyHop?: SkyHopState }).__skyHop;
        };
    }, []);

    // ---------- cleanup ----------
    useEffect(() => {
        return () => {
            sfx.stopBGM();
            sfx.audioCtx?.suspend();
            statsSession.current?.end();
        };
    }, []);

    const fmtTime = (ms: number) => {
        const secs = Math.round(ms / 1000);
        return secs >= 60 ? `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}` : `${secs}s`;
    };
    const countdownNum = Math.ceil(hud.countdown);
    const palName = UI.skies[paletteFor(hud.stage).key][locale];
    const nudge = gameState === "PLAYING" && hud.phase === "flying" && hud.idle > IDLE_NUDGE;
    const balloonsToStage = HOPS_PER_STAGE - (hud.hops % HOPS_PER_STAGE);

    return (
        <div className="w-full h-full relative overflow-hidden">
            <style>{`
                @keyframes sh-pop { 0% { transform: scale(1.35); } 100% { transform: scale(1); } }
                .sh-pop { animation: sh-pop .18s ease-out; }
                @keyframes sh-rise { 0% { transform: translateY(14px); opacity: 0 } 100% { transform: translateY(0); opacity: 1 } }
                .sh-rise { animation: sh-rise .3s ease-out; }
                @keyframes sh-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
                .sh-float { animation: sh-float 2.6s ease-in-out infinite; }
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
                            <div className="bg-amber-400/95 backdrop-blur border-2 border-[#14344f] rounded-full px-4 py-1.5 flex items-center gap-2 shadow-[0_3px_0_rgba(20,52,79,0.9)] -rotate-2 sh-pop">
                                <span className="text-sm">🔥</span>
                                <span className="font-mono font-black text-[#14344f]">×{hud.combo}</span>
                            </div>
                        )}
                    </div>

                    {/* stage + balloons to next island */}
                    <div className="absolute top-16 xl:top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none flex flex-col items-center gap-1.5 font-sans">
                        <div className="flex items-center gap-2">
                            <div className="bg-white/92 border-2 border-[#14344f] rounded-full px-4 py-1 shadow-[0_3px_0_rgba(20,52,79,0.9)]">
                                <span className="text-xs font-black text-[#14344f] uppercase tracking-widest">
                                    {UI.stage[locale]} {hud.stage + 1} · {palName}
                                </span>
                            </div>
                            <div className="bg-emerald-400/95 border-2 border-[#14344f] rounded-full px-3 py-1 shadow-[0_3px_0_rgba(20,52,79,0.9)] flex items-center gap-1.5">
                                <span className="text-xs">🎈</span>
                                <span className="text-xs font-black text-[#14344f]">{hud.hops}</span>
                            </div>
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-white/85 [text-shadow:0_1px_2px_rgba(0,0,0,0.35)]">
                            {balloonsToStage} {UI.toNextIsland[locale]}
                        </div>
                    </div>

                    {/* lives */}
                    <div className="absolute top-28 xl:top-16 right-4 z-40 pointer-events-none flex gap-1.5">
                        {Array.from({ length: MAX_LIVES }).map((_, i) => (
                            <span
                                key={i}
                                className={`text-2xl transition-all duration-300 ${i < hud.lives ? "opacity-100 drop-shadow" : "opacity-25 grayscale scale-90"}`}
                            >
                                🎈
                            </span>
                        ))}
                    </div>

                    {/* altitude meter */}
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 z-40 pointer-events-none flex flex-col items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/80 [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]">{UI.alt[locale]}</span>
                        <div className="relative w-4 h-[34vh] rounded-full border-2 border-[#14344f] bg-gradient-to-t from-red-400 via-amber-200 to-sky-300 shadow-[0_3px_0_rgba(20,52,79,0.9)] overflow-visible">
                            <div
                                className={`absolute -left-[7px] w-7 h-7 rounded-full bg-white border-[3px] border-[#14344f] shadow flex items-center justify-center text-[11px] transition-all duration-100 ${hud.alt < 0.25 ? "animate-pulse !border-red-500" : ""}`}
                                style={{ bottom: `calc(${Math.max(0, Math.min(1, hud.alt)) * 100}% - 14px)` }}
                            >
                                🎈
                            </div>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/80 [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]">{UI.sea[locale]}</span>
                    </div>

                    {/* pause / quit */}
                    <div className="absolute top-4 right-4 z-40 flex gap-2 font-sans">
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

                    {/* crow warning */}
                    {hud.crow !== "none" && (
                        <div className="absolute top-40 xl:top-28 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
                            <div className={`px-5 py-2 rounded-full border-2 border-[#14344f] font-black text-sm tracking-widest shadow-[0_3px_0_rgba(20,52,79,0.9)] ${hud.crow === "tele" ? "bg-amber-300 text-[#7c2d12] animate-pulse" : "bg-red-500 text-white"}`}>
                                {hud.crow === "tele" ? `🐦 ${UI.crowIncoming[locale]}` : `🐦 ${UI.crowDiving[locale]}`}
                            </div>
                        </div>
                    )}

                    {/* keep typing nudge */}
                    {nudge && (
                        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
                            <div className="px-6 py-2 rounded-full bg-white/85 border-2 border-[#14344f] font-black text-lg text-[#14344f] shadow-[0_3px_0_rgba(20,52,79,0.9)] animate-pulse">
                                {UI.keepTyping[locale]}
                            </div>
                        </div>
                    )}

                    {/* countdown */}
                    {gameState === "PLAYING" && hud.phase === "countdown" && (
                        <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center font-sans">
                            <div className="flex flex-col items-center -mt-10">
                                <div className="px-6 py-2 bg-white/92 border-2 border-[#14344f] rounded-full font-black text-lg text-[#14344f] shadow-[0_3px_0_rgba(20,52,79,0.9)] mb-3 -rotate-1">
                                    {UI.typeGlowing[locale]}
                                </div>
                                <div key={countdownNum} className="text-8xl font-black text-white [text-shadow:0_5px_0_#14344f] sh-pop">
                                    {countdownNum > 0 ? countdownNum : UI.go[locale]}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* stage banner */}
                    {hud.stageBanner > 0 && (
                        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-40 pointer-events-none sh-rise">
                            <div className="px-8 py-4 rounded-3xl bg-emerald-400 border-4 border-[#14344f] shadow-[0_6px_0_#14344f] flex flex-col items-center -rotate-1">
                                <span className="text-2xl font-black text-white">🏝️ {UI.stage[locale]} {hud.stage + 1}!</span>
                                <span className="text-xs font-black text-white/90 tracking-wide">
                                    {palName} · {UI.stageUpNote[locale]}
                                    {hud.stage % LIFE_EVERY === 0 ? ` · ${UI.extraBalloon[locale]}` : ""}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* splash banner */}
                    {hud.phase === "splash" && (
                        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
                            <div className="px-8 py-4 rounded-3xl bg-red-400 border-4 border-[#14344f] shadow-[0_6px_0_#14344f] flex flex-col items-center -rotate-1 sh-pop">
                                <span className="text-2xl font-black text-white">💦 {UI.splash[locale]}</span>
                                <span className="text-xs font-black text-white/90 tracking-wide">
                                    {hud.lives - 1 > 0 ? UI.balloonsLeft[locale](hud.lives - 1) : UI.lastBalloonGone[locale]}
                                </span>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ---------------- GAME OVER ---------------- */}
            {gameState === "GAME_OVER" && (
                <div className="absolute inset-0 z-50 bg-[#0c2438]/70 backdrop-blur-sm flex items-center justify-center font-sans">
                    <div className="w-[420px] max-w-[92%] bg-[#f2fbff] rounded-[28px] border-4 border-[#14344f] shadow-[0_10px_0_#14344f,0_28px_60px_rgba(0,0,0,0.35)] p-8 flex flex-col items-center sh-rise">
                        <h1 className="text-3xl font-black tracking-tight text-[#14344f] mb-1">💦 {UI.gameOver[locale]}</h1>
                        <p className="text-sm font-bold text-[#5d87a5] mb-4 text-center">
                            {hud.hops > 0
                                ? UI.gameOverNote[locale](hud.hops, hud.stage + 1)
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
                                { label: UI.balloons[locale], value: String(hud.hops), tint: "bg-lime-200" },
                                { label: UI.streak[locale], value: `×${hud.bestCombo}`, tint: "bg-orange-200" },
                                { label: UI.gold[locale], value: String(hud.gold), tint: "bg-yellow-200" },
                                { label: UI.crows[locale], value: String(hud.dodged), tint: "bg-teal-200" },
                            ].map((s) => (
                                <div key={s.label} className={`flex flex-col items-center ${s.tint} border-2 border-[#14344f] rounded-2xl px-2 py-3 shadow-[0_3px_0_#14344f]`}>
                                    <span className="font-mono text-lg font-black text-[#14344f]">{s.value}</span>
                                    <span className="text-[9px] uppercase tracking-widest text-[#14344f]/60 font-black mt-0.5">{s.label}</span>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => startGame(difficulty)}
                            className="w-full py-3.5 bg-emerald-500 text-white font-black text-sm tracking-wide rounded-2xl border-2 border-b-[6px] border-[#14344f] [text-shadow:0_1px_0_rgba(20,52,79,0.4)] hover:-translate-y-0.5 hover:brightness-110 active:translate-y-1 active:border-b-2 transition-all"
                        >
                            {UI.flyAgain[locale]} <span className="text-white/80 font-mono text-xs ml-1">Enter ↵</span>
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
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0c2438]/45 backdrop-blur-[2px] font-sans">
                    <div className="w-[400px] max-w-[92%] bg-[#f2fbff] rounded-[28px] border-4 border-[#14344f] shadow-[0_10px_0_#14344f,0_28px_60px_rgba(0,0,0,0.35)] p-7 relative flex flex-col items-center sh-rise">
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

                        <div className="sh-float">
                            <Mascot mood={gameState === "MENU" ? "happy" : "focused"} className="w-20 h-20 -mt-2 mb-1" />
                        </div>
                        <h2 className="text-3xl font-black tracking-tight text-[#14344f]">
                            {gameState === "MENU" ? <>Sky <span className="text-amber-500">Hop</span></> : UI.paused[locale]}
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
                                        ["EASY", "🌱", "bg-emerald-500", UI.easy[locale], UI.hintEasy[locale]],
                                        ["MEDIUM", "⚡", "bg-amber-500", UI.medium[locale], UI.hintMedium[locale]],
                                        ["HARD", "🔥", "bg-red-500", UI.hard[locale], UI.hintHard[locale]],
                                    ] as const).map(([diff, emoji, tint, label, hint]) => (
                                        <button
                                            key={diff}
                                            onClick={() => startGame(diff as Difficulty)}
                                            className={`w-full py-3 rounded-2xl border-2 border-b-[6px] border-[#14344f] ${tint} font-black text-sm tracking-widest text-white [text-shadow:0_1px_0_rgba(20,52,79,0.4)] hover:-translate-y-0.5 hover:brightness-110 active:translate-y-1 active:border-b-2 transition-all flex items-center justify-center gap-2.5`}
                                        >
                                            <span className="text-base [text-shadow:none]">{emoji}</span>
                                            {label}
                                            <span className="text-[10px] font-bold tracking-normal text-white/80 normal-case">{hint}</span>
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
