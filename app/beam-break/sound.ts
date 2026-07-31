/* eslint-disable @typescript-eslint/no-explicit-any */
// =========================================================================
// 🛸 BEAM BREAK — audio. Oscillators and noise buffers only, no mp3 assets
// (same approach as the other three games, so the route stays asset-free).
// One module-level instance is shared by the game; `init()` must be called
// from a user gesture.
//
// There is deliberately NO background music and NO continuous drone: every sound
// here is a short one-shot tied to something the player just did. That keeps the
// keystroke feedback crisp and the route quiet between keys. Rising danger is
// shown, not heard — the beam brightens, the vignette closes in and the animal's
// face reads the panic (see `docs/beam-break.md` §2).
// =========================================================================

export class BeamBreakSound {
    audioCtx: AudioContext | null = null;
    masterGain: GainNode | null = null;
    enabled = false;
    muted = false;

    init() {
        if (typeof window === "undefined" || this.audioCtx) return;
        try {
            const Ctx = window.AudioContext || (window as any).webkitAudioContext;
            this.audioCtx = new Ctx();
            this.masterGain = this.audioCtx.createGain();
            this.masterGain.gain.value = 0.4;
            this.masterGain.connect(this.audioCtx.destination);
            this.enabled = true;
        } catch (e) {
            console.warn("Web Audio API not supported", e);
        }
    }

