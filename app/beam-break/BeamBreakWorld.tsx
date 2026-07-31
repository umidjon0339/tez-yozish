/* eslint-disable react-hooks/exhaustive-deps */
"use client";

// =========================================================================
// 🛸 BEAM BREAK — 2D canvas typing game (no three.js, no image assets).
//
// A cute animal — a different one every run — is caught in a UFO's tractor
// beam. The beam pulls it up all the time; every correct key YANKS it back
// down and finishing a word breaks the grip and shoves the world forward.
// Score is the DISTANCE travelled. Let the beam win and the animal is
// swallowed: one of 3 lives. Endless, with a new level every 10 words.
//
// Architecture (same contract as typing-ninja / rhino-dash / sky-hop):
//   • ALL simulation state lives in `stateRef.current` (one mutable object)
//     and is mutated inside `step()` — never in React state.
//   • React state is only the ~20 Hz HUD snapshot + menu flags. The word and
//     its typed prefix are painted on the canvas straight from `stateRef`, so
//     a keystroke costs zero re-renders.
//   • One rAF loop runs the whole time the component is mounted: it always
//     draws (so the menu has a live backdrop that plays itself) and only
//     advances the simulation while PLAYING.
//   • NO SCREEN SHAKE and no vibration anywhere, by design. Impact reads as
//     eased colour, scale and glow. There is no music and no drone either —
//     every sound is a short one-shot, and rising danger is shown, not heard.
// =========================================================================

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocale, type Locale } from "@/lib/locale";
import { createStatsSession, recordAttempt, type StatsSession } from "@/lib/stats";
import { sfx } from "./sound";
import { draw, layoutFor, grabToY, ufoX, type Layout } from "./render";
import { drawAnimalHead } from "./animals";
import {
    GRAB_DAMPING, GRAB_RESPAWN, GRAB_STIFFNESS, GRAB_SUBSTEP, IDLE_NUDGE,
    IMMUNE_TIME, KPS_TAU, LIFE_EVERY, MAX_LIVES, MISS_PULL, PALETTES, PX_PER_M, SCROLL_EASE,
    SCROLL_MAX, SCROLL_MIN, SCROLL_PER_KPS, SNARE_FALL, SNARE_MAX, SNARE_MIN,
    SNARE_PULL, SNARE_TELE, SPECIES, WORDS_PER_LEVEL, WORD_SURGE,
    advanceWord, comboBonus, getInitialState, paletteFor, pullNow, resetRun,
    spawnDrift, spawnDust, spawnRingBurst, spawnShock, spawnSparkle, spawnYank,
    tierFor,
    type AnimalKey, type BeamBreakState, type Difficulty, type PaletteKey,
} from "./sim";

type GameState = "MENU" | "PLAYING" | "PAUSED" | "GAME_OVER";

const ABDUCT_TIME = 1.35; // seconds of the "swallowed" beat before the rescue
const MAX_DRIFTS = 9;
const PARTICLE_GRAVITY: Record<string, number> = {
    spark: 260, dust: -30, shard: 620, ring: 0, star: 340, leaf: 120,
};

// ==========================================
// LOCALISED STRINGS (en/uz/ru) — the game keeps its own dict, like the other
// games. Keep the words short: the audience is school students.
// ==========================================

