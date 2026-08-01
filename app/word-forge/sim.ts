// =========================================================================
// 🔥 WORD FORGE — simulation model (pure data + tuning, no React, no canvas).
//
// A top-down lane defence. Scrap-bots march down a forge corridor at your gate,
// and **every bot carries the thing you have to type**: one key on EASY, a word
// after that. Type it and your turret shoots that bot. Nothing fires by itself.
//
// There are two modes, and SPACE is the switch between them:
//
//   FIGHT   (the default) — every letter you press is aimed at a bot. The first
//           letter picks a target, the rest must continue that bot's word, and
//           each correct key fires one shot.
//   LOADOUT (press SPACE) — the lane keeps moving but your keys now talk to the
//           two menus beside it. Type a WEAPON name to equip it, a PERK name to
//           buy a level. Finishing one drops you straight back into FIGHT.
//
// That split is the whole game. Shopping costs you shooting time, so *when* you
// duck into the menu is the decision the player is actually making.
//
// HEAT is the second engine. Every correct key and every kill stokes the forge;
// it bleeds away when you stop, and it multiplies your damage. So typing faster
// does not merely buy upgrades sooner — it is the damage itself.
//
// Coordinates: no camera and no scrolling. Everything is screen space — bots
// walk down the lane from above the top edge to the gate at `Layout.gateY`.
// `layoutFor()` lives in render.ts (it is the one coordinate mapping).
// =========================================================================

// ---------- the lane ----------
/** A bot this many units short of the gate line has arrived. */
export const GATE_REACH = 26;
/** Bots are born this far above the top edge. */
export const SPAWN_Y = -70;
/** Bots keep this far off the lane walls. */
export const LANE_MARGIN = 0.1;

// ---------- heat: the engine of the whole game ----------
/**
 * A correct key stokes the forge by this much and it decays by `HEAT_DECAY` a
 * second, so holding the forge at white heat costs about
 * `HEAT_DECAY / HEAT_PER_KEY` = 2.2 keys a second ≈ 26 WPM. A beginner at 12
 * WPM sits around half heat, which is the intended shape: everybody gets some
 * of the bonus and nobody gets all of it for free.
 */
export const HEAT_PER_KEY = 0.05;
export const HEAT_PER_KILL = 0.08;
/** Finishing a menu word — the reward for spending time out of the fight. */
export const HEAT_PER_PANEL = 0.22;
export const HEAT_DECAY = 0.11;
/** Damage is multiplied by 1 + heat × this. */
export const HEAT_DMG_BONUS = 1;
/** At or above this the forge is FORGED: shots turn golden and pierce. */
export const FORGED_AT = 0.995;

// ---------- economy ----------
/** Cost of taking a panel from `level` to `level + 1`. */
export const COST_STEP = 0.85; // ×(1 + level × COST_STEP)
export const MAX_LEVEL = 5;
/** REPAIR has no level; each use costs this much more than the last. */
export const REPAIR_COST_GROWTH = 1.55;
export const REPAIR_FRACTION = 0.28; // of max gate HP

// ---------- waves ----------
export const WAVE_BREAK = 3.4; // calm between waves — time to read the columns
export const BRUTE_EVERY = 5; // a brute leads every fifth wave
export const HP_RAMP = 0.16; // bot HP × (1 + (wave-1) × this)
export const SPEED_RAMP = 0.03;
export const SPEED_RAMP_CAP = 1.65;
export const MAX_BOTS = 64; // hard cap, so a stalled run cannot melt the frame

// ---------- misc tuning ----------
export const CHAIN_RANGE = 210;
export const SLOW_TIME = 1.7;
export const TURRET_TURN = 14; // rad/s the barrel can swing
export const POPUP_CAP = 40;
export const PARTICLE_CAP = 320;

/**
 * Base damage of one keystroke, and the number every bot's hit points are built
 * from. A bot's HP is `word length × HP_PER_LETTER × toughness × hpMul(wave)`,
 * so at wave 1 with a level-1 PISTOL **one word kills one bot, exactly**. That
 * is the rule the whole game teaches itself with, and every upgrade is read
 * against it: a stronger gun kills before the word runs out, a later wave needs
 * more than one word unless you have upgraded.
 */
export const HP_PER_LETTER = 13;

// ==========================================
// DIFFICULTY
// ==========================================

