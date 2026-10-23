// =========================================================================
// 🎈 SKY HOP — simulation model (pure data + tuning, no React, no canvas).
//
// The hero dangles from a balloon over the ocean. A chain of labelled
// balloons climbs away to the right. Typing a label makes the hero HOP onto
// that balloon; every correct key gives a little lift, finishing the word
// gives a big one. The balloon leaks air non-stop, so the only way to stay
// in the sky is to keep typing. Touch the sea and you lose one of 3 lives.
//
// Coordinates: ONE mapping, `screenX(worldX) = worldX - camX + W*HERO_X_FRAC`.
// Balloon `ix` sits at `worldX = ix * SPACING`. There is no camera Y — the
// hero moves up and down inside the frame by `alt` (1 = high sky, 0 = sea).
// =========================================================================

// ---------- geometry ----------
export const HERO_X_FRAC = 0.3; // hero's resting screen x (camera anchor)
export const SPACING = 196; // world px between balloons in the chain
export const RISE_PER = 15; // each next balloon is drawn this much higher
export const SEA_FRAC = 0.855; // screen y of the sea line
export const SKY_FRAC = 0.16; // screen y the hero reaches at alt = 1
export const QUEUE_AHEAD = 7; // labelled balloons kept alive to the right

// ---------- flight model ----------
// Holding altitude needs `sink / liftPerKey` correct keys per second, so the
// configs below are tuned from a target WPM: EASY ≈ 12, MEDIUM ≈ 25, HARD ≈ 35.
export const ALT_START = 0.7;
export const ALT_RESPAWN = 0.66;
export const MISS_DROP = 0.05; // altitude lost on a typo
export const CROW_DROP = 0.2; // altitude lost when a crow pops your balloon
export const MERCY_ALT = 0.16; // below this the leak slows down (kid-friendly)
export const MERCY_FACTOR = 0.55;
export const COMBO_LIFT_CAP = 0.25; // +25% lift at a long streak
// The leak keeps ramping all the way to 4× the base rate (≈100 WPM to hold on
// MEDIUM): an endless game has to eventually outpace even a fast typist, or a
// good run never ends.
export const STAGE_SINK_RAMP = 0.11; // leak gets this much faster per stage
export const STAGE_SINK_CAP = 4;
export const HOPS_PER_STAGE = 16; // balloons per stage (island checkpoint)
export const TIER_EVERY = 2; // word pool grows one tier every N stages
export const LIFE_EVERY = 3; // +1 life (max 3) every N stages
export const MAX_LIVES = 3;
export const GOLD_EVERY = 8; // every Nth balloon in the chain is golden
export const CROW_MIN = 8; // seconds between crow attacks
export const CROW_MAX = 13;
export const CROW_TELE = 1.1; // telegraph before the swoop
export const CROW_DIVE = 0.95; // swoop duration
export const IDLE_NUDGE = 1.6; // seconds of silence before "keep typing!"
export const IMMUNE_TIME = 1.6; // seconds of grace after a splash

// ---------- word pools ----------
// Tier 0 is single keys (home row outward) so Sky Hop works as a first-week
// drill; later tiers are the same kid-vocabulary style as the other games.
const LETTERS = [
    "f", "j", "d", "k", "s", "l", "a", "g", "h", "e", "i", "r", "u", "t", "n",
    "o", "w", "c", "m", "v", "p", "b", "y", "x", "q", "z",
];
const SHORT_WORDS = [
    "sky", "fly", "up", "air", "cat", "dog", "sun", "run", "red", "box", "fox",
    "hat", "map", "pen", "cup", "big", "top", "win", "yes", "fun", "jam", "net",
    "owl", "pig", "ten", "van", "zip", "ant", "bee", "cow", "egg", "ice", "jet",
    "key", "mud", "sit", "wet", "bird", "kite", "wind", "wing", "rope", "gust",
    "star", "moon", "wave", "leaf", "rain", "hill", "fish", "boat", "gold",
];
const MID_WORDS = [
    "cloud", "float", "north", "storm", "light", "quick", "brave", "climb",
    "swing", "chase", "eagle", "ocean", "sunny", "windy",
    "happy", "smile", "river", "grass", "stone", "tiger", "horse", "apple",
    "island", "basket", "breeze", "flying", "rescue", "silver", "sunset",
    "thunder", "rocket", "planet", "seagull", "feather", "harbour",
];
const LONG_WORDS = [
    "adventure", "altitude", "balloon", "champion", "daybreak", "downwind",
    "flightpath", "hurricane", "lightning", "moonlight", "navigate", "overcast",
    "parachute", "skyrocket", "starlight", "sunshine", "tailwind", "updraft",
    "waterfall", "whirlwind", "wonderful", "windswept", "crosswind", "horizon",
];

