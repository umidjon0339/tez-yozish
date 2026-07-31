// =========================================================================
// 🪢 TUG OF TYPING — simulation model (pure data + tuning, no React/canvas).
//
// A top-down tug-of-war: YOU (blue, right) against a RIVAL (red, left). Both
// race on the SAME word. Every correct letter you type is a pull toward your
// side; every letter the rival "types" pulls back. Whoever finishes the word
// first lands a heave and a fresh word drops.
//
// The rope position is the integral of (your keys/sec − the rival's keys/sec),
// so the game is a pure speed race against a rival whose WPM is shown on
// screen. Win and the NEXT rival is faster — endless levels. Lose once and the
// run is over.
// =========================================================================

// ---------- geometry (fractions of the canvas) ----------
export const LINE_L = 0.28; // left chalk boundary
export const LINE_R = 0.72; // right chalk boundary
export const GRIP_GAP = 0.13; // each puller sits this far from the rope marker
export const FIELD_Y = 0.54; // the rope's height on screen

// ---------- tug model ----------
// Steady state: force ≈ keysPerSecond · FORCE_TAU, so the rope drifts at
// (your rate − the rival's rate) · FORCE_TAU · ROPE_SPEED. `rope` is
// normalised: +1 = you clear the level, −1 = the rival wins and the run ends.
export const FORCE_TAU = 0.5;
export const KEY_PULL = 1;
export const ROPE_SPEED = 0.19;
export const ROPE_EASE = 4.5; // how fast rope velocity chases the force gap
export const MAX_FORCE = 4;
export const HEAVE = 0.016; // finishing the word first — same for both sides
export const TYPO_SLIP = 0.012; // ground lost on a wrong key
export const TYPO_FORCE_CUT = 0.35;
export const BOT_REGRIP = 0.18; // the rival's pause after a word IT won
export const WIN_AT = 1;

// Anti-stalemate. Two pullers matched to the WPM can hold the middle forever.
// Instead of a countdown on screen, the rival simply digs in: past RAMP_AFTER
// seconds in a level its pull grows, so every level ends. It is shown, not
// counted — the rival strains harder and kicks up dust.
export const RAMP_AFTER = 20;
export const RAMP_RATE = 0.05; // +5% rival pull per second past RAMP_AFTER
export const RAMP_MAX = 1.7;

// ---------- levels ----------
export const LEVEL_WPM_STEP = 4; // each level's rival types this much faster
export const LEVEL_TIER_EVERY = 4; // words grow one tier every N levels

export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export interface DifficultyConfig {
    /** Level-1 rival speed. Every level after adds LEVEL_WPM_STEP. */
    botWpm: number;
    tier: number;
}

// The rival's WPM is the whole difficulty curve — it is shown to the player.
export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
    EASY: { botWpm: 18, tier: 0 },
    MEDIUM: { botWpm: 30, tier: 1 },
    HARD: { botWpm: 45, tier: 2 },
};

// ---------- word pools ----------
// High-frequency English words on purpose: practice here transfers to real
// typing far better than themed vocabulary does.
const SHORT_WORDS = [
    "the", "and", "you", "for", "are", "but", "not", "all", "can", "her", "was",
    "one", "our", "out", "day", "get", "has", "him", "how", "man", "new", "now",
    "old", "see", "two", "way", "who", "boy", "did", "its", "let", "put", "say",
    "she", "too", "use", "big", "run", "top", "red", "sun", "cat", "dog", "box",
    "map", "pen", "cup", "hat", "win", "yes", "job", "key", "sit", "ten", "van",
    "that", "with", "have", "this", "will", "your", "from", "they", "know",
    "want", "been", "good", "much", "some", "time", "very", "when", "come",
    "here", "just", "like", "long", "make", "many", "over", "such", "take",
    "than", "them", "well", "were", "road", "snow", "moon", "bear", "star",
];
const MID_WORDS = [
    "about", "after", "again", "could", "every", "first", "found", "great",
    "house", "large", "learn", "never", "other", "place", "right", "small",
    "sound", "spell", "still", "study", "their", "there", "these", "thing",
    "think", "three", "under", "water", "where", "which", "world", "would",
    "write", "young", "answer", "before", "better", "change", "family",
    "friend", "ground", "letter", "mother", "number", "people", "school",
    "should", "simple", "strong", "travel", "winter", "yellow", "animal",
];
const LONG_WORDS = [
    "because", "between", "brother", "certain", "compare", "country", "develop",
    "distance", "elephant", "evening", "example", "exercise", "families",
    "football", "hospital", "however", "important", "interest", "keyboard",
    "language", "learning", "mountain", "movement", "national", "together",
    "tomorrow", "universe", "vacation", "whatever", "wonderful", "yesterday",
    "adventure", "beautiful", "different", "everybody", "understand",
];

