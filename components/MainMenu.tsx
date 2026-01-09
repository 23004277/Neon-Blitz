
import React, { useEffect, useRef, useState } from 'react';
import type { Screen, Tank } from '../types';
import { useAudio } from '../contexts/AudioContext';
import { drawTank } from './game/canvasRenderer';

interface MainMenuProps {
  navigateTo: (screen: Screen) => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ navigateTo }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeItem, setActiveItem] = useState<number | null>(null);
  const audio = useAudio();

  useEffect(() => {
      // Ensure we are in menu music state
      audio.setMusicState('menu');
  }, [audio]);

  // Mouse tracking for perspective effect
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let rafId: number;
    const handleMouseMove = (e: MouseEvent) => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        const { width, height, left, top } = container.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 2 - 1;
        const y = ((e.clientY - top) / height) * 2 - 1;
        container.style.setProperty('--mouse-x', x.toFixed(3));
        container.style.setProperty('--mouse-y', y.toFixed(3));
        rafId = 0;
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // Canvas Animation Loop for Tank Preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    
    // Preview Tank State
    const tank: Tank = {
        id: 'preview_tank',
        name: 'VECTOR_01',
        type: 'player',
        status: 'active',
        position: { x: 0, y: 0 }, // We translate context to center
        velocity: { x: 0, y: 0 },
        angle: -90,
        turretAngle: -90,
        size: { width: 40, height: 40 },
        health: 10,
        maxHealth: 10,
        color: '#00F0FF',
        score: 0,
        kills: 0,
        deaths: 0
    };

    const render = () => {
        const now = Date.now();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Animation Logic
        // Slowly rotate body
        tank.angle = -90 + Math.sin(now * 0.0005) * 5;
        // Scan turret
        tank.turretAngle = -90 + Math.sin(now * 0.0015) * 45;

        // Draw
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(4, 4); // Scale up for preview visibility
        
        // Draw the tank using the shared game renderer
        drawTank(ctx, tank, now, [], false);
        
        ctx.restore();

        animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
        cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleMouseEnter = (id: number) => {
      setActiveItem(id);
      audio.play('uiHover');
  }

  const handleClick = (target: Screen) => {
      audio.play('uiClick');
      navigateTo(target);
  }

  const menuItems = [
    { id: 1, label: 'DEPLOY', sub: 'CAMPAIGN', target: 'difficulty-selection', color: 'cyan', desc: 'ENGAGE HOSTILES IN SECTOR 7' },
    { id: 2, label: 'SKIRMISH', sub: 'DUEL MODE', target: 'duel-selection', color: 'magenta', desc: '1V1 TACTICAL SIMULATION' },
    { id: 3, label: 'SANDBOX', sub: 'FREE PLAY', target: 'sandbox-selection', color: 'yellow', desc: 'TEST PROTOTYPE CHASSIS' },
    { id: 4, label: 'CONFIG', sub: 'SYSTEMS', target: 'settings', color: 'cyan', desc: 'AUDIO / VIDEO / CONTROLS' },
  ];

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-[#050505] text-white font-rajdhani"
      style={{ '--mouse-x': '0', '--mouse-y': '0' } as React.CSSProperties}
    >
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none perspective-container">
        <div className="absolute inset-[-50%] opacity-10 grid-floor" />
        <div className="scanlines absolute inset-0 z-50 pointer-events-none opacity-20" />
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 h-full">
        {/* Navigation */}
        <div className="lg:col-span-5 h-full flex flex-col justify-center px-12 relative z-20">
          <div className="mb-20">
            <h1 className="font-orbitron text-7xl md:text-8xl font-black tracking-tighter leading-none text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
              VECTOR
            </h1>
            <h1 className="font-orbitron text-7xl md:text-8xl font-black tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary-cyan)] to-blue-600">
              SIEGE
            </h1>
            <div className="mt-4 flex items-center gap-2 text-xs font-mono text-stone-500 tracking-[0.3em]">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
                PROTOCOL ZERO // ONLINE
            </div>
          </div>

          <nav className="flex flex-col gap-6 w-full max-w-md">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleClick(item.target as Screen)}
                onMouseEnter={() => handleMouseEnter(item.id)}
                onMouseLeave={() => setActiveItem(null)}
                className="group relative text-left outline-none"
              >
                <div className={`flex items-center justify-between border-b border-stone-800 pb-2 transition-all duration-300 ${activeItem === item.id ? 'border-[var(--color-primary-' + item.color + ')] pl-4' : ''}`}>
                    <div>
                        <span className={`block font-black text-4xl uppercase tracking-wider transition-colors ${activeItem === item.id ? 'text-white' : 'text-stone-500'}`}>
                            {item.label}
                        </span>
                        <span className="text-xs font-bold text-stone-600 tracking-widest">{item.sub}</span>
                    </div>
                    <div className={`text-2xl transition-transform duration-300 ${activeItem === item.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                        →
                    </div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Hero Visual */}
        <div className="hidden lg:col-span-7 lg:flex items-center justify-center relative perspective-[1000px]">
             <div className="schematic-container w-[600px] h-[600px] relative border border-white/5 rounded-full flex items-center justify-center">
                 <div className="absolute inset-0 border border-cyan-500/20 rounded-full animate-[spin_20s_linear_infinite]" />
                 <div className="absolute inset-10 border border-dashed border-cyan-500/30 rounded-full animate-[spin_30s_linear_infinite_reverse]" />
                 
                 {/* Canvas Tank Representation */}
                 <canvas 
                    ref={canvasRef} 
                    width={600} 
                    height={600} 
                    className="relative z-10 w-full h-full drop-shadow-[0_0_30px_rgba(6,182,212,0.3)]"
                 />
                 
                 {/* Schematic Overlay Text */}
                 <div className="absolute top-1/4 right-10 text-right pointer-events-none opacity-60">
                    <div className="text-[10px] font-mono text-cyan-500 mb-1">CHASSIS: MK-IV HOVER</div>
                    <div className="h-px w-24 bg-cyan-900 ml-auto mb-2"></div>
                    <div className="text-[10px] font-mono text-cyan-300">ARMOR: COMPOSITE</div>
                 </div>
                 
                 <div className="absolute bottom-1/4 left-10 text-left pointer-events-none opacity-60">
                    <div className="text-[10px] font-mono text-cyan-500 mb-1">WEAPON: RAIL DRIVER</div>
                    <div className="h-px w-24 bg-cyan-900 mb-2"></div>
                    <div className="text-[10px] font-mono text-cyan-300">OUTPUT: 450MW</div>
                 </div>
             </div>
        </div>
      </div>

      <style>{`
        .perspective-container { perspective: 1000px; }
        .grid-floor {
          background-image: linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 60px 60px;
          transform: rotateX(60deg) translateY(calc(var(--mouse-y) * -20px));
        }
        .schematic-container {
            transform: rotateY(calc(var(--mouse-x) * 10deg)) rotateX(calc(var(--mouse-y) * -10deg));
            transition: transform 0.1s ease-out;
        }
      `}</style>
    </div>
  );
};

export default MainMenu;
