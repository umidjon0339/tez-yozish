// =========================================================================
// 🛸 BEAM BREAK — simulation model (pure data + tuning, no React, no canvas).
//
// A cute animal is caught in a UFO's tractor beam. The beam pulls it up all
// the time; every correct key YANKS it back down, and finishing a word breaks
// the grip for a moment and shoves the whole world forward. Score is the
// DISTANCE travelled. Let the beam win and the animal is swallowed — one of
// 3 lives. Endless, with a new level every few words.
//
// ONE equation runs the whole game:
//     grab += pull * dt                (the beam, always winning)
//     grab -= keyYank                  (per correct key)
//     grab -= wordYank                 (per finished word)
// so holding your ground needs `pull / keyYank` keys per second. That is how
// the difficulties are tuned: EASY ≈ 12 WPM, MEDIUM ≈ 25 WPM, HARD ≈ 35 WPM.
//
// Coordinates: the animal is pinned to screen x `ANIMAL_X_FRAC`; the world
// scrolls past it. Anything with a `wx` lives in scroll space and is drawn at
// `wx - s.scrollPx`. Vertically there is no camera — the animal rides `grab`
// (0 = feet on the ground, 1 = inside the saucer) through `grabToY()`.
//
// NO SCREEN SHAKE ANYWHERE. This game has no `trauma` channel on purpose:
// every reaction is an eased colour/scale/glow change, never a jolt.
// =========================================================================

// ---------- geometry ----------
export const ANIMAL_X_FRAC = 0.24; // the animal's fixed screen x
export const GROUND_FRAC = 0.845; // screen y of the ground line
export const UFO_Y_FRAC = 0.175; // screen y of the saucer centre
export const PX_PER_M = 55; // scroll pixels per "metre" of distance

// ---------- the tug of war ----------
export const GRAB_START = 0.34; // where a run (and a rescue) begins
export const GRAB_RESPAWN = 0.3;
export const MISS_PULL = 0.055; // grab gained on a typo
export const SNARE_PULL = 0.2; // grab gained when a snare ring lands
export const MERCY_GRAB = 0.82; // above this the beam eases off (kid-friendly)
export const MERCY_FACTOR = 0.55;
export const COMBO_YANK_CAP = 0.3; // up to +30% yank on a long streak
// The beam keeps strengthening for ever: an endless game has to outpace even
// a fast typist eventually, or a good run never ends.
export const LEVEL_PULL_RAMP = 0.1; // beam gets this much stronger per level
export const LEVEL_PULL_CAP = 3.4;
export const WORDS_PER_LEVEL = 10;
export const TIER_EVERY = 2; // word pool grows one tier every N levels
export const LIFE_EVERY = 3; // +1 life (max 3) every N levels
export const MAX_LIVES = 3;
export const GOLD_EVERY = 7; // every Nth word is a golden word
export const IMMUNE_TIME = 1.7; // grace after a rescue
export const IDLE_NUDGE = 1.7; // seconds of silence before "keep typing!"

// ---------- how the animal MOVES (the polish knobs) ----------
// A correct key changes `grab` INSTANTLY — the rules and the abduction threshold
// need that. But the animal must never teleport, and it must not judder either:
// at 2 keys/second a raw `grab` is a sawtooth that steps down `keyYank` per key
// and drifts back up between them, which reads as a vibrating animal.
//
// So `grabView` (the only value the renderer draws) follows `grab` through a
// CRITICALLY DAMPED SPRING rather than an exponential ease. Two reasons:
//   • a spring starts from zero velocity, so there is no first-frame lurch —
//     an exponential ease moves furthest on the very first frame, which is
//     exactly the jolt we are trying to remove;
//   • at ω ≈ 6.6 rad/s the spring low-passes the per-keystroke sawtooth, so the
//     animal glides along the TREND of your typing instead of twitching once per
//     key. The per-key feedback is already carried by the tile going green, the
//     key sound, the spark burst and the beam pulse.
// `damping = 2 * sqrt(stiffness)` is the critical value: fast, and with no
// overshoot or bounce. Keep them in that relationship.
export const GRAB_STIFFNESS = 44;
export const GRAB_DAMPING = 13.3; // ≈ 2 * sqrt(44)
/** Largest spring sub-step, so a tab-switch `dt` can never destabilise it. */
export const GRAB_SUBSTEP = 1 / 120;
/** grab/second that counts as "full" squash or stretch. */
export const GRAB_VEL_FULL = 0.8;

