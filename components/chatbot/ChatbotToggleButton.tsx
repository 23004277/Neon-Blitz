import React from 'react';

interface ChatbotToggleButtonProps {
  onClick: () => void;
  isVisible: boolean;
}

const ChatbotToggleButton: React.FC<ChatbotToggleButtonProps> = ({ onClick, isVisible }) => {
  const ariaLabel = 'Open AI assistant';

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        className={`group fixed top-1/2 right-0 z-50 flex h-48 w-10 transform items-center justify-center border-y-2 border-l-2 border-[var(--color-border)] bg-black/80 text-[var(--color-text-medium)] shadow-lg backdrop-blur-sm transition-all duration-300 ease-in-out will-change-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}
        -translate-y-1/2 hover:bg-[var(--color-primary-cyan)]/10 hover:border-[var(--color-border-glow)]`}
        style={{clipPath: 'polygon(100% 0, 100% 100%, 0 100%, 25% 50%, 0 0)'}}
      >
        {/* Glowing Pulse Effect */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-50 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            boxShadow: 'inset 0 0 8px var(--color-border-glow), 0 0 12px var(--color-border-glow)',
          }}
        />

        {/* Content Container */}
        <div className="relative flex h-full w-full flex-col items-center justify-between py-4 pl-2">
          {/* Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 flex-shrink-0 text-cyan-400 transition-all duration-300 group-hover:text-cyan-200 group-hover:drop-shadow-[0_0_4px_var(--color-primary-cyan)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>

          {/* Vertical Text */}
          <span
            aria-hidden
            className="font-orbitron text-sm uppercase tracking-[0.2em] text-cyan-400 transition-colors duration-300 group-hover:text-cyan-200"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            AI ASSIST
          </span>

          {/* Indicator Light */}
          <div className="relative h-5 w-5">
            <span
              aria-hidden
              className="absolute inset-0.5 animate-pulse-slow rounded-full bg-green-500/50"
            />
            <span
              aria-hidden
              className="absolute inset-1 rounded-full bg-green-400"
              style={{ boxShadow: '0 0 5px rgba(74, 222, 128, 0.8)' }}
            />
          </div>
        </div>
      </button>
      <style>{`
        @keyframes pulse-slow {
          50% { opacity: 0.6; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-pulse-slow { 
            animation: none !important; 
          }
          button {
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
};

export default ChatbotToggleButton;
