// Chatbot.tsx
import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../../types';

interface ChatbotProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSend: (input: string) => void;
  onClose: () => void;
}

/**
 * Simple parser for **bold**, *italic*, and basic [links](url).
 * Keeps it safe: returns React nodes and avoids dangerouslySetInnerHTML.
 */
const renderFormattedText = (text: string): React.ReactNode => {
  if (!text) return null;

  // Turn links into clickable anchors
  const linkified = text.split(/(\[.*?\]\(.*?\))/g);

  return linkified.map((chunk, i) => {
    const linkMatch = chunk.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      const [, label, url] = linkMatch;
      return (
        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="underline decoration-cyan-300/50">
          {label}
        </a>
      );
    }

    // Handle bold (**text**) and italic (*text*). We need to split in order.
    const parts = chunk.split(/(\*\*.*?\*\*|\*.*?\*)/g);

    return parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={`${i}-${j}`} className="font-bold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={`${i}-${j}`} className="italic">{part.slice(1, -1)}</em>;
      }
      return <span key={`${i}-${j}`}>{part}</span>;
    });
  });
};

const Chatbot: React.FC<ChatbotProps> = ({ messages, isLoading, onSend, onClose }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll smoothly to bottom when messages change
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => scrollToBottom(true), [messages, isLoading]);

  // Close on Escape, focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      // Ctrl+Enter to send quicker
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && input.trim()) {
        e.preventDefault();
        handleSend();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  const handleSend = (e?: React.FormEvent | null) => {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput('');
    // little delay so autoscroll sees the new "sending" state
    setTimeout(() => scrollToBottom(true), 40);
  };

  // Simple accessible live region id
  const liveId = 'chatbot-live-messages';

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chatbot-title"
    >
      {/* dim backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div
        className="relative w-full max-w-3xl h-[80vh] bg-black/80 border border-[var(--color-border)] rounded-lg shadow-2xl overflow-hidden flex flex-col box-glow-cyan"
      >
        {/* Header */}
        <header className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-cyan-800 flex items-center justify-center text-white font-orbitron text-lg border-2 border-[var(--color-primary-cyan)]/50">
              D
            </div>
            <div>
              <h2 id="chatbot-title" className="text-[var(--color-primary-cyan)] text-lg font-semibold font-orbitron tracking-wider text-glow-cyan">
                Commander Darlek
              </h2>
              <p className="text-xs text-[var(--color-text-medium)]">Tactical AI — transmit your orders.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              aria-label="Close chat"
              className="p-2 rounded-md hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-cyan)]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--color-text-medium)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>

        {/* Messages area */}
        <main className="flex-1 overflow-y-auto px-5 py-4 space-y-4" aria-live="polite" aria-atomic="false" id={liveId}>
          {messages.map((msg, idx) => {
            const isUser = msg.sender === 'user';
            return (
              <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && (
                  <div className="mr-3">
                    <div className="w-9 h-9 rounded-full bg-cyan-700 border-2 border-[var(--color-border-glow)] text-cyan-200 font-bold flex items-center justify-center font-orbitron">D</div>
                  </div>
                )}

                <div
                  className={`max-w-[78%] px-4 py-2 rounded-lg text-base leading-snug ${isUser ? 'bg-[var(--color-primary-magenta)]/30 text-fuchsia-100 self-end' : 'bg-cyan-600/10 text-cyan-100'} `}
                  style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
                >
                  {isUser ? <span>{msg.text}</span> : <div className="prose prose-invert">{renderFormattedText(msg.text)}</div>}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="mr-3">
                <div className="w-9 h-9 rounded-full bg-cyan-700 border-2 border-[var(--color-border-glow)] text-cyan-200 font-bold flex items-center justify-center font-orbitron">D</div>
              </div>
              <div className="max-w-[55%] px-4 py-2 rounded-lg bg-cyan-600/10 text-cyan-100">
                <div className="inline-flex items-center gap-2">
                  <span className="dot dot-1" />
                  <span className="dot dot-2" />
                  <span className="dot dot-3" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </main>

        {/* Input area */}
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex-shrink-0 px-5 py-4 border-t border-[var(--color-border)] bg-black/60">
          <div className="flex gap-3 items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Transmit your query..."
              disabled={isLoading}
              aria-label="Chat input"
              className="flex-1 bg-stone-900/70 border border-stone-700 px-4 py-2 rounded-md text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-magenta)] placeholder:text-stone-400"
              onKeyDown={(e) => {
                // Allow shift+enter for newline (if we later support multiline); prevent default for Enter to send.
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!isLoading && input.trim()) handleSend();
                }
              }}
            />

            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-5 py-2 rounded-md font-orbitron uppercase tracking-wider text-sm font-semibold transition bg-transparent border border-transparent disabled:opacity-60 disabled:cursor-not-allowed hover:enabled:bg-[var(--color-primary-magenta)]/20 hover:enabled:border-[var(--color-primary-magenta)]/80 hover:enabled:text-white"
               style={{
                borderColor: input.trim() ? 'var(--color-primary-magenta)' : 'var(--color-text-dark)',
                color: input.trim() ? 'var(--color-primary-magenta)' : 'var(--color-text-dark)',
              }}
            >
              Send
            </button>
          </div>
        </form>

        {/* Styles */}
        <style>{`
          /* Dot loader */
          .dot {
            display:inline-block;
            width:8px;
            height:8px;
            border-radius:999px;
            background:var(--color-primary-cyan);
            opacity:0.85;
            transform: translateY(0);
            animation: dot-bob 1s infinite ease-in-out;
          }
          .dot-2 { animation-delay: 0.12s; }
          .dot-3 { animation-delay: 0.24s; }

          @keyframes dot-bob {
            0% { transform: translateY(0); opacity: 0.8; }
            50% { transform: translateY(-6px); opacity: 1; }
            100% { transform: translateY(0); opacity: 0.8; }
          }

          /* Reduced-motion respect */
          @media (prefers-reduced-motion: reduce) {
            .dot, .scan-ring, * { animation: none !important; transition: none !important; }
            main { scroll-behavior: auto !important; }
          }

          /* Prose tweaks for rendered markdown-like text */
          .prose { color: #E6F7FF; }
          .prose strong { color: #fff; font-weight: 700; }
          .prose em { color: #dbeafe; font-style: italic; }
          .prose a { color: var(--color-primary-cyan); text-decoration: underline; }

        `}</style>
      </div>
    </div>
  );
};

export default Chatbot;