// ---------- forward motion (the distance meter) ----------
export const SCROLL_MIN = 70; // px/s — the beam tows you along even when idle
export const SCROLL_PER_KPS = 95; // px/s per key-per-second you sustain
export const SCROLL_MAX = 540;
export const SCROLL_EASE = 2.6; // how fast scroll speed chases its target
export const WORD_SURGE = 150; // instant px/s kick when a word breaks the grip
export const KPS_TAU = 0.7; // seconds — smoothing window for the keys/sec EMA

// ---------- snare rings (the urgency beat) ----------
export const SNARE_MIN = 9; // seconds between snare rings
export const SNARE_MAX = 14;
export const SNARE_TELE = 0.95; // charge-up before it starts sliding down
export const SNARE_FALL = 2.3; // slide duration — beat it by finishing a word

// ---------- word pools ----------
// Tier 0 is single keys so Beam Break works as a first-week drill; the later
// tiers are the same kid vocabulary as the other games, space-flavoured.
const LETTERS = [
    "f", "j", "d", "k", "s", "l", "a", "g", "h", "e", "i", "r", "u", "t", "n",
    "o", "w", "c", "m", "v", "p", "b", "y", "x", "q", "z",
];
const SHORT_WORDS = [
    "run", "hop", "zap", "ray", "sky", "far", "cow", "pig", "cat", "dog", "owl",
    "bee", "fox", "sun", "map", "hat", "cup", "big", "top", "win", "yes", "fun",
    "net", "ten", "van", "zip", "ant", "egg", "ice", "jet", "key", "mud", "wet",
    "free", "away", "move", "jump", "dash", "safe", "home", "land", "dust",
    "beam", "ship", "star", "moon", "dark", "kite", "bird", "wind", "sand",
];
const MID_WORDS = [
    "escape", "rescue", "planet", "rocket", "saucer", "alien", "space", "orbit",
    "comet", "laser", "brave", "quick", "climb", "chase", "hurry", "strong",
    "desert", "camel", "tiger", "panda", "koala", "horse", "eagle", "zebra",
    "happy", "smile", "sunny", "windy", "storm", "cloud", "friend", "jungle",
    "gravity", "shadow", "signal", "engine", "tunnel", "canyon",
];
const LONG_WORDS = [
    "adventure", "abduction", "spaceship", "gravity", "telescope", "asteroid",
    "starlight", "moonlight", "elephant", "kangaroo", "porcupine", "crocodile",
    "butterfly", "flamingo", "chameleon", "hedgehog", "wilderness", "horizon",
    "countdown", "lightspeed", "freedom", "champion", "invisible", "magnetic",
    "wonderful", "dangerous", "tremendous", "adventurous",
];

export const WORD_TIERS = [LETTERS, SHORT_WORDS, MID_WORDS, LONG_WORDS];