export const WORD_TIERS = [LETTERS, SHORT_WORDS, MID_WORDS, LONG_WORDS];

export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export interface DifficultyConfig {
    sink: number; // altitude lost per second
    keyLift: number; // altitude gained per correct key
    hopLift: number; // altitude gained on finishing a word
    startTier: number;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
    EASY: { sink: 0.085, keyLift: 0.025, hopLift: 0.065, startTier: 0 },
    MEDIUM: { sink: 0.115, keyLift: 0.02, hopLift: 0.14, startTier: 1 },
    HARD: { sink: 0.145, keyLift: 0.03, hopLift: 0.12, startTier: 2 },
};

// ---------- sky palettes (one per stage, cycling) ----------
export type PaletteKey = "morning" | "noon" | "golden" | "dusk" | "stars" | "storm";

export interface SkyPalette {
    /** Localised in the game's UI dict — see `SkyHopWorld.tsx`. */
    key: PaletteKey;
    top: string;
    mid: string;
    low: string;
    sea: string;
    seaDeep: string;
    foam: string;
    hillFar: string;
    hillNear: string;
    cloud: string;
    sun: string;
    night: boolean;
    storm: boolean;
}

export const PALETTES: SkyPalette[] = [
    {
        key: "morning", top: "#5cb2ec", mid: "#9ed8f6", low: "#d9f1fd",
        sea: "#3ba3dd", seaDeep: "#1f7fbc", foam: "#dff6ff",
        hillFar: "#8ec9e8", hillNear: "#6fb7dd", cloud: "#ffffff", sun: "#fff3c4",
        night: false, storm: false,
    },
    {
        key: "noon", top: "#2f95e0", mid: "#7fc9f2", low: "#cdeafb",
        sea: "#2f8fd0", seaDeep: "#186ba6", foam: "#e6faff",
        hillFar: "#7cbfe2", hillNear: "#5aa8d4", cloud: "#ffffff", sun: "#fffbe0",
        night: false, storm: false,
    },
    {
        key: "golden", top: "#f2a45f", mid: "#f9c98a", low: "#ffe6bd",
        sea: "#e08a53", seaDeep: "#b96b3e", foam: "#ffeed6",
        hillFar: "#e3a877", hillNear: "#c98d5f", cloud: "#fff0da", sun: "#fff1bd",
        night: false, storm: false,
    },
    {
        key: "dusk", top: "#4a5a9e", mid: "#8e7ab4", low: "#e79a89",
        sea: "#4b5c8f", seaDeep: "#2f3c66", foam: "#c9c6ea",
        hillFar: "#6d76a8", hillNear: "#4f5788", cloud: "#e3ddf4", sun: "#ffd9a6",
        night: false, storm: false,
    },
    {
        key: "stars", top: "#0d1c3e", mid: "#1d3462", low: "#3a6088",
        sea: "#16294c", seaDeep: "#0b1730", foam: "#7fa6c9",
        hillFar: "#22355c", hillNear: "#172745", cloud: "#9fb6d6", sun: "#eef4ff",
        night: true, storm: false,
    },
    {
        key: "storm", top: "#232c38", mid: "#3d4a5b", low: "#63737f",
        sea: "#2a3a48", seaDeep: "#16222c", foam: "#9fb2bd",
        hillFar: "#33414f", hillNear: "#25313c", cloud: "#8b9aa8", sun: "#c9d6e0",
        night: false, storm: true,
    },
];

export const BALLOON_HUES = [
    { body: "#f2764f", dark: "#cf5533", light: "#ffa887" },
    { body: "#f7c34a", dark: "#d69a24", light: "#ffe191" },
    { body: "#7d6be0", dark: "#5c4cba", light: "#b0a4f5" },
    { body: "#4fbf7a", dark: "#2f9a58", light: "#96e3b1" },
    { body: "#ef6b9b", dark: "#c94a79", light: "#ffa8c6" },
    { body: "#49b8d6", dark: "#2a93b0", light: "#96e0f0" },
];

export const GOLD_HUE = { body: "#ffcf3f", dark: "#e0a213", light: "#fff0a8" };

// ---------- entities ----------
export interface Balloon {
    ix: number; // absolute chain index → worldX = ix * SPACING
    word: string;
    gold: boolean;
    hue: number; // index into BALLOON_HUES
    bob: number; // bob phase offset
}

export interface FreeBalloon {
    wx: number;
    y: number;
    vy: number;
    vx: number;
    hue: number;
    gold: boolean;
    rot: number;
    vrot: number;
    life: number;
    ttl: number;
    popped: boolean; // popped = burst rubber, otherwise it floats away
}

export type ParticleKind = "puff" | "shard" | "drop" | "spark" | "feather";

