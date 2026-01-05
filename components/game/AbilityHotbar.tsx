
import React from 'react';
import type { Ability } from '../../types';
import AbilityCard from './AbilityCard';

interface AbilityHotbarProps {
  abilities: Ability[];
}

const AbilityHotbar: React.FC<AbilityHotbarProps> = ({ abilities }) => {
  return (
    <div className="h-full flex flex-col w-full pointer-events-auto py-6 pl-4">
        {/* Main Container */}
        <div className="bg-black/60 border border-[var(--color-border)] rounded-xl p-4 h-full flex flex-col backdrop-blur-md shadow-[0_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
            
            {/* Header */}
            <div className="mb-5 flex-shrink-0 z-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="relative">
                        <div className="w-2 h-2 bg-[var(--color-primary-cyan)] rounded-full animate-pulse z-10 relative" />
                        <div className="absolute inset-0 bg-[var(--color-primary-cyan)] rounded-full animate-ping opacity-75" />
                    </div>
                    <h3 className="text-[var(--color-primary-cyan)] font-orbitron font-bold text-sm tracking-[0.2em] uppercase text-glow-cyan">
                        SYSTEMS
                    </h3>
                </div>
                <div className="h-px w-full bg-gradient-to-r from-[var(--color-primary-cyan)] via-[var(--color-primary-cyan)]/20 to-transparent opacity-50" />
            </div>

            {/* List of Abilities */}
            <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar z-10">
                {abilities.map((ability, index) => (
                    <AbilityCard key={ability.id} ability={ability} index={index} />
                ))}
            </div>

            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary-cyan)]/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[var(--color-primary-magenta)]/5 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/2" />
        </div>

        <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-primary-cyan); border-radius: 2px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #fff; }
        `}</style>
    </div>
  );
};

export default AbilityHotbar;