export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export interface DifficultyConfig {
    /** grab gained per second — the beam. */
    pull: number;
    /** grab released per correct key. `pull / keyYank` = keys/sec to hold. */
    keyYank: number;
    /** extra grab released when a word is finished. */
    wordYank: number;
    startTier: number;
    /** first level that can spawn snare rings. */
    snareFrom: number;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
    // 0.100 / 0.100 = 1.0 keys/s ≈ 12 WPM to hold your ground
    EASY: { pull: 0.1, keyYank: 0.1, wordYank: 0.1, startTier: 0, snareFrom: 2 },
    // 0.155 / 0.075 = 2.07 keys/s ≈ 25 WPM
    MEDIUM: { pull: 0.155, keyYank: 0.075, wordYank: 0.09, startTier: 1, snareFrom: 1 },
    // 0.200 / 0.0685 = 2.92 keys/s ≈ 35 WPM
    HARD: { pull: 0.2, keyYank: 0.0685, wordYank: 0.08, startTier: 2, snareFrom: 1 },
};

// ==========================================
// ANIMALS — the roster. A random one is cast at the start of every run, so
// each go feels like a new rescue. The shapes are parametric: one body plan
// (round body, head, four legs, ears, snout, tail) plus the knobs below, so
// ten species cost one painter (`animals.ts`) instead of ten.
// ==========================================

export type AnimalKey =
    | "elephant" | "panda" | "fox" | "penguin" | "hippo"
    | "koala" | "piglet" | "bunny" | "cat" | "turtle";

export type EarShape = "round" | "point" | "floppy" | "tiny" | "long" | "tuft";
export type SnoutShape = "trunk" | "beak" | "wide" | "button" | "muzzle";
export type TailShape = "thin" | "fluff" | "curl" | "stub" | "none";
export type PatternKind = "none" | "panda" | "stripes" | "spots" | "shell" | "tuxedo";

export interface Species {
    /** Localised in the game's UI dict — see `BeamBreakWorld.tsx`. */
    key: AnimalKey;
    body: string;
    bodyDark: string;
    bodyLight: string;
    belly: string; // tummy patch + inner ear
    snoutColor: string;
    patternColor: string;
    ear: EarShape;
    snout: SnoutShape;
    tail: TailShape;
    pattern: PatternKind;
    bodyW: number; // × base body width
    bodyH: number; // × base body height
    headR: number; // × base head radius
    earSize: number;
    legLen: number;
    tusks: boolean;
}

