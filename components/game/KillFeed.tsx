import React from 'react';
import { KillFeedMessage } from '../../types';

interface KillFeedProps {
    messages: KillFeedMessage[];
}

const KillFeed: React.FC<KillFeedProps> = ({ messages }) => {
    const now = Date.now();
    const recentMessages = messages.filter(m => now - m.createdAt < 5000); // Show for 5 seconds

    return (
        <div className="w-72 text-sm font-medium text-white/90 font-mono tracking-tighter flex flex-col items-end">
            {recentMessages.map(msg => (
                <div key={msg.id} className="bg-black/40 p-1.5 rounded-sm mb-1 animate-fadeInRight text-right w-full">
                    <span style={{ color: msg.killerColor }} className="font-bold">{msg.killerName}</span>
                    <span className="text-gray-400"> destroyed </span>
                    <span style={{ color: msg.victimColor }} className="font-bold">{msg.victimName}</span>
                </div>
            ))}
        </div>
    );
};

export default KillFeed;
