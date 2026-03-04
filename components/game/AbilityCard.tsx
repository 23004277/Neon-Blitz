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
  mousePos?: { x: number; y: number };
  onClick?: () => void;
}

const DESCRIPTIONS: Record<string, string> = {
  overdrive: "Boosts movement speed and fire rate.",
  cyberBeam: "Fires a continuous high-damage laser.",
  missileBarrage: "Launches a swarm of homing missiles.",
  damageConverter: "Converts incoming damage into energy.",
  teslaStorm: "Creates an area of continuous electrical damage.",
  shockwave: "Pushes enemies back in a wide cone.",
  poisonGas: "Creates a toxic cloud that damages over time.",
  mortarVolley: "Fires explosive shells in a high arc.",
  laserSweep: "Sweeps a destructive laser beam horizontally.",
  scatterMines: "Deploys a field of proximity mines.",
  nanoSwarm: "Releases nanobots that repair hull integrity.",
  counterSurge: "Absorbs a hit and reflects damage back.",
  phaseShift: "Briefly become invulnerable and pass through enemies.",
  shadowStrike: "Teleports to a target and deals massive damage.",
  smokeBomb: "Creates a smokescreen that breaks enemy tracking.",
  venomBlade: "A close-range strike that applies severe poison.",
  rapidBlast: "Fires a quick burst of high-damage projectiles.",
  shieldSlam: "Dashes forward, damaging and stunning enemies.",
  toxicSpray: "Sprays corrosive acid in a frontal cone.",
  empPulse: "Disables enemy shields and abilities temporarily.",
  flamethrower: "Projects a continuous cone of fire.",
  chainLightning: "Fires a bolt that arcs between multiple targets.",
  prismGuard: "Deploys a multi-directional energy shield.",
  lightningDash: "Dashes quickly, leaving a damaging trail.",
  emOverload: "Releases a burst of electromagnetic energy.",
  staticVeil: "Creates a barrier that slows enemy projectiles.",
  voltLock: "Tethers enemies, restricting their movement.",
  overdriveCore: "Overclocks all systems for maximum output.",
  conductiveField: "Electrifies the ground, damaging moving enemies."
};