export const SPECIES: Species[] = [
    {
        key: "elephant",
        body: "#9aa7b4", bodyDark: "#74818f", bodyLight: "#c2ccd6",
        belly: "#d9c8c4", snoutColor: "#9aa7b4", patternColor: "#7d8b99",
        ear: "round", snout: "trunk", tail: "thin", pattern: "none",
        bodyW: 1.1, bodyH: 1, headR: 0.94, earSize: 1.45, legLen: 1, tusks: true,
    },
    {
        key: "panda",
        body: "#f7f4ef", bodyDark: "#d8d2c8", bodyLight: "#ffffff",
        belly: "#ffffff", snoutColor: "#f7f4ef", patternColor: "#2f3238",
        ear: "round", snout: "button", tail: "stub", pattern: "panda",
        bodyW: 1.08, bodyH: 1.02, headR: 1, earSize: 0.85, legLen: 0.9, tusks: false,
    },
    {
        key: "fox",
        body: "#e8804a", bodyDark: "#c25f2e", bodyLight: "#f6a678",
        belly: "#fbf3e6", snoutColor: "#fbf3e6", patternColor: "#fbf3e6",
        ear: "point", snout: "muzzle", tail: "fluff", pattern: "none",
        bodyW: 1, bodyH: 0.92, headR: 0.9, earSize: 1.1, legLen: 1.05, tusks: false,
    },
    {
        key: "penguin",
        body: "#3b4552", bodyDark: "#252c36", bodyLight: "#586474",
        belly: "#fbfbf7", snoutColor: "#f5a63a", patternColor: "#fbfbf7",
        ear: "tiny", snout: "beak", tail: "stub", pattern: "tuxedo",
        bodyW: 0.86, bodyH: 1.12, headR: 0.86, earSize: 0.5, legLen: 0.6, tusks: false,
    },
    {
        key: "hippo",
        body: "#a58bb8", bodyDark: "#7f6892", bodyLight: "#c6afd6",
        belly: "#e0cfe9", snoutColor: "#c6afd6", patternColor: "#8f77a3",
        ear: "tiny", snout: "wide", tail: "thin", pattern: "none",
        bodyW: 1.2, bodyH: 0.94, headR: 1.02, earSize: 0.6, legLen: 0.78, tusks: false,
    },
    {
        key: "koala",
        body: "#a9b2ba", bodyDark: "#848d96", bodyLight: "#cdd5db",
        belly: "#e8edf0", snoutColor: "#4a5158", patternColor: "#8d969e",
        ear: "round", snout: "button", tail: "none", pattern: "none",
        bodyW: 1.02, bodyH: 1, headR: 1.04, earSize: 1.55, legLen: 0.86, tusks: false,
    },
    {
        key: "piglet",
        body: "#f5a8bb", bodyDark: "#d3808f", bodyLight: "#ffc9d6",
        belly: "#ffd9e2", snoutColor: "#e8859c", patternColor: "#e0929f",
        ear: "floppy", snout: "wide", tail: "curl", pattern: "none",
        bodyW: 1.06, bodyH: 0.94, headR: 0.94, earSize: 1, legLen: 0.82, tusks: false,
    },
    {
        key: "bunny",
        body: "#f0e6d8", bodyDark: "#cfc2b0", bodyLight: "#fdf7ee",
        belly: "#fffaf3", snoutColor: "#f4bfc6", patternColor: "#e5d8c6",
        ear: "long", snout: "button", tail: "fluff", pattern: "none",
        bodyW: 0.94, bodyH: 0.94, headR: 0.92, earSize: 1.9, legLen: 0.94, tusks: false,
    },
    {
        key: "cat",
        body: "#f0b26a", bodyDark: "#cd8c44", bodyLight: "#f8ce94",
        belly: "#fdf1de", snoutColor: "#fdf1de", patternColor: "#c9813c",
        ear: "point", snout: "muzzle", tail: "thin", pattern: "stripes",
        bodyW: 0.98, bodyH: 0.9, headR: 0.9, earSize: 1.05, legLen: 1, tusks: false,
    },
    {
        key: "turtle",
        body: "#7fbf72", bodyDark: "#5d9a52", bodyLight: "#a5d79a",
        belly: "#dcefcf", snoutColor: "#7fbf72", patternColor: "#3f7a4a",
        ear: "tiny", snout: "button", tail: "stub", pattern: "shell",
        bodyW: 1.16, bodyH: 0.8, headR: 0.8, earSize: 0.45, legLen: 0.62, tusks: false,
    },
];

// ==========================================
// SKIES — one palette per level, cycling. The video's world is a warm dune
// desert at sunrise; these walk it through a whole day and out the far side.
// ==========================================

export type PaletteKey = "dawn" | "day" | "sunset" | "dusk" | "night" | "aurora";

export interface Palette {
    key: PaletteKey;
    skyTop: string;
    skyMid: string;
    skyLow: string;
    sun: string;
    sunGlow: string;
    duneFar: string;
    duneNear: string;
    ground: string;
    groundDark: string;
    plant: string;
    plantDark: string;
    cloud: string;
    beam: string; // tractor-beam tint
    haze: string; // horizon wash
    night: boolean;
}

