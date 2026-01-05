
import React, { useState } from 'react';
import { Screen, GameConfig, DuelConfig } from '../types';
import TankIcon from './game/TankIcon';
import CyberButton from './common/CyberButton';

interface DuelSelectionScreenProps {
  navigateTo: (screen: Screen) => void;
  setGameConfig: (config: GameConfig) => void;
}

const opponents: DuelConfig[] = [
  { 
    opponentId: 'rogue-scout', 
    opponentType: 'tank', 
    tier: 'basic', 
    opponentName: 'Rogue Scout',
  },
  { 
    opponentId: 'iron-bastion', 
    opponentType: 'tank', 
    tier: 'intermediate', 
    opponentName: 'Iron Bastion',
  },
  { 
    opponentId: 'goliath-prime', 
    opponentType: 'boss', 
    opponentName: 'Goliath Prime',
  }
];

// Simple Radar Chart Component
const RadarChart = ({ stats, color }: { stats: {atk: number, def: number, spd: number}, color: string }) => {
    const size = 160;
    const center = size / 2;
    const radius = size * 0.4;
    
    // Normalize stats 0-100 to 0-1 scaling factor
    const points = [
        stats.atk / 100, // Top
        stats.def / 100, // Bottom Right
        stats.spd / 100  // Bottom Left
    ];

    const angles = [ -Math.PI / 2, Math.PI / 6, 5 * Math.PI / 6 ];
    
    const getCoords = (r: number, i: number) => ({
        x: center + r * Math.cos(angles[i]),
        y: center + r * Math.sin(angles[i])
    });

    const polygonPoints = points.map((p, i) => {
        const {x, y} = getCoords(radius * p, i);
        return `${x},${y}`;
    }).join(' ');

    const backgroundPoints = angles.map((_, i) => {
        const {x, y} = getCoords(radius, i);
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={size} height={size} className="overflow-visible">
            {/* Background Triangle */}
            <polygon points={backgroundPoints} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)" />
            {/* Inner Grid */}
            {[0.33, 0.66].map(scale => {
                 const gridPoints = angles.map((_, i) => {
                    const {x, y} = getCoords(radius * scale, i);
                    return `${x},${y}`;
                }).join(' ');
                return <polygon key={scale} points={gridPoints} fill="none" stroke="rgba(255,255,255,0.1)" strokeDasharray="2 2"/>
            })}
            
            {/* Labels */}
            <text x={center} y={center - radius - 10} textAnchor="middle" fill="#aaa" fontSize="10" className="font-orbitron">ATK</text>
            <text x={center + radius} y={center + radius / 2 + 15} textAnchor="middle" fill="#aaa" fontSize="10" className="font-orbitron">DEF</text>
            <text x={center - radius} y={center + radius / 2 + 15} textAnchor="middle" fill="#aaa" fontSize="10" className="font-orbitron">SPD</text>

            {/* Data Polygon */}
            <polygon points={polygonPoints} fill={color.replace('text-', 'bg-').replace('border-', 'bg-').replace('var(--color-', '').replace(')', '') + '/30'} stroke={color.includes('cyan') ? '#00F0FF' : color.includes('magenta') ? '#FF003C' : color.includes('orange') ? '#f97316' : '#fff'} strokeWidth="2" fillOpacity="0.4" />
            
            {/* Data Points */}
            {points.map((p, i) => {
                const {x, y} = getCoords(radius * p, i);
                return <circle key={i} cx={x} cy={y} r="3" fill="#fff" />
            })}
        </svg>
    );
};

