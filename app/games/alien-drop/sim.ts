// =========================================================================
// 👾 ALIEN DROP — simulation model (pure data + tuning, no React, no canvas).
//
// Alien drop-pods fall out of the sky, each one carrying ONE character on its
// porthole. Type that character and the hero blasts it out of the air. Let a
// pod reach the ground and it cracks open on the colony — the shield bar drops.
// Shield at zero ends the run. Endless, with a new wave every WAVE_KILLS pods.
//
// This is the only game in the app that is keyed on SINGLE CHARACTERS instead
// of words, so it trains letter recognition and reaction rather than sustained
// flow — which is exactly what feeds `lib/typing/stats.ts` per-key data.
//
// THREE ACCELERATIONS stack, and together they guarantee every run ends:
//   1. per-pod   — a pod speeds up as it falls (POD_ACCEL_FRAC), so the last
//                  metres are always the tense ones;
//   2. per-wave  — each wave decays the spawn gap geometrically (`gapDecay`)
//                  and ramps the fall speed (`speedRamp`);
//   3. per-run   — a slow global multiplier on time alone (ACCEL_PER_SEC),
//                  so even a wave you never clear keeps tightening.
// `gapAt()` / `speedAt()` below are the single source of truth for 2 and 3;
// the menu prints its WPM figures straight out of them so they can never lie.
//
// Coordinates: there is NO scrolling and no camera. Everything is in screen
// space — pods fall from y < 0 to `Layout.groundY`, the hero stands at
// `Layout.heroX`. That is what makes this the simplest sim of the five games.
// =========================================================================

// ---------- geometry ----------
export const GROUND_FRAC = 0.845; // screen y of the ground line
export const HERO_X_FRAC = 0.5; // the hero holds the middle
export const SPAWN_Y = -70; // pods are born this far above the top edge
export const SIDE_MARGIN = 0.09; // pods never spawn inside this much of an edge
export const POD_R = 30; // pod radius in layout units
export const DANGER_FRAC = 0.62; // below this height a pod turns red and beeps

// ---------- the shield ----------
export const MAX_SHIELD = 100;
export const MEDIC_HEAL = 18;

// ---------- per-pod acceleration ----------
// A pod is fired downward at `speed * POD_V0_FRAC` and accelerates. The average
// over a full fall is ≈ `speed`, so the wave tuning below still reads true.
export const POD_V0_FRAC = 0.62;
export const POD_ACCEL_FRAC = 0.34; // × speed, per second
export const POD_VMAX_FRAC = 1.5;

// ---------- per-run acceleration ----------
export const ACCEL_PER_SEC = 0.0042; // +0.42% pace per second survived
export const ACCEL_CAP = 0.65; // …up to +65%

// ---------- waves ----------
export const WAVE_KILLS = 12; // pods destroyed per wave
export const SWARM_EVERY = 4; // every Nth wave opens with a swarm
export const SWARM_SIZE = 5;
export const SWARM_WARN = 1.6; // seconds of warning before a swarm drops

// ---------- special pods ----------
export const GOLD_EVERY = 9; // every Nth pod spawned is golden (double score)
export const MEDIC_EVERY = 17; // …and every Nth is a medic pod (+shield)

// ---------- the nova (the earned panic button) ----------
export const NOVA_COMBO = 20; // correct hits that fill the charge bar
export const NOVA_TIME = 0.85; // seconds the shockwave takes to cross the sky

// ---------- scoring ----------
export const POD_SCORE = 10; // the reference game's "+10"
export const WAVE_BONUS = 100;
export const COMBO_STEP = 5; // +1 point per this many combo, capped
export const COMBO_CAP = 10;

// ---------- the blaster ----------
export const BOLT_SPEED = 1750; // px/s at scale 1 — fast enough to feel instant
export const AIM_EASE = 22; // how hard the barrel snaps onto a new target

export const IDLE_NUDGE = 4.5; // seconds of silence before "type the letters!"

// ==========================================
// DIFFICULTY
// ==========================================