export const WORD_TIERS = [SHORT_WORDS, MID_WORDS, LONG_WORDS];

export type Phase = "idle" | "countdown" | "pull" | "levelover" | "over";
export type Winner = "player" | "bot";

export interface Particle {
    kind: "dust" | "chip" | "sweat";
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

/** A skid streak left in the grass by whoever is being dragged. */
export interface Skid {
    x: number;
    y: number;
    len: number;
    life: number;
    ttl: number;
    side: Winner;
}

export interface TugState {
    cfg: DifficultyConfig;
    phase: Phase;
    countdown: number;

    // the tug
    rope: number; // −1 (rival wins, run over) … +1 (you clear the level)
    ropeVel: number;
    playerForce: number;
    botForce: number;
    tension: number; // 0..1 visual rope tightness, driven by both forces
    levelT: number; // seconds spent in this level, drives the dig-in ramp
    botRamp: number; // 1 … RAMP_MAX

    // the shared word race
    word: string;
    typed: number;
    botTyped: number; // fractional letter progress
    botRegrip: number;

    // progression
    level: number;
    botWpm: number;
    levelWinner: Winner | null;
    levelOverT: number;

    // scoring / stats
    score: number;
    combo: number;
    bestCombo: number;
    wordsWon: number;
    wordsLost: number;
    correctKeystrokes: number;
    totalKeystrokes: number;
    pullTimeMs: number; // the WPM clock — only runs in `pull`
    burst: number; // smoothed keys/sec, for the live speed readout

