/* eslint-disable react-hooks/exhaustive-deps */
"use client";

// =========================================================================
// 🔥 WORD FORGE — 2D canvas typing game (no three.js, no image assets).
//
// A top-down lane defence. Scrap-bots march at your gate and every one of them
// carries the thing you have to type — one key on EASY, a word after that.
// Nothing fires by itself: your keys are the trigger.
//
// SPACE switches between the two modes:
//   FIGHT   — keys go at the bots. First letter picks a target, the rest must
//             continue that bot's word, every correct key is one shot.
//   LOADOUT — keys go at the two menus beside the lane. The lane keeps moving
//             while you shop, which is what makes *when* to shop a decision.
//
// HEAT is the second engine: correct keys and kills stoke the forge, it decays
// when you stop, and it multiplies your damage. Typing faster is not a way to
// buy upgrades sooner — it is the damage itself.
//
// Architecture (same contract as the other games):
//   • ALL simulation state lives in `stateRef.current` (one mutable object)
//     and is mutated inside `step()` — never in React state.
//   • React state is only the ~20 Hz HUD snapshot + menu flags. Every word and
//     its typed prefix is painted from `stateRef`, so a keystroke costs zero
//     re-renders.
//   • One rAF loop runs the whole time the component is mounted.
// =========================================================================

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocale, type Locale } from "@/lib/locale";
import { createStatsSession, recordAttempt, type StatsSession } from "@/lib/stats";
import { sfx } from "./sound";
import { draw, drawTurret, layoutFor, muzzleOf, panelAnchor, type Layout } from "./render";
import {
    CHAIN_RANGE, DIFFICULTY_CONFIG, FORGED_AT, GATE_REACH, HEAT_DECAY,
    HEAT_PER_KEY, HEAT_PER_KILL, HEAT_PER_PANEL, MAX_BOTS, MAX_LEVEL,
    REPAIR_FRACTION, SLOW_TIME, TURRET_TURN, WAVE_BREAK,
    addPopup, buildRoster, costOf, defOf, getInitialState, menuMatch, payFor,
    refreshWord, resetAttract, resetRun, spawnBlast, spawnBot, spawnForgeBurst,
    spawnSparks, spawnWreck, turretStats, unlockFor, waveGap,
    type Bot, type Difficulty, type Shot, type WordForgeState,
} from "./sim";

type GameState = "MENU" | "PLAYING" | "PAUSED" | "GAME_OVER";

const PARTICLE_DRAG = 1.1;
/** Seconds between two FORGED celebrations — see `stoke()`. */
const FORGED_COOLDOWN = 14;
/** Half-width of a laser beam's hit test, in layout units. */
const BEAM_HALF_W = 10;
/** How far from the target SHOTGUN's spatter reaches, in layout units. */
const NEAR_RANGE = 130;

// ==========================================
// LOCALISED STRINGS (en/uz/ru). The game's NAME stays English in every locale,
// like Star Type / Beam Break / Sky Hop / Alien Drop — it is a brand. The
// WORDS THE PLAYER TYPES are English too: they are game content, not chrome.
// Keep it short: the audience is school students.
// ==========================================

const UI = {
    tagline: {
        en: "Every bot carries a word. Type it and your turret shoots that bot. Nothing fires by itself.",
        uz: "Har bir botda bitta so'z bor. Uni yozsang, minorang o'sha botni otadi. O'zi hech narsa otmaydi.",
        ru: "У каждого бота есть слово. Напечатай его — и турель выстрелит в этого бота. Сама она не стреляет.",
    },
    howTo1: {
        en: "Press SPACE to open your loadout. Then type a WEAPON name to take it, or a PERK name to buy it. SPACE again to go back to the fight.",
        uz: "Jihozni ochish uchun SPACE bos. Keyin QUROL nomini yozib olasan yoki KUCH nomini yozib sotib olasan. Yana SPACE — jangga qaytasan.",
        ru: "Нажми SPACE, чтобы открыть снаряжение. Потом напечатай название ОРУЖИЯ, чтобы взять его, или ПЕРКА, чтобы купить. SPACE ещё раз — назад в бой.",
    },
    howTo2: {
        en: "Bots keep walking while the loadout is open, so choose fast.",
        uz: "Jihoz ochiq turganda botlar yurishda davom etadi — tez tanla.",
        ru: "Пока снаряжение открыто, боты идут дальше — выбирай быстро.",
    },
    howTo3: {
        en: "Every key you land makes the forge hotter, and a hot forge hits harder.",
        uz: "Har bir to'g'ri tugma o'choqni qizdiradi, qizigan o'choq kuchliroq uradi.",
        ru: "Каждая верная клавиша раскаляет горн, а горячий горн бьёт сильнее.",
    },
    keysHint: {
        en: "SPACE opens the loadout · Backspace fixes a typo · Esc pauses",
        uz: "SPACE jihozni ochadi · Backspace xatoni tuzatadi · Esc to'xtatadi",
        ru: "SPACE открывает снаряжение · Backspace исправит · Esc пауза",
    },
    // the bar under the gate
    fightHint: {
        en: "type what a bot is carrying   ·   SPACE = loadout",
        uz: "botdagi so'zni yoz   ·   SPACE = jihoz",
        ru: "печатай то, что несёт бот   ·   SPACE = снаряжение",
    },
    loadoutHint: {
        en: "LOADOUT — type a name from the sides",
        uz: "JIHOZ — yonidagi nomlardan birini yoz",
        ru: "СНАРЯЖЕНИЕ — напечатай название сбоку",
    },
    matches: { en: "matches — keep typing", uz: "ta mos — davom et", ru: "совпадения — печатай дальше" },
    chooseSpeed: { en: "CHOOSE YOUR SHIFT", uz: "SMENANGNI TANLA", ru: "ВЫБЕРИ СМЕНУ" },
    easy: { en: "EASY", uz: "OSON", ru: "ЛЕГКО" },
    medium: { en: "MEDIUM", uz: "O'RTA", ru: "СРЕДНЕ" },
    hard: { en: "HARD", uz: "QIYIN", ru: "СЛОЖНО" },
    easyNote: {
        en: "Bots carry ONE key from the home row. The best place to start.",
        uz: "Botlar asosiy qatordan BITTA tugma olib keladi. Boshlash uchun eng yaxshisi.",
        ru: "Боты несут ОДНУ клавишу с домашнего ряда. Лучшее начало.",
    },
    mediumNote: {
        en: "Short words. The real fight.",
        uz: "Qisqa so'zlar. Asl jang.",
        ru: "Короткие слова. Настоящий бой.",
    },
    hardNote: {
        en: "Long words, fast bots, a thin gate.",
        uz: "Uzun so'zlar, tez botlar, nozik darvoza.",
        ru: "Длинные слова, быстрые боты, тонкие ворота.",
    },
    carryLabel: { en: "bots carry", uz: "botlarda", ru: "боты несут" },
    oneKey: { en: "1 key", uz: "1 tugma", ru: "1 клавиша" },
    letters: { en: "letters", uz: "harf", ru: "букв" },
    best: { en: "BEST", uz: "REKORD", ru: "РЕКОРД" },
    gateBroken: { en: "THE GATE IS DOWN", uz: "DARVOZA SINDI", ru: "ВОРОТА ПАЛИ" },
    youReached: { en: "YOU HELD", uz: "SEN USHLAB TURDING", ru: "ТЫ ПРОДЕРЖАЛСЯ" },
    waves: { en: "WAVES", uz: "TO'LQIN", ru: "ВОЛН" },
    kills: { en: "BOTS SCRAPPED", uz: "BOT YO'Q QILINDI", ru: "БОТОВ РАЗБИТО" },
    words: { en: "WORDS TYPED", uz: "SO'Z YOZILDI", ru: "СЛОВ НАПЕЧАТАНО" },
    speed: { en: "SPEED", uz: "TEZLIK", ru: "СКОРОСТЬ" },
    accuracy: { en: "ACCURACY", uz: "ANIQLIK", ru: "ТОЧНОСТЬ" },
    streak: { en: "LONGEST STREAK", uz: "ENG UZUN SERIYA", ru: "ЛУЧШАЯ СЕРИЯ" },
    newRecord: { en: "NEW RECORD", uz: "YANGI REKORD", ru: "НОВЫЙ РЕКОРД" },
    playAgain: { en: "play again", uz: "yana o'ynash", ru: "играть снова" },
    backToTitle: { en: "back to title", uz: "boshiga qaytish", ru: "в начало" },
    moreGames: { en: "more games", uz: "boshqa o'yinlar", ru: "другие игры" },
    paused: { en: "PAUSED", uz: "TO'XTATILDI", ru: "ПАУЗА" },
    resume: { en: "resume", uz: "davom etish", ru: "продолжить" },
    quit: { en: "quit", uz: "chiqish", ru: "выйти" },
    unmute: { en: "Unmute", uz: "Ovozni yoqish", ru: "Включить звук" },
    mute: { en: "Mute", uz: "Ovozni o'chirish", ru: "Выключить звук" },
    pause: { en: "Pause", uz: "To'xtatish", ru: "Пауза" },
    play: { en: "PLAY", uz: "BOSHLASH", ru: "ИГРАТЬ" },
    // in-canvas banners
    wave: { en: "WAVE", uz: "TO'LQIN", ru: "ВОЛНА" },
    bruteWave: { en: "BRUTE INCOMING", uz: "KATTA BOT KELMOQDA", ru: "ИДЁТ ГРОМИЛА" },
    newPanel: { en: "NEW", uz: "YANGI", ru: "НОВОЕ" },
    pressSpace: {
        en: "press SPACE to take it",
        uz: "olish uchun SPACE bos",
        ru: "нажми SPACE, чтобы взять",
    },
    forged: { en: "FORGED!", uz: "QIZIDI!", ru: "РАСКАЛЁН!" },
    forgedSub: {
        en: "the forge is white hot — you hit twice as hard",
        uz: "o'choq oqargan — zarbang ikki barobar",
        ru: "горн раскалён добела — урон вдвое больше",
    },
    equipped: { en: "EQUIPPED", uz: "OLINDI", ru: "ВЗЯТО" },
    need: { en: "NEED", uz: "KERAK", ru: "НУЖНО" },
    maxed: { en: "MAX", uz: "MAX", ru: "МАКС" },
};

