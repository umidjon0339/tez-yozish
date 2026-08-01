// =========================================================================
// 🛰️ STAR TYPE — simulation model (pure data + tuning, no React, no canvas).
//
// A faithful re-build of the ZType arcade loop:
//
//   • Enemy drones fall toward your ship, each carrying one word.
//   • Type a word's FIRST letter to LOCK ON to that drone. From then on every
//     key must be the next letter of that word — each correct one fires a bolt.
//     Finish the word and the drone dies.
//   • One drone reaching your ship ends the run. There are no lives, no
//     power-ups, no shields: the wave ramp is the entire difficulty model.
//
// Deliberately NOT here (the reference game has none of them, and the brief was
// to copy it, not to extend it): difficulty picker, lives, health bar, combo
// multiplier, special pods, screen-clearing moves, in-run score read-out.
//
// Coordinates: no scrolling and no camera. Everything is screen space — drones
// fall from `SPAWN_Y` toward the ship at (`Layout.shipX`, `Layout.shipY`).
// The original is a portrait phone game; this one is laid out for a full
// landscape window, which is why drones spawn across the whole width and
// converge into a cone rather than dropping down a narrow lane.
// =========================================================================

// ---------- geometry ----------
export const SHIP_Y_FRAC = 0.86; // screen y of the ship
export const SPAWN_Y = -60; // drones are born this far above the top edge
export const SIDE_MARGIN = 0.05; // …and never inside this much of an edge
/** A drone this close to the ship destroys it. */
export const KILL_RADIUS = 34;
/** Drones aim at a point this far either side of the ship, so they fan in. */
export const CONVERGE_SPREAD = 0.16;

// ---------- the wave ramp — the ONLY difficulty model ----------
export const WAVE_BASE_COUNT = 8; // drones in wave 1
export const WAVE_COUNT_STEP = 2; // …plus this many per wave
export const WAVE_COUNT_CAP = 26;
export const WAVE_BASE_SPEED = 26; // px/s at scale 1 in wave 1
export const WAVE_SPEED_RAMP = 0.13; // …+13% per wave
export const WAVE_SPEED_CAP = 115;
export const WAVE_BASE_GAP = 1.5; // seconds between releases in wave 1
export const WAVE_GAP_DECAY = 0.9;
export const WAVE_GAP_MIN = 0.42;
/** Beat between clearing a wave and the next one starting. */
export const WAVE_BREAK = 2.2;

// ---------- bolts ----------
export const BOLT_SPEED = 2000; // px/s at scale 1
export const BOLT_LIFE = 1.1; // hard cap, so a bolt can never be orphaned

// ---------- drones ----------
export const DRONE_BASE_R = 9; // radius grows with the word length
export const DRONE_R_PER_CHAR = 1.15;
export const DRONE_SWAY = 0.5; // px/s² of lazy lateral drift

export const SHIP_DEATH_TIME = 1.9; // seconds of the death beat before the card

// ==========================================
// WORDS — kid vocabulary, bucketed by length. The wave decides which buckets
// can appear, so words get longer as the run goes on (exactly like the
// reference, which mixes "raw" and "inserting" in the same wave once you are
// deep enough).
// ==========================================

