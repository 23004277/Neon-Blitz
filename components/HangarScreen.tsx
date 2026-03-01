import React, { useState, useEffect, useRef, useCallback, KeyboardEvent } from 'react';
import { Screen, ChassisType, Tank } from '../types';
import CyberButton from './common/CyberButton';
import { useAudio } from '../contexts/AudioContext';
import { useSettings } from '../contexts/SettingsContext';
import { drawTank } from './game/canvasRenderer';

interface HangarScreenProps {
  navigateTo: (screen: Screen) => void;
  // Added this prop to control external UI elements
  setChatbotVisible: (visible: boolean) => void;
}

interface ChassisInfo {
  id: ChassisType;
  name: string;
  cost: number;
  description: string;
  stats: {
    armor: number;
    speed: number;
    firepower: number;
  };
}

const CHASSIS_DATA: ChassisInfo[] = [
  { id: 'vector-01', name: 'VECTOR-01', cost: 0, description: 'Standard issue hover tank. Balanced across all metrics.', stats: { armor: 5, speed: 5, firepower: 5 } },
  { id: 'rogue-scout', name: 'ROGUE SCOUT', cost: 500, description: 'Lightweight chassis optimized for speed and evasion.', stats: { armor: 3, speed: 9, firepower: 4 } },
  { id: 'iron-bastion', name: 'IRON BASTION', cost: 1000, description: 'Heavy armor plating. Slow but incredibly durable.', stats: { armor: 9, speed: 2, firepower: 6 } },
  { id: 'phantom-weaver', name: 'PHANTOM WEAVER', cost: 1500, description: 'Experimental stealth tech. High burst damage potential.', stats: { armor: 4, speed: 7, firepower: 8 } },
  { id: 'titan-ogre', name: 'TITAN OGRE', cost: 2000, description: 'Massive siege platform with regenerative capabilities.', stats: { armor: 8, speed: 3, firepower: 7 } },
  { id: 'volt-strider', name: 'VOLT STRIDER', cost: 2500, description: 'Harnesses electrical energy for rapid, chaining attacks.', stats: { armor: 5, speed: 8, firepower: 6 } },
  { id: 'inferno-cobra', name: 'INFERNO COBRA', cost: 3000, description: 'Specializes in incendiary area-of-effect damage.', stats: { armor: 6, speed: 6, firepower: 9 } },
  { id: 'crystal-vanguard', name: 'CRYSTAL VANGUARD', cost: 4000, description: 'Advanced crystalline armor refracts incoming fire.', stats: { armor: 7, speed: 5, firepower: 8 } },
  { id: 'goliath-prime', name: 'GOLIATH PRIME', cost: 10000, description: 'The ultimate weapon. Devastating power and resilience.', stats: { armor: 10, speed: 4, firepower: 10 } }
];

const PREVIEW_CANONICAL_SIZES: Record<ChassisType, number> = {
  'vector-01': 28,
  'rogue-scout': 24,
  'iron-bastion': 44,
  'phantom-weaver': 30,
  'titan-ogre': 60,
  'volt-strider': 34,
  'inferno-cobra': 38,
  'crystal-vanguard': 42,
  'goliath-prime': 100,
  'goliath-prime-overdrive': 100
};

/* ---------------------------
   SmallTankPreview
   --------------------------- */
