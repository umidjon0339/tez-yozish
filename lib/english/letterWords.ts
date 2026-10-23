// Word pool for the per-letter practice drills (/english/letters/[letter]).
// Simple school-level English words, lowercase a–z only (they are typed in
// the drill and fed to the keyboard highlight layer). Every letter of the
// alphabet appears in enough words to build a drill — rare letters (q, x,
// z, j) have dedicated entries.

export const WORD_POOL: string[] = [
  "apple", "ant", "arm", "art", "ask", "and", "add",
  "ball", "bag", "bed", "big", "bird", "blue", "book", "box", "boy", "bread", "brown", "bus",
  "cat", "cake", "call", "car", "cup", "cold", "corn", "crab", "cry",
  "dog", "day", "dad", "desk", "door", "down", "draw", "drum", "duck",
  "egg", "ear", "eat", "end", "exit", "extra", "exam", "enjoy", "equal",
  "fish", "fan", "far", "fast", "fire", "five", "flag", "fox", "frog", "fun",
  "goat", "game", "girl", "give", "glad", "gold", "good", "green", "grow",
  "hat", "hand", "help", "hen", "hill", "home", "hot", "house", "hug", "happy",
  "ice", "ink", "into", "item", "idea",
  "jam", "jar", "jet", "job", "joke", "joy", "juice", "jump", "just", "jungle",
  "kite", "key", "kid", "king", "kind", "kiss", "kick", "milk", "look", "like",
  "lion", "lamp", "leg", "let", "line", "lips", "list", "long", "love", "lazy",
  "moon", "map", "man", "mix", "mom", "mouse", "music", "make",
  "nose", "name", "nest", "net", "new", "nice", "night", "nine", "note", "next",
  "orange", "old", "one", "open", "out", "over", "own",
  "pen", "pan", "park", "pig", "pink", "play", "pond", "pot", "pull", "push",
  "queen", "quick", "quiet", "quiz", "question", "quite",
  "rain", "rat", "red", "rest", "ride", "ring", "road", "rock", "run",
  "sun", "sad", "sea", "see", "she", "sing", "sit", "six", "sky", "snow", "song", "star", "stop", "sweet", "swim", "size",
  "tree", "ten", "tiger", "time", "top", "toy", "train", "turtle", "two", "taxi", "text",
  "umbrella", "up", "use", "under",
  "van", "very", "vet", "video", "visit", "voice", "seven",
  "water", "wet", "win", "wind", "window", "wolf", "word", "work", "world",
  "yellow", "yes", "you", "yard", "year", "young", "try",
  "zoo", "zebra", "zero", "zone", "prize", "pizza", "crazy", "puzzle",
];

const DRILL_WORDS = 12;

// Words for one letter's drill: words starting with the letter first, then
// words merely containing it; short words before long ones inside each group.
export function wordsForLetter(char: string): string[] {
  const starts: string[] = [];
  const contains: string[] = [];
  for (const w of WORD_POOL) {
    if (w.startsWith(char)) starts.push(w);
    else if (w.includes(char)) contains.push(w);
  }
  const byLen = (a: string, b: string) => a.length - b.length || a.localeCompare(b);
  starts.sort(byLen);
  contains.sort(byLen);
  return [...starts, ...contains].slice(0, DRILL_WORDS);
}

// Words for a confusion drill: mix words with the letter and words with its
// rival letters, preferring words that contain both — those force the choice.
export function wordsForPair(char: string, rivals: string[]): string[] {
  const both: string[] = [];
  const mine: string[] = [];
  const theirs: string[] = [];
  for (const w of WORD_POOL) {
    const hasMine = w.includes(char);
    const hasRival = rivals.some((r) => w.includes(r));
    if (hasMine && hasRival) both.push(w);
    else if (hasMine) mine.push(w);
    else if (hasRival) theirs.push(w);
  }
  const byLen = (a: string, b: string) => a.length - b.length || a.localeCompare(b);
  both.sort(byLen);
  mine.sort(byLen);
  theirs.sort(byLen);
  const out = both.slice(0, 4);
  for (let i = 0; out.length < 10 && (i < mine.length || i < theirs.length); i++) {
    if (i < mine.length) out.push(mine[i]);
    if (out.length < 10 && i < theirs.length) out.push(theirs[i]);
  }
  return out.slice(0, 10);
}