    resume() {
        if (this.audioCtx && this.audioCtx.state === "suspended") this.audioCtx.resume();
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.masterGain && this.audioCtx) {
            this.masterGain.gain.setTargetAtTime(
                this.muted ? 0 : 0.4, this.audioCtx.currentTime, 0.05,
            );
        }
        return this.muted;
    }

    private ready() {
        return this.enabled && this.audioCtx && this.masterGain && !this.muted;
    }

    private noise(duration: number) {
        if (!this.audioCtx) return null;
        const n = Math.max(1, Math.floor(this.audioCtx.sampleRate * duration));
        const buf = this.audioCtx.createBuffer(1, n, this.audioCtx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
        return buf;
    }

    private blip(
        freq: number, to: number, dur: number,
        type: OscillatorType, vol: number, pan = 0,
    ) {
        if (!this.ready()) return;
        const ctx = this.audioCtx!, t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        if (to !== freq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        const p = ctx.createStereoPanner();
        p.pan.value = pan;
        osc.connect(g).connect(p).connect(this.masterGain!);
        osc.start(t);
        osc.stop(t + dur + 0.02);
    }

    // ==========================================
    // ONE-SHOTS
    // ==========================================

    /** Soft key tick — the pitch climbs through the word so it "sings" upward. */
    playKey(progress: number) {
        this.blip(560 + progress * 400, 640 + progress * 440, 0.032, "sine", 0.2);
        // a tiny click of grit under it, so a keystroke has body
        if (!this.ready()) return;
        const ctx = this.audioCtx!, t = ctx.currentTime;
        const buf = this.noise(0.03);
        if (!buf) return;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const f = ctx.createBiquadFilter();
        f.type = "bandpass";
        f.frequency.value = 2400;
        f.Q.value = 1.2;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.06, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
        src.connect(f).connect(g).connect(this.masterGain!);
        src.start(t);
    }

    /** Wrong key — a soft, low thud. Never harsh: the audience is children. */
    playTypo() {
        if (!this.ready()) return;
        const ctx = this.audioCtx!, t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const f = ctx.createBiquadFilter();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(170, t);
        osc.frequency.exponentialRampToValueAtTime(78, t + 0.1);
        f.type = "lowpass";
        f.frequency.value = 480;
        g.gain.setValueAtTime(0.26, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.connect(f).connect(g).connect(this.masterGain!);
        osc.start(t);
        osc.stop(t + 0.11);
    }

    /**
     * A word broke the grip: a rising whoosh plus a three-note flourish that
     * transposes up with the streak, so a long combo literally sounds better.
     */
    playFree(combo: number) {
        if (!this.ready()) return;
        const ctx = this.audioCtx!, t = ctx.currentTime;
        const buf = this.noise(0.26);
        if (buf) {
            const src = ctx.createBufferSource();
            src.buffer = buf;
            const f = ctx.createBiquadFilter();
            f.type = "bandpass";
            f.frequency.setValueAtTime(420, t);
            f.frequency.exponentialRampToValueAtTime(3000, t + 0.22);
            f.Q.value = 1.3;
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.001, t);
            g.gain.exponentialRampToValueAtTime(0.26, t + 0.05);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
            src.connect(f).connect(g).connect(this.masterGain!);
            src.start(t);
        }
        const step = Math.min(7, Math.floor(combo / 6));
        const semis = Math.pow(2, step / 12);
        [523.25, 659.25, 880].forEach((f, i) => {
            window.setTimeout(() => this.blip(f * semis, f * semis, 0.11, "triangle", 0.2), i * 55);
        });
    }

    /** Golden word — a bright four-note shimmer. */
    playGold() {
        [784, 988, 1319, 1568, 2093].forEach((f, i) => {
            window.setTimeout(() => this.blip(f, f, 0.17, "sine", 0.2), i * 52);
        });
    }

    /** The snare ring charging up — a rising ping so it always telegraphs. */
    playSnareCharge() {
        this.blip(300, 900, 0.5, "sine", 0.16);
        window.setTimeout(() => this.blip(420, 1200, 0.4, "triangle", 0.12), 220);
    }

    /** The snare shattered because a word landed in time. */
    playSnareBurst() {
        if (!this.ready()) return;
        const ctx = this.audioCtx!, t = ctx.currentTime;
        const buf = this.noise(0.2);
        if (buf) {
            const src = ctx.createBufferSource();
            src.buffer = buf;
            const f = ctx.createBiquadFilter();
            f.type = "highpass";
            f.frequency.value = 2200;
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.22, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
            src.connect(f).connect(g).connect(this.masterGain!);
            src.start(t);
        }
        [1568, 2093, 2637].forEach((f, i) => {
            window.setTimeout(() => this.blip(f, f, 0.1, "sine", 0.14), i * 40);
        });
    }

    /** The snare landed — a heavy magnetic clamp. */
    playSnareHit() {
        this.blip(220, 62, 0.34, "sawtooth", 0.2);
        this.blip(110, 44, 0.4, "sine", 0.16);
    }

    /** Swallowed by the saucer — a long descending whoop. */
    playAbduct() {
        if (!this.ready()) return;
        this.blip(760, 90, 0.85, "sawtooth", 0.2);
        this.blip(380, 60, 0.9, "sine", 0.16);
        const ctx = this.audioCtx!, t = ctx.currentTime;
        const buf = this.noise(0.8);
        if (!buf) return;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const f = ctx.createBiquadFilter();
        f.type = "lowpass";
        f.frequency.setValueAtTime(2600, t);
        f.frequency.exponentialRampToValueAtTime(200, t + 0.75);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.2, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
        src.connect(f).connect(g).connect(this.masterGain!);
        src.start(t);
    }

    /** Dropped back onto the sand — a warm, reassuring major chord. */
    playRescue() {
        [392, 494, 587, 784].forEach((f, i) => {
            window.setTimeout(() => this.blip(f, f, 0.4, "sine", 0.16), i * 35);
        });
    }

    /** Level up — the alien's fanfare plus its little chirping voice. */
    playLevelUp() {
        [523, 659, 784, 1047].forEach((f, i) => {
            window.setTimeout(() => this.blip(f, f, 0.22, "triangle", 0.22), i * 88);
        });
        // "alien speech": three quick warbles
        for (let i = 0; i < 3; i++) {
            window.setTimeout(() => {
                const base = 900 + Math.random() * 500;
                this.blip(base, base * 1.7, 0.07, "square", 0.07);
            }, 380 + i * 90);
        }
    }

    playCountBeep(final: boolean) {
        this.blip(final ? 880 : 520, final ? 1180 : 520, final ? 0.28 : 0.12, "triangle", 0.24);
    }

    playDefeat() {
        [392, 330, 262, 196].forEach((f, i) => {
            window.setTimeout(() => this.blip(f, f * 0.98, 0.36, "sine", 0.22), i * 145);
        });
    }
}

export const sfx = new BeamBreakSound();
