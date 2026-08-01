/* eslint-disable react-hooks/exhaustive-deps */
"use client";

// =========================================================================
// 👾 ALIEN DROP — 2D canvas typing game (no three.js, no image assets).
//
// Alien drop-pods fall out of an alien sky, each carrying ONE character on its
// porthole. Type the character and the hero's blaster snaps onto that pod and
// shoots it down. Let a pod reach the ground and it cracks open on the colony:
// the shield bar drops. Shield at zero ends the run.
//
// This is the app's only SINGLE-CHARACTER game — reaction and letter
// recognition rather than word flow — which is why it is the best possible
// feed for the per-key data in `lib/stats.ts`.
//
// Architecture (same contract as typing-ninja / rhino-dash / sky-hop /
// beam-break / tug-of-typing):
//   • ALL simulation state lives in `stateRef.current` (one mutable object)
//     and is mutated inside `step()` — never in React state.
//   • React state is only the ~20 Hz HUD snapshot + menu flags. Pods and their
//     characters are painted on the canvas straight from `stateRef`, so a
//     keystroke costs zero re-renders.
//   • One rAF loop runs the whole time the component is mounted: it always
//     draws (so the menu has a live backdrop that plays itself) and only
//     advances the simulation while PLAYING or in attract mode.
// =========================================================================

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocale, type Locale } from "@/lib/locale";
import { createStatsSession, recordAttempt, type StatsSession } from "@/lib/stats";
import { sfx } from "./sound";
import { draw, layoutFor, muzzleOf, drawPod, type Layout } from "./render";
import {
    AIM_EASE, BOLT_SPEED, DIFFICULTY_CONFIG, FACE_FLIP, IDLE_NUDGE, MAX_SHIELD,
    MEDIC_HEAL, NOVA_COMBO, NOVA_TIME, SWARM_EVERY, SWARM_SIZE,
    SWARM_WARN, WAVE_BONUS, WAVE_KILLS,
    addPopup, gapAt, getInitialState, paletteFor, podScore,
    resetRun, spawnBurst, spawnImpact, spawnMuzzle, spawnPod, spawnSparkle, wpmAt,
    type AlienDropState, type Difficulty, type PaletteKey, type Pod, type PodKind,
} from "./sim";

type GameState = "MENU" | "PLAYING" | "PAUSED" | "GAME_OVER";

const PARTICLE_GRAVITY: Record<string, number> = {
    spark: 420, shard: 700, smoke: -40, ring: 0, star: 380, ember: 520,
};

// ==========================================
// LOCALISED STRINGS (en/uz/ru) — the game keeps its own dict, like the other
// games. Keep the words short: the audience is school students.
// ==========================================

