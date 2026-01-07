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
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-2/3 z-30 font-orbitron animate-fade-in-up pointer-events-none select-none">
      <div className="text-center mb-2">
        <p ref={nameRef} className="text-2xl font-bold uppercase text-red-400 text-glow-red tracking-widest">
            {boss.name}
        </p>
        <p ref={statusRef} className="text-xs text-red-500/70 tracking-widest uppercase h-4 transition-colors duration-300">
            THREAT LEVEL: EXTREME
        </p>
      </div>
      
      <div className="w-full bg-black/70 border-2 border-red-500/50 p-1.5 backdrop-blur-sm relative" style={{clipPath: 'polygon(0 0, 100% 0, 100% 100%, 98% 100%, 98% 60%, 2% 60%, 2% 100%, 0 100%)'}}>
        {/* Background container */}
        <div className="h-4 w-full bg-red-900/20 relative overflow-hidden">
            {/* Health Bar - Width controlled by Ref/JS */}
            <div 
                ref={barRef}
                className="h-full bg-gradient-to-r from-red-500 to-red-700 relative will-change-[width]"
                style={{ width: '0%', boxShadow: '0 0 15px #ef4444' }}
            >
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:20px_20px] animate-stripe-flow"></div>
            </div>
        </div>
        
        {/* Shield Overlay for Sentinel */}
        {boss.bossType === 'sentinel' && boss.shieldSegments && (
            <div className="absolute top-0 left-0 w-full h-full flex gap-1 pointer-events-none">
                {boss.shieldSegments.map((s, i) => (
                    s.active && <div key={i} className="h-1 bg-cyan-400 w-full shadow-[0_0_5px_#06b6d4]"></div>
                ))}
            </div>
        )}
      </div>
       <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }
        @keyframes stripe-flow {
            0% { background-position: 0 0; }
            100% { background-position: 40px 0; }
        }
        .animate-stripe-flow {
            animation: stripe-flow 1s linear infinite;
        }
       `}</style>
    </div>
  );
};

export default BossHealthBar;