export const PALETTES: Palette[] = [
    {
        key: "dawn",
        skyTop: "#6fbde6", skyMid: "#a8dcf2", skyLow: "#e3f3fb",
        sun: "#f7c93f", sunGlow: "rgba(250,206,90,0.55)",
        duneFar: "#d9ab74", duneNear: "#c08d55",
        ground: "#e0bb87", groundDark: "#c49a64",
        plant: "#5aa758", plantDark: "#3f8043",
        cloud: "#ffffff", beam: "#8ef2a8", haze: "#fbe9c9", night: false,
    },
    {
        key: "day",
        skyTop: "#3f9ede", skyMid: "#82c9ef", skyLow: "#d3ecfb",
        sun: "#fff3b0", sunGlow: "rgba(255,246,190,0.5)",
        duneFar: "#cfa877", duneNear: "#b78c58",
        ground: "#ddba8b", groundDark: "#bf9a68",
        plant: "#44a04f", plantDark: "#2f7239",
        cloud: "#ffffff", beam: "#7fe8f5", haze: "#eaf6fd", night: false,
    },
    {
        key: "sunset",
        skyTop: "#e88a56", skyMid: "#f6b878", skyLow: "#ffe0b2",
        sun: "#ffd166", sunGlow: "rgba(255,168,80,0.55)",
        duneFar: "#c07c4e", duneNear: "#a3603a",
        ground: "#c98f5d", groundDark: "#a87046",
        plant: "#4a7a45", plantDark: "#335c36",
        cloud: "#ffe4c4", beam: "#ffd479", haze: "#ffd8a8", night: false,
    },
    {
        key: "dusk",
        skyTop: "#4a4a86", skyMid: "#8a6b9e", skyLow: "#e08b7d",
        sun: "#ffb98a", sunGlow: "rgba(255,150,110,0.45)",
        duneFar: "#6d5b86", duneNear: "#524368",
        ground: "#6f5a72", groundDark: "#57455a",
        plant: "#3c5a52", plantDark: "#2a4038",
        cloud: "#e6d4ef", beam: "#c39bf5", haze: "#f0b39c", night: false,
    },
    {
        key: "night",
        skyTop: "#0f1c3c", skyMid: "#1d3160", skyLow: "#3c5a82",
        sun: "#f2f6ff", sunGlow: "rgba(220,235,255,0.35)",
        duneFar: "#24365c", duneNear: "#182644",
        ground: "#2c3a52", groundDark: "#1f2c40",
        plant: "#1f4038", plantDark: "#152c26",
        cloud: "#9fb4d4", beam: "#6ff2c8", haze: "#4a6690", night: true,
    },
    {
        key: "aurora",
        skyTop: "#0d2b34", skyMid: "#18514f", skyLow: "#3c8878",
        sun: "#d9fff2", sunGlow: "rgba(160,255,220,0.35)",
        duneFar: "#1d4a4c", duneNear: "#143638",
        ground: "#24484a", groundDark: "#183436",
        plant: "#1d5a4a", plantDark: "#123c32",
        cloud: "#b7f0e2", beam: "#a6ff8f", haze: "#63c9a8", night: true,
    },
];

// ==========================================
// ENTITIES
// ==========================================

export type ParticleKind = "spark" | "dust" | "shard" | "ring" | "star" | "leaf";

export interface Particle {
    kind: ParticleKind;
    /** scroll-space x for world particles, screen x for beam particles. */
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
    /** true = `wx` is a screen x that does not scroll (beam sparks). */
    fixed: boolean;
}

/** Ambient bird / kite / tumbleweed drifting through the scene. */
export type DriftKind = "bird" | "kite" | "weed";

export interface Drift {
    kind: DriftKind;
    wx: number;
    y: number;
    vx: number;
    phase: number;
    scale: number;
    hue: number;
}

/** The UFO's capture ring: charges, then slides down the beam. */
export interface Snare {
    phase: "tele" | "fall" | "burst" | "land";
    t: number;
    p: number; // 0..1 down the beam
    flash: number;
}

/** A level marker planted on the ground; scrolls past as proof of progress. */
export interface Sign {
    wx: number;
    level: number;
}

export type Phase = "idle" | "countdown" | "playing" | "abducted" | "over";

export interface BeamBreakState {
    cfg: DifficultyConfig;
    phase: Phase;
    countdown: number;

    // cast
    animal: number; // index into SPECIES — re-rolled every run
    palette: number; // index into PALETTES

