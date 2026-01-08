
import React, { useState, useEffect } from 'react';
import type { Ability } from '../../types';

interface AbilityCardProps {
  ability: Ability;
  index?: number;
}

const ABILITY_COLORS: Record<string, { primary: string; secondary: string; glow: string; dim: string }> = {
  overdrive: { primary: '#fbbf24', secondary: '#f59e0b', glow: 'rgba(251, 191, 36, 0.8)', dim: 'rgba(251, 191, 36, 0.1)' }, // Amber
  cyberBeam: { primary: '#d946ef', secondary: '#c026d3', glow: 'rgba(217, 70, 239, 0.8)', dim: 'rgba(217, 70, 239, 0.1)' }, // Fuchsia
  missileBarrage: { primary: '#ef4444', secondary: '#b91c1c', glow: 'rgba(239, 68, 68, 0.8)', dim: 'rgba(239, 68, 68, 0.1)' }, // Red
  toxicRounds: { primary: '#84cc16', secondary: '#65a30d', glow: 'rgba(132, 204, 22, 0.8)', dim: 'rgba(132, 204, 22, 0.1)' }, // Lime
  timeStop: { primary: '#06b6d4', secondary: '#0891b2', glow: 'rgba(6, 182, 212, 0.8)', dim: 'rgba(6, 182, 212, 0.1)' }, // Cyan
  default: { primary: '#00F0FF', secondary: '#0099aa', glow: 'rgba(0, 240, 255, 0.8)', dim: 'rgba(0, 240, 255, 0.1)' }
};

const AbilityIcon: React.FC<{ name: string; className?: string; style?: React.CSSProperties }> = ({ name, className = "h-6 w-6", style }) => {
  if (name === 'Cyber Beam') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    );
  }
  if (name === 'Overdrive') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
      </svg>
    );
  }
  if (name === 'Missile Barrage') {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
           <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
           <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1.001A3.75 3.75 0 0012 18z" />
        </svg>
    );
  }
  if (name === 'Toxic Rounds') {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
    );
  }
  if (name === 'Time Stop') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} style={style} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" >
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V5.75A2.25 2.25 0 0018 3.5H6A2.25 2.25 0 003.75 5.75v12.5A2.25 2.25 0 006 20.25z" />
      </svg>
    );
  }
  // Default
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
};