// ==========================================
// SIMULATION STEP — the only writer of state
// ==========================================

interface StepApi {
    onGateBroken: () => void;
    /** true while the player is actually playing (false in menu attract mode). */
    scoring: boolean;
    locale: Locale;
}

function banner(s: WordForgeState, text: string, sub = "") {
    s.banner = text;
    s.bannerSub = sub;
    s.bannerT = 2.4;
}

/** Shortest signed angle from `a` to `b`. */
function angDiff(a: number, b: number) {
    let d = (b - a) % (Math.PI * 2);
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    return d;
}

function botById(s: WordForgeState, id: number): Bot | undefined {
    return s.bots.find((b) => b.id === id && b.deadT === 0);
}

/**
 * The bot a fresh keystroke should lock on to: of everything whose word starts
 * with `ch`, the one NEAREST THE GATE.
 *
 * `pickCarry` tries hard to keep initials unique, but on EASY there are only
 * nine keys and up to a dozen bots, so duplicates are unavoidable. "The one
 * about to reach you" is the only tie-break that never punishes a player for
 * playing correctly.
 */
function findTarget(s: WordForgeState, ch: string): Bot | null {
    let best: Bot | null = null;
    for (const b of s.bots) {
        if (b.deadT > 0 || b.born < 0.05) continue;
        if (b.word[0].toLowerCase() !== ch) continue;
        if (!best || b.y > best.y) best = b;
    }
    return best;
}

/** Whatever the barrel should be pointing at: the locked bot, else the leader. */
function aimTarget(s: WordForgeState): Bot | null {
    const locked = s.locked ? botById(s, s.locked) : undefined;
    if (locked) return locked;
    let best: Bot | null = null;
    for (const b of s.bots) {
        if (b.deadT > 0) continue;
        if (!best || b.y > best.y) best = b;
    }
    return best;
}

function killBot(s: WordForgeState, b: Bot, L: Layout, api: StepApi) {
    if (b.deadT > 0) return;
    b.deadT = 0.0001;
    if (s.locked === b.id) s.locked = 0;
    const big = b.kind === "tank" || b.kind === "brute";
    spawnWreck(s, b.x, b.y, b.r, L.scale, big);
    if (api.scoring) {
        s.kills++;
        s.heat = Math.min(1, s.heat + HEAT_PER_KILL);
        const pay = payFor(s, b.pay);
        s.scrap += pay;
        s.scrapEarned += pay;
        addPopup(s, {
            x: b.x, y: b.y, vy: 0, life: 0, ttl: 0.85,
            text: `+${pay}`, color: "#9ee88a", size: big ? 24 : 17,
        });
        if (b.kind === "brute") {
            s.flash = Math.max(s.flash, 0.7);
            s.trauma = Math.min(1, s.trauma + 0.45);
        }
    }
    // Attract mode is silent: the menu backdrop plays itself behind the title
    // card and must never beep over it.
    if (api.scoring) sfx.playKill((b.x / L.W) * 2 - 1, big);
}

