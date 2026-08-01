/* eslint-disable @typescript-eslint/no-explicit-any */
// =========================================================================
// 👾 ALIEN DROP — audio. Oscillators and noise buffers only, no mp3 assets
// (same approach as the other four games, so the route stays asset-free).
// One module-level instance is shared by the game; `init()` must be called
// from a user gesture.
//
// This game DOES have a continuous voice the others don't: `setAlarm()` drives
// a slow two-tone siren whose rate follows how close the nearest pod is to the
// ground. It is the one piece of information the player cannot get by looking
// at the middle of the screen, which is exactly where their eyes are. It is a
// pulsed one-shot on a timer, not a drone, and it stops the instant the sky is
// clear.
// =========================================================================

export class AlienDropSound {
    audioCtx: AudioContext | null = null;
    masterGain: GainNode | null = null;
    enabled = false;
    muted = false;

    /** 0 = sky is clear, 1 = a pod is about to land. Drives the siren rate. */
    private alarm = 0;
    private alarmTimer: number | null = null;
    private alarmPhase = 0;

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

    private burst(dur: number, from: number, to: number, vol: number, pan = 0) {
        if (!this.ready()) return;
        const ctx = this.audioCtx!, t = ctx.currentTime;
        const buf = this.noise(dur);
        if (!buf) return;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const f = ctx.createBiquadFilter();
        f.type = "bandpass";
        f.frequency.setValueAtTime(from, t);
        f.frequency.exponentialRampToValueAtTime(Math.max(60, to), t + dur);
        f.Q.value = 1.1;
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

    /** The blaster firing. `pan` follows the target's screen x, -1..1. */
    playShot(pan: number) {
        this.blip(880, 180, 0.11, "square", 0.14, pan);
        this.blip(1760, 300, 0.08, "sawtooth", 0.08, pan);
        this.burst(0.09, 3200, 700, 0.14, pan);
    }

    /** A pod bursting. Pitch rises with the streak so a run sounds better. */
    playPop(combo: number, pan: number) {
        const semis = Math.pow(2, Math.min(9, Math.floor(combo / 4)) / 12);
        this.blip(420 * semis, 120, 0.16, "triangle", 0.2, pan);
        this.burst(0.2, 1800, 260, 0.2, pan);
    }

    /** Golden pod — a bright ascending shimmer. */
    playGold() {
        [784, 988, 1319, 1568, 2093].forEach((f, i) => {
            window.setTimeout(() => this.blip(f, f, 0.16, "sine", 0.18), i * 48);
        });
    }

    /** Medic pod — a warm two-note "topped up". */
    playHeal() {
        [523, 784, 1047].forEach((f, i) => {
            window.setTimeout(() => this.blip(f, f, 0.28, "sine", 0.18), i * 70);
        });
    }

    /** Wrong key — a soft low thud. Never harsh: the audience is children. */
    playMiss() {
        if (!this.ready()) return;
        const ctx = this.audioCtx!, t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const f = ctx.createBiquadFilter();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.1);
        f.type = "lowpass";
        f.frequency.value = 460;
        g.gain.setValueAtTime(0.2, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.connect(f).connect(g).connect(this.masterGain!);
        osc.start(t);
        osc.stop(t + 0.11);
    }

    /** A pod cracked open on the ground — the big one. */
    playImpact(pan: number) {
        this.blip(150, 42, 0.42, "sawtooth", 0.26, pan);
        this.blip(74, 34, 0.5, "sine", 0.22, pan);
        this.burst(0.4, 900, 120, 0.26, pan);
    }

    /** The nova going off. */
    playNova() {
        this.burst(0.9, 260, 5200, 0.3);
        [523, 659, 784, 1047, 1319].forEach((f, i) => {
            window.setTimeout(() => this.blip(f, f * 2, 0.3, "triangle", 0.2), i * 55);
        });
    }

    /** The nova meter just filled — a short "ready" chirp. */
    playCharged() {
        [1047, 1319, 1568].forEach((f, i) => {
            window.setTimeout(() => this.blip(f, f, 0.1, "square", 0.11), i * 55);
        });
    }

    /** A pod crossing the danger line. Short, so it can fire often. */
    playWarn(pan: number) {
        this.blip(1200, 900, 0.07, "square", 0.07, pan);
    }

    /** New wave. */
    playWave() {
        [523, 659, 784, 1047].forEach((f, i) => {
            window.setTimeout(() => this.blip(f, f, 0.2, "triangle", 0.2), i * 85);
        });
    }

    /** A swarm is inbound — a descending alien howl. */
    playSwarm() {
        this.blip(180, 900, 0.55, "sawtooth", 0.14);
        window.setTimeout(() => this.blip(900, 200, 0.5, "sawtooth", 0.14), 300);
    }

    playCountBeep(final: boolean) {
        this.blip(final ? 880 : 520, final ? 1180 : 520, final ? 0.28 : 0.12, "triangle", 0.24);
    }

    playDefeat() {
        [392, 330, 262, 196].forEach((f, i) => {
            window.setTimeout(() => this.blip(f, f * 0.98, 0.36, "sine", 0.22), i * 145);
        });
    }

    // ==========================================
    // THE SIREN
    // ==========================================

    /**
     * Set how urgent the sky is (0..1). The siren pulses faster and higher as
     * this rises and stops completely at 0, so silence genuinely means "nothing
     * is about to land". Called once per frame from `step()`.
     */
    setAlarm(level: number) {
        this.alarm = Math.max(0, Math.min(1, level));
        if (this.alarm <= 0.01) {
            this.stopAlarm();
            return;
        }
        if (this.alarmTimer !== null) return;
        const tick = () => {
            if (this.alarm <= 0.01 || !this.ready()) {
                this.stopAlarm();
                return;
            }
            this.alarmPhase ^= 1;
            const base = 300 + this.alarm * 260;
            const f = this.alarmPhase ? base : base * 1.32;
            this.blip(f, f, 0.09, "sine", 0.05 + this.alarm * 0.05);
            const gap = 560 - this.alarm * 380; // ms between beeps
            this.alarmTimer = window.setTimeout(tick, gap);
        };
        tick();
    }

    stopAlarm() {
        if (this.alarmTimer !== null) {
            window.clearTimeout(this.alarmTimer);
            this.alarmTimer = null;
        }
        this.alarm = 0;
    }
}

export const sfx = new AlienDropSound();