    // the tug of war
    grab: number; // 0 = feet on the ground, 1 = swallowed — the LOGICAL value
    grabVel: number; // current beam strength (grab/second)
    /**
     * The eased follower of `grab`, and the ONLY one the renderer may read.
     * See `GRAB_VIEW_EASE` — this is what keeps the animal's motion smooth
     * when `grab` steps down on every keystroke.
     */
    grabView: number;
    /** Smoothed velocity of `grabView`; drives squash/stretch and body lean. */
    grabVelView: number;
    lives: number;
    immune: number;

    // forward motion
    scrollPx: number; // total pixels scrolled (world x origin)
    scrollV: number; // current px/s
    distance: number; // metres — the headline score
    keyRate: number; // smoothed keys/sec (drives scrollV)

    // typing
    word: string;
    typed: number;
    gold: boolean;
    nextWord: string;
    wordAge: number; // seconds since the word appeared (tile intro anim)
    idleT: number;

    // entities
    particles: Particle[];
    drifts: Drift[];
    signs: Sign[];
    snare: Snare | null;
    snareTimer: number;

    // progression / score
    level: number;
    wordsTyped: number;
    score: number;
    combo: number;
    bestCombo: number;
    goldWords: number;
    snaresBroken: number;
    correctKeystrokes: number;
    totalKeystrokes: number;
    runTimeMs: number;

    // feel channels — read by the renderer only. NO SCREEN SHAKE: every one of
    // these is an eased scale/colour/glow, never a position jolt.
    yank: number; // 0..1 flash of downward effort, decays
    errFlash: number;
    goldFlash: number;
    freeFlash: number; // the moment a word breaks the grip
    levelBanner: number;
    alienT: number; // alien leaning out with the "Level N" bubble
    abductT: number;
    rescueT: number;
    beamPulse: number;
    panic: number; // 0..1 eased from `grab` — drives the face
    blink: number;
    kick: number; // leg-pedalling phase
    t: number; // seconds of wall clock while mounted
}

// ==========================================
// HELPERS
// ==========================================

export function pickWord(pool: string[], avoid: string): string {
    let w = pool[Math.floor(Math.random() * pool.length)];
    for (let guard = 0; guard < 6 && w === avoid; guard++) {
        w = pool[Math.floor(Math.random() * pool.length)];
    }
    return w;
}

export function tierFor(s: BeamBreakState): number {
    return Math.min(WORD_TIERS.length - 1, s.cfg.startTier + Math.floor(s.level / TIER_EVERY));
}

export function poolFor(s: BeamBreakState): string[] {
    return WORD_TIERS[tierFor(s)];
}

/** Golden words come from one tier up — longer, worth double. */
export function goldPoolFor(s: BeamBreakState): string[] {
    return WORD_TIERS[Math.min(WORD_TIERS.length - 1, tierFor(s) + 1)];
}

export function paletteFor(level: number): Palette {
    return PALETTES[level % PALETTES.length];
}

export function speciesOf(s: BeamBreakState): Species {
    return SPECIES[s.animal % SPECIES.length];
}

/** Is the word we are about to serve a golden one? */
export function isGoldWord(wordsTyped: number): boolean {
    return wordsTyped > 0 && (wordsTyped + 1) % GOLD_EVERY === 0;
}

/** Serve the queued word and queue the next one. */
export function advanceWord(s: BeamBreakState) {
    s.word = s.nextWord;
    s.gold = isGoldWord(s.wordsTyped);
    s.typed = 0;
    s.wordAge = 0;
    const nextGold = isGoldWord(s.wordsTyped + 1);
    s.nextWord = pickWord(nextGold ? goldPoolFor(s) : poolFor(s), s.word);
}

/** Effective beam strength right now (level ramp + mercy near the saucer). */
export function pullNow(s: BeamBreakState): number {
    const levelMul = Math.min(LEVEL_PULL_CAP, 1 + s.level * LEVEL_PULL_RAMP);
    const mercy = s.grab > MERCY_GRAB ? MERCY_FACTOR : 1;
    return s.cfg.pull * levelMul * mercy;
}

