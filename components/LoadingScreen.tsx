
import React, { useState, useEffect } from 'react';

const bootSequenceMessages = [
  '> MOUNTING VIRTUAL DRIVES...',
  '> DECRYPTING CORE KERNEL...',
  '> INITIALIZING COMBAT PROTOCOLS... [OK]',
  '> CALIBRATING TARGETING SYSTEM...',
  '> VERIFYING NEURAL LINK... [ESTABLISHED]',
  '> LOADING ARENA SCHEMATICS...',
  '> ALL SYSTEMS NOMINAL. STANDBY FOR ENGAGEMENT.',
];

const LoadingScreen: React.FC = () => {
  const [bootMessageIndex, setBootMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBootMessageIndex(prevIndex => {
        if (prevIndex < bootSequenceMessages.length - 1) {
          return prevIndex + 1;
        }
        clearInterval(interval);
        return prevIndex;
      });
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-fuchsia-500/10" />
        <div className="grid-bg" />
      </div>

      {/* Scanlines Effect */}
      <div className="scanlines absolute inset-0 pointer-events-none opacity-30" />

      {/* Glitch Corner Brackets */}
      <div className="absolute top-8 left-8 w-20 h-20 border-t-2 border-l-2 border-[var(--color-primary-cyan)]/60 animate-pulse-slow" />
      <div className="absolute top-8 right-8 w-20 h-20 border-t-2 border-r-2 border-[var(--color-primary-cyan)]/60 animate-pulse-slow" />
      <div className="absolute bottom-8 left-8 w-20 h-20 border-b-2 border-l-2 border-[var(--color-primary-magenta)]/60 animate-pulse-slow" />
      <div className="absolute bottom-8 right-8 w-20 h-20 border-b-2 border-r-2 border-[var(--color-primary-magenta)]/60 animate-pulse-slow" />

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-4xl text-center animate-fade-in-fast">
        {/* Title Section with Enhanced Effects */}
        <div className="relative inline-block mb-16">
          {/* Multiple Glitch Layers */}
          <div className="glitch-layer absolute inset-0 opacity-70">
            <h1 className="font-orbitron text-7xl md:text-8xl font-black uppercase text-[var(--color-primary-cyan)] tracking-widest">
              NEON
            </h1>
          </div>
          
          <h1 className="relative font-orbitron text-7xl md:text-8xl font-black uppercase text-[var(--color-text-light)] text-glow-cyan tracking-widest animate-title-flicker">
            NEON
          </h1>
          
          <div className="relative inline-block mt-4">
            <h2 className="font-orbitron text-4xl md:text-5xl font-bold uppercase text-[var(--color-primary-magenta)] text-glow-magenta tracking-wider animate-subtitle-pulse">
              BLITZ
            </h2>
          </div>

          {/* Decorative Lines */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <div className="h-px w-32 bg-gradient-to-r from-transparent via-[var(--color-primary-cyan)] to-transparent" />
            <div className="w-2 h-2 bg-[var(--color-primary-cyan)] rotate-45 animate-spin-slow" />
            <div className="h-px w-32 bg-gradient-to-r from-transparent via-[var(--color-primary-magenta)] to-transparent" />
          </div>
        </div>

        {/* Boot Sequence Terminal */}
        <div className="relative bg-black/60 border-2 border-[var(--color-border)] p-6 mb-8 backdrop-blur-sm">
          {/* Terminal Corner Accents */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[var(--color-primary-cyan)]/70" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[var(--color-primary-cyan)]/70" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[var(--color-primary-magenta)]/70" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[var(--color-primary-magenta)]/70" />

          {/* Status Indicator */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="font-rajdhani text-sm text-[var(--color-text-medium)] uppercase tracking-wider">System Boot Sequence</span>
          </div>

          {/* Boot Messages */}
          <div className="font-rajdhani text-left text-[var(--color-text-light)] space-y-1 mb-4 h-48 overflow-hidden">
            {bootSequenceMessages.slice(0, bootMessageIndex + 1).map((msg, index) => (
              <p 
                key={index} 
                className={`${index === bootMessageIndex ? 'animate-typing text-cyan-300' : 'text-[var(--color-text-medium)]'}`}
                style={{ animationDelay: '0s' }}
              >
                {msg}
              </p>
            ))}
          </div>

          {/* Progress Bar Container */}
          <div className="relative">
            <div className="text-xs font-rajdhani text-[var(--color-text-dark)] mb-2 text-right">
              {Math.round(((bootMessageIndex + 1) / bootSequenceMessages.length) * 100)}% COMPLETE
            </div>
            <div className="relative w-full bg-black/70 border border-cyan-700/50 p-1 overflow-hidden">
              {/* Progress Bar Fill */}
              <div 
                className="relative bg-gradient-to-r from-cyan-600 via-cyan-400 to-cyan-500 h-3 transition-all duration-300 ease-linear"
                style={{ width: `${((bootMessageIndex + 1) / bootSequenceMessages.length) * 100}%` }}
              >
                {/* Animated Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine" />
              </div>
              
              {/* Grid Pattern Overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[length:10px_10px] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Loading Indicators */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-cyan-400 rounded-sm animate-loading-dot" style={{ animationDelay: '0s' }} />
          <div className="w-2 h-2 bg-cyan-400 rounded-sm animate-loading-dot" style={{ animationDelay: '0.2s' }} />
          <div className="w-2 h-2 bg-cyan-400 rounded-sm animate-loading-dot" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>

      <style>{`
        @keyframes fade-in-fast {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-fast {
          animation: fade-in-fast 0.8s ease-out forwards;
        }
        
        @keyframes typing {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-typing {
          animation: typing 0.3s ease-out;
        }

        @keyframes title-flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.95; }
          51% { opacity: 1; }
          52% { opacity: 0.98; }
        }
        .animate-title-flicker {
          animation: title-flicker 4s infinite;
        }

        @keyframes subtitle-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.02); }
        }
        .animate-subtitle-pulse {
          animation: subtitle-pulse 3s ease-in-out infinite;
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }

        .grid-bg {
          background-image: 
            linear-gradient(rgba(0, 224, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 224, 255, 0.05) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: grid-move 20s linear infinite;
        }

        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }

        .glitch-layer {
          animation: glitch 5s infinite;
        }

        @keyframes glitch {
          0%, 90%, 100% { 
            transform: translate(0);
            opacity: 0;
          }
          92% { 
            transform: translate(-2px, 2px);
            opacity: 0.7;
          }
          94% { 
            transform: translate(2px, -2px);
            opacity: 0.7;
          }
        }

        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-shine {
          animation: shine 2s ease-in-out infinite;
        }

        @keyframes loading-dot {
          0%, 100% { 
            opacity: 0.3;
            transform: scale(0.8);
          }
          50% { 
            opacity: 1;
            transform: scale(1.2);
          }
        }
        .animate-loading-dot {
          animation: loading-dot 1.5s ease-in-out infinite;
        }

        .transition-width {
          transition-property: width;
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