const W3 = [
    "raw", "pair", "air", "arm", "bat", "bed", "big", "box", "boy", "bus", "cat",
    "cup", "cut", "day", "dog", "dry", "ear", "eat", "egg", "end", "eye", "far",
    "few", "fly", "fun", "gas", "hat", "hit", "hot", "ice", "job", "key", "leg",
    "let", "map", "net", "new", "now", "oil", "old", "one", "out", "own", "pen",
    "pig", "put", "red", "run", "sea", "see", "sit", "six", "sky", "sun", "ten",
    "top", "toy", "try", "two", "use", "war", "way", "wet", "win", "yes", "zip",
];
const W4 = [
    "able", "away", "back", "ball", "bank", "base", "bear", "beat", "bell", "best",
    "bird", "bite", "blue", "boat", "body", "bone", "book", "burn", "busy", "calm",
    "card", "care", "cell", "city", "clay", "cold", "cool", "corn", "dark", "deep",
    "desk", "door", "down", "draw", "drop", "dust", "each", "east", "easy", "edge",
    "even", "fact", "fall", "fast", "fire", "fish", "flag", "flow", "food", "foot",
    "form", "four", "free", "from", "gate", "gift", "girl", "give", "glad", "goal",
    "gold", "good", "grow", "hand", "hard", "head", "hear", "help", "here", "high",
    "hill", "hold", "home", "hope", "hour", "idea", "iron", "join", "jump", "keep",
    "kind", "king", "know", "lain", "lake", "land", "last", "leaf", "left", "life",
    "lift", "like", "line", "lion", "list", "long", "look", "loud", "love", "luck",
    "made", "mail", "main", "make", "many", "mark", "melt", "mind", "mode", "moon",
    "more", "most", "move", "name", "near", "need", "nest", "next", "nice", "note",
    "open", "over", "page", "park", "part", "past", "path", "pick", "plan", "play",
    "poem", "pull", "push", "rain", "read", "real", "rest", "ride", "ring", "road",
    "rock", "role", "roof", "room", "root", "rope", "rose", "rule", "safe", "sail",
    "salt", "same", "sand", "save", "seed", "seek", "sell", "send", "ship", "shop",
    "show", "side", "sign", "size", "skin", "slow", "snow", "soft", "song", "soon",
    "sort", "soup", "star", "stay", "step", "stop", "sure", "swim", "tail", "take",
    "talk", "tall", "team", "tell", "test", "than", "that", "them", "then", "they",
    "this", "time", "tiny", "tree", "true", "turn", "type", "unit", "used", "very",
    "view", "wait", "walk", "wall", "want", "warm", "wash", "wave", "wear", "week",
    "well", "went", "were", "what", "when", "wide", "wild", "will", "wind", "wing",
    "wise", "wish", "wood", "word", "work", "yard", "year", "your", "zero", "zone",
];
const W5 = [
    "about", "above", "after", "again", "alarm", "alive", "alone", "along", "apple",
    "beach", "began", "being", "below", "birds", "bites", "black", "blank", "blaze",
    "blind", "block", "blood", "board", "brain", "brave", "bread", "break", "brick",
    "bring", "broad", "brown", "brush", "build", "burst", "cabin", "candy", "carry",
    "catch", "cause", "chain", "chair", "chalk", "charm", "chart", "chase", "check",
    "chest", "chief", "child", "claim", "class", "clean", "clear", "climb", "clock",
    "close", "cloud", "coast", "color", "could", "count", "cover", "crash", "cream",
    "cross", "crowd", "crown", "daily", "dance", "delay", "dream", "dress", "drink",
    "drive", "eager", "early", "earth", "eight", "empty", "enemy", "enjoy", "enter",
    "equal", "event", "every", "exact", "faith", "false", "fault", "field", "fight",
    "final", "first", "flame", "flash", "float", "floor", "focus", "force", "forest",
    "frame", "fresh", "front", "fruit", "funny", "giant", "glass", "globe", "grade",
    "grand", "grass", "great", "green", "group", "guard", "guess", "guide", "happy",
    "heart", "heavy", "horse", "hotel", "house", "human", "ideal", "image", "index",
    "inner", "issue", "japan", "juice", "known", "large", "later", "laugh", "layer",
    "learn", "leave", "legal", "level", "light", "limit", "local", "logic", "lucky",
    "magic", "major", "maker", "march", "match", "maybe", "mercy", "metal", "might",
    "minor", "money", "month", "moral", "mouse", "mouth", "music", "never", "night",
    "noise", "north", "novel", "nurse", "ocean", "offer", "often", "onion", "order",
    "other", "outer", "owner", "paint", "panel", "paper", "party", "peace", "phase",
    "phone", "photo", "piece", "pilot", "pitch", "place", "plain", "plane", "plant",
    "plate", "point", "power", "press", "price", "pride", "prime", "prize", "proof",
    "proud", "prove", "queen", "quick", "quiet", "quite", "radio", "raise", "range",
    "rapid", "reach", "ready", "refer", "relax", "reply", "rider", "right", "risky",
    "river", "robot", "rough", "round", "route", "royal", "rural", "scale", "scene",
    "score", "sense", "serve", "seven", "shade", "shall", "shape", "share", "sharp",
    "sheet", "shelf", "shell", "shift", "shine", "shirt", "shock", "shoot", "shore",
    "short", "sight", "since", "skill", "sleep", "slice", "slide", "small", "smart",
    "smile", "smoke", "snake", "solar", "solid", "solve", "sound", "south", "space",
    "spare", "speak", "speed", "spend", "spent", "spice", "spill", "split", "spoke",
    "sport", "staff", "stage", "stair", "stand", "start", "state", "steam", "steel",
    "steep", "stick", "still", "stone", "stood", "store", "storm", "story", "stove",
    "study", "stuff", "style", "sugar", "sunny", "swept", "sweet", "swing", "table",
    "taken", "taste", "teach", "teeth", "thank", "theme", "there", "these", "thick",
    "thing", "think", "third", "those", "three", "throw", "tiger", "tight", "tired",
    "title", "today", "token", "tooth", "topic", "total", "touch", "tough", "tower",
    "trace", "track", "trade", "trail", "train", "treat", "trend", "trial", "tribe",
    "trick", "truck", "trust", "truth", "twice", "uncle", "under", "union", "unite",
    "until", "upper", "upset", "urban", "usual", "value", "video", "visit", "voice",
    "waste", "watch", "water", "wheel", "where", "which", "while", "white", "whole",
    "whose", "woman", "world", "worry", "worse", "worth", "would", "wound", "wrist",
    "write", "wrong", "young",
];
const W7 = [
    "across", "action", "advice", "afford", "agreed", "almost", "always", "amount",
    "animal", "answer", "appear", "around", "arrive", "artist", "aspect", "asleep",
    "attack", "author", "autumn", "backup", "banner", "basket", "battle", "beacon",
    "beauty", "become", "before", "behind", "belong", "better", "beyond", "bishop",
    "border", "bottle", "bottom", "bought", "branch", "breath", "bridge", "bright",
    "broken", "bucket", "budget", "bullet", "bureau", "butter", "camera", "cancel",
    "candle", "canyon", "carbon", "career", "castle", "casual", "center", "chance",
    "change", "charge", "cheese", "choice", "choose", "circle", "closed", "coffee",
    "column", "combat", "coming", "common", "copper", "corner", "cotton", "county",
    "couple", "course", "cousin", "create", "credit", "custom", "damage", "danger",
    "dealer", "debate", "decade", "decide", "defeat", "defend", "degree", "demand",
    "depend", "desert", "design", "desire", "detail", "detect", "device", "differ",
    "dinner", "direct", "doctor", "dollar", "domain", "double", "driver", "during",
    "easier", "editor", "effect", "effort", "eighth", "either", "eleven", "empire",
    "employ", "enable", "ending", "energy", "engine", "enough", "ensure", "entire",
    "escape", "estate", "ethics", "excess", "expand", "expect", "expert", "export",
    "extend", "extent", "fabric", "factor", "family", "famous", "farmer", "fasten",
    "father", "feeder", "fellow", "female", "figure", "filter", "finger", "finish",
    "fiscal", "flight", "flying", "follow", "forest", "forget", "formal", "format",
    "former", "fossil", "foster", "fought", "fourth", "france", "freeze", "french",
    "friend", "frozen", "future", "galaxy", "garage", "garden", "gather", "gentle",
    "german", "global", "golden", "govern", "ground", "growth", "guilty", "handle",
    "happen", "hardly", "hazard", "headed", "health", "hidden", "holder", "honest",
    "horror", "hunter", "hybrid", "ignore", "impact", "import", "income", "indeed",
    "injury", "inside", "intend", "invest", "island", "itself", "jacket", "jungle",
    "junior", "killer", "kitten", "ladder", "latest", "launch", "lawyer", "leader",
    "league", "legacy", "length", "lesson", "letter", "listen", "little", "living",
    "locate", "lonely", "lovely", "makeup", "manage", "manner", "manual", "margin",
    "marine", "market", "master", "matter", "medium", "member", "memory", "mental",
    "method", "middle", "miller", "mining", "minute", "mirror", "mobile", "modern",
    "modest", "module", "moment", "monkey", "mostly", "mother", "motion", "moving",
    "murder", "museum", "mutual", "myself", "narrow", "nation", "native", "nature",
    "nearby", "nearly", "needle", "nights", "nobody", "normal", "notice", "notion",
    "number", "object", "obtain", "occupy", "office", "offset", "online", "option",
    "orange", "origin", "output", "oxford", "packet", "palace", "parent", "partly",
    "patrol", "pencil", "people", "period", "permit", "person", "phrase", "picked",
    "picnic", "planet", "player", "please", "plenty", "pocket", "poetry", "police",
    "policy", "polish", "prefer", "pretty", "prince", "prison", "profit", "proper",
    "public", "purple", "pursue", "puzzle", "quotes", "rabbit", "racing", "radius",
    "random", "rarely", "rather", "rating", "reader", "really", "reason", "recall",
    "recent", "record", "reduce", "reform", "refuse", "regard", "regime", "region",
    "relate", "relief", "remain", "remote", "remove", "repair", "repeat", "report",
    "rescue", "resist", "resort", "result", "retail", "retain", "retire", "return",
    "reveal", "review", "reward", "riding", "rising", "rocket", "ruling", "runner",
    "safety", "salmon", "sample", "saving", "saying", "school", "screen", "script",
    "search", "season", "second", "secret", "sector", "secure", "seeing", "select",
    "seller", "senior", "series", "server", "settle", "severe", "shadow", "shaped",
    "shared", "shield", "should", "shower", "signal", "silent", "silver", "simple",
    "simply", "singer", "single", "sister", "sitting", "sketch", "slight", "smooth",
    "social", "socket", "soften", "solved", "sooner", "source", "soviet", "speech",
    "sphere", "spirit", "spread", "spring", "square", "stable", "status", "steady",
    "stolen", "stream", "street", "stress", "strict", "strike", "string", "strong",
    "struck", "studio", "stupid", "submit", "subtle", "suburb", "sudden", "suffer",
    "summer", "summit", "supply", "surely", "survey", "switch", "symbol", "system",
    "taking", "talent", "target", "taught", "temple", "tender", "tennis", "thanks",
    "theory", "thirty", "though", "threat", "thrown", "ticket", "timber", "timing",
    "tissue", "toward", "travel", "treaty", "tribal", "trophy", "tunnel", "turkey",
    "twelve", "twenty", "unable", "unfair", "unique", "united", "unless", "unlike",
    "update", "useful", "valley", "varied", "vendor", "versus", "victim", "viewer",
    "vision", "visual", "volume", "voting", "wander", "wealth", "weapon", "weekly",
    "weight", "wholly", "window", "winner", "winter", "wisdom", "wonder", "wooden",
    "worker", "wright", "writer", "yellow",
];
const W9 = [
    "starting", "inserting", "adventure", "afternoon", "agreement", "ambulance",
    "apartment", "architect", "assistant", "attention", "beautiful", "beginning",
    "believing", "boundary", "brilliant", "broadcast", "calculate", "carefully",
    "celebrate", "challenge", "character", "chocolate", "christmas", "classroom",
    "colleague", "collector", "community", "companion", "component", "computer",
    "concerned", "condition", "confirmed", "connected", "considered", "container",
    "continent", "continued", "corporate", "countries", "customers", "dangerous",
    "database", "december", "decision", "delivered", "democracy", "described",
    "designer", "developed", "different", "difficult", "direction", "discovery",
    "dismissed", "distance", "diversity", "dominated", "downtown", "dramatic",
    "education", "effective", "elephant", "eliminate", "emergency", "emphasis",
    "employees", "encourage", "engineer", "equipment", "essential", "establish",
    "estimated", "everybody", "everyone", "excellent", "exchange", "excitement",
    "exercise", "existence", "expensive", "explained", "extension", "extremely",
    "fantastic", "favourite", "financial", "following", "formation", "fortunate",
    "framework", "frequency", "furniture", "generated", "generous", "gentleman",
    "gradually", "guarantee", "happiness", "hardware", "highlight", "highway",
    "hospital", "household", "identify", "importance", "impressed", "including",
    "increased", "indicated", "influence", "informed", "initially", "innocent",
    "insurance", "interest", "internal", "invisible", "invitation", "knowledge",
    "landscape", "language", "laughter", "leadership", "learning", "lightning",
    "listening", "literature", "machinery", "magazine", "magnetic", "maintain",
    "marketing", "marriage", "material", "meanwhile", "mechanism", "medicine",
    "memorable", "mentioned", "microwave", "midnight", "military", "millions",
    "minimum", "ministry", "moderate", "molecule", "monitored", "motivate",
    "mountain", "movement", "musician", "narrative", "necessary", "negative",
    "neighbour", "newspaper", "nineteen", "nonsense", "northern", "notebook",
    "objective", "observed", "obviously", "occasion", "operation", "opponent",
    "opportunity", "organized", "otherwise", "overnight", "paragraph", "parallel",
    "particular", "passenger", "patiently", "perfectly", "performed", "permanent",
    "personal", "persuade", "physical", "pipeline", "planning", "pleasant",
    "political", "portrait", "positive", "possible", "potential", "practical",
    "precisely", "predicted", "pregnant", "presented", "president", "pressure",
    "primarily", "principle", "printing", "priority", "probably", "processing",
    "produced", "professor", "programme", "progress", "promised", "property",
    "proposal", "protected", "provided", "publisher", "purchase", "qualified",
    "quantity", "questions", "radiation", "reaction", "realistic", "recognize",
    "recording", "recovery", "reference", "reflected", "regarding", "register",
    "regularly", "relations", "religious", "remaining", "remember", "reminded",
    "reporter", "represent", "reputation", "requested", "required", "research",
    "resident", "resources", "response", "restored", "returning", "revealed",
    "revenue", "sacrifice", "satellite", "satisfied", "scattered", "schedule",
    "scientist", "secretary", "selection", "sensitive", "sentence", "separate",
    "sequence", "seriously", "settlement", "shoulder", "signature", "similar",
    "situation", "slightly", "smallest", "software", "solution", "somebody",
    "something", "sometimes", "southern", "specific", "spectrum", "standard",
    "statement", "stationary", "statistic", "strategy", "strength", "structure",
    "struggle", "students", "submitted", "substance", "successful", "suddenly",
    "sufficient", "suggested", "suitable", "supplied", "surprise", "surrounded",
    "sustained", "swimming", "sympathy", "technical", "telephone", "television",
    "temporary", "territory", "therefore", "thickness", "thinking", "thorough",
    "thousand", "threshold", "throughout", "tomorrow", "tradition", "transfer",
    "transport", "treatment", "triangle", "tropical", "typically", "ultimate",
    "umbrella", "underline", "understand", "universe", "unusually", "vacation",
    "valuable", "variation", "vegetable", "vehicles", "victoria", "violence",
    "volunteer", "warning", "watching", "wednesday", "wellbeing", "whatever",
    "whenever", "wherever", "whichever", "wonderful", "workshop", "worldwide",
    "yesterday", "yourself",
];

