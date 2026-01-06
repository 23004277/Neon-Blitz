
import React from 'react';
import CyberButton from '../common/CyberButton';

interface GameOverScreenProps {
  score: number;
  kills: number;
  onRestart: () => void;
  onMainMenu: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ score, kills, onRestart, onMainMenu }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-black/90 border-2 border-red-500/50 p-8 max-w-md w-full text-center box-glow-magenta clip-corner-4 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
        
        <div className="mb-6">
            <h1 className="font-orbitron text-5xl md:text-6xl font-black text-red-500 text-glow-magenta mb-2 tracking-widest animate-pulse">
            SIGNAL LOST
            </h1>
            <div className="h-px w-full bg-gradient-to-r from-transparent via-red-500 to-transparent my-4"></div>
            <p className="font-rajdhani text-red-400/80 text-xl tracking-[0.3em] uppercase">
            Unit Critical Failure
            </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8 bg-red-900/10 border border-red-500/20 p-4 rounded-sm">
          <div className="flex flex-col border-r border-red-500/20">
            <span className="text-[10px] font-orbitron text-stone-500 uppercase tracking-wider">Total Score</span>
            <span className="text-3xl font-orbitron text-white">{score}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-orbitron text-stone-500 uppercase tracking-wider">Hostiles Neutralized</span>
            <span className="text-3xl font-orbitron text-white">{kills}</span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <CyberButton onClick={onRestart} variant="danger" size="lg" className="w-full justify-center group" icon={<span className="group-hover:rotate-180 transition-transform duration-500">↻</span>}>
            Reboot System
          </CyberButton>
          <CyberButton onClick={onMainMenu} variant="secondary" size="md" className="w-full justify-center border-stone-700 text-stone-400 hover:text-white">
            Abort to Hub
          </CyberButton>
        </div>
        
        {/* Decorative corner markers */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-red-500" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-red-500" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-red-500" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-red-500" />
      </div>
      
      <style>{`
        .text-glow-magenta { text-shadow: 0 0 15px rgba(239, 68, 68, 0.6); }
      `}</style>
    </div>
  );
};

export default GameOverScreen;