export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export interface DiffConfig {
    /** Gate hit points. */
    gate: number;
    /** Scrap in the bank at the start. */
    scrap: number;
    /** Multiplies how fast bots are released and how fast they walk. */
    pace: number;
    /** Scrap earned per kill is multiplied by this. */
    pay: number;
    /** A wave is worth this many spawn points more than on MEDIUM. */
    budgetMul: number;
    /**
     * How long the thing a bot carries is. `small` is grunts and runners,
     * `mid` is tanks, `big` is brutes. **A length of 1 means a single key** —
     * that is what makes EASY a genuine first-week drill and still a real
     * arcade game.
     */
    small: number;
    mid: number;
    big: number;
    /** EASY draws its single keys from this pool. */
    keys: string;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DiffConfig> = {
    EASY: {
        gate: 150, scrap: 45, pace: 0.78, pay: 1.35, budgetMul: 0.78,
        small: 1, mid: 3, big: 5, keys: "asdfghjkl",
    },
    MEDIUM: {
        gate: 110, scrap: 28, pace: 1, pay: 1, budgetMul: 1,
        small: 3, mid: 5, big: 7, keys: "",
    },
    HARD: {
        gate: 85, scrap: 16, pace: 1.26, pay: 0.85, budgetMul: 1.22,
        small: 4, mid: 6, big: 8, keys: "",
    },
};

// ==========================================
// PANELS — the words you type in LOADOUT mode
//
// Rules these names must keep (checked by eye; break one and the input model
// breaks with it):
//   1. No name may be a PREFIX of another name. "GOLD" and "GOLDEN" could
//      never both be finished, because the shorter one would fire first.
//   2. Names are 4–7 letters. The audience is school students and this column
//      is read at a glance while something is walking at you.
//   3. A name says what it does. Nobody should have to learn a mapping.
// ==========================================

export type PanelKind = "weapon" | "perk";
export type ShotKind = "bolt" | "orb" | "beam";

export interface WeaponDef {
    key: string;
    kind: "weapon";
    word: string;
    unlockWave: number;
    baseCost: number;
    /** Damage one keystroke puts into the target. */
    dmg: number;
    /** Projectile speed (0 for a beam, which lands instantly). */
    speed: number;
    shot: ShotKind;
    /** Extra bots hit near the target, each for `nearFrac` of `dmg`. */
    near: number;
    nearFrac: number;
    /** Bots the shot passes through on its way, in a straight line. */
    pierce: number;
    /** Splash radius in layout units (0 = none). */
    splash: number;
    /** Bots hit are slowed. */
    chill: number;
    /** One line, shown on the panel while LOADOUT is open. */
    blurb: { en: string; uz: string; ru: string };
}

export interface PerkDef {
    key: string;
    kind: "perk";
    word: string;
    unlockWave: number;
    baseCost: number;
    /** REPAIR is an action, not a level — see `applyPanel`. */
    action?: "repair";
    blurb: { en: string; uz: string; ru: string };
}

export type PanelDef = WeaponDef | PerkDef;

/**
 * Five weapons, not seven. Every one has to answer "what does ONE key do?" in a
 * sentence a nine-year-old can repeat, and past five the answers start to
 * overlap.
 */
export const WEAPONS: WeaponDef[] = [
    {
        key: "pistol", kind: "weapon", word: "PISTOL", unlockWave: 1, baseCost: 14,
        dmg: HP_PER_LETTER, speed: 1500, shot: "bolt",
        near: 0, nearFrac: 0, pierce: 0, splash: 0, chill: 0,
        blurb: {
            en: "One key, one clean hit.",
            uz: "Bir tugma — bitta aniq zarba.",
            ru: "Одна клавиша — одно точное попадание.",
        },
    },
    {
        key: "shotgun", kind: "weapon", word: "SHOTGUN", unlockWave: 1, baseCost: 26,
        dmg: 11, speed: 1200, shot: "bolt",
        near: 2, nearFrac: 0.6, pierce: 0, splash: 0, chill: 0,
        blurb: {
            en: "Also hits two bots standing near your target.",
            uz: "Nishoning yonidagi ikkita botga ham tegadi.",
            ru: "Задевает ещё двух ботов рядом с целью.",
        },
    },
    {
        key: "sniper", kind: "weapon", word: "SNIPER", unlockWave: 4, baseCost: 52,
        dmg: 26, speed: 2600, shot: "bolt",
        near: 0, nearFrac: 0, pierce: 3, splash: 0, chill: 0,
        blurb: {
            en: "Punches through everything in the line.",
            uz: "Qatordagi hammasini teshib o'tadi.",
            ru: "Пробивает всех, кто стоит на линии.",
        },
    },
    {
        key: "cannon", kind: "weapon", word: "CANNON", unlockWave: 7, baseCost: 78,
        dmg: 17, speed: 780, shot: "orb",
        near: 0, nearFrac: 0, pierce: 0, splash: 96, chill: 0,
        blurb: {
            en: "Booms. Everything close to the target is hurt.",
            uz: "Portlaydi. Nishon atrofidagilarga ham tegadi.",
            ru: "Взрыв. Достаёт всех вокруг цели.",
        },
    },
    {
        key: "laser", kind: "weapon", word: "LASER", unlockWave: 10, baseCost: 104,
        dmg: 24, speed: 0, shot: "beam",
        near: 0, nearFrac: 0, pierce: 99, splash: 0, chill: 0,
        blurb: {
            en: "A beam. Lands at once and burns the whole line.",
            uz: "Nur. Darrov tegadi va butun qatorni yondiradi.",
            ru: "Луч. Попадает мгновенно и жжёт всю линию.",
        },
    },
];

export const PERKS: PerkDef[] = [
    {
        key: "sharp", kind: "perk", word: "SHARP", unlockWave: 1, baseCost: 16,
        blurb: {
            en: "+25% damage for every level.",
            uz: "Har daraja uchun zarba +25%.",
            ru: "+25% урона за уровень.",
        },
    },
    {
        key: "repair", kind: "perk", word: "REPAIR", unlockWave: 2, baseCost: 30,
        action: "repair",
        blurb: {
            en: "Patch the gate. Costs more every time.",
            uz: "Darvozani yamaydi. Har safar qimmatroq.",
            ru: "Чинит ворота. Каждый раз дороже.",
        },
    },
    {
        key: "blast", kind: "perk", word: "BLAST", unlockWave: 3, baseCost: 42,
        blurb: {
            en: "Your shots explode. Bigger boom each level.",
            uz: "O'qlaring portlaydi. Har daraja kattaroq.",
            ru: "Твои выстрелы взрываются. Сильнее с каждым уровнем.",
        },
    },
    {
        key: "frost", kind: "perk", word: "FROST", unlockWave: 5, baseCost: 46,
        blurb: {
            en: "Bots you hit walk slower.",
            uz: "Tekkan botlar sekinroq yuradi.",
            ru: "Боты, в которых попал, идут медленнее.",
        },
    },
    {
        key: "chain", kind: "perk", word: "CHAIN", unlockWave: 8, baseCost: 60,
        blurb: {
            en: "Your shot jumps on to another bot.",
            uz: "O'qing boshqa botga sakraydi.",
            ru: "Выстрел перескакивает на другого бота.",
        },
    },
    {
        key: "gold", kind: "perk", word: "GOLD", unlockWave: 11, baseCost: 66,
        blurb: {
            en: "+30% scrap from every kill.",
            uz: "Har bir o'ljadan +30% temir.",
            ru: "+30% лома с каждого убийства.",
        },
    },
];

export const PANELS: PanelDef[] = [...WEAPONS, ...PERKS];

/** Fast lookup, built once. */
const BY_KEY = new Map<string, PanelDef>(PANELS.map((p) => [p.key, p]));
export function defOf(key: string): PanelDef {
    return BY_KEY.get(key)!;
}

// ==========================================
// THE WORDS THE BOTS CARRY
//
// Plain kid vocabulary, bucketed by length so `DiffConfig.small/mid/big` can
// ask for exactly the size it wants. Length 1 is handled separately — those are
// single keys from `DiffConfig.keys`.
// ==========================================

const W3 = [
    "arm", "bag", "bat", "bed", "big", "box", "boy", "bus", "cap", "cat", "cow",
    "cup", "cut", "day", "dog", "dry", "ear", "eat", "egg", "end", "eye", "far",
    "fly", "fox", "fun", "gas", "hat", "hit", "hot", "ice", "jam", "job", "key",
    "leg", "let", "map", "mud", "net", "new", "now", "oil", "old", "one", "out",
    "own", "pen", "pig", "pot", "put", "red", "run", "sea", "see", "sit", "six",
    "sky", "sun", "ten", "top", "toy", "try", "two", "use", "van", "war", "way",
    "wet", "win", "yes", "zip",
];
const W4 = [
    "away", "back", "ball", "bank", "bear", "beat", "bell", "best", "bird",
    "bite", "blue", "boat", "body", "bone", "book", "burn", "busy", "calm",
    "card", "care", "city", "clay", "cold", "cool", "corn", "dark", "deep",
    "desk", "door", "down", "draw", "drop", "dust", "east", "easy", "edge",
    "fall", "fast", "fire", "fish", "flag", "food", "foot", "four", "free",
    "gate", "gift", "girl", "give", "goal", "gold", "grow", "hand", "hard",
    "head", "hear", "help", "high", "hill", "hold", "home", "hope", "hour",
    "idea", "iron", "join", "jump", "keep", "kind", "king", "know", "lake",
    "land", "last", "leaf", "left", "life", "lift", "like", "line", "lion",
    "list", "long", "look", "loud", "love", "luck", "mail", "main", "many",
    "mark", "melt", "mind", "moon", "more", "most", "move", "name", "near",
    "need", "nest", "next", "nice", "note", "open", "over", "page", "park",
    "part", "past", "path", "pick", "plan", "play", "pull", "push", "rain",
    "read", "rest", "ride", "ring", "road", "rock", "roof", "room", "root",
    "rope", "rose", "rule", "safe", "sail", "salt", "sand", "save", "seed",
    "sell", "send", "ship", "shop", "show", "side", "sign", "size", "skin",
    "slow", "snow", "soft", "song", "soon", "sort", "soup", "star", "stay",
    "step", "stop", "sure", "swim", "tail", "take", "talk", "tall", "team",
    "tell", "test", "tiny", "tree", "true", "turn", "type", "unit", "very",
    "view", "wait", "walk", "wall", "want", "warm", "wash", "wave", "wear",
    "week", "well", "wide", "wild", "wind", "wing", "wise", "wish", "wood",
    "word", "work", "yard", "year", "your", "zero", "zone",
];
const W5 = [
    "about", "above", "after", "again", "alarm", "alive", "alone", "along",
    "apple", "beach", "began", "below", "birds", "black", "blank", "blaze",
    "block", "blood", "board", "brain", "brave", "bread", "break", "brick",
    "bring", "broad", "brown", "brush", "build", "burst", "cabin", "candy",
    "carry", "catch", "cause", "chair", "chalk", "charm", "chart", "chase",
    "check", "chest", "chief", "child", "claim", "class", "clean", "clear",
    "climb", "clock", "close", "cloud", "coast", "color", "count", "cover",
    "crash", "cream", "cross", "crowd", "crown", "daily", "dance", "delay",
    "dream", "dress", "drink", "drive", "eager", "early", "earth", "eight",
    "empty", "enemy", "enjoy", "enter", "equal", "event", "every", "exact",
    "field", "fight", "final", "first", "flame", "flash", "float", "floor",
    "focus", "force", "frame", "fresh", "front", "fruit", "funny", "giant",
    "glass", "globe", "grade", "grand", "grass", "great", "green", "group",
    "guard", "guess", "guide", "happy", "heart", "heavy", "horse", "hotel",
    "house", "human", "image", "index", "inner", "issue", "juice", "large",
    "later", "laugh", "layer", "learn", "leave", "level", "light", "limit",
    "local", "logic", "lucky", "magic", "major", "maker", "march", "match",
    "metal", "might", "money", "month", "moral", "mouse", "mouth", "music",
    "never", "night", "noise", "north", "novel", "nurse", "ocean", "offer",
    "often", "onion", "order", "other", "outer", "owner", "paint", "panel",
    "paper", "party", "peace", "phone", "photo", "piece", "pilot", "pitch",
    "place", "plain", "plane", "plant", "plate", "point", "power", "press",
    "price", "pride", "prime", "prize", "proof", "proud", "prove", "queen",
    "quick", "quiet", "radio", "raise", "range", "rapid", "reach", "ready",
    "relax", "reply", "rider", "right", "risky", "river", "robot", "rough",
    "round", "route", "royal", "rural", "scale", "scene", "score", "sense",
    "serve", "seven", "shade", "shape", "share", "sheet", "shelf", "shell",
    "shift", "shine", "shirt", "shock", "shore", "short", "sight", "since",
    "skill", "sleep", "slice", "slide", "small", "smart", "smile", "smoke",
    "snake", "solar", "solid", "solve", "sound", "south", "space", "spare",
    "speak", "speed", "spend", "spice", "spill", "split", "sport", "staff",
    "stage", "stair", "stand", "start", "state", "steam", "steel", "steep",
    "stick", "still", "stone", "store", "storm", "story", "stove", "study",
    "stuff", "style", "sugar", "sunny", "sweet", "swing", "table", "taken",
    "taste", "teach", "teeth", "thank", "theme", "thick", "thing", "think",
    "third", "three", "throw", "tiger", "tight", "tired", "title", "today",
    "token", "tooth", "topic", "total", "touch", "tough", "tower", "trace",
    "track", "trade", "trail", "train", "treat", "trend", "trial", "tribe",
    "trick", "truck", "trust", "truth", "twice", "uncle", "under", "union",
    "unite", "until", "upper", "urban", "usual", "value", "video", "visit",
    "voice", "waste", "watch", "water", "wheel", "where", "while", "white",
    "whole", "woman", "world", "worry", "worth", "would", "wound", "wrist",
    "write", "wrong", "young",
];
const W6 = [
    "action", "advice", "afford", "almost", "always", "amount", "animal",
    "answer", "appear", "around", "arrive", "artist", "asleep", "attack",
    "author", "autumn", "banner", "basket", "battle", "beacon", "beauty",
    "become", "before", "behind", "belong", "better", "beyond", "border",
    "bottle", "bottom", "branch", "breath", "bridge", "bright", "broken",
    "bucket", "bullet", "butter", "camera", "cancel", "candle", "canyon",
    "carbon", "career", "castle", "casual", "center", "chance", "change",
    "charge", "cheese", "choice", "choose", "circle", "closed", "coffee",
    "column", "combat", "coming", "common", "copper", "corner", "cotton",
    "couple", "course", "cousin", "create", "credit", "custom", "damage",
    "danger", "decade", "decide", "defeat", "defend", "degree", "demand",
    "desert", "design", "desire", "detail", "detect", "device", "dinner",
    "direct", "doctor", "dollar", "domain", "double", "driver", "during",
    "editor", "effect", "effort", "either", "eleven", "empire", "enable",
    "ending", "energy", "engine", "enough", "ensure", "entire", "escape",
    "expand", "expect", "expert", "extend", "fabric", "factor", "family",
    "famous", "farmer", "fasten", "father", "fellow", "female", "figure",
    "filter", "finger", "finish", "flight", "flying", "follow", "forest",
    "forget", "formal", "format", "former", "fossil", "fought", "fourth",
    "freeze", "friend", "frozen", "future", "galaxy", "garage", "garden",
    "gather", "gentle", "global", "golden", "ground", "growth", "handle",
    "happen", "hardly", "hazard", "health", "hidden", "holder", "honest",
    "hunter", "hybrid", "ignore", "impact", "import", "income", "indeed",
    "injury", "inside", "intend", "island", "itself", "jacket", "jungle",
    "junior", "kitten", "ladder", "latest", "launch", "lawyer", "leader",
    "league", "legacy", "length", "lesson", "letter", "listen", "little",
    "living", "locate", "lonely", "lovely", "makeup", "manage", "manner",
    "manual", "margin", "marine", "market", "master", "matter", "medium",
    "member", "memory", "mental", "method", "middle", "mining", "minute",
    "mirror", "mobile", "modern", "modest", "module", "moment", "monkey",
    "mostly", "mother", "motion", "moving", "museum", "mutual", "myself",
    "narrow", "nation", "native", "nature", "nearby", "nearly", "needle",
    "nobody", "normal", "notice", "notion", "number", "object", "obtain",
    "office", "online", "option", "orange", "origin", "output", "packet",
    "palace", "parent", "partly", "patrol", "pencil", "people", "period",
    "permit", "person", "phrase", "picnic", "planet", "player", "please",
    "plenty", "pocket", "poetry", "police", "policy", "polish", "prefer",
    "pretty", "prince", "prison", "profit", "proper", "public", "purple",
    "puzzle", "rabbit", "racing", "radius", "random", "rarely", "rather",
    "rating", "reader", "really", "reason", "recall", "recent", "record",
    "reduce", "reform", "refuse", "regard", "region", "relate", "relief",
    "remain", "remote", "remove", "repeat", "report", "rescue", "resist",
    "resort", "result", "retail", "retain", "retire", "return", "reveal",
    "review", "reward", "riding", "rising", "rocket", "runner", "safety",
    "salmon", "sample", "saving", "saying", "school", "screen", "script",
    "search", "season", "second", "secret", "sector", "secure", "select",
    "seller", "senior", "series", "server", "settle", "severe", "shadow",
    "shaped", "shared", "shield", "should", "shower", "signal", "silent",
    "silver", "simple", "simply", "singer", "single", "sister", "sketch",
    "slight", "smooth", "social", "socket", "soften", "sooner", "source",
    "speech", "sphere", "spirit", "spread", "spring", "square", "stable",
    "status", "steady", "stolen", "stream", "street", "stress", "strict",
    "strike", "string", "strong", "studio", "submit", "subtle", "sudden",
    "suffer", "summer", "summit", "supply", "surely", "survey", "switch",
    "symbol", "system", "talent", "target", "temple", "tender", "tennis",
    "thanks", "theory", "thirty", "though", "threat", "thrown", "ticket",
    "timber", "timing", "tissue", "toward", "travel", "tribal", "trophy",
    "tunnel", "twelve", "twenty", "unable", "unfair", "unique", "united",
    "unless", "unlike", "update", "useful", "valley", "vendor", "victim",
    "viewer", "vision", "visual", "volume", "wander", "wealth", "weapon",
    "weekly", "weight", "window", "winner", "winter", "wisdom", "wonder",
    "wooden", "worker", "writer", "yellow",
];
const W7 = [
    "against", "airport", "already", "amazing", "ancient", "another", "anybody",
    "anymore", "arrange", "article", "attempt", "attract", "average", "balance",
    "bandage", "banking", "barrier", "battery", "because", "bedroom", "believe",
    "beneath", "benefit", "between", "bicycle", "biggest", "billion", "brother",
    "builder", "burning", "cabinet", "capital", "captain", "capture", "careful",
    "carrier", "ceiling", "central", "century", "certain", "channel", "chapter",
    "charity", "chicken", "circuit", "citizen", "classic", "climate", "closing",
    "clothes", "collect", "college", "combine", "comfort", "command", "comment",
    "compact", "company", "compare", "compete", "complex", "concept", "concern",
    "concert", "conduct", "confirm", "connect", "consist", "contact", "contain",
    "content", "contest", "context", "control", "convert", "cooking", "correct",
    "cottage", "council", "counter", "country", "courage", "crystal", "culture",
    "curious", "current", "curtain", "cutting", "dancing", "dealing", "decided",
    "declare", "deliver", "density", "deposit", "desktop", "despite", "destroy",
    "develop", "diamond", "digital", "discuss", "disease", "dismiss", "display",
    "distant", "diverse", "drawing", "driving", "eastern", "economy", "edition",
    "educate", "element", "engaged", "enhance", "evening", "exactly", "example",
    "excited", "exhibit", "explain", "explore", "express", "extreme", "factory",
    "failure", "fantasy", "fashion", "feather", "feature", "federal", "feeling",
    "fiction", "fifteen", "finding", "fishing", "fitness", "foreign", "forever",
    "forward", "founder", "freedom", "further", "gallery", "gateway", "general",
    "genuine", "getting", "gravity", "greater", "growing", "habitat", "hanging",
    "harvest", "healthy", "hearing", "heating", "helpful", "herself", "highest",
    "history", "holiday", "housing", "however", "hundred", "husband", "imagine",
    "improve", "include", "initial", "inquiry", "insight", "inspire", "install",
    "instant", "instead", "intense", "invited", "involve", "journal", "journey",
    "justice", "kitchen", "landing", "largest", "leading", "learned", "leather",
    "lecture", "liberty", "library", "license", "limited", "listing", "logical",
    "machine", "magnify", "manager", "married", "massive", "maximum", "meaning",
    "measure", "medical", "meeting", "mention", "message", "mineral", "minimum",
    "missing", "mission", "mistake", "mixture", "monitor", "monthly", "morning",
    "musical", "mystery", "natural", "network", "neutral", "nothing", "nuclear",
    "observe", "obvious", "offense", "officer", "operate", "opinion", "organic",
    "outdoor", "outline", "outside", "overall", "package", "painter", "parking",
    "partner", "passage", "passion", "patient", "pattern", "payment", "penalty",
    "pending", "perfect", "perform", "perhaps", "picture", "pioneer", "plastic",
    "pointed", "popular", "portion", "poverty", "precise", "predict", "premium",
    "prepare", "present", "prevent", "primary", "printer", "privacy", "private",
    "problem", "proceed", "process", "produce", "product", "profile", "program",
    "project", "promise", "promote", "protect", "protein", "provide", "publish",
    "purpose", "pursuit", "qualify", "quality", "quarter", "railway", "reactor",
    "reading", "realize", "receive", "recover", "reflect", "regular", "related",
    "release", "remains", "removal", "replace", "request", "require", "reserve",
    "resolve", "respect", "respond", "restore", "reunion", "revenue", "reverse",
    "routine", "running", "satisfy", "science", "section", "segment", "serious",
    "service", "serving", "session", "setting", "shelter", "shining", "shipped",
    "shortly", "similar", "sitting", "society", "somehow", "someone", "speaker",
    "special", "species", "specify", "sponsor", "stadium", "station", "storage",
    "strange", "stretch", "student", "subject", "succeed", "success", "suggest",
    "summary", "support", "suppose", "supreme", "surface", "surgery", "survive",
    "suspect", "sustain", "teacher", "telling", "tension", "theatre", "therapy",
    "thought", "through", "tonight", "totally", "touched", "tourist", "towards",
    "traffic", "trailer", "trained", "trouble", "trusted", "turning", "typical",
    "unaware", "uniform", "unknown", "unusual", "upgrade", "utility", "variety",
    "various", "vehicle", "venture", "version", "veteran", "victory", "village",
    "violent", "virtual", "visible", "visitor", "vitamin", "wanting", "warning",
    "wearing", "weather", "webpage", "weekend", "welcome", "welfare", "western",
    "whether", "willing", "winning", "without", "witness", "workers", "working",
    "worried", "writing", "written",
];
const W8 = [
    "absolute", "abstract", "academic", "accepted", "accident", "accuracy",
    "achieved", "acquired", "activity", "actually", "addition", "adequate",
    "adjacent", "advanced", "advisory", "affected", "aircraft", "alliance",
    "although", "aluminum", "analysis", "announce", "anything", "anywhere",
    "apparent", "appendix", "approach", "approval", "argument", "artistic",
    "assemble", "assembly", "assigned", "athletic", "attached", "attitude",
    "attorney", "audience", "aviation", "backward", "bacteria", "baseball",
    "bathroom", "becoming", "bringing", "building", "business", "campaign",
    "capacity", "carrying", "category", "ceremony", "chairman", "champion",
    "changing", "chemical", "children", "choosing", "circular", "civilian",
    "clearing", "clinical", "clothing", "coaching", "collapse", "colonial",
    "combined", "commence", "commerce", "communal", "commuter", "complain",
    "complete", "composed", "compound", "computer", "conclude", "concrete",
    "conflict", "confused", "congress", "consider", "constant", "consumer",
    "continue", "contract", "contrary", "contrast", "convince", "corridor",
    "coverage", "creating", "creative", "creature", "criminal", "critical",
    "crossing", "cultural", "currency", "customer", "database", "daughter",
    "daylight", "deciding", "decision", "decrease", "deferred", "definite",
    "delivery", "describe", "designer", "detailed", "detector", "diameter",
    "directly", "director", "disagree", "discount", "discover", "distance",
    "distinct", "district", "dividend", "division", "document", "domestic",
    "dominant", "doubtful", "downtown", "dramatic", "duration", "dynamics",
    "earnings", "economic", "educated", "election", "electric", "elegance",
    "eligible", "emerging", "emphasis", "employee", "enormous", "entirely",
    "entrance", "envelope", "equality", "equation", "estimate", "evaluate",
    "eventual", "everyday", "evidence", "exchange", "exciting", "exercise",
    "existing", "expected", "expenses", "explicit", "exposure", "extended",
    "external", "facility", "familiar", "favorite", "features", "feedback",
    "festival", "fighting", "filtered", "finished", "flexible", "floating",
    "flooding", "football", "forecast", "foremost", "formerly", "fortress",
    "fraction", "fragment", "frequent", "friendly", "frontier", "function",
    "gathered", "generate", "generous", "graduate", "graphics", "grateful",
    "guardian", "guidance", "handling", "hardware", "heritage", "highland",
    "historic", "homeless", "hospital", "humanity", "identify", "identity",
    "imperial", "incident", "included", "increase", "indicate", "indirect",
    "industry", "informal", "informed", "inherent", "initiate", "innocent",
    "instance", "integral", "intended", "interest", "interior", "internal",
    "interval", "intimate", "invasion", "involved", "isolated", "judgment",
    "junction", "keyboard", "landlord", "language", "laughter", "learning",
    "leverage", "lifetime", "lighting", "likewise", "limiting", "literary",
    "location", "magazine", "magnetic", "maintain", "majority", "managing",
    "manifest", "manpower", "marathon", "marginal", "maritime", "material",
    "maternal", "maximize", "meantime", "measured", "medicine", "medieval",
    "memorial", "merchant", "midnight", "military", "minimize", "ministry",
    "minority", "mobility", "modeling", "moderate", "modified", "momentum",
    "monetary", "moreover", "mortgage", "mounting", "mountain", "movement",
    "multiple", "musician", "national", "negative", "neighbor", "nineteen",
    "northern", "notebook", "noticing", "numerous", "observed", "obstacle",
    "occasion", "occupied", "offering", "official", "offshore", "operator",
    "opponent", "opposite", "optimism", "ordinary", "organize", "original",
    "overcome", "overhead", "overseas", "painting", "parallel", "parental",
    "particle", "partners", "passages", "passport", "password", "patience",
    "peaceful", "peculiar", "periodic", "personal", "persuade", "petition",
    "physical", "pipeline", "planning", "platform", "pleasant", "pleasure",
    "politics", "portrait", "position", "positive", "possible", "powerful",
    "practice", "precious", "pregnant", "presence", "preserve", "pressure",
    "previous", "princess", "printing", "priority", "probable", "producer",
    "profound", "progress", "prohibit", "property", "proposal", "prospect",
    "protocol", "province", "publicly", "purchase", "quantity", "question",
    "railroad", "rational", "reaction", "received", "recovery", "regional",
    "register", "relation", "relative", "reliable", "reliance", "reminder",
    "renowned", "repeated", "reporter", "republic", "required", "research",
    "reserved", "resident", "resource", "response", "restrict", "retained",
    "reversal", "reviewed", "rigorous", "romantic", "sampling", "scenario",
    "schedule", "seasonal", "security", "selected", "sentence", "separate",
    "sequence", "shipping", "shortage", "shoulder", "sidewalk", "situated",
    "slightly", "smallest", "software", "solution", "somebody", "somewhat",
    "southern", "speaking", "specific", "spectrum", "spelling", "standard",
    "starting", "stimulus", "straight", "strategy", "strength", "striking",
    "struggle", "stunning", "suburban", "suddenly", "suitable", "superior",
    "supplied", "supposed", "surgical", "surprise", "survival", "suspects",
    "swimming", "sympathy", "teaching", "tendency", "terminal", "terrible",
    "thinking", "thorough", "thousand", "threaten", "together", "tomorrow",
    "tracking", "training", "transfer", "traveled", "treasury", "treating",
    "tropical", "ultimate", "umbrella", "universe", "unlikely", "vacation",
    "validity", "valuable", "variable", "vertical", "vicinity", "violence",
    "volatile", "warranty", "watching", "whatever", "whenever", "wherever",
    "wildlife", "withdraw", "workshop", "yourself",
];

/** Word buckets by length. */
const BUCKETS: Record<number, string[]> = { 3: W3, 4: W4, 5: W5, 6: W6, 7: W7, 8: W8 };

/**
 * Something for a bot to carry: a single key if `len` is 1, otherwise a word of
 * that length.
 *
 * `avoid` holds the first letters already in the lane. The first key you press
 * is what picks a target, so two bots sharing an initial makes that choice
 * ambiguous — the same rule as Star Type. It gives up after a few tries rather
 * than hanging, and the nearest-the-gate rule keeps a duplicate fair.
 */
export function pickCarry(len: number, keys: string, avoid: Set<string>): string {
    if (len <= 1) {
        const pool = keys || "asdfghjkl";
        for (let i = 0; i < 12; i++) {
            const c = pool[Math.floor(Math.random() * pool.length)];
            if (!avoid.has(c)) return c;
        }
        return pool[Math.floor(Math.random() * pool.length)];
    }
    const bucket = BUCKETS[Math.max(3, Math.min(8, len))] ?? W4;
    for (let i = 0; i < 20; i++) {
        const w = bucket[Math.floor(Math.random() * bucket.length)];
        if (!avoid.has(w[0])) return w;
    }
    return bucket[Math.floor(Math.random() * bucket.length)];
}

// ==========================================
// BOTS
// ==========================================

export type BotKind = "grunt" | "runner" | "tank" | "brute";

export interface BotDef {
    /** Multiplies the `word length × HP_PER_LETTER` baseline. */
    tough: number;
    speed: number; // units/s at scale 1
    dmg: number; // gate damage on arrival
    pay: number; // scrap
    r: number;
    /** Spawn points this bot costs out of the wave budget. */
    cost: number;
    /** The wave it first appears in. */
    from: number;
    /** Which `DiffConfig` length it carries. */
    size: "small" | "mid" | "big";
}

/**
 * Walking speed is the single most important number in this file, and it is not
 * about feel — it is the difficulty model.
 *
 * Your time to deal with a bot is how long it takes to walk the lane, NOT the
 * gap between spawns. An earlier build had a grunt crossing in about thirty
 * seconds, which is thirty seconds to find one word: the lane silted up with
 * bots nobody was in any hurry about. These figures put a grunt's march at
 * roughly ten seconds, so a wave is something you have to keep up with.
 *
 * Re-measure with a slow-typist run after changing any of them (see
 * `docs/word-forge.md` §6).
 */
export const BOT_DEFS: Record<BotKind, BotDef> = {
    grunt: { tough: 1, speed: 76, dmg: 8, pay: 3, r: 26, cost: 1, from: 1, size: "small" },
    runner: { tough: 0.75, speed: 128, dmg: 5, pay: 4, r: 20, cost: 1.2, from: 2, size: "small" },
    tank: { tough: 1.25, speed: 46, dmg: 22, pay: 14, r: 38, cost: 3.2, from: 4, size: "mid" },
    brute: { tough: 1.6, speed: 34, dmg: 45, pay: 90, r: 58, cost: 11, from: BRUTE_EVERY, size: "big" },
};

/** How much a bot's HP is multiplied by in `wave`. */
export function hpMul(wave: number): number {
    return 1 + (wave - 1) * HP_RAMP;
}

/** How much a bot's walking speed is multiplied by in `wave`. */
export function speedMul(wave: number, pace: number): number {
    return Math.min(SPEED_RAMP_CAP, 1 + (wave - 1) * SPEED_RAMP) * pace;
}

/** Spawn points available in `wave`. */
export function waveBudget(wave: number, cfg: DiffConfig): number {
    return (9 + wave * 3.6) * cfg.budgetMul;
}

/** Seconds between releases in `wave`. */
export function waveGap(wave: number, cfg: DiffConfig): number {
    return Math.max(0.3, 1.35 * Math.pow(0.95, wave)) / cfg.pace;
}

/**
 * The list of bots a wave will release, in order. Built once when the wave
 * starts so the spawner is a dumb queue and the wave's shape is decided in one
 * readable place.
 */
export function buildRoster(wave: number, cfg: DiffConfig): BotKind[] {
    const roster: BotKind[] = [];
    let budget = waveBudget(wave, cfg);

    // A brute leads every fifth wave, and a second one joins from wave 15.
    if (wave % BRUTE_EVERY === 0) {
        roster.push("brute");
        budget -= BOT_DEFS.brute.cost;
        if (wave >= 15) {
            roster.push("brute");
            budget -= BOT_DEFS.brute.cost;
        }
    }

    const pool: BotKind[] = (["grunt", "runner", "tank"] as BotKind[])
        .filter((k) => wave >= BOT_DEFS[k].from);

    let guard = 200;
    while (budget > 0 && guard-- > 0) {
        // Weight toward the cheap ones so a wave is a crowd with a few heavies
        // in it, not a parade of tanks.
        const roll = Math.random();
        let kind: BotKind = "grunt";
        if (pool.includes("tank") && roll > 0.85) kind = "tank";
        else if (pool.includes("runner") && roll > 0.55) kind = "runner";
        const c = BOT_DEFS[kind].cost;
        if (c > budget && kind !== "grunt") continue;
        roster.push(kind);
        budget -= c;
    }

    // Shuffle everything after the brute so heavies are not all at the back.
    const head = roster.filter((k) => k === "brute");
    const tail = roster.filter((k) => k !== "brute");
    for (let i = tail.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tail[i], tail[j]] = [tail[j], tail[i]];
    }
    return [...head, ...tail];
}