// The game's NAME stays English in every locale, like Sky Hop / Rhino Dash /
// Ninja Run — it is a brand, and the /games card prints it the same way.
// Everything else below is localised.
const UI = {
    tagline: {
        en: "A UFO caught your animal friend! Every letter you type pulls it back down — stop typing and the saucer swallows it. Type fast to run far.",
        uz: "Uchar likopcha do'stingizni tutdi! Yozgan har bir harf uni pastga tortadi — yozishni to'xtatsang, likopcha uni yutib yuboradi. Tez yoz va uzoqqa yugur.",
        ru: "НЛО поймало твоего друга! Каждая буква тянет его вниз — перестанешь печатать, и тарелка его затянет. Печатай быстро, чтобы убежать далеко.",
    },
    howTo: {
        en: "Type the letters on the tiles. No need to fix mistakes — just keep going.",
        uz: "Plitkalardagi harflarni yoz. Xatoni tuzatish shart emas — davom et.",
        ru: "Печатай буквы на плитках. Ошибку исправлять не нужно — просто продолжай.",
    },
    distance: { en: "Distance", uz: "Masofa", ru: "Дистанция" },
    best: { en: "Best", uz: "Rekord", ru: "Рекорд" },
    newRecord: { en: "New record!", uz: "Yangi rekord!", ru: "Новый рекорд!" },
    easy: { en: "EASY", uz: "OSON", ru: "ЛЕГКО" },
    medium: { en: "MEDIUM", uz: "O'RTA", ru: "СРЕДНЕ" },
    hard: { en: "HARD", uz: "QIYIN", ru: "СЛОЖНО" },
    hintEasy: {
        en: "single letters · gentle beam",
        uz: "bitta harf · yumshoq nur",
        ru: "по одной букве · слабый луч",
    },
    hintMedium: {
        en: "short words · steady beam",
        uz: "qisqa so'zlar · o'rta nur",
        ru: "короткие слова · обычный луч",
    },
    hintHard: {
        en: "long words · strong beam",
        uz: "uzun so'zlar · kuchli nur",
        ru: "длинные слова · сильный луч",
    },
    toHold: {
        en: (wpm: number) => `≈${wpm} WPM to hold`,
        uz: (wpm: number) => `ushlash: ≈${wpm} WPM`,
        ru: (wpm: number) => `удержать: ≈${wpm} WPM`,
    },
    paused: { en: "Paused", uz: "To'xtatildi", ru: "Пауза" },
    continue: { en: "Continue", uz: "Davom etish", ru: "Продолжить" },
    restart: { en: "Restart", uz: "Boshidan", ru: "Заново" },
    menu: { en: "Menu", uz: "Menyu", ru: "Меню" },
    quit: { en: "Quit", uz: "Chiqish", ru: "Выйти" },
    moreGames: { en: "More games", uz: "Boshqa o'yinlar", ru: "Другие игры" },
    playAgain: { en: "Play again", uz: "Yana o'ynash", ru: "Играть снова" },
    score: { en: "Score", uz: "Ball", ru: "Счёт" },
    acc: { en: "Acc", uz: "Aniq", ru: "Точн" },
    time: { en: "Time", uz: "Vaqt", ru: "Время" },
    level: { en: "Level", uz: "Daraja", ru: "Уровень" },
    words: { en: "Words", uz: "So'zlar", ru: "Слова" },
    streak: { en: "Streak", uz: "Ketma-ket", ru: "Серия" },
    rings: { en: "Rings", uz: "Halqalar", ru: "Кольца" },
    typeToPull: {
        en: "Type to pull it down!",
        uz: "Pastga tortish uchun yoz!",
        ru: "Печатай, чтобы вытянуть его!",
    },
    go: { en: "GO!", uz: "BOSHLA!", ru: "СТАРТ!" },
    ringCharging: {
        en: "RING CHARGING — FINISH THE WORD!",
        uz: "HALQA TO'LMOQDA — SO'ZNI TUGAT!",
        ru: "КОЛЬЦО ЗАРЯЖАЕТСЯ — ЗАКОНЧИ СЛОВО!",
    },
    ringFalling: { en: "RING FALLING!", uz: "HALQA TUSHMOQDA!", ru: "КОЛЬЦО ПАДАЕТ!" },
    keepTyping: { en: "Keep typing!", uz: "Yozishda davom et!", ru: "Печатай дальше!" },
    levelUpNote: {
        en: "longer words · stronger beam",
        uz: "uzunroq so'zlar · kuchliroq nur",
        ru: "длиннее слова · сильнее луч",
    },
    extraLife: { en: "+1 life", uz: "+1 jon", ru: "+1 жизнь" },
    caught: { en: "Caught!", uz: "Tutildi!", ru: "Поймали!" },
    livesLeft: {
        en: (n: number) => `${n} ${n > 1 ? "lives" : "life"} left`,
        uz: (n: number) => `${n} jon qoldi`,
        ru: (n: number) => `осталось жизней: ${n}`,
    },
    lastLifeGone: {
        en: "that was the last one…",
        uz: "bu oxirgisi edi…",
        ru: "это была последняя…",
    },
    gameOver: { en: "Beamed Up!", uz: "Olib ketildi!", ru: "Забрали!" },
    gameOverNote: {
        en: (animal: string, m: number) => `The saucer took your ${animal} after ${m} m.`,
        uz: (animal: string, m: number) => `Likopcha ${m} m dan keyin ${animal}ni olib ketdi.`,
        ru: (animal: string, m: number) => `Тарелка забрала ${animal} через ${m} м.`,
    },
    gameOverZero: {
        en: "The beam won before you got moving…",
        uz: "Yugurishga ulgurmasdan nur yutdi…",
        ru: "Луч победил, не дав тебе разбежаться…",
    },
    rescuing: {
        en: (animal: string) => `Today you are rescuing a ${animal}`,
        uz: (animal: string) => `Bugun sen ${animal}ni qutqarasan`,
        ru: (animal: string) => `Сегодня ты спасаешь ${animal}`,
    },
    unmute: { en: "Unmute", uz: "Ovozni yoqish", ru: "Включить звук" },
    mute: { en: "Mute", uz: "Ovozni o'chirish", ru: "Выключить звук" },
    pause: { en: "Pause", uz: "To'xtatish", ru: "Пауза" },
    animals: {
        elephant: { en: "elephant", uz: "fil", ru: "слонёнка" },
        panda: { en: "panda", uz: "panda", ru: "панду" },
        fox: { en: "fox", uz: "tulki", ru: "лисёнка" },
        penguin: { en: "penguin", uz: "pingvin", ru: "пингвина" },
        hippo: { en: "hippo", uz: "gippopotam", ru: "гиппопотама" },
        koala: { en: "koala", uz: "koala", ru: "коалу" },
        piglet: { en: "piglet", uz: "cho'chqacha", ru: "поросёнка" },
        bunny: { en: "bunny", uz: "quyoncha", ru: "зайчика" },
        cat: { en: "cat", uz: "mushuk", ru: "котёнка" },
        turtle: { en: "turtle", uz: "toshbaqa", ru: "черепашку" },
    } as Record<AnimalKey, { en: string; uz: string; ru: string }>,
    skies: {
        dawn: { en: "Sunrise", uz: "Tong", ru: "Рассвет" },
        day: { en: "Daylight", uz: "Kunduz", ru: "День" },
        sunset: { en: "Sunset", uz: "Quyosh botishi", ru: "Закат" },
        dusk: { en: "Dusk", uz: "Shom", ru: "Сумерки" },
        night: { en: "Night", uz: "Tun", ru: "Ночь" },
        aurora: { en: "Aurora", uz: "Shafaq", ru: "Сияние" },
    } as Record<PaletteKey, { en: string; uz: string; ru: string }>,
};

// ==========================================
// SIMULATION STEP — the only writer of state
// ==========================================

interface StepApi {
    onAbductDone: () => void;
}

