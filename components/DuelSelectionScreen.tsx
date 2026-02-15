
import React, { useState, useEffect, useRef } from 'react';
import { Screen, GameConfig, DuelConfig, Tank, Boss } from '../types';
import TankIcon from './game/TankIcon';
import CyberButton from './common/CyberButton';
import { drawTank, drawBoss, drawGrid } from './game/canvasRenderer';

interface DuelSelectionScreenProps {
  navigateTo: (screen: Screen) => void;
  setGameConfig: (config: GameConfig) => void;
}

const opponents: DuelConfig[] = [
  { 
    opponentId: 'rogue-scout', 
    opponentType: 'tank', 
    tier: 'basic',
    chassis: 'rogue-scout',
    opponentName: 'Rogue Scout',
  },
  { 
    opponentId: 'iron-bastion', 
    opponentType: 'tank', 
    tier: 'intermediate',
    chassis: 'iron-bastion',
    opponentName: 'Iron Bastion',
  },
  { 
    opponentId: 'goliath-prime', 
    opponentType: 'boss', 
    bossType: 'goliath',
    chassis: 'goliath-prime',
    opponentName: 'Goliath Prime',
  }
];

const DuelSelectionScreen: React.FC<DuelSelectionScreenProps> = ({ navigateTo, setGameConfig }) => {
  const [selectedOpponent, setSelectedOpponent] = useState<DuelConfig>(opponents[0]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Animation Loop for Preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let rotation = -90; // Start facing up
    
    // Create Dummy Entity for rendering
    const createPreviewEntity = (rot: number): Tank | Boss => {
        const baseProps = {
            id: 'preview',
            position: { x: 0, y: 0 }, // Will translate context
            velocity: { x: 0, y: 0 },
            angle: rot,
            turretAngle: rot + Math.sin(Date.now() * 0.002) * 20, // Idle scan
            status: 'active' as const,
            health: 100,
            maxHealth: 100,
            color: '#fff',
            spawnTime: 0
        };

        if (selectedOpponent.opponentType === 'boss') {
            return {
                ...baseProps,
                name: selectedOpponent.opponentName,
                bossType: selectedOpponent.bossType || 'goliath',
                size: { width: 110, height: 110 },
                color: '#ef4444',
                attackState: { currentAttack: 'none', phase: 'idle', phaseStartTime: 0 },
                hasUsedLastStand: false
            } as Boss;
        } else {
            return {
                ...baseProps,
                name: selectedOpponent.opponentName,
                type: 'enemy',
                tier: selectedOpponent.tier,
                chassis: selectedOpponent.chassis,
                size: { width: 40, height: 40 },
                color: selectedOpponent.tier === 'intermediate' ? '#f97316' : '#FF003C',
                score: 0, kills: 0, deaths: 0
            } as Tank;
        }
    };

    const render = () => {
        const now = Date.now();
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        // Draw Hangar Floor (Perspective Grid)
        ctx.save();
        ctx.translate(width/2, height/2 + 100);
        ctx.scale(1, 0.4); // Flatten Y for pseudo-3D floor
        
        // Floor Glow
        const gradient = ctx.createRadialGradient(0, 0, 50, 0, 0, 300);
        gradient.addColorStop(0, `rgba(${selectedOpponent.opponentType === 'boss' ? '239, 68, 68' : '0, 240, 255'}, 0.2)`);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, 300, 0, Math.PI*2);
        ctx.fill();
        
        // Floor Grid Lines
        ctx.strokeStyle = `rgba(${selectedOpponent.opponentType === 'boss' ? '239, 68, 68' : '0, 240, 255'}, 0.3)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for(let i=0; i<8; i++) {
            ctx.beginPath();
            ctx.arc(0, 0, i * 40, 0, Math.PI*2);
            ctx.stroke();
        }
        // Radial lines
        for(let i=0; i<12; i++) {
            const ang = (i / 12) * Math.PI * 2 + (now * 0.0005);
            ctx.beginPath();
            ctx.moveTo(0,0);
            ctx.lineTo(Math.cos(ang) * 300, Math.sin(ang) * 300);
            ctx.stroke();
        }
        ctx.restore();

        // Draw Entity
        ctx.save();
        ctx.translate(width / 2, height / 2);
        
        // Scale up
        const scale = selectedOpponent.opponentType === 'boss' ? 2.5 : 5.0;
        ctx.scale(scale, scale);
        
        // Float animation
        const floatY = Math.sin(now * 0.002) * 5;
        ctx.translate(0, floatY);

        rotation += 0.2; // Slow spin

        const entity = createPreviewEntity(rotation);

        if (selectedOpponent.opponentType === 'boss') {
            drawBoss(ctx, entity as Boss, now, false);
        } else {
            drawTank(ctx, entity as Tank, now, [], false);
        }

        ctx.restore();

        animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [selectedOpponent]);

  const handleStartDuel = () => {
    setGameConfig({ mode: 'duel', duelConfig: selectedOpponent });
    navigateTo('game');
  };

  const getStats = (opp: DuelConfig) => {
      if (opp.opponentType === 'boss') return { atk: 95, def: 90, spd: 20, diff: 'EXTREME', desc: 'Heavy Siege Dreadnought' };
      if (opp.tier === 'intermediate') return { atk: 70, def: 80, spd: 40, diff: 'HARD', desc: 'Armored Assault Unit' };
      return { atk: 40, def: 30, spd: 90, diff: 'NORMAL', desc: 'Reconnaissance Scout' };
  }

  const stats = getStats(selectedOpponent);
  const themeColor = selectedOpponent.opponentType === 'boss' ? 'text-red-500' : 
                     selectedOpponent.tier === 'intermediate' ? 'text-orange-500' : 'text-cyan-400';
  const themeBorder = selectedOpponent.opponentType === 'boss' ? 'border-red-500' : 
                      selectedOpponent.tier === 'intermediate' ? 'border-orange-500' : 'border-cyan-400';
  const themeBg = selectedOpponent.opponentType === 'boss' ? 'bg-red-500' : 
                  selectedOpponent.tier === 'intermediate' ? 'bg-orange-500' : 'bg-cyan-400';

  return (
    <div className="flex flex-col h-screen p-4 overflow-hidden bg-[var(--color-background)]">
       {/* Background */}
       <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
         <div className="grid-bg" />
         <div className="bg-tech-dots absolute inset-0 opacity-30" />
       </div>
       <div className="scanlines absolute inset-0 z-50 pointer-events-none opacity-20" />

      {/* Header - Compact */}
      <div className="relative z-10 flex flex-shrink-0 justify-between items-end mb-4 border-b border-[var(--color-border)] pb-2 animate-slide-up">
        <div>
            <h1 className="font-orbitron text-4xl font-black uppercase text-[var(--color-text-light)]">
            Sim <span className="text-[var(--color-primary-cyan)]">Duel</span>
            </h1>
            <p className="font-rajdhani text-[var(--color-text-dim)] tracking-widest text-xs mt-1">SELECT OPPONENT // INITIATE COMBAT</p>
        </div>
        <div className="hidden md:block text-right font-orbitron text-[10px] text-[var(--color-text-dim)] border-r-2 border-[var(--color-primary-cyan)] pr-4">
            SYSTEM_ID: DUEL_CORE_V1<br/>
            STATUS: WAITING_FOR_INPUT
        </div>
      </div>

      {/* Main Grid - Flexible Height */}
      <div className="relative z-10 flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 pb-2">
        
        {/* Left Column: Opponent List */}
        <div className="lg:col-span-4 flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
          {opponents.map((opponent, index) => {
            const isSelected = selectedOpponent.opponentId === opponent.opponentId;
            const isBoss = opponent.opponentType === 'boss';
            
            return (
              <button
                key={opponent.opponentId}
                onClick={() => setSelectedOpponent(opponent)}
                className={`group relative flex items-center p-3 border transition-all duration-300 overflow-hidden clip-corner-4 text-left animate-slide-up flex-shrink-0
                  ${isSelected 
                    ? `bg-white/5 ${isBoss ? 'border-red-500 shadow-[inset_0_0_20px_rgba(239,68,68,0.2)]' : 'border-cyan-400 shadow-[inset_0_0_20px_rgba(6,182,212,0.2)]'}` 
                    : 'bg-black/60 border-stone-800 hover:border-stone-600'
                  }
                `}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Selection Marker */}
                {isSelected && (
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${isBoss ? 'bg-red-500' : 'bg-cyan-400'}`} />
                )}
                
                <div className="flex-shrink-0 mr-3">
                    <div className={`w-10 h-10 flex items-center justify-center border bg-black/50 ${isSelected ? (isBoss ? 'border-red-500' : 'border-cyan-400') : 'border-stone-700'}`}>
                       <TankIcon 
                          type={isBoss ? 'boss' : 'enemy'} 
                          tier={opponent.tier}
                          bossType={opponent.bossType}
                          chassis={opponent.chassis}
                          color={isBoss ? '#ef4444' : opponent.tier === 'intermediate' ? '#f97316' : '#FF003C'} 
                          className="w-6 h-6" 
                       />
                    </div>
                </div>

                <div>
                    <h3 className={`font-orbitron text-base font-bold uppercase tracking-wider ${isSelected ? 'text-white' : 'text-stone-500 group-hover:text-stone-300'}`}>
                    {opponent.opponentName}
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className={`px-1 py-0.5 text-[8px] font-bold font-mono uppercase border ${isBoss ? 'border-red-500 text-red-500' : 'border-stone-600 text-stone-500'}`}>
                            {isBoss ? 'DREADNOUGHT' : `TIER ${opponent.tier === 'intermediate' ? '2' : '1'}`}
                        </span>
                    </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Visualizer & Details */}
        <div className="lg:col-span-8 flex flex-col h-full animate-slide-up delay-200 min-h-0">
            {/* The "Hangar" Viewport */}
            <div className={`relative flex-1 bg-black/80 border-2 ${themeBorder} clip-corner-2 overflow-hidden flex flex-col min-h-0`}>
                
                {/* Decorative UI Overlay */}
                <div className="absolute top-4 left-4 z-20 pointer-events-none">
                     <div className={`text-4xl font-black font-orbitron uppercase tracking-tighter opacity-80 ${themeColor}`}>
                         {selectedOpponent.opponentName}
                     </div>
                     <div className="text-xs font-rajdhani text-stone-400 tracking-[0.3em] uppercase mt-1">
                         {stats.desc}
                     </div>
                </div>

                <div className="absolute top-4 right-4 z-20 text-right pointer-events-none">
                    <div className={`text-xl font-bold font-orbitron ${themeColor}`}>
                        THREAT: {stats.diff}
                    </div>
                    <div className="flex items-center justify-end gap-1 mt-1">
                        {Array.from({length: 5}).map((_, i) => {
                             // Calc threat level 1-5
                             const level = stats.diff === 'EXTREME' ? 5 : stats.diff === 'HARD' ? 3 : 1;
                             return (
                                 <div key={i} className={`w-1.5 h-3 transform -skew-x-12 ${i < level ? themeBg : 'bg-stone-800'}`} />
                             )
                        })}
                    </div>
                </div>

                {/* Canvas Container */}
                <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden bg-black/20">
                    <canvas 
                        ref={canvasRef} 
                        width={800} 
                        height={500}
                        className="w-full h-full object-contain relative z-10"
                    />
                    
                    {/* Background Grid Accent */}
                    <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent_70%)] pointer-events-none" />
                </div>
                
                {/* Bottom Stats Panel - Compact */}
                <div className="relative z-20 bg-black/90 border-t border-white/10 p-4 grid grid-cols-3 gap-4 backdrop-blur-md flex-shrink-0">
                    <StatBar label="FIREPOWER" value={stats.atk} color={themeBg} />
                    <StatBar label="ARMOR" value={stats.def} color={themeBg} />
                    <StatBar label="SPEED" value={stats.spd} color={themeBg} />
                </div>
            </div>

            {/* Actions - Compact */}
            <div className="mt-3 flex justify-end gap-3 flex-shrink-0">
                <CyberButton onClick={() => navigateTo('main-menu')} variant="secondary" size="sm">
                    Return to Hub
                </CyberButton>
                <CyberButton onClick={handleStartDuel} variant="primary" size="md" icon={<span>⚔</span>} className={selectedOpponent.opponentType === 'boss' ? '!border-red-500 !text-red-500 hover:!bg-red-500 hover:!text-white' : ''}>
                    INITIALIZE
                </CyberButton>
            </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
      `}</style>
    </div>
  );
};

const StatBar = ({ label, value, color }: { label: string, value: number, color: string }) => (
    <div className="flex flex-col gap-1">
        <div className="flex justify-between items-end">
            <span className="text-[10px] font-bold font-orbitron text-stone-500 tracking-widest">{label}</span>
            <span className="text-sm font-bold font-orbitron text-white leading-none">{value}%</span>
        </div>
        <div className="h-1.5 w-full bg-stone-900 skew-x-[-12deg] overflow-hidden">
            <div 
                className={`h-full ${color} transition-all duration-1000 ease-out`} 
                style={{ width: `${value}%`, boxShadow: '0 0 10px currentColor' }} 
            />
        </div>
    </div>
);

export default DuelSelectionScreen;