const THEMES: Record<string, { main: string; glow: string; bg: string; accent: string; type: string }> = {
  overdrive: { main: "#eab308", glow: "rgba(234,179,8,0.85)", bg: "rgba(234,179,8,0.08)", accent: "#fde047", type: "UTILITY" },
  cyberBeam: { main: "#ef4444", glow: "rgba(239,68,68,0.85)", bg: "rgba(239,68,68,0.08)", accent: "#fecaca", type: "OFFENSIVE" },
  missileBarrage: { main: "#ef4444", glow: "rgba(239,68,68,0.85)", bg: "rgba(239,68,68,0.08)", accent: "#fecaca", type: "OFFENSIVE" },
  damageConverter: { main: "#3b82f6", glow: "rgba(59,130,246,0.9)", bg: "rgba(59,130,246,0.06)", accent: "#bfdbfe", type: "DEFENSIVE" },
  teslaStorm: { main: "#06b6d4", glow: "rgba(6,182,212,0.85)", bg: "rgba(6,182,212,0.06)", accent: "#cffafe", type: "OFFENSIVE" },
  shockwave: { main: "#f97316", glow: "rgba(249,115,22,0.85)", bg: "rgba(249,115,22,0.06)", accent: "#ffedd5", type: "OFFENSIVE" },
  poisonGas: { main: "#22c55e", glow: "rgba(34,197,94,0.85)", bg: "rgba(34,197,94,0.06)", accent: "#dcfce7", type: "OFFENSIVE" },
  mortarVolley: { main: "#ef4444", glow: "rgba(239,68,68,0.85)", bg: "rgba(239,68,68,0.08)", accent: "#fecaca", type: "OFFENSIVE" },
  laserSweep: { main: "#ef4444", glow: "rgba(239,68,68,0.85)", bg: "rgba(239,68,68,0.08)", accent: "#fecaca", type: "OFFENSIVE" },
  scatterMines: { main: "#f97316", glow: "rgba(249,115,22,0.85)", bg: "rgba(249,115,22,0.06)", accent: "#ffedd5", type: "DEFENSIVE" },
  nanoSwarm: { main: "#10b981", glow: "rgba(16,185,129,0.85)", bg: "rgba(16,185,129,0.06)", accent: "#d1fae5", type: "UTILITY" },
  counterSurge: { main: "#3b82f6", glow: "rgba(59,130,246,0.85)", bg: "rgba(59,130,246,0.06)", accent: "#bfdbfe", type: "DEFENSIVE" },
  phaseShift: { main: "#a855f7", glow: "rgba(168,85,247,0.85)", bg: "rgba(168,85,247,0.06)", accent: "#f3e8ff", type: "UTILITY" },
  shadowStrike: { main: "#a855f7", glow: "rgba(168,85,247,0.85)", bg: "rgba(168,85,247,0.06)", accent: "#f3e8ff", type: "OFFENSIVE" },
  smokeBomb: { main: "#64748b", glow: "rgba(100,116,139,0.85)", bg: "rgba(100,116,139,0.06)", accent: "#f1f5f9", type: "UTILITY" },
  venomBlade: { main: "#22c55e", glow: "rgba(34,197,94,0.85)", bg: "rgba(34,197,94,0.06)", accent: "#dcfce7", type: "OFFENSIVE" },
  rapidBlast: { main: "#facc15", glow: "rgba(250,204,21,0.85)", bg: "rgba(250,204,21,0.08)", accent: "#fef9c3", type: "OFFENSIVE" },
  shieldSlam: { main: "#38bdf8", glow: "rgba(56,189,248,0.85)", bg: "rgba(56,189,248,0.08)", accent: "#e0f2fe", type: "DEFENSIVE" },
  toxicSpray: { main: "#22c55e", glow: "rgba(34,197,94,0.85)", bg: "rgba(34,197,94,0.06)", accent: "#dcfce7", type: "OFFENSIVE" },
  empPulse: { main: "#a855f7", glow: "rgba(168,85,247,0.85)", bg: "rgba(168,85,247,0.06)", accent: "#f3e8ff", type: "UTILITY" },
  flamethrower: { main: "#f97316", glow: "rgba(249,115,22,0.85)", bg: "rgba(249,115,22,0.06)", accent: "#ffedd5", type: "OFFENSIVE" },
  chainLightning: { main: "#06b6d4", glow: "rgba(6,182,212,0.85)", bg: "rgba(6,182,212,0.06)", accent: "#cffafe", type: "OFFENSIVE" },
  prismGuard: { main: "#d946ef", glow: "rgba(217,70,239,0.85)", bg: "rgba(217,70,239,0.08)", accent: "#f5d0fe", type: "DEFENSIVE" },
  lightningDash: { main: "#eab308", glow: "rgba(234,179,8,0.85)", bg: "rgba(234,179,8,0.08)", accent: "#fde047", type: "UTILITY" },
  emOverload: { main: "#0ea5e9", glow: "rgba(14,165,233,0.85)", bg: "rgba(14,165,233,0.06)", accent: "#e0f2fe", type: "OFFENSIVE" },
  staticVeil: { main: "#a855f7", glow: "rgba(168,85,247,0.85)", bg: "rgba(168,85,247,0.06)", accent: "#f3e8ff", type: "DEFENSIVE" },
  voltLock: { main: "#eab308", glow: "rgba(234,179,8,0.85)", bg: "rgba(234,179,8,0.08)", accent: "#fde047", type: "DEFENSIVE" },
  overdriveCore: { main: "#eab308", glow: "rgba(234,179,8,0.85)", bg: "rgba(234,179,8,0.08)", accent: "#fde047", type: "UTILITY" },
  conductiveField: { main: "#0ea5e9", glow: "rgba(14,165,233,0.85)", bg: "rgba(14,165,233,0.06)", accent: "#e0f2fe", type: "DEFENSIVE" },
  default: { main: "#00F0FF", glow: "rgba(0,240,255,0.85)", bg: "rgba(0,240,255,0.06)", accent: "#E0FFFF", type: "SYSTEM" },
};

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));

