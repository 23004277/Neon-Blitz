import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { Screen, Tank } from '../types';
import { useAudio } from '../contexts/AudioContext';
import { drawTank } from './game/canvasRenderer';
import { useSettings } from '../contexts/SettingsContext';

/**
 * Finalised MainMenu (remastered)
 *
 * Notes:
 * - Footer moved to bottom-right corner (absolute) as requested.
 * - devicePixelRatio-aware canvas resizing, RAF cleanup, keyboard nav, debounced audio, color wheel + hex sync.
 */

interface MainMenuProps {
  navigateTo: (screen: Screen) => void;
}

const HOVER_DEBOUNCE_MS = 40;
const CLICK_THROTTLE_MS = 120;

const MainMenu: React.FC<MainMenuProps> = ({ navigateTo }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // RAF refs
  const mouseRaf = useRef<number | null>(null);
  const canvasRaf = useRef<number | null>(null);
  const lastHoverAt = useRef<number>(0);
  const lastClickAt = useRef<number>(0);

  const { settings, setSettings } = useSettings();
  const audio = useAudio();

  // local UI state
  const [activeItem, setActiveItem] = useState<number | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [hexInput, setHexInput] = useState<string>(settings.playerColor || '#00F0FF');
  const [nameInput, setNameInput] = useState<string>(settings.playerName || '');

  // Keep CSS variables state for transform (mouse) so style object doesn't mutate DOM directly
  const mouseVars = useRef({ x: '0', y: '0' });

  // ensure menu music state
  useEffect(() => {
    audio.setMusicState?.('menu');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally on mount only

  // --------------------------
  // Mouse tracking (parallax)
  // --------------------------
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onMove = (e: MouseEvent) => {
      if (mouseRaf.current != null) return;
      mouseRaf.current = requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect();
        const x = (((e.clientX - rect.left) / rect.width) * 2 - 1).toFixed(3);
        const y = (((e.clientY - rect.top) / rect.height) * 2 - 1).toFixed(3);
        mouseVars.current.x = x;
        mouseVars.current.y = y;
        // set CSS vars via style prop on container — will be read in inline style below
        container.style.setProperty('--mouse-x', x);
        container.style.setProperty('--mouse-y', y);
        mouseRaf.current && cancelAnimationFrame(mouseRaf.current);
        mouseRaf.current = null;
      });
    };

    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (mouseRaf.current) cancelAnimationFrame(mouseRaf.current);
      mouseRaf.current = null;
    };
  }, []);

  // --------------------------
  // Canvas preview + resizing
  // --------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let mounted = true;

    // handle high-DPI scaling
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // clamp to avoid extreme sizes
      const rect = parent.getBoundingClientRect();
      const width = Math.max(300, Math.floor(rect.width));
      const height = Math.max(300, Math.floor(rect.height));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    // initial resize
    resizeCanvas();
    const onResize = () => resizeCanvas();
    window.addEventListener('resize', onResize);

    // preview tank state (we update from settings on each frame)
    const tank: Tank = {
      id: 'preview_tank',
      name: settings.playerName || 'VECTOR_01',
      type: 'player',
      status: 'active',
      chassis: settings.equippedChassis || 'vector-01',
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
      score: 0,
      kills: 0,
      deaths: 0,
    };

    const loop = () => {
      if (!mounted) return;
      const now = performance.now();
      // keep tank data in sync but avoid reassigning settings object
      tank.color = settings.playerColor || tank.color;
      tank.secondaryColor = settings.playerSecondaryColor;
      tank.colorStyle = settings.playerColorStyle;
      tank.name = settings.playerName || tank.name;
      tank.chassis = settings.equippedChassis || tank.chassis;

      // simple animation
      tank.angle = -90 + Math.sin(now * 0.0005) * 5;
      tank.turretAngle = -90 + Math.sin(now * 0.0015) * 45;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      // center preview and scale for readability
      const displayW = parseFloat(canvas.style.width) || 600;
      const displayH = parseFloat(canvas.style.height) || 600;
      ctx.translate(displayW / 2, displayH / 2);
      ctx.scale(4, 4);

      // drawTank is your shared renderer — keep passing now & empty lists
      drawTank(ctx, tank, Date.now(), [], false);

      ctx.restore();

      canvasRaf.current = requestAnimationFrame(loop);
    };

    canvasRaf.current = requestAnimationFrame(loop);

    return () => {
      mounted = false;
      if (canvasRaf.current) cancelAnimationFrame(canvasRaf.current);
      if (mouseRaf.current) cancelAnimationFrame(mouseRaf.current);
      window.removeEventListener('resize', onResize);
    };
    // we intentionally depend on settings fields we read inside loop to re-run when they change
  }, [settings.playerColor, settings.playerName, settings.equippedChassis]);

  // --------------------------
  // Audio helpers (debounced hover / throttled clicks)
  // --------------------------
  const playHover = useCallback(() => {
    const now = Date.now();
    if (now - lastHoverAt.current < HOVER_DEBOUNCE_MS) return;
    lastHoverAt.current = now;
    audio.play?.('uiHover');
  }, [audio]);

  const handleClickSound = useCallback(() => {
    const now = Date.now();
    if (now - lastClickAt.current < CLICK_THROTTLE_MS) return;
    lastClickAt.current = now;
    audio.play?.('uiClick');
  }, [audio]);

  // --------------------------
  // Menu data
  // --------------------------
  const menuCategories = [
    {
      title: 'COMBAT OPERATIONS',
      items: [
        { id: 1, label: 'DEPLOY', sub: 'CAMPAIGN', target: 'difficulty-selection', color: 'cyan', desc: 'ENGAGE HOSTILES IN SECTOR 7' },
        { id: 2, label: 'SKIRMISH', sub: 'DUEL MODE', target: 'duel-selection', color: 'magenta', desc: '1V1 TACTICAL SIMULATION' },
        { id: 3, label: 'SANDBOX', sub: 'FREE PLAY', target: 'sandbox-selection', color: 'yellow', desc: 'TEST PROTOTYPE CHASSIS' },
      ],
    },
    {
      title: 'SYSTEM MANAGEMENT',
      items: [
        { id: 4, label: 'HANGAR', sub: 'VEHICLE BAY', target: 'hangar', color: 'orange', desc: 'PURCHASE & EQUIP CHASSIS' },
        { id: 5, label: 'PROFILE', sub: 'CUSTOMIZE', target: 'profile', color: 'green', desc: 'PILOT DATA & LIVERY' },
        { id: 6, label: 'CONFIG', sub: 'SYSTEMS', target: 'settings', color: 'cyan', desc: 'AUDIO / VIDEO / CONTROLS' },
      ],
    },
  ];

  const palette = [
    '#00F0FF', // Cyan
    '#ef4444', // Red
    '#22c55e', // Green
    '#eab308', // Yellow
    '#a855f7', // Purple
    '#ec4899', // Pink
    '#ffffff', // White
    '#1c1917', // Black (Stealth)
  ];

  // --------------------------
  // Interaction handlers
  // --------------------------
  const handleMouseEnter = (id: number) => {
    setActiveItem(id);
    playHover();
  };

  const handleItemClick = (target: string) => {
    handleClickSound();
    if (target === 'profile') {
      setShowProfile(true);
      return;
    }
    navigateTo(target as Screen);
  };

  // profile form handlers
  const onNameChange = (value: string) => {
    const upper = value.toUpperCase().slice(0, 12);
    setNameInput(upper);
    // apply immediately to settings
    setSettings((prev) => ({ ...prev, playerName: upper }));
  };

  // hex validation helper
  const isValidHex = (hex: string) => /^#([0-9A-Fa-f]{6})$/.test(hex);

  const onHexChange = (hex: string) => {
    const normalized = hex.startsWith('#') ? hex.toUpperCase() : '#' + hex.toUpperCase();
    setHexInput(normalized);
    if (isValidHex(normalized)) {
      setSettings((prev) => ({ ...prev, playerColor: normalized }));
    }
  };

  const onSecondaryHexChange = (hex: string) => {
    const normalized = hex.startsWith('#') ? hex.toUpperCase() : '#' + hex.toUpperCase();
    if (isValidHex(normalized)) {
      setSettings((prev) => ({ ...prev, playerSecondaryColor: normalized }));
    }
  };

  const onColorStyleChange = (style: string) => {
    setSettings((prev) => ({ ...prev, playerColorStyle: style as any }));
  };

  // color wheel handler (native color input)
  const onColorWheelChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const v = ev.target.value.toUpperCase();
    setHexInput(v);
    setSettings((prev) => ({ ...prev, playerColor: v }));
  };

  // keyboard navigation - simple: arrow up/down move items, Enter activates
  const flatItems = menuCategories.flatMap((c) => c.items);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // ignore if profile modal is open or input focused
      const activeEl = document.activeElement;
      if (showProfile && activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) return;

      if (e.key === 'ArrowDown' || e.key === 's') {
        e.preventDefault();
        const idx = flatItems.findIndex((it) => it.id === activeItem);
        const next = flatItems[(idx === -1 ? 0 : Math.min(idx + 1, flatItems.length - 1))];
        setActiveItem(next.id);
      } else if (e.key === 'ArrowUp' || e.key === 'w') {
        e.preventDefault();
        const idx = flatItems.findIndex((it) => it.id === activeItem);
        const prev = flatItems[(idx === -1 ? flatItems.length - 1 : Math.max(idx - 1, 0))];
        setActiveItem(prev.id);
      } else if (e.key === 'Enter') {
        if (activeItem) {
          const item = flatItems.find((it) => it.id === activeItem);
          if (item) handleItemClick(item.target);
        }
      } else if (e.key === 'Escape') {
        setShowProfile(false);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeItem, flatItems, showProfile, navigateTo]);

  // set local hex input when settings update externally
  useEffect(() => {
    setHexInput(settings.playerColor || '#00F0FF');
    setNameInput(settings.playerName || '');
  }, [settings.playerColor, settings.playerName]);

  // --------------------------
  // Render
  // --------------------------
  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-[#050505] text-white font-rajdhani"
      // inline style for mouse vars keeps layout reactive without rerenders
      style={{
        ['--mouse-x' as any]: mouseVars.current.x,
        ['--mouse-y' as any]: mouseVars.current.y,
      }}
    >
      {/* Background / grid / scanlines */}
      <div className="absolute inset-0 pointer-events-none perspective-container">
        <div className="absolute inset-[-50%] opacity-8 grid-floor" />
        <div className="scanlines absolute inset-0 z-50 pointer-events-none opacity-20" />
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 h-full">
        {/* Top-right credits */}
        <div className="absolute top-8 right-12 z-50 flex items-center gap-4 bg-cyan-900/20 border border-cyan-500/30 px-6 py-3 backdrop-blur-sm">
          <span className="text-xs font-mono text-cyan-500 tracking-widest">FUNDS:</span>
          <span className="font-orbitron text-2xl text-cyan-300">◈ {settings.credits}</span>
        </div>

        {/* Left navigation column */}
        <div className="lg:col-span-5 h-full flex flex-col justify-center px-12 relative z-20">
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-cyan-500 flex items-center justify-center text-black font-black text-2xl font-orbitron">V</div>
              <div>
                <h1 className="font-orbitron text-5xl font-black tracking-tighter leading-none text-white">
                  VECTOR <span className="text-cyan-500">SIEGE</span>
                </h1>
                <div className="text-[10px] font-mono text-cyan-500 tracking-[0.3em] uppercase mt-1">Tactical Combat Simulation</div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[10px] font-mono text-stone-500 tracking-[0.2em] mt-6 border-l-2 border-cyan-900/50 pl-4">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                SYSTEM ONLINE
              </div>
              <div>//</div>
              <div>V 1.0.4</div>
              <div>//</div>
              <div>USER: {settings.playerName}</div>
            </div>
          </div>

          {!showProfile ? (
            <div className="flex flex-col gap-10 w-full max-w-md" role="navigation" aria-label="Main menu">
              {menuCategories.map((category, catIdx) => (
                <section key={catIdx} aria-labelledby={`cat-${catIdx}`} className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <span id={`cat-${catIdx}`} className="text-[10px] font-mono text-cyan-500 tracking-widest uppercase">{category.title}</span>
                    <div className="h-px flex-1 bg-cyan-900/50" />
                  </div>

                  <nav className="flex flex-col gap-4" aria-label={category.title}>
                    {category.items.map((item) => {
                      const isActive = activeItem === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleItemClick(item.target)}
                          onMouseEnter={() => handleMouseEnter(item.id)}
                          onMouseLeave={() => setActiveItem(null)}
                          onFocus={() => setActiveItem(item.id)}
                          onBlur={() => setActiveItem(null)}
                          className="group relative text-left outline-none w-full"
                          aria-pressed={isActive}
                        >
                          <div
                            className={`flex items-center justify-between border-l-4 pl-4 py-3 transition-all duration-300 rounded-md ${
                              isActive
                                ? 'bg-gradient-to-r from-[rgba(6,182,212,0.12)] to-transparent translate-x-2 border-cyan-400'
                                : 'hover:border-stone-600 bg-black/40 border-stone-800'
                            }`}
                          >
                            <div>
                              <span className={`block font-black text-3xl uppercase tracking-wider transition-colors ${isActive ? 'text-white' : 'text-stone-400'}`}>
                                {item.label}
                              </span>
                              <span className={`text-[10px] font-mono tracking-widest transition-colors ${isActive ? 'text-cyan-300' : 'text-stone-500'}`}>
                                {item.sub} // {item.desc}
                              </span>
                            </div>

                            <div className={`text-xl font-mono transition-all duration-300 ${isActive ? 'opacity-100 translate-x-0 text-cyan-300' : 'opacity-0 -translate-x-4 text-stone-600'}`}>
                              [ EXECUTE ]
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </nav>
                </section>
              ))}
            </div>
          ) : (
            <div className="w-full max-w-md animate-in fade-in slide-in-from-left-4 duration-300" aria-modal="true" role="dialog" aria-label="Pilot profile">
              <div className="flex items-center justify-between mb-8 border-b border-stone-800 pb-4">
                <h2 className="font-orbitron text-3xl font-bold text-white">PILOT PROFILE</h2>
                <button
                  onClick={() => {
                    handleClickSound();
                    setShowProfile(false);
                  }}
                  className="text-stone-500 hover:text-white font-mono text-sm tracking-widest transition-colors"
                >
                  [ BACK ]
                </button>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="block text-xs font-mono text-cyan-500 mb-2 tracking-widest">CALLSIGN</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => onNameChange(e.target.value)}
                      maxLength={12}
                      className="w-full bg-[#0a0a0a] border border-cyan-900/50 p-4 pl-10 text-white font-orbitron text-xl tracking-wider focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.3)] outline-none transition-all"
                      placeholder="ENTER NAME"
                      aria-label="Pilot callsign"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500 font-mono text-xl">{'>'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-cyan-500 mb-2 tracking-widest">LIVERY COLOR</label>

                  {/* Palette */}
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    {palette.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          handleClickSound();
                          setHexInput(c);
                          setSettings((prev) => ({ ...prev, playerColor: c }));
                        }}
                        title={`Select ${c}`}
                        aria-label={`Select color ${c}`}
                        className={`h-12 w-full border transition-all rounded ${settings.playerColor?.toUpperCase() === c.toUpperCase() ? 'border-white scale-105 shadow-[0_0_15px_rgba(255,255,255,0.25)]' : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>

                  {/* Color wheel + hex input */}
                  <div className="flex items-center gap-4 bg-[#0a0a0a] border border-cyan-900/50 p-3 rounded">
                    <input
                      aria-label="Color wheel"
                      title="Color wheel"
                      type="color"
                      value={hexInput}
                      onChange={onColorWheelChange}
                      className="h-10 w-10 p-0 border-0"
                      style={{ backgroundColor: hexInput }}
                    />

                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="text-xs font-mono text-cyan-500 tracking-widest">HEX</div>
                        <input
                          type="text"
                          value={hexInput}
                          onChange={(e) => setHexInput(e.target.value.toUpperCase())}
                          onBlur={() => onHexChange(hexInput)}
                          className="flex-1 bg-transparent text-white font-mono text-lg focus:outline-none"
                          aria-label="Hex color input"
                        />
                        <div
                          className="w-8 h-8 border border-white/20 rounded"
                          style={{ backgroundColor: isValidHex(hexInput) ? hexInput : '#000000' }}
                          aria-hidden
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-cyan-500 mb-2 tracking-widest">SECONDARY COLOR</label>
                  <div className="flex items-center gap-4 bg-[#0a0a0a] border border-cyan-900/50 p-3 rounded">
                    <input
                      aria-label="Secondary color wheel"
                      type="color"
                      value={settings.playerSecondaryColor}
                      onChange={(e) => onSecondaryHexChange(e.target.value)}
                      className="h-10 w-10 p-0 border-0"
                    />
                    <input
                      type="text"
                      value={settings.playerSecondaryColor}
                      onChange={(e) => onSecondaryHexChange(e.target.value)}
                      className="flex-1 bg-transparent text-white font-mono text-lg focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-cyan-500 mb-2 tracking-widest">LIVERY STYLE</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['solid', 'gradient', 'neon', 'chrome'].map((s) => (
                      <button
                        key={s}
                        onClick={() => onColorStyleChange(s)}
                        className={`py-2 px-4 border text-[10px] font-mono tracking-widest uppercase transition-all ${settings.playerColorStyle === s ? 'bg-cyan-500 text-black border-cyan-500' : 'bg-transparent text-stone-500 border-stone-800 hover:border-stone-600'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right hero / schematic */}
        <div className="hidden lg:col-span-7 lg:flex items-center justify-center relative perspective-[1000px]">
          <div className="schematic-container w-[600px] h-[600px] relative border border-white/5 rounded-full flex items-center justify-center">
            <div className="absolute inset-0 border border-cyan-500/20 rounded-full animate-[spin_20s_linear_infinite]" />
            <div className="absolute inset-10 border border-dashed border-cyan-500/30 rounded-full animate-[spin_30s_linear_infinite_reverse]" />

            {/* Canvas Tank Preview */}
            <canvas
              ref={canvasRef}
              width={600}
              height={600}
              className="relative z-10 w-full h-full drop-shadow-[0_0_30px_rgba(6,182,212,0.3)] rounded-full"
              aria-label="Tank preview"
            />

            <div className="absolute top-1/4 right-10 text-right pointer-events-none opacity-60">
              <div className="text-[10px] font-mono text-cyan-500 mb-1">PILOT: {settings.playerName || 'VECTOR_01'}</div>
              <div className="h-px w-24 bg-cyan-900 ml-auto mb-2" />
              <div className="text-[10px] font-mono text-cyan-300">STATUS: ACTIVE</div>
            </div>

            <div className="absolute bottom-1/4 left-10 text-left pointer-events-none opacity-60">
              <div className="text-[10px] font-mono text-cyan-500 mb-1">LIVERY: {settings.playerColor || '#00F0FF'}</div>
              <div className="h-px w-24 bg-cyan-900 mb-2" />
              <div className="text-[10px] font-mono text-cyan-300 uppercase">CHASSIS: {(settings.equippedChassis || '').replace('-', ' ')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* System status - bottom-right corner */}
      <div className="absolute bottom-8 right-12 z-50 text-[10px] font-mono text-stone-500 flex flex-col gap-1 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-1 h-1 bg-cyan-500 rounded-full" />
          <span>CORE TEMP: OPTIMAL</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1 h-1 bg-cyan-500 rounded-full" />
          <span>NETWORK: SECURE</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1 h-1 bg-cyan-500 rounded-full" />
          <span>CHASSIS INTEGRITY: 100%</span>
        </div>
      </div>

      {/* Inline styles for parallax + grid animations */}
      <style>{`
        .perspective-container { perspective: 1000px; }
        @keyframes gridMove {
          0% { background-position: 0 0; }
          100% { background-position: 0 60px; }
        }
        .grid-floor {
          background-image:
            linear-gradient(rgba(6, 182, 212, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.08) 1px, transparent 1px);
          background-size: 60px 60px;
          transform: rotateX(60deg) translateY(calc(var(--mouse-y) * -20px));
          animation: gridMove 3s linear infinite;
        }
        .schematic-container {
          transform: rotateY(calc(var(--mouse-x) * 10deg)) rotateX(calc(var(--mouse-y) * -10deg));
          transition: transform 0.12s ease-out;
        }
        .scanlines {
          background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 100% 4px;
          mix-blend-mode: overlay;
        }
      `}</style>
    </div>
  );
};

export default MainMenu;