function damageBot(s: WordForgeState, b: Bot, dmg: number, L: Layout, api: StepApi) {
    if (b.deadT > 0) return;
    b.hp -= dmg;
    b.hit = 1;
    if (dmg >= 20) {
        // BESIDE the bot, never above it: the word plate lives above every bot
        // now, and a damage number over the word you are reading is the one
        // popup that can actually cost you the round.
        addPopup(s, {
            x: b.x + b.r * 1.25, y: b.y, vy: 0, life: 0, ttl: 0.5,
            text: String(Math.round(dmg)), color: "#ffd08a", size: 14,
        });
    }
    if (b.hp <= 0) {
        killBot(s, b, L, api);
    } else if (b.typed >= b.word.length) {
        // It outlived its word. Give it a new one rather than leaving a word on
        // screen that "did not work".
        refreshWord(s, b);
    }
}

/** Splash: everything inside `radius` takes falling-off damage. */
function splashAt(
    s: WordForgeState, x: number, y: number, radius: number, dmg: number,
    L: Layout, api: StepApi, cold: boolean, skip: number[],
) {
    const r = radius * L.scale;
    spawnBlast(s, x, y, r, L.scale, cold);
    if (api.scoring) sfx.playBlast((x / L.W) * 2 - 1, cold);
    s.trauma = Math.min(1, s.trauma + 0.1);
    for (const b of s.bots) {
        if (b.deadT > 0 || skip.includes(b.id)) continue;
        const d = Math.hypot(b.x - x, b.y - y);
        if (d > r + b.r) continue;
        const falloff = 1 - Math.min(1, d / (r + b.r)) * 0.6;
        skip.push(b.id);
        if (cold) {
            b.slow = 0.55;
            b.slowT = SLOW_TIME;
        }
        damageBot(s, b, dmg * falloff, L, api);
    }
}

/** Everything a landed shot does at the point it arrives. */
function landShot(s: WordForgeState, sh: Shot, L: Layout, api: StepApi) {
    const target = botById(s, sh.target);
    if (target && !sh.hit.includes(target.id)) {
        sh.hit.push(target.id);
        if (sh.chill > 0) {
            target.slow = 1 - sh.chill;
            target.slowT = SLOW_TIME;
        }
        damageBot(s, target, sh.dmg, L, api);
    }
    spawnSparks(s, sh.x, sh.y, 5, L.scale, sh.forged ? "#fff3c4" : "#ffc46b");

    // SHOTGUN: spatter the nearest few bots around the target
    if (sh.near > 0) {
        const others = s.bots
            .filter((b) => b.deadT === 0 && !sh.hit.includes(b.id))
            .map((b) => ({ b, d: Math.hypot(b.x - sh.x, b.y - sh.y) }))
            .filter((o) => o.d <= NEAR_RANGE * L.scale)
            .sort((a, b) => a.d - b.d)
            .slice(0, sh.near);
        for (const o of others) {
            sh.hit.push(o.b.id);
            spawnSparks(s, o.b.x, o.b.y, 3, L.scale);
            damageBot(s, o.b, sh.dmg * sh.nearFrac, L, api);
        }
    }

    if (sh.splash > 0) {
        splashAt(s, sh.x, sh.y, sh.splash, sh.dmg * 0.7, L, api, sh.chill > 0, sh.hit);
    }

    // CHAIN: hop to the nearest bot this shot has not touched yet
    if (sh.chain > 0) {
        let next: Bot | null = null;
        let bestD = CHAIN_RANGE * L.scale;
        for (const o of s.bots) {
            if (o.deadT > 0 || sh.hit.includes(o.id)) continue;
            const d = Math.hypot(o.x - sh.x, o.y - sh.y);
            if (d < bestD) {
                bestD = d;
                next = o;
            }
        }
        if (next) {
            const sp = 1400 * L.scale;
            const dx = next.x - sh.x, dy = next.y - sh.y;
            const m = Math.max(1, Math.hypot(dx, dy));
            s.shots.push({
                x: sh.x, y: sh.y,
                vx: (dx / m) * sp, vy: (dy / m) * sp,
                dmg: sh.dmg * 0.75, life: 0, target: next.id, remain: m,
                pierce: 0, splash: 0, near: 0, nearFrac: 0,
                chain: sh.chain - 1, chill: sh.chill,
                kind: "bolt", forged: sh.forged, hit: [...sh.hit], r: sh.r * 0.8,
            });
        }
    }
}

/**
 * One keystroke's worth of shooting, aimed at `bot`.
 *
 * The projectile is theatre with real timing: damage lands when it arrives, not
 * when the key is pressed. What keeps that from feeling laggy is that the LOCK
 * is released the moment the word runs out, so the player is never waiting on a
 * bullet before they can start the next bot.
 */
function fireAt(s: WordForgeState, bot: Bot, L: Layout, api: StepApi) {
    const st = turretStats(s);
    const m = muzzleOf(L, s.aim);
    const forged = s.heat >= FORGED_AT;
    const dmg = st.dmg * (forged ? 1.35 : 1);
    const dx = bot.x - m.x;
    const dy = bot.y - m.y;
    const dist = Math.max(1, Math.hypot(dx, dy));

    s.recoil = 1;
    spawnSparks(s, m.x, m.y, forged ? 5 : 3, L.scale, forged ? "#fff3c4" : "#ffd08a");
    if (api.scoring) sfx.playShot(s.equipped, (m.x / L.W) * 2 - 1);

    if (st.shot === "beam") {
        // A beam lands at once: everything within a corridor to the target, and
        // on past it to the top of the lane.
        const ang = Math.atan2(dx, -dy);
        const len = L.H + 300 * L.scale;
        const ux = Math.sin(ang), uy = -Math.cos(ang);
        const halfW = BEAM_HALF_W * L.scale;
        const hit: number[] = [];
        for (const b of s.bots) {
            if (b.deadT > 0) continue;
            const vx = b.x - m.x, vy = b.y - m.y;
            const t = vx * ux + vy * uy;
            if (t < 0 || t > len) continue;
            if (Math.hypot(vx - ux * t, vy - uy * t) > b.r + halfW) continue;
            hit.push(b.id);
            if (st.chill > 0) {
                b.slow = 1 - st.chill;
                b.slowT = SLOW_TIME;
            }
            spawnSparks(s, b.x, b.y, 3, L.scale, "#ffd9e2");
            damageBot(s, b, b.id === bot.id ? dmg : dmg * 0.7, L, api);
        }
        if (st.splash > 0) splashAt(s, bot.x, bot.y, st.splash, dmg * 0.6, L, api, st.chill > 0, hit);
        s.beams.push({ x: m.x, y: m.y, ang, len, life: 0, ttl: 0.14, w: 4 * L.scale, forged });
        return;
    }

    const sp = st.speed * L.scale;
    s.shots.push({
        x: m.x, y: m.y,
        vx: (dx / dist) * sp, vy: (dy / dist) * sp,
        dmg, life: 0, target: bot.id, remain: dist,
        pierce: st.pierce + (forged ? 2 : 0),
        splash: st.splash,
        near: st.near, nearFrac: st.nearFrac,
        chain: st.chain,
        chill: st.chill,
        kind: st.shot,
        forged,
        hit: [],
        r: (st.shot === "orb" ? 7 : 3) * L.scale,
    });
}