/** Word buckets, shortest first. `bucketsFor(wave)` decides which can appear. */
export const WORD_BUCKETS = [W3, W4, W5, W7, W9];

/**
 * How many buckets are unlocked at `wave`, and how the picks are weighted.
 * Wave 1 is all short words; by wave 8 the whole vocabulary is in play, with
 * the long ones still rarer than the short ones — the same feel as the
 * reference, where "raw" and "inserting" share a screen late on.
 */
export function pickWord(wave: number, avoid: Set<string>): string {
    const unlocked = Math.min(WORD_BUCKETS.length, 2 + Math.floor(wave / 2));
    for (let guard = 0; guard < 24; guard++) {
        // bias toward the shorter buckets: two rolls, keep the smaller
        const a = Math.floor(Math.random() * unlocked);
        const b = Math.floor(Math.random() * unlocked);
        const bucket = WORD_BUCKETS[Math.min(a, b)];
        const w = bucket[Math.floor(Math.random() * bucket.length)];
        // Two live words must never share a first letter: the first key is what
        // picks a target, so a duplicate initial would make the lock ambiguous.
        if (!avoid.has(w[0])) return w;
    }
    // every initial is taken — let the caller live with it rather than hang
    const bucket = WORD_BUCKETS[Math.floor(Math.random() * unlocked)];
    return bucket[Math.floor(Math.random() * bucket.length)];
}

