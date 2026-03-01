
import React, { useState, useEffect, useRef } from 'react';

const CustomCursor: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // Physics refs
  const cursorRef = useRef({ x: -100, y: -100 });
  const trailingRef = useRef({ x: -100, y: -100 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

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
         // Only update text occasionally or just let React handle it if perf is fine. 
         // For smooth HUD text following, transform is better.
         coordEl.style.transform = `translate3d(${targetX + 20}px, ${targetY + 20}px, 0)`;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-screen text-xs font-rajdhani font-bold text-cyan-500 overflow-visible">
      
      {/* Primary Dot (Instant) */}
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
            ${isHovering ? 'scale-125 rotate-45' : 'scale-100 rotate-0'}
            ${isClicking ? 'scale-90' : ''}
          `}
        >
          {/* Outer Brackets */}
          <div 
            className={`absolute border border-cyan-500/60 w-8 h-8 transition-all duration-100 ease-linear
              ${isClicking ? 'w-12 h-12 opacity-80 border-cyan-400' : ''}
            `}
            style={{
              clipPath: 'polygon(0 0, 30% 0, 30% 10%, 70% 10%, 70% 0, 100% 0, 100% 30%, 90% 30%, 90% 70%, 100% 70%, 100% 100%, 70% 100%, 70% 90%, 30% 90%, 30% 100%, 0 100%, 0 70%, 10% 70%, 10% 30%, 0 30%)'
            }}
          />
          
          {/* Inner Rotating Ring (Decor) */}
          <div className="absolute w-10 h-10 border border-dashed border-cyan-500/30 rounded-full animate-[spin_8s_linear_infinite]" />
        </div>
      </div>

      {/* Coordinates HUD */}
      <div 
        id="cursor-coords"
        className="absolute top-0 left-0 opacity-80 text-[10px] tracking-widest whitespace-nowrap will-change-transform"
      >
        <div className="flex flex-col gap-0.5 font-mono">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-1 bg-cyan-500 animate-pulse" />
            <span className="text-[8px] text-cyan-400/60 uppercase">Targeting System Active</span>
          </div>
          <div className="flex items-center justify-between bg-black/40 border-l-2 border-cyan-500 px-2 py-0.5 backdrop-blur-[2px]">
            <span className="text-cyan-600 mr-2">LAT:</span>
            <span>{Math.round(mousePos.x).toString().padStart(4, '0')}</span>
          </div>
          <div className="flex items-center justify-between bg-black/40 border-l-2 border-cyan-500 px-2 py-0.5 backdrop-blur-[2px]">
            <span className="text-cyan-600 mr-2">LNG:</span>
            <span>{Math.round(mousePos.y).toString().padStart(4, '0')}</span>
          </div>
          
          {isClicking && (
            <div className="mt-1 text-[8px] text-red-500 animate-pulse font-bold uppercase tracking-tighter">
              ▸ Engaging Target
            </div>
          )}
        </div>
        
        {/* Decorative Corner */}
        <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-cyan-500/40" />
      </div>

    </div>
  );
};

export default CustomCursor;
