import React, { useState, useEffect, useRef } from 'react';
import { Screen, GameConfig, SandboxConfig, Tank, Boss } from '../types';
// removed TankIcon import (we now draw previews directly)
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
  stats: { hp: number; speed: number; size: number };
  color: string;
}

const characters: CharacterOption[] = [
  {
    id: 'vector-01',
    name: 'Vector-01',
    description: 'Standard issue hover-tank. Balanced performance.',
    type: 'tank',
    tier: 'basic',
    stats: { hp: 10, speed: 3.5, size: 40 },
    color: '#06b6d4'
  },
  {
    id: 'rogue-scout',
    name: 'Rogue Scout',
    description: 'High mobility, low durability. Hit and run tactics.',
    type: 'tank',
    tier: 'basic',
    stats: { hp: 5, speed: 5.0, size: 30 },
    color: '#22c55e'
  },
  {
    id: 'iron-bastion',
    name: 'Iron Bastion',
    description: 'Heavy armor plating. Slower movement.',
    type: 'tank',
    tier: 'intermediate',
    stats: { hp: 25, speed: 2.0, size: 50 },
    color: '#f97316'
  },
  {
    id: 'goliath-prime',
    name: 'Goliath Prime',
    description: 'COMMANDER CLASS. Massive durability. Access to Boss Moveset.',
    type: 'boss',
    bossType: 'goliath',
    stats: { hp: 200, speed: 1.5, size: 100 },
    color: '#ef4444'
  },
  {
    id: 'phantom-weaver',
    name: 'Phantom Weaver',
    description: 'Stealth specialist. Can phase shift to avoid damage.',
    type: 'tank',
    tier: 'intermediate',
    stats: { hp: 8, speed: 4.5, size: 35 },
    color: '#a855f7'
  },
  {
    id: 'titan-ogre',
    name: 'Titan Ogre',
    description: 'Super-heavy assault platform. Massive firepower.',
    type: 'tank',
    tier: 'intermediate',
    stats: { hp: 40, speed: 1.5, size: 60 },
    color: '#ea580c'
  },
  {
    id: 'volt-strider',
    name: 'Volt Strider',
    description: 'Electric warfare unit. Chain lightning attacks.',
    type: 'tank',
    tier: 'intermediate',
    stats: { hp: 12, speed: 4.0, size: 38 },
    color: '#eab308'
  },
  {
    id: 'inferno-cobra',
    name: 'Inferno Cobra',
    description: 'Flame-thrower equipped. Area denial specialist.',
    type: 'tank',
    tier: 'intermediate',
    stats: { hp: 15, speed: 3.8, size: 42 },
    color: '#ef4444'
  },
  {
    id: 'crystal-vanguard',
    name: 'Crystal Vanguard',
    description: 'Beam weaponry and refractive shielding.',
    type: 'tank',
    tier: 'intermediate',
    stats: { hp: 20, speed: 3.0, size: 45 },
    color: '#06b6d4'
  }
];

/* -------------------------
   CompactPreview
   Replaces TankIcon for the list buttons.
   Draws either a tank or boss scaled to fit the square parent.
   Uses ResizeObserver + DPR and padding so nothing is clipped.
   ------------------------- */
const CompactPreview: React.FC<{ character: CharacterOption; className?: string }> = ({ character, className }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = (rect: DOMRect) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      // use the smaller dimension so preview is always square inside parent
      const cssSize = Math.max(28, Math.floor(Math.min(rect.width, rect.height)));
      // maintain a little padding inside container to avoid clipping (10%)
      const padding = Math.max(2, Math.floor(cssSize * 0.1));
      const drawSize = cssSize - padding * 2;

      canvas.style.width = `${cssSize}px`;
      canvas.style.height = `${cssSize}px`;
      canvas.width = Math.floor(cssSize * dpr);
      canvas.height = Math.floor(cssSize * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssSize, cssSize);

      ctx.save();
      // center on the canvas
      ctx.translate(cssSize / 2, cssSize / 2);

      // canonical entity draw size (choose 40 as base for tanks, bosses bigger)
      const canonical = character.type === 'boss' ? character.stats.size : 40;
      // scale so canonical fits inside drawSize, leave some padding
      const scale = (drawSize / canonical) * 0.9;
      ctx.scale(scale, scale);

      const now = Date.now();
      if (character.type === 'boss') {
        // draw a boss with size equal to character.stats.size
        const boss: Boss = {
          id: `preview-${character.id}`,
          name: character.name,
          bossType: character.bossType || 'goliath',
          position: { x: 0, y: 0 },
          velocity: { x: 0, y: 0 },
          angle: -90,
          turretAngle: -90,
          size: { width: character.stats.size, height: character.stats.size },
          health: character.stats.hp,
          maxHealth: character.stats.hp,
          color: character.color,
          status: 'active',
          attackState: { currentAttack: 'none', phase: 'idle', phaseStartTime: now }
        };
        // Draw static (no heavy animation) so list stays snappy
        drawBoss(ctx, boss, now, false);
      } else {
        const tank: Tank = {
          id: `preview-${character.id}`,
          name: character.name,
          type: 'player',
          status: 'active',
          chassis: character.id as any,
          position: { x: 0, y: 0 },
          velocity: { x: 0, y: 0 },
          angle: -90,
          turretAngle: -90,
          size: { width: character.stats.size, height: character.stats.size },
          health: character.stats.hp,
          maxHealth: character.stats.hp,
          color: character.color,
          score: 0,
          kills: 0,
          deaths: 0
        };
        drawTank(ctx, tank, now, [], false);
      }

      ctx.restore();
    };

    // initial draw using the parent's bounding rect
    draw(parent.getBoundingClientRect());

    // Watch for parent resize
    const ro = new ResizeObserver((entries) => {
      for (const ent of entries) {
        const r = ent.contentRect;
        draw(new DOMRect(r.x, r.y, r.width, r.height));
      }
    });
    ro.observe(parent);
    roRef.current = ro;

    return () => {
      if (roRef.current) {
        roRef.current.disconnect();
        roRef.current = null;
      }
    };
  }, [character]);

  return <canvas ref={canvasRef} className={className ?? 'block w-full h-full'} />;
};