function step(s: BeamBreakState, dtRaw: number, L: Layout, api: StepApi) {
    const dt = Math.min(dtRaw, 0.1); // never let a tab-switch teleport the sim

    s.t += dt;

    // ---- decay the feel channels (all eased; none of them moves the camera) ----
    s.yank = Math.max(0, s.yank - dt * 3.4);
    s.errFlash = Math.max(0, s.errFlash - dt * 3.2);
    s.goldFlash = Math.max(0, s.goldFlash - dt * 2.2);
    s.freeFlash = Math.max(0, s.freeFlash - dt * 3.6);
    s.beamPulse = Math.max(0, s.beamPulse - dt * 2.6);
    s.levelBanner = Math.max(0, s.levelBanner - dt);
    s.alienT = Math.max(0, s.alienT - dt);
    s.rescueT = Math.max(0, s.rescueT - dt * 1.4);

    // panic eases toward the beam's grip — this is what the face reads
    const panicTarget = Math.max(0, Math.min(1, s.grab * 1.18));
    s.panic += (panicTarget - s.panic) * Math.min(1, dt * 5);

    // a smooth blink roughly every 3.7 s, derived from the clock so it needs no
    // extra state and can never land twice in one frame
    s.blink = Math.max(0, 1 - Math.abs((s.t % 3.7) - 3.62) * 13);

    // legs pedal harder the higher the beam has them
    s.kick += dt * (5.5 + s.panic * 7);

    if (s.phase === "countdown") {
        const before = Math.ceil(s.countdown);
        s.countdown -= dt;
        const after = Math.ceil(s.countdown);
        if (after !== before) sfx.playCountBeep(after <= 0);
        if (s.countdown <= 0) s.phase = "playing";
    }

    if (s.phase === "playing") {
        s.runTimeMs += dt * 1000;
        s.idleT += dt;
        s.wordAge += dt;
        if (s.immune > 0) s.immune = Math.max(0, s.immune - dt);

        // THE core equation: the beam wins unless you keep typing
        s.grabVel = pullNow(s);
        s.grab += s.grabVel * dt;

        if (s.grab >= 1) {
            s.grab = 1;
            s.phase = "abducted";
            s.abductT = 0;
            s.combo = 0;
            spawnShock(s, ufoX(s, L), L.ufoY + 20 * L.scale, "#ff9e7a");
            sfx.playAbduct();
        }

        stepSnare(s, dt);
    } else if (s.phase === "abducted") {
        s.abductT += dt;
        if (s.abductT >= ABDUCT_TIME) api.onAbductDone();
    } else if (s.phase === "idle") {
        // attract mode: the menu backdrop plays itself
        s.wordAge += dt;
        s.idleT += dt;
        s.grab = 0.32 + Math.sin(s.t * 0.6) * 0.14;
        if (s.idleT > 0.16) {
            s.idleT = 0;
            s.typed++;
            s.keyRate += 1 / KPS_TAU;
            s.yank = 1;
            if (s.typed >= s.word.length) {
                s.wordsTyped++;
                s.scrollV = Math.min(SCROLL_MAX, s.scrollV + WORD_SURGE * 0.6);
                advanceWord(s);
            }
        }
    }

    // ---- the visual position: a critically damped spring chasing the grip ----
    // `grab` steps instantly on every correct key; `grabView` is what the
    // renderer draws. Integrated in fixed sub-steps so a tab-switch `dt` can
    // never blow the spring up. See GRAB_STIFFNESS in `sim.ts` for why this is a
    // spring and not an exponential ease.
    let rem = dt;
    while (rem > 0) {
        const h = Math.min(rem, GRAB_SUBSTEP);
        const accel = (s.grab - s.grabView) * GRAB_STIFFNESS - s.grabVelView * GRAB_DAMPING;
        s.grabVelView += accel * h;
        s.grabView += s.grabVelView * h;
        rem -= h;
    }
    s.grabView = Math.max(0, Math.min(1, s.grabView));

    // ---- forward motion: scroll speed chases your sustained keys/sec ----
    s.keyRate *= Math.exp(-dt / KPS_TAU);
    const target = Math.min(SCROLL_MAX, SCROLL_MIN + s.keyRate * SCROLL_PER_KPS);
    s.scrollV += (target - s.scrollV) * Math.min(1, dt * SCROLL_EASE);
    // the saucer stops towing you along while it is busy swallowing
    const towing = s.phase === "abducted" ? 0.25 : 1;
    s.scrollPx += s.scrollV * towing * dt;
    if (s.phase === "playing") s.distance += (s.scrollV * towing * dt) / PX_PER_M;

    stepDrifts(s, dt, L);

    // ---- particles ----
    for (const p of s.particles) {
        p.life += dt;
        p.wx += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += (PARTICLE_GRAVITY[p.kind] ?? 300) * dt;
        p.rot += p.vrot * dt;
        if (p.kind === "dust" || p.kind === "spark") {
            const drag = 1 - Math.min(0.9, 3.2 * dt);
            p.vx *= drag;
            p.vy *= drag;
        }
    }
    s.particles = s.particles.filter((p) => p.life < p.ttl);

    // ---- drop level signs that have slid off the left edge ----
    s.signs = s.signs.filter((sg) => sg.wx - s.scrollPx > -140 * L.scale);
}

/** Ambient birds, kites and tumbleweed — pure scenery, no gameplay effect. */
function stepDrifts(s: BeamBreakState, dt: number, L: Layout) {
    for (const d of s.drifts) d.wx += d.vx * dt;
    s.drifts = s.drifts.filter((d) => d.wx - s.scrollPx > -180 * L.scale);

    if (s.drifts.length >= MAX_DRIFTS) return;
    // rates are per second, scaled by dt so they are frame-rate independent
    if (Math.random() < dt * 0.3) spawnDrift(s, "bird", L.W, L.H);
    if (Math.random() < dt * 0.16) spawnDrift(s, "kite", L.W, L.H);
    if (Math.random() < dt * 0.22) spawnDrift(s, "weed", L.W, L.H);
}

/**
 * The capture ring: the game's urgency beat. It charges at the emitter, then
 * slides down the beam. Finish the current word before it lands and it
 * shatters; let it land and the beam gets a big free pull.
 *
 * Deliberately a SLOW, telegraphed, purely visual threat — no jolt, no shake,
 * just a deadline you beat by typing faster.
 */
function stepSnare(s: BeamBreakState, dt: number) {
    if (!s.snare) {
        if (s.level < s.cfg.snareFrom) return;
        s.snareTimer -= dt;
        if (s.snareTimer <= 0) {
            const gap = SNARE_MAX - (SNARE_MAX - SNARE_MIN) * Math.min(1, s.level / 6);
            s.snareTimer = gap + Math.random() * 3;
            s.snare = { phase: "tele", t: 0, p: 0, flash: 0 };
            sfx.playSnareCharge();
        }
        return;
    }

    const sn = s.snare;
    sn.t += dt;

    if (sn.phase === "tele") {
        sn.p = 0;
        if (sn.t >= SNARE_TELE) {
            sn.phase = "fall";
            sn.t = 0;
        }
        return;
    }

    if (sn.phase === "fall") {
        sn.p = Math.min(1, sn.t / SNARE_FALL);
        if (sn.p >= 1) {
            sn.phase = "land";
            sn.t = 0;
            if (s.immune <= 0) {
                s.grab = Math.min(0.995, s.grab + SNARE_PULL);
                s.combo = 0;
                s.errFlash = 1;
                s.beamPulse = 1;
                sfx.playSnareHit();
            }
        }
        return;
    }

    if (sn.phase === "burst") {
        if (sn.t > 0.42) s.snare = null;
        return;
    }

    // land: hold the clamp on screen for a beat, then let go
    if (sn.t > 0.3) s.snare = null;
}