export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export interface DifficultyConfig {
    /** The character pool pods are drawn from. */
    keys: string;
    /** Seconds between spawns at wave 0. */
    gap0: number;
    /** Floor for the spawn gap, however long you survive. */
    gapMin: number;
    /** Geometric decay of the gap per wave — this IS the difficulty curve. */
    gapDecay: number;
    /** Average fall speed (px/s at scale 1) at wave 0. */
    speed0: number;
    /** Extra fall speed per wave, as a fraction. */
    speedRamp: number;
    speedMax: number;
    /** Shield lost when a pod lands. */
    damage: number;
    /** First wave that can open with a swarm. */
    swarmFrom: number;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
    // home row only — a first-week drill that still looks like an arcade game
    EASY: {
        keys: "fjdkslagh",
        gap0: 2.2, gapMin: 0.8, gapDecay: 0.91,
        speed0: 60, speedRamp: 0.1, speedMax: 165,
        damage: 14, swarmFrom: 3,
    },
    // the whole alphabet
    MEDIUM: {
        keys: "abcdefghijklmnopqrstuvwxyz",
        gap0: 1.5, gapMin: 0.55, gapDecay: 0.895,
        speed0: 76, speedRamp: 0.12, speedMax: 210,
        damage: 20, swarmFrom: 2,
    },
    // alphabet + digits, and they come down hard
    HARD: {
        keys: "abcdefghijklmnopqrstuvwxyz0123456789",
        gap0: 1.05, gapMin: 0.4, gapDecay: 0.88,
        speed0: 94, speedRamp: 0.14, speedMax: 265,
        damage: 26, swarmFrom: 1,
    },
};

/** Seconds between spawns at `wave`, after `runSec` of play. */
export function gapAt(cfg: DifficultyConfig, wave: number, runSec = 0): number {
    const accel = 1 + Math.min(ACCEL_CAP, runSec * ACCEL_PER_SEC);
    return Math.max(cfg.gapMin, (cfg.gap0 * Math.pow(cfg.gapDecay, wave)) / accel);
}

/** Average fall speed at `wave`, after `runSec` of play. */
export function speedAt(cfg: DifficultyConfig, wave: number, runSec = 0): number {
    const accel = 1 + Math.min(ACCEL_CAP, runSec * ACCEL_PER_SEC);
    return Math.min(cfg.speedMax, cfg.speed0 * (1 + wave * cfg.speedRamp) * accel);
}

/**
 * The keystrokes-per-minute the spawn rate demands at `wave`, expressed as WPM
 * on the standard 5-characters-per-word rule. One pod = one keystroke, so this
 * is exactly `60 / gap / 5`. The menu prints it, so nothing can drift.
 */
export function wpmAt(cfg: DifficultyConfig, wave: number): number {
    return Math.round(12 / gapAt(cfg, wave));
}

// ==========================================
// SKIES — one palette per wave, cycling. Wave 0 is the reference game's
// green sky over red mesas; the rest walk the same planet around its day.
// ==========================================

export type PaletteKey = "verdant" | "violet" | "amber" | "azure" | "midnight";

export interface Palette {
    key: PaletteKey;
    skyTop: string;
    skyMid: string;
    skyLow: string;
    cloud: string; // the soft banded haze in the sky
    planet: string;
    planetDark: string;
    planetLight: string;
    spireLight: string;
    spireMid: string;
    spireDark: string;
    plateau: string;
    groundTop: string;
    groundMid: string;
    groundDark: string;
    lip: string; // the lit strip along the very front of the ground
    crystal: string;
    crystalLight: string;
    haze: string;
    beam: string; // blaster bolt tint
    night: boolean;
}

