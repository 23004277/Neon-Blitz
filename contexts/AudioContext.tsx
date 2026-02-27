
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSettings } from './SettingsContext';
import { Settings, Vector } from '../types';

// --- Types ---
type MusicState = 'loading' | 'menu' | 'ambient' | 'combat' | 'boss';

interface SoundLayer {
  type: 'sine' | 'square' | 'sawtooth' | 'triangle' | 'noise';
  freqStart?: number;
  freqEnd?: number;
  gain: number;
  duration: number;
  delay?: number;
  filterFreq?: number;
  filterSweep?: { start: number; end: number };
  modFreq?: number;
  pan?: number;
}

const SOUND_LIBRARY: Record<string, { layers: SoundLayer[] }> = {
  // UI
  uiHover: { layers: [{ type: 'sine', freqStart: 1400, freqEnd: 1800, gain: 0.02, duration: 0.03 }] },
  uiClick: { layers: [{ type: 'triangle', freqStart: 600, freqEnd: 300, gain: 0.03, duration: 0.06 }] },
  uiBack: { layers: [{ type: 'sine', freqStart: 300, freqEnd: 180, gain: 0.03, duration: 0.08 }] },
  uiToggle: { layers: [{ type: 'sine', freqStart: 800, freqEnd: 1200, gain: 0.03, duration: 0.04 }] },
  
  // Voice FX
  // REMASTERED: Higher pitch, shorter duration for "typewriter" effect
  robotBlip: {
    layers: [
      { type: 'sine', freqStart: 1200, freqEnd: 2000, gain: 0.03, duration: 0.03 }, 
      { type: 'square', freqStart: 800, freqEnd: 1200, gain: 0.02, duration: 0.02 }
    ]
  },
  // NEW: Deep, menacing voice for True Form
  trueFormVoice: {
    layers: [
      { type: 'square', freqStart: 150, freqEnd: 80, gain: 0.15, duration: 0.08 }, // Deep digital
      { type: 'sawtooth', freqStart: 60, freqEnd: 40, gain: 0.2, duration: 0.1 },   // Sub rumble
      { type: 'noise', filterFreq: 400, gain: 0.05, duration: 0.05 } // Static grit
    ]
  },
  
  // Transformation FX
  transformCharge: {
    layers: [
      { type: 'sawtooth', freqStart: 50, freqEnd: 200, gain: 0.1, duration: 1.5, modFreq: 20 },
      { type: 'square', freqStart: 100, freqEnd: 800, gain: 0.08, duration: 1.5 },
      { type: 'noise', filterFreq: 200, filterSweep: { start: 200, end: 4000 }, gain: 0.1, duration: 1.5 }
    ]
  },
  transformBang: {
    layers: [
      { type: 'noise', filterFreq: 1000, gain: 0.4, duration: 0.8 },
      { type: 'sine', freqStart: 100, freqEnd: 20, gain: 0.5, duration: 1.0 },
      { type: 'square', freqStart: 400, freqEnd: 100, gain: 0.2, duration: 0.4 }
    ]
  },

  // Combat - Shots
  shot_1: { layers: [{ type: 'triangle', freqStart: 1500, freqEnd: 150, gain: 0.1, duration: 0.12 }, { type: 'noise', filterFreq: 4000, gain: 0.05, duration: 0.05 }] },
  shot_2: { layers: [{ type: 'square', freqStart: 1200, freqEnd: 100, gain: 0.08, duration: 0.1 }, { type: 'sawtooth', freqStart: 200, freqEnd: 50, gain: 0.08, duration: 0.15 }] },
  shot_3: { layers: [{ type: 'sawtooth', freqStart: 800, freqEnd: 200, gain: 0.09, duration: 0.15 }, { type: 'noise', filterFreq: 2500, gain: 0.06, duration: 0.1 }] },
  shot_4: { layers: [{ type: 'square', freqStart: 2000, freqEnd: 300, gain: 0.07, duration: 0.08 }, { type: 'triangle', freqStart: 300, freqEnd: 50, gain: 0.1, duration: 0.1 }] },
  shot_5: { layers: [{ type: 'triangle', freqStart: 600, freqEnd: 50, gain: 0.12, duration: 0.2 }, { type: 'noise', filterFreq: 1500, gain: 0.08, duration: 0.15 }] },
  
  // NEW: Dual Cannon (Heavy, mechanical, punchy)
  dualCannon: { 
    layers: [
        { type: 'square', freqStart: 180, freqEnd: 40, gain: 0.18, duration: 0.18 }, // Low punch
        { type: 'sawtooth', freqStart: 800, freqEnd: 100, gain: 0.12, duration: 0.12 }, // Mechanical click
        { type: 'noise', filterFreq: 800, gain: 0.15, duration: 0.15 } // Air blast
    ] 
  },

  // Rocket Barrage SFX
  rocketLaunch: { 
    layers: [
      { type: 'noise', filterFreq: 1500, gain: 0.1, duration: 0.25 }, // Thrust hiss
      { type: 'sawtooth', freqStart: 150, freqEnd: 600, gain: 0.08, duration: 0.2 } // Ascent whoosh
    ] 
  },
  rocketExplosion: { 
    layers: [
      { type: 'noise', filterFreq: 800, gain: 0.25, duration: 0.4 }, // Crunch
      { type: 'square', freqStart: 120, freqEnd: 20, gain: 0.2, duration: 0.3 }, // Boom
      { type: 'triangle', freqStart: 200, freqEnd: 50, gain: 0.1, duration: 0.15 } // Impact pop
    ] 
  },

  // Combat - Impacts
  impact_damage: { layers: [{ type: 'sawtooth', freqStart: 150, freqEnd: 50, gain: 0.15, duration: 0.1 }, { type: 'noise', filterFreq: 1000, gain: 0.1, duration: 0.1 }] }, 
  impact_player: { layers: [{ type: 'square', freqStart: 100, freqEnd: 20, gain: 0.25, duration: 0.2 }, { type: 'noise', filterFreq: 600, gain: 0.2, duration: 0.15 }] }, 
  hit: { layers: [{ type: 'triangle', freqStart: 200, freqEnd: 80, gain: 0.06, duration: 0.08 }] }, 
  shieldHit: { layers: [{ type: 'square', freqStart: 2000, freqEnd: 1500, gain: 0.05, duration: 0.1 }] }, 
  shieldBreak: { 
    layers: [
        { type: 'sawtooth', freqStart: 1000, freqEnd: 100, gain: 0.15, duration: 0.4 },
        { type: 'noise', filterFreq: 3000, gain: 0.1, duration: 0.3 }
    ] 
  },
  
  // Abilities
  overdrive: { 
    layers: [
      { type: 'sawtooth', freqStart: 100, freqEnd: 1400, gain: 0.12, duration: 1.5 },
      { type: 'square', freqStart: 50, freqEnd: 400, gain: 0.1, duration: 1.5 },
      { type: 'noise', filterFreq: 4000, gain: 0.15, duration: 0.8 }
    ] 
  },
  chronoActive: { 
    layers: [
        { type: 'sine', freqStart: 3000, freqEnd: 200, gain: 0.15, duration: 1.2 },
        { type: 'triangle', freqStart: 100, freqEnd: 50, gain: 0.1, duration: 1.5, modFreq: 20 }
    ] 
  },
  abilityReady: { layers: [{ type: 'sine', freqStart: 800, freqEnd: 1600, gain: 0.08, duration: 0.3 }] },
  teslaZap: { 
    layers: [
        { type: 'sawtooth', freqStart: 1200, freqEnd: 400, gain: 0.15, duration: 0.15, modFreq: 50 },
        { type: 'square', freqStart: 2000, freqEnd: 1000, gain: 0.1, duration: 0.1 } 
    ] 
  },

  // Boss
  bossSpawn: { layers: [{ type: 'sawtooth', freqStart: 60, freqEnd: 180, gain: 0.12, duration: 4.0, modFreq: 5 }] },
  bossWarning: { layers: [{ type: 'sawtooth', freqStart: 400, freqEnd: 200, gain: 0.1, duration: 1.0, modFreq: 10 }] },
  bossCharge: { layers: [{ type: 'triangle', freqStart: 100, freqEnd: 600, gain: 0.1, duration: 1.5 }] },
  
  // NEW: Dedicated Ignition for Player Laser Sweep (Instant feedback version of Boss Charge)
  bossLaserStart: {
    layers: [
        { type: 'triangle', freqStart: 100, freqEnd: 1500, gain: 0.2, duration: 0.4 }, // Fast charge up
        { type: 'sawtooth', freqStart: 1500, freqEnd: 100, gain: 0.25, duration: 0.3, delay: 0.35 }, // Ignition
        { type: 'noise', filterFreq: 2000, gain: 0.2, duration: 0.25, delay: 0.35 } // Blast
    ]
  },

  bossMortarFire: { 
    layers: [
      { type: 'square', freqStart: 150, freqEnd: 60, gain: 0.2, duration: 0.3 }, 
      { type: 'noise', filterFreq: 600, gain: 0.15, duration: 0.2 } 
    ] 
  },
  bossCritical: {
    layers: [
        { type: 'square', freqStart: 600, freqEnd: 1800, gain: 0.3, duration: 3.0, modFreq: 15 },
        { type: 'sawtooth', freqStart: 100, freqEnd: 400, gain: 0.2, duration: 3.0 }
    ]
  },
  bossRecover: {
    layers: [
        { type: 'noise', filterFreq: 1000, gain: 0.15, duration: 1.5 },
        { type: 'sawtooth', freqStart: 100, freqEnd: 50, gain: 0.1, duration: 1.5 }
    ] 
  },
  bossExplosion: { layers: [{ type: 'noise', filterFreq: 400, gain: 0.3, duration: 1.5 }] },
  explosion: { layers: [{ type: 'noise', filterFreq: 800, gain: 0.15, duration: 0.5 }] },
  
  // --- REDESIGNED SHOCKWAVE SOUNDS ---
  bossShockwaveCharge: {
    layers: [
      // Deep shuddering bass (Reactor Charging)
      { type: 'sawtooth', freqStart: 60, freqEnd: 120, gain: 0.2, duration: 1.0, modFreq: 12 }, 
      // High pitch whine (Capacitor)
      { type: 'sine', freqStart: 200, freqEnd: 1200, gain: 0.1, duration: 1.0 },
      // Rising noise swell
      { type: 'noise', filterFreq: 200, filterSweep: { start: 200, end: 2000 }, gain: 0.15, duration: 1.0 }
    ]
  },
  bossShockwaveFire: {
    layers: [
      // The "Thump" - Earthquake Sub
      { type: 'sine', freqStart: 100, freqEnd: 5, gain: 0.7, duration: 0.8 }, 
      // The "Crack" - Explosion Body
      { type: 'noise', filterFreq: 800, gain: 0.4, duration: 0.6 },
      // The "Zip" - Sci-fi impact sweep
      { type: 'square', freqStart: 1800, freqEnd: 100, gain: 0.2, duration: 0.25 }
    ]
  },
  
  // --- OMNI BARRAGE SOUNDS ---
  omniCharge: { 
    layers: [
        { type: 'sawtooth', freqStart: 200, freqEnd: 800, gain: 0.2, duration: 1.5, modFreq: 60 }, 
        { type: 'sine', freqStart: 400, freqEnd: 1200, gain: 0.15, duration: 1.5 },
        { type: 'noise', filterFreq: 500, filterSweep: { start: 500, end: 2500 }, gain: 0.1, duration: 1.5 }
    ] 
  },
  omniFire: { 
    layers: [
        { type: 'noise', filterFreq: 4000, gain: 0.3, duration: 0.2 }, 
        { type: 'square', freqStart: 800, freqEnd: 100, gain: 0.2, duration: 0.3 }, 
        { type: 'triangle', freqStart: 1200, freqEnd: 200, gain: 0.15, duration: 0.2 } 
    ] 
  },

  mineDeploy: { 
    layers: [
      { type: 'square', freqStart: 600, freqEnd: 150, gain: 0.15, duration: 0.3 }, 
      { type: 'sawtooth', freqStart: 200, freqEnd: 50, gain: 0.1, duration: 0.35 }, 
      { type: 'noise', filterFreq: 1500, gain: 0.1, duration: 0.15 } 
    ] 
  },
};