// ---------- wave maths ----------

export function waveCount(wave: number): number {
    return Math.min(WAVE_COUNT_CAP, WAVE_BASE_COUNT + wave * WAVE_COUNT_STEP);
}

export function waveSpeed(wave: number): number {
    return Math.min(WAVE_SPEED_CAP, WAVE_BASE_SPEED * (1 + wave * WAVE_SPEED_RAMP));
}

export function waveGap(wave: number): number {
    return Math.max(WAVE_GAP_MIN, WAVE_BASE_GAP * Math.pow(WAVE_GAP_DECAY, wave));
}

// ==========================================
// ENTITIES
// ==========================================

export interface Drone {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    word: string;
    /** How many characters of `word` are already typed. */
    typed: number;
    /** Radius in layout units — grows with the word length. */
    r: number;
    /** Phase of the lazy lateral drift. */
    sway: number;
    spin: number;
    /** 0→1 fade-in as it comes on screen. */
    born: number;
    /** Decaying flash from the last bolt that hit it. */
    hit: number;
    /**
     * The word is finished and the killing bolt is in flight. A doomed drone
     * still flies and is still drawn, but it can no longer destroy the ship —
     * being killed by something you already typed out would read as a cheat.
     */
    doomed: boolean;
    /** Bolts still on their way to this drone. */
    incoming: number;
    /** Which side the word label hangs on: -1 left, +1 right. */
    labelSide: number;
}

