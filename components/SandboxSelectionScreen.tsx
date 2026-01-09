
import React, { useState, useEffect, useRef } from 'react';
import { Screen, GameConfig, SandboxConfig, Tank, Boss } from '../types';
import TankIcon from './game/TankIcon';
import CyberButton from './common/CyberButton';
import { drawTank, drawBoss } from './game/canvasRenderer';

interface SandboxSelectionScreenProps {
  navigateTo: (screen: Screen) => void;
  setGameConfig: (config: GameConfig) => void;
}

interface CharacterOption {
    id: SandboxConfig['characterId'];
    name: string;
    description: string;
    type: 'tank' | 'boss';
    bossType?: 'goliath' | 'viper' | 'sentinel';
    tier?: 'basic' | 'intermediate';
    stats: { hp: number, speed: number, size: number };
}

const characters: CharacterOption[] = [
    {
        id: 'vector-01',
        name: 'Vector-01',
        description: 'Standard issue hover-tank. Balanced performance.',
        type: 'tank',
        tier: 'basic',
        stats: { hp: 10, speed: 3.5, size: 40 }
    },
    {
        id: 'rogue-scout',
        name: 'Rogue Scout',
        description: 'High mobility, low durability. Hit and run tactics.',
        type: 'tank',
        tier: 'basic',
        stats: { hp: 5, speed: 5.0, size: 30 }
    },
    {
        id: 'iron-bastion',
        name: 'Iron Bastion',
        description: 'Heavy armor plating. Slower movement.',
        type: 'tank',
        tier: 'intermediate',
        stats: { hp: 25, speed: 2.0, size: 50 }
    },
    {
        id: 'goliath-prime',
        name: 'Goliath Prime',
        description: 'COMMANDER CLASS. Massive durability. Access to Boss Moveset.',
        type: 'boss',
        bossType: 'goliath',
        stats: { hp: 200, speed: 1.5, size: 100 }
    }
];