/**
 * A word was finished: the animal wrenches free, the world lurches forward and
 * the queue serves the next word. `scoring` is false in attract mode.
 */
function finishWord(s: BeamBreakState, L: Layout, scoring: boolean) {
    const bonus = comboBonus(s);
    const wasGold = s.gold;
    const len = s.word.length;

    // the big yank — the reward the whole game is built around
    s.grab = Math.max(0, s.grab - s.cfg.wordYank * (1 + bonus) * (wasGold ? 1.7 : 1));
    s.yank = 1;
    s.freeFlash = 1;
    s.beamPulse = 1;
    s.scrollV = Math.min(SCROLL_MAX, s.scrollV + WORD_SURGE);
    s.wordsTyped++;
    s.idleT = 0;

    if (scoring) {
        const y = grabToY(s, L);
        s.score += Math.round(len * 10 * (wasGold ? 2 : 1) * (1 + bonus));
        sfx.playFree(s.combo);
        spawnShock(s, L.animalX, y, "#b6ffd0");
        // feet back on the sand — kick up dust
        if (s.grab < 0.03) spawnDust(s, s.scrollPx + L.animalX, L.groundY, 10);

        if (wasGold) {
            s.goldWords++;
            s.goldFlash = 1;
            spawnSparkle(s, L.animalX, y, 18);
            sfx.playGold();
        }

        // a word landing in time shatters a charging / falling capture ring
        if (s.snare && (s.snare.phase === "tele" || s.snare.phase === "fall")) {
            s.snaresBroken++;
            s.score += 120;
            spawnRingBurst(s, ufoX(s, L), y, "#b6ffd0");
            s.snare.phase = "burst";
            s.snare.t = 0;
            sfx.playSnareBurst();
        }

        // level checkpoint
        if (s.wordsTyped % WORDS_PER_LEVEL === 0) {
            s.level++;
            s.palette = s.level % PALETTES.length;
            s.levelBanner = 2.6;
            s.alienT = 2.6;
            s.score += 250;
            s.signs.push({ wx: s.scrollPx + L.W + 120 * L.scale, level: s.level + 1 });
            if (s.level % LIFE_EVERY === 0 && s.lives < MAX_LIVES) s.lives++;
            sfx.playLevelUp();
        }
    }

    advanceWord(s);
}

// ==========================================
// SMALL CANVAS BADGE — shows WHICH animal is being rescued, in the HUD and on
// the cards. Same painter as the game, so it can never drift out of sync.
// ==========================================

function AnimalBadge({
    animal, size = 34, dim = false, panic = 0,
}: {
    animal: number;
    size?: number;
    dim?: boolean;
    panic?: number;
}) {
    const ref = useRef<HTMLCanvasElement | null>(null);
    useEffect(() => {
        const c = ref.current;
        if (!c) return;
        const dpr = Math.min(2, typeof window === "undefined" ? 1 : window.devicePixelRatio || 1);
        c.width = Math.round(size * dpr);
        c.height = Math.round(size * dpr);
        const ctx = c.getContext("2d");
        if (!ctx) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, size, size);
        drawAnimalHead(
            ctx, SPECIES[animal % SPECIES.length],
            size / 2, size * 0.58, size * 0.29, panic,
        );
    }, [animal, size, panic]);
    return (
        <canvas
            ref={ref}
            style={{ width: size, height: size }}
            className={`block transition-all duration-300 ${dim ? "opacity-25 grayscale scale-90" : "opacity-100"}`}
        />
    );
}

// ==========================================
// COMPONENT
// ==========================================

