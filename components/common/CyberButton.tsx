
import React from 'react';
import { useAudio } from '../../contexts/AudioContext';

interface CyberButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

const CyberButton: React.FC<CyberButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  icon,
  className = '', 
  onClick,
  onMouseEnter,
  ...props 
}) => {
  const audio = useAudio();
  
  const baseClasses = `
    relative group font-orbitron font-bold uppercase tracking-wider 
    transition-all duration-300 ease-out 
    disabled:opacity-50 disabled:cursor-not-allowed
    clip-corner-4 overflow-hidden flex items-center justify-center gap-3
  `;

  const sizeClasses = {
    sm: "text-xs px-4 py-2",
    md: "text-sm px-8 py-3",
    lg: "text-lg px-10 py-4"
  };

  const variantClasses = {
    primary: `
      bg-[var(--color-primary-cyan)]/10 border border-[var(--color-primary-cyan)] text-[var(--color-primary-cyan)]
      hover:bg-[var(--color-primary-cyan)] hover:text-black
      shadow-[0_0_10px_rgba(0,240,255,0.2)] hover:shadow-[0_0_20px_rgba(0,240,255,0.6)]
    `,
    secondary: `
      bg-transparent border border-[var(--color-text-dim)] text-[var(--color-text-dim)]
      hover:border-[var(--color-text-light)] hover:text-[var(--color-text-light)] hover:bg-white/5
    `,
    danger: `
      bg-[var(--color-primary-magenta)]/10 border border-[var(--color-primary-magenta)] text-[var(--color-primary-magenta)]
      hover:bg-[var(--color-primary-magenta)] hover:text-white
      shadow-[0_0_10px_rgba(255,0,60,0.2)] hover:shadow-[0_0_20px_rgba(255,0,60,0.6)]
    `,
    ghost: `
      bg-transparent text-[var(--color-text-dim)] hover:text-[var(--color-primary-cyan)]
    `
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      audio.play('uiHover');
      if (onMouseEnter) onMouseEnter(e);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      audio.play('uiClick');
      if (onClick) onClick(e);
  };

  return (
    <button 
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`} 
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      {...props}
    >
      {/* Background slide effect */}
      <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out pointer-events-none"></span>
      
      {/* Icon */}
      {icon && <span className="relative z-10">{icon}</span>}
      
      {/* Text */}
      <span className="relative z-10">{children}</span>
      
      {/* Corner accents */}
      <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-current opacity-50 group-hover:opacity-100 transition-opacity"></span>
      <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-current opacity-50 group-hover:opacity-100 transition-opacity"></span>
    </button>
  );
};

export default CyberButton;