export const PALETTES: Palette[] = [
    {
        key: "verdant",
        skyTop: "#2fb98a", skyMid: "#6ed37f", skyLow: "#b8e86a",
        cloud: "rgba(255,255,255,0.14)",
        planet: "#a8dd7a", planetDark: "#7fbe5c", planetLight: "#d3f0a6",
        spireLight: "#ff9b3d", spireMid: "#f3762a", spireDark: "#d4531c",
        plateau: "#e88a2f",
        groundTop: "#e2622a", groundMid: "#c33f22", groundDark: "#96271c",
        lip: "#f5709b", crystal: "#5fd8ec", crystalLight: "#c4f4fb",
        haze: "#ffd98a", beam: "#8ff5c8", night: false,
    },
    {
        key: "violet",
        skyTop: "#3b2a72", skyMid: "#7a4bad", skyLow: "#c977c1",
        cloud: "rgba(255,255,255,0.11)",
        planet: "#f2b5d4", planetDark: "#c98bb2", planetLight: "#ffe0ef",
        spireLight: "#4fd6c4", spireMid: "#2fa9a2", spireDark: "#1d7a7d",
        plateau: "#39929b",
        groundTop: "#2e6f86", groundMid: "#1f4f68", groundDark: "#14344a",
        lip: "#ffd166", crystal: "#ffa6e0", crystalLight: "#ffe3f6",
        haze: "#e5a2ff", beam: "#ffe08a", night: true,
    },
    {
        key: "amber",
        skyTop: "#f0763a", skyMid: "#fba757", skyLow: "#ffdc93",
        cloud: "rgba(255,255,255,0.18)",
        planet: "#ffe6a8", planetDark: "#e0bd74", planetLight: "#fff6d8",
        spireLight: "#b4543f", spireMid: "#8e3a30", spireDark: "#672621",
        plateau: "#a34535",
        groundTop: "#8c3b2f", groundMid: "#682821", groundDark: "#471a17",
        lip: "#ffc46b", crystal: "#ffd166", crystalLight: "#fff0c2",
        haze: "#ffd0a0", beam: "#a8f0ff", night: false,
    },
    {
        key: "azure",
        skyTop: "#1f7ed0", skyMid: "#59b4ea", skyLow: "#b6e5fb",
        cloud: "rgba(255,255,255,0.24)",
        planet: "#cfe9ff", planetDark: "#a3c6e8", planetLight: "#f2fbff",
        spireLight: "#e5b96f", spireMid: "#c4924c", spireDark: "#9a6c33",
        plateau: "#d2a55c",
        groundTop: "#c99a56", groundMid: "#a1783f", groundDark: "#75552b",
        lip: "#7fe3ff", crystal: "#6ee0ff", crystalLight: "#d5f6ff",
        haze: "#e8f6ff", beam: "#ffe58a", night: false,
    },
    {
        key: "midnight",
        skyTop: "#080f2c", skyMid: "#15224f", skyLow: "#2c3f74",
        cloud: "rgba(180,210,255,0.09)",
        planet: "#9fb6e8", planetDark: "#6e83b4", planetLight: "#dce6ff",
        spireLight: "#4a3f7a", spireMid: "#362c5c", spireDark: "#241d40",
        plateau: "#2c2450",
        groundTop: "#241d40", groundMid: "#191330", groundDark: "#100c21",
        lip: "#7bf5d2", crystal: "#8affe0", crystalLight: "#d9fff4",
        haze: "#3f5590", beam: "#a6ffea", night: true,
    },
];

export function paletteFor(wave: number): Palette {
    return PALETTES[wave % PALETTES.length];
}

// ==========================================
// ENTITIES
// ==========================================

export type PodKind = "normal" | "gold" | "medic";
/**
 * `fall` = live and targetable. `hit` = the player has already typed its
 * character: it is frozen mid-air, no longer targetable and no longer
 * dangerous, waiting for the blaster bolt to reach it. A pod that lands is
 * removed outright, so there is no third state.
 */
export type PodState = "fall" | "hit";

export interface Pod {
    id: number;
    x: number; // screen x — there is no scrolling in this game
    y: number;
    vy: number;
    /** Average fall speed this pod was born with; its acceleration derives from it. */
    speed: number;
    ch: string;
    kind: PodKind;
    state: PodState;
    /** Seconds since the pod was shot / landed — drives the death animation. */
    deadT: number;
    sway: number; // phase of the side-to-side drift
    swayAmp: number;
    flap: number; // wing-flap phase
    /** 0→1 pop-in scale when the pod enters. */
    born: number;
    /** Set when the pod has crossed the danger line and already beeped. */
    warned: boolean;
}

export interface Bolt {
    x: number;
    y: number;
    vx: number;
    vy: number;
    /** Pod this bolt is chasing; it detonates on arrival. */
    target: number;
    life: number;
    color: string;
    /** Distance still to travel — the bolt dies when this runs out. */
    remain: number;
}