const Icon = memo(({ name }: { name: string }) => {
  const icons: Record<string, React.ReactNode> = {
    Overdrive: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth="1.5" fill="none" />
        <path d="M13 10V3L4 14h7v7l9-11h-7z" fill="currentColor" opacity="0.3" />
      </>
    ),
    "Cyber Beam": (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" strokeWidth="1.5" fill="none" />
        <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" fill="currentColor" opacity="0.3" />
      </>
    ),
    "Missile Barrage": (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" strokeWidth="1.5" fill="none" />
        <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.5" />
      </>
    ),
    "Flux Matrix": (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" strokeWidth="1.5" fill="none" />
        <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.3" />
      </>
    ),
    "Tesla Storm": (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeWidth="1.5" fill="none" />
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" fill="none" opacity="0.5" />
      </>
    ),
    Shockwave: (
      <>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" fill="none" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
      </>
    ),
    "Poison Gas": (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3M3 12h3m12 0h3M5.636 5.636l2.122 2.122M16.243 16.243l2.122 2.122M5.636 18.364l2.122-2.122M16.243 7.757l2.122-2.122" strokeWidth="1.5" fill="none" />
        <circle cx="12" cy="12" r="5" fill="currentColor" opacity="0.4" />
      </>
    ),
    "Mortar Volley": (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m-7 7l7-7 7 7" strokeWidth="1.5" fill="none" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 19h14" strokeWidth="2" fill="none" />
      </>
    ),
    "Laser Sweep": (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M12 3v18" strokeWidth="1.5" fill="none" opacity="0.5" />
        <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
      </>
    ),
    "Scatter Mines": (
      <>
        <circle cx="12" cy="12" r="4" fill="currentColor" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4m0 12v4M2 12h4m12 0h4M4.929 4.929l2.828 2.828m8.486 8.486l2.828 2.828M4.929 19.071l2.828-2.828m8.486-8.486l2.828-2.828" strokeWidth="1.5" fill="none" />
      </>
    ),
    "Nano Swarm": (
      <>
        <circle cx="8" cy="8" r="2" fill="currentColor" />
        <circle cx="16" cy="8" r="2" fill="currentColor" />
        <circle cx="12" cy="16" r="2" fill="currentColor" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10l4 4 4-4" strokeWidth="1" fill="none" opacity="0.5" />
      </>
    ),
    Counter: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6-8 10-8 10z" strokeWidth="1.5" fill="none" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" strokeWidth="1.5" fill="none" />
      </>
    ),
    "Phase Shift": (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth="1.5" fill="none" strokeDasharray="4 2" />
        <path d="M13 10V3L4 14h7v7l9-11h-7z" fill="currentColor" opacity="0.2" />
      </>
    ),
    "Shadow Strike": (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2 22l8-8 4 4 8-16-16 8 4 4-8 8z" strokeWidth="1.5" fill="none" />
        <path d="M2 22l8-8 4 4 8-16-16 8 4 4-8 8z" fill="currentColor" opacity="0.3" />
      </>
    ),
    "Smoke Bomb": (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a10 10 0 100 20 10 10 0 000-20z" strokeWidth="1.5" fill="none" strokeDasharray="4 4" />
        <circle cx="12" cy="12" r="6" fill="currentColor" opacity="0.4" />
      </>
    ),
    "Venom Blade": (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L4 10l8 12 8-12L12 2z" strokeWidth="1.5" fill="none" />
        <path d="M12 2L4 10l8 12 8-12L12 2z" fill="currentColor" opacity="0.4" />
      </>
    ),
    "Rapid Blast": (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth="1.5" fill="none" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 10l3-3m-3 7l3 3M7 10l-3-3m3 7l-3 3" strokeWidth="1.5" fill="none" opacity="0.5" />
      </>
    ),
    "Shield Slam": (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6-8 10-8 10z" strokeWidth="1.5" fill="none" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8m-4-4h8" strokeWidth="2" fill="none" />
      </>
    ),
    "Toxic Spray": (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14a4 4 0 100-8 4 4 0 000 8z" strokeWidth="1.5" fill="none" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v8m-4-4h8" strokeWidth="1.5" fill="none" />
        <circle cx="12" cy="10" r="2" fill="currentColor" />
      </>
    ),
    "EMP Pulse": (
      <>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" fill="none" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" fill="currentColor" />
      </>
    ),
    Flamethrower: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2c-4 0-7 3-7 7 0 3 2 5 4 7v4c0 1 1 2 2 2s2-1 2-2v-4c2-2 4-4 4-7 0-4-3-7-7-7z" strokeWidth="1.5" fill="none" />
        <path d="M12 10c-1.5 0-2.5 1-2.5 2.5S10.5 15 12 15s2.5-1 2.5-2.5S13.5 10 12 10z" fill="currentColor" />
      </>
    ),
    "Chain Lightning": (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth="1.5" fill="none" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 14l-4-4 4-4M4 14l4-4-4-4" strokeWidth="1.5" fill="none" opacity="0.5" />
      </>
    ),
    "Prism Guard": (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth="1.5" fill="none" />
        <path d="M12 12l-10-5v10l10 5z" fill="currentColor" opacity="0.2" />
      </>
    ),
    "Lightning Dash": (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth="1.5" fill="none" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12H2m19 0h-3" strokeWidth="2" fill="none" opacity="0.5" />
      </>
    ),
    "EM Overload": (
      <>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" strokeWidth="1.5" fill="none" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
      </>
    ),
    "Static Veil": (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6-8 10-8 10z" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8m-4-4h8" strokeWidth="1.5" fill="none" opacity="0.5" />
      </>
    ),
    "Volt Lock": (
      <>
        <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0v4" strokeWidth="1.5" fill="none" />
        <circle cx="12" cy="16" r="1.5" fill="currentColor" />
      </>
    ),
    "Overdrive Core": (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" strokeWidth="1.5" fill="none" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16a4 4 0 100-8 4 4 0 000 8z" strokeWidth="1.5" fill="none" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
      </>
    ),
    "Conductive Field": (
      <>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 4" fill="none" />
        <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
      </>
    ),
    default: (
      <>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="12" cy="12" r="3" fill="currentColor" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden stroke="currentColor">
      {icons[name] ?? icons.default}
    </svg>
  );
});