const SmallTankPreview: React.FC<{ chassis: ChassisType; color: string; className?: string }> = ({ chassis, color, className }) => {
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
      // smaller max for list icons
      const maxIcon = 20; // reduced from 24
      const cssSize = Math.max(12, Math.min(maxIcon, Math.floor(Math.min(rect.width, rect.height))));
      const padding = Math.max(2, Math.floor(cssSize * 0.12));
      const drawSize = cssSize - padding * 2;

      canvas.style.width = `${cssSize}px`;
      canvas.style.height = `${cssSize}px`;
      canvas.width = Math.floor(cssSize * dpr);
      canvas.height = Math.floor(cssSize * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssSize, cssSize);

      ctx.save();
      ctx.translate(cssSize / 2, cssSize / 2);
      const canonical = PREVIEW_CANONICAL_SIZES[chassis] || 28;
      // slightly smaller icon scale
      const scale = (drawSize / canonical) * 0.55; // reduced from 0.7
      ctx.scale(scale, scale);

      const now = Date.now();
      const tank: Tank = {
        id: `preview-${chassis}`,
        name: 'PREV',
        type: 'player',
        status: 'active',
        chassis,
        position: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        angle: -90,
        turretAngle: -90,
        size: { width: canonical, height: canonical },
        health: 10,
        maxHealth: 10,
        color,
        score: 0,
        kills: 0,
        deaths: 0
      };

      drawTank(ctx, tank, now, [], false);
      ctx.restore();
    };

    draw(parent.getBoundingClientRect());
    const ro = new ResizeObserver(entries => {
      for (const ent of entries) draw(ent.contentRect as unknown as DOMRect);
    });
    ro.observe(parent);
    roRef.current = ro;

    return () => {
      if (roRef.current) {
        roRef.current.disconnect();
        roRef.current = null;
      }
    };
  }, [chassis, color]);

  return <canvas ref={canvasRef} className={className ?? 'block w-full h-full'} aria-hidden />;
};

/* ---------------------------
   StatBar component
   --------------------------- */
const StatBar: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="mb-4">
    <div className="flex justify-between items-center text-[10px] font-mono text-cyan-500/80 mb-1.5 tracking-widest">
      <span>{label}</span>
      <span className="text-cyan-300 font-bold">{value}/10</span>
    </div>
    <div className="flex gap-1 h-2">
      {[...Array(10)].map((_, i) => (
        <div 
          key={i}
          className={`flex-1 rounded-sm transition-all duration-300 ${
            i < value 
              ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]' 
              : 'bg-cyan-950/40 border border-cyan-900/30'
          }`}
        />
      ))}
    </div>
  </div>
);

/* ---------------------------
   HangarScreen
   --------------------------- */
