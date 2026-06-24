const fs = require('fs');
let code = fs.readFileSync('app/typing-ninja/NinjaWorld.tsx', 'utf8');

// 1. Replace SoundSynthesizer
const newAudioClass = `class SoundSynthesizer {
    audioCtx: AudioContext | null = null;
    masterGain: GainNode | null = null;
    enabled: boolean = false;
    muted: boolean = false;
    bgmTimer: number | null = null;
    nextNoteTime: number = 0;
    bgmStep: number = 0;

    init() {
        if (typeof window !== "undefined" && !this.audioCtx) {
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
    }

    resume() {
        if (this.audioCtx && this.audioCtx.state === "suspended") {
            this.audioCtx.resume();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.masterGain && this.audioCtx) {
            this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.4, this.audioCtx.currentTime, 0.05);
        }
        return this.muted;
    }

    private createNoiseBuffer(duration: number) {
        if (!this.audioCtx) return null;
        const bufferSize = this.audioCtx.sampleRate * duration;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    playKeyTap() {
        if (!this.enabled || !this.audioCtx || !this.masterGain || this.muted) return;
        const t = this.audioCtx.currentTime;
        
        const osc = this.audioCtx.createOscillator();
        const oscGain = this.audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, t);
        oscGain.gain.setValueAtTime(0.5, t);
        oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.015);
        osc.connect(oscGain).connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.015);

        const noiseBuffer = this.createNoiseBuffer(0.015);
        if (noiseBuffer) {
            const noiseSrc = this.audioCtx.createBufferSource();
            noiseSrc.buffer = noiseBuffer;
            const noiseFilter = this.audioCtx.createBiquadFilter();
            noiseFilter.type = "highpass";
            noiseFilter.frequency.value = 2000;
            const noiseGain = this.audioCtx.createGain();
            noiseGain.gain.setValueAtTime(0.3, t);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.015);
            noiseSrc.connect(noiseFilter).connect(noiseGain).connect(this.masterGain);
            noiseSrc.start(t);
        }
    }

    playWordLaunch() {
        if (!this.enabled || !this.audioCtx || !this.masterGain || this.muted) return;
        const t = this.audioCtx.currentTime;

        const osc = this.audioCtx.createOscillator();
        const oscGain = this.audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(900, t);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.065);
        oscGain.gain.setValueAtTime(0.4, t);
        oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.065);
        osc.connect(oscGain).connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.065);

        const noiseBuffer = this.createNoiseBuffer(0.1);
        if (noiseBuffer) {
            const noiseSrc = this.audioCtx.createBufferSource();
            noiseSrc.buffer = noiseBuffer;
            const noiseFilter = this.audioCtx.createBiquadFilter();
            noiseFilter.type = "bandpass";
            noiseFilter.frequency.value = 1200;
            const noiseGain = this.audioCtx.createGain();
            noiseGain.gain.setValueAtTime(0.2, t);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
            noiseSrc.connect(noiseFilter).connect(noiseGain).connect(this.masterGain);
            noiseSrc.start(t);
        }
    }

    playTypo() {
        if (!this.enabled || !this.audioCtx || !this.masterGain || this.muted) return;
        const t = this.audioCtx.currentTime;
        
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        const filter = this.audioCtx.createBiquadFilter();
        
        osc.type = "triangle";
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.04);
        
        filter.type = "lowpass";
        filter.frequency.value = 400;

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.04);
        
        osc.connect(filter).connect(gain).connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.04);
    }

    playEnemyPop() {
        if (!this.enabled || !this.audioCtx || !this.masterGain || this.muted) return;
        const t = this.audioCtx.currentTime;

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        const filter = this.audioCtx.createBiquadFilter();

        osc.type = "sine";
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(550, t + 0.1);

        filter.type = "bandpass";
        filter.frequency.setValueAtTime(300, t);
        filter.frequency.linearRampToValueAtTime(800, t + 0.1);
        filter.Q.value = 10;

        gain.gain.setValueAtTime(0.6, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

        osc.connect(filter).connect(gain).connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.1);
    }

    playFootstep(isRightFoot: boolean) {
        if (!this.enabled || !this.audioCtx || !this.masterGain || this.muted) return;
        const t = this.audioCtx.currentTime;

        const noiseBuffer = this.createNoiseBuffer(0.005);
        if (!noiseBuffer) return;

        const noiseSrc = this.audioCtx.createBufferSource();
        noiseSrc.buffer = noiseBuffer;
        
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = isRightFoot ? 1650 : 1400;
        filter.Q.value = 5;

        const panner = this.audioCtx.createStereoPanner();
        panner.pan.value = isRightFoot ? 0.3 : -0.3;

        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.005);

        noiseSrc.connect(filter).connect(panner).connect(gain).connect(this.masterGain);
        noiseSrc.start(t);
    }

    private makeDistortionCurve(amount = 50) {
        const k = amount;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        for (let i = 0; i < n_samples; ++i) {
            const x = i * 2 / n_samples - 1;
            curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
        }
        return curve;
    }

    playDamage() {
        if (!this.enabled || !this.audioCtx || !this.masterGain || this.muted) return;
        const t = this.audioCtx.currentTime;

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        const distortion = this.audioCtx.createWaveShaper();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(110, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.3);

        distortion.curve = this.makeDistortionCurve(400);
        distortion.oversample = '4x';

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

        osc.connect(distortion).connect(gain).connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.3);
    }

    playDeath() {
        if (!this.enabled || !this.audioCtx || !this.masterGain || this.muted) return;
        const t = this.audioCtx.currentTime;
        
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        
        osc.type = "square";
        
        osc.frequency.setValueAtTime(261.63, t);
        osc.frequency.setValueAtTime(220.00, t + 0.1);
        osc.frequency.setValueAtTime(174.61, t + 0.2);
        osc.frequency.setValueAtTime(130.81, t + 0.3);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.8);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.setValueAtTime(0.2, t + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);

        osc.connect(gain).connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.8);
    }

    startProceduralBGM(getLiveSpeedMultiplier: () => number) {
        if (!this.enabled || !this.audioCtx || !this.masterGain) return;
        
        if (this.bgmTimer) clearTimeout(this.bgmTimer);
        this.nextNoteTime = this.audioCtx.currentTime + 0.1;
        this.bgmStep = 0;

        const scheduleNote = () => {
            if (!this.audioCtx || !this.masterGain) return;

            while (this.nextNoteTime < this.audioCtx.currentTime + 0.1) {
                if (!this.muted) {
                    const mult = getLiveSpeedMultiplier() || 1;
                    const notes = [110.0, 130.81, 164.81, 146.83];
                    const freq = notes[this.bgmStep % 4];

                    const osc = this.audioCtx.createOscillator();
                    const filter = this.audioCtx.createBiquadFilter();
                    const gain = this.audioCtx.createGain();

                    osc.type = "sawtooth";
                    osc.frequency.setValueAtTime(freq, this.nextNoteTime);

                    filter.type = "lowpass";
                    const cutoff = 400 * mult;
                    filter.frequency.setValueAtTime(cutoff, this.nextNoteTime);
                    filter.frequency.exponentialRampToValueAtTime(100, this.nextNoteTime + 0.15);

                    gain.gain.setValueAtTime(0.1, this.nextNoteTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.nextNoteTime + 0.15);

                    osc.connect(filter).connect(gain).connect(this.masterGain);
                    osc.start(this.nextNoteTime);
                    osc.stop(this.nextNoteTime + 0.15);
                }
                
                const mult = getLiveSpeedMultiplier() || 1;
                const secondsPerBeat = 0.6 / mult;
                this.nextNoteTime += secondsPerBeat;
                this.bgmStep++;
            }
            this.bgmTimer = window.setTimeout(scheduleNote, 25) as unknown as number;
        };
        scheduleNote();
    }
}
const sfx = new SoundSynthesizer();`;