export interface Bolt {
    x: number;
    y: number;
    vx: number;
    vy: number;
    target: number; // drone id
    /** Distance still to travel; the bolt lands when this hits 0. */
    remain: number;
    life: number;
    /** True if this is the bolt that finishes the word. */
    killing: boolean;
}

export type ParticleKind = "ember" | "streak" | "ring" | "debris";

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
}

export type Phase = "attract" | "wave-intro" | "fighting" | "dying" | "over";

export interface StarTypeState {
    phase: Phase;

    // the run
    wave: number; // 1-based, like the reference's "WAVE 004"
    /** Drones still to be released this wave. */
    queue: number;
    spawnTimer: number;
    /** Counts down the beat between waves. */
    introT: number;

    // entities
    drones: Drone[];
    bolts: Bolt[];
    particles: Particle[];
    nextId: number;

    // typing
    /** id of the locked drone, or 0. */
    locked: number;
    score: number;
    streak: number;
    bestStreak: number;
    correctKeys: number;
    totalKeys: number;
    kills: number;
    runTimeMs: number;

    // the ship
    shipRecoil: number;
    shipHue: number; // idle pulse
    deathT: number;

    // feel channels
    flash: number;
    glitch: number; // the reference's datamosh on death
    t: number;
}

// ==========================================
// HELPERS
// ==========================================

