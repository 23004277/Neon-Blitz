import React from 'react';
import { Boss } from '../../types';

interface BossHealthBarProps {
  boss: Boss;
}

const BossHealthBar: React.FC<BossHealthBarProps> = ({ boss }) => {
  const healthPercentage = (boss.health / boss.maxHealth) * 100;

  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-2/3 z-30 font-orbitron animate-fade-in-up">
      <div className="text-center mb-2">
        <p className="text-2xl font-bold uppercase text-red-400 text-glow-red tracking-widest">{boss.name}</p>
      </div>
      <div className="w-full bg-black/70 border-2 border-red-500/50 p-1.5 backdrop-blur-sm" style={{clipPath: 'polygon(0 0, 100% 0, 100% 100%, 98% 100%, 98% 60%, 2% 60%, 2% 100%, 0 100%)'}}>
        <div 
          className="h-4 bg-gradient-to-r from-red-500 to-red-700 transition-all duration-300 ease-linear"
          style={{ width: `${healthPercentage}%`, boxShadow: '0 0 10px #ef4444' }}
        >
           <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
        </div>
      </div>
       <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }
       `}</style>
    </div>
  );
};

export default BossHealthBar;