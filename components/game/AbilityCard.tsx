
import React, { useRef, useEffect, useMemo, memo, forwardRef } from "react";

type AbilityState = "ready" | "active" | "cooldown" | "charging" | "chargingHold";

type Ability = {
  id: string;
  name: string;
  keyBinding?: string;
  state: AbilityState;
  startTime?: number;
  duration?: number;
  cooldown?: number;
  chargeStartTime?: number;
  chargeDuration?: number;
  mastered?: boolean;
};

interface Props {
  ability: Ability;
  index?: number;
  charge?: number;
  onClick?: () => void;
}

const THEMES: Record<string, { main: string; glow: string; bg: string }> = {
  overdrive: { main: "#eab308", glow: "rgba(234,179,8,0.8)", bg: "rgba(234,179,8,0.15)" }, // Yellow
  cyberBeam: { main: "#d946ef", glow: "rgba(217,70,239,0.8)", bg: "rgba(217,70,239,0.15)" }, // Fuchsia
  missileBarrage: { main: "#ef4444", glow: "rgba(239,68,68,0.8)", bg: "rgba(239,68,68,0.15)" }, // Red
  damageConverter: { main: "#8b5cf6", glow: "rgba(139,92,246,0.8)", bg: "rgba(139,92,246,0.15)" }, // Violet
  teslaStorm: { main: "#06b6d4", glow: "rgba(6,182,212,0.8)", bg: "rgba(6,182,212,0.15)" }, // Cyan
  // Boss Moves (Red Themed)
  shockwave: { main: "#ef4444", glow: "rgba(239,68,68,0.8)", bg: "rgba(239,68,68,0.15)" }, 
  poisonGas: { main: "#10b981", glow: "rgba(16,185,129,0.8)", bg: "rgba(16,185,129,0.15)" }, // Green
  mortarVolley: { main: "#ef4444", glow: "rgba(239,68,68,0.8)", bg: "rgba(239,68,68,0.15)" }, 
  laserSweep: { main: "#ef4444", glow: "rgba(239,68,68,0.8)", bg: "rgba(239,68,68,0.15)" }, 
  // Goliath Prime Expansion
  scatterMines: { main: "#f97316", glow: "rgba(249,115,22,0.8)", bg: "rgba(249,115,22,0.15)" }, // Orange
  nanoSwarm: { main: "#22c55e", glow: "rgba(34,197,94,0.8)", bg: "rgba(34,197,94,0.15)" }, // Green
  default: { main: "#00F0FF", glow: "rgba(0,240,255,0.8)", bg: "rgba(0,240,255,0.15)" },
};

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const perfNow = () => Date.now(); // Using Date.now() to match game state timestamps

const Icon = memo(({ name }: { name: string }) => {
  const icons: Record<string, React.ReactNode> = {
    Overdrive: <path d="M13 10V3L4 14h7v7l9-11h-7z" />,
    "Cyber Beam": <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />,
    "Missile Barrage": <path d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />,
    "Flux Matrix": <path d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />,
    "Tesla Storm": <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />,
    // Boss Icons
    "Shockwave": <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm-1-8h2v-2h-2v2zm0 4h2v-2h-2v2z" />, // Simple circle alert icon
    "Poison Gas": <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />, // Warning/Biohazard-ish
    "Mortar Volley": <path d="M12 3v18m-9-9h18" strokeWidth="2" strokeLinecap="round" />, // Target reticle
    "Laser Sweep": <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />, // Circle
    "Scatter Mines": <path d="M12 2l2.5 7h7.5l-6 4.5 2.5 7.5-6.5-4.5-6.5 4.5 2.5-7.5-6-4.5h7.5z" />, // Star shape
    "Nano Swarm": <path d="M4 8a2 2 0 110-4 2 2 0 010 4zm16 0a2 2 0 110-4 2 2 0 010 4zm-8 4a2 2 0 110-4 2 2 0 010 4zm0 12a2 2 0 110-4 2 2 0 010 4zm8-4a2 2 0 110-4 2 2 0 010 4zM4 16a2 2 0 110-4 2 2 0 010 4z" />, // Dots
    default: <circle cx="12" cy="12" r="8" />,
  };
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" stroke="currentColor" strokeWidth={0}>
      {icons[name] ?? icons.default}
    </svg>
  );
});

