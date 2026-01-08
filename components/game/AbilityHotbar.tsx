
import React from 'react';
import type { Ability } from '../../types';
import AbilityCard from './AbilityCard';

interface AbilityHotbarProps {
  abilities: Ability[];
  damageConverterCharge?: number;
}

const AbilityHotbar: React.FC<AbilityHotbarProps> = ({ abilities, damageConverterCharge }) => {
  return (
    <div className="h-full flex flex-col justify-center w-full pointer-events-auto pr-4 select-none">
        <div className="flex flex-col gap-1 w-72">
            {abilities.map((ability, index) => (
                <AbilityCard 
                    key={ability.id} 
                    ability={ability} 
                    index={index} 
                    charge={ability.id === 'damageConverter' ? damageConverterCharge : undefined}
                />
            ))}
        </div>
        
        {/* Decorative footer line */}
        <div className="w-72 mt-2 flex items-center justify-between opacity-50">
            <div className="h-px bg-stone-700 w-1/3"></div>
            <div className="text-[9px] font-mono text-stone-500">SYS.READY</div>
            <div className="h-px bg-stone-700 w-1/3"></div>
        </div>
    </div>
  );
};

export default AbilityHotbar;