function step(s: WordForgeState, dtRaw: number, L: Layout, api: StepApi) {
    const dt = Math.min(dtRaw, 0.1); // never let a tab-switch teleport the sim

    s.t += dt;
    s.recoil = Math.max(0, s.recoil - dt * 7);
    s.flash = Math.max(0, s.flash - dt * 2.6);
    s.hurtFlash = Math.max(0, s.hurtFlash - dt * 2.2);
    s.goldFlash = Math.max(0, s.goldFlash - dt * 1.6);
    s.trauma = Math.max(0, s.trauma - dt * 2.1);
    s.bufFlash = Math.max(0, s.bufFlash - dt * 3);
    s.modeT = Math.max(0, s.modeT - dt * 3);
    s.forgedT = Math.max(0, s.forgedT - dt);
    s.bannerT = Math.max(0, s.bannerT - dt);
    for (const p of s.panels) {
        p.flash = Math.max(0, p.flash - dt * 3.4);
        p.deny = Math.max(0, p.deny - dt * 2.6);
        p.fresh = Math.max(0, p.fresh - dt * 0.4);
    }

    // ---- the forge ----
    s.heat = Math.max(0, s.heat - HEAT_DECAY * dt);
    s.heatView += (s.heat - s.heatView) * Math.min(1, dt * 9);
    if (s.heat > 0.25 && Math.random() < dt * s.heat * 22) {
        spawnForgeBurst(s, L.turretX, L.turretY, L.scale, s.heat >= FORGED_AT, 4);
    }

    // ---- the wave pump ----
    if (s.phase === "intro") {
        s.introT -= dt;
        if (s.introT <= 0) {
            s.phase = "fighting";
            s.spawnTimer = 0;
        }
    } else if (s.phase === "fighting") {
        if (api.scoring) s.runTimeMs += dt * 1000;
        if (s.roster.length) {
            s.spawnTimer -= dt;
            if (s.spawnTimer <= 0 && s.bots.length < MAX_BOTS) {
                spawnBot(s, s.roster.shift()!, L.laneX0, L.laneW, L.scale);
                s.spawnTimer = waveGap(s.wave, s.cfg);
            }
        } else if (!s.bots.some((b) => b.deadT === 0)) {
            // wave cleared
            s.wave++;
            const opened = unlockFor(s, s.wave);
            s.roster = buildRoster(s.wave, s.cfg);
            s.phase = "intro";
            s.introT = WAVE_BREAK;
            const brute = s.roster.includes("brute");
            if (opened.length) {
                banner(
                    s,
                    `${UI.newPanel[api.locale]}: ${opened.map((d) => d.word).join("  ")}`,
                    UI.pressSpace[api.locale],
                );
                sfx.playUnlock();
            } else {
                banner(
                    s,
                    `${UI.wave[api.locale]} ${s.wave}`,
                    brute ? UI.bruteWave[api.locale] : "",
                );
            }
            sfx.playWave(brute);
        }
    } else if (s.phase === "attract") {
        // The menu backdrop plays itself, and it plays the REAL game: a ghost
        // typist works down the nearest bot's word, then every so often ducks
        // into the loadout and buys something — so the title screen shows both
        // modes without a word of explanation.
        s.spawnTimer -= dt;
        if (s.spawnTimer <= 0 && s.bots.length < 8) {
            const roll = Math.random();
            spawnBot(
                s, roll > 0.84 ? "tank" : roll > 0.5 ? "runner" : "grunt",
                L.laneX0, L.laneW, L.scale,
            );
            s.spawnTimer = 0.95;
        }
        s.scrap = 9999; // the ghost typist never has to save up
        s.introT -= dt;
        if (s.introT <= 0) {
            s.introT = 0.11;
            if (s.mode === "loadout") {
                const open = s.panels.filter((p) => p.unlocked);
                // Once the ghost has maxed the board, wind it back — a menu left
                // open for minutes must not settle into a wall of MAX denials.
                if (open.every((p) => p.key === "repair" || p.level >= MAX_LEVEL)) {
                    for (const p of open) p.level = defOf(p.key).kind === "weapon" ? 1 : 0;
                }
                const mm = menuMatch(s, s.buf);
                if (!s.buf || mm.panels.length === 0) {
                    s.buf = defOf(open[Math.floor(Math.random() * open.length)].key).word[0];
                } else {
                    const word = defOf(mm.panels[0]).word;
                    s.buf = word.slice(0, s.buf.length + 1);
                    if (s.buf === word) {
                        applyPanel(s, mm.panels[0], L, api);
                        s.introT = 0.9;
                    }
                }
            } else {
                const bot = s.locked ? botById(s, s.locked) : null;
                if (bot) {
                    bot.typed++;
                    if (bot.typed >= bot.word.length) s.locked = 0;
                    fireAt(s, bot, L, api);
                    s.heat = Math.min(1, s.heat + HEAT_PER_KEY);
                } else {
                    const next = aimTarget(s);
                    if (next) s.locked = next.id;
                    // now and then, go shopping where the player can see it
                    if (!next && Math.random() < 0.4) {
                        s.mode = "loadout";
                        s.buf = "";
                        s.modeT = 1;
                        s.introT = 0.6;
                    }
                }
            }
        }
    }

    // ---- bots walk ----
    for (const b of s.bots) {
        b.born = Math.min(1, b.born + dt * 4);
        b.hit = Math.max(0, b.hit - dt * 5);
        b.refresh = Math.max(0, b.refresh - dt * 2.2);
        if (b.slowT > 0) b.slowT -= dt;
        if (b.deadT > 0) {
            b.deadT += dt;
            continue;
        }
        const spd = b.speed * (b.slowT > 0 ? b.slow : 1);
        b.wob += dt * (2 + spd / (10 * L.scale));
        b.y += spd * dt;
        // a lazy weave, so a wave is a crowd and not a column
        b.x += (b.aimX - b.x) * Math.min(1, dt * 1.4) + Math.sin(b.wob * 0.5) * spd * dt * 0.18;

        if (b.y >= L.gateY - GATE_REACH * L.scale) {
            const heavy = b.kind === "tank" || b.kind === "brute";
            if (api.scoring) {
                s.gate -= b.dmg;
                s.hurtFlash = Math.min(1, s.hurtFlash + (heavy ? 1 : 0.55));
                s.trauma = Math.min(1, s.trauma + (heavy ? 0.85 : 0.4));
                addPopup(s, {
                    x: b.x, y: L.gateY - 10 * L.scale, vy: 0, life: 0, ttl: 0.9,
                    text: `-${b.dmg}`, color: "#ff8878", size: heavy ? 26 : 19,
                });
                sfx.playGateHit(heavy);
            }
            spawnWreck(s, b.x, b.y, b.r, L.scale, heavy);
            b.deadT = 0.0001;
            if (s.locked === b.id) s.locked = 0;
            if (api.scoring && s.gate <= 0) {
                s.gate = 0;
                s.phase = "over";
                s.trauma = 1;
                sfx.playGameOver();
                api.onGateBroken();
            }
        }
    }
    s.bots = s.bots.filter((b) => b.deadT < 0.5);

    // ---- the barrel tracks whatever you are shooting at ----
    const target = aimTarget(s);
    if (target) {
        const want = Math.atan2(target.x - L.turretX, L.turretY - target.y);
        const d = angDiff(s.aim, want);
        const maxTurn = TURRET_TURN * dt;
        s.aim += Math.abs(d) <= maxTurn ? d : Math.sign(d) * maxTurn;
    } else {
        const d = angDiff(s.aim, 0);
        s.aim += d * Math.min(1, dt * 2.4);
    }

    // ---- shots fly, then land ----
    const landed: Shot[] = [];
    for (const sh of s.shots) {
        const stepLen = Math.hypot(sh.vx, sh.vy) * dt;
        sh.remain -= stepLen;
        sh.x += sh.vx * dt;
        sh.y += sh.vy * dt;
        sh.life += dt;
        // SNIPER: hurt anything it passes clean through on the way
        if (sh.pierce > 0) {
            for (const b of s.bots) {
                if (b.deadT > 0 || b.id === sh.target || sh.hit.includes(b.id)) continue;
                if (Math.hypot(b.x - sh.x, b.y - sh.y) > b.r + sh.r) continue;
                sh.hit.push(b.id);
                sh.pierce--;
                spawnSparks(s, b.x, b.y, 3, L.scale);
                damageBot(s, b, sh.dmg * 0.8, L, api);
                break;
            }
        }
        // The 1.4 s cap is the safety net: a shot whose target died the frame it
        // was fired must still resolve rather than fly for ever.
        if (sh.remain <= 0 || sh.life > 1.4) landed.push(sh);
    }
    if (landed.length) {
        s.shots = s.shots.filter((sh) => sh.remain > 0 && sh.life <= 1.4);
        for (const sh of landed) landShot(s, sh, L, api);
    }
    s.shots = s.shots.filter(
        (sh) => sh.y > -220 * L.scale && sh.y < L.H + 120 * L.scale
            && sh.x > -220 * L.scale && sh.x < L.W + 220 * L.scale,
    );

    // ---- beams ----
    for (const b of s.beams) b.life += dt;
    s.beams = s.beams.filter((b) => b.life < b.ttl);

    // ---- particles + popups ----
    for (const p of s.particles) {
        p.life += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += p.grav * dt;
        p.rot += p.spin * dt;
        const drag = 1 - Math.min(0.9, PARTICLE_DRAG * dt);
        p.vx *= drag;
        p.vy *= drag;
    }
    s.particles = s.particles.filter((p) => p.life < p.ttl);
    for (const p of s.popups) p.life += dt;
    s.popups = s.popups.filter((p) => p.life < p.ttl);
}

