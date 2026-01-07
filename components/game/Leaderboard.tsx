
import React, { useMemo } from 'react';
import { Tank, Boss } from '../../types';
import TankIcon from './TankIcon';

interface LeaderboardProps {
  player: Tank;
  enemies: Tank[];
  boss: Boss | null;
}

type Combatant = {
  id: string;
  name: string;
  type: 'player' | 'enemy' | 'boss';
  tier?: 'basic' | 'intermediate';
  bossType?: 'goliath' | 'viper' | 'sentinel';
  health: number;
  maxHealth: number;
  score: number;
  kills: number;
  deaths: number;
  isDead: boolean;
  color: string;
};

const Leaderboard: React.FC<LeaderboardProps> = ({ player, enemies, boss }) => {
  
  const combatants = useMemo(() => {
    const list: Combatant[] = [];

    // Add Player
    list.push({
      id: player.id,
      name: player.name,
      type: 'player',
      health: player.health,
      maxHealth: player.maxHealth,
      score: player.score,
      kills: player.kills,
      deaths: player.deaths,
      isDead: player.status === 'dead',
      color: 'var(--color-primary-cyan)'
    });

    // Add Boss
    if (boss) {
      list.push({
        id: boss.id,
        name: boss.name,
        type: 'boss',
        bossType: boss.bossType,
        health: boss.health,
        maxHealth: boss.maxHealth,
        score: Math.max(boss.health * 10, 1000), // Artificial score for boss based on threat
        kills: 0, // Bosses don't track kills in current type, default 0
        deaths: boss.status === 'dead' ? 1 : 0,
        isDead: boss.status === 'dead',
        color: 'var(--color-primary-magenta)'
      });
    }

    // Add Enemies
    enemies.forEach(e => {
      list.push({
        id: e.id,
        name: e.name,
        type: 'enemy',
        tier: e.tier,
        health: e.health,
        maxHealth: e.maxHealth,
        score: e.score,
        kills: e.kills,
        deaths: e.deaths,
        isDead: e.status === 'dead',
        color: e.color // Use specific entity color
      });
    });

    // Sort: Score Desc -> Health Desc -> Name Asc
    return list.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.health !== a.health) return b.health - a.health;
      return a.name.localeCompare(b.name);
    });
  }, [player, enemies, boss]);

  const totalKills = combatants.reduce((acc, c) => acc + c.kills, 0);
  const activeHostiles = combatants.filter(c => (c.type === 'enemy' || c.type === 'boss') && !c.isDead).length;

  return (
    <div className="w-80 font-rajdhani overflow-hidden flex flex-col pointer-events-none select-none">
      
      {/* Header */}
      <div className="bg-black/80 backdrop-blur-md border-t-2 border-l-2 border-[var(--color-primary-cyan)] p-3 flex justify-between items-center clip-corner-top-right">
        <div>
          <h2 className="font-orbitron text-lg font-bold text-[var(--color-primary-cyan)] tracking-widest leading-none text-glow-cyan">
            COMBAT FEED
          </h2>
          <span className="text-[10px] text-cyan-400/60 font-mono tracking-widest">SECTOR 7 // LIVE</span>
        </div>
        <div className="flex flex-col items-end">
             <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${activeHostiles > 0 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></span>
                <span className="font-bold text-sm text-white">{activeHostiles} HOSTILES</span>
             </div>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[1fr_3fr_1fr_1fr] gap-2 px-3 py-1 bg-black/60 text-[10px] text-stone-500 font-bold tracking-wider uppercase border-l-2 border-white/10">
        <span>Unit</span>
        <span>Status</span>
        <div className="text-center">Scr</div>
        <div className="text-right">K/D</div>
      </div>

      {/* List */}
      <div className="flex flex-col bg-black/40 backdrop-blur-sm">
        {combatants.map((c, idx) => {
          const isPlayer = c.type === 'player';
          const isBoss = c.type === 'boss';
          const hpPercent = (c.health / c.maxHealth) * 100;

          return (
            <div 
              key={c.id}
              className={`
                relative grid grid-cols-[auto_1fr_auto_auto] gap-x-3 gap-y-1 p-2 border-l-2 transition-all duration-300 items-center
                ${c.isDead ? 'opacity-40 grayscale' : 'opacity-100'}
                ${isPlayer ? 'bg-cyan-900/20 border-[var(--color-primary-cyan)]' : 
                  isBoss ? 'bg-red-900/20 border-[var(--color-primary-magenta)]' : 
                  'border-stone-700 bg-black/20'}
              `}
            >
              {/* Rank / Icon */}
              <div className="flex flex-col items-center justify-center w-8">
                <span className={`text-xs font-bold font-orbitron mb-1 ${isPlayer ? 'text-cyan-400' : 'text-stone-500'}`}>
                    {idx + 1}
                </span>
                <TankIcon 
                  type={c.type}
                  tier={c.tier}
                  bossType={c.bossType}
                  color={c.color} 
                  className="w-5 h-5" 
                />
              </div>

              {/* Name & Health */}
              <div className="min-w-0 flex flex-col justify-center">
                <div className="flex items-baseline justify-between">
                    <span className={`font-bold text-sm truncate leading-none mb-1 ${isPlayer ? 'text-cyan-100' : isBoss ? 'text-red-100' : 'text-stone-300'}`}>
                        {c.name}
                    </span>
                </div>
                {/* Micro Health Bar */}
                <div className="w-full h-1 bg-stone-800 rounded-sm overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-300 ${isPlayer ? 'bg-cyan-400' : isBoss ? 'bg-[var(--color-primary-magenta)]' : 'bg-orange-500'}`} 
                        style={{ width: `${Math.max(0, hpPercent)}%` }}
                    />
                </div>
              </div>

              {/* Score */}
              <div className="font-orbitron text-sm font-bold text-right text-stone-300 self-center">
                {c.score}
              </div>

              {/* K/D */}
              <div className="flex flex-col items-end justify-center text-[10px] font-bold leading-tight self-center w-8">
                 <span className="text-green-400">{c.kills}</span>
                 <span className="w-full h-px bg-white/10 my-0.5"></span>
                 <span className="text-red-400">{c.deaths}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Totals */}
      <div className="flex justify-between items-center px-4 py-2 bg-[var(--color-primary-cyan)]/10 border-t border-[var(--color-primary-cyan)]/30 border-l-2 border-l-[var(--color-primary-cyan)]">
         <span className="text-[10px] uppercase text-cyan-400 tracking-wider">Total Casualties</span>
         <span className="font-orbitron font-bold text-lg text-white text-glow-cyan">{totalKills}</span>
      </div>

      <style>{`
        .clip-corner-top-right {
           clip-path: polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%);
        }
      `}</style>
    </div>
  );
};

export default Leaderboard;
