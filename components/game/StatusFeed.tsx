import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { StatusMessage } from '../../types';

interface StatusFeedProps {
    messages: StatusMessage[];
}

const StatusFeed: React.FC<StatusFeedProps> = ({ messages }) => {
    return (
        <div className="absolute bottom-8 right-8 flex flex-col items-end gap-2 pointer-events-none z-40">
            <AnimatePresence>
                {messages.map((msg) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, x: 20, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-3 bg-black/80 backdrop-blur-sm border-r-2 px-4 py-2 rounded-l-sm shadow-lg"
                        style={{ borderColor: msg.color || '#fff' }}
                    >
                        <span className="font-rajdhani font-bold text-lg tracking-wide text-white">
                            {msg.text}
                        </span>
                        <div 
                            className="w-2 h-2 rounded-full animate-pulse"
                            style={{ backgroundColor: msg.color || '#fff', boxShadow: `0 0 8px ${msg.color || '#fff'}` }}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default StatusFeed;