// The game's NAME stays English in every locale, like Sky Hop / Beam Break /
// Rhino Dash / Ninja Run — it is a brand, and the /games card prints it the
// same way. Everything else below is localised.
const UI = {
    tagline: {
        en: "Alien pods are falling on the colony! Each one carries a letter — type it and your hero shoots it down. Let one land and the shield breaks.",
        uz: "Kolloniyaga o'zga sayyoraliklar kapsulasi tushmoqda! Har birida bitta harf bor — uni yoz, qahramoning otib tushiradi. Yerga tushsa, qalqon buziladi.",
        ru: "На колонию падают капсулы пришельцев! На каждой одна буква — напечатай её, и герой собьёт капсулу. Упадёт хоть одна — щит слабеет.",
    },
    howTo: {
        en: "One key = one pod. Shoot the lowest one first — it is the one about to land.",
        uz: "Bitta tugma = bitta kapsula. Avval eng pastdagisini ot — u tushishga yaqin.",
        ru: "Одна клавиша = одна капсула. Сначала сбивай нижнюю — она вот-вот упадёт.",
    },
    novaHint: {
        en: "Fill the blue bar and press SPACE to clear the whole sky.",
        uz: "Ko'k chiziqni to'ldir va butun osmonni tozalash uchun SPACE bos.",
        ru: "Заполни синюю полосу и нажми SPACE, чтобы очистить всё небо.",
    },
    score: { en: "Score", uz: "Ball", ru: "Счёт" },
    best: { en: "Best", uz: "Rekord", ru: "Рекорд" },
    newRecord: { en: "New record!", uz: "Yangi rekord!", ru: "Новый рекорд!" },
    shield: { en: "Shield", uz: "Qalqon", ru: "Щит" },
    easy: { en: "EASY", uz: "OSON", ru: "ЛЕГКО" },
    medium: { en: "MEDIUM", uz: "O'RTA", ru: "СРЕДНЕ" },
    hard: { en: "HARD", uz: "QIYIN", ru: "СЛОЖНО" },
    hintEasy: {
        en: "home row only · slow pods",
        uz: "faqat o'rta qator · sekin kapsula",
        ru: "только домашний ряд · медленно",
    },
    hintMedium: {
        en: "whole alphabet · quicker pods",
        uz: "butun alifbo · tezroq kapsula",
        ru: "весь алфавит · быстрее",
    },
    hintHard: {
        en: "letters + numbers · fast pods",
        uz: "harflar + raqamlar · tez kapsula",
        ru: "буквы + цифры · очень быстро",
    },
    byWave: {
        en: (wpm: number) => `≈${wpm} WPM by wave 6`,
        uz: (wpm: number) => `6-to'lqinda ≈${wpm} WPM`,
        ru: (wpm: number) => `≈${wpm} WPM к волне 6`,
    },
    keysLabel: { en: "Keys", uz: "Tugmalar", ru: "Клавиши" },
    paused: { en: "Paused", uz: "To'xtatildi", ru: "Пауза" },
    continue: { en: "Continue", uz: "Davom etish", ru: "Продолжить" },
    restart: { en: "Restart", uz: "Boshidan", ru: "Заново" },
    menu: { en: "Menu", uz: "Menyu", ru: "Меню" },
    quit: { en: "Quit", uz: "Chiqish", ru: "Выйти" },
    moreGames: { en: "More games", uz: "Boshqa o'yinlar", ru: "Другие игры" },
    playAgain: { en: "Play again", uz: "Yana o'ynash", ru: "Играть снова" },
    acc: { en: "Acc", uz: "Aniq", ru: "Точн" },
    time: { en: "Time", uz: "Vaqt", ru: "Время" },
    wave: { en: "Wave", uz: "To'lqin", ru: "Волна" },
    pods: { en: "Pods", uz: "Kapsula", ru: "Капсулы" },
    streak: { en: "Streak", uz: "Ketma-ket", ru: "Серия" },
    leaked: { en: "Landed", uz: "Tushdi", ru: "Упало" },
    gold: { en: "Gold", uz: "Oltin", ru: "Золото" },
    novaStat: { en: "Novas", uz: "Nova", ru: "Новы" },
    getReady: { en: "Watch the sky!", uz: "Osmonga qara!", ru: "Смотри в небо!" },
    go: { en: "GO!", uz: "BOSHLA!", ru: "СТАРТ!" },
    swarmWarn: {
        en: "SWARM INBOUND!",
        uz: "TO'DA KELMOQDA!",
        ru: "ЛЕТИТ РОЙ!",
    },
    novaReady: {
        en: "NOVA READY — PRESS SPACE",
        uz: "NOVA TAYYOR — SPACE BOS",
        ru: "НОВА ГОТОВА — ЖМИ SPACE",
    },
    keepTyping: {
        en: "Type the letters!",
        uz: "Harflarni yoz!",
        ru: "Печатай буквы!",
    },
    waveNote: {
        en: "faster pods · shorter gaps",
        uz: "tezroq kapsula · qisqaroq tanaffus",
        ru: "быстрее капсулы · меньше пауза",
    },
    gameOver: { en: "Shield Down!", uz: "Qalqon sindi!", ru: "Щит пробит!" },
    gameOverNote: {
        en: (n: number, w: number) => `You shot down ${n} pods and reached wave ${w}.`,
        uz: (n: number, w: number) => `Sen ${n} kapsulani otding va ${w}-to'lqinga yetding.`,
        ru: (n: number, w: number) => `Ты сбил ${n} капсул и дошёл до волны ${w}.`,
    },
    gameOverZero: {
        en: "The first pods got straight through…",
        uz: "Birinchi kapsulalar o'tib ketdi…",
        ru: "Первые же капсулы прорвались…",
    },
    unmute: { en: "Unmute", uz: "Ovozni yoqish", ru: "Включить звук" },
    mute: { en: "Mute", uz: "Ovozni o'chirish", ru: "Выключить звук" },
    pause: { en: "Pause", uz: "To'xtatish", ru: "Пауза" },
    skies: {
        verdant: { en: "Green sky", uz: "Yashil osmon", ru: "Зелёное небо" },
        violet: { en: "Violet sky", uz: "Binafsha osmon", ru: "Фиолетовое небо" },
        amber: { en: "Amber sky", uz: "Qahrabo osmon", ru: "Янтарное небо" },
        azure: { en: "Blue sky", uz: "Ko'k osmon", ru: "Синее небо" },
        midnight: { en: "Night sky", uz: "Tungi osmon", ru: "Ночное небо" },
    } as Record<PaletteKey, { en: string; uz: string; ru: string }>,
};

// ==========================================
// SIMULATION STEP — the only writer of state
// ==========================================

interface StepApi {
    onDead: () => void;
    /** true while the player is actually playing (false in menu attract mode). */
    scoring: boolean;
}

/** Angle from the hero to a point, 0 = straight up, positive = to the right. */
function aimAt(L: Layout, x: number, y: number): number {
    return Math.atan2(x - L.heroX, (L.heroY - 62 * L.scale) - y);
}

/** The pod that is closest to the ground — the one that matters. */
function lowestPod(s: AlienDropState): Pod | null {
    let best: Pod | null = null;
    for (const p of s.pods) {
        if (p.state !== "fall") continue;
        if (!best || p.y > best.y) best = p;
    }
    return best;
}

/**
 * Fire the blaster at `pod`. The kill is already banked by the caller — the
 * bolt is pure theatre that catches up a beat later, which is what lets the
 * scoreboard react on the KEYSTROKE instead of on the impact.
 */
function fireAt(s: AlienDropState, pod: Pod, L: Layout, scoring: boolean) {
    const px = pod.x + Math.sin(pod.sway) * pod.swayAmp * 9;
    // the barrel snaps onto the target the instant the trigger is pulled
    s.hero.aim = aimAt(L, px, pod.y);
    s.hero.aimTarget = s.hero.aim;
    s.hero.recoil = 1;
    s.hero.hop = 1;

    const m = muzzleOf(s, L);
    const dx = px - m.x;
    const dy = pod.y - m.y;
    const dist = Math.max(1, Math.hypot(dx, dy));
    const speed = BOLT_SPEED * L.scale;
    const pal = paletteFor(s.wave);
    s.bolts.push({
        x: m.x, y: m.y,
        vx: (dx / dist) * speed, vy: (dy / dist) * speed,
        target: pod.id, life: 0, color: pal.beam, remain: dist,
    });
    spawnMuzzle(s, m.x, m.y, s.hero.aim, pal.beam, L.scale);
    // the menu backdrop plays itself, but it must never make noise behind a card
    if (scoring) sfx.playShot((px / L.W) * 2 - 1);
}

