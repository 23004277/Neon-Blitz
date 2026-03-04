
import React, { useState, useEffect, useRef } from 'react';

interface HUDProps {
  enemiesRemaining: number;
  playerHealth: number;
  playerMaxHealth: number;
  playerShield: number;
  comboCount?: number;
  comboMultiplier?: number;
  comboTimeLeft?: number;
}

const HUD: React.FC<HUDProps> = ({ enemiesRemaining, playerHealth, playerMaxHealth, playerShield, comboCount = 0, comboMultiplier = 1, comboTimeLeft = 0 }) => {
  const [isFlashing, setIsFlashing] = useState(false);
  const prevHealthRef = useRef(playerHealth);
  const healthPercent = Math.max(0, (playerHealth / playerMaxHealth) * 100);

  useEffect(() => {
    if (playerHealth < prevHealthRef.current) {
      setIsFlashing(true);
      const timer = setTimeout(() => setIsFlashing(false), 200);
      return () => clearTimeout(timer);
    }
    prevHealthRef.current = playerHealth;
  }, [playerHealth]);
  
  return (
    <div className="absolute top-6 left-6 z-20 font-orbitron pointer-events-none flex flex-col gap-4 scale-90 sm:scale-100 origin-top-left">
      
      {/* Top Bar: Vitals & Threat */}
      <div className="flex items-start gap-4">
          {/* Vitals Container */}
          <div className={`relative flex flex-col gap-1 w-80 p-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-sm transition-all duration-200 ${isFlashing ? 'border-red-500 bg-red-500/10' : ''}`}>
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[var(--color-primary-cyan)]" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[var(--color-primary-cyan)]" />
            
            <div className="flex justify-between items-end mb-1">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[var(--color-primary-cyan)] animate-pulse shadow-[0_0_5px_var(--color-primary-cyan)]" />
                    <span className="text-[10px] font-bold text-cyan-400 tracking-[0.2em] uppercase">HULL_INTEGRITY</span>
                </div>
                <span className="text-xs font-mono text-white tracking-widest">{Math.ceil(playerHealth)}<span className="text-stone-500">/{playerMaxHealth}</span></span>
            </div>
            
            <div className="relative h-3 bg-stone-900/80 rounded-sm overflow-hidden border border-white/5">
                {/* Segmented background markers */}
                <div className="absolute inset-0 flex justify-between px-1 pointer-events-none opacity-20">
                   {[...Array(20)].map((_, i) => <div key={i} className="w-px h-full bg-white/20" />)}
                </div>
                
                {/* Health Fill */}
                <div 
                    className="h-full bg-[var(--color-primary-cyan)] transition-all duration-300 shadow-[0_0_10px_var(--color-primary-cyan)]"
                    style={{ width: `${healthPercent}%` }}
                />
                
                {/* Shield Overlay */}
                {playerShield > 0 && (
                    <div 
                        className="absolute top-0 left-0 h-full bg-blue-400/60 border-r border-blue-300 transition-all duration-300 shadow-[0_0_10px_rgba(96,165,250,0.8)]"
                        style={{ width: `${Math.min(100, (playerShield / 5) * 100)}%` }}
                    />
                )}
            </div>
          </div>

          {/* Threat Level */}
          <div className="relative flex flex-col items-center justify-center min-w-[80px] p-2 bg-black/40 backdrop-blur-md border border-red-500/30 rounded-sm">
            <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-red-500" />
            <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-red-500" />
            
            <span className="text-[8px] text-red-500 tracking-[0.2em] font-bold mb-0.5">HOSTILES</span>
            <div className="text-3xl font-black text-white leading-none tracking-tighter drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]">
                {enemiesRemaining.toString().padStart(2, '0')}
            </div>
          </div>
      </div>

      {/* Adrenaline Combo */}
      {comboCount > 1 && (
        <div className={`relative flex flex-col gap-1 w-64 p-3 bg-black/40 backdrop-blur-md border border-yellow-500/30 rounded-sm transition-all duration-200 mt-2 ${comboMultiplier > 2 ? 'animate-pulse shadow-[0_0_15px_rgba(234,179,8,0.2)]' : ''}`}>
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]" />
          
          <div className="flex justify-between items-end pl-2">
            <span className="text-[9px] font-bold text-yellow-500 tracking-[0.2em] uppercase">ADRENALINE_LINK</span>
            <span className="text-sm font-black text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">x{comboMultiplier}</span>
          </div>
          <div className="text-xl font-black text-yellow-400 leading-none tracking-tighter italic pl-2">
            {comboCount} HITS
          </div>
          <div className="h-1 bg-stone-900 relative overflow-hidden mt-1 ml-2 rounded-sm">
            <div 
              className="h-full bg-yellow-400 transition-all duration-100 shadow-[0_0_5px_rgba(250,204,21,0.8)]"
              style={{ width: `${(comboTimeLeft / 3000) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default HUD;