export function droneRadius(word: string): number {
    return DRONE_BASE_R + word.length * DRONE_R_PER_CHAR;
}

export function getInitialState(): StarTypeState {
    return {
        phase: "attract",
        wave: 1,
        queue: 0,
        spawnTimer: 0.8,
        introT: 0,
        drones: [],
        bolts: [],
        particles: [],
        nextId: 1,
        locked: 0,
        score: 0,
        streak: 0,
        bestStreak: 0,
        correctKeys: 0,
        totalKeys: 0,
        kills: 0,
        runTimeMs: 0,
        shipRecoil: 0,
        shipHue: 0,
        deathT: 0,
        flash: 0,
        glitch: 0,
        t: 0,
    };
}

export function resetRun(s: StarTypeState) {
    s.phase = "wave-intro";
    s.wave = 1;
    s.queue = waveCount(1);
    s.spawnTimer = 0;
    s.introT = WAVE_BREAK;
    s.drones = [];
    s.bolts = [];
    s.particles = [];
    s.nextId = 1;
    s.locked = 0;
    s.score = 0;
    s.streak = 0;
    s.bestStreak = 0;
    s.correctKeys = 0;
    s.totalKeys = 0;
    s.kills = 0;
    s.runTimeMs = 0;
    s.shipRecoil = 0;
    s.deathT = 0;
    s.flash = 0;
    s.glitch = 0;
}

/** The set of first letters already in the sky — see `pickWord`. */
export function liveInitials(s: StarTypeState): Set<string> {
    const set = new Set<string>();
    for (const d of s.drones) if (!d.doomed) set.add(d.word[0]);
    return set;
}

