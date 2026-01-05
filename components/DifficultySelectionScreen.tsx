
import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { Difficulty, Screen, GameConfig } from '../types';
import CyberButton from './common/CyberButton';

interface DifficultySelectionScreenProps {
  navigateTo: (screen: Screen) => void;
  setGameConfig?: (config: GameConfig) => void;
}

const difficulties = [
  { 
    level: Difficulty.Easy, 
    title: 'Recruit',
    description: "Standard operating procedure. Hostiles are slow and predictable. Good for calibration.",
    color: 'border-green-500',
    text: 'text-green-400',
    bg: 'bg-green-500/10',
    icon: (
        <svg className="w-12 h-12 mb-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    )
  },
  { 
    level: Difficulty.Medium, 
    title: 'Veteran',
    description: "Active combat scenario. Enemies flank and use cover. Reaction times are standard.",
    color: 'border-[var(--color-primary-cyan)]',
    text: 'text-[var(--color-primary-cyan)]',
    bg: 'bg-[var(--color-primary-cyan)]/10',
    icon: (
        <svg className="w-12 h-12 mb-4 text-[var(--color-primary-cyan)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
    )
  },
  { 
    level: Difficulty.Hard, 
    title: 'Spectre',
    description: "Nightmare difficulty. Enemies possess predictive AI and enhanced weaponry. Survival unlikely.",
    color: 'border-[var(--color-primary-magenta)]',
    text: 'text-[var(--color-primary-magenta)]',
    bg: 'bg-[var(--color-primary-magenta)]/10',
    icon: (
        <svg className="w-12 h-12 mb-4 text-[var(--color-primary-magenta)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
    )
  },
];

const DifficultySelectionScreen: React.FC<DifficultySelectionScreenProps> = ({ navigateTo, setGameConfig }) => {
  const { settings, setSettings } = useSettings();

  const handleDifficultyChange = (value: Difficulty) => {
    setSettings(prev => ({ ...prev, difficulty: value }));
  };
  
  const handleLaunch = () => {
    if (setGameConfig) {
      setGameConfig({ mode: 'campaign' });
    }
    navigateTo('game');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 relative overflow-hidden bg-[var(--color-background)]">
      {/* Background */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
         <div className="grid-bg" />
         <div className="bg-tech-lines absolute inset-0 opacity-30" />
      </div>

      <div className="relative z-10 w-full max-w-6xl flex flex-col gap-10">
        <div className="text-center mb-4 animate-slide-up">
            <h1 className="font-orbitron text-5xl font-black uppercase text-[var(--color-text-light)] text-glow-cyan tracking-tight mb-2">
                Mission Parameters
            </h1>
            <div className="flex items-center justify-center gap-4">
                <div className="h-px w-20 bg-[var(--color-border)]"></div>
                <p className="font-rajdhani text-[var(--color-text-dim)] uppercase tracking-[0.2em] text-sm">
                    Select Threat Level
                </p>
                <div className="h-px w-20 bg-[var(--color-border)]"></div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {difficulties.map((diff, index) => {
                const isSelected = settings.difficulty === diff.level;
                return (
                    <button
                        key={diff.level}
                        onClick={() => handleDifficultyChange(diff.level)}
                        className={`
                            relative flex flex-col p-8 transition-all duration-300 border clip-corner-4 text-left group h-96 animate-slide-up
                            ${isSelected 
                                ? `bg-black/90 ${diff.color} shadow-[0_0_30px_rgba(0,0,0,0.5)] scale-105 z-10 ring-1 ring-white/20` 
                                : 'bg-black/40 border-stone-800 hover:border-stone-600 hover:bg-black/60 opacity-80 hover:opacity-100'
                            }
                        `}
                        style={{ animationDelay: `${index * 100 + 100}ms` }}
                    >
                        {/* Selected overlay glow */}
                        {isSelected && <div className={`absolute inset-0 ${diff.bg} opacity-20 pointer-events-none`} />}
                        
                        {/* Top decorative line */}
                        <div className={`absolute top-0 left-0 w-full h-1 ${isSelected ? diff.bg.replace('/10', '') : 'bg-stone-800'} transition-colors duration-300`} />

                        <div className="flex-grow flex flex-col items-center text-center mt-4">
                            <div className={`transition-transform duration-500 ${isSelected ? 'scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'scale-100 grayscale opacity-70'}`}>
                                {diff.icon}
                            </div>
                            
                            <h2 className={`font-orbitron text-3xl font-bold uppercase mb-4 tracking-wider ${isSelected ? 'text-[var(--color-text-light)]' : 'text-stone-500'}`}>
                                {diff.title}
                            </h2>
                            
                            <p className="font-rajdhani text-sm leading-relaxed text-[var(--color-text-dim)] border-t border-white/10 pt-4 w-full">
                                {diff.description}
                            </p>
                        </div>
                        
                        <div className="mt-auto w-full">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-orbitron text-xs text-stone-500 uppercase">Enemy Density</span>
                                <span className={`font-orbitron text-xs font-bold ${diff.text}`}>
                                    {diff.level === 'Easy' ? 'LOW' : diff.level === 'Medium' ? 'HIGH' : 'EXTREME'}
                                </span>
                            </div>
                            <div className="h-2 w-full bg-stone-900 rounded-full overflow-hidden">
                                <div className={`h-full ${diff.bg.replace('/10', '')} transition-all duration-500`} style={{
                                    width: diff.level === 'Easy' ? '33%' : diff.level === 'Medium' ? '66%' : '100%'
                                }}></div>
                            </div>
                        </div>
                    </button>
                )
            })}
        </div>

        <div className="flex justify-center gap-6 mt-4 animate-slide-up delay-500">
            <CyberButton onClick={() => navigateTo('main-menu')} variant="secondary" size="lg">
                Back
            </CyberButton>
            <CyberButton onClick={handleLaunch} variant="primary" size="lg" className="w-64" icon={<span>🚀</span>}>
                Deploy
            </CyberButton>
        </div>
      </div>
    </div>
  );
};

export default DifficultySelectionScreen;