export class AudioController {
  ctx: AudioContext;
  masterGain: GainNode;
  musicGain: GainNode;
  sfxGain: GainNode;
  reverb: ConvolverNode | null = null;
  reverbGain: GainNode;
  
  // New Nodes
  compressor: DynamicsCompressorNode;
  globalFilter: BiquadFilterNode;

  settings: Settings;
  noiseBuffer: AudioBuffer | null = null;

  // Music System
  currentMusicState: MusicState = 'loading'; 
  musicInterval: number | null = null;
  beat: number = 0;

  scheduledNodes = new Set<AudioScheduledSourceNode>();
  activeLoops = new Map<string, { gain: GainNode, stop: (t: number) => void }>();
  
  // Concurrency & Debounce
  activeSounds = new Map<string, number>();
  lastPlayTime = new Map<string, number>();
  
  // Engine System
  activeEngines = new Map<string, { 
      gain: GainNode, 
      oscs: AudioScheduledSourceNode[], 
      baseFreqs: number[],
      type: 'player' | 'enemy' | 'boss'
  }>();

  tickTime: number = 400;

  constructor(settings: Settings) {
    this.settings = settings;
    const AudioCtor = (window.AudioContext || (window as any).webkitAudioContext);
    this.ctx = new AudioCtor();

    this.masterGain = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.reverbGain = this.ctx.createGain();
    
    // Initialize Compressor
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 30;
    this.compressor.ratio.value = 12;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;

    // Initialize Global Filter (Lowpass for muffled effects)
    this.globalFilter = this.ctx.createBiquadFilter();
    this.globalFilter.type = 'lowpass';
    this.globalFilter.frequency.value = 22000; // Open by default
    this.globalFilter.Q.value = 0.5;

    // Routing Chain:
    // [Music/SFX/Reverb] -> GlobalFilter -> Compressor -> MasterGain -> Destination
    
    this.masterGain.connect(this.ctx.destination);
    this.compressor.connect(this.masterGain);
    this.globalFilter.connect(this.compressor);

    this.musicGain.connect(this.globalFilter);
    this.sfxGain.connect(this.globalFilter);
    
    // Reverb Routing
    this.musicGain.connect(this.reverbGain);
    // Send SFX to reverb lightly for space
    const sfxReverbSend = this.ctx.createGain();
    sfxReverbSend.gain.value = 0.1;
    this.sfxGain.connect(sfxReverbSend).connect(this.reverbGain);

    this.reverb = this.createReverb(2.2, 2.0);
    if (this.reverb) {
      this.reverbGain.disconnect();
      this.reverbGain.connect(this.reverb);
      this.reverb.connect(this.globalFilter);
    }

    this.reverbGain.gain.value = 0.12;
    this.initNoiseBuffer();
    this.updateVolume();
  }