export type ParticleKind = "spark" | "shard" | "smoke" | "ring" | "star" | "ember";

export interface Particle {
    kind: ParticleKind;
    x: number;
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

/** A floating "+10" — the reference game's score popup. */
export interface Popup {
    x: number;
    y: number;
    text: string;
    color: string;
    life: number;
    ttl: number;
    /** 0 = normal, 1 = big (wave bonus / nova). */
    big: number;
}

/** The hero's rig. Everything here is presentation, driven by `step()`. */
export interface Hero {
    /** Barrel angle in radians, 0 = straight up, positive = to the right. */
    aim: number;
    aimTarget: number;
    recoil: number; // 0..1, decays
    hurt: number; // 0..1 red flinch
    bob: number; // idle breathing phase
    hop: number; // little jump on a kill
    charge: number; // 0..1 nova meter
    blink: number;
    /** Which way the hero is leaning, -1..1, follows the aim. */
    lean: number;
    /**
     * Which way the hero is FACING: +1 right, -1 left. The whole sprite is
     * mirrored on this, so the blaster is always held on the side he is
     * shooting at and can never swing across his own visor. Switched with a
     * deadzone (`FACE_FLIP`) so a pod hovering near the centre cannot make him
     * flicker between the two.
     */
    face: number;
}

/** Aim angle (radians from straight up) needed to turn the hero around. */
export const FACE_FLIP = 0.3;

export type Phase = "idle" | "countdown" | "playing" | "over";

export interface AlienDropState {
    cfg: DifficultyConfig;
    diff: Difficulty;
    phase: Phase;
    countdown: number;

    // the colony
    shield: number;
    hero: Hero;

    // entities
    pods: Pod[];
    bolts: Bolt[];
    particles: Particle[];
    popups: Popup[];
    nextId: number;

    // spawning
    spawnTimer: number;
    /** Queued swarm: pods still to drop this instant-wave, and the warning clock. */
    swarmLeft: number;
    swarmWarn: number;
    swarmT: number;

    // progression
    wave: number;
    killed: number; // pods destroyed this wave
    totalKilled: number;
    leaked: number; // pods that reached the ground
    goldKills: number;
    medicKills: number;
    novas: number;

    // scoring / typing
    score: number;
    combo: number;
    bestCombo: number;
    correctKeystrokes: number;
    totalKeystrokes: number;
    runTimeMs: number;
    idleT: number;

    // the nova
    novaT: number; // >0 while the shockwave is expanding