code = code.replace(/class SoundSynthesizer \{[\s\S]*?const sfx = new SoundSynthesizer\(\);/, newAudioClass);

// 2. Add playKeyTap() to handleKey
code = code.replace(/const handleKey = \(e: KeyboardEvent\) => \{/, 
`const handleKey = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.altKey || e.metaKey || e.key.length > 1) return;
            if (e.code === "Space") e.preventDefault();
            sfx.playKeyTap();`);

// 3. Update playThrow -> playWordLaunch, playError -> playTypo, playHit -> playEnemyPop
code = code.replace(/sfx\.playThrow\(\)/g, "sfx.playWordLaunch()");
code = code.replace(/sfx\.playError\(\)/g, "sfx.playTypo()");
code = code.replace(/sfx\.playHit\(\)/g, "sfx.playEnemyPop()");

// 4. Add playDeath() after GAME_OVER
code = code.replace(/if \(state\.lives <= 0\) setGameState\("GAME_OVER"\);/g, 
`if (state.lives <= 0) { setGameState("GAME_OVER"); sfx.playDeath(); }`);

// 5. Add startProceduralBGM to startGame
code = code.replace(/setGameState\("PLAYING"\);/, 
`setGameState("PLAYING");
        sfx.startProceduralBGM(() => {
            return 1 + Math.floor(stateRef.current.wordsTyped / 10) * 0.15;
        });`);

// 6. Add playFootstep logic to MinionHero
const minionHeroMatch = code.match(/useFrame\(\(state\) => \{[\s\S]*?\}\);/);
if (minionHeroMatch) {
    const oldUseFrame = minionHeroMatch[0];
    let newUseFrame = oldUseFrame.replace(
        /if \(leftLegRef\.current && rightLegRef\.current\) \{[\s\S]*?rightLegRef\.current\.rotation\.x = Math\.sin\(t \+ Math\.PI\) \* 0\.6;\n        \}/,
        `if (leftLegRef.current && rightLegRef.current) {
            const leftRot = Math.sin(t) * 0.6;
            const rightRot = Math.sin(t + Math.PI) * 0.6;
            leftLegRef.current.rotation.x = leftRot;
            rightLegRef.current.rotation.x = rightRot;
            
            // Detect maximum forward extension (peak of Math.sin)
            const phase = t % (Math.PI * 2);
            if (phaseRef.current < Math.PI/2 && phase >= Math.PI/2) sfx.playFootstep(false);
            if (phaseRef.current < 3*Math.PI/2 && phase >= 3*Math.PI/2) sfx.playFootstep(true);
            if (phase < phaseRef.current && phase >= Math.PI/2) sfx.playFootstep(false);
            phaseRef.current = phase;
        }`
    );
    code = code.replace(/const colors = isPlayer/, `const phaseRef = useRef(0);\n    const colors = isPlayer`);
    code = code.replace(oldUseFrame, newUseFrame);
}

// 7. Add Mute button to HUD
code = code.replace(/<div className="absolute top-4 left-4 flex gap-4 text-white z-10">/, 
`<div className="absolute top-4 left-4 flex gap-4 text-white z-10">
                <button onClick={() => {
                    const isMuted = sfx.toggleMute();
                    // optional visual feedback could go here
                }} className="bg-slate-800 border-2 border-slate-600 px-4 py-2 rounded-xl font-bold uppercase tracking-widest hover:scale-105 transition-transform">
                    Toggle Mute
                </button>`);

fs.writeFileSync('app/typing-ninja/NinjaWorld.tsx', code);
console.log("Updated audio successfully");
