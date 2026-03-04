
import React, { useState } from 'react';
import { PowerUpType, ChassisType } from '../../types';

interface SandboxPanelProps {
    isOpen: boolean;
    onClose: () => void;
    actions: {
        toggleGodMode: () => void;
        toggleInfiniteEnergy: () => void;
        setTimeScale: (val: number) => void;
        spawnPowerUp: (type: PowerUpType) => void;
        spawnEnemy: (tier: 'basic' | 'intermediate') => void;
        spawnBoss: () => void;
        clearAll: () => void;
        healPlayer: () => void;
        setSpawnMode: (mode: string) => void;
        changeChassis: (chassis: ChassisType) => void;
    };
    settings: {
        godMode: boolean;
        infiniteEnergy: boolean;
        timeScale: number;
        spawnMode: string;
    };
}

const SandboxPanel: React.FC<SandboxPanelProps> = ({ isOpen, onClose, actions, settings }) => {
    const [activeTab, setActiveTab] = useState<'SYSTEM' | 'PLAYER' | 'ASSETS' | 'POWER-UPS'>('SYSTEM');
    
    if (!isOpen) return null;

    const powerUps: PowerUpType[] = ['dualCannon', 'shield', 'regensule', 'lifeLeech', 'homingMissiles'];
    const chassisList: ChassisType[] = ['vector-01', 'rogue-scout', 'iron-bastion', 'phantom-weaver', 'titan-ogre', 'volt-strider', 'inferno-cobra', 'crystal-vanguard'];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'SYSTEM':
                return (
                    <div className="space-y-6">
                        <section className="bg-stone-900/50 p-4 border border-stone-800 rounded-sm">
                            <h3 className="text-[10px] font-black tracking-[0.3em] text-[var(--color-primary-cyan)] mb-4 uppercase flex items-center gap-2">
                                <div className="w-1 h-3 bg-[var(--color-primary-cyan)]" />
                                CORE OVERRIDES
                            </h3>
                            <div className="grid grid-cols-1 gap-2">
                                <button 
                                    onClick={actions.toggleGodMode}
                                    className={`flex items-center justify-between px-4 py-3 border transition-all group ${settings.godMode ? 'border-[var(--color-primary-cyan)] bg-[var(--color-primary-cyan)]/10 text-white' : 'border-stone-800 bg-stone-950 text-stone-500 hover:border-stone-700'}`}
                                >
                                    <div className="flex flex-col items-start">
                                        <span className="text-xs font-bold tracking-widest uppercase">God Mode</span>
                                        <span className="text-[9px] opacity-50 uppercase tracking-tighter">Invulnerability active</span>
                                    </div>
                                    <div className={`w-10 h-5 rounded-full p-1 transition-colors ${settings.godMode ? 'bg-[var(--color-primary-cyan)]' : 'bg-stone-800'}`}>
                                        <div className={`w-3 h-3 rounded-full bg-white transition-transform ${settings.godMode ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </div>
                                </button>
                                <button 
                                    onClick={actions.toggleInfiniteEnergy}
                                    className={`flex items-center justify-between px-4 py-3 border transition-all group ${settings.infiniteEnergy ? 'border-[var(--color-primary-magenta)] bg-[var(--color-primary-magenta)]/10 text-white' : 'border-stone-800 bg-stone-950 text-stone-500 hover:border-stone-700'}`}
                                >
                                    <div className="flex flex-col items-start">
                                        <span className="text-xs font-bold tracking-widest uppercase">Inf Energy</span>
                                        <span className="text-[9px] opacity-50 uppercase tracking-tighter">No cooldowns/costs</span>
                                    </div>
                                    <div className={`w-10 h-5 rounded-full p-1 transition-colors ${settings.infiniteEnergy ? 'bg-[var(--color-primary-magenta)]' : 'bg-stone-800'}`}>
                                        <div className={`w-3 h-3 rounded-full bg-white transition-transform ${settings.infiniteEnergy ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </div>
                                </button>
                            </div>
                        </section>

                        <section className="bg-stone-900/50 p-4 border border-stone-800 rounded-sm">
                            <h3 className="text-[10px] font-black tracking-[0.3em] text-stone-500 mb-4 uppercase flex items-center gap-2">
                                <div className="w-1 h-3 bg-stone-500" />
                                TEMPORAL FLUX
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Time Scale</span>
                                    <span className="font-mono text-[var(--color-primary-cyan)] text-xs">{settings.timeScale.toFixed(1)}x</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0.1" 
                                    max="2.0" 
                                    step="0.1" 
                                    value={settings.timeScale} 
                                    onChange={(e) => actions.setTimeScale(parseFloat(e.target.value))}
                                    className="w-full h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-[var(--color-primary-cyan)]"
                                />
                                <div className="flex justify-between text-[8px] text-stone-600 font-bold uppercase tracking-tighter">
                                    <span>Slo-Mo</span>
                                    <span>Normal</span>
                                    <span>Overclock</span>
                                </div>
                            </div>
                        </section>
                    </div>
                );
            case 'PLAYER':
                return (
                    <div className="space-y-6">
                        <section className="bg-stone-900/50 p-4 border border-stone-800 rounded-sm">
                            <h3 className="text-[10px] font-black tracking-[0.3em] text-green-500 mb-4 uppercase flex items-center gap-2">
                                <div className="w-1 h-3 bg-green-500" />
                                CHASSIS RECONFIGURATION
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                {chassisList.map(chassis => (
                                    <button 
                                        key={chassis}
                                        onClick={() => actions.changeChassis(chassis)}
                                        className="px-2 py-2 border border-stone-800 bg-stone-950 text-[9px] font-bold text-stone-400 hover:border-green-500/50 hover:text-green-400 transition-all uppercase tracking-widest text-left truncate"
                                    >
                                        {chassis.replace('-', ' ')}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="bg-stone-900/50 p-4 border border-stone-800 rounded-sm">
                            <h3 className="text-[10px] font-black tracking-[0.3em] text-stone-500 mb-4 uppercase flex items-center gap-2">
                                <div className="w-1 h-3 bg-stone-500" />
                                QUICK ACTIONS
                            </h3>
                            <button 
                                onClick={actions.healPlayer}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-green-500/30 bg-green-500/5 text-green-400 hover:bg-green-500/10 transition-all font-bold text-xs tracking-[0.2em] uppercase"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Full Repair
                            </button>
                        </section>
                    </div>
                );
            case 'ASSETS':
                return (
                    <div className="space-y-6">
                        <section className="bg-stone-900/50 p-4 border border-stone-800 rounded-sm">
                            <h3 className="text-[10px] font-black tracking-[0.3em] text-red-500 mb-4 uppercase flex items-center gap-2">
                                <div className="w-1 h-3 bg-red-500" />
                                COMBAT DEPLOYMENT
                            </h3>
                            <p className="text-[9px] text-stone-500 mb-4 leading-tight uppercase tracking-tight">
                                Select a unit type, then <span className="text-[var(--color-primary-cyan)] font-bold">CLICK ON THE MAP</span> to spawn.
                            </p>
                            
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[8px] text-stone-600 mb-2 tracking-[0.2em] uppercase font-black">Standard Units</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button 
                                            onClick={() => actions.setSpawnMode(settings.spawnMode === 'enemy-basic' ? 'none' : 'enemy-basic')}
                                            className={`px-3 py-3 border transition-all text-[10px] font-black tracking-widest uppercase ${settings.spawnMode === 'enemy-basic' ? 'border-red-500 bg-red-500/20 text-white' : 'bg-stone-950 border-stone-800 text-stone-500'}`}
                                        >
                                            BASIC
                                        </button>
                                        <button 
                                            onClick={() => actions.setSpawnMode(settings.spawnMode === 'enemy-intermediate' ? 'none' : 'enemy-intermediate')}
                                            className={`px-3 py-3 border transition-all text-[10px] font-black tracking-widest uppercase ${settings.spawnMode === 'enemy-intermediate' ? 'border-orange-500 bg-orange-500/20 text-white' : 'bg-stone-950 border-stone-800 text-stone-500'}`}
                                        >
                                            ELITE
                                        </button>
                                    </div>
                                </div>
                                
                                <div>
                                    <p className="text-[8px] text-stone-600 mb-2 tracking-[0.2em] uppercase font-black">Capital Units</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button 
                                            onClick={() => actions.setSpawnMode(settings.spawnMode === 'boss-goliath' ? 'none' : 'boss-goliath')}
                                            className={`w-full px-2 py-3 border transition-all text-[9px] font-black tracking-[0.2em] uppercase ${settings.spawnMode === 'boss-goliath' ? 'border-red-500 bg-red-500/40 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-red-950/5 border-red-900/20 text-red-900 hover:border-red-900/40'}`}
                                        >
                                            GOLIATH
                                        </button>
                                        <button 
                                            onClick={() => actions.setSpawnMode(settings.spawnMode === 'boss-blitz-predator' ? 'none' : 'boss-blitz-predator')}
                                            className={`w-full px-2 py-3 border transition-all text-[9px] font-black tracking-[0.2em] uppercase ${settings.spawnMode === 'boss-blitz-predator' ? 'border-pink-500 bg-pink-500/40 text-white shadow-[0_0_15px_rgba(236,72,153,0.3)]' : 'bg-pink-950/5 border-pink-900/20 text-pink-900 hover:border-pink-900/40'}`}
                                        >
                                            BLITZ
                                        </button>
                                        <button 
                                            onClick={() => actions.setSpawnMode(settings.spawnMode === 'boss-thunder-colossus' ? 'none' : 'boss-thunder-colossus')}
                                            className={`w-full px-2 py-3 border transition-all text-[9px] font-black tracking-[0.2em] uppercase ${settings.spawnMode === 'boss-thunder-colossus' ? 'border-yellow-500 bg-yellow-500/40 text-white shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-yellow-950/5 border-yellow-900/20 text-yellow-900 hover:border-yellow-900/40'}`}
                                        >
                                            THUNDER
                                        </button>
                                        <button 
                                            onClick={() => actions.setSpawnMode(settings.spawnMode === 'boss-mirror-knight' ? 'none' : 'boss-mirror-knight')}
                                            className={`w-full px-2 py-3 border transition-all text-[9px] font-black tracking-[0.2em] uppercase ${settings.spawnMode === 'boss-mirror-knight' ? 'border-slate-300 bg-slate-300/40 text-white shadow-[0_0_15px_rgba(203,213,225,0.3)]' : 'bg-slate-900/5 border-slate-700/20 text-slate-500 hover:border-slate-700/40'}`}
                                        >
                                            MIRROR
                                        </button>
                                        <button 
                                            onClick={() => actions.setSpawnMode(settings.spawnMode === 'boss-toxic-swarm' ? 'none' : 'boss-toxic-swarm')}
                                            className={`w-full px-2 py-3 border transition-all text-[9px] font-black tracking-[0.2em] uppercase ${settings.spawnMode === 'boss-toxic-swarm' ? 'border-emerald-500 bg-emerald-500/40 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-emerald-950/5 border-emerald-900/20 text-emerald-900 hover:border-emerald-900/40'}`}
                                        >
                                            TOXIC
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <button 
                            onClick={actions.clearAll}
                            className="w-full px-4 py-4 bg-stone-950 border border-stone-800 hover:bg-red-600 hover:border-red-500 text-white text-[10px] font-black tracking-[0.4em] transition-all uppercase flex items-center justify-center gap-3"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Purge Arena
                        </button>
                    </div>
                );
            case 'POWER-UPS':
                return (
                    <div className="space-y-6">
                        <section className="bg-stone-900/50 p-4 border border-stone-800 rounded-sm">
                            <h3 className="text-[10px] font-black tracking-[0.3em] text-[var(--color-primary-magenta)] mb-4 uppercase flex items-center gap-2">
                                <div className="w-1 h-3 bg-[var(--color-primary-magenta)]" />
                                LOGISTICS INJECTION
                            </h3>
                            <p className="text-[9px] text-stone-500 mb-4 leading-tight uppercase tracking-tight">
                                Select a module, then <span className="text-[var(--color-primary-cyan)] font-bold">CLICK ON THE MAP</span> to spawn.
                            </p>
                            
                            <div className="grid grid-cols-2 gap-2">
                                {powerUps.map(type => (
                                    <button 
                                        key={type} 
                                        onClick={() => actions.setSpawnMode(settings.spawnMode === `powerup-${type}` ? 'none' : `powerup-${type}`)}
                                        className={`px-2 py-3 border transition-all text-[9px] font-bold tracking-widest uppercase ${settings.spawnMode === `powerup-${type}` ? 'border-[var(--color-primary-magenta)] bg-[var(--color-primary-magenta)]/20 text-white' : 'bg-stone-950 border-stone-800 text-stone-500'}`}
                                    >
                                        {type.replace(/([A-Z])/g, ' $1')}
                                    </button>
                                ))}
                            </div>
                        </section>
                    </div>
                );
        }
    };

    return (
        <div 
            className="absolute right-4 bottom-20 w-80 bg-stone-950/95 border border-stone-800 p-0 z-50 font-rajdhani text-white shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-3xl overflow-hidden flex flex-col rounded-sm"
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="bg-black/50 px-6 py-5 border-b border-stone-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 border border-[var(--color-primary-cyan)] flex items-center justify-center">
                        <div className="w-4 h-4 bg-[var(--color-primary-cyan)] animate-pulse" />
                    </div>
                    <div className="flex flex-col">
                        <h2 className="font-orbitron font-black text-sm tracking-[0.3em] text-white leading-none">ADMIN.SYS</h2>
                        <span className="text-[8px] text-[var(--color-primary-cyan)] font-bold tracking-[0.5em] mt-1 uppercase">Sandbox Environment</span>
                    </div>
                </div>
                <button onClick={onClose} className="text-stone-600 hover:text-white transition-colors p-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Tabs */}
            <div className="flex bg-black/30">
                {(['SYSTEM', 'PLAYER', 'ASSETS', 'POWER-UPS'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-3 text-[9px] font-black tracking-[0.2em] transition-all border-b-2 ${activeTab === tab ? 'border-[var(--color-primary-cyan)] text-white bg-[var(--color-primary-cyan)]/5' : 'border-transparent text-stone-600 hover:text-stone-400'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto max-h-[65vh] custom-scrollbar bg-gradient-to-b from-transparent to-stone-900/20">
                {renderTabContent()}
            </div>

            {/* Footer Status */}
            {settings.spawnMode !== 'none' && (
                <div className="bg-red-500/10 border-t border-red-500/20 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-red-500 tracking-widest uppercase leading-none">DEPLOYMENT ACTIVE</span>
                            <span className="text-[10px] font-bold text-white tracking-[0.2em] uppercase mt-1">{settings.spawnMode.split('-').pop()?.replace(/([A-Z])/g, ' $1')}</span>
                        </div>
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); actions.setSpawnMode('none'); }} 
                        className="px-4 py-2 bg-red-600/20 border border-red-600/50 hover:bg-red-600 hover:text-white text-[9px] font-black text-red-500 tracking-widest uppercase transition-all rounded-sm"
                    >
                        ABORT [ESC]
                    </button>
                </div>
            )}
        </div>
    );
};

export default SandboxPanel;