// ==========================================
// APPLYING A FINISHED MENU WORD
// ==========================================

function applyPanel(s: WordForgeState, key: string, L: Layout, api: StepApi) {
    const def = defOf(key);
    const st = s.panels.find((p) => p.key === key)!;
    const a = panelAnchor(L, def.kind, st.slot);
    const px = a.x + a.w / 2;
    // just above the plate: a popup over its middle covers the very word the
    // player is trying to read
    const py = a.y - 9 * L.scale;

    const wasForged = s.heat >= FORGED_AT;
    s.heat = Math.min(1, s.heat + HEAT_PER_PANEL);
    s.wordsTyped++;
    s.bufFlash = 1;
    s.buf = "";
    spawnForgeBurst(s, L.turretX, L.turretY, L.scale, s.heat >= FORGED_AT, 14);
    if (!wasForged && s.heat >= FORGED_AT) {
        s.goldFlash = 0.8;
        if (api.scoring && s.forgedT <= 0) {
            sfx.playForged();
            banner(s, UI.forged[api.locale], UI.forgedSub[api.locale]);
        }
        s.forgedT = FORGED_COOLDOWN;
    }

    // A weapon is always equipped by typing it — switching costs nothing, so
    // the player is never punished for reaching for the right tool.
    let did = false;
    if (def.kind === "weapon" && s.equipped !== key) {
        s.equipped = key;
        if (api.scoring) {
            sfx.playEquip();
            addPopup(s, {
                x: px, y: py, vy: 0, life: 0, ttl: 0.85,
                text: UI.equipped[api.locale], color: "#ffb03a", size: 15, fixed: true,
            });
        }
        did = true;
    }

    const cost = costOf(s, key);
    if (cost !== null && s.scrap >= cost) {
        s.scrap -= cost;
        st.level++;
        st.flash = 1;
        if ("action" in def && def.action === "repair") {
            const heal = Math.round(s.gateMax * REPAIR_FRACTION);
            s.gate = Math.min(s.gateMax, s.gate + heal);
            if (api.scoring) {
                sfx.playRepair();
                addPopup(s, {
                    x: px, y: py, vy: 0, life: 0, ttl: 1,
                    text: `+${heal}`, color: "#9ee88a", size: 20, fixed: true,
                });
            }
        } else if (api.scoring) {
            // The attract backdrop is a picture, not a read-out: its purchase
            // chatter would just pile text over the title card.
            sfx.playBuy(st.level);
            addPopup(s, {
                x: px, y: py, vy: 0, life: 0, ttl: 0.9,
                text: st.level >= MAX_LEVEL ? UI.maxed[api.locale] : `LV ${st.level}`,
                color: st.level >= MAX_LEVEL ? "#f5c518" : "#ffe4bd", size: 18, fixed: true,
            });
        }
    } else if (!did) {
        st.deny = 1;
        if (api.scoring) {
            sfx.playDeny();
            addPopup(s, {
                x: px, y: py, vy: 0, life: 0, ttl: 0.9,
                text: cost === null ? UI.maxed[api.locale] : `${UI.need[api.locale]} ${cost}`,
                color: cost === null ? "#f5c518" : "#ff8878", size: 15, fixed: true,
            });
        }
    }
}

// ==========================================
// SMALL CANVAS BADGE
// ==========================================

/**
 * The turret, drawn by the game's own painter so the menu can never show a
 * turret that looks different from the real thing.
 *
 * `scale` is deliberately size/225 and not something bigger: the fire pit
 * throws a glow disc of about `(26 + 16) × scale × 2.6`, and if that is wider
 * than the canvas its faded edge is clipped and the badge reads as an orange
 * SQUARE floating on the title screen.
 */
