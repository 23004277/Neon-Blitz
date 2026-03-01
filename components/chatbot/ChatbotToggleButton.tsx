import React from 'react';

interface ChatbotToggleButtonProps {
  onClick: () => void;
  isVisible: boolean; // This is the master switch
}

const ChatbotToggleButton: React.FC<ChatbotToggleButtonProps> = ({ onClick, isVisible }) => {
  return (
    <button
      onClick={onClick}
      className={`
        fixed bottom-0 left-1/2 -translate-x-1/2 z-50
        group flex flex-row items-center justify-between gap-4 px-8 py-3 w-72 h-14
        bg-black/80 backdrop-blur-md 
        border-t-2 border-x border-x-transparent border-t-[var(--color-primary-cyan)]/40
        text-[var(--color-primary-cyan)]
        transition-all duration-700 cubic-bezier(0.19, 1, 0.22, 1)
        hover:border-t-[var(--color-primary-cyan)] hover:bg-[var(--color-primary-cyan)]/5 
        hover:shadow-[0_-10px_30px_rgba(0,240,255,0.15)]
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}
      `}
      style={{
        clipPath: 'polygon(20px 0, calc(100% - 20px) 0, 100% 100%, 0 100%)',
      }}
      aria-label="Open AI Assistant"
    >
      {/* Decorative Shimmer Effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent" />
      </div>

      {/* Left Decoration Line */}
      <div className="h-0.5 w-8 bg-gradient-to-r from-[var(--color-primary-cyan)] to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />

      {/* Center Content */}
      <div className="relative z-10 flex flex-row items-center gap-3 flex-grow justify-center">
          <div className="relative group-hover:scale-110 transition-transform duration-300">
            <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="w-5 h-5 text-[var(--color-primary-cyan)] drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            
            {/* Status Dot */}
            <div className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 shadow-[0_0_5px_lime]"></span>
            </div>
          </div>

          <div className="font-orbitron font-bold text-xs tracking-[0.25em] uppercase text-[var(--color-text-dim)] group-hover:text-white transition-colors duration-300 whitespace-nowrap">
            AI Uplink
          </div>
      </div>

      {/* Right Decoration Line */}
      <div className="h-0.5 w-8 bg-gradient-to-l from-[var(--color-primary-cyan)] to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
      
      <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out -z-10" />
    </button>
  );
};

export default ChatbotToggleButton;