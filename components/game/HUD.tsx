
import React from 'react';

interface HUDProps {
  enemiesRemaining: number;
}

const HUD: React.FC<HUDProps> = ({ enemiesRemaining }) => {
  return (
    <div className="absolute top-6 left-6 z-20 font-orbitron pointer-events-none">
      <div className="flex flex-col">
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
    </div>
  );
};

export default HUD;