/** A tagged pod finally takes the bolt: burst, sound, and it leaves the array. */
function detonate(s: AlienDropState, pod: Pod, L: Layout, scoring: boolean) {
    const px = pod.x + Math.sin(pod.sway) * pod.swayAmp * 9;
    const color = pod.kind === "gold" ? "#ffd23f" : pod.kind === "medic" ? "#6de0c8" : "#ff8a3d";
    spawnBurst(s, px, pod.y, color, L.scale);
    s.flash = Math.max(s.flash, 0.6);
    if (scoring) sfx.playPop(s.combo, (px / L.W) * 2 - 1);
    if (pod.kind === "gold") {
        spawnSparkle(s, px, pod.y, L.scale);
        s.goldFlash = 1;
        if (scoring) sfx.playGold();
    }
    s.pods = s.pods.filter((p) => p.id !== pod.id);
}

function step(s: AlienDropState, dtRaw: number, L: Layout, api: StepApi) {
    const dt = Math.min(dtRaw, 0.1); // never let a tab-switch teleport the sim

    s.t += dt;

    // ---- decay the feel channels ----
    s.flash = Math.max(0, s.flash - dt * 4);
    s.errFlash = Math.max(0, s.errFlash - dt * 3.2);
    s.goldFlash = Math.max(0, s.goldFlash - dt * 2.2);
    s.healFlash = Math.max(0, s.healFlash - dt * 2);
    s.hurtFlash = Math.max(0, s.hurtFlash - dt * 1.8);
    s.waveBanner = Math.max(0, s.waveBanner - dt);
    s.trauma = Math.max(0, s.trauma - dt * 2.6);
    s.novaT = Math.max(0, s.novaT - dt);

    // ---- the hero's idle rig ----
    const h = s.hero;
    h.bob += dt * 2.4;
    h.recoil = Math.max(0, h.recoil - dt * 5.5);
    h.hop = Math.max(0, h.hop - dt * 6);
    h.hurt = Math.max(0, h.hurt - dt * 2);
    // a smooth blink roughly every 4.1 s, derived from the clock so it needs no
    // extra state and can never land twice in one frame
    h.blink = Math.max(0, 1 - Math.abs((s.t % 4.1) - 4.02) * 13);

    // between shots the barrel tracks whatever is lowest in the sky, so the
    // player's eye is pulled to the pod that is actually about to land
    const low = lowestPod(s);
    if (low) h.aimTarget = aimAt(L, low.x + Math.sin(low.sway) * low.swayAmp * 9, low.y);
    else h.aimTarget = 0;
    h.aim += (h.aimTarget - h.aim) * Math.min(1, dt * AIM_EASE);
    h.aim = Math.max(-1.28, Math.min(1.28, h.aim));
    h.lean += (Math.sin(h.aim) - h.lean) * Math.min(1, dt * 8);
    // turn to face whatever he is aiming at, with a deadzone so a pod near the
    // middle of the screen can't make him spin back and forth
    if (h.aim < -FACE_FLIP) h.face = -1;
    else if (h.aim > FACE_FLIP) h.face = 1;

    // ---- countdown ----
    if (s.phase === "countdown") {
        const before = Math.ceil(s.countdown);
        s.countdown -= dt;
        const after = Math.ceil(s.countdown);
        if (after !== before) sfx.playCountBeep(after <= 0);
        if (s.countdown <= 0) s.phase = "playing";
    }

    // ---- spawning ----
    if (s.phase === "playing") {
        s.runTimeMs += dt * 1000;
        s.idleT += dt;

        if (s.swarmWarn > 0) {
            // a swarm is telegraphed, then lands all at once across the sky
            s.swarmWarn -= dt;
            if (s.swarmWarn <= 0) {
                const lo = L.W * 0.13, hi = L.W * 0.87;
                for (let i = 0; i < SWARM_SIZE; i++) {
                    const x = lo + ((hi - lo) * i) / (SWARM_SIZE - 1);
                    spawnPod(s, L.W, L.scale, s.nextId, x);
                }
                s.swarmLeft = 0;
                s.spawnTimer = Math.max(s.spawnTimer, 1.6);
            }
        } else {
            s.spawnTimer -= dt;
            if (s.spawnTimer <= 0) {
                spawnPod(s, L.W, L.scale, s.nextId);
                s.spawnTimer = gapAt(s.cfg, s.wave, s.runTimeMs / 1000);
            }
        }
    } else if (s.phase === "idle") {
        // ---- attract mode: the menu backdrop plays itself ----
        s.spawnTimer -= dt;
        if (s.spawnTimer <= 0 && s.pods.length < 4) {
            spawnPod(s, L.W, L.scale, s.nextId);
            s.spawnTimer = 1.15;
        }
        // the hero shoots the lowest pod once it is comfortably on screen
        const target = lowestPod(s);
        if (target && target.y > L.groundY * 0.42 && s.bolts.length === 0) {
            target.state = "hit";
            target.deadT = 0;
            fireAt(s, target, L, false);
        }
    }

    // ---- pods fall, and accelerate as they go ----
    // Nothing is removed from `s.pods` inside this loop: kills are queued and
    // resolved afterwards, so the array is never mutated while it is iterated.
    const stuck: Pod[] = [];
    for (const pod of s.pods) {
        pod.born = Math.min(1, pod.born + dt * 5);
        pod.flap += dt * 7;
        if (pod.state !== "fall") {
            pod.deadT += dt;
            // Safety net: a tagged pod is waiting for a bolt. Every bolt resolves
            // within 1.2 s, but if one were ever lost (a resize mid-flight, a
            // frame the sim skipped) the pod would hang in the sky for ever.
            // Blow it up rather than leave a ghost.
            if (pod.deadT > 1.6 && pod.deadT < 90) stuck.push(pod);
            continue;
        }
        pod.sway += dt * 1.6;
        pod.vy = Math.min(pod.speed * 1.5, pod.vy + pod.speed * 0.34 * dt);
        pod.y += pod.vy * dt;

        if (!pod.warned && pod.y > L.dangerY) {
            pod.warned = true;
            if (s.phase === "playing") sfx.playWarn((pod.x / L.W) * 2 - 1);
        }

        if (pod.y >= L.groundY - L.podR * 0.5) {
            // it cracked open on the colony
            pod.state = "hit"; // filtered out below
            pod.deadT = 99;
            const px = pod.x + Math.sin(pod.sway) * pod.swayAmp * 9;
            spawnImpact(s, px, L.groundY, L.scale);
            if (api.scoring) {
                s.leaked++;
                s.combo = 0;
                s.shield = Math.max(0, s.shield - s.cfg.damage);
                s.trauma = 1;
                s.hurtFlash = 1;
                s.errFlash = 1;
                h.hurt = 1;
                sfx.playImpact((px / L.W) * 2 - 1);
                addPopup(s, {
                    x: px, y: L.groundY - 44 * L.scale,
                    text: `-${s.cfg.damage}`, color: "#ff6b6b",
                    life: 0, ttl: 0.9, big: 1,
                });
                if (s.shield <= 0) {
                    s.phase = "over";
                    sfx.stopAlarm();
                    api.onDead();
                }
            }
        }
    }
    for (const pod of stuck) detonate(s, pod, L, api.scoring);
    // drop everything that has landed (deadT 99 marks it)
    s.pods = s.pods.filter((p) => p.deadT < 90);

    // ---- bolts fly, then detonate on their target ----
    for (const b of s.bolts) {
        const stepLen = Math.hypot(b.vx, b.vy) * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.remain -= stepLen;
        b.life += dt;
    }
    const arrived = s.bolts.filter((b) => b.remain <= 0 || b.life > 1.2);
    for (const b of arrived) {
        const pod = s.pods.find((p) => p.id === b.target);
        if (pod) detonate(s, pod, L, api.scoring);
    }
    s.bolts = s.bolts.filter((b) => b.remain > 0 && b.life <= 1.2);

    // ---- particles ----
    for (const p of s.particles) {
        p.life += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += (PARTICLE_GRAVITY[p.kind] ?? 300) * dt;
        p.rot += p.vrot * dt;
        if (p.kind === "smoke" || p.kind === "spark") {
            const drag = 1 - Math.min(0.9, 3 * dt);
            p.vx *= drag;
            p.vy *= drag;
        }
    }
    s.particles = s.particles.filter((p) => p.life < p.ttl);

    // ---- popups float up and fade ----
    for (const p of s.popups) {
        p.life += dt;
        p.y -= dt * 46 * L.scale;
    }
    s.popups = s.popups.filter((p) => p.life < p.ttl);

    // ---- the siren: how close is the nearest pod to the ground? ----
    // It only opens up in the bottom part of the red zone (`SIREN_FROM`), so it
    // means "something is about to land", not "a pod exists". The single blip
    // when a pod first crosses the danger line is the other, separate signal.
    if (s.phase === "playing" && api.scoring) {
        let urgency = 0;
        for (const p of s.pods) {
            if (p.state !== "fall") continue;
            const u = (p.y - L.dangerY) / Math.max(1, L.groundY - L.dangerY);
            if (u > urgency) urgency = u;
        }
        const SIREN_FROM = 0.45;
        sfx.setAlarm(Math.max(0, Math.min(1, (urgency - SIREN_FROM) / (1 - SIREN_FROM))));
    } else {
        sfx.stopAlarm();
    }
}