  // --- Helpers ---
  private scheduleNode(node: AudioScheduledSourceNode) {
    this.scheduledNodes.add(node);
    const cleanup = () => this.scheduledNodes.delete(node);
    node.addEventListener?.('ended', cleanup);
    setTimeout(cleanup, 60_000);
  }

  private stopAllScheduled() {
    for (const node of Array.from(this.scheduledNodes)) {
      try {
        node.stop();
      } catch (e) { /* already stopped */ }
      this.scheduledNodes.delete(node);
    }
  }

  public async resume() {
    if (this.ctx.state === 'suspended') {
      try { await this.ctx.resume(); } catch (e) { /* ignore */ }
    }
  }

  private createReverb(lengthSeconds = 2.0, decay = 2.0): ConvolverNode | null {
    try {
      const rate = this.ctx.sampleRate;
      const length = Math.floor(rate * lengthSeconds);
      const impulse = this.ctx.createBuffer(2, length, rate);

      for (let ch = 0; ch < 2; ch++) {
        const channel = impulse.getChannelData(ch);
        for (let i = 0; i < length; i++) {
          channel[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
        }
      }

      const conv = this.ctx.createConvolver();
      conv.buffer = impulse;
      return conv;
    } catch (e) { return null; }
  }

  initNoiseBuffer() {
    const bufferSize = Math.floor(this.ctx.sampleRate * 1.5);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  updateVolume() {
    if (this.ctx.state === 'suspended') this.resume();
    const now = this.ctx.currentTime;
    const vol = this.settings.soundVolume ?? 0.4;

    this.sfxGain.gain.setTargetAtTime(this.settings.sound ? vol * 1.5 : 0, now, 0.1);
    this.musicGain.gain.setTargetAtTime(this.settings.music ? vol * 0.5 : 0, now, 0.2);
    this.reverbGain.gain.setTargetAtTime(this.settings.music ? vol * 0.2 : 0, now, 0.4);
  }

  // --- Spatial SFX ---
  setGlobalFilter(freq: number) {
      const t = this.ctx.currentTime;
      this.globalFilter.frequency.setTargetAtTime(freq, t, 0.2);
  }

  play(key: string, location: number | Vector = 0, listener?: Vector) {
    if (!this.settings.sound) return;
    if (this.ctx.state === 'suspended') this.resume();

    const config = SOUND_LIBRARY[key];
    if (!config) return;

    const t = this.ctx.currentTime;

    // --- Concurrency & Debounce ---
    const lastTime = this.lastPlayTime.get(key) || 0;
    if (t - lastTime < 0.04) return; // 40ms debounce
    this.lastPlayTime.set(key, t);

    const activeCount = this.activeSounds.get(key) || 0;
    if (activeCount > 8) return; // Hard limit
    this.activeSounds.set(key, activeCount + 1);
    
    // Cleanup count after duration
    const maxDur = Math.max(...config.layers.map(l => l.duration));
    setTimeout(() => {
        const c = this.activeSounds.get(key) || 1;
        this.activeSounds.set(key, Math.max(0, c - 1));
    }, maxDur * 1000 + 100);

    // --- Spatial Calculation ---
    let panVal = 0;
    let distGain = 1.0;

    if (typeof location === 'number') {
        // Legacy X-only panning
        if (location !== 0) {
            panVal = Math.max(-1, Math.min(1, (location - 500) / 500));
        }
    } else if (location && listener) {
        const dx = location.x - listener.x;
        const dy = location.y - listener.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        // Attenuation
        const maxDist = 1200;
        distGain = Math.max(0.0, 1 - (dist / maxDist));
        distGain = distGain * distGain; // Quadratic falloff

        panVal = Math.max(-1, Math.min(1, dx / 500));
    }

    // RANDOMIZATION FACTORS
    // Slight random variances to make every sound unique
    const speedVar = 0.95 + Math.random() * 0.1; // 0.95x to 1.05x speed
    const gainVar = 0.9 + Math.random() * 0.2;  // 0.9x to 1.1x volume
    const detuneVar = (Math.random() - 0.5) * 200; // -100 to +100 cents pitch shift

    config.layers.forEach((layer) => {
      const startTime = t + (layer.delay || 0) / speedVar;
      const duration = layer.duration / speedVar;

      const panner = this.ctx.createStereoPanner();
      panner.pan.value = panVal;
      panner.connect(this.sfxGain);

      let source: AudioScheduledSourceNode;
      const gain = this.ctx.createGain();

      if (layer.type === 'noise') {
        if (!this.noiseBuffer) return;
        const bufSrc = this.ctx.createBufferSource();
        bufSrc.buffer = this.noiseBuffer;
        
        // Apply detune to noise playback rate for pitch effect
        if (detuneVar !== 0) {
            bufSrc.playbackRate.value = Math.pow(2, detuneVar / 1200);
        }
        
        source = bufSrc;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(layer.filterFreq || 1200, startTime);
        if (layer.filterSweep) {
            filter.frequency.setValueAtTime(layer.filterSweep.start, startTime);
            filter.frequency.exponentialRampToValueAtTime(layer.filterSweep.end, startTime + duration);
        }

        source.connect(filter);
        filter.connect(gain);
      } else {
        const osc = this.ctx.createOscillator();
        osc.type = 'sine'; // Fallback if type mismatch
        try { (osc as any).type = layer.type; } catch(e) {}
        
        osc.frequency.setValueAtTime(layer.freqStart || 440, startTime);
        if (layer.freqEnd) {
          osc.frequency.exponentialRampToValueAtTime(layer.freqEnd, startTime + duration);
        }
        
        // Apply random detune
        osc.detune.value = detuneVar;

        if (layer.modFreq) {
          const lfo = this.ctx.createOscillator();
          lfo.frequency.value = layer.modFreq * speedVar; // Scale LFO speed too
          const lfoGain = this.ctx.createGain();
          lfoGain.gain.value = 20;
          lfo.connect(lfoGain).connect((osc as any).frequency);
          lfo.start(startTime);
          lfo.stop(startTime + duration);
        }
        source = osc;
        source.connect(gain);
      }

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(layer.gain * gainVar * distGain, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      gain.connect(panner);
      source.start(startTime);
      source.stop(startTime + duration);
      this.scheduleNode(source);
    });
  }

  // --- Engine Sounds (Dynamic) ---
  updateEngine(id: string, type: 'player' | 'enemy' | 'boss', speed: number) {
      if (!this.settings.sound) return;
      if (this.ctx.state === 'suspended') this.resume();

      const t = this.ctx.currentTime;
      let engine = this.activeEngines.get(id);

      // Create engine if not exists
      if (!engine) {
          const gain = this.ctx.createGain();
          gain.gain.value = 0;
          gain.connect(this.sfxGain);
          
          const oscs: AudioScheduledSourceNode[] = [];
          const baseFreqs: number[] = [];

          if (type === 'player') {
              // High-tech whine + low hum
              const o1 = this.ctx.createOscillator();
              o1.type = 'sine';
              o1.frequency.value = 100; // Base hum
              o1.connect(gain);
              o1.start(t);
              oscs.push(o1);
              baseFreqs.push(100);

              const o2 = this.ctx.createOscillator();
              o2.type = 'triangle';
              o2.frequency.value = 200; // Whine
              const o2Gain = this.ctx.createGain();
              o2Gain.gain.value = 0.3;
              o2.connect(o2Gain).connect(gain);
              o2.start(t);
              oscs.push(o2);
              baseFreqs.push(200);

          } else if (type === 'enemy') {
              // Mechanical rumble
              const o1 = this.ctx.createOscillator();
              o1.type = 'square';
              o1.frequency.value = 60;
              const f = this.ctx.createBiquadFilter();
              f.type = 'lowpass';
              f.frequency.value = 300;
              o1.connect(f).connect(gain);
              o1.start(t);
              oscs.push(o1);
              baseFreqs.push(60);

          } else if (type === 'boss') {
              // Deep reactor throb
              const o1 = this.ctx.createOscillator();
              o1.type = 'sawtooth';
              o1.frequency.value = 40;
              const f = this.ctx.createBiquadFilter();
              f.type = 'lowpass';
              f.frequency.value = 150;
              o1.connect(f).connect(gain);
              o1.start(t);
              oscs.push(o1);
              baseFreqs.push(40);
              
              // Modulation LFO
              const lfo = this.ctx.createOscillator();
              lfo.frequency.value = 5;
              const lfoG = this.ctx.createGain();
              lfoG.gain.value = 10;
              lfo.connect(lfoG).connect(o1.frequency);
              lfo.start(t);
              oscs.push(lfo);
              baseFreqs.push(0); // Placeholder
          }

          engine = { gain, oscs, baseFreqs, type };
          this.activeEngines.set(id, engine);
      }

      // Update parameters based on speed (0 to ~5)
      const isMoving = speed > 0.1;
      const targetGain = isMoving ? (type === 'boss' ? 0.3 : type === 'player' ? 0.15 : 0.08) : 0;
      
      engine.gain.gain.setTargetAtTime(targetGain, t, 0.1);

      // Pitch modulation
      if (isMoving && engine.baseFreqs.length > 0) {
          const pitchMod = 1 + (Math.min(speed, 5) / 20); // up to 1.25x
          engine.oscs.forEach((osc, i) => {
             if (osc instanceof OscillatorNode && engine && engine.baseFreqs[i] > 0) {
                 osc.frequency.setTargetAtTime(engine.baseFreqs[i] * pitchMod, t, 0.1);
             }
          });
      }
  }

  stopEngine(id: string) {
      const engine = this.activeEngines.get(id);
      if (engine) {
          const t = this.ctx.currentTime;
          // Ramp down volume
          try {
             engine.gain.gain.setTargetAtTime(0, t, 0.2);
          } catch(e) {}
          
          // Remove from map immediately to prevent subsequent updates
          this.activeEngines.delete(id);

          // Schedule complete stop and cleanup
          // Use a closure to capture the specific 'engine' instance to be stopped
          setTimeout(() => {
              engine.oscs.forEach(o => { 
                  try { o.stop(); } catch(e){} 
              });
              try { engine.gain.disconnect(); } catch(e){}
          }, 250);
      }
  }

  stopAllEngines() {
      this.activeEngines.forEach((engine) => {
          try {
              engine.gain.disconnect();
              engine.oscs.forEach(o => { try { o.stop(); } catch(e){} });
          } catch(e) {}
      });
      this.activeEngines.clear();
  }

  stopAllLoops() {
      this.activeLoops.forEach((loop) => {
          try {
              loop.gain.disconnect();
              loop.stop(this.ctx.currentTime);
          } catch(e) {}
      });
      this.activeLoops.clear();
  }

  cleanup() {
      this.stopMusic();
      this.stopAllLoops();
      this.stopAllEngines();
      this.stopAllScheduled();
  }

  // --- Continuous Sounds (Looping) ---
  start(key: string) {
    if (!this.settings.sound) return;
    if (this.ctx.state === 'suspended') this.resume();
    if (this.activeLoops.has(key)) return;

    const t = this.ctx.currentTime;

    if (key === 'overdriveLoop') {
        const oscLow1 = this.ctx.createOscillator();
        const oscLow2 = this.ctx.createOscillator();
        oscLow1.type = 'sawtooth';
        oscLow2.type = 'sawtooth';
        oscLow1.frequency.setValueAtTime(60, t); 
        oscLow2.frequency.setValueAtTime(62, t); 
        const lowFilter = this.ctx.createBiquadFilter();
        lowFilter.type = 'lowpass';
        lowFilter.frequency.setValueAtTime(200, t);
        lowFilter.frequency.linearRampToValueAtTime(600, t + 1.0); 
        const lowGain = this.ctx.createGain();
        lowGain.gain.setValueAtTime(0, t);
        lowGain.gain.linearRampToValueAtTime(0.12, t + 0.5);
        const oscHigh = this.ctx.createOscillator();
        oscHigh.type = 'sine';
        oscHigh.frequency.setValueAtTime(600, t);
        oscHigh.frequency.linearRampToValueAtTime(800, t + 10.0);
        const amLfo = this.ctx.createOscillator();
        amLfo.type = 'square'; 
        amLfo.frequency.value = 25;
        const amGain = this.ctx.createGain();
        amGain.gain.value = 0.5; 
        const highGain = this.ctx.createGain();
        highGain.gain.setValueAtTime(0, t);
        highGain.gain.linearRampToValueAtTime(0.06, t + 0.5);
        oscLow1.connect(lowFilter);
        oscLow2.connect(lowFilter);
        lowFilter.connect(lowGain).connect(this.sfxGain);
        amLfo.connect(amGain.gain); 
        oscHigh.connect(amGain).connect(highGain).connect(this.sfxGain);
        oscLow1.start(t);
        oscLow2.start(t);
        oscHigh.start(t);
        amLfo.start(t);
        this.activeLoops.set(key, {
            gain: lowGain,
            stop: (stopTime: number) => {
                try {
                    oscLow1.stop(stopTime);
                    oscLow2.stop(stopTime);
                    oscHigh.stop(stopTime);
                    amLfo.stop(stopTime);
                    
                    const now = this.ctx.currentTime;
                    highGain.gain.cancelScheduledValues(now);
                    highGain.gain.setValueAtTime(highGain.gain.value, now);
                    highGain.gain.linearRampToValueAtTime(0, stopTime);
                } catch(e) {}
            }
        });

    } else if (key === 'beamCharge') {
        const osc1 = this.ctx.createOscillator();
        osc1.type = 'sawtooth'; 
        osc1.frequency.setValueAtTime(100, t);
        osc1.frequency.exponentialRampToValueAtTime(2000, t + 1.5); 

        const subOsc = this.ctx.createOscillator();
        subOsc.type = 'square';
        subOsc.frequency.setValueAtTime(50, t);
        subOsc.frequency.exponentialRampToValueAtTime(400, t + 1.5);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.25, t + 0.5); 
        gain.gain.exponentialRampToValueAtTime(0.4, t + 1.5);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.Q.value = 5;
        filter.frequency.setValueAtTime(200, t);
        filter.frequency.exponentialRampToValueAtTime(4000, t + 1.5);

        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(10, t);
        lfo.frequency.linearRampToValueAtTime(30, t + 1.5);
        
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 0.5; 
        
        osc1.connect(filter);
        subOsc.connect(filter);
        
        const modGain = this.ctx.createGain();
        modGain.gain.value = 1.0;
        lfo.connect(lfoGain).connect(modGain.gain); 
        
        filter.connect(modGain).connect(gain).connect(this.sfxGain);

        osc1.start(t);
        subOsc.start(t);
        lfo.start(t);

        this.activeLoops.set(key, {
            gain,
            stop: (stopTime: number) => {
                osc1.stop(stopTime);
                subOsc.stop(stopTime);
                lfo.stop(stopTime);
            }
        });
        
    } else if (key === 'beamFire') {
        const leadOsc = this.ctx.createOscillator();
        leadOsc.type = 'sawtooth';
        leadOsc.frequency.setValueAtTime(800, t);
        
        const bodyOsc = this.ctx.createOscillator();
        bodyOsc.type = 'square';
        bodyOsc.frequency.setValueAtTime(200, t);
        const fmOsc = this.ctx.createOscillator();
        fmOsc.frequency.value = 110; 
        const fmGain = this.ctx.createGain();
        fmGain.gain.value = 500;
        fmOsc.connect(fmGain).connect(bodyOsc.frequency);

        const noise = this.ctx.createBufferSource();
        if (this.noiseBuffer) noise.buffer = this.noiseBuffer;
        noise.loop = true;
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 2000;
        noise.connect(noiseFilter);

        const masterGain = this.ctx.createGain();
        masterGain.gain.setValueAtTime(0, t);
        masterGain.gain.linearRampToValueAtTime(0.3, t + 0.1);

        const leadGain = this.ctx.createGain(); leadGain.gain.value = 0.15;
        const bodyGain = this.ctx.createGain(); bodyGain.gain.value = 0.2;
        const noiseGain = this.ctx.createGain(); noiseGain.gain.value = 0.1;

        leadOsc.connect(leadGain).connect(masterGain);
        bodyOsc.connect(bodyGain).connect(masterGain);
        noiseFilter.connect(noiseGain).connect(masterGain);
        
        masterGain.connect(this.sfxGain);
        
        leadOsc.start(t);
        bodyOsc.start(t);
        fmOsc.start(t);
        noise.start(t);
        
        this.activeLoops.set(key, {
            gain: masterGain,
            stop: (stopTime: number) => {
                leadOsc.stop(stopTime);
                bodyOsc.stop(stopTime);
                fmOsc.stop(stopTime);
                noise.stop(stopTime);
            }
        });
    } else if (key === 'omniCharge') {
        // NEW: Omni Barrage Charge Loop
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(800, t + 1.5);
        
        const sub = this.ctx.createOscillator();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(100, t);
        sub.frequency.exponentialRampToValueAtTime(400, t + 1.5);
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, t);
        filter.frequency.exponentialRampToValueAtTime(2000, t + 1.5);
        filter.Q.value = 2;
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 1.5);
        
        osc.connect(filter);
        sub.connect(filter);
        filter.connect(gain).connect(this.sfxGain);
        
        osc.start(t);
        sub.start(t);
        
        this.activeLoops.set(key, {
            gain,
            stop: (stopTime: number) => {
                osc.stop(stopTime);
                sub.stop(stopTime);
            }
        });
    } else if (key === 'bossLaserLoop') {
        const noise = this.ctx.createBufferSource();
        if (this.noiseBuffer) noise.buffer = this.noiseBuffer;
        noise.loop = true;
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.Q.value = 1; 
        
        const noiseLFO = this.ctx.createOscillator();
        noiseLFO.type = 'sine';
        noiseLFO.frequency.value = 0.2; 
        const noiseLFOGain = this.ctx.createGain();
        noiseLFOGain.gain.value = 1000;
        
        noiseFilter.frequency.setValueAtTime(800, t);
        noiseLFO.connect(noiseLFOGain).connect(noiseFilter.frequency);

        const oscBass = this.ctx.createOscillator();
        oscBass.type = 'sawtooth';
        oscBass.frequency.setValueAtTime(45, t);
        const oscSub = this.ctx.createOscillator();
        oscSub.type = 'sine';
        oscSub.frequency.setValueAtTime(90, t); 
        
        const oscScream = this.ctx.createOscillator();
        oscScream.type = 'square';
        oscScream.frequency.setValueAtTime(800, t);
        const screamLFO = this.ctx.createOscillator();
        screamLFO.type = 'sawtooth';
        screamLFO.frequency.value = 25; 
        const screamLFOGain = this.ctx.createGain();
        screamLFOGain.gain.value = 50; 
        screamLFO.connect(screamLFOGain).connect(oscScream.frequency);

        const masterGain = this.ctx.createGain();
        masterGain.gain.setValueAtTime(0, t);
        masterGain.gain.linearRampToValueAtTime(0.5, t + 0.5); 

        const gNoise = this.ctx.createGain(); gNoise.gain.value = 0.4;
        const gBass = this.ctx.createGain(); gBass.gain.value = 0.5;
        const gScream = this.ctx.createGain(); gScream.gain.value = 0.15;

        const panner = this.ctx.createStereoPanner();
        const panLFO = this.ctx.createOscillator();
        panLFO.type = 'sine';
        panLFO.frequency.value = 0.15; 
        const panGain = this.ctx.createGain();
        panGain.gain.value = 0.3;
        panLFO.connect(panGain).connect(panner.pan);

        noise.connect(noiseFilter).connect(gNoise).connect(masterGain);
        oscBass.connect(gBass).connect(masterGain);
        oscSub.connect(gBass); 
        oscScream.connect(gScream).connect(masterGain);

        masterGain.connect(panner).connect(this.sfxGain);

        noise.start(t);
        noiseLFO.start(t);
        oscBass.start(t);
        oscSub.start(t);
        oscScream.start(t);
        screamLFO.start(t);
        panLFO.start(t);

        this.activeLoops.set(key, {
            gain: masterGain,
            stop: (stopTime: number) => {
                noise.stop(stopTime);
                noiseLFO.stop(stopTime);
                oscBass.stop(stopTime);
                oscSub.stop(stopTime);
                oscScream.stop(stopTime);
                screamLFO.stop(stopTime);
                panLFO.stop(stopTime);
            }
        });
    }
  }