// ==========================================
// ENTITIES
// ==========================================

export interface Bot {
    id: number;
    kind: BotKind;
    x: number;
    y: number;
    /** Lane x it is walking toward — bots weave a little. */
    aimX: number;
    hp: number;
    maxHp: number;
    speed: number; // already scaled
    r: number;
    dmg: number;
    pay: number;
    /** What you have to type. A single key on EASY, otherwise a word. */
    word: string;
    /** How many characters of `word` are already typed. */
    typed: number;
    /** Decaying flash after the word was refreshed, so the swap is visible. */
    refresh: number;
    /** 0→1 fade-in. */
    born: number;
    /** Decaying white flash from the last hit. */
    hit: number;
    /** Multiplier on speed while `slowT > 0`. */
    slow: number;
    slowT: number;
    /** Walk-cycle phase, so a crowd never marches in lockstep. */
    wob: number;
    /** Counts up once dead; the corpse is drawn falling apart. */
    deadT: number;
}

export interface Shot {
    x: number;
    y: number;
    vx: number;
    vy: number;
    dmg: number;
    life: number;
    /** The bot this shot is for. */
    target: number;
    /** Distance still to travel; the shot lands when this hits 0. */
    remain: number;
    /** Bots it can still pass through on the way. */
    pierce: number;
    splash: number;
    /** Extra bots to spatter near the target (SHOTGUN). */
    near: number;
    nearFrac: number;
    /** Jumps left (CHAIN). */
    chain: number;
    /** Slow applied on hit (0 = none). */
    chill: number;
    kind: ShotKind;
    /** Forged shots are golden and pierce everything. */
    forged: boolean;
    /** ids already damaged, so one projectile cannot hit a bot twice. */
    hit: number[];
    r: number;
}