    // feel channels (eased; the renderer reads these, nothing else)
    flash: number; // white pop on a kill
    errFlash: number;
    goldFlash: number;
    healFlash: number;
    hurtFlash: number;
    waveBanner: number;
    trauma: number; // screen shake — a pod landing is a real impact here
    t: number; // seconds of wall clock while mounted
}

// ==========================================
// HELPERS
// ==========================================

/**
 * Pick the character for the next pod. Duplicates on screen are legal (with 9
 * home-row keys they are unavoidable) but actively avoided, because two pods
 * showing the same letter makes the player guess which one dies. When a
 * duplicate is unavoidable the targeting rule in `AlienDropWorld.tsx` keeps it
 * fair: the LOWEST matching pod is always the one that gets shot.
 */
export function pickChar(cfg: DifficultyConfig, pods: Pod[]): string {
    const taken = new Set(pods.filter((p) => p.state === "fall").map((p) => p.ch));
    for (let i = 0; i < 10; i++) {
        const c = cfg.keys[Math.floor(Math.random() * cfg.keys.length)];
        if (!taken.has(c)) return c;
    }
    return cfg.keys[Math.floor(Math.random() * cfg.keys.length)];
}

/** Which special kind (if any) the Nth pod of the run is. */
export function kindFor(spawnIndex: number): PodKind {
    if (spawnIndex > 0 && spawnIndex % MEDIC_EVERY === 0) return "medic";
    if (spawnIndex > 0 && spawnIndex % GOLD_EVERY === 0) return "gold";
    return "normal";
}

/** Points a pod is worth right now, combo included. */
export function podScore(kind: PodKind, combo: number): number {
    const bonus = Math.min(COMBO_CAP, Math.floor(combo / COMBO_STEP));
    return (POD_SCORE + bonus) * (kind === "gold" ? 2 : 1);
}

export function makeHero(): Hero {
    return {
        aim: 0, aimTarget: 0, recoil: 0, hurt: 0, bob: 0,
        hop: 0, charge: 0, blink: 0, lean: 0, face: 1,
    };
}

export function getInitialState(): AlienDropState {
    return {
        cfg: DIFFICULTY_CONFIG.MEDIUM,
        diff: "MEDIUM",
        phase: "idle",
        countdown: 0,
        shield: MAX_SHIELD,
        hero: makeHero(),
        pods: [],
        bolts: [],
        particles: [],
        popups: [],
        nextId: 1,
        spawnTimer: 0.6,
        swarmLeft: 0,
        swarmWarn: 0,
        swarmT: 0,
        wave: 0,
        killed: 0,
        totalKilled: 0,
        leaked: 0,
        goldKills: 0,
        medicKills: 0,
        novas: 0,
        score: 0,
        combo: 0,
        bestCombo: 0,
        correctKeystrokes: 0,
        totalKeystrokes: 0,
        runTimeMs: 0,
        idleT: 0,
        novaT: 0,
        flash: 0,
        errFlash: 0,
        goldFlash: 0,
        healFlash: 0,
        hurtFlash: 0,
        waveBanner: 0,
        trauma: 0,
        t: 0,
    };
}

export function resetRun(s: AlienDropState, diff: Difficulty) {
    s.cfg = DIFFICULTY_CONFIG[diff];
    s.diff = diff;
    s.phase = "countdown";
    s.countdown = 3.1;
    s.shield = MAX_SHIELD;
    s.hero = makeHero();
    s.pods = [];
    s.bolts = [];
    s.particles = [];
    s.popups = [];
    // ids restart with the run, so the gold / medic cadence (`kindFor`) is
    // identical every time instead of drifting with how much you played before
    s.nextId = 1;
    s.spawnTimer = 0.5;
    s.swarmLeft = 0;
    s.swarmWarn = 0;
    s.swarmT = 0;
    s.wave = 0;
    s.killed = 0;
    s.totalKilled = 0;
    s.leaked = 0;
    s.goldKills = 0;
    s.medicKills = 0;
    s.novas = 0;
    s.score = 0;
    s.combo = 0;
    s.bestCombo = 0;
    s.correctKeystrokes = 0;
    s.totalKeystrokes = 0;
    s.runTimeMs = 0;
    s.idleT = 0;
    s.novaT = 0;
    s.flash = 0;
    s.errFlash = 0;
    s.goldFlash = 0;
    s.healFlash = 0;
    s.hurtFlash = 0;
    s.waveBanner = 0;
    s.trauma = 0;
}

// ==========================================
// SPAWNERS / EMITTERS — all bounded (see CLAUDE.md)
// ==========================================

const PARTICLE_CAP = 220;
const POPUP_CAP = 18;

export function addParticle(s: AlienDropState, p: Particle) {
    if (s.particles.length >= PARTICLE_CAP) s.particles.shift();
    s.particles.push(p);
}

export function addPopup(s: AlienDropState, p: Popup) {
    if (s.popups.length >= POPUP_CAP) s.popups.shift();
    s.popups.push(p);
}

/**
 * Drop one pod. `x` is chosen inside the safe margins and nudged away from the
 * pods already in the sky, so a wave never lands three on the same column.
 */
export function spawnPod(
    s: AlienDropState, W: number, scale: number, spawnIndex: number, forcedX?: number,
): Pod {
    const lo = W * SIDE_MARGIN;
    const hi = W * (1 - SIDE_MARGIN);
    let x = forcedX ?? lo + Math.random() * (hi - lo);
    if (forcedX === undefined) {
        // three tries to keep some daylight between falling pods
        for (let i = 0; i < 3; i++) {
            const tooClose = s.pods.some(
                (p) => p.state === "fall" && Math.abs(p.x - x) < 90 * scale && p.y < 260 * scale,
            );
            if (!tooClose) break;
            x = lo + Math.random() * (hi - lo);
        }
    }
    const runSec = s.runTimeMs / 1000;
    const speed = speedAt(s.cfg, s.wave, runSec) * scale;
    const pod: Pod = {
        id: s.nextId++,
        x,
        y: SPAWN_Y * scale,
        vy: speed * POD_V0_FRAC,
        speed,
        ch: pickChar(s.cfg, s.pods),
        kind: kindFor(spawnIndex),
        state: "fall",
        deadT: 0,
        sway: Math.random() * Math.PI * 2,
        swayAmp: (0.5 + Math.random() * 0.9) * scale,
        flap: Math.random() * Math.PI * 2,
        born: 0,
        warned: false,
    };
    s.pods.push(pod);
    return pod;
}

/** Debris when a pod is shot. */
export function spawnBurst(s: AlienDropState, x: number, y: number, color: string, scale: number) {
    for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + Math.random() * 0.4;
        const sp = (130 + Math.random() * 230) * scale;
        addParticle(s, {
            kind: "shard", x, y,
            vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            life: 0, ttl: 0.45 + Math.random() * 0.3,
            size: (4 + Math.random() * 5) * scale, color,
            rot: Math.random() * 6, vrot: (Math.random() - 0.5) * 18,
        });
    }
    for (let i = 0; i < 8; i++) {
        addParticle(s, {
            kind: "smoke", x, y,
            vx: (Math.random() - 0.5) * 90 * scale,
            vy: (-30 - Math.random() * 70) * scale,
            life: 0, ttl: 0.5 + Math.random() * 0.45,
            size: (10 + Math.random() * 14) * scale, color: "#ffffff",
            rot: 0, vrot: 0,
        });
    }
    addParticle(s, {
        kind: "ring", x, y, vx: 0, vy: 0,
        life: 0, ttl: 0.34, size: 16 * scale, color,
        rot: 0, vrot: 0,
    });
}