const KeyDisplay = ({ binding, active }: { binding?: string; active: boolean }) => {
  if (!binding) return null;
  
  const isSpace = binding.toUpperCase() === "SPACE";
  const colorClass = active ? "text-white" : "text-stone-500";
  const activeGlow = active ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]" : "";

  return (
    <div className={`relative flex items-center justify-center w-6 h-6 border rounded-sm transition-all duration-300 ${active ? 'border-white bg-white/20' : 'border-stone-800 bg-black/40'} ${activeGlow}`}>
      <span className={`font-orbitron font-bold text-[9px] ${colorClass}`}>
        {isSpace ? "SPC" : binding}
      </span>
      {/* Micro-screws for hardware feel */}
      <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 rounded-full bg-stone-800" />
      <div className="absolute top-0.5 right-0.5 w-0.5 h-0.5 rounded-full bg-stone-800" />
      <div className="absolute bottom-0.5 left-0.5 w-0.5 h-0.5 rounded-full bg-stone-800" />
      <div className="absolute bottom-0.5 right-0.5 w-0.5 h-0.5 rounded-full bg-stone-800" />
    </div>
  );
};

const AbilityCard = forwardRef<HTMLDivElement, Props>(({ ability, index = 0, charge, mousePos, onClick }, ref) => {
  const theme = THEMES[ability.id] ?? THEMES.default;
  const barRef = useRef<HTMLDivElement | null>(null);
  const timeRef = useRef<HTMLSpanElement | null>(null);
  const statusRef = useRef<HTMLSpanElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cooldownOverlayRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  
  // Use refs for state to avoid closure issues in RAF loop
  const stateRef = useRef(ability.state);
  const startTimeRef = useRef(ability.startTime || 0);
  const chargeStartTimeRef = useRef(ability.chargeStartTime || 0);

  useEffect(() => {
    stateRef.current = ability.state;
    startTimeRef.current = ability.startTime || 0;
    chargeStartTimeRef.current = ability.chargeStartTime || 0;
  }, [ability.state, ability.startTime, ability.chargeStartTime]);

  const currentDuration = ability.duration ?? 3000;
  const currentCooldown = ability.cooldown ?? 8000;

  useEffect(() => {
    let lastProgress = -1;
    let lastLabel = "";

    const loop = () => {
      const now = Date.now();
      const state = stateRef.current;
      const startTime = startTimeRef.current;
      const chargeStartTime = chargeStartTimeRef.current;
      const chargeDuration = ability.chargeDuration || 2000;

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
        barColor = "#1f2937";
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

      if (barRef.current && Math.abs(progress - lastProgress) > 0.0005) {
        barRef.current.style.width = `${progress * 100}%`;
        if (state === "active") {
          barRef.current.style.background = `linear-gradient(90deg, #fff, ${theme.main})`;
          barRef.current.style.boxShadow = `0 0 10px ${theme.glow}`;
        } else if (state === "cooldown") {
          barRef.current.style.background = `linear-gradient(90deg, ${theme.main}44, ${theme.main}11)`;
          barRef.current.style.boxShadow = "none";
        } else {
          barRef.current.style.background = `linear-gradient(90deg, ${theme.main}, ${theme.main}66)`;
          barRef.current.style.boxShadow = `0 0 5px ${theme.glow}44`;
        }
        lastProgress = progress;
      }

      if (timeRef.current) {
        if (timeLeftMs > 0 && timeLeftMs < 300000) {
          const text = (timeLeftMs / 1000).toFixed(1);
          if (timeRef.current.textContent !== text) {
            timeRef.current.textContent = text;
          }
          timeRef.current.style.opacity = "1";
        } else {
          timeRef.current.style.opacity = "0";
        }
      }

      if (statusRef.current && lastLabel !== label) {
        statusRef.current.textContent = label;
        statusRef.current.style.color = labelColor;
        lastLabel = label;
      }

      if (containerRef.current) {
        const isActive = state === "active";
        const isReady = state === "ready";
        
        containerRef.current.style.borderColor = isActive ? "#fff" : isReady ? `${theme.main}44` : "rgba(255,255,255,0.05)";
        containerRef.current.style.background = isActive 
          ? `linear-gradient(90deg, ${theme.main}22, transparent)` 
          : isReady 
          ? `linear-gradient(90deg, rgba(0,0,0,0.8), rgba(0,0,0,0.4))`
          : "rgba(0,0,0,0.6)";
        
        if (isActive) {
          containerRef.current.style.boxShadow = `inset 0 0 10px ${theme.glow}33, 0 0 5px ${theme.glow}22`;
        } else {
          containerRef.current.style.boxShadow = "none";
        }
      }

      if (cooldownOverlayRef.current) {
        if (state === "cooldown") {
          cooldownOverlayRef.current.style.height = `${(1 - progress) * 100}%`;
          cooldownOverlayRef.current.style.opacity = "1";
        } else {
          cooldownOverlayRef.current.style.opacity = "0";
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [currentDuration, currentCooldown, theme, ability.chargeDuration]);

  const keyTitle = ability.keyBinding ? `Key: ${ability.keyBinding}` : ability.name;
  const isActive = ability.state === "active";

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
      className="relative w-full h-[64px] border-l-2 transition-all duration-300 group cursor-pointer hover:translate-x-1 hover:z-50 focus:outline-none"
      style={{
        transformOrigin: "left",
        animation: `abilityEntry .4s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.05}s both`,
      }}
    >
      {/* Background Scanline Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-r-sm">
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
      </div>

      {/* Tooltip */}
      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 w-48 p-2.5 bg-black/95 border border-white/10 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[100] shadow-[0_0_20px_rgba(0,0,0,0.8)] backdrop-blur-md">
         <div className="flex items-center gap-2 mb-1">
             <div className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: theme.main, boxShadow: `0 0 5px ${theme.glow}` }} />
             <div className="text-[10px] font-orbitron font-bold text-white tracking-wider uppercase">{ability.name}</div>
         </div>
         <div className="text-[9px] font-mono text-stone-400 leading-relaxed">{DESCRIPTIONS[ability.id] || "Tactical ability."}</div>
      </div>

      <div className="flex h-full items-center relative z-10">
        {/* Keybind Area */}
        <div className="w-8 h-full flex flex-col items-center justify-center border-r border-white/5 bg-black/20 shrink-0">
          <KeyDisplay binding={ability.keyBinding} active={isActive} />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-center px-3 min-w-0">
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Icon Container */}
              <div
                className="w-8 h-8 flex items-center justify-center rounded-sm shrink-0 transition-all duration-500 relative overflow-hidden"
                style={{
                  background: isActive ? theme.main : "rgba(0,0,0,0.4)",
                  border: `1px solid ${ability.state === "ready" ? theme.main : "rgba(255,255,255,0.1)"}`,
                  color: isActive ? "#000" : ability.state === "ready" ? theme.main : "rgba(255,255,255,0.3)",
                  boxShadow: ability.state === "ready" ? `0 0 5px ${theme.glow}44` : "none",
                }}
              >
                <Icon name={ability.name} />
                
                {/* Cooldown Overlay */}
                <div 
                    ref={cooldownOverlayRef}
                    className="absolute bottom-0 left-0 w-full bg-black/70 backdrop-blur-[1px] transition-none"
                    style={{ height: '0%', opacity: 0 }}
                />
              </div>

              <div className="min-w-0 flex flex-col">
                <div className={`font-orbitron font-bold text-[11px] tracking-wider uppercase truncate transition-colors duration-300 ${isActive ? "text-white" : "text-stone-200"}`}>
                  {ability.name}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                   <span className="text-[7px] font-mono tracking-widest uppercase" style={{ color: theme.main }}>{theme.type}</span>
                   <span className="text-stone-600 text-[8px] leading-none">|</span>
                   <span ref={statusRef} className="font-bold text-[7px] tracking-widest uppercase leading-none" />
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end shrink-0">
              <span ref={timeRef} className="font-orbitron font-bold text-[11px] text-white tabular-nums tracking-tighter" />
            </div>
          </div>

          {/* Progress */}
          <div className="w-full mt-0.5">
            <div className="relative h-1.5 w-full bg-stone-900/80 rounded-sm overflow-hidden border border-white/5">
                {ability.id === "damageConverter" && charge !== undefined ? (
                  <div className="h-full flex gap-[1px]">
                    {Array.from({ length: 12 }).map((_, i) => {
                      const threshold = (i + 1) * 8.33;
                      const activeSeg = threshold <= (charge ?? 0);
                      return (
                        <div
                          key={i}
                          className="flex-1 h-full transition-all duration-300"
                          style={{
                            background: activeSeg ? theme.main : "rgba(255,255,255,0.03)",
                            boxShadow: activeSeg ? `0 0 5px ${theme.glow}` : "none",
                          }}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div ref={barRef} className="h-full w-full origin-left transition-all duration-100" />
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Active State Pulse Ring */}
      {isActive && (
        <div className="absolute inset-0 border border-white/20 animate-pulse pointer-events-none rounded-r-sm" />
      )}

      <style>{`
        @keyframes abilityEntry {
          0% { opacity: 0; transform: translateX(-10px) skewX(-2deg); filter: blur(2px); }
          100% { opacity: 1; transform: translateX(0) skewX(0); filter: blur(0); }
        }
      `}</style>
    </div>
  );
});

AbilityCard.displayName = "AbilityCard";

export default memo(AbilityCard);
