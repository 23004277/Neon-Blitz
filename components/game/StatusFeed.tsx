import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { StatusMessage } from '../../types';

interface StatusFeedProps {
    messages: StatusMessage[];
}

const StatusFeed: React.FC<StatusFeedProps> = ({ messages }) => {
    return (
        <div className="absolute bottom-12 right-12 flex flex-col items-end gap-2 pointer-events-none z-40 select-none">
            <AnimatePresence>
                {messages.map((msg) => {
                    const isAlert = msg.type === 'debuff' || msg.type === 'kill';
                    const baseColor = msg.color || (isAlert ? '#ef4444' : '#06b6d4');
                    
                    return (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, x: 20, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            className="relative flex items-center gap-3 bg-black/60 backdrop-blur-md border border-white/10 pl-4 pr-3 py-2 rounded-sm shadow-[0_0_15px_rgba(0,0,0,0.5)] overflow-hidden"
                        >
                            {/* Left Accent Bar */}
                            <div 
                                className="absolute left-0 top-0 bottom-0 w-1 shadow-[0_0_8px_currentColor]"
                                style={{ backgroundColor: baseColor, color: baseColor }}
                            />
                            
                            {/* Scanline Effect */}
                            <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(255,255,255,0.25)_50%)] bg-[length:100%_4px]" />

                            <span className="font-orbitron font-bold text-[10px] tracking-[0.2em] uppercase text-white drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]">
                                {msg.text}
                            </span>
                            
                            <div className="flex items-center justify-center w-4 h-4 rounded-sm bg-black/40 border border-white/10">
                                <div 
                                    className={`w-1.5 h-1.5 ${isAlert ? 'animate-ping' : 'animate-pulse'}`}
                                    style={{ backgroundColor: baseColor, boxShadow: `0 0 8px ${baseColor}` }}
                                />
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};

export default StatusFeed;
