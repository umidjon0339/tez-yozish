/* eslint-disable @typescript-eslint/no-explicit-any */
// =========================================================================
// 🛰️ STAR TYPE — audio. Oscillators and noise buffers only, no mp3 assets
// (same approach as the other games, so the route stays asset-free).
// One module-level instance is shared by the game; `init()` must be called
// from a user gesture.
//
// Every sound is a short one-shot tied to something the player just did. There
// is no music and no drone: the reference is near-silent between shots, and
// that silence is what makes a wave of twenty drones feel tense.
// =========================================================================

export class StarTypeSound {
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
        p.pan.value = Math.max(-1, Math.min(1, pan));
        osc.connect(g).connect(p).connect(this.masterGain!);
        osc.start(t);
        osc.stop(t + dur + 0.02);
    }

    private burst(
        dur: number, from: number, to: number, vol: number,
        kind: BiquadFilterType = "bandpass", pan = 0,
    ) {
        if (!this.ready()) return;
        const ctx = this.audioCtx!, t = ctx.currentTime;
        const buf = this.noise(dur);
        if (!buf) return;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const f = ctx.createBiquadFilter();
        f.type = kind;
        f.frequency.setValueAtTime(from, t);
        f.frequency.exponentialRampToValueAtTime(Math.max(60, to), t + dur);
        f.Q.value = 1;
        const g = ctx.createGain();
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        const p = ctx.createStereoPanner();
        p.pan.value = Math.max(-1, Math.min(1, pan));
        src.connect(f).connect(g).connect(p).connect(this.masterGain!);
        src.start(t);
    }

    // ==========================================
    // ONE-SHOTS
    // ==========================================

    /**
     * A letter fired. The pitch climbs through the word, so a long word
     * literally sings upward and you hear how close you are to the kill.
     */
    playShot(progress: number, pan: number) {
        this.blip(900 + progress * 700, 340, 0.07, "square", 0.09, pan);
        this.burst(0.05, 3600, 900, 0.07, "bandpass", pan);
    }

    /** A drone bursting. */
    playKill(pan: number) {
        this.blip(340, 70, 0.3, "triangle", 0.2, pan);
        this.burst(0.34, 2200, 160, 0.22, "bandpass", pan);
    }

    /** Wrong key — a short, soft low thud. The audience is children. */
    playMiss() {
        this.blip(200, 84, 0.1, "triangle", 0.16);
    }

    /** A new wave arriving. */
    playWave() {
        [392, 523, 659].forEach((f, i) => {
            window.setTimeout(() => this.blip(f, f, 0.26, "sine", 0.14), i * 110);
        });
    }

    /** The ship destroyed — the run is over. */
    playShipDeath() {
        this.blip(520, 40, 1.1, "sawtooth", 0.26);
        this.blip(260, 32, 1.3, "sine", 0.2);
        this.burst(1.2, 3000, 90, 0.28, "lowpass");
        [330, 262, 196, 147].forEach((f, i) => {
            window.setTimeout(() => this.blip(f, f * 0.98, 0.4, "sine", 0.16), 700 + i * 150);
        });
    }
}

export const sfx = new StarTypeSound();