/** A laser pulse — purely a visual; its damage was applied when it was fired. */
export interface Beam {
    x: number;
    y: number;
    ang: number;
    len: number;
    life: number;
    ttl: number;
    w: number;
    forged: boolean;
}

export type ParticleKind = "ember" | "shard" | "ring" | "smoke" | "spark";

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
    spin: number;
    grav: number;
}

/** A floating number or word: damage, scrap, "LEVEL 3", "NEED 40". */
export interface Popup {
    x: number;
    y: number;
    vy: number;
    life: number;
    ttl: number;
    text: string;
    color: string;
    size: number;
    /**
     * Screen-space: it belongs to a panel, so it must NOT take the lane's shake
     * and it must be painted after the panel columns. A popup spawned at a
     * panel without this is drawn underneath the plate it is about.
     */
    fixed?: boolean;
}

export interface PanelState {
    key: string;
    /** Weapons arrive at 1; perks at 0. REPAIR counts its uses here. */
    level: number;
    unlocked: boolean;
    /** Slot in its column, bottom-up. Assigned when it unlocks. */
    slot: number;
    /** Decaying pop from a successful buy. */
    flash: number;
    /** Decaying red shake from a buy you could not afford. */
    deny: number;
    /** Decaying halo from having just been unlocked. */
    fresh: number;
}