function TurretBadge({ size = 150 }: { size?: number }) {
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
        const s = getInitialState();
        const frame = (now: number) => {
            raf = requestAnimationFrame(frame);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, size, size);
            s.t = (now - t0) / 1000;
            s.heat = 0.55 + 0.45 * Math.abs(Math.sin(s.t * 0.6));
            s.heatView = s.heat;
            s.aim = Math.sin(s.t * 0.9) * 0.42;
            s.recoil = Math.max(0, 1 - ((s.t * 2.4) % 1) * 4);
            const L = layoutFor(size, size / 0.62);
            drawTurret(ctx, s, {
                ...L,
                turretX: size / 2,
                turretY: size * 0.56,
                scale: size / 225,
            });
        };
        raf = requestAnimationFrame(frame);
        return () => cancelAnimationFrame(raf);
    }, [size]);
    return <canvas ref={ref} style={{ width: size, height: size }} className="block" />;
}

/** One figure on the results card. */
function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-[11px] tracking-[0.2em] text-[#a08b78] font-semibold">{label}</span>
            <span className="text-3xl sm:text-4xl font-light text-[#ffb03a] tabular-nums leading-none">
                {value}
            </span>
            <span className="h-px bg-[#ffb03a]/35 mt-2" />
        </div>
    );
}

// ==========================================
// COMPONENT
// ==========================================

const DIFFS: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