const HangarScreen: React.FC<HangarScreenProps> = ({ navigateTo, setChatbotVisible }) => {
  const { settings, setSettings } = useSettings();
  const audio = useAudio();

  const initial = CHASSIS_DATA.find(c => c.id === settings.equippedChassis) || CHASSIS_DATA[0];
  const [selectedChassis, setSelectedChassis] = useState<ChassisInfo>(initial);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // --- CHATBOT VISIBILITY LOGIC ---
  useEffect(() => {
    // Hide chatbot on mount
    setChatbotVisible(false);
    
    // Show chatbot again when leaving the Hangar
    return () => {
      setChatbotVisible(true);
    };
  }, [setChatbotVisible]);

  const isUnlocked = (id: ChassisType) => settings.unlockedChassis.includes(id);
  const isEquipped = (id: ChassisType) => settings.equippedChassis === id;
  const canAfford = selectedChassis ? settings.credits >= selectedChassis.cost : false;

  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-id="${selectedChassis.id}"]`);
    if (el && el instanceof HTMLElement) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedChassis]);

  const acquired = CHASSIS_DATA.filter(c => isUnlocked(c.id)).sort((a, b) => a.cost - b.cost);
  const locked = CHASSIS_DATA.filter(c => !isUnlocked(c.id)).sort((a, b) => a.cost - b.cost);

  const handlePurchaseOrEquip = () => {
    if (!isUnlocked(selectedChassis.id)) {
      if (canAfford) {
        audio.play('uiClick');
        setSettings(prev => ({
          ...prev,
          credits: prev.credits - selectedChassis.cost,
          unlockedChassis: [...prev.unlockedChassis, selectedChassis.id],
          equippedChassis: selectedChassis.id
        }));
      } else {
        audio.play('error');
      }
    } else if (!isEquipped(selectedChassis.id)) {
      audio.play('uiClick');
      setSettings(prev => ({ ...prev, equippedChassis: selectedChassis.id }));
    }
  };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    const all = [...acquired, ...locked];
    const currentIndex = all.findIndex(c => c.id === selectedChassis.id);
    if (e.deltaY > 0 && currentIndex < all.length - 1) {
      audio.play('uiHover');
      setSelectedChassis(all[currentIndex + 1]);
    } else if (e.deltaY < 0 && currentIndex > 0) {
      audio.play('uiHover');
      setSelectedChassis(all[currentIndex - 1]);
    }
  }, [selectedChassis, audio, acquired, locked]);

  const handleListKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    const all = [...acquired, ...locked];
    const idx = all.findIndex(c => c.id === selectedChassis.id);
    if (e.key === 'ArrowDown' || e.key === 's') {
      e.preventDefault();
      const next = all[Math.min(all.length - 1, idx + 1)];
      if (next) setSelectedChassis(next);
    } else if (e.key === 'ArrowUp' || e.key === 'w') {
      e.preventDefault();
      const prev = all[Math.max(0, idx - 1)];
      if (prev) setSelectedChassis(prev);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handlePurchaseOrEquip();
    }
  }, [selectedChassis, acquired, locked, settings.credits, setSettings, audio]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = parent.getBoundingClientRect();
      const w = Math.max(400, Math.floor(rect.width));
      const h = Math.max(280, Math.floor(rect.height));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    let mounted = true;
    const tank: Tank = {
      id: 'preview_tank',
      name: settings.playerName || 'PREVIEW',
      type: 'player',
      status: 'active',
      chassis: selectedChassis.id,
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      angle: -90,
      turretAngle: -90,
      size: { width: 40, height: 40 },
      health: 10,
      maxHealth: 10,
      color: settings.playerColor || '#00F0FF',
      secondaryColor: settings.playerSecondaryColor,
      colorStyle: settings.playerColorStyle,
      score: 0, kills: 0, deaths: 0
    };

    // tweak this to scale the live preview tanks: lower = smaller tanks
    const PREVIEW_SCALE = 4.0; // reduced from ~7.5
    const TARGET_BASE = 28;    // reduced from 40 - smaller base -> smaller result

    const loop = () => {
      if (!mounted) return;
      const now = performance.now();
      tank.color = settings.playerColor || tank.color;
      tank.secondaryColor = settings.playerSecondaryColor;
      tank.colorStyle = settings.playerColorStyle;
      tank.chassis = selectedChassis.id;
      tank.angle = -90 + Math.sin(now * 0.0006) * 6;
      tank.turretAngle = -90 + Math.sin(now * 0.0013) * 40;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      const displayW = parseFloat(canvas.style.width) || 600;
      const displayH = parseFloat(canvas.style.height) || 360;
      ctx.translate(displayW / 2, displayH / 2);

      const canonical = PREVIEW_CANONICAL_SIZES[selectedChassis.id] || 40;
      const dynamicScale = TARGET_BASE / canonical;
      const finalScale = dynamicScale * PREVIEW_SCALE;

      ctx.scale(finalScale, finalScale);

      drawTank(ctx, tank, Date.now(), [], false);
      ctx.restore();
      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);
    return () => {
      mounted = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [selectedChassis, settings.playerColor]);

  return (
    <div className="min-h-screen w-full bg-[#020406] text-white font-rajdhani p-8 relative flex flex-col overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-10" style={{
        backgroundImage: 'linear-gradient(rgba(6,182,212,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.1) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.05)_0%,transparent_70%)]" />

      <header className="relative z-10 flex items-center justify-between gap-6 mb-10 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-1 h-12 bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.8)]" />
          <div>
            <h1 className="text-4xl font-orbitron font-black tracking-tighter italic">HANGAR <span className="text-cyan-500">BAY</span></h1>
            <div className="text-cyan-500/60 text-[10px] uppercase font-mono tracking-[0.3em] mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
              System Status: Online / Loadout Mode
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="absolute -inset-1 bg-cyan-500/20 blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
            <div className="relative px-6 py-3 bg-[#070b0e] border border-cyan-800/50 rounded flex flex-col items-end">
              <span className="text-[9px] font-mono text-cyan-500/70 tracking-widest uppercase">Available Credits</span>
              <span className="font-orbitron text-2xl text-cyan-300">◈ {settings.credits.toLocaleString()}</span>
            </div>
          </div>
          <CyberButton onClick={() => navigateTo('main-menu')} variant="secondary" className="px-8">
            DISCONNECT
          </CyberButton>
        </div>
      </header>

      <main className="relative z-10 grid grid-cols-12 gap-8 flex-1 min-h-0">
        <aside className="col-span-12 lg:col-span-4 h-full max-h-[750px] flex flex-col">
          <div className="bg-[#070a0d]/80 border border-cyan-900/40 rounded-sm p-4 h-full flex flex-col backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rotate-45 translate-x-12 -translate-y-12" />
            <div className="flex items-center justify-between mb-6 border-b border-cyan-900/40 pb-3">
              <div className="text-xs font-mono text-cyan-500 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-cyan-500" />
                CHASSIS_DATABASE.manifest
              </div>
              <div className="text-[10px] text-cyan-900 font-mono italic">v2.0.4</div>
            </div>

            <div
              ref={listRef}
              tabIndex={0}
              onKeyDown={(e) => handleListKeyDown(e as unknown as KeyboardEvent<HTMLDivElement>)}
              onWheel={handleWheel}
              className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2 pb-4 outline-none"
            >
              {acquired.length > 0 && (
                <div>
                  <div className="text-[10px] text-cyan-500/50 font-mono uppercase tracking-widest mb-3 flex items-center gap-2">
                    <div className="h-px flex-1 bg-cyan-900/30" />
                    Acquired Units
                  </div>
                  <div className="space-y-2">
                    {acquired.map(chassis => (
                      <button
                        key={chassis.id}
                        data-id={chassis.id}
                        onClick={() => { audio.play('uiHover'); setSelectedChassis(chassis); }}
                        className={`w-full flex items-center gap-4 p-3 transition-all border text-left group relative ${
                          selectedChassis.id === chassis.id 
                            ? 'border-cyan-500 bg-cyan-500/10' 
                            : 'border-white/5 bg-white/[0.02] hover:border-cyan-700 hover:bg-white/[0.04]'
                        }`}
                      >
                        {selectedChassis.id === chassis.id && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500" />
                        )}
                        <div className="w-10 h-10 flex items-center justify-center bg-black/60 border border-cyan-900/30 shrink-0">
                          <SmallTankPreview chassis={chassis.id} color={settings.playerColor || '#00F0FF'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className={`font-orbitron text-xs tracking-wider ${selectedChassis.id === chassis.id ? 'text-white' : 'text-stone-400'}`}>
                              {chassis.name}
                            </div>
                            {isEquipped(chassis.id) && (
                              <span className="text-[8px] font-bold text-cyan-400 border border-cyan-400/50 px-1 py-0.5 uppercase tracking-tighter">Active</span>
                            )}
                          </div>
                          <div className="text-[9px] text-stone-500 truncate mt-1 font-mono uppercase tracking-tighter">{chassis.id}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {locked.length > 0 && (
                <div className="pt-4">
                  <div className="text-[10px] text-stone-600 font-mono uppercase tracking-widest mb-3 flex items-center gap-2">
                    <div className="h-px flex-1 bg-white/5" />
                    Locked Units
                  </div>
                  <div className="space-y-2">
                    {locked.map(chassis => (
                      <button
                        key={chassis.id}
                        data-id={chassis.id}
                        onClick={() => { audio.play('uiHover'); setSelectedChassis(chassis); }}
                        className={`w-full flex items-center gap-4 p-3 transition-all border text-left group grayscale hover:grayscale-0 opacity-60 hover:opacity-100 ${
                          selectedChassis.id === chassis.id 
                            ? 'border-cyan-700 bg-cyan-900/10' 
                            : 'border-transparent bg-white/[0.01]'
                        }`}
                      >
                        <div className="w-10 h-10 flex items-center justify-center bg-black/40 border border-white/5 shrink-0">
                          <SmallTankPreview chassis={chassis.id} color="#444" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="font-orbitron text-xs text-stone-400 uppercase tracking-wider">{chassis.name}</div>
                            <span className="text-[9px] text-cyan-600 font-mono">◈ {chassis.cost}</span>
                          </div>
                          <div className="text-[9px] text-stone-700 italic mt-1">Authorization required</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        <section className="col-span-12 lg:col-span-8 flex flex-col gap-8 h-full max-h-[750px]">
          <div className="flex-1 rounded-sm border border-cyan-900/40 bg-gradient-to-b from-[#071015] to-[#020406] p-4 relative overflow-hidden flex items-center group">
            <div className="absolute top-6 left-6 w-12 h-12 border-t-2 border-l-2 border-cyan-500/40" />
            <div className="absolute top-6 right-6 w-12 h-12 border-t-2 border-r-2 border-cyan-500/40" />
            <div className="absolute bottom-6 left-6 w-12 h-12 border-b-2 border-l-2 border-cyan-500/40" />
            <div className="absolute bottom-6 right-6 w-12 h-12 border-b-2 border-r-2 border-cyan-500/40" />
            
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(6,182,212,0.05)_50%)] bg-[length:100%_4px] animate-scan" />
            
            <div className="flex-1 flex items-center justify-center h-full relative z-10">
              <div className="w-full max-w-[800px] h-full max-h-[600px] flex items-center justify-center">
                <canvas ref={canvasRef} className="w-full h-full rounded shadow-[0_0_50px_rgba(6,182,212,0.1)]" />
              </div>
            </div>

            <div className={`absolute bottom-10 left-10 border-l border-cyan-500/40 bg-black/20 backdrop-blur-sm transition-all duration-300 ${selectedChassis.id === 'goliath-prime' ? 'p-4' : 'p-2.5'}`}>
               <div className={`${selectedChassis.id === 'goliath-prime' ? 'text-[10px]' : 'text-[8px]'} font-mono text-cyan-500 animate-pulse mb-1 tracking-widest`}>● LIVE FEED [TANK_04]</div>
               <div className={`font-orbitron ${selectedChassis.id === 'goliath-prime' ? 'text-2xl' : 'text-lg'} tracking-tighter text-white`}>{selectedChassis.name}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-64 flex-shrink-0">
             <div className="bg-[#070a0d] border border-cyan-900/30 p-6 flex flex-col justify-center relative">
                <div className="absolute top-2 right-4 text-[10px] font-mono text-cyan-900 uppercase">Loadout Stats</div>
                <StatBar label="PLATING THICKNESS" value={selectedChassis.stats.armor} />
                <StatBar label="THRUSTER OUTPUT" value={selectedChassis.stats.speed} />
                <StatBar label="ORDNANCE LEVEL" value={selectedChassis.stats.firepower} />
             </div>

             <div className="bg-[#070a0d] border border-cyan-900/30 p-6 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
                <div>
                  <h3 className="text-xs font-mono text-cyan-500 mb-2 uppercase tracking-[0.2em]">Vehicle Intelligence</h3>
                  <p className="text-sm text-stone-400 leading-relaxed italic">
                    "{selectedChassis.description}"
                  </p>
                </div>
                
                <div className="mt-6">
                  {!isUnlocked(selectedChassis.id) ? (
                    <div className="space-y-3">
                      <div className={`text-center font-mono text-xs ${canAfford ? 'text-cyan-500' : 'text-red-500 animate-pulse'}`}>
                        {canAfford ? 'CREDITS AVAILABLE' : 'INSUFFICIENT FUNDS'}
                      </div>
                      <CyberButton onClick={handlePurchaseOrEquip} variant={canAfford ? 'primary' : 'secondary'} className="w-full text-sm">
                        PURCHASE AUTHORIZATION ◈ {selectedChassis.cost}
                      </CyberButton>
                    </div>
                  ) : (
                    <CyberButton 
                      onClick={handlePurchaseOrEquip} 
                      variant={isEquipped(selectedChassis.id) ? 'secondary' : 'primary'} 
                      className="w-full text-sm"
                      disabled={isEquipped(selectedChassis.id)}
                    >
                      {isEquipped(selectedChassis.id) ? 'ALREADY DEPLOYED' : 'COMMIT TO LOADOUT'}
                    </CyberButton>
                  )}
                </div>
             </div>
          </div>
        </section>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(6,182,212,0.3); border-radius: 0px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6,182,212,0.5); }
        
        @keyframes scan {
          from { transform: translateY(0); }
          to { transform: translateY(4px); }
        }
        .animate-scan {
          animation: scan 0.2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default HangarScreen;