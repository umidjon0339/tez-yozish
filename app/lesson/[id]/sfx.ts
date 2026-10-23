// ─── Low-latency SFX (Web Audio) ───
// `new Audio(url)` per keystroke rebuilt the element + decoded the mp3 every
// press (20-200ms of jitter), and pause() after 300ms cut the sample with a
// pop. Instead: decode each mp3 ONCE into an AudioBuffer, then every press
// just triggers a BufferSource — ~1ms latency, overlaps freely, and the
// keystroke cutoff is a 40ms fade instead of a hard stop.
let sfxCtx: AudioContext | null = null;
const sfxBuffers = new Map<string, AudioBuffer>();
const sfxPending = new Map<string, Promise<void>>();

function getSfxCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!sfxCtx) {
    try {
      sfxCtx = new AudioContext();
    } catch {
      return null;
    }
  }
  return sfxCtx;
}

function loadSfx(url: string) {
  const ctx = getSfxCtx();
  if (!ctx || sfxBuffers.has(url) || sfxPending.has(url)) return;
  const pending = fetch(url)
    .then((r) => r.arrayBuffer())
    .then((data) => ctx.decodeAudioData(data))
    .then((buffer) => {
      sfxBuffers.set(url, buffer);
    })
    .catch(() => {
      sfxPending.delete(url); // allow a retry on the next play attempt
    });
  sfxPending.set(url, pending);
}

// Warm the cache on mount so even the very first keystroke is instant.
export function preloadSfx() {
  loadSfx("/press_key4.mp3");
  loadSfx("/error2.mp3");
}

function playSfx(url: string, volume: number, maxSeconds?: number) {
  const ctx = getSfxCtx();
  if (!ctx) return;
  // The context starts suspended until a user gesture; keydown counts as one.
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const buffer = sfxBuffers.get(url);
  if (!buffer) {
    loadSfx(url); // still decoding — skip this press rather than lag behind it
    return;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  const t0 = ctx.currentTime;
  gain.gain.setValueAtTime(volume, t0);
  const dur = Math.min(maxSeconds ?? buffer.duration, buffer.duration);
  if (dur < buffer.duration) {
    gain.gain.setValueAtTime(volume, t0 + Math.max(0, dur - 0.04));
    gain.gain.linearRampToValueAtTime(0, t0 + dur);
  }
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start(t0, 0, dur + 0.01);
}

export const playKeystrokeSound = () => playSfx("/press_key4.mp3", 1, 0.3);
export const playErrorSound = () => playSfx("/error2.mp3", 0.8);
