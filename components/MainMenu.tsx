
import React, { useEffect, useRef, useState } from 'react';
import type { Screen } from '../types';

interface MainMenuProps {
  navigateTo: (screen: Screen) => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ navigateTo }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeItem, setActiveItem] = useState<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId: number;
    
    const handleMouseMove = (e: MouseEvent) => {
      // Optimization: Update CSS variables directly to avoid React re-renders
      if (rafId) return; // Throttle via RAF
      
      rafId = requestAnimationFrame(() => {
        const { width, height, left, top } = container.getBoundingClientRect();
        // Calculate normalized coordinates (-1 to 1)
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

  const menuItems = [
    { 
      id: 1, 
      label: 'INITIATE', 
      sub: 'CAMPAIGN PROTOCOL', 
      target: 'difficulty-selection' as const,
      desc: '>> ACCESS SECTOR 7 // HOSTILE',
      color: 'cyan'
    },
    { 
      id: 2, 
      label: 'VERSUS', 
      sub: 'LOCAL SIMULATION', 
      target: 'duel-selection' as const,
      desc: '>> PVP TACTICAL COMBAT // 1V1',
      color: 'magenta'
    },
    { 
      id: 3, 
      label: 'SYSTEM', 
      sub: 'CONFIG_ROOT', 
      target: 'settings' as const,
      desc: '>> AUDIO / VIDEO / CONTROLS',
      color: 'yellow'
    },
  ];

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-[#030507] text-white font-rajdhani selection:bg-cyan-500/30"
      style={{ '--mouse-x': '0', '--mouse-y': '0' } as React.CSSProperties}
    >
      {/* --- LAYER 0: DYNAMIC BACKGROUND --- */}
      <div className="absolute inset-0 pointer-events-none perspective-container">
        
        {/* Moving Grid Floor (CSS Variable Driven) */}
        <div className="absolute inset-[-50%] opacity-20 grid-floor" />
        
        {/* Streaming Data Rain */}
        <div className="absolute inset-0 opacity-10 flex justify-between px-10 pointer-events-none">
           {[...Array(5)].map((_, i) => (
             <div key={i} className="w-px h-full bg-gradient-to-b from-transparent via-cyan-500 to-transparent animate-data-stream" 
                  style={{ animationDelay: `${i * 1.5}s`, animationDuration: `${3 + i}s` }} />
           ))}
        </div>

        {/* Vignette & Grain */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#000_100%)]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04]" />
        <div className="scanlines absolute inset-0 z-50 pointer-events-none opacity-20" />
      </div>

      {/* --- LAYER 1: UI LAYOUT --- */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 h-full">
        
        {/* LEFT: NAVIGATION */}
        <div className="lg:col-span-5 h-full flex flex-col justify-center px-8 md:px-16 lg:pl-24 relative z-20">
          
          {/* Header Block */}
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-2 text-cyan-500/80 text-xs tracking-[0.4em] font-bold">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-sm animate-pulse" />
              SYSTEM_ONLINE // V.2.4.0
            </div>
            <h1 className="font-orbitron text-7xl md:text-9xl font-black italic tracking-tighter leading-[0.8] text-transparent bg-clip-text bg-gradient-to-br from-white via-cyan-100 to-cyan-900 drop-shadow-[0_0_15px_rgba(0,240,255,0.3)] transform transition-transform hover:scale-[1.02] duration-500 origin-left">
              NEON
              <span className="block text-stroke-cyan text-transparent mt-2 opacity-90">BLITZ</span>
            </h1>
          </div>

          {/* Menu Items */}
          <nav className="flex flex-col gap-8 w-full max-w-md">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigateTo(item.target as Screen)}
                onMouseEnter={() => setActiveItem(item.id)}
                onMouseLeave={() => setActiveItem(null)}
                className={`group relative text-left outline-none transition-all duration-300 ${activeItem === item.id ? 'translate-x-4' : ''}`}
              >
                {/* Active Indicator Line */}
                <div className={`absolute -left-6 top-1/2 -translate-y-1/2 w-1 h-0 bg-${item.color === 'cyan' ? 'cyan' : item.color === 'magenta' ? 'fuchsia' : 'yellow'}-400 transition-all duration-300 group-hover:h-full box-shadow-glow`} />

                {/* Main Label */}
                <div className="flex items-baseline gap-4 relative z-10">
                  <span className={`font-orbitron text-xl font-bold text-stone-600 transition-colors duration-300 group-hover:text-${item.color === 'cyan' ? 'cyan' : item.color === 'magenta' ? 'fuchsia' : 'yellow'}-400`}>
                    0{item.id}
                  </span>
                  <span className={`font-black text-4xl md:text-5xl uppercase tracking-wide transition-all duration-300 ${activeItem === item.id ? 'text-white text-shadow-glow' : 'text-stone-400'}`}>
                    {item.label}
                  </span>
                </div>

                {/* Sub-label & Description */}
                <div className="pl-10">
                  <div className={`text-xs font-bold tracking-[0.2em] uppercase transition-colors duration-300 ${activeItem === item.id ? `text-${item.color === 'cyan' ? 'cyan' : item.color === 'magenta' ? 'fuchsia' : 'yellow'}-400` : 'text-stone-600'}`}>
                    {item.sub}
                  </div>
                  <div className={`overflow-hidden transition-all duration-500 ease-out ${activeItem === item.id ? 'max-h-10 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                    <p className="text-[10px] font-mono text-stone-400 bg-white/5 p-1 px-2 inline-block border-l-2 border-stone-500">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* RIGHT: SCHEMATIC VISUALIZER */}
        <div className="hidden lg:col-span-7 lg:flex items-center justify-center relative perspective-[1000px] overflow-hidden">
          
          {/* Parallax Container driven by CSS vars */}
          <div className="schematic-container w-[700px] h-[700px] relative">
            
            {/* Center Hologram */}
            <div className="absolute inset-0 flex items-center justify-center">
               <TankSchematic color="#06b6d4" />
            </div>

            {/* Orbiting Rings */}
            <div className="absolute inset-0 ring-system">
                <div className="ring ring-1 border-dashed border-cyan-500/20" />
                <div className="ring ring-2 border-cyan-500/30" />
                <div className="ring ring-3 border-dotted border-fuchsia-500/20" />
            </div>

            {/* Floating Data Nodes (CSS Parallax) */}
            <DataNode label="ARMOR_INT" value="100%" top="20%" left="10%" depth={2} />
            <DataNode label="AMMO_CAP" value="INF" top="30%" right="15%" depth={3} />
            <DataNode label="ENG_TEMP" value="NOMINAL" bottom="25%" left="20%" depth={1.5} />
            
          </div>
        </div>
      </div>

      <style>{`
        .text-stroke-cyan { -webkit-text-stroke: 1px rgba(34,211,238,0.5); }
        
        /* 3D Grid Floor Transformation */
        .perspective-container {
          perspective: 1000px;
        }
        .grid-floor {
          background-image: 
            linear-gradient(to right, rgba(6,182,212,0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(6,182,212,0.1) 1px, transparent 1px);
          background-size: 50px 50px;
          /* Rotate X for floor perspective, translate based on mouse vars */
          transform: 
            rotateX(60deg) 
            translateX(calc(var(--mouse-x) * -20px)) 
            translateY(calc(var(--mouse-y) * -20px));
          mask-image: linear-gradient(to bottom, transparent, black 40%, transparent);
        }

        /* Schematic Container Rotation */
        .schematic-container {
          transform-style: preserve-3d;
          transform: 
            rotateY(calc(var(--mouse-x) * 15deg)) 
            rotateX(calc(var(--mouse-y) * -15deg));
          transition: transform 0.1s ease-out;
        }

        /* Rings Animation */
        .ring {
          position: absolute;
          border-radius: 50%;
          left: 50%; top: 50%;
          transform: translate(-50%, -50%);
        }
        .ring-1 { width: 500px; height: 500px; border-width: 1px; animation: spin 20s linear infinite; }
        .ring-2 { width: 380px; height: 380px; border-width: 2px; animation: spin 15s linear infinite reverse; }
        .ring-3 { width: 550px; height: 550px; border-width: 1px; animation: spin 25s linear infinite; transform: translate(-50%, -50%) rotateX(60deg); }

        @keyframes spin { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
        @keyframes data-stream { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
        
        .animate-data-stream { animation: data-stream 5s linear infinite; }
        .text-shadow-glow { text-shadow: 0 0 20px currentColor; }
        .box-shadow-glow { box-shadow: 0 0 15px currentColor; }
      `}</style>
    </div>
  );
};

// --- Sub-components ---

const DataNode = ({ label, value, top, left, right, bottom, depth }: any) => (
  <div 
    className="absolute flex flex-col bg-black/80 border-l-2 border-cyan-500/50 px-3 py-1 backdrop-blur-sm shadow-lg pointer-events-none"
    style={{
      top, left, right, bottom,
      // Parallax effect using CSS var
      transform: `translateZ(${depth * 20}px) translateX(calc(var(--mouse-x) * ${depth * -10}px)) translateY(calc(var(--mouse-y) * ${depth * -10}px))`
    }}
  >
    <span className="text-[9px] text-stone-500 tracking-widest uppercase">{label}</span>
    <span className="text-sm font-bold text-cyan-400 font-orbitron">{value}</span>
  </div>
);

const TankSchematic = ({ color }: { color: string }) => (
  <svg viewBox="0 0 200 200" className="w-80 h-80 overflow-visible drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">
    {/* Defs for gradients/masks could go here */}
    <g fill="none" stroke={color} strokeWidth="1" strokeLinecap="square" strokeLinejoin="bevel">
      {/* Outer reticle circles */}
      <circle cx="100" cy="100" r="90" strokeOpacity="0.2" strokeDasharray="4 4" />
      <circle cx="100" cy="100" r="70" strokeOpacity="0.1" />
      
      {/* Tank Body (Schematic style) */}
      <path d="M50,60 L150,60 L160,100 L150,140 L50,140 L40,100 Z" fill="rgba(6,182,212,0.02)" />
      <path d="M50,60 L100,100 M150,60 L100,100 M50,140 L100,100 M150,140 L100,100" strokeOpacity="0.3" />
      
      {/* Turret */}
      <circle cx="100" cy="100" r="25" fill="#000" fillOpacity="0.5" strokeWidth="2" />
      <rect x="92" y="20" width="16" height="60" fill="#000" stroke="none" />
      <rect x="92" y="20" width="16" height="60" strokeWidth="1.5" />
      
      {/* Treads */}
      <rect x="30" y="50" width="20" height="100" strokeDasharray="2 2" strokeOpacity="0.5" />
      <rect x="150" y="50" width="20" height="100" strokeDasharray="2 2" strokeOpacity="0.5" />
      
      {/* Scanning Line Animation */}
      <line x1="0" y1="0" x2="200" y2="0" stroke="white" strokeOpacity="0.5" strokeWidth="2">
        <animate attributeName="y1" from="0" to="200" dur="3s" repeatCount="indefinite" />
        <animate attributeName="y2" from="0" to="200" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite" />
      </line>
    </g>
  </svg>
);

export default MainMenu;
