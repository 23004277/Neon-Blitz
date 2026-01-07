
import React from 'react';

interface ChatbotToggleButtonProps {
  onClick: () => void;
  isVisible: boolean;
}

const ChatbotToggleButton: React.FC<ChatbotToggleButtonProps> = ({ onClick, isVisible }) => {
  return (
    <button
      onClick={onClick}
      className={`
        fixed right-0 top-1/2 -translate-y-1/2 z-50
        group flex flex-col items-center justify-between gap-6 py-6 px-3 h-64
        bg-black/80 backdrop-blur-md 
        border-l-2 border-y border-y-transparent border-l-[var(--color-primary-cyan)]/40
        text-[var(--color-primary-cyan)]
        transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
        hover:border-l-[var(--color-primary-cyan)] hover:bg-[var(--color-primary-cyan)]/5 hover:shadow-[-10px_0_30px_rgba(0,240,255,0.15)]
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}
      `}
      style={{
        clipPath: 'polygon(0 20px, 20px 0, 100% 0, 100% 100%, 20px 100%, 0 calc(100% - 20px))',
      }}
      aria-label="Open AI Assistant"
    >
      {/* Top Decoration Line */}
      <div className="w-0.5 h-8 bg-gradient-to-b from-[var(--color-primary-cyan)] to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />

      {/* Center Content */}
      <div className="flex flex-col items-center gap-5 flex-grow justify-center">
          {/* Icon Container */}
          <div className="relative group-hover:scale-110 transition-transform duration-300">
            <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="w-6 h-6 text-[var(--color-primary-cyan)] drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
            >
                {/* Robot/AI Face Icon */}
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            
            {/* Status Dot */}
            <div className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 shadow-[0_0_5px_lime]"></span>
            </div>
          </div>

          {/* Vertical Text */}
          <div 
            className="font-orbitron font-bold text-[10px] tracking-[0.25em] uppercase text-[var(--color-text-dim)] group-hover:text-white transition-colors duration-300 whitespace-nowrap"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            AI Uplink
          </div>
      </div>

      {/* Bottom Decoration Line */}
      <div className="w-0.5 h-8 bg-gradient-to-t from-[var(--color-primary-cyan)] to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
      
      {/* Hover Slide Effect Backing */}
      <div className="absolute inset-0 bg-white/5 translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out -z-10" />
    </button>
  );
};

export default ChatbotToggleButton;
