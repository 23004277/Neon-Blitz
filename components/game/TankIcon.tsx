
import React from 'react';

interface TankIconProps {
  color: string;
  className?: string;
  type?: 'player' | 'enemy' | 'boss';
  tier?: 'basic' | 'intermediate';
  bossType?: 'goliath' | 'viper' | 'sentinel';
}

const TankIcon: React.FC<TankIconProps> = ({ 
    color, 
    className = 'w-8 h-8',
    type = 'player',
    tier = 'basic',
    bossType = 'goliath'
}) => {
  const strokeColor = '#1C1C1C';
  
  const renderBody = () => {
      if (type === 'boss') {
          // GOLIATH (Octagon + Double Barrel)
          return (
              <g>
                  {/* Heavy Treads */}
                  <rect x="5" y="4" width="14" height="16" fill="#1c1917" />
                  {/* Chassis */}
                  <path d="M12 2 L19 5 V19 L12 22 L5 19 V5 Z" fill="#450a0a" stroke={color} strokeWidth="1.5"/>
                  {/* Double Barrel */}
                  <rect x="10.5" y="2" width="1" height="10" fill="#333" />
                  <rect x="12.5" y="2" width="1" height="10" fill="#333" />
                  {/* Turret Cap */}
                  <circle cx="12" cy="12" r="5" fill="#7f1d1d" stroke={strokeColor} />
                  <circle cx="12" cy="12" r="2" fill={color} />
              </g>
          );
      }
      
      if (type === 'player') {
          // PLAYER (Hover Tank)
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

      if (tier === 'intermediate') {
          // IRON BASTION (Square H-shape)
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
      
      // ROGUE SCOUT (Redesigned - Arrowhead)
      return (
          <g>
              {/* Delta Body */}
              <path d="M20 12 L6 20 L8 14 L8 10 L6 4 Z" fill="#1c1917" stroke={color} strokeWidth="1"/>
              {/* Engines */}
              <rect x="5" y="5" width="2" height="2" fill={color} />
              <rect x="5" y="17" width="2" height="2" fill={color} />
              {/* Turret */}
              <circle cx="11" cy="12" r="4" fill="#44403c" stroke={color} strokeWidth="1"/>
              <rect x="11" y="11" width="10" height="2" fill="#292524" />
              <rect x="19" y="10.5" width="2" height="3" fill={color} />
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
