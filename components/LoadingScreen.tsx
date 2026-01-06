
import React, { useState, useEffect } from 'react';

const bootSequenceMessages = [
  '> INITIALIZING KERNEL...',
  '> LOADING VECTOR ASSETS... [OK]',
  '> ESTABLISHING UPLINK... [SECURE]',
  '> ARMORY PROTOCOLS... [ONLINE]',
  '> PROTOCOL ZERO... [ENGAGED]',
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
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden bg-black">
      {/* Visual Noise */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
      <div className="scanlines absolute inset-0 pointer-events-none opacity-40" />

      <div className="relative z-10 w-full max-w-4xl text-center">
        {/* Logo */}
        <div className="mb-12 relative group cursor-default">
          <h1 className="font-orbitron text-6xl md:text-9xl font-black uppercase text-white tracking-widest relative z-10 mix-blend-difference">
            VECTOR
          </h1>
          <h1 className="font-orbitron text-6xl md:text-9xl font-black uppercase text-[var(--color-primary-cyan)] tracking-widest absolute top-0 left-0 animate-glitch-1 opacity-50 blur-[1px]">
            VECTOR
          </h1>
          
          <div className="flex items-center justify-center gap-4 mt-2">
             <div className="h-1 w-20 bg-[var(--color-primary-magenta)]"></div>
             <h2 className="font-rajdhani text-3xl md:text-5xl font-bold uppercase text-[var(--color-primary-magenta)] tracking-[0.5em]">
                SIEGE
             </h2>
             <div className="h-1 w-20 bg-[var(--color-primary-magenta)]"></div>
          </div>
        </div>

        {/* Terminal Output */}
        <div className="w-full max-w-lg mx-auto font-mono text-left bg-black/80 border border-stone-800 p-6 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
            {bootSequenceMessages.slice(0, bootMessageIndex + 1).map((msg, i) => (
                <p key={i} className={`text-sm md:text-base mb-1 ${i === bootMessageIndex ? 'text-cyan-400 animate-pulse' : 'text-stone-500'}`}>
                    {msg}
                </p>
            ))}
            <div className="mt-4 h-1 w-full bg-stone-900 overflow-hidden">
                <div 
                    className="h-full bg-cyan-500 transition-all duration-300 ease-out"
                    style={{ width: `${((bootMessageIndex + 1) / bootSequenceMessages.length) * 100}%` }}
                />
            </div>
        </div>
      </div>

      <style>{`
        @keyframes glitch-1 {
          0% { clip-path: inset(20% 0 80% 0); transform: translate(-2px, 1px); }
          20% { clip-path: inset(60% 0 10% 0); transform: translate(2px, -1px); }
          40% { clip-path: inset(40% 0 50% 0); transform: translate(-2px, 2px); }
          60% { clip-path: inset(80% 0 5% 0); transform: translate(2px, -2px); }
          80% { clip-path: inset(10% 0 70% 0); transform: translate(-1px, 1px); }
          100% { clip-path: inset(30% 0 50% 0); transform: translate(1px, -1px); }
        }
        .animate-glitch-1 {
          animation: glitch-1 2s infinite linear alternate-reverse;
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