export type Phase = "attract" | "intro" | "fighting" | "over";
/** FIGHT: keys go at the bots. LOADOUT (Space): keys go at the two menus. */
export type Mode = "fight" | "loadout";

export interface WordForgeState {
    phase: Phase;
    mode: Mode;
    difficulty: Difficulty;
    cfg: DiffConfig;

    // the run
    wave: number;
    /** Bots still to release this wave, in order. */
    roster: BotKind[];
    spawnTimer: number;
    /** Counts down the calm before a wave. */
    introT: number;

    gate: number;
    gateMax: number;
    scrap: number;
    scrapEarned: number;

    // entities
    bots: Bot[];
    shots: Shot[];
    beams: Beam[];
    particles: Particle[];
    popups: Popup[];
    nextId: number;

    // the loadout
    panels: PanelState[];
    equipped: string;
    /** Column heights, so a newly unlocked panel knows its slot. */
    weaponSlots: number;
    perkSlots: number;

    // the forge
    heat: number;
    /** Smoothed heat for drawing — heat itself jumps on every key. */
    heatView: number;
    forgedT: number;

    // the turret
    aim: number; // radians, 0 = straight up
    recoil: number;

    // typing
    /** FIGHT: the bot being typed, or 0. */
    locked: number;
    /** LOADOUT: the menu word so far, uppercase. */
    buf: string;
    /** Decaying glow after a finished word. */
    bufFlash: number;
    /** Decaying wash when LOADOUT is opened or closed. */
    modeT: number;
    streak: number;
    bestStreak: number;
    correctKeys: number;
    totalKeys: number;
    wordsTyped: number;
    kills: number;
    runTimeMs: number;