/** Bonus yank from the current streak, capped. */
export function comboBonus(s: BeamBreakState): number {
    return Math.min(COMBO_YANK_CAP, Math.floor(s.combo / 8) * 0.08);
}

/** Keys per second the player must sustain right now just to hold station. */
export function holdKps(s: BeamBreakState): number {
    return pullNow(s) / (s.cfg.keyYank * (1 + comboBonus(s)));
}

export function getInitialState(): BeamBreakState {
    const s: BeamBreakState = {
        cfg: DIFFICULTY_CONFIG.MEDIUM,
        phase: "idle",
        countdown: 0,
        animal: Math.floor(Math.random() * SPECIES.length),
        palette: 0,
        grab: GRAB_START,
        grabVel: 0,
        grabView: GRAB_START,
        grabVelView: 0,
        lives: MAX_LIVES,
        immune: 0,
        scrollPx: 0,
        scrollV: SCROLL_MIN,
        distance: 0,
        keyRate: 0,
        word: "",
        typed: 0,
        gold: false,
        nextWord: "",
        wordAge: 0,
        idleT: 0,
        particles: [],
        drifts: [],
        signs: [],
        snare: null,
        snareTimer: SNARE_MIN,
        level: 0,
        wordsTyped: 0,
        score: 0,
        combo: 0,
        bestCombo: 0,
        goldWords: 0,
        snaresBroken: 0,
        correctKeystrokes: 0,
        totalKeystrokes: 0,
        runTimeMs: 0,
        yank: 0,
        errFlash: 0,
        goldFlash: 0,
        freeFlash: 0,
        levelBanner: 0,
        alienT: 0,
        abductT: 0,
        rescueT: 0,
        beamPulse: 0,
        panic: 0,
        blink: 0,
        kick: 0,
        t: 0,
    };
    s.nextWord = pickWord(WORD_TIERS[1], "");
    advanceWord(s);
    s.wordsTyped = 0;
    return s;
}

export function resetRun(s: BeamBreakState, diff: Difficulty) {
    s.cfg = DIFFICULTY_CONFIG[diff];
    s.phase = "countdown";
    s.countdown = 3.1;
    // a fresh animal every run — that is the "who am I saving today?" hook
    s.animal = Math.floor(Math.random() * SPECIES.length);
    s.palette = 0;
    s.grab = GRAB_START;
    s.grabVel = 0;
    // snap, never ease, out of a stale position
    s.grabView = GRAB_START;
    s.grabVelView = 0;
    s.lives = MAX_LIVES;
    s.immune = 0;
    s.scrollPx = 0;
    s.scrollV = SCROLL_MIN;
    s.distance = 0;
    s.keyRate = 0;
    s.typed = 0;
    s.gold = false;
    s.wordAge = 0;
    s.idleT = 0;
    s.particles = [];
    s.drifts = [];
    s.signs = [];
    s.snare = null;
    s.snareTimer = SNARE_MIN * 0.75;
    s.level = 0;
    s.wordsTyped = 0;
    s.score = 0;
    s.combo = 0;
    s.bestCombo = 0;
    s.goldWords = 0;
    s.snaresBroken = 0;
    s.correctKeystrokes = 0;
    s.totalKeystrokes = 0;
    s.runTimeMs = 0;
    s.yank = 0;
    s.errFlash = 0;
    s.goldFlash = 0;
    s.freeFlash = 0;
    s.levelBanner = 0;
    s.alienT = 0;
    s.abductT = 0;
    s.rescueT = 0;
    s.beamPulse = 0;
    s.panic = 0;
    s.nextWord = pickWord(poolFor(s), "");
    advanceWord(s);
    s.wordsTyped = 0;
}