  stop(key: string) {
      const loop = this.activeLoops.get(key);
      if (loop) {
          const t = this.ctx.currentTime;
          // Smooth fade out
          try {
            loop.gain.gain.cancelScheduledValues(t);
            loop.gain.gain.setValueAtTime(loop.gain.gain.value, t);
            loop.gain.gain.linearRampToValueAtTime(0, t + 0.15); 
          } catch(e) { console.error(e); }
          
          loop.stop(t + 0.15);
          this.activeLoops.delete(key);
      }
  }

  // --- Adaptive Music Engine ---
  setMusicState(state: MusicState) {
    if (this.currentMusicState !== state) {
      this.currentMusicState = state;
    }
  }

  startMusic() {
    if (this.musicInterval) return;
    if (this.ctx.state === 'suspended') this.resume();

    const scale = [130.81, 146.83, 164.81, 174.61, 196.0, 220.0, 246.94, 261.63, 293.66, 329.63];
    const chords = [
      [3, 5, 7],  // F - A - C
      [0, 2, 4],  // C - E - G
      [5, 7, 9],  // A - C - E
      [4, 6, 8],  // G - B - D
    ];

    let currentChordIndex = 0;
    let timeSinceLastNote = 0;

    this.musicInterval = window.setInterval(() => {
      if (!this.settings.music) return;
      const t = this.ctx.currentTime;
      const state = this.currentMusicState;

      if (state === 'loading') {
          if (Math.random() < 0.05) {
              this.playAtmosphericPad(t, 55, 3.0); 
          }
          return;
      }

      if ((state === 'menu' || state === 'ambient') && Math.random() > 0.78) {
        this.beat++;
        timeSinceLastNote++;
        return;
      }

      if (this.beat % 12 === 0) {
        currentChordIndex = (currentChordIndex + 1) % chords.length;
        const chord = chords[currentChordIndex];
        chord.forEach((noteIdx, i) => {
          const octave = i === 0 ? 0.5 : 1;
          const freq = scale[noteIdx % scale.length] * octave;
          this.playAtmosphericPad(t + i * 0.2, freq, 8.0 + Math.random() * 4);
        });
      }

      const probability = 0.12 + Math.min(0.6, timeSinceLastNote * 0.04);
      if (Math.random() < probability) {
        timeSinceLastNote = 0;
        const chord = chords[currentChordIndex];
        let noteIdx: number;
        if (Math.random() < 0.78) {
          noteIdx = chord[Math.floor(Math.random() * chord.length)];
        } else {
          noteIdx = Math.floor(Math.random() * scale.length);
        }
        const octave = Math.random() > 0.85 ? 2 : 1;
        const freq = scale[noteIdx % scale.length] * octave;
        const duration = Math.random() > 0.85 ? 3.0 + Math.random() * 2.0 : 0.9 + Math.random() * 1.6;
        this.playMinecraftPiano(t, freq, duration);
      } else {
        timeSinceLastNote++;
      }

      if (state === 'combat' && Math.random() < 0.08) {
        this.playSoftThud(t, 0.08);
      } else if (state === 'boss' && Math.random() < 0.18) {
        this.playBossDrone(t, 2.5 + Math.random() * 1.5);
      }

      this.beat++;
    }, this.tickTime);
  }

  stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.stopAllScheduled();
  }

  // --- Instruments / Textures ---
  private playMinecraftPiano(t: number, freq: number, duration: number) {
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'triangle';

    try { osc1.detune.value = -6; osc2.detune.value = 6; } catch (e) { }

    osc1.frequency.setValueAtTime(freq, t);
    osc2.frequency.setValueAtTime(freq * 1.0005, t);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.Q.value = 0.7;

    const bodyGain = this.ctx.createGain();
    bodyGain.gain.setValueAtTime(0.008, t);

    if (this.noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const bodyFilter = this.ctx.createBiquadFilter();
      bodyFilter.type = 'lowpass';
      bodyFilter.frequency.value = 1000;
      noise.connect(bodyFilter).connect(bodyGain).connect(this.musicGain);
      noise.start(t);
      noise.stop(t + duration);
      this.scheduleNode(noise);
    }

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.045 + Math.random() * 0.02, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    const pan = this.ctx.createStereoPanner();
    pan.pan.value = Math.random() * 0.6 - 0.3;

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain).connect(pan).connect(this.musicGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + duration);
    osc2.stop(t + duration);
    this.scheduleNode(osc1);
    this.scheduleNode(osc2);
  }

  private playAtmosphericPad(t: number, freq: number, duration: number) {
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.03, t + Math.min(2.0, duration * 0.25));
    gain.gain.setValueAtTime(0.03, t + duration - Math.min(2.0, duration * 0.25));
    gain.gain.linearRampToValueAtTime(0, t + duration);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 0.9995, t);

    const mergerGain = this.ctx.createGain();
    mergerGain.gain.value = 0.015;

    osc.connect(gain);
    osc2.connect(mergerGain);
    mergerGain.connect(gain);
    gain.connect(this.musicGain);

    osc.start(t);
    osc2.start(t);
    osc.stop(t + duration);
    osc2.stop(t + duration);
    this.scheduleNode(osc);
    this.scheduleNode(osc2);
  }

  private playSoftThud(t: number, vol: number) {
    if (!this.noiseBuffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    src.connect(filter).connect(gain).connect(this.musicGain);
    src.start(t);
    src.stop(t + 0.6);
    this.scheduleNode(src);
  }

  private playBossDrone(t: number, duration: number) {
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(40 + Math.random() * 30, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, t);
    filter.frequency.exponentialRampToValueAtTime(80, t + duration);

    osc.connect(filter).connect(gain).connect(this.musicGain);
    osc.start(t);
    osc.stop(t + duration);
    this.scheduleNode(osc);
  }
}

export const AudioContext = createContext<AudioController | null>(null);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useSettings();
  const [controller] = useState(() => new AudioController(settings));

  useEffect(() => {
    if (settings.music) controller.startMusic();

    const unlockAudio = () => {
        controller.resume();
        ['click', 'keydown', 'touchstart', 'mousedown', 'mousemove'].forEach(ev => 
            document.removeEventListener(ev, unlockAudio)
        );
    };

    ['click', 'keydown', 'touchstart', 'mousedown', 'mousemove'].forEach(ev => 
        document.addEventListener(ev, unlockAudio)
    );

    return () => {
        controller.cleanup();
        ['click', 'keydown', 'touchstart', 'mousedown', 'mousemove'].forEach(ev => 
            document.removeEventListener(ev, unlockAudio)
        );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    controller.settings = settings;
    controller.updateVolume();
    if (settings.music && !controller.musicInterval) {
      controller.startMusic();
    } else if (!settings.music) {
      controller.stopMusic();
    }
  }, [settings, controller]);

  return (
    <AudioContext.Provider value={controller}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider');
  }
  return context;
};
