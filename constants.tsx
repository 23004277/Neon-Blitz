import React from 'react';

const iconProps = {
  className: "h-7 w-7 text-[var(--color-text-light)]",
  // FIX: Changed "true" to the boolean true to satisfy the Booleanish type for aria-hidden.
  'aria-hidden': true,
};

export const SoundIcon = () => (
  <svg {...iconProps} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
  </svg>
);

// Using the same icon for on/off as per the design, letting the toggle show state.
export const SoundOnIcon = SoundIcon;
export const SoundOffIcon = SoundIcon;


export const MusicIcon = () => (
  <svg {...iconProps} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V7.5A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.75M9 9l-2.25 2.25M9 9l2.25 2.25" />
  </svg>
);

// Using the same icon for on/off as per the design, letting the toggle show state.
export const MusicOnIcon = MusicIcon;
export const MusicOffIcon = MusicIcon;

export const SettingsIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className={className || "h-7 w-7 text-[var(--color-primary-cyan)]"} 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor" 
    strokeWidth={1.5}
    aria-hidden="true"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M9.594 3.94c.09-.542.56-1.007 1.11-.95.542.057 1.007.56 1.11.95l.22 1.294c.126.738.625 1.391 1.294 1.76l1.294.748c.542.313.95.894.95 1.514v.22c0 .62-.408 1.201-.95 1.514l-1.294.748a2.25 2.25 0 01-1.294 1.76l-.22 1.294c-.103.59-.568 1.057-1.11.95-.542-.057-1.007-.56-1.11-.95l-.22-1.294a2.25 2.25 0 01-1.294-1.76l-1.294-.748c-.542-.313-.95-.894-.95-1.514v-.22c0-.62.408-1.201.95-1.514l1.294-.748a2.25 2.25 0 011.294-1.76l.22-1.294z" 
    />
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
    />
  </svg>
);

export const ScreenShakeIcon = () => (
    <svg {...iconProps} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0h9.75m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
    </svg>
);
