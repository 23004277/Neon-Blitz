
import React, { useState, useEffect } from 'react';
import { useAudio } from '../contexts/AudioContext';

interface LoadingScreenProps {
  onComplete: () => void;
}

const systems = [
  'NEURAL LINK',
  'VECTOR ENGINE',
  'AUDIO SYNTH',
  'TARGETING',
  'PHYSICS CORE'
];

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [activeSystem, setActiveSystem] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const audio = useAudio();

  useEffect(() => {
    // Start audio engine in low-power/loading mode immediately
    audio.setMusicState('loading');
    
    const totalDuration = 2500;
    const intervalTime = 30;
    const steps = totalDuration / intervalTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const newProgress = Math.min(100, (currentStep / steps) * 100);
      setProgress(newProgress);

      // Cycle through system text based on progress
      const systemIndex = Math.floor((newProgress / 100) * systems.length);
      setActiveSystem(Math.min(systemIndex, systems.length - 1));

      if (currentStep >= steps) {
        clearInterval(timer);
        setIsReady(true);
        audio.play('abilityReady'); // Sound cue when ready
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [audio]);

  const handleInitialize = () => {
    audio.resume().then(() => {
      audio.play('uiClick');
      onComplete();
    });
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-[#030507] overflow-hidden cursor-none font-rajdhani text-[var(--color-primary-cyan)]">
      {/* Background Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="grid-bg animate-grid-scroll" />
      </div>
      <div className="scanlines absolute inset-0 pointer-events-none opacity-30" />

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center">
        
        {/* Rotating Hexagon Graphic */}
        <div className="relative w-48 h-48 mb-12">
          {/* Outer Ring */}
          <div className="absolute inset-0 border-2 border-[var(--color-primary-cyan)]/30 rounded-full animate-[spin_10s_linear_infinite]" 
               style={{ borderStyle: 'dashed' }} />
          
          {/* Middle Hexagon */}
          <div className="absolute inset-4 border border-[var(--color-primary-magenta)]/50 clip-hex animate-[spin_5s_linear_infinite_reverse] box-glow-magenta" />
          
          {/* Inner Core */}
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-20 h-20 bg-[var(--color-primary-cyan)]/10 border-2 border-[var(--color-primary-cyan)] rotate-45 animate-pulse shadow-[0_0_20px_var(--color-primary-cyan)]" />
          </div>
          
          {/* Center Text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-orbitron font-bold text-2xl text-white mix-blend-overlay">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* Text Status */}
        <div className="h-16 flex flex-col items-center justify-center mb-8">
          {!isReady ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-[var(--color-primary-cyan)] animate-ping" />
                <span className="font-mono text-sm tracking-[0.2em] text-[var(--color-text-dim)]">INITIALIZING MODULE:</span>
              </div>
              <h2 className="font-orbitron text-3xl font-black uppercase tracking-wider text-glitch" data-text={systems[activeSystem]}>
                {systems[activeSystem]}
              </h2>
            </>
          ) : (
            <h2 className="font-orbitron text-4xl font-black uppercase tracking-[0.5em] text-white animate-pulse text-glow-cyan">
              SYSTEM READY
            </h2>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-80 h-1 bg-stone-900 relative overflow-hidden mb-8">
          <div 
            className="absolute top-0 left-0 h-full bg-[var(--color-primary-cyan)] transition-all duration-75 ease-out shadow-[0_0_10px_var(--color-primary-cyan)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Interaction Button (Required for Audio Context) */}
        <div className={`transition-all duration-500 transform ${isReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          <button
            onClick={handleInitialize}
            className="group relative px-12 py-4 bg-transparent border-2 border-[var(--color-primary-cyan)] overflow-hidden font-orbitron font-bold uppercase tracking-widest text-white hover:text-black transition-colors duration-300"
          >
            <span className="absolute inset-0 w-full h-full bg-[var(--color-primary-cyan)] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />
            <span className="relative z-10 flex items-center gap-3">
              <span>Initialize</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </span>
          </button>
        </div>

        {/* Decorative Footer */}
        <div className="absolute bottom-[-100px] text-[10px] text-stone-600 font-mono tracking-widest opacity-50">
          VECTOR SIEGE KERNEL v4.0.2 // (C) 2088
        </div>
      </div>

      <style>{`
        .text-glitch {
          position: relative;
        }
        .text-glitch::before,
        .text-glitch::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0.8;
        }
        .text-glitch::before {
          color: #ff003c;
          z-index: -1;
          transform: translate(-2px, 2px);
          clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
          animation: glitch-anim-1 2s infinite linear alternate-reverse;
        }
        .text-glitch::after {
          color: #00f0ff;
          z-index: -2;
          transform: translate(2px, -2px);
          clip-path: polygon(0 55%, 100% 55%, 100% 100%, 0 100%);
          animation: glitch-anim-2 2s infinite linear alternate-reverse;
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
