
import React from 'react';

interface TankIconProps {
  color: string;
  className?: string;
  type?: 'player' | 'enemy' | 'boss';
  tier?: 'basic' | 'intermediate';
  bossType?: 'goliath' | 'viper' | 'sentinel';
  chassis?: 'vector-01' | 'rogue-scout' | 'iron-bastion' | 'goliath-prime';
}

const TankIcon: React.FC<TankIconProps> = ({ 
    color, 
    className = 'w-8 h-8',
    type = 'player',
    tier = 'basic',
    bossType = 'goliath',
    chassis
}) => {
  const strokeColor = '#1C1C1C';
  
  const renderBody = () => {
      // --- GOLIATH (Boss / Chassis) ---
      if ((type === 'boss' && bossType === 'goliath') || chassis === 'goliath-prime') {
          return (
              <g>
                  {/* Heavy Rear Tread Block */}
                  <rect x="2" y="14" width="20" height="6" rx="1" fill="#1c1917" stroke={strokeColor} strokeWidth="0.5" />
                  
                  {/* Chassis (Red Octagon) */}
                  <path d="M12 4 L18 6.5 L20 12 L18 17.5 L12 20 L6 17.5 L4 12 L6 6.5 Z" fill="#450a0a" stroke={color} strokeWidth="1.5"/>
                  
                  {/* Dual Barrels (Facing Up) */}
                  <rect x="8.5" y="2" width="2.5" height="12" fill="#333" stroke={strokeColor} strokeWidth="0.5" />
                  <rect x="13" y="2" width="2.5" height="12" fill="#333" stroke={strokeColor} strokeWidth="0.5" />
                  
                  {/* Turret Cap */}
                  <circle cx="12" cy="12" r="5" fill="#7f1d1d" stroke={strokeColor} strokeWidth="1"/>
                  {/* Red Eye */}
                  <circle cx="12" cy="12" r="2" fill={color} />
              </g>
          );
      }

      // --- IRON BASTION (Intermediate Enemy / Chassis) ---
      if ((type !== 'player' && tier === 'intermediate') || chassis === 'iron-bastion') {
          return (
              <g>
                  {/* Treads */}
                  <rect x="4" y="4" width="4" height="16" fill="#292524" />
                  <rect x="16" y="4" width="4" height="16" fill="#292524" />
                  {/* Body */}
                  <rect x="7" y="7" width="10" height="10" fill="#44403c" stroke={color} strokeWidth="1"/>
                  {/* Heavy Turret */}
                  <rect x="10" y="3" width="4" height="12" fill="#1c1917" />
                  <rect x="9" y="9" width="6" height="6" fill="#1c1917" stroke={color} strokeWidth="0.5"/>
              </g>
          );
      }

      // --- VECTOR-01 (Default Player) ---
      // Render if type is player AND chassis is either unspecified or explicitly vector-01
      if (type === 'player' && (!chassis || chassis === 'vector-01')) {
          return (
              <g>
                  {/* Pontoons */}
                  <path d="M5 6 L8 6 L8 18 L5 18 Z" fill="#020617" stroke={color} strokeWidth="0.5"/>
                  <path d="M16 6 L19 6 L19 18 L16 18 Z" fill="#020617" stroke={color} strokeWidth="0.5"/>
                  {/* Body */}
                  <path d="M9 8 L15 8 L14 16 L10 16 Z" fill="#1e293b" />
                  {/* Turret */}
                  <rect x="11" y="4" width="2" height="10" fill="#334155" />
                  <circle cx="12" cy="12" r="3" fill="#020617" stroke={color} strokeWidth="1"/>
              </g>
          );
      }
      
      // --- ROGUE SCOUT (Basic Enemy / Chassis / Fallback) ---
      // Rotated to point UP for consistency with other icons
      // REMASTERED PATH
      return (
          <g>
              {/* Remastered Delta Body (Arrowhead Pointing Up) 
                  Based on: M12 2 L19 19 L13 15 L11 15 L5 19 Z
              */}
              <path d="M12 2 L19 19 L13 15 L11 15 L5 19 Z" fill="#1c1917" stroke={color} strokeWidth="1"/>
              
              {/* Engine Block */}
              <rect x="10.5" y="16" width="3" height="4" fill={color} />
              
              {/* Turret / Sensor */}
              <circle cx="12" cy="12" r="3" fill="#334155" />
              <circle cx="12" cy="11" r="1.5" fill={color} />
          </g>
      );
  };

  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <g strokeWidth="1" transform="translate(0, 0)">
         {renderBody()}
      </g>
    </svg>
  );
};

export default TankIcon;