/* -------------------------
   SandboxSelectionScreen
   (main screen; uses CompactPreview in the list)
   ------------------------- */
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

    // DPR-aware resize for the big preview canvas
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = parent.getBoundingClientRect();
      const w = Math.max(400, Math.floor(rect.width));
      const h = Math.max(260, Math.floor(rect.height));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const render = () => {
      const now = Date.now();
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Grid Floor
      ctx.save();
      // use CSS pixels to compute transforms (canvas is scaled by DPR)
      const cssW = parseFloat(canvas.style.width) || (width / (window.devicePixelRatio || 1));
      const cssH = parseFloat(canvas.style.height) || (height / (window.devicePixelRatio || 1));
      ctx.translate(cssW / 2, cssH / 2 + 120);
      ctx.scale(1, 0.4);

      const gradient = ctx.createRadialGradient(0, 0, 50, 0, 0, 300);
      gradient.addColorStop(0, `${selectedChar.type === 'boss' ? 'rgba(239,68,68,0.18)' : 'rgba(0,240,255,0.12)'}`);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, 300, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = selectedChar.type === 'boss' ? 'rgba(239,68,68,0.28)' : 'rgba(0,240,255,0.24)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, i * 50, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // Entity
      ctx.save();
      ctx.translate(width / 2, height / 2);
      // choose scale so big preview properly fills area (boss bigger)
      const scale = selectedChar.type === 'boss' ? 2.0 : 4.5;
      ctx.scale(scale, scale);

      const floatY = Math.sin(now * 0.002) * 6;
      ctx.translate(0, floatY);
      rotation += 0.3;

      if (selectedChar.type === 'boss') {
        const boss: Boss = {
          id: 'preview',
          name: selectedChar.name,
          bossType: selectedChar.bossType || 'goliath',
          position: { x: 0, y: 0 },
          velocity: { x: 0, y: 0 },
          angle: rotation,
          turretAngle: rotation,
          size: { width: selectedChar.stats.size, height: selectedChar.stats.size },
          health: selectedChar.stats.hp,
          maxHealth: selectedChar.stats.hp,
          color: selectedChar.color,
          status: 'active',
          attackState: { currentAttack: 'none', phase: 'idle', phaseStartTime: now }
        };
        drawBoss(ctx, boss, now, false);
      } else {
        // ensure tanks with different sizes display correctly by using stats.size
        const tank: Tank = {
          id: 'preview',
          name: selectedChar.name,
          type: 'player',
          chassis: selectedChar.id as any,
          position: { x: 0, y: 0 },
          velocity: { x: 0, y: 0 },
          angle: rotation,
          turretAngle: rotation,
          size: { width: selectedChar.stats.size, height: selectedChar.stats.size },
          health: selectedChar.stats.hp,
          maxHealth: selectedChar.stats.hp,
          color: selectedChar.color,
          score: 0,
          kills: 0,
          deaths: 0,
          status: 'active'
        };
        drawTank(ctx, tank, now, [], false);
      }

      ctx.restore();
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
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
                  <div className={`w-10 h-10 flex items-center justify-center border bg-black/50 rounded-md overflow-hidden p-1 ${isSelected ? (isBoss ? 'border-red-500' : 'border-cyan-400') : 'border-stone-700'}`}>
                    {/* use CompactPreview here so every class draws correctly and isn't clipped */}
                    <CompactPreview character={char} className="w-full h-full block" />
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

const StatBar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => (
  <div className="flex flex-col gap-1">
    <div className="flex justify-between items-end">
      <span className="text-[10px] font-bold font-orbitron text-stone-500 tracking-widest">{label}</span>
      <span className="text-sm font-bold font-orbitron text-white leading-none">{value}</span>
    </div>
    <div className="h-1.5 w-full bg-stone-900 skew-x-[-12deg] overflow-hidden">
      <div className={`${color} transition-all duration-1000 ease-out`} style={{ width: `${(value / max) * 100}%`, boxShadow: '0 0 10px currentColor' }} />
    </div>
  </div>
);

export default SandboxSelectionScreen;