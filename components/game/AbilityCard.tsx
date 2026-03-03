// components/game/AbilityCard.tsx
import React, { useRef, useEffect, memo, forwardRef } from "react";

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
  overdrive: { main: "#eab308", glow: "rgba(234,179,8,0.85)", bg: "rgba(234,179,8,0.08)" },
  cyberBeam: { main: "#d946ef", glow: "rgba(217,70,239,0.85)", bg: "rgba(217,70,239,0.08)" },
  missileBarrage: { main: "#ef4444", glow: "rgba(239,68,68,0.85)", bg: "rgba(239,68,68,0.08)" },
  damageConverter: { main: "#8b5cf6", glow: "rgba(139,92,246,0.9)", bg: "rgba(139,92,246,0.06)" },
  teslaStorm: { main: "#06b6d4", glow: "rgba(6,182,212,0.85)", bg: "rgba(6,182,212,0.06)" },
  shockwave: { main: "#ef4444", glow: "rgba(239,68,68,0.85)", bg: "rgba(239,68,68,0.08)" },
  poisonGas: { main: "#10b981", glow: "rgba(16,185,129,0.85)", bg: "rgba(16,185,129,0.06)" },
  mortarVolley: { main: "#ef4444", glow: "rgba(239,68,68,0.85)", bg: "rgba(239,68,68,0.08)" },
  laserSweep: { main: "#ef4444", glow: "rgba(239,68,68,0.85)", bg: "rgba(239,68,68,0.08)" },
  scatterMines: { main: "#f97316", glow: "rgba(249,115,22,0.85)", bg: "rgba(249,115,22,0.06)" },
  nanoSwarm: { main: "#22c55e", glow: "rgba(34,197,94,0.85)", bg: "rgba(34,197,94,0.06)" },
  counterSurge: { main: "#fbbf24", glow: "rgba(251,191,36,0.85)", bg: "rgba(251,191,36,0.06)" }, // Amber
  phaseShift: { main: "#a855f7", glow: "rgba(168,85,247,0.85)", bg: "rgba(168,85,247,0.06)" },
  shadowStrike: { main: "#a855f7", glow: "rgba(168,85,247,0.85)", bg: "rgba(168,85,247,0.06)" },
  smokeBomb: { main: "#64748b", glow: "rgba(100,116,139,0.85)", bg: "rgba(100,116,139,0.06)" },
  venomBlade: { main: "#10b981", glow: "rgba(16,185,129,0.85)", bg: "rgba(16,185,129,0.06)" },
  default: { main: "#00F0FF", glow: "rgba(0,240,255,0.85)", bg: "rgba(0,240,255,0.06)" },
};

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const perfNow = () => Date.now();

const Icon = memo(({ name }: { name: string }) => {
  const icons: Record<string, React.ReactNode> = {
    Overdrive: <path d="M13 10V3L4 14h7v7l9-11h-7z" />,
    "Cyber Beam": <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />,
    "Missile Barrage": <path d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />,
    "Flux Matrix": <path d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />,
    "Tesla Storm": <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />,
    Shockwave: <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm-1-8h2v-2h-2v2zm0 4h2v-2h-2v2z" />,
    "Poison Gas": <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />,
    "Mortar Volley": <path d="M12 3v18m-9-9h18" strokeWidth="2" strokeLinecap="round" />,
    "Laser Sweep": <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />,
    "Scatter Mines": <path d="M12 2l2.5 7h7.5l-6 4.5 2.5 7.5-6.5-4.5-6.5 4.5 2.5-7.5-6-4.5h7.5z" />,
    "Nano Swarm": <path d="M4 8a2 2 0 110-4 2 2 0 010 4zm16 0a2 2 0 110-4 2 2 0 010 4zm-8 4a2 2 0 110-4 2 2 0 010 4zm0 12a2 2 0 110-4 2 2 0 010 4zm8-4a2 2 0 110-4 2 2 0 010 4zM4 16a2 2 0 110-4 2 2 0 010 4z" />,
    Counter: <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3zm0 18c-3.15-1.05-6-4.96-6-9.14V6.3l6-2.25 6 2.25v4.56c0 4.18-2.85 8.09-6 9.14z" />, // Shield
    "Phase Shift": <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM12 6a4 4 0 110 8 4 4 0 010-8z" />,
    "Shadow Strike": <path d="M2 22l8-8 4 4 8-16-16 8 4 4-8 8z" />,
    "Smoke Bomb": <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm-3-9a3 3 0 106 0 3 3 0 00-6 0z" />,
    "Venom Blade": <path d="M12 2L4 10l8 12 8-12L12 2zm0 18.5L5.5 10 12 3.5 18.5 10 12 20.5z" />,
    default: <circle cx="12" cy="12" r="8" />,
  };

  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden>
      {icons[name] ?? icons.default}
    </svg>
  );
});

