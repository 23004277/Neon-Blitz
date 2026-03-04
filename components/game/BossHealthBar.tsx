import React, { useEffect, useRef } from 'react';
import { Boss } from '../../types';

interface BossHealthBarProps {
  boss: Boss;
}

const BossHealthBar: React.FC<BossHealthBarProps> = ({ boss }) => {
  const barRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLParagraphElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const update = () => {
      if (boss && (boss.status === 'active' || boss.status === 'spawning')) {
        // Update Health Width directly on the DOM element for 60fps smoothness
        if (barRef.current) {
            const healthPercentage = Math.max(0, (boss.health / boss.maxHealth) * 100);
            barRef.current.style.width = `${healthPercentage}%`;
        }

        // Update Status Text based on boss phase
        if (statusRef.current) {
            let statusText = 'THREAT LEVEL: EXTREME';
            
            if (boss.attackState.currentAttack === 'lastStand') {
                statusText = '⚠ CRITICAL MELTDOWN IMMINENT ⚠';
            } else if (boss.attackState.phase === 'telegraphing') {
                statusText = '⚠ WARNING: ENERGY SURGE DETECTED ⚠';
            }

            // Only update DOM text if changed
            if (statusRef.current.textContent !== statusText) {
                statusRef.current.textContent = statusText;
                
                // Add flash effect for warnings
                if (statusText.includes('⚠')) {
                    statusRef.current.classList.add('animate-pulse');
                    statusRef.current.classList.replace('text-red-500/70', 'text-red-500');
                } else {
                    statusRef.current.classList.remove('animate-pulse');
                    statusRef.current.classList.replace('text-red-500', 'text-red-500/70');
                }
            }
        }
      }
      rafRef.current = requestAnimationFrame(update);
    };

    rafRef.current = requestAnimationFrame(update);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [boss]);

  if (!boss || boss.status === 'dead') return null;

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 w-1/2 min-w-[500px] max-w-[800px] z-30 font-orbitron animate-fade-in-down pointer-events-none select-none">
      <div className="flex justify-between items-end mb-1 px-4">
        <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-0.5">
                <div className="w-1.5 h-1.5 bg-red-500 animate-pulse shadow-[0_0_5px_red]" />
                <p ref={statusRef} className="text-[9px] text-red-500/70 tracking-[0.2em] uppercase transition-colors duration-300">
                    THREAT LEVEL: EXTREME
                </p>
            </div>
            <p ref={nameRef} className="text-xl font-bold uppercase text-red-400 text-glow-red tracking-widest leading-none">
                {boss.name}
            </p>
        </div>
        <div className="flex flex-col items-end">
            <span className="text-[8px] font-mono text-red-500/50 uppercase tracking-widest">CLASS: {boss.bossType.toUpperCase()}</span>
            <span className="text-[8px] font-mono text-red-500/50 uppercase tracking-widest">TARGET_LOCKED</span>
        </div>
      </div>
      
      <div className="w-full bg-black/60 border border-red-500/30 p-1.5 backdrop-blur-md relative rounded-sm shadow-[0_0_20px_rgba(239,68,68,0.15)]">
        {/* Corner Accents */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-red-500" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-red-500" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-red-500" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-red-500" />

        {/* Background container */}
        <div className="h-3 w-full bg-stone-900/80 relative overflow-hidden rounded-sm">
            {/* Segmented background markers */}
            <div className="absolute inset-0 flex justify-between px-1 pointer-events-none opacity-20 z-10">
                {[...Array(30)].map((_, i) => <div key={i} className="w-px h-full bg-white/20" />)}
            </div>

            {/* Health Bar - Width controlled by Ref/JS */}
            <div 
                ref={barRef}
                className="h-full bg-red-500 relative will-change-[width] shadow-[0_0_15px_#ef4444]"
                style={{ width: '0%' }}
            >
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.15)_50%,transparent_75%)] bg-[length:15px_15px] animate-stripe-flow"></div>
            </div>
        </div>
        
        {/* Shield Overlay for Sentinel */}
        {boss.bossType === 'sentinel' && boss.shieldSegments && (
            <div className="absolute top-1.5 left-1.5 right-1.5 h-3 flex gap-0.5 pointer-events-none z-20">
                {boss.shieldSegments.map((s, i) => (
                    s.active ? 
                        <div key={i} className="flex-1 h-full bg-cyan-400/80 border-r border-cyan-300 shadow-[0_0_8px_#06b6d4]"></div> :
                        <div key={i} className="flex-1 h-full bg-transparent"></div>
                ))}
            </div>
        )}
      </div>
       <style>{`
        @keyframes fade-in-down {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes stripe-flow {
            0% { background-position: 0 0; }
            100% { background-position: 30px 0; }
        }
        .animate-stripe-flow {
            animation: stripe-flow 1s linear infinite;
        }
       `}</style>
    </div>
  );
};

export default BossHealthBar;