const AbilityCard = forwardRef<HTMLDivElement, Props>(({ ability, index = 0, charge, onClick }, ref) => {
  const theme = THEMES[ability.id] ?? THEMES.default;
  const barRef = useRef<HTMLDivElement | null>(null);
  const timeRef = useRef<HTMLSpanElement | null>(null);
  const statusRef = useRef<HTMLSpanElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const currentDuration = ability.mastered && ability.name === "Overdrive" ? 12000 : (ability.duration ?? 3000);
  const currentCooldown = ability.mastered && ability.name === "Overdrive" ? 15000 : (ability.cooldown ?? 8000);

  useEffect(() => {
    const loop = () => {
      const now = perfNow();
      const { state, startTime = 0, chargeStartTime = 0, chargeDuration = 2000 } = ability;
      
      // Fix for "1767..." timestamps: validation
      // If startTime is 0, we shouldn't calculate elapsed time relative to it for cooldowns/active states.
      // We assume if it's 0, it hasn't started yet or is ready.
      const isValidStart = startTime > 0;

      let progress = 0;
      let label = "READY";
      let timeLeftMs = 0;
      let barColor = theme.main;
      let labelColor = theme.main;

      if (state === "active" && isValidStart) {
        const dur = (ability.name === "Missile Barrage" || ability.name === "Tesla Storm" || ability.name === "Laser Sweep" || ability.name === "Nano Swarm") ? (ability.duration || 3000) : currentDuration;
        const elapsed = now - startTime;
        progress = clamp(1 - elapsed / dur);
        timeLeftMs = Math.max(0, dur - elapsed);
        label = "ACTIVE";
        barColor = "#ffffff";
        labelColor = "#ffffff";
      } else if (state === "cooldown" && isValidStart) {
        const elapsed = now - startTime;
        progress = clamp(elapsed / currentCooldown);
        timeLeftMs = Math.max(0, currentCooldown - elapsed);
        label = "REBOOT";
        barColor = "#334155"; // Dark Gray
        labelColor = "#64748b";
      } else if (state === "charging" || state === "chargingHold") {
        const start = state === "charging" ? startTime : chargeStartTime;
        // Validate charge start too
        if (start > 0) {
            const elapsed = now - start;
            progress = clamp(elapsed / chargeDuration);
            label = "CHARGE";
            barColor = "#ffffff";
            labelColor = "#ffffff";
        }
      } else {
        // Ready State
        progress = 1;
        label = "READY";
        barColor = theme.main;
        labelColor = theme.main;
      }

      // Update DOM
      if (barRef.current) {
        barRef.current.style.width = `${progress * 100}%`;
        barRef.current.style.backgroundColor = barColor;
        barRef.current.style.boxShadow = state === 'active' ? `0 0 10px ${theme.glow}` : 'none';
      }

      if (timeRef.current) {
        if (timeLeftMs > 0 && timeLeftMs < 300000) { // Safety check < 5 mins
             timeRef.current.textContent = (timeLeftMs / 1000).toFixed(1) + "s";
             timeRef.current.style.opacity = "1";
        } else {
             timeRef.current.textContent = "";
             timeRef.current.style.opacity = "0";
        }
      }

      if (statusRef.current) {
        statusRef.current.textContent = label;
        statusRef.current.style.color = labelColor;
      }

      // Update container border color for active state
      if (containerRef.current) {
          containerRef.current.style.borderColor = state === 'active' ? '#ffffff' : (state === 'ready' ? theme.main : 'rgba(255,255,255,0.1)');
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [ability, currentDuration, currentCooldown, theme]);

  return (
    <div 
        ref={containerRef}
        onClick={onClick}
        className="relative w-full h-[60px] bg-black/80 backdrop-blur-md border-l-[3px] border-y border-r border-y-transparent border-r-transparent mb-2 overflow-hidden transition-colors duration-200 group cursor-pointer hover:bg-white/5"
        style={{ animation: `slideIn 0.3s ease-out ${index * 0.05}s forwards`, opacity: 0 }}
    >
        <div className="flex h-full">
            {/* Left: Keybind */}
            <div className="w-10 h-full flex items-center justify-center bg-white/5 border-r border-white/5 shrink-0">
                <span className={`font-orbitron font-bold text-lg ${ability.state === 'active' ? 'text-white' : 'text-stone-500'}`}>
                    {ability.keyBinding}
                </span>
            </div>

            {/* Middle: Content */}
            <div className="flex-1 flex flex-col justify-center px-3 min-w-0">
                <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className={`${ability.state === 'ready' ? `text-[${theme.main}]` : 'text-stone-400'}`} style={{ color: ability.state === 'ready' ? theme.main : undefined }}>
                            <Icon name={ability.name} />
                        </div>
                        <span className={`font-rajdhani font-bold uppercase truncate ${ability.state === 'active' ? 'text-white' : 'text-stone-300'}`}>
                            {ability.name}
                        </span>
                    </div>
                    
                    <div className="flex flex-col items-end shrink-0 ml-2">
                        <span ref={timeRef} className="font-mono font-bold text-xs text-white leading-none mb-0.5"></span>
                        <span ref={statusRef} className="font-bold text-[9px] tracking-wider uppercase leading-none"></span>
                    </div>
                </div>

                {/* Bars */}
                {ability.id === 'damageConverter' && charge !== undefined ? (
                    /* Flux Meter */
                    <div className="flex gap-[2px] h-1.5 w-full mt-1">
                        {Array.from({ length: 10 }).map((_, i) => {
                            // 50 max charge -> 5 per block
                            const isActive = (i + 1) * 5 <= charge;
                            return (
                                <div 
                                    key={i} 
                                    className={`flex-1 rounded-[1px] transition-colors duration-200 ${isActive ? 'bg-violet-500 shadow-[0_0_5px_#8b5cf6]' : 'bg-stone-800'}`}
                                />
                            );
                        })}
                    </div>
                ) : (
                    /* Standard Bar */
                    <div className="h-1 w-full bg-stone-800 rounded-sm overflow-hidden mt-1">
                        <div ref={barRef} className="h-full w-full origin-left" />
                    </div>
                )}
            </div>
        </div>

        {/* Scanline overlay when active */}
        {ability.state === 'active' && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.5s_infinite] pointer-events-none" />
        )}
        
        {/* Background glow for ready state */}
        {ability.state === 'ready' && (
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundColor: theme.main }} />
        )}
    </div>
  );
});

AbilityCard.displayName = "AbilityCard";

export default memo(AbilityCard);