const DuelSelectionScreen: React.FC<DuelSelectionScreenProps> = ({ navigateTo, setGameConfig }) => {
  const [selectedOpponent, setSelectedOpponent] = useState<DuelConfig>(opponents[0]);

  const handleStartDuel = () => {
    setGameConfig({ mode: 'duel', duelConfig: selectedOpponent });
    navigateTo('game');
  };

  const getStats = (opp: DuelConfig) => {
      if (opp.opponentType === 'boss') return { atk: 95, def: 90, spd: 20, diff: 'EXTREME' };
      if (opp.tier === 'intermediate') return { atk: 70, def: 80, spd: 40, diff: 'HARD' };
      return { atk: 40, def: 30, spd: 90, diff: 'NORMAL' };
  }

  const currentStats = getStats(selectedOpponent);
  const themeColor = selectedOpponent.opponentType === 'boss' ? 'text-[var(--color-primary-magenta)]' : 
                     selectedOpponent.tier === 'intermediate' ? 'text-orange-500' : 'text-[var(--color-primary-cyan)]';

  return (
    <div className="flex flex-col min-h-screen p-4 md:p-8 relative overflow-hidden bg-[var(--color-background)]">
       {/* Background Grid */}
       <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
         <div className="absolute right-0 top-0 w-2/3 h-full bg-gradient-to-l from-[var(--color-primary-cyan)]/10 to-transparent" />
         <div className="grid-bg" />
         <div className="bg-tech-dots absolute inset-0 opacity-30" />
       </div>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-end mb-8 border-b border-[var(--color-border)] pb-4 animate-slide-up">
        <div>
            <h1 className="font-orbitron text-4xl md:text-6xl font-black uppercase text-[var(--color-text-light)]">
            Duel <span className="text-[var(--color-primary-cyan)]">Sim</span>
            </h1>
            <p className="font-rajdhani text-[var(--color-text-dim)] tracking-widest text-sm mt-1">SELECT YOUR OPPONENT // INITIATE COMBAT</p>
        </div>
        <div className="hidden md:block text-right font-orbitron text-xs text-[var(--color-text-dim)] border-r-2 border-[var(--color-primary-cyan)] pr-4">
            SYSTEM_ID: DUEL_CORE_V1<br/>
            STATUS: WAITING_FOR_INPUT
        </div>
      </div>

      <div className="relative z-10 flex-grow grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
        
        {/* Left Column: List */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {opponents.map((opponent, index) => {
            const isSelected = selectedOpponent.opponentId === opponent.opponentId;
            return (
              <button
                key={opponent.opponentId}
                onClick={() => setSelectedOpponent(opponent)}
                className={`group relative flex items-center p-4 border transition-all duration-300 overflow-hidden clip-corner-4 text-left animate-slide-up
                  ${isSelected 
                    ? 'bg-[var(--color-primary-cyan)]/10 border-[var(--color-primary-cyan)] shadow-[inset_0_0_20px_rgba(0,240,255,0.2)]' 
                    : 'bg-black/60 border-[var(--color-border)] hover:bg-white/5 hover:border-[var(--color-text-light)]'
                  }
                `}
                style={{ animationDelay: `${index * 100 + 100}ms` }}
              >
                {/* Active Indicator */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 ${isSelected ? 'bg-[var(--color-primary-cyan)]' : 'bg-transparent group-hover:bg-[var(--color-border)]'}`} />
                
                <div className="flex-shrink-0 mr-4">
                    <div className={`w-12 h-12 flex items-center justify-center bg-black/80 border border-[var(--color-border)] ${isSelected ? 'box-glow-cyan' : ''}`}>
                       <TankIcon color={isSelected ? 'var(--color-primary-cyan)' : '#555'} className="w-8 h-8" />
                    </div>
                </div>

                <div>
                    <h3 className={`font-orbitron text-lg font-bold uppercase tracking-wider ${isSelected ? 'text-[var(--color-text-light)] text-glow-cyan' : 'text-[var(--color-text-dim)] group-hover:text-[var(--color-text-light)]'}`}>
                    {opponent.opponentName}
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${opponent.opponentType === 'boss' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                        <p className="font-rajdhani text-xs text-[var(--color-text-dim)] uppercase">
                        {opponent.opponentType === 'boss' ? 'Class: Dreadnought' : `Class: Standard (T${opponent.tier === 'intermediate' ? '2' : '1'})`}
                        </p>
                    </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Details Panel */}
        <div className="lg:col-span-8 flex flex-col h-full animate-slide-up delay-400">
            <div className="cyber-panel flex-grow p-8 relative flex flex-col clip-corner-2 bg-black/80">
                {/* Background Tech Elements */}
                <div className="absolute top-4 right-4 text-[var(--color-primary-cyan)] opacity-20">
                    <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                        <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="1" strokeDasharray="10 5" />
                        <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="1" />
                        <path d="M50 0 L50 100 M0 50 L100 50" stroke="currentColor" strokeWidth="0.5" />
                    </svg>
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-start mb-8 h-full">
                    {/* Visualizer Column */}
                    <div className="flex flex-col items-center gap-6 w-full md:w-1/2">
                        <div className="relative w-64 h-64 flex-shrink-0 flex items-center justify-center bg-black/50 border border-[var(--color-border)] clip-hex box-glow-cyan">
                            {selectedOpponent.opponentType === 'boss' ? (
                                <div className="text-8xl animate-pulse text-[var(--color-primary-magenta)]">☠</div> 
                            ) : (
                                <TankIcon 
                                    color={selectedOpponent.tier === 'intermediate' ? '#f97316' : '#F000B8'} 
                                    className="w-40 h-40 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
                                />
                            )}
                            {/* Scanline overlay on image */}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--color-primary-cyan)]/10 to-transparent animate-pulse pointer-events-none" style={{backgroundSize: '100% 4px'}} />
                        </div>
                        
                        {/* Radar Chart */}
                        <div className="mt-4">
                            <RadarChart stats={currentStats} color={themeColor} />
                        </div>
                    </div>

                    {/* Stats & Info Column */}
                    <div className="flex-grow w-full md:w-1/2 flex flex-col justify-center h-full">
                        <h2 className="font-orbitron text-4xl font-black uppercase text-[var(--color-text-light)] mb-2">
                            {selectedOpponent.opponentName}
                        </h2>
                        <div className="flex gap-2 mb-8">
                            <span className={`px-2 py-1 border text-xs font-bold font-orbitron uppercase ${selectedOpponent.opponentType === 'boss' ? 'border-[var(--color-primary-magenta)] text-[var(--color-primary-magenta)] bg-[var(--color-primary-magenta)]/10' : 'border-[var(--color-primary-cyan)] text-[var(--color-primary-cyan)] bg-[var(--color-primary-cyan)]/10'}`}>
                                THREAT: {currentStats.diff}
                            </span>
                            <span className="px-2 py-1 bg-stone-800 border border-stone-600 text-stone-400 text-xs font-bold font-orbitron uppercase">
                                UNIT_TYPE: {selectedOpponent.opponentType.toUpperCase()}
                            </span>
                        </div>

                        <div className="space-y-6 font-rajdhani w-full bg-black/40 p-6 border border-[var(--color-border)]/30 rounded-sm">
                            <h4 className="text-[var(--color-text-dim)] uppercase tracking-widest text-sm border-b border-gray-700 pb-2 mb-4">Tactical Analysis</h4>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-xs text-gray-500 uppercase">Primary Weapon</div>
                                    <div className="text-lg text-white font-orbitron">
                                        {selectedOpponent.opponentType === 'boss' ? 'Omni-Cannon' : 'Plasma Repeater'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 uppercase">Armor Composition</div>
                                    <div className="text-lg text-white font-orbitron">
                                        {selectedOpponent.tier === 'intermediate' ? 'Composite' : 'Standard Plating'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 uppercase">Speed Rating</div>
                                    <div className="text-lg text-white font-orbitron">{currentStats.spd}/100</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 uppercase">Weakness</div>
                                    <div className="text-lg text-white font-orbitron">
                                        {selectedOpponent.opponentType === 'boss' ? 'Cooling Vents' : 'Rear Armor'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-auto flex justify-end gap-4 border-t border-[var(--color-border)] pt-6">
                    <CyberButton onClick={() => navigateTo('main-menu')} variant="secondary">
                        Abort
                    </CyberButton>
                    <CyberButton onClick={handleStartDuel} variant="primary" size="lg" icon={<span>⚔</span>}>
                        Initialize Duel
                    </CyberButton>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DuelSelectionScreen;
