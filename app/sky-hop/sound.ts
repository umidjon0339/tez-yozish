/* eslint-disable @typescript-eslint/no-explicit-any */
// =========================================================================
// 🎈 SKY HOP — audio. Oscillators and noise buffers only, no mp3 assets
// (same approach as typing-ninja / rhino-dash, so the route stays asset-free).
// One module-level instance is shared by the game; `init()` must be called
// from a user gesture.
// =========================================================================

export class SkyHopSound {
    audioCtx: AudioContext | null = null;
    masterGain: GainNode | null = null;
    enabled = false;
    muted = false;
    private bgmTimer: number | null = null;
    private bgmStep = 0;
    private nextNoteTime = 0;
    private tempoFn: (() => number) | null = null;

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
            this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.4, this.audioCtx.currentTime, 0.05);
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

    private blip(freq: number, to: number, dur: number, type: OscillatorType, vol: number, pan = 0) {
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

    /** Soft key tick — pitch climbs through the word so a word "sings" upward. */
    playKey(progress: number) {
        this.blip(620 + progress * 420, 700 + progress * 460, 0.035, "sine", 0.22);
    }

    /** Air puff on every correct key (the balloon gaining lift). */
    playPuff() {
        if (!this.ready()) return;
        const ctx = this.audioCtx!, t = ctx.currentTime;
        const buf = this.noise(0.12);
        if (!buf) return;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const f = ctx.createBiquadFilter();
        f.type = "bandpass";
        f.frequency.setValueAtTime(900, t);
        f.frequency.exponentialRampToValueAtTime(2600, t + 0.1);
        f.Q.value = 0.9;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.16, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
        src.connect(f).connect(g).connect(this.masterGain!);
        src.start(t);
    }

    /** Word finished — whoosh up plus a bright two-note hop. */
    playHop() {
        if (!this.ready()) return;
        const ctx = this.audioCtx!, t = ctx.currentTime;
        const buf = this.noise(0.24);
        if (buf) {
            const src = ctx.createBufferSource();
            src.buffer = buf;
            const f = ctx.createBiquadFilter();
            f.type = "bandpass";
            f.frequency.setValueAtTime(500, t);
            f.frequency.exponentialRampToValueAtTime(2800, t + 0.2);
            f.Q.value = 1.4;
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.001, t);
            g.gain.exponentialRampToValueAtTime(0.3, t + 0.06);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
            src.connect(f).connect(g).connect(this.masterGain!);
            src.start(t);
        }
        this.blip(520, 780, 0.09, "triangle", 0.24);
        window.setTimeout(() => this.blip(780, 1040, 0.1, "triangle", 0.2), 70);
    }

    /** Balloon burst — sharp noise crack with a descending body. */
    playPop() {
        if (!this.ready()) return;
        const ctx = this.audioCtx!, t = ctx.currentTime;
        const buf = this.noise(0.09);
        if (buf) {
            const src = ctx.createBufferSource();
            src.buffer = buf;
            const f = ctx.createBiquadFilter();
            f.type = "highpass";
            f.frequency.value = 700;
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.42, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
            src.connect(f).connect(g).connect(this.masterGain!);
            src.start(t);
        }
        this.blip(240, 70, 0.12, "square", 0.18);
    }

    playGold() {
        [784, 988, 1319, 1568].forEach((f, i) => {
            window.setTimeout(() => this.blip(f, f, 0.16, "sine", 0.22), i * 55);
        });
    }

    playTypo() {
        if (!this.ready()) return;
        const ctx = this.audioCtx!, t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const f = ctx.createBiquadFilter();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.exponentialRampToValueAtTime(70, t + 0.09);
        f.type = "lowpass";
        f.frequency.value = 500;
        g.gain.setValueAtTime(0.32, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        osc.connect(f).connect(g).connect(this.masterGain!);
        osc.start(t);
        osc.stop(t + 0.1);
    }

    /** Crow caw — two rasping notes with a vibrato wobble. */
    playCaw() {
        if (!this.ready()) return;
        const ctx = this.audioCtx!, t = ctx.currentTime;
        for (const [i, base] of [420, 340].entries()) {
            const start = t + i * 0.17;
            const osc = ctx.createOscillator();
            const lfo = ctx.createOscillator();
            const lfoGain = ctx.createGain();
            const g = ctx.createGain();
            const f = ctx.createBiquadFilter();
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(base, start);
            osc.frequency.exponentialRampToValueAtTime(base * 0.62, start + 0.15);
            lfo.frequency.value = 28;
            lfoGain.gain.value = 40;
            lfo.connect(lfoGain).connect(osc.frequency);
            f.type = "bandpass";
            f.frequency.value = 1100;
            f.Q.value = 1.6;
            g.gain.setValueAtTime(0.001, start);
            g.gain.exponentialRampToValueAtTime(0.22, start + 0.03);
            g.gain.exponentialRampToValueAtTime(0.001, start + 0.16);
            osc.connect(f).connect(g).connect(this.masterGain!);
            osc.start(start);
            osc.stop(start + 0.18);
            lfo.start(start);
            lfo.stop(start + 0.18);
        }
    }

    playSplash() {
        if (!this.ready()) return;
        const ctx = this.audioCtx!, t = ctx.currentTime;
        const buf = this.noise(0.7);
        if (buf) {
            const src = ctx.createBufferSource();
            src.buffer = buf;
            const f = ctx.createBiquadFilter();
            f.type = "lowpass";
            f.frequency.setValueAtTime(2600, t);
            f.frequency.exponentialRampToValueAtTime(240, t + 0.6);
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.4, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
            src.connect(f).connect(g).connect(this.masterGain!);
            src.start(t);
        }
        this.blip(300, 90, 0.35, "sine", 0.2);
    }

    playStageUp() {
        [523, 659, 784, 1047].forEach((f, i) => {
            window.setTimeout(() => this.blip(f, f, 0.22, "triangle", 0.24), i * 90);
        });
    }

    playCountBeep(final: boolean) {
        this.blip(final ? 880 : 520, final ? 1180 : 520, final ? 0.28 : 0.12, "triangle", 0.26);
    }

    playDefeat() {
        this.stopBGM();
        [392, 330, 262, 196].forEach((f, i) => {
            window.setTimeout(() => this.blip(f, f * 0.98, 0.34, "sine", 0.24), i * 140);
        });
    }

    // --- gentle procedural BGM: an airy arpeggio pad that speeds up with the run ---
    startBGM(tempoFn: () => number) {
        if (!this.enabled || this.bgmTimer !== null) return;
        this.tempoFn = tempoFn;
        this.bgmStep = 0;
        this.nextNoteTime = this.audioCtx ? this.audioCtx.currentTime + 0.1 : 0;
        const SCALE = [261.63, 329.63, 392, 523.25, 659.25, 523.25, 392, 329.63];
        const tick = () => {
            if (!this.audioCtx || !this.masterGain) return;
            const ctx = this.audioCtx;
            const rate = this.tempoFn ? this.tempoFn() : 1;
            const step = 0.34 / Math.max(0.7, rate);
            while (this.nextNoteTime < ctx.currentTime + 0.25) {
                const t = this.nextNoteTime;
                if (!this.muted) {
                    const n = SCALE[this.bgmStep % SCALE.length];
                    const osc = ctx.createOscillator();
                    const g = ctx.createGain();
                    osc.type = "sine";
                    osc.frequency.value = n;
                    g.gain.setValueAtTime(0.0001, t);
                    g.gain.exponentialRampToValueAtTime(0.05, t + 0.05);
                    g.gain.exponentialRampToValueAtTime(0.0001, t + step * 1.7);
                    const p = ctx.createStereoPanner();
                    p.pan.value = ((this.bgmStep % 4) - 1.5) / 3;
                    osc.connect(g).connect(p).connect(this.masterGain);
                    osc.start(t);
                    osc.stop(t + step * 1.8);
                    // soft bass every 4th step
                    if (this.bgmStep % 4 === 0) {
                        const b = ctx.createOscillator();
                        const bg = ctx.createGain();
                        b.type = "sine";
                        b.frequency.value = n / 4;
                        bg.gain.setValueAtTime(0.0001, t);
                        bg.gain.exponentialRampToValueAtTime(0.06, t + 0.06);
                        bg.gain.exponentialRampToValueAtTime(0.0001, t + step * 3);
                        b.connect(bg).connect(this.masterGain);
                        b.start(t);
                        b.stop(t + step * 3.1);
                    }
                }
                this.nextNoteTime += step;
                this.bgmStep++;
            }
        };
        this.bgmTimer = window.setInterval(tick, 90);
    }

    stopBGM() {
        if (this.bgmTimer !== null) {
            window.clearInterval(this.bgmTimer);
            this.bgmTimer = null;
        }
        this.tempoFn = null;
    }
}

export const sfx = new SkyHopSound();