/** Release one drone at the top of the screen. */
export function spawnDrone(s: StarTypeState, W: number, H: number, scale: number): Drone {
    const lo = W * SIDE_MARGIN;
    const hi = W * (1 - SIDE_MARGIN);
    let x = lo + Math.random() * (hi - lo);
    // three tries to keep some daylight between labels
    for (let i = 0; i < 3; i++) {
        const clash = s.drones.some((d) => Math.abs(d.x - x) < 150 * scale && d.y < 220 * scale);
        if (!clash) break;
        x = lo + Math.random() * (hi - lo);
    }
    const word = pickWord(s.wave, liveInitials(s));
    const speed = waveSpeed(s.wave) * scale;
    // aim at a point near the ship so the swarm fans inward instead of raining
    // straight down — on a wide screen a vertical drop looks like a wall
    const aimX = W / 2 + (Math.random() - 0.5) * W * CONVERGE_SPREAD;
    const aimY = H * SHIP_Y_FRAC;
    const dx = aimX - x;
    const dy = aimY - SPAWN_Y * scale;
    const m = Math.max(1, Math.hypot(dx, dy));
    const drone: Drone = {
        id: s.nextId++,
        x,
        y: SPAWN_Y * scale,
        vx: (dx / m) * speed,
        vy: (dy / m) * speed,
        word,
        typed: 0,
        r: droneRadius(word) * scale,
        sway: Math.random() * Math.PI * 2,
        spin: Math.random() * Math.PI * 2,
        born: 0,
        hit: 0,
        doomed: false,
        incoming: 0,
        labelSide: x > W / 2 ? -1 : 1,
    };
    s.drones.push(drone);
    return drone;
}

// ==========================================
// PARTICLE EMITTERS — all bounded
// ==========================================

const PARTICLE_CAP = 260;

export function addParticle(s: StarTypeState, p: Particle) {
    if (s.particles.length >= PARTICLE_CAP) s.particles.shift();
    s.particles.push(p);
}

/** A drone bursting: a white core, orange embers and radiating streaks. */
export function spawnExplosion(s: StarTypeState, x: number, y: number, r: number, scale: number) {
    addParticle(s, {
        kind: "ring", x, y, vx: 0, vy: 0,
        life: 0, ttl: 0.4, size: r * 0.8, color: "#ffd08a", rot: 0,
    });
    for (let i = 0; i < 16; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = (60 + Math.random() * 260) * scale;
        addParticle(s, {
            kind: "ember", x, y,
            vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            life: 0, ttl: 0.4 + Math.random() * 0.45,
            size: (2 + Math.random() * 4) * scale,
            color: i % 3 === 0 ? "#fff3c4" : i % 3 === 1 ? "#ffa63d" : "#ff6a1f",
            rot: 0,
        });
    }
    for (let i = 0; i < 7; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = (220 + Math.random() * 340) * scale;
        addParticle(s, {
            kind: "streak", x, y,
            vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            life: 0, ttl: 0.22 + Math.random() * 0.18,
            size: (10 + Math.random() * 16) * scale, color: "#ffe9b0", rot: a,
        });
    }
}

/** A bolt landing on a drone that is not dead yet — a small amber spatter. */
export function spawnHit(s: StarTypeState, x: number, y: number, scale: number) {
    for (let i = 0; i < 5; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = (40 + Math.random() * 130) * scale;
        addParticle(s, {
            kind: "ember", x, y,
            vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            life: 0, ttl: 0.16 + Math.random() * 0.16,
            size: (1.6 + Math.random() * 2.4) * scale, color: "#ffc46b", rot: 0,
        });
    }
}

/** The ship going up — a big cyan blast with debris. */
export function spawnShipDeath(s: StarTypeState, x: number, y: number, scale: number) {
    addParticle(s, {
        kind: "ring", x, y, vx: 0, vy: 0,
        life: 0, ttl: 0.9, size: 30 * scale, color: "#8ffff0", rot: 0,
    });
    for (let i = 0; i < 40; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = (80 + Math.random() * 460) * scale;
        addParticle(s, {
            kind: i % 4 === 0 ? "debris" : "ember", x, y,
            vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            life: 0, ttl: 0.6 + Math.random() * 0.9,
            size: (2 + Math.random() * 6) * scale,
            color: i % 3 === 0 ? "#ffffff" : i % 3 === 1 ? "#7ff5e4" : "#3fd6c8",
            rot: Math.random() * 6,
        });
    }
}