// ==========================================
// PARTICLE EMITTERS — all bounded (see CLAUDE.md)
// ==========================================

const PARTICLE_CAP = 170;

export function addParticle(s: BeamBreakState, p: Particle) {
    if (s.particles.length >= PARTICLE_CAP) s.particles.shift();
    s.particles.push(p);
}

/** Downward spark trail on every correct key — the animal pulling free. */
export function spawnYank(s: BeamBreakState, x: number, y: number, color: string, n = 3) {
    for (let i = 0; i < n; i++) {
        addParticle(s, {
            kind: "spark", wx: x + (Math.random() - 0.5) * 26, y,
            vx: (Math.random() - 0.5) * 60,
            vy: 150 + Math.random() * 190,
            life: 0, ttl: 0.34 + Math.random() * 0.22,
            size: 3 + Math.random() * 3.5, color,
            rot: 0, vrot: 0, fixed: true,
        });
    }
}

/** Puff of ground dust — a landing or a sprint. */
export function spawnDust(s: BeamBreakState, wx: number, y: number, n = 8) {
    for (let i = 0; i < n; i++) {
        addParticle(s, {
            kind: "dust", wx, y,
            vx: -70 - Math.random() * 150,
            vy: -20 - Math.random() * 70,
            life: 0, ttl: 0.5 + Math.random() * 0.4,
            size: 6 + Math.random() * 10, color: "#ffffff",
            rot: 0, vrot: 0, fixed: false,
        });
    }
}

/** Golden-word shower. */
export function spawnSparkle(s: BeamBreakState, x: number, y: number, n = 14) {
    for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 80 + Math.random() * 200;
        addParticle(s, {
            kind: "star", wx: x, y,
            vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 50,
            life: 0, ttl: 0.6 + Math.random() * 0.45,
            size: 3.5 + Math.random() * 4.5,
            color: i % 3 === 0 ? "#fff8d0" : "#ffd23f",
            rot: Math.random() * 6, vrot: (Math.random() - 0.5) * 12,
            fixed: true,
        });
    }
}

/** A snare ring shattering into glassy shards. */
export function spawnRingBurst(s: BeamBreakState, x: number, y: number, color: string) {
    for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2 + Math.random() * 0.3;
        const sp = 130 + Math.random() * 180;
        addParticle(s, {
            kind: "shard", wx: x, y,
            vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            life: 0, ttl: 0.45 + Math.random() * 0.3,
            size: 4 + Math.random() * 5, color,
            rot: Math.random() * 6, vrot: (Math.random() - 0.5) * 16,
            fixed: true,
        });
    }
}

/** Shockwave ring — used for the free-break and the abduction. */
export function spawnShock(s: BeamBreakState, x: number, y: number, color: string) {
    addParticle(s, {
        kind: "ring", wx: x, y, vx: 0, vy: 0,
        life: 0, ttl: 0.42, size: 14, color,
        rot: 0, vrot: 0, fixed: true,
    });
}

/** Spawn an ambient drifter somewhere ahead of the camera. */
export function spawnDrift(s: BeamBreakState, kind: DriftKind, W: number, H: number) {
    const groundY = H * GROUND_FRAC;
    if (kind === "weed") {
        s.drifts.push({
            kind, wx: s.scrollPx + W + 60, y: groundY - 4,
            vx: -40 - Math.random() * 70, phase: Math.random() * 6,
            scale: 0.7 + Math.random() * 0.6, hue: 0,
        });
        return;
    }
    s.drifts.push({
        kind,
        wx: s.scrollPx + W + 80,
        y: H * (kind === "bird" ? 0.14 + Math.random() * 0.34 : 0.1 + Math.random() * 0.3),
        vx: -(kind === "bird" ? 55 + Math.random() * 60 : 20 + Math.random() * 30),
        phase: Math.random() * 6,
        scale: 0.75 + Math.random() * 0.6,
        hue: Math.floor(Math.random() * 5),
    });
}