/**
 * A pod was shot down by the player. Banked immediately on the keystroke: the
 * score, the streak, the wave counter and the nova charge all move now, and the
 * bolt catches up afterwards.
 */
function scoreKill(s: AlienDropState, pod: Pod, L: Layout) {
    const px = pod.x + Math.sin(pod.sway) * pod.swayAmp * 9;
    const gained = podScore(pod.kind, s.combo);
    s.score += gained;
    s.totalKilled++;
    s.killed++;
    s.combo++;
    s.bestCombo = Math.max(s.bestCombo, s.combo);

    addPopup(s, {
        x: px, y: pod.y - L.podR * 1.1,
        text: `+${gained}`,
        color: pod.kind === "gold" ? "#ffd23f" : "#ffffff",
        life: 0, ttl: 0.8, big: pod.kind === "gold" ? 1 : 0,
    });

    if (pod.kind === "gold") s.goldKills++;
    if (pod.kind === "medic") {
        s.medicKills++;
        s.shield = Math.min(MAX_SHIELD, s.shield + MEDIC_HEAL);
        s.healFlash = 1;
        sfx.playHeal();
        addPopup(s, {
            x: px, y: pod.y - L.podR * 2.1,
            text: `+${MEDIC_HEAL} ♥`, color: "#6de0c8",
            life: 0, ttl: 1, big: 1,
        });
    }

    // the nova meter
    const was = s.hero.charge;
    s.hero.charge = Math.min(1, s.hero.charge + 1 / NOVA_COMBO);
    if (was < 1 && s.hero.charge >= 1) sfx.playCharged();

    // ---- wave checkpoint ----
    if (s.killed >= WAVE_KILLS) {
        s.killed = 0;
        s.wave++;
        s.score += WAVE_BONUS;
        s.waveBanner = 2.4;
        sfx.playWave();
        // low, near the hero — the wave banner owns the middle of the screen
        addPopup(s, {
            x: L.heroX, y: L.groundY - 150 * L.scale,
            text: `+${WAVE_BONUS}`, color: "#8ef5c8",
            life: 0, ttl: 1.1, big: 1,
        });
        // every SWARM_EVERY waves the next one opens with a formation drop
        if (s.wave % SWARM_EVERY === 0 && s.wave >= s.cfg.swarmFrom) {
            s.swarmWarn = SWARM_WARN;
            sfx.playSwarm();
        }
    }
}

