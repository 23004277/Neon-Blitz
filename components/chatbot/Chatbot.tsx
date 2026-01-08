
import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../../types';
import { useAudio } from '../../contexts/AudioContext';

interface ChatbotProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSend: (input: string) => void;
  onClose: () => void;
}

const renderFormattedText = (text: string): React.ReactNode => {
  if (!text) return null;
  const linkified = text.split(/(\[.*?\]\(.*?\))/g);
  return linkified.map((chunk, i) => {
    const linkMatch = chunk.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      const [, label, url] = linkMatch;
      return (
        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-cyan-300 hover:text-cyan-100 underline decoration-cyan-500/50 underline-offset-4 transition-colors">
          {label}
        </a>
      );
    }
    const parts = chunk.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={`${i}-${j}`} className="text-white font-black tracking-wide text-glow-cyan">{part.slice(2, -2)}</strong>;
      if (part.startsWith('*') && part.endsWith('*')) return <em key={`${i}-${j}`} className="text-cyan-200 italic">{part.slice(1, -1)}</em>;
      return <span key={`${i}-${j}`}>{part}</span>;
    });
  });
};

const Chatbot: React.FC<ChatbotProps> = ({ messages, isLoading, onSend, onClose }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const audio = useAudio();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => scrollToBottom(), [messages, isLoading]);

  useEffect(() => {
    inputRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Sound effects for messages
  useEffect(() => {
      if (messages.length > 0) {
          const last = messages[messages.length - 1];
          if (last.sender === 'bot') {
              audio.play('uiToggle');
          }
      }
  }, [messages, audio]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    
    audio.play('uiClick');
    onSend(trimmed);
    setInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        {/* Main Window */}
        <div className="relative w-full max-w-2xl h-[70vh] flex flex-col bg-[#050a10] border border-cyan-500/30 shadow-[0_0_40px_rgba(0,240,255,0.15)] overflow-hidden"
             style={{ clipPath: "polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)" }}>
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-cyan-950/20 border-b border-cyan-500/20 relative">
                <div className="absolute top-0 left-0 w-20 h-[2px] bg-cyan-500 shadow-[0_0_10px_#00f0ff]"></div>
                
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-10 h-10 border-2 border-cyan-500/50 flex items-center justify-center bg-black/50 overflow-hidden rounded-sm">
                            <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-500 shadow-[0_0_5px_#22c55e] animate-pulse"></div>
                    </div>
                    <div>
                        <h2 className="font-orbitron font-bold text-cyan-400 tracking-wider text-sm">CMD. DARLEK</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-cyan-700">LINK_ESTABLISHED</span>
                            <span className="w-12 h-1 bg-cyan-900/50 overflow-hidden flex gap-0.5">
                                <span className="w-full bg-cyan-500 animate-[pulse_1s_infinite]"></span>
                            </span>
                        </div>
                    </div>
                </div>

                <button onClick={onClose} className="p-2 hover:bg-red-500/10 group transition-colors rounded-sm border border-transparent hover:border-red-500/30">
                    <svg className="w-6 h-6 text-cyan-700 group-hover:text-red-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 relative custom-scrollbar bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.03),transparent_70%)]">
                {/* Scanlines Overlay for content area */}
                <div className="fixed inset-0 pointer-events-none opacity-5 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                
                {messages.map((msg, i) => {
                    const isBot = msg.sender === 'bot';
                    return (
                        <div key={i} className={`flex ${isBot ? 'justify-start' : 'justify-end'} animate-slide-up`} style={{ animationDelay: `${i * 50}ms` }}>
                            {isBot && (
                                <div className="mr-3 mt-1 text-[10px] font-mono text-cyan-800 hidden sm:block">
                                    SYS<br/>MSG
                                </div>
                            )}
                            <div className={`relative max-w-[85%] p-4 border text-sm font-rajdhani leading-relaxed shadow-lg backdrop-blur-md
                                ${isBot 
                                    ? 'bg-black/60 border-cyan-500/30 text-cyan-100 rounded-tr-xl rounded-bl-xl border-l-2 border-l-cyan-500' 
                                    : 'bg-cyan-900/10 border-white/10 text-white rounded-tl-xl rounded-br-xl border-r-2 border-r-[var(--color-primary-magenta)]'}
                            `}>
                                {/* Decorative corners */}
                                <div className={`absolute top-0 w-2 h-2 border-t border-current opacity-50 ${isBot ? 'left-0 border-l' : 'right-0 border-r'}`}></div>
                                <div className={`absolute bottom-0 w-2 h-2 border-b border-current opacity-50 ${isBot ? 'right-0 border-r' : 'left-0 border-l'}`}></div>

                                {isBot ? (
                                    <div className="prose prose-invert prose-p:my-1 prose-headings:text-cyan-300 prose-strong:text-cyan-300">
                                        {renderFormattedText(msg.text)}
                                    </div>
                                ) : (
                                    <span>{msg.text}</span>
                                )}
                            </div>
                        </div>
                    );
                })}
                {isLoading && (
                    <div className="flex justify-start animate-pulse">
                        <div className="bg-black/60 border border-cyan-500/30 px-4 py-3 rounded-tr-xl rounded-bl-xl flex gap-1 items-center">
                            <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce delay-100"></span>
                            <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce delay-200"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-black/80 border-t border-cyan-500/20 backdrop-blur-xl">
                <form onSubmit={handleSend} className="flex gap-4">
                    <div className="relative flex-1 group">
                        <div className="absolute inset-0 bg-cyan-500/5 clip-corner-4 pointer-events-none group-focus-within:bg-cyan-500/10 transition-colors"></div>
                        <input 
                            ref={inputRef}
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="TRANSMIT MESSAGE..."
                            className="w-full bg-transparent border border-cyan-900/50 text-cyan-100 placeholder-cyan-800/50 px-4 py-3 font-orbitron text-sm focus:border-cyan-500/50 focus:outline-none focus:shadow-[0_0_15px_rgba(0,240,255,0.1)] transition-all clip-corner-2"
                            disabled={isLoading}
                        />
                        {/* Blinking cursor effect at end (fake) */}
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-4 bg-cyan-500/50 animate-pulse pointer-events-none hidden group-focus-within:block"></div>
                    </div>
                    <button 
                        type="submit" 
                        disabled={isLoading || !input.trim()}
                        className="px-6 bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 font-orbitron font-bold tracking-wider hover:bg-cyan-500 hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed clip-corner-4 shadow-[0_0_10px_rgba(0,240,255,0.1)] hover:shadow-[0_0_20px_rgba(0,240,255,0.4)]"
                    >
                        SEND
                    </button>
                </form>
            </div>
        </div>
        
        <style>{`
            .text-glow-cyan { text-shadow: 0 0 10px rgba(0, 240, 255, 0.5); }
            .clip-corner-2 { clip-path: polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%); }
            .clip-corner-4 { clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px); }
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #0e7490; border-radius: 2px; }
        `}</style>
    </div>
  );
};

export default Chatbot;
    