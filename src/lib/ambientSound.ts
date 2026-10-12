/**
 * 1980s Miami Club Music & Subtle Casino Floor Ambient Procedural Sound Engine
 * Uses Web Audio API for zero-dependency, ultra-crisp, infinite generative audio.
 */

export type AmbientTrack = 'ocean-drive' | 'babylon-club' | 'sunset-biscayne';

export interface AmbientSoundState {
  isPlaying: boolean;
  isMuted: boolean;
  masterVolume: number;     // 0.0 to 1.0
  musicVolume: number;      // 0.0 to 1.0
  casinoVolume: number;     // 0.0 to 1.0
  activeTrack: AmbientTrack;
}

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private casinoGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  private isPlaying: boolean = false;
  private isMuted: boolean = false;
  private masterVolume: number = 0.40;
  private musicVolume: number = 0.65;
  private casinoVolume: number = 0.35;
  private activeTrack: AmbientTrack = 'ocean-drive';

  // Music sequencer timing
  private timerId: number | null = null;
  private currentStep: number = 0;
  private nextNoteTime: number = 0;
  private tempo: number = 118; // BPM

  // Casino floor generator timers
  private casinoIntervalId: number | null = null;

  // Listeners for UI state reactivity
  private listeners: Set<(state: AmbientSoundState) => void> = new Set();

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.casinoGain = this.ctx.createGain();
      this.analyser = this.ctx.createAnalyser();

      if (this.analyser) {
        this.analyser.fftSize = 64;
      }

      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.casinoGain.gain.setValueAtTime(this.casinoVolume, this.ctx.currentTime);

      this.musicGain.connect(this.masterGain);
      this.casinoGain.connect(this.masterGain);

      if (this.analyser) {
        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
      } else {
        this.masterGain.connect(this.ctx.destination);
      }
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public subscribe(cb: (state: AmbientSoundState) => void): () => void {
    this.listeners.add(cb);
    cb(this.getState());
    return () => this.listeners.delete(cb);
  }

  private notify() {
    const s = this.getState();
    this.listeners.forEach(cb => cb(s));
  }

  public getState(): AmbientSoundState {
    return {
      isPlaying: this.isPlaying,
      isMuted: this.isMuted,
      masterVolume: this.masterVolume,
      musicVolume: this.musicVolume,
      casinoVolume: this.casinoVolume,
      activeTrack: this.activeTrack,
    };
  }

  public getAnalyserData(): Uint8Array | null {
    if (!this.analyser || !this.isPlaying || this.isMuted) return null;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }

  // Toggle playback
  public togglePlay(): boolean {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
    return this.isPlaying;
  }

  public start() {
    this.initContext();
    if (!this.ctx) return;

    if (this.isPlaying) return;
    this.isPlaying = true;
    this.currentStep = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.05;

    // Fade in master
    const now = this.ctx.currentTime;
    if (this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(0.001, now);
      this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : this.masterVolume, now + 0.6);
    }

    // Set tempo by track
    this.updateTempoForTrack();

    // Start music scheduler loop
    this.scheduler();
    this.timerId = window.setInterval(() => this.scheduler(), 25);

    // Start casino floor background generator
    this.startCasinoFloorGenerator();

    this.notify();
  }

  public stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;

    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.casinoIntervalId) {
      clearInterval(this.casinoIntervalId);
      this.casinoIntervalId = null;
    }

    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(0.001, now + 0.4);
    }

    this.notify();
  }

  public setMasterVolume(val: number) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx && !this.isMuted) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(this.masterVolume, now + 0.05);
    }
    this.notify();
  }

  public setMusicVolume(val: number) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    if (this.musicGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.linearRampToValueAtTime(this.musicVolume, now + 0.05);
    }
    this.notify();
  }

  public setCasinoVolume(val: number) {
    this.casinoVolume = Math.max(0, Math.min(1, val));
    if (this.casinoGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.casinoGain.gain.cancelScheduledValues(now);
      this.casinoGain.gain.linearRampToValueAtTime(this.casinoVolume, now + 0.05);
    }
    this.notify();
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : this.masterVolume, now + 0.08);
    }
    this.notify();
    return this.isMuted;
  }

  public setTrack(track: AmbientTrack) {
    this.activeTrack = track;
    this.updateTempoForTrack();
    this.notify();
  }

  private updateTempoForTrack() {
    switch (this.activeTrack) {
      case 'ocean-drive':
        this.tempo = 118;
        break;
      case 'babylon-club':
        this.tempo = 124;
        break;
      case 'sunset-biscayne':
        this.tempo = 105;
        break;
    }
  }

  // --- 1980s Miami Synth Music Sequencer ---

  private scheduler() {
    if (!this.ctx || !this.isPlaying) return;
    const scheduleAheadTime = 0.15; // Schedule 150ms ahead
    while (this.nextNoteTime < this.ctx.currentTime + scheduleAheadTime) {
      this.scheduleStep(this.currentStep, this.nextNoteTime);
      this.advanceStep();
    }
  }

  private advanceStep() {
    const secondsPerBeat = 60.0 / this.tempo;
    const stepDuration = 0.25 * secondsPerBeat; // 16th note steps
    this.nextNoteTime += stepDuration;
    this.currentStep = (this.currentStep + 1) % 64; // 4-bar loop (64 steps)
  }

  private scheduleStep(step: number, time: number) {
    if (!this.ctx || !this.musicGain) return;

    const bar = Math.floor(step / 16);
    const stepInBar = step % 16;
    const beat = Math.floor(stepInBar / 4);
    const subStep = stepInBar % 4;

    // 1. Kick Drum (Linndrum 80s punch: beats 0, 1, 2, 3)
    if (subStep === 0) {
      this.playKick(time);
    }

    // 2. 80s Snare / Clap with gated tail (beats 1 and 3)
    if ((beat === 1 || beat === 3) && subStep === 0) {
      this.playGatedSnare(time);
    }

    // 3. Crisp Electro Hi-Hats (16th notes with accent on offbeats)
    const isAccent = subStep === 2;
    this.playHiHat(time, isAccent);

    // 4. 80s Bassline (Sawtooth + Resonant Low-Pass Filter)
    this.playBasslineStep(step, time);

    // 5. Synth Chords & Pads (Juno-106 Warm Saw Pad on bar changes)
    if (stepInBar === 0) {
      this.playSynthChord(bar, time);
    }

    // 6. Arpeggiated Neon Lead (16th notes with 80s delay feel)
    this.playArpLead(step, time);
  }

  // Linndrum style punchy analog kick
  private playKick(time: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(145, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.08);

    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.22);
  }

  // 80s Gated Snare Drum
  private playGatedSnare(time: number) {
    if (!this.ctx || !this.musicGain) return;

    // Noise buffer for snap
    const bufferSize = this.ctx.sampleRate * 0.18;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, time);
    filter.Q.setValueAtTime(1.5, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.45, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16); // Gated cut

    // Body tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(210, time);
    osc.frequency.exponentialRampToValueAtTime(130, time + 0.07);

    oscGain.gain.setValueAtTime(0.35, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.connect(oscGain);
    oscGain.connect(this.musicGain);

    noise.start(time);
    noise.stop(time + 0.18);
    osc.start(time);
    osc.stop(time + 0.14);
  }

  // Hi-Hat
  private playHiHat(time: number, isAccent: boolean) {
    if (!this.ctx || !this.musicGain) return;
    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7500, time);

    const gain = this.ctx.createGain();
    const vol = isAccent ? 0.22 : 0.09;
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + (isAccent ? 0.05 : 0.025));

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start(time);
    noise.stop(time + 0.06);
  }

  // 1980s Driving Synth Bassline (D minor progression: Dm - Bb - C - Am)
  private playBasslineStep(step: number, time: number) {
    if (!this.ctx || !this.musicGain) return;

    const bar = Math.floor(step / 16);
    const stepInBar = step % 16;

    // Root note based on chord progression: D2 (73.42Hz), Bb1 (58.27Hz), C2 (65.41Hz), A1 (55.0Hz)
    let rootFreq = 73.42; // D2
    if (bar === 1) rootFreq = 58.27; // Bb1
    if (bar === 2) rootFreq = 65.41; // C2
    if (bar === 3) rootFreq = 55.00; // A1

    // 80s syncopated octave pattern:
    // Steps 0, 2, 4, 6, 8, 10, 12, 14 root, with octave jumps on offbeats
    const isPlayingStep = stepInBar % 2 === 0 || (stepInBar === 3 || stepInBar === 7 || stepInBar === 11 || stepInBar === 15);
    if (!isPlayingStep) return;

    const isOctaveUp = stepInBar % 4 === 2 || stepInBar === 11;
    const freq = isOctaveUp ? rootFreq * 2 : rootFreq;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    // Moog style resonant filter envelope
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(4.5, time);
    filter.frequency.setValueAtTime(650, time);
    filter.frequency.exponentialRampToValueAtTime(140, time + 0.12);

    gain.gain.setValueAtTime(0.38, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.13);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.14);
  }

  // Warm Juno-106 Synth Pad (Dm, Bb, C, Am chords)
  private playSynthChord(bar: number, time: number) {
    if (!this.ctx || !this.musicGain) return;

    // Chords in Hz:
    // Bar 0: Dm (D3: 146.83, F3: 174.61, A3: 220.00, D4: 293.66)
    // Bar 1: Bb (Bb2: 116.54, D3: 146.83, F3: 174.61, Bb3: 233.08)
    // Bar 2: C  (C3: 130.81, E3: 164.81, G3: 196.00, C4: 261.63)
    // Bar 3: Am (A2: 110.00, C3: 130.81, E3: 164.81, A3: 220.00)
    let chordFreqs = [146.83, 174.61, 220.00, 293.66];
    if (bar === 1) chordFreqs = [116.54, 146.83, 174.61, 233.08];
    if (bar === 2) chordFreqs = [130.81, 164.81, 196.00, 261.63];
    if (bar === 3) chordFreqs = [110.00, 130.81, 164.81, 220.00];

    const chordDuration = (60.0 / this.tempo) * 3.8; // sustain almost full bar

    chordFreqs.forEach((freq, idx) => {
      if (!this.ctx || !this.musicGain) return;
      const osc = this.ctx.createOscillator();
      const detune = (idx % 2 === 0 ? 1 : -1) * 7; // Chorus detune
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);
      osc.detune.setValueAtTime(detune, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, time);
      filter.frequency.linearRampToValueAtTime(900, time + chordDuration);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.09, time + 0.3); // Soft attack
      gain.gain.linearRampToValueAtTime(0.05, time + chordDuration * 0.8);
      gain.gain.linearRampToValueAtTime(0.001, time + chordDuration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(time);
      osc.stop(time + chordDuration);
    });
  }

  // Sparkling Arpeggiated Neon Lead
  private playArpLead(step: number, time: number) {
    if (!this.ctx || !this.musicGain) return;
    const bar = Math.floor(step / 16);
    const stepInBar = step % 16;

    // Arpeggio notes scale degrees in Dm
    // D4, F4, A4, C5, D5, A4, F4, D4
    const arpNotesDm = [293.66, 349.23, 440.00, 523.25, 587.33, 440.00, 349.23, 293.66];
    const arpNotesBb = [233.08, 293.66, 349.23, 466.16, 587.33, 466.16, 349.23, 293.66];
    const arpNotesC  = [261.63, 329.63, 392.00, 523.25, 659.25, 523.25, 392.00, 329.63];
    const arpNotesAm = [220.00, 261.63, 329.63, 440.00, 523.25, 440.00, 329.63, 261.63];

    let currentArp = arpNotesDm;
    if (bar === 1) currentArp = arpNotesBb;
    if (bar === 2) currentArp = arpNotesC;
    if (bar === 3) currentArp = arpNotesAm;

    const freq = currentArp[stepInBar % currentArp.length];

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, time);
    filter.frequency.exponentialRampToValueAtTime(700, time + 0.12);

    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.11);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.12);
  }

  // --- Subtle Casino Floor Ambient Layer ---

  private startCasinoFloorGenerator() {
    if (this.casinoIntervalId) {
      clearInterval(this.casinoIntervalId);
    }

    // Casino room tone continuous low filtered noise
    this.startRoomMurmur();

    // Random periodic casino events
    this.casinoIntervalId = window.setInterval(() => {
      if (!this.isPlaying || !this.ctx || this.isMuted) return;

      const roll = Math.random();
      if (roll < 0.45) {
        this.playCasinoChipClinks();
      } else if (roll < 0.70) {
        this.playCasinoRouletteWhirl();
      } else if (roll < 0.85) {
        this.playCasinoDistantSlotChime();
      } else {
        this.playCasinoCardShuffle();
      }
    }, 2800);
  }

  // Continuous subtle casino room presence
  private startRoomMurmur() {
    if (!this.ctx || !this.casinoGain) return;
    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02; // Brown noise approximation
        lastOut = data[i];
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.casinoGain);

      noise.start();
    } catch {
      // ignore
    }
  }

  // Realistic poker chip clinks
  private playCasinoChipClinks() {
    if (!this.ctx || !this.casinoGain) return;
    const now = this.ctx.currentTime;
    const numClinks = Math.floor(Math.random() * 3) + 2;

    for (let i = 0; i < numClinks; i++) {
      const time = now + i * (0.04 + Math.random() * 0.04);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      // Ceramic resonance between 3200Hz - 4800Hz
      osc.frequency.setValueAtTime(3400 + Math.random() * 1200, time);

      gain.gain.setValueAtTime(0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.035);

      osc.connect(gain);
      gain.connect(this.casinoGain);

      osc.start(time);
      osc.stop(time + 0.04);
    }
  }

  // Soft roulette ball whirl
  private playCasinoRouletteWhirl() {
    if (!this.ctx || !this.casinoGain) return;
    const now = this.ctx.currentTime;
    const clicks = 14;

    for (let i = 0; i < clicks; i++) {
      const delay = Math.pow(i / clicks, 1.6) * 1.4; // decelerating ball clicks
      const time = now + delay;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(950 + Math.random() * 300, time);

      gain.gain.setValueAtTime(0.07, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

      osc.connect(gain);
      gain.connect(this.casinoGain);

      osc.start(time);
      osc.stop(time + 0.025);
    }
  }

  // Distant 80s slot jackpot shimmer
  private playCasinoDistantSlotChime() {
    if (!this.ctx || !this.casinoGain) return;
    const now = this.ctx.currentTime;
    const notes = [1046.50, 1318.51, 1567.98, 2093.00]; // C6, E6, G6, C7 arpeggio

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.casinoGain) return;
      const time = now + idx * 0.07;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.06, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);

      osc.connect(gain);
      gain.connect(this.casinoGain);

      osc.start(time);
      osc.stop(time + 0.28);
    });
  }

  // Soft card slide / shuffle sound
  private playCasinoCardShuffle() {
    if (!this.ctx || !this.casinoGain) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.2;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2800, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.casinoGain);

    noise.start(now);
    noise.stop(now + 0.08);
  }
}

export const ambientSound = new AmbientSoundEngine();