export interface Particle {
    kind: ParticleKind;
    wx: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    ttl: number;
    size: number;
    color: string;
    rot: number;
    vrot: number;
}

export interface Crow {
    phase: "tele" | "dive" | "leave";
    t: number;
    wx: number;
    y: number;
    fromY: number;
    flap: number;
    hit: boolean;
    /** Chain index it committed to when the dive started — hop past it to dodge. */
    targetIx: number;
}

export interface Island {
    ix: number; // chain index it is anchored to
    stage: number;
}

export type Phase = "idle" | "countdown" | "flying" | "splash" | "over";

export interface SkyHopState {
    cfg: DifficultyConfig;
    phase: Phase;
    countdown: number;

    // flight
    alt: number;
    altVel: number;
    heroIx: number;
    camX: number;
    hopT: number; // 0..1 hop animation
    sway: number;
    lives: number;
    immune: number;

    // chain
    balloons: Balloon[];
    freeBalloons: FreeBalloon[];
    islands: Island[];
    particles: Particle[];
    crow: Crow | null;
    crowTimer: number;

    // typing
    typed: number;
    idleT: number;

    // progression / score
    stage: number;
    hops: number;
    score: number;
    combo: number;
    bestCombo: number;
    goldPopped: number;
    crowsDodged: number;
    wordsTyped: number;
    correctKeystrokes: number;
    totalKeystrokes: number;
    flyTimeMs: number;

    // feel channels (read by the renderer only)
    lift: number; // 0..1 puff of upward energy, decays
    errFlash: number;
    redFlash: number;
    goldFlash: number;
    trauma: number;
    stageBanner: number;
    splashT: number;
    lightning: number;
    lightningTimer: number;
    t: number; // seconds of wall clock while mounted (animation phase)
    hudTick: number;
}

// ---------- helpers ----------
export function pickWord(pool: string[], avoid: string): string {
    let w = pool[Math.floor(Math.random() * pool.length)];
    for (let guard = 0; guard < 6 && w === avoid; guard++) {
        w = pool[Math.floor(Math.random() * pool.length)];
    }
    return w;
}

export function tierFor(s: SkyHopState): number {
    return Math.min(WORD_TIERS.length - 1, s.cfg.startTier + Math.floor(s.stage / TIER_EVERY));
}

export function poolFor(s: SkyHopState): string[] {
    return WORD_TIERS[tierFor(s)];
}

export function paletteFor(stage: number): SkyPalette {
    return PALETTES[stage % PALETTES.length];
}

export function currentBalloon(s: SkyHopState): Balloon | undefined {
    return s.balloons.find((b) => b.ix === s.heroIx);
}

export function targetBalloon(s: SkyHopState): Balloon | undefined {
    return s.balloons.find((b) => b.ix === s.heroIx + 1);
}

export function makeBalloon(s: SkyHopState, ix: number, avoid: string): Balloon {
    const gold = ix > 0 && ix % GOLD_EVERY === 0;
    // Golden balloons are worth double, so they carry a word one tier longer.
    const pool = gold
        ? WORD_TIERS[Math.min(WORD_TIERS.length - 1, tierFor(s) + 1)]
        : poolFor(s);
    return {
        ix,
        word: pickWord(pool, avoid),
        gold,
        hue: Math.floor(Math.random() * BALLOON_HUES.length),
        bob: Math.random() * Math.PI * 2,
    };
}

/**
 * Refill the chain so QUEUE_AHEAD labelled balloons exist to the right, and
 * so the ridden index always has a balloon (a splash or a crow pops it, and
 * the rescue hands the hero a fresh one).
 */
export function refillChain(s: SkyHopState) {
    s.balloons = s.balloons.filter((b) => b.ix >= s.heroIx);
    if (!s.balloons.some((b) => b.ix === s.heroIx)) {
        s.balloons.push(makeBalloon(s, s.heroIx, ""));
    }
    let maxIx = s.balloons.reduce((m, b) => Math.max(m, b.ix), s.heroIx);
    let last = s.balloons.find((b) => b.ix === maxIx)?.word ?? "";
    while (maxIx < s.heroIx + QUEUE_AHEAD) {
        maxIx++;
        const b = makeBalloon(s, maxIx, last);
        last = b.word;
        s.balloons.push(b);
    }
    s.balloons.sort((a, b) => a.ix - b.ix);
}