const SandboxSelectionScreen: React.FC<SandboxSelectionScreenProps> = ({ navigateTo, setGameConfig }) => {
  const [selectedChar, setSelectedChar] = useState<CharacterOption>(characters[0]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let rotation = -90;

    const render = () => {
        const now = Date.now();
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        // Grid Floor
        ctx.save();
        ctx.translate(width/2, height/2 + 100);
        ctx.scale(1, 0.4);
        
        const gradient = ctx.createRadialGradient(0, 0, 50, 0, 0, 300);
        gradient.addColorStop(0, `rgba(${selectedChar.type === 'boss' ? '239, 68, 68' : '0, 240, 255'}, 0.2)`);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath(); ctx.arc(0, 0, 300, 0, Math.PI*2); ctx.fill();
        
        ctx.strokeStyle = `rgba(${selectedChar.type === 'boss' ? '239, 68, 68' : '0, 240, 255'}, 0.3)`;
        ctx.lineWidth = 2;
        for(let i=0; i<6; i++) {
            ctx.beginPath(); ctx.arc(0, 0, i * 50, 0, Math.PI*2); ctx.stroke();
        }
        ctx.restore();

        // Entity
        ctx.save();
        ctx.translate(width / 2, height / 2);
        
        const scale = selectedChar.type === 'boss' ? 2.5 : 5.0;
        ctx.scale(scale, scale);
        
        const floatY = Math.sin(now * 0.002) * 5;
        ctx.translate(0, floatY);
        rotation += 0.2;

        if (selectedChar.type === 'boss') {
            const boss: Boss = {
                id: 'preview', name: selectedChar.name, bossType: selectedChar.bossType!,
                position: {x:0, y:0}, velocity: {x:0,y:0}, angle: rotation, turretAngle: rotation,
                size: { width: 110, height: 110 }, health: 100, maxHealth: 100, color: '#ef4444',
                status: 'active', attackState: { currentAttack: 'none', phase: 'idle', phaseStartTime: 0 }
            };
            drawBoss(ctx, boss, now, false);
        } else {
            const tank: Tank = {
                id: 'preview', name: selectedChar.name, type: 'player',
                position: {x:0, y:0}, velocity: {x:0,y:0}, angle: rotation, turretAngle: rotation,
                size: { width: 40, height: 40 }, health: 100, maxHealth: 100,
                color: selectedChar.tier === 'intermediate' ? '#f97316' : (selectedChar.id === 'rogue-scout' ? '#00F0FF' : '#00F0FF'),
                tier: selectedChar.tier, score: 0, kills: 0, deaths: 0, status: 'active'
            };
            drawTank(ctx, tank, now, [], false);
        }
        ctx.restore();
        animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [selectedChar]);

  const handleLaunch = () => {
    setGameConfig({ 
        mode: 'sandbox', 
        sandboxConfig: { characterId: selectedChar.id } 
    });
    navigateTo('game');
  };

  const themeColor = selectedChar.type === 'boss' ? 'text-red-500' : 'text-cyan-400';
  const themeBorder = selectedChar.type === 'boss' ? 'border-red-500' : 'border-cyan-400';

  return (
    <div className="flex flex-col h-screen p-4 overflow-hidden bg-[var(--color-background)]">
       {/* Background */}
       <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
         <div className="grid-bg" />
         <div className="bg-tech-dots absolute inset-0 opacity-30" />
       </div>

      <div className="relative z-10 flex flex-shrink-0 justify-between items-end mb-4 border-b border-[var(--color-border)] pb-2 animate-slide-up">
        <div>
            <h1 className="font-orbitron text-4xl font-black uppercase text-[var(--color-text-light)]">
            SANDBOX <span className="text-yellow-400">PROTOTYPE</span>
            </h1>
            <p className="font-rajdhani text-[var(--color-text-dim)] tracking-widest text-xs mt-1">SELECT CHASSIS // FREE ROAM</p>
        </div>
      </div>

      <div className="relative z-10 flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 pb-2">
        {/* List */}
        <div className="lg:col-span-4 flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
          {characters.map((char, index) => {
            const isSelected = selectedChar.id === char.id;
            const isBoss = char.type === 'boss';
            
            return (
              <button
                key={char.id}
                onClick={() => setSelectedChar(char)}
                className={`group relative flex items-center p-3 border transition-all duration-300 overflow-hidden clip-corner-4 text-left animate-slide-up flex-shrink-0
                  ${isSelected 
                    ? `bg-white/5 ${isBoss ? 'border-red-500 shadow-[inset_0_0_20px_rgba(239,68,68,0.2)]' : 'border-cyan-400 shadow-[inset_0_0_20px_rgba(6,182,212,0.2)]'}` 
                    : 'bg-black/60 border-stone-800 hover:border-stone-600'
                  }
                `}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {isSelected && (
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${isBoss ? 'bg-red-500' : 'bg-cyan-400'}`} />
                )}
                
                <div className="flex-shrink-0 mr-3">
                    <div className={`w-10 h-10 flex items-center justify-center border bg-black/50 ${isSelected ? (isBoss ? 'border-red-500' : 'border-cyan-400') : 'border-stone-700'}`}>
                       <TankIcon 
                          type={isBoss ? 'boss' : 'player'} 
                          tier={char.tier}
                          bossType={char.bossType}
                          color={isBoss ? '#ef4444' : char.tier === 'intermediate' ? '#f97316' : '#00F0FF'} 
                          className="w-6 h-6" 
                       />
                    </div>
                </div>

                <div>
                    <h3 className={`font-orbitron text-base font-bold uppercase tracking-wider ${isSelected ? 'text-white' : 'text-stone-500 group-hover:text-stone-300'}`}>
                    {char.name}
                    </h3>
                    <div className="text-[10px] text-stone-500">{char.description}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Preview */}
        <div className="lg:col-span-8 flex flex-col h-full animate-slide-up delay-200 min-h-0">
            <div className={`relative flex-1 bg-black/80 border-2 ${themeBorder} clip-corner-2 overflow-hidden flex flex-col min-h-0`}>
                <div className="absolute top-4 left-4 z-20 pointer-events-none">
                     <div className={`text-4xl font-black font-orbitron uppercase tracking-tighter opacity-80 ${themeColor}`}>
                         {selectedChar.name}
                     </div>
                </div>

                <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden bg-black/20">
                    <canvas ref={canvasRef} width={800} height={500} className="w-full h-full object-contain relative z-10" />
                </div>
                
                <div className="relative z-20 bg-black/90 border-t border-white/10 p-4 grid grid-cols-3 gap-4 backdrop-blur-md flex-shrink-0">
                    <StatBar label="HEALTH" value={selectedChar.stats.hp} max={200} color={selectedChar.type === 'boss' ? 'bg-red-500' : 'bg-cyan-400'} />
                    <StatBar label="SPEED" value={selectedChar.stats.speed} max={6} color={selectedChar.type === 'boss' ? 'bg-red-500' : 'bg-cyan-400'} />
                    <StatBar label="MASS" value={selectedChar.stats.size} max={100} color={selectedChar.type === 'boss' ? 'bg-red-500' : 'bg-cyan-400'} />
                </div>
            </div>

            <div className="mt-3 flex justify-end gap-3 flex-shrink-0">
                <CyberButton onClick={() => navigateTo('main-menu')} variant="secondary" size="sm">Back</CyberButton>
                <CyberButton onClick={handleLaunch} variant="primary" size="md" icon={<span>🚀</span>} className={selectedChar.type === 'boss' ? '!border-red-500 !text-red-500 hover:!bg-red-500 hover:!text-white' : ''}>
                    INITIALIZE SANDBOX
                </CyberButton>
            </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
      `}</style>
    </div>
  );
};

const StatBar = ({ label, value, max, color }: { label: string, value: number, max: number, color: string }) => (
    <div className="flex flex-col gap-1">
        <div className="flex justify-between items-end">
            <span className="text-[10px] font-bold font-orbitron text-stone-500 tracking-widest">{label}</span>
            <span className="text-sm font-bold font-orbitron text-white leading-none">{value}</span>
        </div>
        <div className="h-1.5 w-full bg-stone-900 skew-x-[-12deg] overflow-hidden">
            <div className={`h-full ${color} transition-all duration-1000 ease-out`} style={{ width: `${(value/max)*100}%`, boxShadow: '0 0 10px currentColor' }} />
        </div>
    </div>
);

export default SandboxSelectionScreen;
