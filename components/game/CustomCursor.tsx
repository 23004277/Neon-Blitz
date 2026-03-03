
import React, { useState, useEffect, useRef } from 'react';

interface CustomCursorProps {
  currentScreen?: string;
}

const CustomCursor: React.FC<CustomCursorProps> = ({ currentScreen = 'main-menu' }) => {
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // Physics refs
  const cursorRef = useRef({ x: -100, y: -100 });
  const trailingRef = useRef({ x: -100, y: -100 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  const isGame = currentScreen === 'game';

  useEffect(() => {
    // Mouse Movement
    const onMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      cursorRef.current = { x: e.clientX, y: e.clientY };
      
      // Init position on first move to prevent "flying in" from 0,0
      if (!isVisible) {
        trailingRef.current = { x: e.clientX, y: e.clientY };
        setIsVisible(true);
      }

      // Hover Detection
      const target = e.target as HTMLElement;
      const clickable = target.closest('button, a, input, select, [role="button"], .cyber-panel');
      setIsHovering(!!clickable);
    };

    // Click/Shoot Handling
    const onMouseDown = () => setIsClicking(true);
    const onMouseUp = () => setIsClicking(false);

    // Keyboard Shooting (Spacebar) - ignoring interactions with inputs
    const onKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement;
      const isInput = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA');
      
      if (e.code === 'Space' && !isInput) {
        setIsClicking(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setIsClicking(false);
    };

    // Hide default cursor
    document.body.style.cursor = 'none';

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      document.body.style.cursor = 'auto';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [isVisible]);

  // Animation Loop for Physics
  useEffect(() => {
    const loop = () => {
      // Spring physics for trailing element
      const stiffness = 0.15;
      const damping = 0.8;

      const targetX = cursorRef.current.x;
      const targetY = cursorRef.current.y;

      const ax = (targetX - trailingRef.current.x) * stiffness;
      const ay = (targetY - trailingRef.current.y) * stiffness;

      velocityRef.current.x = (velocityRef.current.x + ax) * damping;
      velocityRef.current.y = (velocityRef.current.y + ay) * damping;

      trailingRef.current.x += velocityRef.current.x;
      trailingRef.current.y += velocityRef.current.y;

      // Update DOM directly for performance
      const trailingEl = document.getElementById('cursor-trailing');
      if (trailingEl) {
        trailingEl.style.transform = `translate3d(${trailingRef.current.x}px, ${trailingRef.current.y}px, 0)`;
      }
      
      const coordEl = document.getElementById('cursor-coords');
      if (coordEl) {
         coordEl.style.transform = `translate3d(${targetX + 20}px, ${targetY + 20}px, 0)`;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  if (!isVisible) return null;

  if (!isGame) {
    return (
      <div className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-screen overflow-visible">
        {/* Menu Cursor: Sci-fi Pointer */}
        <div 
          className="absolute"
          style={{ 
            transform: `translate3d(${mousePos.x}px, ${mousePos.y}px, 0)`
          }}
        >
          <svg 
            width="28" 
            height="28" 
            viewBox="0 0 28 28" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={`transition-transform duration-150 origin-top-left ${isClicking ? 'scale-90' : 'scale-100'} ${isHovering ? 'text-[var(--color-primary-cyan)] drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]' : 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.6)]'}`}
          >
            <path 
              d="M3 3L23 11L13 14L9 24L3 3Z" 
              fill="currentColor" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinejoin="round" 
            />
            <path 
              d="M13 14L20 21" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
            />
          </svg>
        </div>

        {/* Menu Trailing Element */}
        <div 
          id="cursor-trailing"
          className="absolute top-0 left-0 will-change-transform"
        >
          <div 
            className={`relative transition-all duration-300 ease-out flex items-center justify-center
              ${isHovering ? 'scale-125 opacity-100' : 'scale-100 opacity-50'}
              ${isClicking ? 'scale-75 opacity-100' : ''}
            `}
            style={{ transform: 'translate(-50%, -50%)' }}
          >
            <div className={`w-12 h-12 rounded-full border-2 border-[var(--color-primary-cyan)]/40 transition-all duration-300 ${isHovering ? 'border-[var(--color-primary-cyan)] bg-[var(--color-primary-cyan)]/10 shadow-[0_0_15px_rgba(34,211,238,0.4)]' : ''}`} />
            <div className={`absolute w-2 h-2 rounded-full bg-[var(--color-primary-cyan)]/50 transition-all duration-300 ${isHovering ? 'opacity-0' : 'opacity-100'}`} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-screen text-xs font-rajdhani font-bold text-[var(--color-primary-cyan)] overflow-visible">
      
      {/* Primary Crosshair Center (Instant) */}
      <div 
        className="absolute w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]"
        style={{ 
          transform: `translate3d(${mousePos.x}px, ${mousePos.y}px, 0) translate(-50%, -50%)`
        }}
      />

      {/* Trailing Reticle (Physics) */}
      <div 
        id="cursor-trailing"
        className="absolute top-0 left-0 will-change-transform"
      >
        <div 
          className={`relative transition-all duration-200 ease-out flex items-center justify-center
            ${isHovering ? 'scale-110' : 'scale-100'}
            ${isClicking ? 'scale-90' : ''}
          `}
        >
          {/* Tactical Crosshair */}
          <div className="absolute w-12 h-12">
            {/* Top */}
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-[var(--color-primary-cyan)]/80 transition-all ${isClicking ? 'top-1 bg-red-500 shadow-[0_0_8px_red]' : ''}`} />
            {/* Bottom */}
            <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-[var(--color-primary-cyan)]/80 transition-all ${isClicking ? 'bottom-1 bg-red-500 shadow-[0_0_8px_red]' : ''}`} />
            {/* Left */}
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-3 h-0.5 bg-[var(--color-primary-cyan)]/80 transition-all ${isClicking ? 'left-1 bg-red-500 shadow-[0_0_8px_red]' : ''}`} />
            {/* Right */}
            <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-3 h-0.5 bg-[var(--color-primary-cyan)]/80 transition-all ${isClicking ? 'right-1 bg-red-500 shadow-[0_0_8px_red]' : ''}`} />
            
            {/* Corner Accents */}
            <div className={`absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-[var(--color-primary-cyan)]/50 transition-all ${isHovering ? '-top-1 -left-1 border-[var(--color-primary-cyan)]' : ''}`} />
            <div className={`absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 border-[var(--color-primary-cyan)]/50 transition-all ${isHovering ? '-top-1 -right-1 border-[var(--color-primary-cyan)]' : ''}`} />
            <div className={`absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 border-[var(--color-primary-cyan)]/50 transition-all ${isHovering ? '-bottom-1 -left-1 border-[var(--color-primary-cyan)]' : ''}`} />
            <div className={`absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-[var(--color-primary-cyan)]/50 transition-all ${isHovering ? '-bottom-1 -right-1 border-[var(--color-primary-cyan)]' : ''}`} />
          </div>
          
          {/* Inner Rotating Ring (Decor) */}
          <div className={`absolute w-8 h-8 border border-dashed border-[var(--color-primary-cyan)]/40 rounded-full animate-[spin_4s_linear_infinite] ${isClicking ? 'border-red-500/60' : ''}`} />
        </div>
      </div>

      {/* Coordinates HUD */}
      <div 
        id="cursor-coords"
        className="absolute top-0 left-0 opacity-90 text-[10px] tracking-widest whitespace-nowrap will-change-transform"
      >
        <div className="flex flex-col gap-0.5 font-mono ml-6 mt-6">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isClicking ? 'bg-red-500 shadow-[0_0_5px_red]' : 'bg-[var(--color-primary-cyan)] shadow-[0_0_5px_var(--color-primary-cyan)]'}`} />
            <span className={`text-[9px] uppercase font-bold ${isClicking ? 'text-red-400' : 'text-[var(--color-primary-cyan)]/80'}`}>
              {isClicking ? 'ENGAGING' : 'TARGETING'}
            </span>
          </div>
          <div className="flex items-center justify-between bg-black/60 border-l-2 border-[var(--color-primary-cyan)] px-2 py-0.5 backdrop-blur-sm">
            <span className="text-[var(--color-primary-cyan)]/60 mr-2">X:</span>
            <span className="text-white">{Math.round(mousePos.x).toString().padStart(4, '0')}</span>
          </div>
          <div className="flex items-center justify-between bg-black/60 border-l-2 border-[var(--color-primary-cyan)] px-2 py-0.5 backdrop-blur-sm">
            <span className="text-[var(--color-primary-cyan)]/60 mr-2">Y:</span>
            <span className="text-white">{Math.round(mousePos.y).toString().padStart(4, '0')}</span>
          </div>
          
          {/* Decorative Corner */}
          <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[var(--color-primary-cyan)]/60" />
        </div>
      </div>

    </div>
  );
};

export default CustomCursor;
