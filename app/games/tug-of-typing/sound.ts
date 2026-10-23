/* eslint-disable @typescript-eslint/no-explicit-any */
// =========================================================================
// 🪢 TUG OF TYPING — audio. Oscillators and noise buffers only, no mp3 assets
// (same approach as the other games, so the route stays asset-free).
//
// There is no music at all: a tug-of-war should sound like effort and a
// crowd, so the game only ever plays rope ticks, grunts, a whistle and the
// crowd reacting.
// =========================================================================

export class TugSound {
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

    /** Rope-fibre tick on every correct key; pitch climbs through the word. */
    playKey(progress: number) {
        this.blip(520 + progress * 380, 600 + progress * 420, 0.03, "square", 0.12, 0.25);
        if (!this.ready()) return;
        const ctx = this.audioCtx!, t = ctx.currentTime;
        const buf = this.noise(0.05);
        if (!buf) return;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const f = ctx.createBiquadFilter();
        f.type = "bandpass";
        f.frequency.value = 2200 + progress * 900;
        f.Q.value = 2.2;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.1, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        src.connect(f).connect(g).connect(this.masterGain!);
        src.start(t);
    }

    /** Word won: a grunt plus the rope snapping taut. `mine` picks the side. */
    playHeave(mine: boolean) {
        if (!this.ready()) return;
        const ctx = this.audioCtx!, t = ctx.currentTime;
        const pan = mine ? 0.35 : -0.35;
        // grunt: filtered noise swell
        const buf = this.noise(0.3);
        if (buf) {
            const src = ctx.createBufferSource();
            src.buffer = buf;
            const f = ctx.createBiquadFilter();
            f.type = "bandpass";
            f.frequency.setValueAtTime(mine ? 420 : 300, t);
            f.frequency.exponentialRampToValueAtTime(mine ? 180 : 130, t + 0.26);
            f.Q.value = 3.5;
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.001, t);
            g.gain.exponentialRampToValueAtTime(0.34, t + 0.05);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
            const p = ctx.createStereoPanner();
            p.pan.value = pan;
            src.connect(f).connect(g).connect(p).connect(this.masterGain!);
            src.start(t);
        }
        // the rope going taut
        this.blip(mine ? 180 : 140, mine ? 90 : 70, 0.16, "sawtooth", 0.16, pan);
        if (mine) window.setTimeout(() => this.blip(660, 880, 0.1, "triangle", 0.16, pan), 60);
    }

    playTypo() {
        if (!this.ready()) return;
        const ctx = this.audioCtx!, t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const f = ctx.createBiquadFilter();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(170, t);
        osc.frequency.exponentialRampToValueAtTime(65, t + 0.09);
        f.type = "lowpass";
        f.frequency.value = 480;
        g.gain.setValueAtTime(0.3, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        osc.connect(f).connect(g).connect(this.masterGain!);
        osc.start(t);
        osc.stop(t + 0.1);
    }

    playWhistle() {
        if (!this.ready()) return;
        const ctx = this.audioCtx!, t = ctx.currentTime;
        for (const [i, base] of [1750, 1500].entries()) {
            const osc = ctx.createOscillator();
            const lfo = ctx.createOscillator();
            const lfoGain = ctx.createGain();
            const g = ctx.createGain();
            osc.type = "sine";
            osc.frequency.value = base;
            lfo.frequency.value = 22;
            lfoGain.gain.value = 90;
            lfo.connect(lfoGain).connect(osc.frequency);
            g.gain.setValueAtTime(0.001, t);
            g.gain.exponentialRampToValueAtTime(0.16, t + 0.04);
            g.gain.setValueAtTime(0.16, t + 0.3);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
            const p = ctx.createStereoPanner();
            p.pan.value = i === 0 ? -0.1 : 0.1;
            osc.connect(g).connect(p).connect(this.masterGain!);
            osc.start(t);
            osc.stop(t + 0.5);
            lfo.start(t);
            lfo.stop(t + 0.5);
        }
    }

    playCountBeep() {
        this.blip(520, 520, 0.12, "triangle", 0.26);
    }

    /** Crowd noise: a filtered noise swell, bright for a cheer, dull for a boo. */
    private crowd(cheer: boolean, dur = 1.4) {
        if (!this.ready()) return;
        const ctx = this.audioCtx!, t = ctx.currentTime;
        const buf = this.noise(dur);
        if (!buf) return;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const f = ctx.createBiquadFilter();
        f.type = "bandpass";
        f.frequency.setValueAtTime(cheer ? 700 : 240, t);
        f.frequency.linearRampToValueAtTime(cheer ? 1500 : 180, t + dur * 0.4);
        f.Q.value = 0.7;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.001, t);
        g.gain.exponentialRampToValueAtTime(cheer ? 0.3 : 0.2, t + 0.18);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        src.connect(f).connect(g).connect(this.masterGain!);
        src.start(t);
    }

    /** Level cleared — the crowd goes up and a rising fanfare plays. */
    playLevelUp() {
        this.crowd(true, 1.6);
        [523, 659, 784, 1047, 1319].forEach((f, i) => {
            window.setTimeout(() => this.blip(f, f, 0.26, "triangle", 0.23), i * 95);
        });
    }

    /** The rope is lost — the run is over. */
    playDefeat() {
        this.crowd(false, 1.8);
        [392, 349, 294, 196].forEach((f, i) => {
            window.setTimeout(() => this.blip(f, f * 0.97, 0.36, "sine", 0.22), i * 150);
        });
    }

}

export const sfx = new TugSound();