    // feel channels (read by the renderer only)
    heaveT: number;
    botHeaveT: number;
    errFlash: number;
    trauma: number;
    particles: Particle[];
    skids: Skid[];
    t: number;
}

export const BURST_TAU = 1.2; // window for the live keys/sec estimate

// ---------- helpers ----------
export function botKeysPerSecond(s: TugState): number {
    return (s.botWpm * 5) / 60;
}

export function playerWpm(s: TugState): number {
    const minutes = s.pullTimeMs / 60000;
    return minutes > 0 ? Math.round(s.correctKeystrokes / 5 / minutes) : 0;
}

export function accuracy(s: TugState): number {
    return s.totalKeystrokes > 0
        ? Math.round((s.correctKeystrokes / s.totalKeystrokes) * 100)
        : 100;
}

export function tierFor(s: TugState): number {
    return Math.min(
        WORD_TIERS.length - 1,
        s.cfg.tier + Math.floor((s.level - 1) / LEVEL_TIER_EVERY),
    );
}

export function poolFor(s: TugState): string[] {
    return WORD_TIERS[tierFor(s)];
}

export function pickWord(pool: string[], avoid: string): string {
    let w = pool[Math.floor(Math.random() * pool.length)];
    for (let guard = 0; guard < 6 && w === avoid; guard++) {
        w = pool[Math.floor(Math.random() * pool.length)];
    }
    return w;
}

/**
 * Fresh word for the race — both sides restart on it, losing any partial
 * progress. `botRests` is set ONLY when the rival won the word: it re-grips
 * after its heave, which compensates the human's reading time after being
 * beaten to a word. Resting after every word would quietly make the rival
 * slower than the WPM shown on screen, and that number has to stay honest.
 */
export function nextWord(s: TugState, botRests = false) {
    s.word = pickWord(poolFor(s), s.word);
    s.typed = 0;
    s.botTyped = 0;
    s.botRegrip = botRests ? BOT_REGRIP : 0;
}

export function getInitialState(): TugState {
    const s: TugState = {
        cfg: DIFFICULTY_CONFIG.MEDIUM,
        phase: "idle",
        countdown: 0,
        rope: 0,
        ropeVel: 0,
        playerForce: 0,
        botForce: 0,
        tension: 0,
        levelT: 0,
        botRamp: 1,
        word: "",
        typed: 0,
        botTyped: 0,
        botRegrip: 0,
        level: 1,
        botWpm: DIFFICULTY_CONFIG.MEDIUM.botWpm,
        levelWinner: null,
        levelOverT: 0,
        score: 0,
        combo: 0,
        bestCombo: 0,
        wordsWon: 0,
        wordsLost: 0,
        correctKeystrokes: 0,
        totalKeystrokes: 0,
        pullTimeMs: 0,
        burst: 0,
        heaveT: 0,
        botHeaveT: 0,
        errFlash: 0,
        trauma: 0,
        particles: [],
        skids: [],
        t: 0,
    };
    nextWord(s);
    return s;
}

/** Start a level: the rope resets, the rival is faster, the run carries on. */
export function startLevel(s: TugState, level: number) {
    s.level = level;
    s.botWpm = s.cfg.botWpm + (level - 1) * LEVEL_WPM_STEP;
    s.phase = "countdown";
    s.countdown = level === 1 ? 3.2 : 2.2;
    s.rope = 0;
    s.ropeVel = 0;
    s.playerForce = 0;
    s.botForce = 0;
    s.tension = 0;
    s.levelT = 0;
    s.botRamp = 1;
    s.levelWinner = null;
    s.levelOverT = 0;
    s.combo = 0;
    s.particles = [];
    s.skids = [];
    nextWord(s);
}

export function resetRun(s: TugState, diff: Difficulty) {
    s.cfg = DIFFICULTY_CONFIG[diff];
    s.score = 0;
    s.combo = 0;
    s.bestCombo = 0;
    s.wordsWon = 0;
    s.wordsLost = 0;
    s.correctKeystrokes = 0;
    s.totalKeystrokes = 0;
    s.pullTimeMs = 0;
    s.burst = 0;
    s.heaveT = 0;
    s.botHeaveT = 0;
    s.errFlash = 0;
    s.trauma = 0;
    startLevel(s, 1);
}

// ---------- particle emitters (bounded) ----------
const PARTICLE_CAP = 120;

export function addParticle(s: TugState, p: Particle) {
    if (s.particles.length >= PARTICLE_CAP) s.particles.shift();
    s.particles.push(p);
}

/** Grass and dirt kicked up by braced heels. */
export function spawnDust(s: TugState, x: number, y: number, dir: number, n = 4) {
    for (let i = 0; i < n; i++) {
        addParticle(s, {
            kind: Math.random() < 0.3 ? "chip" : "dust",
            x, y: y + (Math.random() - 0.5) * 18,
            vx: dir * (40 + Math.random() * 150),
            vy: (Math.random() - 0.5) * 130,
            life: 0, ttl: 0.4 + Math.random() * 0.4,
            size: 3 + Math.random() * 6,
            color: Math.random() < 0.5 ? "#6b8f3a" : "#8a6a3b",
            rot: Math.random() * 6, vrot: (Math.random() - 0.5) * 12,
        });
    }
}

export function spawnSweat(s: TugState, x: number, y: number, dir: number) {
    for (let i = 0; i < 3; i++) {
        addParticle(s, {
            kind: "sweat",
            x, y: y - 10,
            vx: dir * (30 + Math.random() * 60), vy: -60 - Math.random() * 90,
            life: 0, ttl: 0.5 + Math.random() * 0.25,
            size: 3 + Math.random() * 2,
            color: "#bfe3ff",
            rot: 0, vrot: 0,
        });
    }
}

export function addSkid(s: TugState, x: number, y: number, side: Winner) {
    if (s.skids.length > 26) s.skids.shift();
    s.skids.push({
        x, y: y + (Math.random() - 0.5) * 26,
        len: 20 + Math.random() * 40,
        life: 0, ttl: 2.4, side,
    });
}
