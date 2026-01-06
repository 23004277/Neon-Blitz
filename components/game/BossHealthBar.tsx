
import React from 'react';
import { Boss } from '../../types';

interface BossHealthBarProps {
  boss: Boss;
}

const BossHealthBar: React.FC<BossHealthBarProps> = ({ boss }) => {
  if (!boss || boss.status === 'dead') return null;
  const healthPercentage = Math.max(0, (boss.health / boss.maxHealth) * 100);

  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-2/3 z-30 font-orbitron animate-fade-in-up">
      <div className="text-center mb-2">
        <p className="text-2xl font-bold uppercase text-red-400 text-glow-red tracking-widest">{boss.name}</p>
        <p className="text-xs text-red-500/70 tracking-widest uppercase">
            {boss.attackState.phase === 'telegraphing' ? '⚠ WARNING: ENERGY SURGE DETECTED ⚠' : 'THREAT LEVEL: EXTREME'}
        </p>
      </div>
      <div className="w-full bg-black/70 border-2 border-red-500/50 p-1.5 backdrop-blur-sm relative" style={{clipPath: 'polygon(0 0, 100% 0, 100% 100%, 98% 100%, 98% 60%, 2% 60%, 2% 100%, 0 100%)'}}>
        <div 
          className="h-4 bg-gradient-to-r from-red-500 to-red-700 transition-all duration-100 ease-linear relative overflow-hidden"
          style={{ width: `${healthPercentage}%`, boxShadow: '0 0 10px #ef4444' }}
        >
           <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:20px_20px] animate-stripe-flow"></div>
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