export default function WordForgeWorld() {
    const { locale } = useLocale();
    const [gameState, setGameState] = useState<GameState>("MENU");
    const [isMuted, setIsMuted] = useState(sfx.muted);
    const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
    const [hud, setHud] = useState({
        wave: 1, kills: 0, words: 0, accuracy: 100, bestStreak: 0,
        scrapEarned: 0, timeMs: 0, correctKeys: 0,
    });
    const [best, setBest] = useState(() => {
        try {
            return typeof window === "undefined"
                ? 0
                : Number(localStorage.getItem("tz-wordforge-best") || 0);
        } catch {
            return 0;
        }
    });
    const [isNewRecord, setIsNewRecord] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [initState] = useState(() => {
        const s = getInitialState();
        resetAttract(s);
        return s;
    });
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
        setGameState("GAME_OVER");
        sfx.stopBed();
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
            const loc = localeRef.current;

            if (gs === "PLAYING" || gs === "MENU") {
                step(s, dt, L, { onGateBroken: endRun, scoring: gs === "PLAYING", locale: loc });
            }

            draw(ctx, s, w, h, menuMatch(s, s.buf), {
                fight: UI.fightHint[loc],
                loadout: UI.loadoutHint[loc],
                matches: UI.matches[loc],
            });

            // HUD snapshot at ~20 Hz (never per frame — see CLAUDE.md)
            hudAcc += dt;
            if (hudAcc >= 0.05) {
                hudAcc = 0;
                if (gs === "PLAYING") sfx.setHeat(s.heat);
                setHud({
                    wave: s.wave,
                    kills: s.kills,
                    words: s.wordsTyped,
                    accuracy: s.totalKeys > 0
                        ? Math.round((s.correctKeys / s.totalKeys) * 1000) / 10
                        : 100,
                    bestStreak: s.bestStreak,
                    scrapEarned: s.scrapEarned,
                    timeMs: s.runTimeMs,
                    correctKeys: s.correctKeys,
                });
            }
        };

        raf = requestAnimationFrame(frame);
        return () => cancelAnimationFrame(raf);
    }, [endRun]);

    // ---------- start / restart ----------
    const startGame = useCallback((d: Difficulty) => {
        sfx.init();
        sfx.resume();
        sfx.startBed();
        statsSession.current?.end();
        statsSession.current = createStatsSession();
        setDifficulty(d);
        setIsNewRecord(false);
        resetRun(stateRef.current, d);
        setGameState("PLAYING");
    }, []);

    const backToMenu = useCallback(() => {
        sfx.stopBed();
        resetAttract(stateRef.current);
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
            lessonId: "word-forge",
            type: "game",
            wpm,
            accuracy: s.totalKeys > 0 ? Math.round((s.correctKeys / s.totalKeys) * 100) : 0,
            stars: 0,
            timeMs: Math.round(s.runTimeMs),
            errors: s.totalKeys - s.correctKeys,
            problemKeys: {},
        });
        setIsNewRecord(s.wave > best);
        if (s.wave > best) {
            setBest(s.wave);
            try {
                localStorage.setItem("tz-wordforge-best", String(s.wave));
            } catch { /* private mode */ }
        }
    }, [gameState]);

    // ---------- typing input: the two modes ----------
    useEffect(() => {
        if (gameState !== "PLAYING") return;
        const onKey = (e: KeyboardEvent) => {
            const s = stateRef.current;
            // typing is live during the calm between waves too — that is when
            // you are meant to be shopping
            if (s.phase !== "fighting" && s.phase !== "intro") return;
            if (e.ctrlKey || e.altKey || e.metaKey) return;

            const L = layoutFor(sizeRef.current.w, sizeRef.current.h);
            const api: StepApi = {
                onGateBroken: endRun, scoring: true, locale: localeRef.current,
            };

            // SPACE is the mode switch, in both directions.
            if (e.key === " ") {
                e.preventDefault();
                s.mode = s.mode === "fight" ? "loadout" : "fight";
                s.buf = "";
                s.modeT = 1;
                sfx.playEquip();
                return;
            }

            if (s.mode === "loadout") {
                if (e.key === "Backspace") {
                    e.preventDefault();
                    s.buf = s.buf.slice(0, -1);
                    return;
                }
                if (e.key.length > 1) return;
                const ch = e.key.toUpperCase();
                if (ch < "A" || ch > "Z") return;

                const next = s.buf + ch;
                const m = menuMatch(s, next);
                s.totalKeys++;
                if (m.panels.length === 0) {
                    // Rejected. The buffer only ever grows on a key that keeps a
                    // name alive, so a typo can never strand you mid-word.
                    const cur = menuMatch(s, s.buf);
                    const expected = cur.ghost ? cur.ghost[s.buf.length] : ch;
                    s.streak = 0;
                    statsSession.current?.stroke((expected || ch).toLowerCase(), false);
                    sfx.playReject();
                    return;
                }
                s.buf = next;
                s.correctKeys++;
                s.streak++;
                s.bestStreak = Math.max(s.bestStreak, s.streak);
                statsSession.current?.stroke(ch.toLowerCase(), true);
                sfx.playKey(m.ghost ? next.length / m.ghost.length : 0.5);
                // No name is a prefix of another, so an exact match is final.
                if (m.exact) {
                    applyPanel(s, m.exact, L, api);
                    // straight back to the fight — that is where you want to be
                    s.mode = "fight";
                    s.modeT = 1;
                }
                return;
            }

            // ---- FIGHT ----
            if (e.key.length > 1) return;
            const ch = e.key.toLowerCase();
            if (ch < "a" || ch > "z") return;

            s.totalKeys++;
            let bot = s.locked ? botById(s, s.locked) : undefined;
            if (bot && bot.typed >= bot.word.length) {
                // its word ran out while a shot was still in the air
                s.locked = 0;
                bot = undefined;
            }

            if (!bot) {
                // NO LOCK: this key chooses a target. Only the FIRST letter of
                // what a bot is carrying can do that, and of the matches the one
                // nearest the gate wins.
                const t = findTarget(s, ch);
                if (!t) {
                    s.streak = 0;
                    statsSession.current?.stroke(ch, false);
                    sfx.playReject();
                    return;
                }
                s.locked = t.id;
                bot = t;
            } else if (bot.word[bot.typed].toLowerCase() !== ch) {
                // LOCKED: only the next letter counts. The lock is NOT dropped on
                // a mistake — hunting for the right key must not also cost you
                // the target you already committed to.
                s.streak = 0;
                statsSession.current?.stroke(bot.word[bot.typed].toLowerCase(), false);
                sfx.playReject();
                return;
            }

            // a hit: one key, one shot
            s.correctKeys++;
            s.streak++;
            s.bestStreak = Math.max(s.bestStreak, s.streak);
            s.heat = Math.min(1, s.heat + HEAT_PER_KEY);
            statsSession.current?.stroke(ch, true);
            sfx.playKey(bot.typed / Math.max(1, bot.word.length));
            bot.typed++;
            if (bot.typed >= bot.word.length) {
                // Release the lock NOW, before the shot lands, so the player is
                // never waiting on a bullet to start the next bot. If the bot
                // survives, `damageBot` gives it a fresh word.
                s.locked = 0;
                s.wordsTyped++;
                s.bufFlash = 1;
                const wasForged = s.heat >= FORGED_AT;
                if (!wasForged && s.heat >= FORGED_AT) s.goldFlash = 0.8;
            }
            fireAt(s, bot, L, api);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [gameState, endRun]);

    // ---------- control keys ----------
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                const s = stateRef.current;
                // Esc backs out of the loadout first; only then does it pause.
                if (gameState === "PLAYING" && s.mode === "loadout") {
                    s.mode = "fight";
                    s.buf = "";
                    s.modeT = 1;
                    return;
                }
                if (gameState === "PLAYING") {
                    sfx.stopBed();
                    sfx.audioCtx?.suspend();
                    setGameState("PAUSED");
                } else if (gameState === "PAUSED") {
                    sfx.resume();
                    sfx.startBed();
                    setGameState("PLAYING");
                }
            } else if (gameState === "MENU" || gameState === "GAME_OVER") {
                if (e.key === "1") startGame("EASY");
                else if (e.key === "2") startGame("MEDIUM");
                else if (e.key === "3") startGame("HARD");
                else if (e.key === "Enter") startGame(difficulty);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [gameState, startGame, difficulty]);

    // Dev-only inspection hook: the whole game draws to a canvas, so the
    // headless browser driver in `.claude/skills/verify` has no DOM to read the
    // live words from. Never exposed in a production build.
    useEffect(() => {
        if (process.env.NODE_ENV === "production") return;
        (window as unknown as { __wordForge?: WordForgeState }).__wordForge = stateRef.current;
        return () => {
            delete (window as unknown as { __wordForge?: WordForgeState }).__wordForge;
        };
    }, []);

    // ---------- cleanup ----------
    useEffect(() => {
        return () => {
            sfx.stopBed();
            sfx.audioCtx?.suspend();
            statsSession.current?.end();
        };
    }, []);

    const minutes = hud.timeMs / 60000;
    const wpm = minutes > 0 ? Math.round(hud.correctKeys / 5 / minutes) : 0;

    const diffNote = {
        EASY: UI.easyNote[locale],
        MEDIUM: UI.mediumNote[locale],
        HARD: UI.hardNote[locale],
    };
    const diffLabel = {
        EASY: UI.easy[locale],
        MEDIUM: UI.medium[locale],
        HARD: UI.hard[locale],
    };

    return (
        <div className="w-full h-full relative overflow-hidden">
            <style>{`
                @keyframes wf-fade { from { opacity: 0 } to { opacity: 1 } }
                .wf-fade { animation: wf-fade .45s ease-out both; }
                @keyframes wf-rise { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
                .wf-rise { animation: wf-rise .42s cubic-bezier(.2,.8,.3,1) both; }
                @keyframes wf-pulse { 0%,100% { opacity: .5 } 50% { opacity: 1 } }
                .wf-pulse { animation: wf-pulse 1.5s ease-in-out infinite; }
            `}</style>

            <canvas ref={canvasRef} className="absolute inset-0 block" />

            {/* ---------------- IN-RUN CHROME ----------------
                Everything the player needs while playing is painted on the
                canvas (gate bar, scrap, wave, the mode bar). Only the three
                buttons are DOM. */}
            {(gameState === "PLAYING" || gameState === "PAUSED") && (
                <div className="absolute top-4 left-4 z-40 flex gap-2 font-sans">
                    <button
                        title={`${UI.pause[locale]} (Esc)`}
                        onClick={() => {
                            if (gameState === "PLAYING") {
                                sfx.stopBed();
                                sfx.audioCtx?.suspend();
                                setGameState("PAUSED");
                            }
                        }}
                        className="w-9 h-9 rounded border border-[#ffb03a]/25 text-[#d9b993] hover:text-[#ffb03a] hover:border-[#ffb03a]/60 transition-colors flex items-center justify-center"
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                    </button>
                    <button
                        title={isMuted ? UI.unmute[locale] : UI.mute[locale]}
                        onClick={() => setIsMuted(sfx.toggleMute())}
                        className="w-9 h-9 rounded border border-[#ffb03a]/25 text-[#d9b993] hover:text-[#ffb03a] hover:border-[#ffb03a]/60 transition-colors flex items-center justify-center"
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
                        className="w-9 h-9 rounded border border-[#ffb03a]/25 text-[#d9b993] hover:text-[#ff8878] hover:border-[#ff8878]/60 transition-colors flex items-center justify-center"
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </a>
                </div>
            )}

            {/* ---------------- GAME OVER ---------------- */}
            {gameState === "GAME_OVER" && (
                <div className="absolute inset-0 z-50 bg-[#120c08]/85 backdrop-blur-[2px] flex flex-col items-center justify-center font-sans p-6 wf-fade">
                    <div className="w-full max-w-3xl wf-rise">
                        <p className="text-center text-[#ff8878] text-sm tracking-[0.32em] mb-1">
                            {UI.gateBroken[locale]}
                        </p>
                        <h2 className="text-center text-[#f3ece2] text-xs tracking-[0.28em] mb-9">
                            {UI.youReached[locale]} · {diffLabel[difficulty]}
                        </h2>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-9 gap-y-8">
                            <Stat label={UI.waves[locale]} value={String(hud.wave)} />
                            <Stat label={UI.kills[locale]} value={String(hud.kills)} />
                            <Stat label={UI.words[locale]} value={String(hud.words)} />
                            <Stat label={UI.speed[locale]} value={`${wpm} WPM`} />
                            <Stat label={UI.accuracy[locale]} value={`${hud.accuracy.toFixed(1)}%`} />
                            <Stat label={UI.streak[locale]} value={String(hud.bestStreak)} />
                        </div>

                        {isNewRecord && (
                            <p className="mt-8 text-center text-[#f5c518] text-sm tracking-[0.3em] wf-pulse">
                                ★ {UI.newRecord[locale]}
                            </p>
                        )}

                        <div className="mt-11 flex flex-wrap items-center justify-center gap-8">
                            <button
                                onClick={() => startGame(difficulty)}
                                className="text-[#ffb03a] text-xl hover:text-[#ffd08a] transition-colors"
                            >
                                {UI.playAgain[locale]}
                                <span className="text-[#a08b78] text-sm ml-2">↵</span>
                            </button>
                            <button
                                onClick={backToMenu}
                                className="text-[#a08b78] text-lg hover:text-[#ffb03a] transition-colors"
                            >
                                {UI.backToTitle[locale]}
                            </button>
                            <a
                                href="/games"
                                className="text-[#a08b78] text-lg hover:text-[#ffb03a] transition-colors"
                            >
                                {UI.moreGames[locale]}
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* ---------------- TITLE / PAUSE ---------------- */}
            {(gameState === "MENU" || gameState === "PAUSED") && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center font-sans p-6 bg-[#120c08]/70 backdrop-blur-[1px] wf-fade">
                    {gameState === "MENU" ? (
                        <div className="flex flex-col items-center max-w-3xl">
                            <h1 className="text-[clamp(2.4rem,10vw,7rem)] leading-[0.85] font-black tracking-[-0.035em] text-[#f3ece2] text-center select-none">
                                WORD<span className="text-[#ffb03a]">FORGE</span>
                            </h1>

                            <div className="-mt-2 -mb-1">
                                <TurretBadge size={132} />
                            </div>

                            {/* the two rules of the game, as two lines */}
                            <p className="max-w-xl text-center text-[#f3ece2] text-sm sm:text-base leading-relaxed">
                                <span className="text-[#ffb03a] font-bold">1.</span> {UI.tagline[locale]}
                            </p>
                            <p className="mt-1.5 max-w-xl text-center text-[#f3ece2] text-sm sm:text-base leading-relaxed">
                                <span className="text-[#b98cff] font-bold">2.</span> {UI.howTo1[locale]}
                            </p>
                            <p className="mt-2 max-w-xl text-center text-[#a08b78] text-xs sm:text-sm leading-relaxed">
                                {UI.howTo2[locale]} {UI.howTo3[locale]}
                            </p>

                            {best > 0 && (
                                <p className="mt-3 text-[#f5c518] text-xs tracking-[0.26em]">
                                    {UI.best[locale]} · {UI.wave[locale]} {best}
                                </p>
                            )}

                            <p className="mt-5 mb-2.5 text-[#a08b78] text-[11px] tracking-[0.3em]">
                                {UI.chooseSpeed[locale]}
                            </p>
                            <div className="flex flex-wrap items-stretch justify-center gap-3">
                                {DIFFS.map((d, i) => {
                                    const cfg = DIFFICULTY_CONFIG[d];
                                    const active = difficulty === d;
                                    return (
                                        <button
                                            key={d}
                                            onMouseEnter={() => setDifficulty(d)}
                                            onFocus={() => setDifficulty(d)}
                                            onClick={() => startGame(d)}
                                            className={`w-44 px-4 py-3 rounded border-2 text-left transition-colors ${
                                                active
                                                    ? "border-[#ffb03a] bg-[#ffb03a]/12"
                                                    : "border-[#ffb03a]/25 hover:border-[#ffb03a]/60"
                                            }`}
                                        >
                                            <span className="flex items-baseline justify-between">
                                                <span className="text-[#ffb03a] text-lg font-bold tracking-[0.16em]">
                                                    {diffLabel[d]}
                                                </span>
                                                <span className="text-[#a08b78] text-[11px]">{i + 1}</span>
                                            </span>
                                            {/* printed from the config, so the menu can never lie */}
                                            <span className="mt-1.5 block text-[#d9b993] text-[10px] tracking-wider">
                                                {UI.carryLabel[locale]}{" "}
                                                {cfg.small === 1
                                                    ? UI.oneKey[locale]
                                                    : `${cfg.small}–${cfg.big} ${UI.letters[locale]}`}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="mt-2.5 h-8 text-center text-[#a08b78] text-xs max-w-sm">
                                {diffNote[difficulty]}
                            </p>

                            <span className="text-[#7d6a5a] text-[11px]">{UI.keysHint[locale]}</span>
                            <div className="mt-3 flex items-center gap-7">
                                <button
                                    onClick={() => setIsMuted(sfx.toggleMute())}
                                    className="text-[#a08b78] text-sm hover:text-[#ffb03a] transition-colors"
                                >
                                    {isMuted ? UI.unmute[locale] : UI.mute[locale]}
                                </button>
                                <a
                                    href="/games"
                                    className="text-[#a08b78] text-sm hover:text-[#ffb03a] transition-colors"
                                >
                                    {UI.moreGames[locale]}
                                </a>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-5xl font-light tracking-[0.3em] text-[#ffb03a]">
                                {UI.paused[locale]}
                            </h2>
                            <div className="mt-10 flex flex-wrap items-center justify-center gap-8">
                                <button
                                    onClick={() => {
                                        sfx.resume();
                                        sfx.startBed();
                                        setGameState("PLAYING");
                                    }}
                                    className="text-[#ffb03a] text-xl hover:text-[#ffd08a] transition-colors"
                                >
                                    {UI.resume[locale]}
                                    <span className="text-[#a08b78] text-sm ml-2">Esc</span>
                                </button>
                                <button
                                    onClick={() => startGame(difficulty)}
                                    className="text-[#a08b78] text-lg hover:text-[#ffb03a] transition-colors"
                                >
                                    {UI.playAgain[locale]}
                                </button>
                                <button
                                    onClick={backToMenu}
                                    className="text-[#a08b78] text-lg hover:text-[#ffb03a] transition-colors"
                                >
                                    {UI.backToTitle[locale]}
                                </button>
                                <a
                                    href="/games"
                                    className="text-[#a08b78] text-lg hover:text-[#ff8878] transition-colors"
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
