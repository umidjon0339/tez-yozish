/* eslint-disable @typescript-eslint/no-explicit-any */
// =========================================================================
// 🔥 WORD FORGE — audio. Oscillators and noise buffers only, no mp3 assets
// (same approach as the other 2D games, so the route stays asset-free).
// One module-level instance is shared by the game; `init()` must be called
// from a user gesture.
//
// Two things here are not in the sibling games' synths:
//
//   1. **The forge bed.** A single low sawtooth drone whose volume and filter
//      cutoff follow `heat`. It is the only continuous sound in the game and it
//      exists because heat is invisible when your eyes are on the columns —
//      when you stop typing you should HEAR the forge going out. It is started
//      with the run and stopped on pause / quit / game over / unmount.
//   2. **Shot throttling.** A maxed RIFLE at full heat fires ~25 times a
//      second. Scheduling 25 oscillators a second is both ugly and expensive,
//      so `playShot` drops any shot inside `SHOT_MIN_GAP` of the last one and
//      the surviving ones carry the weight.
// =========================================================================

const SHOT_MIN_GAP = 0.055; // seconds — see the header

export class WordForgeSound {
    audioCtx: AudioContext | null = null;
    masterGain: GainNode | null = null;
    enabled = false;
    muted = false;

    private bedOsc: OscillatorNode | null = null;
    private bedSub: OscillatorNode | null = null;
    private bedGain: GainNode | null = null;
    private bedFilter: BiquadFilterNode | null = null;
    private lastShot = 0;

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
        type: OscillatorType, vol: number, pan = 0, delay = 0,
    ) {
        if (!this.ready()) return;
        const ctx = this.audioCtx!, t = ctx.currentTime + delay;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        if (to !== freq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        const p = ctx.createStereoPanner();
        p.pan.value = Math.max(-1, Math.min(1, pan));
        osc.connect(g).connect(p).connect(this.masterGain!);
        osc.start(t);
        osc.stop(t + dur + 0.03);
    }

    private burst(
        dur: number, from: number, to: number, vol: number,
        kind: BiquadFilterType = "bandpass", pan = 0, q = 1, delay = 0,
    ) {
        if (!this.ready()) return;
        const ctx = this.audioCtx!, t = ctx.currentTime + delay;
        const buf = this.noise(dur);
        if (!buf) return;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const f = ctx.createBiquadFilter();
        f.type = kind;
        f.frequency.setValueAtTime(from, t);
        f.frequency.exponentialRampToValueAtTime(Math.max(60, to), t + dur);
        f.Q.value = q;
        const g = ctx.createGain();
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        const p = ctx.createStereoPanner();
        p.pan.value = Math.max(-1, Math.min(1, pan));
        src.connect(f).connect(g).connect(p).connect(this.masterGain!);
        src.start(t);
    }

    // ==========================================
    // THE FORGE BED — the only continuous sound
    // ==========================================

    startBed() {
        if (!this.enabled || !this.audioCtx || !this.masterGain || this.bedOsc) return;
        const ctx = this.audioCtx;
        const t = ctx.currentTime;
        this.bedFilter = ctx.createBiquadFilter();
        this.bedFilter.type = "lowpass";
        this.bedFilter.frequency.value = 190;
        this.bedFilter.Q.value = 3;
        this.bedGain = ctx.createGain();
        this.bedGain.gain.value = 0.0001;

        this.bedOsc = ctx.createOscillator();
        this.bedOsc.type = "sawtooth";
        this.bedOsc.frequency.setValueAtTime(58, t);
        this.bedSub = ctx.createOscillator();
        this.bedSub.type = "sine";
        this.bedSub.frequency.setValueAtTime(29, t);

        this.bedOsc.connect(this.bedFilter);
        this.bedSub.connect(this.bedFilter);
        this.bedFilter.connect(this.bedGain).connect(this.masterGain);
        this.bedOsc.start(t);
        this.bedSub.start(t);
    }

    /** Follow the forge: `heat` 0→1. Called from the HUD tick, not per frame. */
    setHeat(heat: number) {
        if (!this.audioCtx || !this.bedGain || !this.bedFilter) return;
        const t = this.audioCtx.currentTime;
        this.bedGain.gain.setTargetAtTime(0.02 + heat * 0.1, t, 0.25);
        this.bedFilter.frequency.setTargetAtTime(150 + heat * 520, t, 0.3);
        this.bedOsc?.frequency.setTargetAtTime(56 + heat * 14, t, 0.4);
    }

    stopBed() {
        if (!this.audioCtx) return;
        const t = this.audioCtx.currentTime;
        this.bedGain?.gain.setTargetAtTime(0.0001, t, 0.1);
        const osc = this.bedOsc, sub = this.bedSub;
        this.bedOsc = null;
        this.bedSub = null;
        try {
            osc?.stop(t + 0.4);
            sub?.stop(t + 0.4);
        } catch { /* already stopped */ }
    }

    // ==========================================
    // TYPING
    // ==========================================

    /** A letter accepted. The pitch climbs through the word. */
    playKey(progress: number) {
        this.blip(520 + progress * 620, 480 + progress * 500, 0.035, "square", 0.05);
    }

    /** A letter that continues nothing — soft and low. The audience is children. */
    playReject() {
        this.blip(190, 96, 0.09, "triangle", 0.13);
    }

    /** A word bought: the anvil. */
    playBuy(level: number) {
        const base = 480 + level * 70;
        this.blip(base * 2, base, 0.13, "square", 0.14);
        this.blip(base, base * 0.62, 0.34, "triangle", 0.16);
        this.burst(0.16, 5200, 900, 0.16, "bandpass", 0, 1.4);
        this.blip(base * 3.02, base * 2.4, 0.5, "sine", 0.07, 0, 0.02);
    }

    /** A word you could not pay for. */
    playDeny() {
        this.blip(150, 108, 0.16, "square", 0.11);
        this.burst(0.1, 700, 240, 0.07, "lowpass");
    }

    /** Swapping to a different weapon — a mechanical chunk. */
    playEquip() {
        this.blip(300, 168, 0.09, "square", 0.12);
        this.burst(0.08, 2600, 500, 0.13, "bandpass");
    }

    /** The gate patched up. */
    playRepair() {
        [523, 659, 784, 1046].forEach((f, i) => {
            this.blip(f, f, 0.24, "sine", 0.12, 0, i * 0.055);
        });
    }

    /** A new panel opened on the menu. */
    playUnlock() {
        [392, 587, 784, 1175].forEach((f, i) => {
            this.blip(f, f, 0.3, "triangle", 0.12, 0, i * 0.075);
        });
        this.burst(0.5, 6000, 1400, 0.07, "bandpass", 0, 1.2);
    }

    /** The forge hit full heat. */
    playForged() {
        this.blip(330, 1320, 0.5, "sawtooth", 0.1);
        [660, 880, 1320].forEach((f, i) => {
            this.blip(f, f, 0.5, "sine", 0.09, 0, i * 0.05);
        });
        this.burst(0.6, 1200, 8000, 0.09, "bandpass", 0, 0.8);
    }

    // ==========================================
    // COMBAT
    // ==========================================

    /**
     * One shot. `weapon` picks the character; `pan` places it across the lane.
     * Throttled — see the header.
     */
    playShot(weapon: string, pan: number) {
        if (!this.ready()) return;
        const now = this.audioCtx!.currentTime;
        if (now - this.lastShot < SHOT_MIN_GAP) return;
        this.lastShot = now;
        switch (weapon) {
            case "shotgun":
                this.blip(230, 60, 0.19, "square", 0.13, pan);
                this.burst(0.24, 2600, 200, 0.2, "lowpass", pan);
                break;
            case "rifle":
                this.blip(760, 300, 0.035, "square", 0.07, pan);
                this.burst(0.04, 4200, 1400, 0.07, "bandpass", pan);
                break;
            case "sniper":
                this.blip(1500, 180, 0.14, "sawtooth", 0.14, pan);
                this.burst(0.3, 7000, 300, 0.16, "bandpass", pan, 0.8);
                break;
            case "cannon":
                this.blip(150, 42, 0.3, "triangle", 0.2, pan);
                this.burst(0.34, 1400, 90, 0.2, "lowpass", pan);
                break;
            case "laser":
                this.blip(2100, 520, 0.11, "sawtooth", 0.1, pan);
                this.burst(0.09, 6000, 2200, 0.07, "bandpass", pan, 2);
                break;
            case "plasma":
                this.blip(420, 90, 0.3, "sine", 0.16, pan);
                this.blip(900, 200, 0.24, "triangle", 0.08, pan);
                this.burst(0.3, 900, 160, 0.12, "lowpass", pan);
                break;
            default: // pistol
                this.blip(680, 190, 0.07, "square", 0.11, pan);
                this.burst(0.07, 3400, 800, 0.1, "bandpass", pan);
        }
    }

    /** A bot coming apart. `big` is a tank or a brute. */
    playKill(pan: number, big: boolean) {
        if (big) {
            this.blip(210, 44, 0.4, "triangle", 0.2, pan);
            this.burst(0.46, 2000, 110, 0.22, "lowpass", pan);
        } else {
            this.blip(300, 96, 0.11, "square", 0.1, pan);
            this.burst(0.13, 2400, 400, 0.11, "bandpass", pan);
        }
    }

    /** A splash weapon going off. */
    playBlast(pan: number, cold: boolean) {
        if (cold) {
            this.blip(700, 180, 0.34, "sine", 0.13, pan);
            this.burst(0.36, 4200, 500, 0.14, "bandpass", pan, 0.7);
        } else {
            this.blip(130, 40, 0.32, "triangle", 0.17, pan);
            this.burst(0.36, 1800, 90, 0.19, "lowpass", pan);
        }
    }

    /** A brute's armour shattering — the biggest sound in the game. */
    playArmorBreak(pan: number) {
        this.blip(880, 120, 0.42, "sawtooth", 0.2, pan);
        this.blip(1760, 300, 0.26, "square", 0.11, pan);
        this.burst(0.7, 9000, 400, 0.24, "bandpass", pan, 0.6);
        [660, 523, 392].forEach((f, i) => {
            this.blip(f, f * 0.97, 0.3, "sine", 0.11, pan, 0.1 + i * 0.07);
        });
    }

    /** A bot reaching the gate. */
    playGateHit(heavy: boolean) {
        this.blip(heavy ? 92 : 130, 34, heavy ? 0.5 : 0.3, "triangle", heavy ? 0.28 : 0.19);
        this.burst(heavy ? 0.55 : 0.32, 900, 60, heavy ? 0.28 : 0.18, "lowpass");
    }

    /** A wave starting — the works horn. */
    playWave(brute: boolean) {
        if (brute) {
            [147, 147, 175].forEach((f, i) => {
                this.blip(f, f, 0.6, "sawtooth", 0.15, 0, i * 0.34);
            });
        } else {
            [196, 262].forEach((f, i) => {
                this.blip(f, f, 0.44, "triangle", 0.14, 0, i * 0.16);
            });
        }
    }

    /** The gate broken — the run is over. */
    playGameOver() {
        this.blip(320, 34, 1.2, "sawtooth", 0.24);
        this.blip(160, 28, 1.4, "sine", 0.2);
        this.burst(1.3, 2600, 70, 0.26, "lowpass");
        [262, 208, 156, 117].forEach((f, i) => {
            this.blip(f, f * 0.98, 0.5, "sine", 0.15, 0, 0.75 + i * 0.17);
        });
    }
}

export const sfx = new WordForgeSound();