/** Spend a full charge: everything in the sky dies at once. */
function fireNova(s: AlienDropState, L: Layout) {
    if (s.hero.charge < 1 || s.phase !== "playing") return;
    s.hero.charge = 0;
    s.novaT = NOVA_TIME;
    s.novas++;
    s.trauma = 0.5;
    s.flash = 1;
    sfx.playNova();

    // EVERY pod goes, tagged ones included — a pod left behind with its bolt
    // deleted below would hang in the sky for ever. Only the live ones score.
    let gained = 0;
    for (const pod of s.pods) {
        const px = pod.x + Math.sin(pod.sway) * pod.swayAmp * 9;
        spawnBurst(s, px, pod.y, "#ffffff", L.scale);
        if (pod.state !== "fall") continue; // already paid for on the keystroke
        gained += Math.round(podScore(pod.kind, 0) / 2);
        if (pod.kind === "medic") {
            s.medicKills++;
            s.shield = Math.min(MAX_SHIELD, s.shield + MEDIC_HEAL);
            s.healFlash = 1;
        }
        if (pod.kind === "gold") s.goldKills++;
        s.totalKilled++;
        s.killed++;
    }
    s.score += gained;
    if (gained > 0) {
        addPopup(s, {
            x: L.heroX, y: L.groundY * 0.42,
            text: `+${gained}`, color: "#a8f5ff",
            life: 0, ttl: 1.1, big: 1,
        });
    }
    // a nova can carry you through a wave boundary too
    while (s.killed >= WAVE_KILLS) {
        s.killed -= WAVE_KILLS;
        s.wave++;
        s.score += WAVE_BONUS;
        s.waveBanner = 2.4;
    }
    s.pods = [];
    // every bolt was chasing a pod the nova just ate — nothing left to hit
    s.bolts = [];
}

// ==========================================
// SMALL CANVAS BADGE — one pod, drawn by the game's own painter so the menu
// can never show a pod that looks different from the real thing.
// ==========================================

function PodBadge({
    ch, kind = "normal", size = 46,
}: {
    ch: string;
    kind?: PodKind;
    size?: number;
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
        const pod: Pod = {
            id: 1, x: 0, y: 0, vy: 0, speed: 0, ch, kind, state: "fall",
            deadT: 0, sway: 0, swayAmp: 0, flap: 0.4, born: 1, warned: false,
        };
        drawPod(ctx, pod, size / 2, size * 0.54, size * 0.33, 0, 0, 0);
    }, [ch, kind, size]);
    return <canvas ref={ref} style={{ width: size, height: size }} className="block" />;
}

// ==========================================
// COMPONENT
// ==========================================