const KeyDisplay = ({ binding, active }: { binding?: string; active: boolean }) => {
  if (!binding) return null;
  
  const isSpace = binding.toUpperCase() === "SPACE";
  const colorClass = active ? "text-white" : "text-stone-500";
  const activeGlow = active ? "drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]" : "";

  if (isSpace) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${colorClass} ${activeGlow}`}>
        <path d="M19 13H5v3h14v-3z" />
      </svg>
    );
  }

  return (
    <span className={`font-orbitron font-bold text-sm ${colorClass} ${activeGlow}`}>
      {binding}
    </span>
  );
};

const AbilityCard = forwardRef<HTMLDivElement, Props>(({ ability, index = 0, charge, onClick }, ref) => {
  const theme = THEMES[ability.id] ?? THEMES.default;
  const barRef = useRef<HTMLDivElement | null>(null);
  const timeRef = useRef<HTMLSpanElement | null>(null);
  const statusRef = useRef<HTMLSpanElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const currentDuration = ability.duration ?? 3000;
  const currentCooldown = ability.cooldown ?? 8000;

  useEffect(() => {
    let lastProgress = -1;

    const loop = () => {
      const now = perfNow();
      const { state, startTime = 0, chargeStartTime = 0, chargeDuration = 2000 } = ability;

      const isValidStart = startTime > 0;

      let progress = 0;
      let label = "READY";
      let timeLeftMs = 0;
      let barColor = theme.main;
      let labelColor = theme.main;

      if (state === "active" && isValidStart) {
        const dur = currentDuration;
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
        barColor = "#1f2937"; // darker
        labelColor = "#94a3b8";
      } else if (state === "charging" || state === "chargingHold") {
        const start = state === "charging" ? startTime : chargeStartTime;
        if (start > 0) {
          const elapsed = now - start;
          progress = clamp(elapsed / chargeDuration);
          label = "CHARGING";
          barColor = "#ffffff";
          labelColor = "#fff";
          timeLeftMs = Math.max(0, chargeDuration - elapsed);
        } else {
          progress = 0;
          label = "CHARGE";
        }
      } else {
        progress = 1;
        label = "READY";
        barColor = theme.main;
        labelColor = theme.main;
      }

      // Only mutate DOM when something changed enough
      if (barRef.current && Math.abs(progress - lastProgress) > 0.001) {
        barRef.current.style.width = `${progress * 100}%`;
        barRef.current.style.background = state === "active"
          ? `linear-gradient(90deg, ${theme.glow}, ${theme.main})`
          : `linear-gradient(90deg, ${theme.main}, rgba(255,255,255,0.08))`;
        barRef.current.style.boxShadow = state === "active" ? `0 4px 18px ${theme.glow}` : "none";
        lastProgress = progress;
      }

      if (timeRef.current) {
        if (timeLeftMs > 0 && timeLeftMs < 300000) {
          timeRef.current.textContent = `${(timeLeftMs / 1000).toFixed(1)}s`;
          timeRef.current.style.opacity = "1";
        } else {
          timeRef.current.textContent = "";
          timeRef.current.style.opacity = "0";
        }
      }

      if (statusRef.current) {
        statusRef.current.textContent = label;
        statusRef.current.style.color = labelColor;
        statusRef.current.style.opacity = "1";
      }

      if (containerRef.current) {
        const borderGradient = state === "active"
          ? `0 0 18px ${theme.glow}`
          : ability.state === "ready"
          ? `0 0 8px ${theme.main}33`
          : "none";
        containerRef.current.style.boxShadow = borderGradient;
        containerRef.current.style.borderLeft = `4px solid ${ability.state === "ready" ? theme.main : ability.state === "active" ? "#fff" : "rgba(255,255,255,0.06)"}`;
        containerRef.current.style.background = ability.state === "active" ? "linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))" : "rgba(0,0,0,0.55)";
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [ability, currentDuration, currentCooldown, theme]);

  // small accessibility label for keybind
  const keyTitle = ability.keyBinding ? `Key: ${ability.keyBinding}` : ability.name;

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      title={keyTitle}
      aria-label={`${ability.name} ability card`}
      className="relative w-full h-[56px] bg-black/60 backdrop-blur-md border-l-4 mb-2 overflow-hidden transition-all duration-200 group cursor-pointer hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-offset-1"
      style={{
        transformOrigin: "left",
        animation: `fadeSlide .28s ease-out ${index * 0.04}s both`,
        borderLeftColor: ability.state === "ready" ? (THEMES[ability.id]?.main ?? THEMES.default.main) : ability.state === "active" ? "#fff" : "rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex h-full items-center relative z-10">
        {/* Keybind */}
        <div className="w-10 h-full flex items-center justify-center bg-black/40 border-r border-white/5 shrink-0">
          <KeyDisplay binding={ability.keyBinding} active={ability.state === "active"} />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center px-3 min-w-0">
          <div className="flex justify-between items-end mb-1">
            <div className="flex items-center gap-2 min-w-0 overflow-hidden">
              <div
                className="w-8 h-8 flex items-center justify-center rounded-sm shrink-0 transition-transform duration-300 group-hover:rotate-3"
                style={{
                  background: `linear-gradient(135deg, ${theme.bg}, rgba(255,255,255,0.01))`,
                  boxShadow: `0 0 10px ${theme.glow}`,
                  border: `1px solid ${ability.state === "ready" ? theme.main : "transparent"}`,
                  color: ability.state === "ready" ? theme.main : "white",
                }}
              >
                <Icon name={ability.name} />
              </div>

              <div className="min-w-0 flex flex-col">
                <div className={`font-orbitron font-bold text-[11px] tracking-widest uppercase truncate ${ability.state === "active" ? "text-white" : "text-stone-200"}`}>
                  {ability.name}
                </div>
                {ability.mastered && (
                   <div className="text-[9px] text-yellow-500/80 font-mono tracking-tighter leading-none" aria-hidden>
                     MASTERED
                   </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end shrink-0 ml-2">
              <span ref={timeRef} className="font-mono font-semibold text-xs text-white leading-none opacity-0 transition-opacity" />
              <span ref={statusRef} className="font-bold text-[9px] tracking-wider uppercase leading-none mt-1 opacity-0 transition-opacity" />
            </div>
          </div>

          {/* Bars */}
          {ability.id === "damageConverter" && charge !== undefined ? (
            // Flux / Damage Converter - segmented charge + animated pulse
            <div className="relative w-full h-2 flex items-center gap-1">
              <div className="absolute inset-0 rounded-sm overflow-hidden" aria-hidden>
                <div
                  className="h-full w-full"
                  style={{
                    background: "linear-gradient(90deg, rgba(139,92,246,0.06), rgba(6,182,212,0.02))",
                    filter: "blur(8px)",
                    opacity: 0.55,
                    transform: "scaleY(1.1)",
                  }}
                />
              </div>

              <div className="relative z-10 flex gap-[4px] w-full">
                {Array.from({ length: 10 }).map((_, i) => {
                  const threshold = (i + 1) * 5;
                  const isActive = threshold <= (charge ?? 0);
                  return (
                    <div
                      key={i}
                      className={`flex-1 h-2 rounded-sm transform transition-all duration-200 ${isActive ? "scale-y-[1.06]" : "scale-y-100"}`}
                      style={{
                        background: isActive
                          ? `linear-gradient(90deg, ${theme.glow}, ${theme.main})`
                          : "linear-gradient(90deg,#0f172a,#071226)",
                        boxShadow: isActive ? `0 6px 18px ${theme.glow}` : "none",
                      }}
                    />
                  );
                })}
              </div>

              {/* Charge label */}
              <div className="absolute right-0 top-[-12px] text-[10px] font-mono font-semibold text-stone-200 bg-black/50 px-2 py-[2px] rounded-md backdrop-blur-sm">
                {charge ?? 0}%
              </div>
            </div>
          ) : (
            // Standard progress bar
            <div className="h-2 w-full bg-stone-800 overflow-hidden rounded-sm relative">
              <div ref={barRef} className="h-full w-full origin-left transition-all duration-100 rounded-sm" style={{ width: "100%" }} />
            </div>
          )}
        </div>
      </div>

      {/* Active overlay / shimmer */}
      {ability.state === "active" && (
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
          style={{
            background: `linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.04))`,
            mixBlendMode: "overlay",
            boxShadow: `inset 0 0 40px ${theme.glow}`,
            zIndex: 2,
          }}
        />
      )}

      {/* Ready glow */}
      {ability.state === "ready" && (
        <div
          className="absolute inset-0 opacity-6 pointer-events-none"
          aria-hidden
          style={{
            background: theme.bg,
            zIndex: 0,
            filter: "blur(2px)",
          }}
        />
      )}

      {/* micro styles used by animation - define inline to avoid missing CSS */}
      <style>{`
        @keyframes fadeSlide {
          0% { opacity: 0; transform: translateX(-8px) }
          60% { opacity: 1; transform: translateX(2px) }
          100% { transform: translateX(0) }
        }
      `}</style>
    </div>
  );
});

AbilityCard.displayName = "AbilityCard";

export default memo(AbilityCard);