    // feel channels
    trauma: number;
    flash: number;
    hurtFlash: number;
    goldFlash: number;
    banner: string;
    bannerSub: string;
    bannerT: number;
    t: number;
}

// ==========================================
// DERIVED STATS — the single source of truth for what one keystroke does.
// The menu, the HUD and `step()` all read these, so a panel can never claim
// something the simulation does not do.
// ==========================================

export function levelOf(s: WordForgeState, key: string): number {
    return s.panels.find((p) => p.key === key)?.level ?? 0;
}

export function isUnlocked(s: WordForgeState, key: string): boolean {
    return s.panels.find((p) => p.key === key)?.unlocked ?? false;
}

/** Cost of the next level of `key`, or null if it is maxed out. */
export function costOf(s: WordForgeState, key: string): number | null {
    const def = defOf(key);
    const st = s.panels.find((p) => p.key === key);
    if (!st) return null;
    if ("action" in def && def.action === "repair") {
        return Math.round(def.baseCost * Math.pow(REPAIR_COST_GROWTH, st.level));
    }
    if (st.level >= MAX_LEVEL) return null;
    return Math.round(def.baseCost * (1 + st.level * COST_STEP));
}

export interface TurretStats {
    /** Damage one keystroke puts into the target. */
    dmg: number;
    near: number;
    nearFrac: number;
    pierce: number;
    splash: number;
    chill: number;
    chain: number;
    speed: number;
    shot: ShotKind;
}

