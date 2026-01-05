
import React from 'react';

interface HUDProps {
  enemiesRemaining: number;
}

const HUD: React.FC<HUDProps> = ({ enemiesRemaining }) => {
  return (
    <div className="absolute top-6 left-6 z-20 font-orbitron">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[var(--color-primary-cyan)] animate-pulse" />
            <span className="text-xs text-[var(--color-primary-cyan)] tracking-widest opacity-80">HOSTILES DETECTED</span>
        </div>
        <div className="text-5xl font-black text-white leading-none tracking-tighter filter drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">
            {enemiesRemaining.toString().padStart(2, '0')}
        </div>
      </div>
      
      {/* Decorative lines */}
      <svg className="absolute -left-2 -top-2 w-24 h-24 pointer-events-none opacity-50" viewBox="0 0 100 100">
        <path d="M0 0 L20 0 L20 4 M0 0 L0 20" stroke="var(--color-primary-cyan)" strokeWidth="2" fill="none" />
      </svg>
    </div>
  );
};

export default HUD;
