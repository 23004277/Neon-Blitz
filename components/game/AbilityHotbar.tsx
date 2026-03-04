// components/game/AbilityHotbar.tsx
import React from "react";
import type { Ability } from "../../types";
import AbilityCard from "./AbilityCard";

interface AbilityHotbarProps {
  abilities: Ability[];
  damageConverterCharge?: number;
  mousePos?: { x: number; y: number };
}

const AbilityHotbar: React.FC<AbilityHotbarProps> = ({ abilities, damageConverterCharge, mousePos }) => {
  return (
    <div
      className="ability-hotbar h-full flex flex-col w-full pointer-events-auto pr-4 select-none"
      aria-label="Ability hotbar"
    >
      {/* Hotbar Rail Decor */}
      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-stone-800 to-transparent opacity-50" />
      
      <div className="flex flex-col gap-1 w-[340px] relative">
        {/* Header with diagnostic feel */}
        <div className="flex items-center justify-between mb-3 px-2">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[var(--color-primary-cyan)] animate-pulse shadow-[0_0_5px_var(--color-primary-cyan)]" />
                <span className="text-[9px] font-orbitron font-black text-stone-400 tracking-[0.3em] uppercase">TACTICAL_OS // ABILITIES</span>
            </div>
            <div className="flex gap-1">
                <div className="w-3 h-1 bg-stone-800" />
                <div className="w-3 h-1 bg-stone-800" />
                <div className="w-3 h-1 bg-[var(--color-primary-cyan)]/40" />
            </div>
        </div>

        {/* Ability Cards */}
        <div className="grid grid-cols-2 gap-2">
            {abilities.map((ability, index) => (
              <AbilityCard
                key={ability.id}
                ability={ability}
                index={index}
                mousePos={mousePos}
                charge={ability.id === "damageConverter" ? damageConverterCharge : undefined}
                onClick={() => {
                  // Wire to input system if needed
                }}
              />
            ))}
        </div>

        {/* Diagnostic Footer */}
        <div className="mt-4 px-2 py-3 border-t border-stone-800/50 bg-black/20 backdrop-blur-sm rounded-sm relative overflow-hidden">
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-1 h-1 border-t border-l border-stone-700" />
            <div className="absolute top-0 right-0 w-1 h-1 border-t border-r border-stone-700" />
            <div className="absolute bottom-0 left-0 w-1 h-1 border-b border-l border-stone-700" />
            <div className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-stone-700" />

            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-[var(--color-primary-cyan)] rounded-full shadow-[0_0_3px_var(--color-primary-cyan)]" />
                    <span className="text-[8px] font-black text-stone-400 tracking-widest uppercase">SYSTEM_STATUS</span>
                </div>
                <span className="text-[8px] font-mono text-[var(--color-primary-cyan)] animate-pulse">NOMINAL // 0.002ms</span>
            </div>
            
            <div className="flex gap-0.5 h-1.5 mb-2">
                {Array.from({ length: 32 }).map((_, i) => (
                    <div 
                        key={i} 
                        className={`flex-1 h-full transition-all duration-500 ${i < 24 ? 'bg-stone-700' : 'bg-stone-900'}`} 
                        style={{ 
                            opacity: 0.2 + (Math.random() * 0.5),
                            animation: `pulse ${1 + Math.random() * 2}s infinite`
                        }}
                    />
                ))}
            </div>

            <div className="flex justify-between items-end">
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1 h-1 bg-stone-800" />
                        <span className="text-[6px] font-mono text-stone-500 uppercase tracking-tighter">NEURAL_SYNC: ACTIVE</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1 h-1 bg-stone-800" />
                        <span className="text-[6px] font-mono text-stone-500 uppercase tracking-tighter">HW_REV: 4.0.2-B</span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[7px] font-mono text-stone-600 uppercase tracking-tighter mb-0.5">V-SIEGE // CORE_LINK</div>
                    <div className="w-16 h-0.5 bg-stone-900 relative">
                        <div className="absolute inset-0 bg-[var(--color-primary-cyan)]/20 animate-[loading_2s_infinite]" />
                    </div>
                </div>
            </div>
        </div>
      </div>

      <style>{`
        .ability-hotbar {
          animation: hotbarSlideIn .6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes hotbarSlideIn {
          0% { opacity: 0; transform: translateX(-40px); }
          100% { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default AbilityHotbar;