/**
 * Everything one keystroke does, right now: the equipped weapon at its level,
 * with every perk folded in and the heat bonus applied to the damage.
 */
export function turretStats(s: WordForgeState): TurretStats {
    const w = defOf(s.equipped) as WeaponDef;
    const wl = Math.max(1, levelOf(s, s.equipped));
    const sharp = levelOf(s, "sharp");
    const blast = levelOf(s, "blast");
    const frost = levelOf(s, "frost");
    const chain = levelOf(s, "chain");

    return {
        dmg: w.dmg
            * (1 + (wl - 1) * 0.4)
            * (1 + sharp * 0.25)
            * (1 + s.heat * HEAT_DMG_BONUS),
        near: w.near,
        nearFrac: w.nearFrac,
        pierce: w.pierce,
        splash: w.splash + blast * 26,
        chill: Math.max(w.chill, frost * 0.15),
        chain,
        speed: w.speed,
        shot: w.shot,
    };
}

/** Scrap paid for a kill, with GOLD folded in. */
export function payFor(s: WordForgeState, base: number): number {
    return Math.round(base * (1 + levelOf(s, "gold") * 0.3) * s.cfg.pay);
}

/** The first letters already in the lane — see `pickCarry`. */
export function liveInitials(s: WordForgeState): Set<string> {
    const set = new Set<string>();
    for (const b of s.bots) {
        if (b.deadT === 0 && b.word) set.add(b.word[0].toLowerCase());
    }
    return set;
}

/** How long a thing this bot carries should be, at this difficulty. */
export function carryLength(cfg: DiffConfig, kind: BotKind): number {
    return cfg[BOT_DEFS[kind].size];
}

// ==========================================
// THE LOADOUT INPUT MODEL
// ==========================================

export interface MenuMatch {
    /** Panel keys whose word starts with the buffer. */
    panels: string[];
    /** The single word being completed, if exactly one panel matches. */
    ghost: string | null;
    /** An exact, unambiguous hit. */
    exact: string | null;
}

/**
 * Everything the LOADOUT buffer could still become. Plain prefix matching over
 * the unlocked panels — a single-digit list, so there is no index and nothing to
 * invalidate.
 */
export function menuMatch(s: WordForgeState, buf: string): MenuMatch {
    const out: MenuMatch = { panels: [], ghost: null, exact: null };
    if (!buf) return out;
    const b = buf.toUpperCase();
    for (const p of s.panels) {
        if (!p.unlocked) continue;
        const w = defOf(p.key).word;
        if (!w.startsWith(b)) continue;
        out.panels.push(p.key);
        if (w === b) out.exact = p.key;
    }
    if (out.panels.length === 1) out.ghost = defOf(out.panels[0]).word;
    return out;
}

// ==========================================
// STATE
// ==========================================

function freshPanels(): PanelState[] {
    return PANELS.map((d) => ({
        key: d.key,
        level: d.kind === "weapon" ? 1 : 0,
        unlocked: false,
        slot: 0,
        flash: 0,
        deny: 0,
        fresh: 0,
    }));
}

export function getInitialState(): WordForgeState {
    const cfg = DIFFICULTY_CONFIG.MEDIUM;
    const s: WordForgeState = {
        phase: "attract",
        mode: "fight",
        difficulty: "MEDIUM",
        cfg,
        wave: 1,
        roster: [],
        spawnTimer: 0.9,
        introT: 0,
        gate: cfg.gate,
        gateMax: cfg.gate,
        scrap: cfg.scrap,
        scrapEarned: 0,
        bots: [],
        shots: [],
        beams: [],
        particles: [],
        popups: [],
        nextId: 1,
        panels: freshPanels(),
        equipped: "pistol",
        weaponSlots: 0,
        perkSlots: 0,
        heat: 0,
        heatView: 0,
        forgedT: 0,
        aim: 0,
        recoil: 0,
        locked: 0,
        buf: "",
        bufFlash: 0,
        modeT: 0,
        streak: 0,
        bestStreak: 0,
        correctKeys: 0,
        totalKeys: 0,
        wordsTyped: 0,
        kills: 0,
        runTimeMs: 0,
        trauma: 0,
        flash: 0,
        hurtFlash: 0,
        goldFlash: 0,
        banner: "",
        bannerSub: "",
        bannerT: 0,
        t: 0,
    };
    unlockFor(s, 1, false);
    return s;
}

export function resetRun(s: WordForgeState, difficulty: Difficulty) {
    const cfg = DIFFICULTY_CONFIG[difficulty];
    s.phase = "intro";
    s.mode = "fight";
    s.difficulty = difficulty;
    s.cfg = cfg;
    s.wave = 1;
    s.roster = [];
    s.spawnTimer = 0;
    s.introT = WAVE_BREAK;
    s.gate = cfg.gate;
    s.gateMax = cfg.gate;
    s.scrap = cfg.scrap;
    s.scrapEarned = 0;
    s.bots = [];
    s.shots = [];
    s.beams = [];
    s.particles = [];
    s.popups = [];
    s.nextId = 1;
    s.panels = freshPanels();
    s.equipped = "pistol";
    s.weaponSlots = 0;
    s.perkSlots = 0;
    s.heat = 0;
    s.heatView = 0;
    s.forgedT = 0;
    s.aim = 0;
    s.recoil = 0;
    s.locked = 0;
    s.buf = "";
    s.bufFlash = 0;
    s.modeT = 0;
    s.streak = 0;
    s.bestStreak = 0;
    s.correctKeys = 0;
    s.totalKeys = 0;
    s.wordsTyped = 0;
    s.kills = 0;
    s.runTimeMs = 0;
    s.trauma = 0;
    s.flash = 0;
    s.hurtFlash = 0;
    s.goldFlash = 0;
    s.banner = "";
    s.bannerSub = "";
    s.bannerT = 0;
    unlockFor(s, 1, false);
    s.roster = buildRoster(1, cfg);
}