export default function AlienDropWorld() {
    const { locale } = useLocale();
    const [gameState, setGameState] = useState<GameState>("MENU");
    const [isMuted, setIsMuted] = useState(sfx.muted);
    const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
    const [hoverDiff, setHoverDiff] = useState<Difficulty | null>(null);
    const [hud, setHud] = useState({
        score: 0, shield: MAX_SHIELD, wave: 0, killed: 0, totalKilled: 0,
        combo: 0, bestCombo: 0, charge: 0, wpm: 0, accuracy: 100, timeMs: 0,
        leaked: 0, gold: 0, novas: 0, phase: "idle" as AlienDropState["phase"],
        countdown: 0, waveBanner: 0, swarmWarn: 0, idle: 0,
    });
    const [best, setBest] = useState(() => {
        try {
            return typeof window === "undefined"
                ? 0
                : Number(localStorage.getItem("tz-aliendrop-best") || 0);
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
        sfx.stopAlarm();
        sfx.playDefeat();
        setGameState("GAME_OVER");
    }, []);

    // ---------- the one rAF loop: always draws, steps while PLAYING or MENU ----------
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
                step(s, dt, L, { onDead: endRun, scoring: gs === "PLAYING" });
            }

            draw(ctx, s, w, h);

            // HUD snapshot at ~20 Hz (never per frame — see CLAUDE.md)
            hudAcc += dt;
            if (hudAcc >= 0.05) {
                hudAcc = 0;
                const minutes = s.runTimeMs / 60000;
                setHud({
                    score: s.score,
                    shield: s.shield,
                    wave: s.wave,
                    killed: s.killed,
                    totalKilled: s.totalKilled,
                    combo: s.combo,
                    bestCombo: s.bestCombo,
                    charge: s.hero.charge,
                    wpm: minutes > 0 ? Math.round(s.correctKeystrokes / 5 / minutes) : 0,
                    accuracy: s.totalKeystrokes > 0
                        ? Math.round((s.correctKeystrokes / s.totalKeystrokes) * 100)
                        : 100,
                    timeMs: s.runTimeMs,
                    leaked: s.leaked,
                    gold: s.goldKills,
                    novas: s.novas,
                    phase: s.phase,
                    countdown: s.countdown,
                    waveBanner: s.waveBanner,
                    swarmWarn: s.swarmWarn,
                    idle: s.idleT,
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
        sfx.stopAlarm();
        s.phase = "idle";
        s.pods = [];
        s.bolts = [];
        s.particles = [];
        s.popups = [];
        s.wave = 0;
        s.combo = 0;
        s.spawnTimer = 0.4;
        s.hero.charge = 0;
        s.shield = MAX_SHIELD;
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
            lessonId: "alien-drop",
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
        setIsNewRecord(s.score > 0 && s.score > best);
        if (s.score > best) {
            setBest(s.score);
            try {
                localStorage.setItem("tz-aliendrop-best", String(s.score));
            } catch { /* private mode */ }
        }
    }, [gameState]);

    // ---------- typing input ----------
    useEffect(() => {
        if (gameState !== "PLAYING") return;
        const onKey = (e: KeyboardEvent) => {
            const s = stateRef.current;
            if (s.phase !== "playing") return;
            if (e.ctrlKey || e.altKey || e.metaKey) return;

            const L = layoutFor(sizeRef.current.w, sizeRef.current.h);

            // SPACE fires the nova — pods never carry a space, so the key is free
            if (e.code === "Space") {
                e.preventDefault();
                fireNova(s, L);
                return;
            }
            if (e.key.length > 1) return;

            const char = e.key.toLowerCase();
            if (!s.cfg.keys.includes(char)) return; // a key this run never uses

            s.totalKeystrokes++;
            s.idleT = 0;

            // TARGETING: of every live pod showing this character, the LOWEST one
            // dies. That is the only fair rule when duplicates are on screen — the
            // player is always rewarded for clearing the most urgent pod.
            let target: Pod | null = null;
            for (const p of s.pods) {
                if (p.state !== "fall" || p.ch !== char) continue;
                if (!target || p.y > target.y) target = p;
            }

            if (target) {
                s.correctKeystrokes++;
                statsSession.current?.stroke(char, true);
                target.state = "hit";
                target.deadT = 0;
                scoreKill(s, target, L);
                fireAt(s, target, L, true);
            } else {
                // nothing up there carries that key. Costs the streak, nothing else:
                // this game punishes MISSED PODS, not wrong guesses, so a hunting
                // beginner is never put further behind than they already are.
                const low = lowestPod(s);
                statsSession.current?.stroke(low ? low.ch : char, false);
                s.combo = 0;
                s.errFlash = 1;
                sfx.playMiss();
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
                    sfx.stopAlarm();
                    sfx.audioCtx?.suspend();
                    setGameState("PAUSED");
                } else if (gameState === "PAUSED") {
                    sfx.resume();
                    setGameState("PLAYING");
                }
            } else if (e.key === "Enter") {
                if (gameState === "GAME_OVER" || gameState === "MENU") startGame(difficulty);
            } else if (gameState === "MENU" && (e.key === "1" || e.key === "2" || e.key === "3")) {
                startGame((["EASY", "MEDIUM", "HARD"] as const)[Number(e.key) - 1]);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [gameState, difficulty, startGame]);

    // Dev-only inspection hook: the whole game draws to a canvas, so the headless
    // browser driver in `.claude/skills/verify` has no DOM to read the live pods
    // from. Never exposed in a production build.
    useEffect(() => {
        if (process.env.NODE_ENV === "production") return;
        (window as unknown as { __alienDrop?: AlienDropState }).__alienDrop = stateRef.current;
        return () => {
            delete (window as unknown as { __alienDrop?: AlienDropState }).__alienDrop;
        };
    }, []);

    // ---------- cleanup ----------
    useEffect(() => {
        return () => {
            sfx.stopAlarm();
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
    const shieldPct = Math.max(0, Math.min(100, (hud.shield / MAX_SHIELD) * 100));
    const skyName = UI.skies[paletteFor(hud.wave).key][locale];
    const nudge = gameState === "PLAYING" && hud.phase === "playing"
        && hud.idle > IDLE_NUDGE && hud.totalKilled === 0;

    const diffRows = [
        ["EASY", "🌱", "bg-emerald-500", UI.easy[locale], UI.hintEasy[locale]],
        ["MEDIUM", "⚡", "bg-amber-500", UI.medium[locale], UI.hintMedium[locale]],
        ["HARD", "🔥", "bg-rose-500", UI.hard[locale], UI.hintHard[locale]],
    ] as const;

    // the menu previews the pod letters the hovered difficulty will actually use
    const previewDiff = hoverDiff ?? difficulty;
    const previewKeys = DIFFICULTY_CONFIG[previewDiff].keys;
    const previewSample = [0, 1, 2, 3].map(
        (i) => previewKeys[Math.floor((i * previewKeys.length) / 4)],
    );

    return (
        <div className="w-full h-full relative overflow-hidden">
            <style>{`
                @keyframes ad-pop { 0% { transform: scale(1.35) } 100% { transform: scale(1) } }
                .ad-pop { animation: ad-pop .2s ease-out; }
                @keyframes ad-rise { 0% { transform: translateY(16px); opacity: 0 } 100% { transform: translateY(0); opacity: 1 } }
                .ad-rise { animation: ad-rise .32s ease-out; }
                @keyframes ad-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
                .ad-float { animation: ad-float 3s ease-in-out infinite; }
                @keyframes ad-glow { 0%,100% { opacity: .55 } 50% { opacity: 1 } }
                .ad-glow { animation: ad-glow 1s ease-in-out infinite; }
                @keyframes ad-shake { 0%,100% { transform: translateX(0) } 25% { transform: translateX(-3px) } 75% { transform: translateX(3px) } }
                .ad-shake { animation: ad-shake .3s ease-in-out infinite; }
            `}</style>

            <canvas ref={canvasRef} className="absolute inset-0 block" />

            {/* ---------------- HUD ---------------- */}
            {(gameState === "PLAYING" || gameState === "PAUSED") && (
                <>
                    {/* Shield bar + score, the reference game's top-left stack. */}
                    <div className="absolute top-4 left-4 z-40 pointer-events-none font-sans">
                        <div className="flex items-center gap-2">
                            <span
                                className={`text-2xl drop-shadow-[0_2px_0_rgba(43,36,54,0.7)] ${shieldPct <= 30 ? "ad-glow" : ""}`}
                            >
                                ❤️
                            </span>
                            <div className="w-52 h-5 rounded-full border-[3px] border-[#2b2436] bg-[#3a2f2a] overflow-hidden shadow-[0_3px_0_rgba(43,36,54,0.9)]">
                                <div
                                    className={`h-full rounded-full transition-[width] duration-200 ${shieldPct <= 30 ? "bg-gradient-to-r from-rose-600 to-rose-400" : "bg-gradient-to-r from-orange-600 to-amber-400"}`}
                                    style={{ width: `${shieldPct}%` }}
                                />
                            </div>
                        </div>

                        <div className="mt-1.5 font-mono text-4xl font-black text-white tabular-nums [text-shadow:0_3px_0_#2b2436,0_0_14px_rgba(0,0,0,0.35)]">
                            {hud.score}
                        </div>

                        <div className="mt-1.5 flex items-center gap-1.5">
                            {/* wave chip, with how far through the wave you are drawn
                                straight into it — 12 pods clears a wave */}
                            <span className="relative overflow-hidden bg-white/90 border-2 border-[#2b2436] rounded-full px-2.5 py-0.5 text-[10px] font-black text-[#2b2436] shadow-[0_2px_0_rgba(43,36,54,0.85)]">
                                <span
                                    className="absolute inset-y-0 left-0 bg-emerald-300 transition-[width] duration-200"
                                    style={{ width: `${(hud.killed / WAVE_KILLS) * 100}%` }}
                                />
                                <span className="relative">{UI.wave[locale]} {hud.wave + 1}</span>
                            </span>
                            {hud.combo >= 3 && (
                                <span
                                    key={hud.combo}
                                    className="ad-pop bg-amber-300 border-2 border-[#2b2436] rounded-full px-2.5 py-0.5 text-[10px] font-black text-[#2b2436] shadow-[0_2px_0_rgba(43,36,54,0.85)]"
                                >
                                    ×{hud.combo}
                                </span>
                            )}
                            {best > 0 && (
                                <span className="bg-white/80 border-2 border-[#2b2436] rounded-full px-2.5 py-0.5 text-[10px] font-black text-[#2b2436] shadow-[0_2px_0_rgba(43,36,54,0.85)]">
                                    ★ {best}
                                </span>
                            )}
                        </div>
                    </div>

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
                                    sfx.stopAlarm();
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

                    {/* nova ready — the one call-to-action the canvas can't make itself */}
                    {hud.charge >= 1 && hud.phase === "playing" && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
                            <div className="px-6 py-2 rounded-full bg-cyan-300 border-[3px] border-[#2b2436] font-black text-sm tracking-widest text-[#2b2436] shadow-[0_4px_0_rgba(43,36,54,0.9)] ad-glow">
                                ✦ {UI.novaReady[locale]}
                            </div>
                        </div>
                    )}

                    {/* swarm warning */}
                    {hud.swarmWarn > 0 && (
                        <div className="absolute top-[9rem] left-1/2 -translate-x-1/2 z-40 pointer-events-none">
                            <div className="px-6 py-2 rounded-full bg-rose-500 border-[3px] border-[#2b2436] font-black text-sm tracking-widest text-white shadow-[0_4px_0_rgba(43,36,54,0.9)] ad-shake">
                                ⚠ {UI.swarmWarn[locale]}
                            </div>
                        </div>
                    )}

                    {/* first-run nudge */}
                    {nudge && (
                        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
                            <div className="px-6 py-2 rounded-full bg-white/90 border-2 border-[#2b2436] font-black text-lg text-[#2b2436] shadow-[0_3px_0_rgba(43,36,54,0.85)] ad-glow">
                                {UI.keepTyping[locale]}
                            </div>
                        </div>
                    )}

                    {/* countdown */}
                    {gameState === "PLAYING" && hud.phase === "countdown" && (
                        <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center font-sans">
                            <div className="flex flex-col items-center">
                                <div className="px-6 py-2 bg-white/92 border-[3px] border-[#2b2436] rounded-full font-black text-lg text-[#2b2436] shadow-[0_4px_0_rgba(43,36,54,0.9)] mb-3 -rotate-1">
                                    {UI.getReady[locale]}
                                </div>
                                <div key={countdownNum} className="text-8xl font-black text-white [text-shadow:0_5px_0_#2b2436] ad-pop">
                                    {countdownNum > 0 ? countdownNum : UI.go[locale]}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* wave banner */}
                    {hud.waveBanner > 0 && (
                        <div className="absolute top-[34%] left-1/2 -translate-x-1/2 z-40 pointer-events-none ad-rise">
                            <div className="px-7 py-3 rounded-3xl bg-[#8fd86a] border-4 border-[#2b2436] shadow-[0_6px_0_#2b2436] flex flex-col items-center -rotate-1">
                                <span className="text-2xl font-black text-[#2b2436]">
                                    👾 {UI.wave[locale]} {hud.wave + 1}!
                                </span>
                                <span className="text-[11px] font-black text-[#2b2436]/70 tracking-wide">
                                    {skyName} · {UI.waveNote[locale]}
                                </span>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ---------------- GAME OVER ---------------- */}
            {gameState === "GAME_OVER" && (
                <div className="absolute inset-0 z-50 bg-[#1a1424]/70 backdrop-blur-sm flex items-center justify-center font-sans p-4">
                    <div className="w-[430px] max-w-full bg-[#fdf6ec] rounded-[28px] border-4 border-[#2b2436] shadow-[0_10px_0_#2b2436,0_28px_60px_rgba(0,0,0,0.4)] p-7 flex flex-col items-center ad-rise">
                        <div className="flex items-center gap-2">
                            <PodBadge ch="!" size={42} />
                            <h1 className="text-3xl font-black tracking-tight text-[#2b2436]">
                                {UI.gameOver[locale]}
                            </h1>
                        </div>

                        {/* the score, huge — the reference game's one number */}
                        <div className="mt-3 mb-1 font-mono text-6xl font-black text-[#2b2436] tabular-nums leading-none">
                            {hud.score}
                        </div>
                        <p className="text-xs font-bold text-[#8b7f9c] mb-3 text-center">
                            {hud.totalKilled > 0
                                ? UI.gameOverNote[locale](hud.totalKilled, hud.wave + 1)
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
                                { label: UI.best[locale], value: String(best), tint: "bg-violet-200" },
                                { label: UI.wave[locale], value: String(hud.wave + 1), tint: "bg-lime-200" },
                                { label: UI.pods[locale], value: String(hud.totalKilled), tint: "bg-teal-200" },
                                { label: UI.streak[locale], value: `×${hud.bestCombo}`, tint: "bg-orange-200" },
                                { label: UI.gold[locale], value: String(hud.gold), tint: "bg-amber-200" },
                                { label: UI.leaked[locale], value: String(hud.leaked), tint: "bg-fuchsia-200" },
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
                    <div className="w-[440px] max-w-full bg-[#fdf6ec] rounded-[28px] border-4 border-[#2b2436] shadow-[0_10px_0_#2b2436,0_28px_60px_rgba(0,0,0,0.4)] p-7 relative flex flex-col items-center ad-rise">
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

                        {gameState === "MENU" ? (
                            <>
                                {/* the four pods the chosen difficulty will drop — this row
                                    changes as you hover a difficulty, so the menu answers
                                    "what keys will I be pressing?" before you commit */}
                                <div className="flex items-end gap-1 ad-float">
                                    {previewSample.map((ch, i) => (
                                        <div key={i} style={{ transform: `translateY(${(i % 2) * 7}px)` }}>
                                            <PodBadge
                                                ch={ch}
                                                kind={i === 1 ? "gold" : i === 3 ? "medic" : "normal"}
                                                size={i === 0 || i === 3 ? 44 : 52}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <h2 className="text-3xl font-black tracking-tight text-[#2b2436] mt-1">
                                    Alien <span className="text-[#e0592f]">Drop</span>
                                </h2>
                                <p className="text-sm font-medium text-[#8b7f9c] text-center leading-snug mt-2">
                                    {UI.tagline[locale]}
                                </p>
                                <p className="text-[11px] font-bold text-[#a89ab8] text-center mt-1.5">
                                    {UI.howTo[locale]}
                                </p>
                                <p className="text-[11px] font-bold text-[#3a9ec4] text-center mt-1">
                                    ✦ {UI.novaHint[locale]}
                                </p>
                                {best > 0 && (
                                    <p className="mt-2 px-3 py-1 bg-amber-300 border-2 border-[#2b2436] rounded-full text-xs font-black text-[#2b2436] rotate-1 shadow-[0_2px_0_#2b2436]">
                                        ★ {UI.best[locale]}: {best}
                                    </p>
                                )}
                            </>
                        ) : (
                            <h2 className="text-3xl font-black tracking-tight text-[#2b2436] mt-1">
                                {UI.paused[locale]}
                            </h2>
                        )}

                        <div className="flex flex-col gap-2.5 mt-4 w-full">
                            {gameState === "MENU" && (
                                <>
                                    {diffRows.map(([diff, emoji, tint, label, hint], i) => (
                                        <button
                                            key={diff}
                                            onClick={() => startGame(diff as Difficulty)}
                                            onMouseEnter={() => setHoverDiff(diff as Difficulty)}
                                            onMouseLeave={() => setHoverDiff(null)}
                                            onFocus={() => setHoverDiff(diff as Difficulty)}
                                            onBlur={() => setHoverDiff(null)}
                                            className={`w-full py-2.5 px-4 rounded-2xl border-2 border-b-[6px] border-[#2b2436] ${tint} text-white hover:-translate-y-0.5 hover:brightness-110 active:translate-y-1 active:border-b-2 transition-all flex items-center gap-3 text-left`}
                                        >
                                            <span className="text-lg">{emoji}</span>
                                            <span className="flex flex-col leading-tight flex-1">
                                                <span className="font-black text-sm tracking-widest">{label}</span>
                                                <span className="text-[10px] font-bold text-white/85">{hint}</span>
                                            </span>
                                            <span className="flex flex-col items-end gap-0.5">
                                                <span className="font-mono text-[10px] font-black text-white/90 bg-black/20 rounded-full px-2 py-0.5 whitespace-nowrap">
                                                    {UI.byWave[locale](wpmAt(DIFFICULTY_CONFIG[diff as Difficulty], 6))}
                                                </span>
                                                <span className="font-mono text-[9px] font-black text-white/60">
                                                    {i + 1}
                                                </span>
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

                        {gameState === "MENU" && (
                            <p className="mt-3 text-[10px] font-bold text-[#a89ab8] text-center">
                                {UI.keysLabel[locale]}:{" "}
                                <span className="font-mono text-[#2b2436]">
                                    {previewKeys.split("").join(" ").toUpperCase()}
                                </span>
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
