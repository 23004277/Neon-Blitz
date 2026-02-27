
import React, { useState } from 'react';
import { PowerUpType } from '../../types';

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
    };
    settings: {
        godMode: boolean;
        infiniteEnergy: boolean;
        timeScale: number;
        spawnMode: string;
    };
}

const SandboxPanel: React.FC<SandboxPanelProps> = ({ isOpen, onClose, actions, settings }) => {
    const [activeTab, setActiveTab] = useState<'SYSTEM' | 'ASSETS' | 'POWER-UPS'>('SYSTEM');
    
    if (!isOpen) return null;

    const powerUps: PowerUpType[] = ['dualCannon', 'shield', 'regensule', 'lifeLeech', 'homingMissiles'];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'SYSTEM':
                return (
                    <div className="space-y-8">
                        <section>
                            <h3 className="text-xs font-bold tracking-[0.3em] text-stone-500 mb-4 uppercase">SYSTEM OVERRIDES</h3>
                            <div className="grid grid-cols-1 gap-3">
                                <button 
                                    onClick={actions.toggleGodMode}
                                    className={`flex items-center justify-between px-4 py-3 border transition-all ${settings.godMode ? 'border-[var(--color-primary-cyan)] bg-[var(--color-primary-cyan)]/20 text-white' : 'border-stone-800 bg-stone-900/50 text-stone-400'}`}
                                >
                                    <span className="font-bold tracking-widest uppercase">God Mode</span>
                                    <div className={`w-3 h-3 rounded-full ${settings.godMode ? 'bg-[var(--color-primary-cyan)] shadow-[0_0_10px_#00E0FF]' : 'bg-stone-700'}`} />
                                </button>
                                <button 
                                    onClick={actions.toggleInfiniteEnergy}
                                    className={`flex items-center justify-between px-4 py-3 border transition-all ${settings.infiniteEnergy ? 'border-[var(--color-primary-magenta)] bg-[var(--color-primary-magenta)]/20 text-white' : 'border-stone-800 bg-stone-900/50 text-stone-400'}`}
                                >
                                    <span className="font-bold tracking-widest uppercase">Inf Energy</span>
                                    <div className={`w-3 h-3 rounded-full ${settings.infiniteEnergy ? 'bg-[var(--color-primary-magenta)] shadow-[0_0_10px_#FF00FF]' : 'bg-stone-700'}`} />
                                </button>
                                <button 
                                    onClick={actions.healPlayer}
                                    className="flex items-center justify-center px-4 py-3 border border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all font-bold tracking-widest uppercase"
                                >
                                    Repair Chassis
                                </button>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xs font-bold tracking-[0.3em] text-stone-500 mb-4 uppercase">TEMPORAL SHIFT</h3>
                            <div className="flex items-center gap-4">
                                <input 
                                    type="range" 
                                    min="0.1" 
                                    max="2.0" 
                                    step="0.1" 
                                    value={settings.timeScale} 
                                    onChange={(e) => actions.setTimeScale(parseFloat(e.target.value))}
                                    className="flex-1 accent-[var(--color-primary-cyan)]"
                                />
                                <span className="font-mono text-[var(--color-primary-cyan)] w-12 text-right">{settings.timeScale.toFixed(1)}x</span>
                            </div>
                        </section>
                    </div>
                );
            case 'ASSETS':
                return (
                    <div className="space-y-6">
                        <section>
                            <h3 className="text-xs font-bold tracking-[0.3em] text-stone-500 mb-4 uppercase">DEPLOY ASSETS</h3>
                            <p className="text-[10px] text-stone-400 mb-4 leading-relaxed">
                                Toggle a mode below, then <span className="text-[var(--color-primary-cyan)] font-bold">CLICK ON THE MAP</span> to spawn.
                            </p>
                            
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] text-stone-600 mb-2 tracking-widest uppercase">Enemies</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button 
                                            onClick={() => actions.setSpawnMode(settings.spawnMode === 'enemy-basic' ? 'none' : 'enemy-basic')}
                                            className={`px-3 py-2 border transition-all text-xs font-bold tracking-widest ${settings.spawnMode === 'enemy-basic' ? 'border-red-500 bg-red-500/20 text-white' : 'bg-stone-900 border-stone-800 text-stone-400'}`}
                                        >
                                            BASIC
                                        </button>
                                        <button 
                                            onClick={() => actions.setSpawnMode(settings.spawnMode === 'enemy-intermediate' ? 'none' : 'enemy-intermediate')}
                                            className={`px-3 py-2 border transition-all text-xs font-bold tracking-widest ${settings.spawnMode === 'enemy-intermediate' ? 'border-orange-500 bg-orange-500/20 text-white' : 'bg-stone-900 border-stone-800 text-stone-400'}`}
                                        >
                                            ELITE
                                        </button>
                                    </div>
                                </div>
                                
                                <div>
                                    <p className="text-[10px] text-stone-600 mb-2 tracking-widest uppercase">Bosses</p>
                                    <button 
                                        onClick={() => actions.setSpawnMode(settings.spawnMode === 'boss-goliath' ? 'none' : 'boss-goliath')}
                                        className={`w-full px-3 py-3 border transition-all text-xs font-bold tracking-[0.2em] ${settings.spawnMode === 'boss-goliath' ? 'border-red-500 bg-red-500/40 text-white' : 'bg-red-900/10 border-red-900/30 text-red-400'}`}
                                    >
                                        GOLIATH PRIME
                                    </button>
                                </div>
                            </div>
                        </section>

                        <section className="pt-4 border-t border-stone-800">
                            <button 
                                onClick={actions.clearAll}
                                className="w-full px-4 py-3 bg-stone-900 border border-stone-700 hover:bg-red-600 hover:border-red-500 text-white text-sm font-bold tracking-[0.3em] transition-all uppercase"
                            >
                                Clear Arena
                            </button>
                        </section>
                    </div>
                );
            case 'POWER-UPS':
                return (
                    <div className="space-y-6">
                        <section>
                            <h3 className="text-xs font-bold tracking-[0.3em] text-stone-500 mb-4 uppercase">INJECT POWER-UPS</h3>
                            <p className="text-[10px] text-stone-400 mb-4 leading-relaxed">
                                Toggle a mode below, then <span className="text-[var(--color-primary-cyan)] font-bold">CLICK ON THE MAP</span> to spawn.
                            </p>
                            
                            <div className="grid grid-cols-2 gap-2">
                                {powerUps.map(type => (
                                    <button 
                                        key={type} 
                                        onClick={() => actions.setSpawnMode(settings.spawnMode === `powerup-${type}` ? 'none' : `powerup-${type}`)}
                                        className={`px-2 py-2 border transition-all text-[10px] font-bold tracking-widest uppercase ${settings.spawnMode === `powerup-${type}` ? 'border-[var(--color-primary-cyan)] bg-[var(--color-primary-cyan)]/20 text-white' : 'bg-stone-900 border-stone-800 text-stone-400'}`}
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
        <div className="absolute right-4 bottom-20 w-80 bg-black/90 border-2 border-[var(--color-primary-cyan)] p-0 z-50 font-rajdhani text-white shadow-[0_0_40px_rgba(0,224,255,0.2)] backdrop-blur-xl overflow-hidden flex flex-col rounded-sm">
            {/* Header */}
            <div className="bg-[var(--color-primary-cyan)]/10 px-6 py-4 border-b border-[var(--color-primary-cyan)]/30 flex justify-between items-center">
                <div className="flex flex-col">
                    <h2 className="font-orbitron font-black text-lg tracking-[0.2em] text-[var(--color-primary-cyan)] leading-none">SANDBOX</h2>
                    <span className="text-[10px] text-[var(--color-primary-cyan)]/60 tracking-[0.4em] mt-1">ADMIN CONSOLE</span>
                </div>
                <button onClick={onClose} className="text-stone-500 hover:text-white transition-colors p-1">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-stone-800">
                {(['SYSTEM', 'ASSETS', 'POWER-UPS'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-3 text-[10px] font-bold tracking-[0.2em] transition-all border-b-2 ${activeTab === tab ? 'border-[var(--color-primary-cyan)] text-[var(--color-primary-cyan)] bg-[var(--color-primary-cyan)]/5' : 'border-transparent text-stone-500 hover:text-stone-300'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
                {renderTabContent()}
            </div>

            {/* Footer Status */}
            {settings.spawnMode !== 'none' && (
                <div className="bg-red-500/20 border-t border-red-500/30 px-6 py-2 flex items-center justify-between animate-pulse">
                    <span className="text-[10px] font-bold text-red-400 tracking-widest uppercase">Spawn Mode Active: {settings.spawnMode.split('-').pop()}</span>
                    <button onClick={() => actions.setSpawnMode('none')} className="text-[10px] font-black text-white underline tracking-widest uppercase">Cancel</button>
                </div>
            )}
        </div>
    );
};

export default SandboxPanel;
