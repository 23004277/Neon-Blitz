import React from 'react';
import { KillFeedMessage } from '../../types';

interface KillFeedProps {
    messages: KillFeedMessage[];
}

const KillFeed: React.FC<KillFeedProps> = ({ messages }) => {
    const now = Date.now();
    const recentMessages = messages.filter(m => now - m.createdAt < 5000); // Show for 5 seconds

    return (
        <div className="w-80 text-[10px] font-mono tracking-widest flex flex-col items-end gap-1 pointer-events-none select-none">
            {recentMessages.map(msg => (
                <div 
                    key={msg.id} 
                    className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-sm border border-white/5 shadow-[0_0_10px_rgba(0,0,0,0.5)] animate-fadeInRight"
                >
                    <span style={{ color: msg.killerColor }} className="font-bold uppercase drop-shadow-[0_0_3px_currentColor]">{msg.killerName}</span>
                    <div className="flex items-center gap-1 text-stone-500">
                        <div className="w-1 h-px bg-stone-500" />
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <div className="w-1 h-px bg-stone-500" />
                    </div>
                    <span style={{ color: msg.victimColor }} className="font-bold uppercase drop-shadow-[0_0_3px_currentColor]">{msg.victimName}</span>
                </div>
            ))}
            <style>{`
                @keyframes fadeInRight {
                    from { opacity: 0; transform: translateX(20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .animate-fadeInRight {
                    animation: fadeInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
};

export default KillFeed;
