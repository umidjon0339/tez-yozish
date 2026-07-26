// Audio for the English units (phonemes / letters / graphemes): one place
// that decides HOW a word or sound is voiced.
//
// Strategy — recordings first, robot voice second:
//   1. If a recording exists under public/audio/, play it:
//        /audio/words/<word>.mp3        ("sheep" → /audio/words/sheep.mp3)
//        /audio/phonemes/<slug>.mp3     (/iː/ → /audio/phonemes/ee.mp3)
//   2. Otherwise fall back to the browser's speech synthesis (Web Speech
//      API) — zero setup, works offline, but robotic.
//
// Dropping mp3 files into those folders upgrades the whole English section
// with no code changes. Missing files are remembered per session so each
// URL is only probed once. See app/english/phonemes/README.md ("Audio")
// for where to download or generate the recordings.

const missing = new Set<string>(); // URLs that 404'd this session
const players = new Map<string, HTMLAudioElement>();
let current: HTMLAudioElement | null = null;

function stopAll() {
  if (current) {
    current.pause();
    current.currentTime = 0;
    current = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

/** Robot-voice fallback (Web Speech API). */
function speakTts(text: string, rate = 0.8) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = rate;
  window.speechSynthesis.speak(u);
}

/** Play a recording if it exists, else speak `ttsText` (defaults to the
 *  file's base name). Safe to call repeatedly — restarts the clip. */
function playOrSpeak(url: string, ttsText: string) {
  if (typeof window === "undefined") return;
  stopAll();
  if (missing.has(url)) {
    speakTts(ttsText);
    return;
  }
  let audio = players.get(url);
  if (!audio) {
    audio = new Audio(url);
    audio.preload = "auto";
    players.set(url, audio);
  }
  const el = audio;
  el.currentTime = 0;
  el.play()
    .then(() => {
      current = el;
    })
    .catch(() => {
      // 404 / decode error / autoplay refusal — remember and fall back.
      missing.add(url);
      speakTts(ttsText);
    });
}

/** Say one English word ("sheep"). */
export function speakWord(word: string) {
  playOrSpeak(`/audio/words/${word.toLowerCase()}.mp3`, word);
}

/** Say a short phrase ("sheep, ship") — phrases are never recorded. */
export function speakPhrase(text: string) {
  stopAll();
  speakTts(text);
}

/** Play a phoneme's sound. Recordings live under its slug
 *  (/audio/phonemes/ee.mp3); the fallback says `fallbackWord` because
 *  speech synthesis cannot pronounce bare IPA. */
export function speakPhonemeSound(slug: string, fallbackWord: string) {
  playOrSpeak(`/audio/phonemes/${slug}.mp3`, fallbackWord);
}
