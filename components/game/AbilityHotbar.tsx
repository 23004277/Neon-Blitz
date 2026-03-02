// components/game/AbilityHotbar.tsx
import React from "react";
import type { Ability } from "../../types";
import AbilityCard from "./AbilityCard";

interface AbilityHotbarProps {
  abilities: Ability[];
  damageConverterCharge?: number;
}

const AbilityHotbar: React.FC<AbilityHotbarProps> = ({ abilities, damageConverterCharge }) => {
  return (
    <div
      className="ability-hotbar h-full flex flex-col w-full pointer-events-auto pr-4 select-none"
      aria-label="Ability hotbar"
    >
      <div className="flex flex-col gap-2 w-72">
        <div className="flex items-center gap-2 mb-1 opacity-80">
            <div className="w-1 h-3 bg-stone-600"></div>
            <span className="text-[10px] font-orbitron text-stone-400 tracking-widest uppercase">WEAPON SYSTEMS</span>
        </div>
        {abilities.map((ability, index) => (
          <AbilityCard
            key={ability.id}
            ability={ability}
            index={index}
            charge={ability.id === "damageConverter" ? damageConverterCharge : undefined}
            onClick={() => {
              // owner / debug: activating ability via hotbar (hook into your input system)
              // This is intentionally left as an entrypoint for the engine to wire.
            }}
          />
        ))}
      </div>

      {/* Decorative footer: less intrusive, animated micro-glow */}
      <div className="w-72 mt-3 flex items-center justify-between opacity-80 select-none">
        <div className="h-px bg-gradient-to-r from-transparent via-stone-600 to-transparent w-1/3" />
        <div className="text-[10px] font-orbitron text-stone-400 tracking-widest uppercase">
          <span className="inline-block mr-2">SYSTEMS</span>
          <span className="inline-block text-stone-300">ONLINE</span>
          <span
            className="inline-block ml-2 w-1 h-1 rounded-full animate-pulse"
            style={{ background: "linear-gradient(90deg,#8b5cf6,#06b6d4)" }}
            aria-hidden
          />
        </div>
        <div className="h-px bg-gradient-to-l from-transparent via-stone-600 to-transparent w-1/3" />
      </div>
    </div>
  );
};

export default AbilityHotbar;