export default function BeamBreakWorld() {
    const { locale } = useLocale();
    const [gameState, setGameState] = useState<GameState>("MENU");
    const [isMuted, setIsMuted] = useState(sfx.muted);
    const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
    const [hud, setHud] = useState({
        distance: 0, score: 0, wpm: 0, accuracy: 100, combo: 0, bestCombo: 0,
        grab: 0.34, lives: MAX_LIVES, level: 0, words: 0, gold: 0, rings: 0,
        phase: "idle" as BeamBreakState["phase"], countdown: 0, levelBanner: 0,
        idle: 0, snare: "none" as "none" | "tele" | "fall", immune: 0, tier: 0,
        timeMs: 0, animal: 0,
    });
    const [best, setBest] = useState(() => {
        try {
            return typeof window === "undefined"
                ? 0
                : Number(localStorage.getItem("tz-beambreak-best") || 0);
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
        sfx.playDefeat();
        setGameState("GAME_OVER");
    }, []);

    // ---------- the one rAF loop: always draws, steps only while PLAYING ----------
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
            const loc = localeRef.current;

            if (gs === "PLAYING" || gs === "MENU") {
                step(s, dt, L, {
                    onAbductDone: () => {
                        s.abductT = 0;
                        s.lives--;
                        if (s.lives <= 0) {
                            s.phase = "over";
                            endRun();
                        } else {
                            // spat back out onto the sand, with a moment of grace
                            s.phase = "playing";
                            s.grab = GRAB_RESPAWN;
                            s.immune = IMMUNE_TIME;
                            s.typed = 0;
                            s.wordAge = 0;
                            s.rescueT = 1;
                            s.snare = null;
                            s.snareTimer = SNARE_MIN;
                            spawnDust(s, s.scrollPx + L.animalX, L.groundY, 12);
                            sfx.playRescue();
                        }
                    },
                });
            }

            draw(ctx, s, w, h, {
                level: `${UI.level[loc]} ${s.level + 1}`,
                levelNote: UI.skies[paletteFor(s.palette).key][loc],
            });

            // HUD snapshot at ~20 Hz (never per frame — see CLAUDE.md)
            hudAcc += dt;
            if (hudAcc >= 0.05) {
                hudAcc = 0;
                const minutes = s.runTimeMs / 60000;
                setHud({
                    distance: Math.floor(s.distance),
                    score: s.score,
                    wpm: minutes > 0 ? Math.round(s.correctKeystrokes / 5 / minutes) : 0,
                    accuracy: s.totalKeystrokes > 0
                        ? Math.round((s.correctKeystrokes / s.totalKeystrokes) * 100)
                        : 100,
                    combo: s.combo,
                    bestCombo: s.bestCombo,
                    grab: Math.round(s.grabView * 10) / 10,
                    lives: s.lives,
                    level: s.level,
                    words: s.wordsTyped,
                    gold: s.goldWords,
                    rings: s.snaresBroken,
                    phase: s.phase,
                    countdown: s.countdown,
                    levelBanner: s.levelBanner,
                    idle: s.idleT,
                    snare: s.snare && (s.snare.phase === "tele" || s.snare.phase === "fall")
                        ? s.snare.phase
                        : "none",
                    immune: s.immune,
                    tier: tierFor(s),
                    timeMs: s.runTimeMs,
                    animal: s.animal,
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
        // no music and no drone by design — every sound is a one-shot
    }, []);

    const backToMenu = useCallback(() => {
        const s = stateRef.current;
        s.phase = "idle";
        s.typed = 0;
        s.snare = null;
        s.particles = [];
        s.signs = [];
        s.level = 0;
        s.palette = 0;
        s.combo = 0;
        s.grab = 0.32;
        // re-roll the cast so the menu teases a different rescue each time
        s.animal = Math.floor(Math.random() * SPECIES.length);
        advanceWord(s);
        setGameState("MENU");
    }, []);

    // ---------- run ended: flush stats, log the attempt, update the record ----------
    useEffect(() => {
        if (gameState !== "GAME_OVER") return;
        statsSession.current?.end();
        statsSession.current = null;
        const s = stateRef.current;
        const minutes = s.runTimeMs / 60000;
        const wpm = minutes > 0 ? Math.round(s.correctKeystrokes / 5 / minutes) : 0;
        recordAttempt({
            lessonId: "beam-break",
            type: "game",
            wpm,
            accuracy: s.totalKeystrokes > 0
                ? Math.round((s.correctKeystrokes / s.totalKeystrokes) * 100)
                : 0,
            stars: 0,
            timeMs: Math.round(s.runTimeMs),
            errors: s.totalKeystrokes - s.correctKeystrokes,
            problemKeys: {},
        });
        const metres = Math.floor(s.distance);
        setIsNewRecord(metres > 0 && metres > best);
        if (metres > best) {
            setBest(metres);
            try {
                localStorage.setItem("tz-beambreak-best", String(metres));
            } catch { /* private mode */ }
        }
    }, [gameState]);

    // ---------- typing input ----------
    useEffect(() => {
        if (gameState !== "PLAYING") return;
        const onKey = (e: KeyboardEvent) => {
            const s = stateRef.current;
            if (s.phase !== "playing") return;
            if (e.ctrlKey || e.altKey || e.metaKey || e.key.length > 1) return;
            if (e.code === "Space") e.preventDefault();

            const L = layoutFor(sizeRef.current.w, sizeRef.current.h);
            const char = e.key.toLowerCase();
            const expected = s.word[s.typed]?.toLowerCase();
            if (!expected) return;

            s.totalKeystrokes++;
            s.idleT = 0;

            if (char === expected) {
                s.typed++;
                s.correctKeystrokes++;
                s.combo++;
                s.bestCombo = Math.max(s.bestCombo, s.combo);
                s.keyRate += 1 / KPS_TAU;
                statsSession.current?.stroke(char, true);

                // every correct key yanks the animal down — this is the core loop
                const bonus = comboBonus(s);
                const grounded = s.grab <= 0.001;
                s.grab = Math.max(0, s.grab - s.cfg.keyYank * (1 + bonus));
                s.yank = 1;
                s.beamPulse = Math.max(s.beamPulse, 0.5);
                // yank that would push past the ground pays out as score instead,
                // so typing faster than you need to is never wasted
                s.score += 5 + Math.min(10, Math.floor(s.combo / 5)) + (grounded ? 4 : 0);
                spawnYank(s, L.animalX, grabToY(s, L) + L.u * 1.4, "#b6ffd0", 3);
                sfx.playKey(s.typed / Math.max(1, s.word.length));

                if (s.typed >= s.word.length) finishWord(s, L, true);
            } else {
                // FLOW MODE: a typo costs you ground and the streak, but the word
                // does NOT need fixing — a struggling kid never gets stuck.
                statsSession.current?.stroke(expected, false);
                s.combo = 0;
                s.grab = Math.min(0.995, s.grab + MISS_PULL);
                s.errFlash = 1;
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
                if (gameState === "GAME_OVER" || gameState === "MENU") startGame(difficulty);
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
        (window as unknown as { __beamBreak?: BeamBreakState }).__beamBreak = stateRef.current;
        return () => {
            delete (window as unknown as { __beamBreak?: BeamBreakState }).__beamBreak;
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
        return secs >= 60
            ? `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`
            : `${secs}s`;
    };
    const countdownNum = Math.ceil(hud.countdown);
    const skyName = UI.skies[paletteFor(hud.level).key][locale];
    const animalName = UI.animals[SPECIES[hud.animal % SPECIES.length].key][locale];
    const nudge = gameState === "PLAYING" && hud.phase === "playing" && hud.idle > IDLE_NUDGE;

    const diffRows = [
        ["EASY", "🌱", "bg-emerald-500", UI.easy[locale], UI.hintEasy[locale], 12],
        ["MEDIUM", "⚡", "bg-amber-500", UI.medium[locale], UI.hintMedium[locale], 25],
        ["HARD", "🔥", "bg-rose-500", UI.hard[locale], UI.hintHard[locale], 35],
    ] as const;

    return (
        <div className="w-full h-full relative overflow-hidden">
            <style>{`
                @keyframes bb-pop { 0% { transform: scale(1.3) } 100% { transform: scale(1) } }
                .bb-pop { animation: bb-pop .2s ease-out; }
                @keyframes bb-rise { 0% { transform: translateY(16px); opacity: 0 } 100% { transform: translateY(0); opacity: 1 } }
                .bb-rise { animation: bb-rise .32s ease-out; }
                @keyframes bb-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-7px) } }
                .bb-float { animation: bb-float 3s ease-in-out infinite; }
                @keyframes bb-glow { 0%,100% { opacity: .55 } 50% { opacity: 1 } }
                .bb-glow { animation: bb-glow 1.4s ease-in-out infinite; }
            `}</style>

            <canvas ref={canvasRef} className="absolute inset-0 block" />

            {/* ---------------- HUD ---------------- */}
            {(gameState === "PLAYING" || gameState === "PAUSED") && (
                <>
                    {/* Distance and best distance, and nothing else. The in-run HUD is
                        deliberately this bare: the player's eyes belong on the tile row
                        and the animal, and WPM / accuracy / level all get their moment
                        on the game-over card instead. */}
                    <div className="absolute top-4 left-4 z-40 pointer-events-none font-sans">
                        <div className="bg-white/92 backdrop-blur border-[3px] border-[#2b2436] rounded-2xl px-4 py-2 shadow-[0_4px_0_rgba(43,36,54,0.9)] flex items-center gap-3">
                            <AnimalBadge animal={hud.animal} size={30} panic={hud.grab} />
                            <div className="flex flex-col leading-none">
                                <span className="text-[9px] font-black text-[#8b7f9c] uppercase tracking-[0.18em]">
                                    {UI.distance[locale]}
                                </span>
                                <span className="font-mono font-black text-2xl text-[#2b2436] tabular-nums">
                                    {hud.distance}
                                    <span className="text-sm text-[#8b7f9c] ml-0.5">m</span>
                                </span>
                            </div>
                        </div>

                        {best > 0 && (
                            <div className="mt-2 inline-flex items-center gap-1.5 bg-white/88 backdrop-blur border-2 border-[#2b2436] rounded-full px-3 py-1 shadow-[0_2px_0_rgba(43,36,54,0.85)]">
                                <span className="text-[9px]">★</span>
                                <span className="text-[9px] font-black text-[#8b7f9c] uppercase tracking-widest">
                                    {UI.best[locale]}
                                </span>
                                <span className="font-mono font-black text-xs text-[#2b2436]">{best}m</span>
                            </div>
                        )}
                    </div>

                    {/* lives, as heads of the animal you are saving — on a plate, so
                        they stay legible against a night sky as well as a bright one */}
                    <div className="absolute top-[4.4rem] right-4 z-40 pointer-events-none flex gap-0.5 bg-white/88 backdrop-blur border-2 border-[#2b2436] rounded-full px-2 py-1 shadow-[0_2px_0_rgba(43,36,54,0.85)]">
                        {Array.from({ length: MAX_LIVES }).map((_, i) => (
                            <AnimalBadge key={i} animal={hud.animal} size={28} dim={i >= hud.lives} />
                        ))}
                    </div>

                    {/* There is no beam meter: the animal's own height in the beam IS
                        the gauge, and the danger vignette plus the rising drone say the
                        rest. A second read-out of the same number was just clutter. */}

                    {/* mute / pause / quit */}
                    <div className="absolute top-4 right-4 z-40 flex gap-2 font-sans">
                        <button
                            title={isMuted ? UI.unmute[locale] : UI.mute[locale]}
                            onClick={() => setIsMuted(sfx.toggleMute())}
                            className="bg-white/92 backdrop-blur border-2 border-[#2b2436] text-[#2b2436] w-10 h-10 rounded-xl shadow-[0_3px_0_rgba(43,36,54,0.85)] hover:-translate-y-0.5 active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center"
                        >
                            {isMuted ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="22" y1="9" x2="16" y2="15" /><line x1="16" y1="9" x2="22" y2="15" /></svg>
                            ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
                            )}
                        </button>
                        <button
                            title={`${UI.pause[locale]} (Esc)`}
                            onClick={() => {
                                if (gameState === "PLAYING") {
                                    sfx.audioCtx?.suspend();
                                    setGameState("PAUSED");
                                }
                            }}
                            className="bg-white/92 backdrop-blur border-2 border-[#2b2436] text-[#2b2436] px-3.5 py-2 rounded-xl font-black text-sm shadow-[0_3px_0_rgba(43,36,54,0.85)] hover:-translate-y-0.5 active:translate-y-[3px] active:shadow-none transition-all flex items-center gap-2"
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                            Esc
                        </button>
                        <a
                            title={UI.quit[locale]}
                            href="/games"
                            className="bg-white/92 backdrop-blur border-2 border-[#2b2436] text-rose-500 px-3.5 py-2 rounded-xl font-black text-sm shadow-[0_3px_0_rgba(43,36,54,0.85)] hover:-translate-y-0.5 hover:bg-rose-50 active:translate-y-[3px] active:shadow-none transition-all flex items-center gap-2"
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            {UI.quit[locale]}
                        </a>
                    </div>

                    {/* capture-ring warning */}
                    {/* sits BELOW the canvas tile row (which ends around 11rem), so a
                        warning never hides the word you are racing it with */}
                    {hud.snare !== "none" && (
                        <div className="absolute top-[11.5rem] left-1/2 -translate-x-1/2 z-40 pointer-events-none">
                            <div className={`px-5 py-2 rounded-full border-2 border-[#2b2436] font-black text-xs tracking-widest shadow-[0_3px_0_rgba(43,36,54,0.85)] ${hud.snare === "tele" ? "bg-amber-300 text-[#7c4a12] bb-glow" : "bg-rose-500 text-white"}`}>
                                {hud.snare === "tele" ? `◎ ${UI.ringCharging[locale]}` : `◎ ${UI.ringFalling[locale]}`}
                            </div>
                        </div>
                    )}

                    {/* keep typing nudge */}
                    {nudge && (
                        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
                            <div className="px-6 py-2 rounded-full bg-white/88 border-2 border-[#2b2436] font-black text-lg text-[#2b2436] shadow-[0_3px_0_rgba(43,36,54,0.85)] bb-glow">
                                {UI.keepTyping[locale]}
                            </div>
                        </div>
                    )}

                    {/* countdown */}
                    {gameState === "PLAYING" && hud.phase === "countdown" && (
                        <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center font-sans">
                            <div className="flex flex-col items-center mt-24">
                                <div className="px-6 py-2 bg-white/92 border-[3px] border-[#2b2436] rounded-full font-black text-lg text-[#2b2436] shadow-[0_4px_0_rgba(43,36,54,0.9)] mb-3 -rotate-1">
                                    {UI.typeToPull[locale]}
                                </div>
                                <div key={countdownNum} className="text-8xl font-black text-white [text-shadow:0_5px_0_#2b2436] bb-pop">
                                    {countdownNum > 0 ? countdownNum : UI.go[locale]}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* level banner */}
                    {hud.levelBanner > 0 && (
                        <div className="absolute top-[38%] left-1/2 -translate-x-1/2 z-40 pointer-events-none bb-rise">
                            <div className="px-7 py-3 rounded-3xl bg-[#8fd86a] border-4 border-[#2b2436] shadow-[0_6px_0_#2b2436] flex flex-col items-center -rotate-1">
                                <span className="text-2xl font-black text-[#2b2436]">
                                    🛸 {UI.level[locale]} {hud.level + 1}!
                                </span>
                                <span className="text-[11px] font-black text-[#2b2436]/70 tracking-wide">
                                    {skyName} · {UI.levelUpNote[locale]}
                                    {hud.level % LIFE_EVERY === 0 ? ` · ${UI.extraLife[locale]}` : ""}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* caught banner */}
                    {hud.phase === "abducted" && (
                        <div className="absolute top-[38%] left-1/2 -translate-x-1/2 z-40 pointer-events-none">
                            <div className="px-7 py-3 rounded-3xl bg-rose-400 border-4 border-[#2b2436] shadow-[0_6px_0_#2b2436] flex flex-col items-center -rotate-1 bb-pop">
                                <span className="text-2xl font-black text-white">👽 {UI.caught[locale]}</span>
                                <span className="text-[11px] font-black text-white/90 tracking-wide">
                                    {hud.lives - 1 > 0
                                        ? UI.livesLeft[locale](hud.lives - 1)
                                        : UI.lastLifeGone[locale]}
                                </span>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ---------------- GAME OVER ---------------- */}
            {gameState === "GAME_OVER" && (
                <div className="absolute inset-0 z-50 bg-[#1a1424]/70 backdrop-blur-sm flex items-center justify-center font-sans p-4">
                    <div className="w-[430px] max-w-full bg-[#fdf6ec] rounded-[28px] border-4 border-[#2b2436] shadow-[0_10px_0_#2b2436,0_28px_60px_rgba(0,0,0,0.4)] p-7 flex flex-col items-center bb-rise">
                        <div className="flex items-center gap-2">
                            <AnimalBadge animal={hud.animal} size={44} panic={0.9} />
                            <h1 className="text-3xl font-black tracking-tight text-[#2b2436]">
                                {UI.gameOver[locale]}
                            </h1>
                        </div>

                        {/* the distance, huge — the reference game's one number */}
                        <div className="mt-3 mb-1 flex items-end gap-1">
                            <span className="font-mono text-6xl font-black text-[#2b2436] tabular-nums leading-none">
                                {hud.distance}
                            </span>
                            <span className="font-mono text-2xl font-black text-[#8b7f9c] leading-none mb-1">m</span>
                        </div>
                        <p className="text-xs font-bold text-[#8b7f9c] mb-3 text-center">
                            {hud.distance > 0
                                ? UI.gameOverNote[locale](animalName, hud.distance)
                                : UI.gameOverZero[locale]}
                        </p>
                        {isNewRecord && (
                            <p className="-mt-1 mb-3 px-3 py-1 bg-amber-300 border-2 border-[#2b2436] rounded-full text-xs font-black text-[#2b2436] -rotate-2 shadow-[0_2px_0_#2b2436]">
                                ★ {UI.newRecord[locale]}
                            </p>
                        )}

                        <div className="grid grid-cols-3 gap-2 w-full mb-5">
                            {[
                                { label: "WPM", value: String(hud.wpm), tint: "bg-sky-200" },
                                { label: UI.acc[locale], value: `${hud.accuracy}%`, tint: "bg-emerald-200" },
                                { label: UI.time[locale], value: fmtTime(hud.timeMs), tint: "bg-rose-200" },
                                { label: UI.score[locale], value: String(hud.score), tint: "bg-amber-200" },
                                { label: UI.best[locale], value: `${best}m`, tint: "bg-violet-200" },
                                { label: UI.level[locale], value: String(hud.level + 1), tint: "bg-lime-200" },
                                { label: UI.words[locale], value: String(hud.words), tint: "bg-teal-200" },
                                { label: UI.streak[locale], value: `×${hud.bestCombo}`, tint: "bg-orange-200" },
                                { label: UI.rings[locale], value: String(hud.rings), tint: "bg-fuchsia-200" },
                            ].map((st) => (
                                <div
                                    key={st.label}
                                    className={`flex flex-col items-center ${st.tint} border-2 border-[#2b2436] rounded-2xl px-2 py-2.5 shadow-[0_3px_0_#2b2436]`}
                                >
                                    <span className="font-mono text-base font-black text-[#2b2436]">{st.value}</span>
                                    <span className="text-[8px] uppercase tracking-widest text-[#2b2436]/60 font-black mt-0.5">
                                        {st.label}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* the reference game's two buttons */}
                        <div className="grid grid-cols-2 gap-3 w-full">
                            <button
                                onClick={() => startGame(difficulty)}
                                className="py-3.5 bg-[#3ec97a] text-white font-black text-sm tracking-wide rounded-2xl border-2 border-b-[6px] border-[#2b2436] hover:-translate-y-0.5 hover:brightness-110 active:translate-y-1 active:border-b-2 transition-all"
                            >
                                {UI.playAgain[locale]}
                                <span className="text-white/80 font-mono text-[10px] ml-1">↵</span>
                            </button>
                            <a
                                href="/games"
                                className="py-3.5 bg-[#fdf6ec] text-[#2b2436] font-black text-sm tracking-wide rounded-2xl border-2 border-b-[6px] border-[#2b2436] text-center hover:-translate-y-0.5 hover:brightness-105 active:translate-y-1 active:border-b-2 transition-all"
                            >
                                {UI.moreGames[locale]}
                            </a>
                        </div>

                        <button
                            onClick={backToMenu}
                            className="mt-4 text-sm font-bold text-[#8b7f9c] hover:text-[#2b2436] underline decoration-2 decoration-[#ded3c4] underline-offset-4 hover:decoration-amber-400 transition-colors"
                        >
                            {UI.menu[locale]}
                        </button>
                    </div>
                </div>
            )}

            {/* ---------------- MENU / PAUSED ---------------- */}
            {(gameState === "MENU" || gameState === "PAUSED") && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#1a1424]/45 backdrop-blur-[2px] font-sans p-4">
                    <div className="w-[420px] max-w-full bg-[#fdf6ec] rounded-[28px] border-4 border-[#2b2436] shadow-[0_10px_0_#2b2436,0_28px_60px_rgba(0,0,0,0.4)] p-7 relative flex flex-col items-center bb-rise">
                        <button
                            onClick={() => setIsMuted(sfx.toggleMute())}
                            title={isMuted ? UI.unmute[locale] : UI.mute[locale]}
                            className="absolute -top-3 -right-3 bg-[#fdf6ec] text-[#2b2436] border-2 border-[#2b2436] w-11 h-11 rounded-full shadow-[0_3px_0_#2b2436] hover:brightness-105 active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center z-10"
                        >
                            {isMuted ? (
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="22" y1="9" x2="16" y2="15" /><line x1="16" y1="9" x2="22" y2="15" /></svg>
                            ) : (
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
                            )}
                        </button>

                        <div className="bb-float">
                            <AnimalBadge animal={hud.animal} size={72} />
                        </div>
                        <h2 className="text-3xl font-black tracking-tight text-[#2b2436] mt-1">
                            {gameState === "MENU" ? (
                                <>Beam <span className="text-[#4bb36c]">Break</span></>
                            ) : (
                                UI.paused[locale]
                            )}
                        </h2>

                        {gameState === "MENU" && (
                            <>
                                <p className="text-sm font-medium text-[#8b7f9c] text-center leading-snug mt-2">
                                    {UI.tagline[locale]}
                                </p>
                                <p className="text-[11px] font-bold text-[#a89ab8] text-center mt-1.5">
                                    {UI.howTo[locale]}
                                </p>
                                <p className="mt-2.5 px-3 py-1 bg-[#e9f7dd] border-2 border-[#2b2436] rounded-full text-[11px] font-black text-[#2b2436] -rotate-1 shadow-[0_2px_0_#2b2436]">
                                    🐾 {UI.rescuing[locale](animalName)}
                                </p>
                                {best > 0 && (
                                    <p className="mt-2 px-3 py-1 bg-amber-300 border-2 border-[#2b2436] rounded-full text-xs font-black text-[#2b2436] rotate-1 shadow-[0_2px_0_#2b2436]">
                                        ★ {UI.best[locale]}: {best} m
                                    </p>
                                )}
                            </>
                        )}

                        <div className="flex flex-col gap-2.5 mt-4 w-full">
                            {gameState === "MENU" && (
                                <>
                                    {diffRows.map(([diff, emoji, tint, label, hint, wpm]) => (
                                        <button
                                            key={diff}
                                            onClick={() => startGame(diff as Difficulty)}
                                            className={`w-full py-2.5 px-4 rounded-2xl border-2 border-b-[6px] border-[#2b2436] ${tint} text-white hover:-translate-y-0.5 hover:brightness-110 active:translate-y-1 active:border-b-2 transition-all flex items-center gap-3 text-left`}
                                        >
                                            <span className="text-lg">{emoji}</span>
                                            <span className="flex flex-col leading-tight flex-1">
                                                <span className="font-black text-sm tracking-widest">{label}</span>
                                                <span className="text-[10px] font-bold text-white/85">{hint}</span>
                                            </span>
                                            <span className="font-mono text-[10px] font-black text-white/90 bg-black/20 rounded-full px-2 py-1 whitespace-nowrap">
                                                {UI.toHold[locale](wpm)}
                                            </span>
                                        </button>
                                    ))}
                                    <a
                                        href="/games"
                                        className="w-full py-3 rounded-2xl border-2 border-b-[6px] border-[#2b2436] bg-[#fdf6ec] text-rose-500 font-black text-sm tracking-wide text-center hover:-translate-y-0.5 hover:bg-rose-50 active:translate-y-1 active:border-b-2 transition-all"
                                    >
                                        {UI.quit[locale]}
                                    </a>
                                </>
                            )}

                            {gameState === "PAUSED" && (
                                <>
                                    <button
                                        onClick={() => {
                                            sfx.resume();
                                            setGameState("PLAYING");
                                        }}
                                        className="w-full py-3 rounded-2xl border-2 border-b-[6px] border-[#2b2436] bg-[#3ec97a] text-white font-black text-sm tracking-wide hover:-translate-y-0.5 hover:brightness-110 active:translate-y-1 active:border-b-2 transition-all"
                                    >
                                        {UI.continue[locale]}{" "}
                                        <span className="text-white/80 font-mono text-xs ml-1">Esc</span>
                                    </button>
                                    <button
                                        onClick={() => startGame(difficulty)}
                                        className="w-full py-3 rounded-2xl border-2 border-b-[6px] border-[#2b2436] bg-[#f2e7d6] text-[#2b2436] font-black text-sm tracking-wide hover:-translate-y-0.5 hover:brightness-105 active:translate-y-1 active:border-b-2 transition-all"
                                    >
                                        {UI.restart[locale]}
                                    </button>
                                    <button
                                        onClick={backToMenu}
                                        className="w-full py-3 rounded-2xl border-2 border-b-[6px] border-[#2b2436] bg-[#fdf6ec] text-[#2b2436] font-black text-sm tracking-wide hover:-translate-y-0.5 hover:brightness-105 active:translate-y-1 active:border-b-2 transition-all"
                                    >
                                        {UI.menu[locale]}
                                    </button>
                                    <a
                                        href="/games"
                                        className="w-full py-3 rounded-2xl border-2 border-b-[6px] border-[#2b2436] bg-[#fdf6ec] text-rose-500 font-black text-sm tracking-wide text-center hover:-translate-y-0.5 hover:bg-rose-50 active:translate-y-1 active:border-b-2 transition-all"
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
