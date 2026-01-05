import React from 'react';
import { Tank as TankType } from '../../types';
import HealthBar from './HealthBar';
import TankIcon from './TankIcon';

interface LeaderboardProps {
  player: TankType;
  enemies: TankType[];
}

const Leaderboard: React.FC<LeaderboardProps> = ({ player, enemies }) => {
  const allTanks = [player, ...enemies];
  
  // Keep sorting by score for ranking
  const rankedTanks = [...allTanks].sort((a, b) => b.score - a.score);

  const arenaTotals = allTanks.reduce(
    (acc, tank) => {
      acc.score += tank.score;
      acc.kills += tank.kills;
      acc.deaths += tank.deaths;
      return acc;
    },
    { score: 0, kills: 0, deaths: 0 }
  );

  const KillIcon = () => (
    <svg className="w-3.5 h-3.5 text-green-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v8m-4-4h8" />
    </svg>
  );

  const DeathIcon = () => (
     <svg className="w-3.5 h-3.5 text-red-400/80" fill="currentColor" viewBox="0 0 16 16">
        <path d="M13.5 0a.5.5 0 0 1 .5.5V1c0 .276-.224.5-.5.5h-2.293L12.146 3.146a.5.5 0 0 1-.708.708L10 2.414V3.5a.5.5 0 0 1-1 0V2.414l-1.438 1.438a.5.5 0 0 1-.708-.708L8.293 1.5H6a.5.5 0 0 1-.5-.5V.5a.5.5 0 0 1 .5.5h7.5ZM2.01 3.064a.5.5 0 0 1 .693-.162l1.64 1.16 1.437-1.437a.5.5 0 0 1 .638-.058l1.454.969 1.453-.969a.5.5 0 0 1 .638.058l1.437 1.437 1.64-1.16a.5.5 0 0 1 .693.162l1.297 1.945a.5.5 0 0 1-.343.832H1.056a.5.5 0 0 1-.343-.832l1.297-1.945Z"/>
        <path d="M14 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM4 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"/>
        <path d="M2.5 7.5a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0v-1a.5.5 0 0 1 .5.5Zm11 0a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0v-1a.5.5 0 0 1 .5.5Z"/>
        <path d="M4 10.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5Z"/>
        <path d="M2.5 12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2a.5.5 0 0 1 .5.5Zm11 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2a.5.5 0 0 1 .5.5Z"/>
    </svg>
  );

  return (
    <div className="w-full bg-black/70 border-y-2 border-r-2 border-[var(--color-border)] p-4 backdrop-blur-sm z-20 font-rajdhani animate-fade-in-right leaderboard-container box-glow-magenta">
      <h2 className="font-orbitron text-2xl uppercase text-[var(--color-primary-magenta)] text-glow-magenta mb-4 text-center tracking-widest">
        COMBATANTS
      </h2>
      <ul className="space-y-2 mb-4">
        {rankedTanks.map((tank, index) => (
          <li 
            key={tank.id} 
            className={`relative flex items-center space-x-3 p-2 transition-all duration-300 border-l-4 group
            ${
              tank.type === 'player' 
                ? 'bg-cyan-900/40 border-[var(--color-primary-cyan)] hover:bg-cyan-900/60' 
                : 'bg-fuchsia-900/40 border-[var(--color-primary-magenta)] hover:bg-fuchsia-900/60'
            }`}
          >
            <div className="font-orbitron font-bold text-xl text-stone-400 w-6 text-center">{index + 1}</div>
            <TankIcon color={tank.type === 'player' ? 'var(--color-primary-cyan)' : 'var(--color-primary-magenta)'} className="w-10 h-10 flex-shrink-0" />
            <div className="flex-grow overflow-hidden">
              <p className={`font-bold text-lg truncate ${tank.type === 'player' ? 'text-cyan-100' : 'text-fuchsia-100'}`}>
                  {tank.name}
              </p>
              <HealthBar 
                currentHealth={tank.health} 
                maxHealth={3} 
                color={tank.type === 'player' ? 'var(--color-primary-cyan)' : 'var(--color-primary-magenta)'}
                shieldHealth={tank.shieldHealth}
                maxShieldHealth={3}
              />
            </div>
             <div className="flex flex-col items-end justify-center space-y-1 w-12 text-sm font-semibold pr-1">
                <div className="flex items-center gap-1.5"><span className="text-green-300 font-orbitron">{tank.kills}</span> <KillIcon /></div>
                <div className="flex items-center gap-1.5"><span className="text-red-300 font-orbitron">{tank.deaths}</span> <DeathIcon /></div>
            </div>
            {/* Hover effect */}
            <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`}/>
          </li>
        ))}
      </ul>

      <div className="border-t-2 border-[var(--color-primary-cyan)]/50 my-4 glowing-divider"></div>
      
      <h3 className="font-orbitron text-xl uppercase text-[var(--color-primary-cyan)] text-glow-cyan mb-3 text-center tracking-wider">
        ARENA TOTALS
      </h3>
      <div className="flex overflow-hidden border-2 border-[var(--color-primary-cyan)]/50 rounded-md bg-black/50">
        {[{label: 'SCORE', value: arenaTotals.score, color: 'amber'}, {label: 'KILLS', value: arenaTotals.kills, color: 'green'}, {label: 'DEATHS', value: arenaTotals.deaths, color: 'red'}].map((item, index) => (
            <div key={item.label} className={`
                flex-1 p-2 text-center
                ${index > 0 ? 'border-l-2 border-[var(--color-primary-cyan)]/30' : ''}
            `}>
                <p className={`font-rajdhani text-xs font-bold text-${item.color}-400/80 uppercase tracking-widest`}>{item.label}</p>
                <p className={`font-orbitron text-2xl font-bold text-${item.color}-300 tracking-wider leading-tight truncate text-glow-${item.color}`}>
                    {item.value}
                </p>
            </div>
        ))}
      </div>

      <style>{`
        .leaderboard-container {
          clip-path: polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%);
        }
        @keyframes fade-in-right {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in-right {
          animation: fade-in-right 0.5s ease-out forwards;
        }
        .glowing-divider {
          box-shadow: 0 0 10px var(--color-primary-cyan);
        }
        /* JIT colors for Tailwind */
        .text-amber-400 {} .text-green-400 {} .text-red-400 {}
        .text-amber-300 {} .text-green-300 {} .text-red-300 {}
        .text-amber-400\/80 {} .text-green-400\/80 {} .text-red-400\/80 {}
      `}</style>
    </div>
  );
};

export default Leaderboard;