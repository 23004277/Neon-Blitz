
import React, { useState, useEffect } from 'react';
import type { Ability } from '../../types';

interface AbilityCardProps {
  ability: Ability;
  index?: number;
}

const ABILITY_COLORS: Record<string, { primary: string; secondary: string; glow: string }> = {
  overdrive: { primary: '#fbbf24', secondary: '#f59e0b', glow: 'rgba(251, 191, 36, 0.6)' }, // Amber
  cyberBeam: { primary: '#d946ef', secondary: '#c026d3', glow: 'rgba(217, 70, 239, 0.6)' }, // Fuchsia
  chronoBubble: { primary: '#3b82f6', secondary: '#2563eb', glow: 'rgba(59, 130, 246, 0.6)' }, // Blue
  barrage: { primary: '#f97316', secondary: '#ea580c', glow: 'rgba(249, 115, 22, 0.6)' }, // Orange
  toxicRounds: { primary: '#84cc16', secondary: '#65a30d', glow: 'rgba(132, 204, 22, 0.6)' }, // Lime
  timeStop: { primary: '#06b6d4', secondary: '#0891b2', glow: 'rgba(6, 182, 212, 0.6)' } // Cyan
};

const AbilityIcon: React.FC<{ name: string; className?: string }> = ({ name, className = "h-6 w-6" }) => {
  if (name === 'Cyber Beam') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    );
  }
  if (name === 'Overdrive') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
      </svg>
    );
  }
  if (name === 'Chrono Bubble') {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
  }
  if (name === 'Toxic Rounds') {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
    );
  }
  if (name === 'Time Stop') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" >
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V5.75A2.25 2.25 0 0018 3.5H6A2.25 2.25 0 003.75 5.75v12.5A2.25 2.25 0 006 20.25z" />
      </svg>
    );
  }
  // Default: Barrage Icon
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
};

const AbilityCard: React.FC<AbilityCardProps> = ({ ability, index = 0 }) => {
  const [now, setNow] = useState(Date.now());
  const colors = ABILITY_COLORS[ability.id] || ABILITY_COLORS.overdrive;

  useEffect(() => {
    // Update for smooth timer text and progress bars
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
    const chargeTime = (name === 'Cyber Beam') ? 4000 : (chargeDuration || 2000);

    if (state === 'ready') return 0;
    if (state === 'active') {
      const activeDuration = name === 'Barrage' ? 3500 : currentDuration;
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
    const activeDuration = name === 'Barrage' ? 3500 : currentDuration;

    if (isActive) return Math.max(0, (activeDuration - (now - startTime)) / 1000).toFixed(1);
    if (isCooldown) return Math.max(0, (currentCooldown - (now - startTime)) / 1000).toFixed(1);
    return null;
  })();

  return (
    <div className="relative group animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
      <div 
        className="relative bg-black/60 backdrop-blur-xl border-2 rounded-xl overflow-hidden transition-all duration-300"
        style={{
          borderColor: isActive ? colors.primary : isReady ? `${colors.primary}60` : '#ffffff15',
          boxShadow: isActive 
            ? `0 0 20px ${colors.glow}, inset 0 0 15px ${colors.glow}` 
            : isReady 
              ? `0 0 10px ${colors.glow}` 
              : 'none',
          transform: isActive ? 'scale(1.02)' : 'scale(1)'
        }}
      >
        {/* Background Radial Glow */}
        <div 
          className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${colors.primary}, transparent 70%)`,
            opacity: isActive ? 0.3 : 0.05
          }}
        />

        <div className="relative p-3">
          <div className="flex items-start justify-between mb-2">
            {/* Icon Container */}
            <div 
              className="relative w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all duration-300"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}20, ${colors.secondary}20)`,
                border: `1px solid ${isActive ? colors.primary : colors.primary}60`,
                boxShadow: isActive ? `0 0 15px ${colors.glow}` : 'none',
                color: isReady || isActive ? 'white' : colors.primary
              }}
            >
              <AbilityIcon name={ability.name} className="h-5 w-5 drop-shadow-md" />
              
              {isActive && (
                <svg className="absolute inset-0 w-full h-full animate-spin-slow" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="18" fill="none" stroke={colors.primary} strokeWidth="2" strokeDasharray="30 80" opacity="0.8" />
                </svg>
              )}
            </div>

            {/* Key Binding */}
            <div 
              className="px-2 py-0.5 rounded text-xs font-mono font-bold"
              style={{
                background: `${colors.primary}20`,
                color: colors.primary,
                border: `1px solid ${colors.primary}40`
              }}
            >
              {ability.keyBinding}
            </div>
          </div>

          <div className="flex justify-between items-center mb-1">
            <h3 
                className="font-bold text-sm tracking-wide font-orbitron truncate pr-2"
                style={{ color: isReady ? 'white' : '#9ca3af' }}
            >
                {ability.name}
            </h3>
            {ability.mastered && (
                <span className="text-[10px] text-yellow-400 font-bold tracking-wider animate-pulse">★ MAX</span>
            )}
          </div>

          {/* Status Text */}
          <div className="flex justify-between items-center text-[10px] font-mono h-4 mb-2">
            <div>
                {isActive && <span className="text-white font-bold animate-pulse tracking-wider">ACTIVE</span>}
                {isReady && <span className="text-green-400 font-bold tracking-wider">READY</span>}
                {isCharging && <span className="text-yellow-400 font-bold animate-pulse tracking-wider">CHARGING</span>}
                {isCooldown && <span className="text-gray-500 tracking-wider">REBOOTING</span>}
            </div>
            {(isActive || isCooldown) && (
                <span className={isActive ? 'text-white' : 'text-gray-400'}>{timeLeft}s</span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden relative">
             {(isActive || isCooldown || isCharging) && (
                <div
                  className="h-full transition-all duration-100 ease-linear rounded-full"
                  style={{
                    width: `${isCooldown ? (1 - progress) * 100 : progress * 100}%`,
                    background: isActive 
                      ? `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})` 
                      : isCharging
                        ? `linear-gradient(90deg, ${colors.secondary}, ${colors.primary})`
                        : `linear-gradient(90deg, ${colors.primary}40, ${colors.primary})`,
                    boxShadow: `0 0 10px ${colors.glow}`
                  }}
                />
             )}
             {isReady && <div className="h-full w-full bg-gray-700/30" />}
          </div>
        </div>

        {/* Cooldown Radial Overlay (Optional nice touch for cooldowns) */}
        {isCooldown && (
             <div className="absolute top-3 left-3 w-10 h-10 rounded-full pointer-events-none overflow-hidden">
                 <div 
                    className="absolute inset-0 bg-black/60"
                    style={{ transform: `translateY(${100 - (1-progress)*100}%)` }}
                 />
             </div>
        )}

        {isReady && (
          <div 
            className="absolute inset-0 rounded-xl pointer-events-none animate-pulse-border"
            style={{ border: `1px solid ${colors.primary}`, opacity: 0.3 }}
          />
        )}
      </div>
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        @keyframes pulse-border {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.02); }
        }
        .animate-pulse-border {
          animation: pulse-border 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default AbilityCard;
