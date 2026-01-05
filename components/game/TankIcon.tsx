import React from 'react';

interface TankIconProps {
  color: string;
  className?: string;
}

const TankIcon: React.FC<TankIconProps> = ({ color, className = 'w-8 h-8' }) => {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <g strokeWidth="1.5" transform="translate(0, -1)">
         {/* Main Body with stroke */}
        <path d="M4 6C4 5.44772 4.44772 5 5 5H19C19.5523 5 20 5.44772 20 6V19C20 19.5523 19.5523 20 19 20H5C4.44772 20 4 19.5523 4 19V6Z" fill="#404040" stroke="#1C1C1C"/>
        {/* Turret */}
        <circle cx="12" cy="12.5" r="4.5" fill={color} stroke="#1C1C1C"/>
        {/* Barrel */}
        <line x1="12" y1="12.5" x2="12" y2="2" stroke="#737373" strokeWidth="2.5" strokeLinecap="round"/>
      </g>
    </svg>
  );
};

export default TankIcon;