/** Put the state back into a self-playing menu backdrop. */
export function resetAttract(s: WordForgeState) {
    resetRun(s, s.difficulty);
    s.phase = "attract";
    s.introT = 0.4;
    s.scrap = 9999;
    s.gate = s.gateMax;
    // the backdrop shows a mid-run loadout so the menu is not an empty corridor
    for (const key of ["sniper", "sharp", "repair", "blast"]) {
        const p = s.panels.find((x) => x.key === key)!;
        if (p.unlocked) continue;
        p.unlocked = true;
        p.slot = defOf(key).kind === "weapon" ? s.weaponSlots++ : s.perkSlots++;
    }
    s.panels.find((p) => p.key === "sharp")!.level = 3;
    s.panels.find((p) => p.key === "blast")!.level = 2;
    s.panels.find((p) => p.key === "shotgun")!.level = 2;
    s.equipped = "shotgun";
}

/**
 * Unlock every panel whose `unlockWave` has arrived. Returns the ones that were
 * newly opened, so the caller can announce them.
 */
export function unlockFor(s: WordForgeState, wave: number, announce = true): PanelDef[] {
    const opened: PanelDef[] = [];
    for (const def of PANELS) {
        if (def.unlockWave > wave) continue;
        const st = s.panels.find((p) => p.key === def.key)!;
        if (st.unlocked) continue;
        st.unlocked = true;
        st.slot = def.kind === "weapon" ? s.weaponSlots++ : s.perkSlots++;
        if (announce) st.fresh = 1;
        opened.push(def);
    }
    return opened;
}

// ==========================================
// SPAWNING
// ==========================================

export function spawnBot(
    s: WordForgeState, kind: BotKind, laneX0: number, laneW: number, scale: number,
): Bot {
    const def = BOT_DEFS[kind];
    const m = laneW * LANE_MARGIN + def.r * scale;
    const span = Math.max(1, laneW - m * 2);
    let x = laneX0 + m + Math.random() * span;
    // Three tries to keep daylight between the new bot and anything still near
    // the top of the lane. Word plates are wide, and two of them overlapping is
    // two words the player cannot read.
    for (let i = 0; i < 3; i++) {
        const clash = s.bots.some(
            (b) => b.deadT === 0 && b.y < 240 * scale && Math.abs(b.x - x) < 165 * scale,
        );
        if (!clash) break;
        x = laneX0 + m + Math.random() * span;
    }
    const word = pickCarry(carryLength(s.cfg, kind), s.cfg.keys, liveInitials(s));
    // One word kills one bot at wave 1 with a level-1 PISTOL — see HP_PER_LETTER.
    const hp = word.length * HP_PER_LETTER * def.tough * hpMul(s.wave);
    const bot: Bot = {
        id: s.nextId++,
        kind,
        x,
        y: SPAWN_Y * scale,
        aimX: x,
        hp,
        maxHp: hp,
        speed: def.speed * speedMul(s.wave, s.cfg.pace) * scale,
        r: def.r * scale,
        dmg: def.dmg,
        pay: def.pay,
        word,
        typed: 0,
        refresh: 0,
        born: 0,
        hit: 0,
        slow: 1,
        slowT: 0,
        wob: Math.random() * Math.PI * 2,
        deadT: 0,
    };
    s.bots.push(bot);
    return bot;
}

/**
 * A bot that outlived its word gets a new one. This is how a tough enemy asks
 * for more typing without ever showing the player a word that "did not work".
 */
export function refreshWord(s: WordForgeState, b: Bot) {
    const avoid = liveInitials(s);
    avoid.delete(b.word[0].toLowerCase());
    b.word = pickCarry(carryLength(s.cfg, b.kind), s.cfg.keys, avoid);
    b.typed = 0;
    b.refresh = 1;
}

// ==========================================
// PARTICLES AND POPUPS — all bounded
// ==========================================

export function addParticle(s: WordForgeState, p: Particle) {
    if (s.particles.length >= PARTICLE_CAP) s.particles.shift();
    s.particles.push(p);
}

export function addPopup(s: WordForgeState, p: Popup) {
    if (s.popups.length >= POPUP_CAP) s.popups.shift();
    s.popups.push(p);
}

export function spawnSparks(
    s: WordForgeState, x: number, y: number, n: number, scale: number, color = "#ffc46b",
) {
    for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = (50 + Math.random() * 190) * scale;
        addParticle(s, {
            kind: "spark", x, y,
            vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            life: 0, ttl: 0.14 + Math.random() * 0.2,
            size: (1.4 + Math.random() * 2.2) * scale,
            color, rot: a, spin: 0, grav: 260 * scale,
        });
    }
}

/** A bot coming apart: shards, embers and a ring. */
export function spawnWreck(
    s: WordForgeState, x: number, y: number, r: number, scale: number, big = false,
) {
    addParticle(s, {
        kind: "ring", x, y, vx: 0, vy: 0,
        life: 0, ttl: big ? 0.55 : 0.34, size: r * 0.9,
        color: big ? "#ffd08a" : "#ff8a3d", rot: 0, spin: 0, grav: 0,
    });
    const n = big ? 26 : 12;
    for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = (60 + Math.random() * (big ? 380 : 230)) * scale;
        addParticle(s, {
            kind: "shard", x, y,
            vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            life: 0, ttl: 0.5 + Math.random() * 0.7,
            size: (2.4 + Math.random() * (big ? 7 : 4.4)) * scale,
            color: i % 3 === 0 ? "#f0d7c6" : i % 3 === 1 ? "#e0503c" : "#8f342a",
            rot: Math.random() * 6, spin: (Math.random() - 0.5) * 14, grav: 320 * scale,
        });
    }
    spawnSparks(s, x, y, big ? 16 : 7, scale);
}

/** The forge flaring when a key lands. */
export function spawnForgeBurst(
    s: WordForgeState, x: number, y: number, scale: number, hot: boolean, n = 10,
) {
    for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
        const sp = (70 + Math.random() * 240) * scale;
        addParticle(s, {
            kind: "ember", x: x + (Math.random() - 0.5) * 26 * scale, y,
            vx: Math.cos(a) * sp * 0.5, vy: Math.sin(a) * sp,
            life: 0, ttl: 0.5 + Math.random() * 0.7,
            size: (1.6 + Math.random() * 3) * scale,
            color: hot ? "#ffe9a8" : "#ff9d2e", rot: 0, spin: 0, grav: -40 * scale,
        });
    }
}

/** A splash blast: a ring plus a puff of smoke. */
export function spawnBlast(
    s: WordForgeState, x: number, y: number, r: number, scale: number, cold: boolean,
) {
    addParticle(s, {
        kind: "ring", x, y, vx: 0, vy: 0,
        life: 0, ttl: 0.4, size: r * 0.6,
        color: cold ? "#8fd8ff" : "#ffb03a", rot: 0, spin: 0, grav: 0,
    });
    for (let i = 0; i < 9; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = (30 + Math.random() * 90) * scale;
        addParticle(s, {
            kind: "smoke", x, y,
            vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            life: 0, ttl: 0.5 + Math.random() * 0.5,
            size: (7 + Math.random() * 12) * scale,
            color: cold ? "rgba(150,210,255,0.32)" : "rgba(255,170,90,0.3)",
            rot: 0, spin: 0, grav: -14 * scale,
        });
    }
    spawnSparks(s, x, y, 8, scale, cold ? "#bfe9ff" : "#ffd08a");
}