export function getInitialState(): SkyHopState {
    const s: SkyHopState = {
        cfg: DIFFICULTY_CONFIG.MEDIUM,
        phase: "idle",
        countdown: 0,
        alt: ALT_START,
        altVel: 0,
        heroIx: 0,
        camX: 0,
        hopT: 1,
        sway: 0,
        lives: MAX_LIVES,
        immune: 0,
        balloons: [],
        freeBalloons: [],
        islands: [],
        particles: [],
        crow: null,
        crowTimer: CROW_MIN,
        typed: 0,
        idleT: 0,
        stage: 0,
        hops: 0,
        score: 0,
        combo: 0,
        bestCombo: 0,
        goldPopped: 0,
        crowsDodged: 0,
        wordsTyped: 0,
        correctKeystrokes: 0,
        totalKeystrokes: 0,
        flyTimeMs: 0,
        lift: 0,
        errFlash: 0,
        redFlash: 0,
        goldFlash: 0,
        trauma: 0,
        stageBanner: 0,
        splashT: 0,
        lightning: 0,
        lightningTimer: 4,
        t: 0,
        hudTick: 0,
    };
    refillChain(s);
    return s;
}

export function resetRun(s: SkyHopState, diff: Difficulty) {
    s.cfg = DIFFICULTY_CONFIG[diff];
    s.phase = "countdown";
    s.countdown = 3.1;
    s.alt = ALT_START;
    s.altVel = 0;
    s.heroIx = 0;
    s.camX = 0;
    s.hopT = 1;
    s.sway = 0;
    s.lives = MAX_LIVES;
    s.immune = 0;
    s.balloons = [];
    s.freeBalloons = [];
    s.islands = [];
    s.particles = [];
    s.crow = null;
    s.crowTimer = CROW_MIN * 0.7;
    s.typed = 0;
    s.idleT = 0;
    s.stage = 0;
    s.hops = 0;
    s.score = 0;
    s.combo = 0;
    s.bestCombo = 0;
    s.goldPopped = 0;
    s.crowsDodged = 0;
    s.wordsTyped = 0;
    s.correctKeystrokes = 0;
    s.totalKeystrokes = 0;
    s.flyTimeMs = 0;
    s.lift = 0;
    s.errFlash = 0;
    s.redFlash = 0;
    s.goldFlash = 0;
    s.trauma = 0;
    s.stageBanner = 0;
    s.splashT = 0;
    s.lightning = 0;
    s.lightningTimer = 4;
    refillChain(s);
}

// ---------- particle emitters (all bounded, see CLAUDE.md) ----------
const PARTICLE_CAP = 150;

export function addParticle(s: SkyHopState, p: Particle) {
    if (s.particles.length >= PARTICLE_CAP) s.particles.shift();
    s.particles.push(p);
}

export function spawnPuff(s: SkyHopState, wx: number, y: number, n = 5) {
    for (let i = 0; i < n; i++) {
        addParticle(s, {
            kind: "puff", wx, y,
            vx: (Math.random() - 0.5) * 40,
            vy: 40 + Math.random() * 70,
            life: 0, ttl: 0.5 + Math.random() * 0.3,
            size: 5 + Math.random() * 7, color: "#ffffff",
            rot: 0, vrot: 0,
        });
    }
}

export function spawnPop(s: SkyHopState, wx: number, y: number, color: string) {
    for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + Math.random() * 0.4;
        const sp = 120 + Math.random() * 190;
        addParticle(s, {
            kind: "shard", wx, y,
            vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            life: 0, ttl: 0.5 + Math.random() * 0.35,
            size: 4 + Math.random() * 5, color,
            rot: Math.random() * 6, vrot: (Math.random() - 0.5) * 18,
        });
    }
    spawnPuff(s, wx, y, 4);
}

export function spawnSparkle(s: SkyHopState, wx: number, y: number, n = 10) {
    for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 70 + Math.random() * 170;
        addParticle(s, {
            kind: "spark", wx, y,
            vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40,
            life: 0, ttl: 0.55 + Math.random() * 0.4,
            size: 3 + Math.random() * 4, color: i % 3 === 0 ? "#fff6c9" : GOLD_HUE.body,
            rot: Math.random() * 6, vrot: (Math.random() - 0.5) * 10,
        });
    }
}

export function spawnFeathers(s: SkyHopState, wx: number, y: number) {
    for (let i = 0; i < 9; i++) {
        addParticle(s, {
            kind: "feather", wx, y,
            vx: (Math.random() - 0.5) * 130, vy: -20 + Math.random() * 60,
            life: 0, ttl: 1.1 + Math.random() * 0.6,
            size: 5 + Math.random() * 4, color: "#2b3444",
            rot: Math.random() * 6, vrot: (Math.random() - 0.5) * 6,
        });
    }
}

export function spawnSplash(s: SkyHopState, wx: number, y: number, foam: string) {
    for (let i = 0; i < 22; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.1;
        const sp = 160 + Math.random() * 320;
        addParticle(s, {
            kind: "drop", wx, y,
            vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            life: 0, ttl: 0.7 + Math.random() * 0.5,
            size: 3 + Math.random() * 6, color: i % 4 === 0 ? "#ffffff" : foam,
            rot: 0, vrot: 0,
        });
    }
}