const AbilityCard: React.FC<AbilityCardProps> = ({ ability, index = 0 }) => {
  const [now, setNow] = useState(Date.now());
  const colors = ABILITY_COLORS[ability.id] || ABILITY_COLORS.default;

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 50);
    return () => clearInterval(interval);
  }, []);

  const progress = (() => {
    const { state, startTime, duration, cooldown, chargeStartTime, chargeDuration, mastered, name } = ability;
    
    let currentDuration = duration;
    let currentCooldown = cooldown;
    if (name === 'Overdrive' && mastered) {
        currentDuration = 12000;
        currentCooldown = 15000;
    }
    
    const chargeTime = chargeDuration || 2000;

    if (state === 'ready') return 0;
    if (state === 'active') {
      const activeDuration = name === 'Missile Barrage' ? 3500 : currentDuration;
      const elapsed = now - startTime;
      return Math.min(1, elapsed / activeDuration);
    }
    if (state === 'cooldown') {
      const elapsed = now - startTime;
      return Math.min(1, elapsed / currentCooldown);
    }
    if (state === 'charging') {
      const elapsed = now - startTime;
      return Math.min(1, elapsed / chargeTime);
    }
    if (state === 'chargingHold' && chargeStartTime) {
      const elapsed = now - chargeStartTime;
      return Math.min(1, elapsed / chargeTime);
    }
    return 0;
  })();

  const isActive = ability.state === 'active';
  const isReady = ability.state === 'ready';
  const isCharging = ability.state === 'charging' || ability.state === 'chargingHold';
  const isCooldown = ability.state === 'cooldown';

  const timeLeft = (() => {
    const { state, startTime, duration, cooldown, mastered, name } = ability;
    let currentDuration = duration;
    let currentCooldown = cooldown;
    if (name === 'Overdrive' && mastered) {
        currentDuration = 12000;
        currentCooldown = 15000;
    }
    const activeDuration = name === 'Missile Barrage' ? 3500 : currentDuration;

    if (isActive) return Math.max(0, (activeDuration - (now - startTime)) / 1000).toFixed(1);
    if (isCooldown) return Math.max(0, (currentCooldown - (now - startTime)) / 1000).toFixed(1);
    return null;
  })();

  return (
    <div 
        className="relative group w-full mb-3" 
        style={{ 
            animation: `slideUp 0.3s ease-out forwards ${index * 0.05}s`,
            opacity: 0,
            transform: 'translateY(10px)'
        }}
    >
        {/* Main Container */}
        <div 
            className={`
                relative overflow-hidden transition-all duration-300
                ${isActive ? 'bg-black/60 scale-[1.02]' : 'bg-black/40'}
            `}
            style={{
                borderLeft: `3px solid ${isActive || isReady ? colors.primary : '#333'}`,
                background: `linear-gradient(90deg, ${colors.dim}, transparent 80%)`,
                clipPath: 'polygon(0 0, 100% 0, 100% 85%, 95% 100%, 0 100%)'
            }}
        >
            {/* Grid Pattern Background */}
            <div 
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ 
                    backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, .3) 25%, rgba(255, 255, 255, .3) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .3) 75%, rgba(255, 255, 255, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255, 255, 255, .3) 25%, rgba(255, 255, 255, .3) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .3) 75%, rgba(255, 255, 255, .3) 76%, transparent 77%, transparent)',
                    backgroundSize: '20px 20px'
                }}
            />

            {/* Content Flex */}
            <div className="flex items-center p-2 gap-3 relative z-10">
                
                {/* Icon Section */}
                <div className="relative shrink-0">
                    <div 
                        className="w-10 h-10 flex items-center justify-center bg-black/50 border border-white/10 relative"
                        style={{
                            borderColor: isActive ? colors.primary : isReady ? colors.primary + '60' : '#333',
                            boxShadow: isActive ? `0 0 15px ${colors.glow}` : 'none'
                        }}
                    >
                        <AbilityIcon 
                            name={ability.name} 
                            style={{ 
                                color: isActive || isReady ? colors.primary : '#666',
                                filter: isActive ? `drop-shadow(0 0 5px ${colors.primary})` : 'none'
                            }} 
                            className={`w-5 h-5 transition-all duration-300 ${isActive ? 'scale-110' : ''}`}
                        />
                        
                        {/* Keybinding Tag */}
                        <div className="absolute -bottom-1 -right-1 bg-[#111] border border-[#333] px-1 py-[1px] shadow-sm z-10">
                            <span className="font-mono text-[9px] font-bold text-gray-400 leading-none block">
                                {ability.keyBinding}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Details Section */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-end mb-1">
                        <h4 className={`font-orbitron text-xs font-bold uppercase tracking-wider truncate ${isActive ? 'text-white' : 'text-gray-400'}`}>
                            {ability.name}
                        </h4>
                        {/* Status Label */}
                        <div className="font-mono text-[9px] font-bold">
                            {isActive ? (
                                <span className="text-white animate-pulse">ACTIVE {timeLeft}s</span>
                            ) : isCooldown ? (
                                <span className="text-gray-500">REBOOT {timeLeft}s</span>
                            ) : isCharging ? (
                                <span style={{ color: colors.primary }} className="animate-pulse">CHARGING...</span>
                            ) : (
                                <span style={{ color: colors.primary }}>READY</span>
                            )}
                        </div>
                    </div>

                    {/* High-Tech Progress Bar */}
                    <div className="relative h-1.5 w-full bg-gray-900 overflow-hidden">
                        {/* Background ticks */}
                        <div className="absolute inset-0 flex justify-between px-[1px]">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="w-[1px] h-full bg-black/50 z-20" />
                            ))}
                        </div>
                        
                        {/* The Fill */}
                        <div 
                            className="h-full absolute left-0 top-0 transition-all duration-100 ease-linear z-10"
                            style={{
                                width: `${isCooldown ? (1 - progress) * 100 : progress * 100}%`,
                                background: isActive 
                                    ? `repeating-linear-gradient(45deg, ${colors.primary}, ${colors.primary} 4px, ${colors.secondary} 4px, ${colors.secondary} 8px)`
                                    : colors.primary,
                                opacity: isReady ? 1 : 0.8,
                                boxShadow: isActive ? `0 0 10px ${colors.glow}` : 'none'
                            }}
                        />
                        
                        {/* Ready State Full Bar */}
                        {isReady && (
                            <div 
                                className="h-full w-full absolute inset-0 opacity-30" 
                                style={{ background: colors.primary }} 
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Selection/Ready Highlight */}
            {isReady && (
                <div 
                    className="absolute inset-0 border-2 border-transparent transition-all duration-500 pointer-events-none"
                    style={{ 
                        borderImage: `linear-gradient(to right, ${colors.primary}, transparent) 1`
                    }}
                />
            )}
        </div>
        <style>{`
            @keyframes slideUp {
                to { opacity: 1; transform: translateY(0); }
            }
        `}</style>
    </div>
  );
};

export default AbilityCard;