/** Sparkle shower for a golden pod. */
export function spawnSparkle(s: AlienDropState, x: number, y: number, scale: number, n = 16) {
    for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = (90 + Math.random() * 220) * scale;
        addParticle(s, {
            kind: "star", x, y,
            vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60 * scale,
            life: 0, ttl: 0.6 + Math.random() * 0.5,
            size: (3.5 + Math.random() * 4.5) * scale,
            color: i % 3 === 0 ? "#fff8d0" : "#ffd23f",
            rot: Math.random() * 6, vrot: (Math.random() - 0.5) * 12,
        });
    }
}

/** Dust and embers where a pod cracked open on the ground. */
export function spawnImpact(s: AlienDropState, x: number, y: number, scale: number) {
    for (let i = 0; i < 14; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
        const sp = (150 + Math.random() * 260) * scale;
        addParticle(s, {
            kind: "ember", x, y,
            vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            life: 0, ttl: 0.5 + Math.random() * 0.4,
            size: (3 + Math.random() * 4) * scale, color: i % 2 ? "#ff8a3d" : "#ffd166",
            rot: 0, vrot: 0,
        });
    }
    for (let i = 0; i < 10; i++) {
        addParticle(s, {
            kind: "smoke", x: x + (Math.random() - 0.5) * 40 * scale, y,
            vx: (Math.random() - 0.5) * 180 * scale,
            vy: (-20 - Math.random() * 60) * scale,
            life: 0, ttl: 0.55 + Math.random() * 0.5,
            size: (12 + Math.random() * 18) * scale, color: "#e8d5c0",
            rot: 0, vrot: 0,
        });
    }
    addParticle(s, {
        kind: "ring", x, y, vx: 0, vy: 0,
        life: 0, ttl: 0.4, size: 20 * scale, color: "#ff9c5b",
        rot: 0, vrot: 0,
    });
}

/** Muzzle flash sparks when the blaster fires. */
export function spawnMuzzle(
    s: AlienDropState, x: number, y: number, ang: number, color: string, scale: number,
) {
    for (let i = 0; i < 6; i++) {
        const a = ang - Math.PI / 2 + (Math.random() - 0.5) * 0.9;
        const sp = (140 + Math.random() * 200) * scale;
        addParticle(s, {
            kind: "spark", x, y,
            vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            life: 0, ttl: 0.16 + Math.random() * 0.14,
            size: (2.5 + Math.random() * 3) * scale, color,
            rot: 0, vrot: 0,
        });
    }
}
