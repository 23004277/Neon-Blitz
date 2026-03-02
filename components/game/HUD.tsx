
import React, { useState, useEffect, useRef } from 'react';

interface HUDProps {
  enemiesRemaining: number;
  playerHealth: number;
  playerMaxHealth: number;
  playerShield: number;
}

const HUD: React.FC<HUDProps> = ({ enemiesRemaining, playerHealth, playerMaxHealth, playerShield }) => {
  const [isFlashing, setIsFlashing] = useState(false);
  const prevHealthRef = useRef(playerHealth);
  const healthPercent = (playerHealth / playerMaxHealth) * 100;

  useEffect(() => {
    if (playerHealth < prevHealthRef.current) {
      setIsFlashing(true);
      const timer = setTimeout(() => setIsFlashing(false), 200);
      return () => clearTimeout(timer);
    }
    prevHealthRef.current = playerHealth;
  }, [playerHealth]);
  
  return (
    <div className="absolute top-8 left-8 z-20 font-orbitron pointer-events-none flex flex-col gap-8 scale-90 sm:scale-100 origin-top-left">
      {/* Threat Level */}
      <div className="threat-level flex flex-col">
        <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_red]" />
            <span className="text-[10px] text-red-500 tracking-[0.2em] font-bold">THREAT LEVEL</span>
        </div>
        <div className="relative">
            <div className="text-6xl font-black text-white leading-none tracking-tighter mix-blend-overlay opacity-50 absolute top-1 left-1">
                {enemiesRemaining.toString().padStart(2, '0')}
            </div>
            <div className="text-6xl font-black text-white leading-none tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                {enemiesRemaining.toString().padStart(2, '0')}
            </div>
        </div>
        <div className="h-1 w-24 bg-red-500/50 mt-2 relative overflow-hidden">
            <div className="absolute inset-0 bg-red-500 w-full animate-[shimmer_2s_infinite]" />
        </div>
      </div>

      {/* Vitals */}
      <div className={`vitals-container flex flex-col gap-2 w-72 p-4 bg-black/60 border-l-4 transition-all duration-200 backdrop-blur-md ${isFlashing ? 'border-red-500 bg-red-500/20' : 'border-cyan-500/40'}`}>
        {/* Health Bar with Shield Overlay */}
        <div className="flex flex-col gap-1">
            <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-cyan-400 tracking-widest">HULL INTEGRITY</span>
                <span className="text-xs font-mono text-white">{Math.ceil(playerHealth)}/{playerMaxHealth}</span>
            </div>
            <div className="h-4 bg-stone-800 relative overflow-hidden skew-x-[-10deg]">
                {/* Health Fill */}
                <div 
                    className="h-full bg-cyan-500 transition-all duration-300 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                    style={{ width: `${healthPercent}%` }}
                />
                {/* Shield Overlay */}
                {playerShield > 0 && (
                    <div 
                        className="absolute top-0 left-0 h-full bg-blue-500/40 border-r-2 border-blue-400 transition-all duration-300"
                        style={{ width: `${(playerShield / 5) * 100}%` }}
                    />
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default HUD;
