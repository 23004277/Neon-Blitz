
import React from 'react';

import { ChassisType } from '../../types';

interface TankIconProps {
  color: string;
  className?: string;
  type?: 'player' | 'enemy' | 'boss';
  tier?: 'basic' | 'intermediate';
  bossType?: 'goliath' | 'viper' | 'sentinel';
  chassis?: ChassisType;
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
      if ((type === 'boss' && bossType === 'goliath') || chassis === 'goliath-prime' || chassis === 'goliath-prime-overdrive') {
          const isOverdrive = chassis === 'goliath-prime-overdrive';
          const goliathColor = isOverdrive ? '#b91c1c' : color;
          const accentColor = isOverdrive ? '#fbbf24' : '#7f1d1d';

          return (
              <g>
                  {/* Treads */}
                  <rect x="2" y="2" width="6" height="20" rx="1" fill="#1c1917" stroke={strokeColor} strokeWidth="0.5" />
                  <rect x="16" y="2" width="6" height="20" rx="1" fill="#1c1917" stroke={strokeColor} strokeWidth="0.5" />

                  {/* Main Body (Octagon) */}
                  <path d="M12 4 L18 7 L18 17 L12 20 L6 17 L6 7 Z" fill="#450a0a" stroke={goliathColor} strokeWidth="1.5"/>
                  
                  {/* Turret Base */}
                  <circle cx="12" cy="12" r="8" fill={accentColor} stroke={goliathColor} strokeWidth="1"/>

                  {/* Dual Barrels */}
                  <rect x="10" y="2" width="4" height="12" fill="#333" stroke={strokeColor} strokeWidth="0.5" />
                  <rect x="10" y="10" width="4" height="12" transform="rotate(180 12 12)" fill="#333" stroke={strokeColor} strokeWidth="0.5" />

                  {/* Red Eye */}
                  <circle cx="12" cy="12" r="3" fill={isOverdrive ? '#fbbf24' : '#fca5a5'} />
              </g>
          );
      }

      // --- PHANTOM WEAVER (Preview Style) ---
      if (chassis === 'phantom-weaver') {
          return (
              <g transform="translate(0 2)">
                  <path d="M12 20 L4 4 L12 8 L20 4 Z" fill="rgba(192, 77, 242, 0.1)" stroke={color} strokeWidth="1.5" />
                  <path d="M12 8 L12 4" stroke={color} strokeWidth="1" />
                  <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1" fill="none" />
              </g>
          );
      }

      // --- TITAN OGRE (Preview Style) ---
      if (chassis === 'titan-ogre') {
          return (
              <g transform="rotate(10 12 12)">
                  <rect x="3" y="3" width="18" height="18" rx="1" fill="rgba(234, 88, 12, 0.1)" stroke={color} strokeWidth="1.5" />
                  <rect x="5" y="5" width="6" height="6" fill="#1a1a1a" stroke={color} strokeWidth="0.5" />
                  <rect x="13" y="5" width="6" height="6" fill="#1a1a1a" stroke={color} strokeWidth="0.5" />
                  <rect x="5" y="13" width="6" height="6" fill="#1a1a1a" stroke={color} strokeWidth="0.5" />
                  <rect x="13" y="13" width="6" height="6" fill="#1a1a1a" stroke={color} strokeWidth="0.5" />
              </g>
          );
      }

      // --- VOLT STRIDER (New Style) ---
      if (chassis === 'volt-strider') {
          return (
              <g>
                  <path d="M8 4 L16 4 L10 12 L18 12 L8 20" stroke={color} strokeWidth="2" fill="none" />
                  <circle cx="8" cy="4" r="2" fill={color} />
                  <circle cx="18" cy="20" r="2" fill={color} />
              </g>
          );
      }

      // --- INFERNO COBRA (New Style) ---
      if (chassis === 'inferno-cobra') {
          return (
              <g>
                  <path d="M12 2 C 6 2, 4 8, 4 12 C 4 18, 8 22, 12 22 C 16 22, 20 18, 20 12 C 20 8, 18 2, 12 2 Z" fill="rgba(239, 68, 68, 0.1)" stroke={color} strokeWidth="1.5" />
                  <path d="M9 8 L11 10" stroke={color} strokeWidth="1.5" />
                  <path d="M15 8 L13 10" stroke={color} strokeWidth="1.5" />
              </g>
          );
      }

      // --- CRYSTAL VANGUARD (New Style) ---
      if (chassis === 'crystal-vanguard') {
          return (
              <g>
                  <path d="M12 2 L22 10 L18 22 L6 22 L2 10 Z" fill="rgba(6, 182, 212, 0.1)" stroke={color} strokeWidth="1.5" />
                  <path d="M12 2 L12 22 M2 10 L22 10 M12 2 L6 22 M12 2 L18 22" stroke={color} strokeWidth="0.5" opacity="0.7" />
              </g>
          );
      }

      // --- IRON BASTION (Intermediate Enemy / Chassis) ---
      if ((type !== 'player' && tier === 'intermediate') || chassis === 'iron-bastion') {
          return (
              <g>
                  {/* Treads */}
                  <rect x="2" y="2" width="6" height="20" rx="1" fill="#292524" />
                  <rect x="16" y="2" width="6" height="20" rx="1" fill="#292524" />
                  {/* Body */}
                  <rect x="7" y="6" width="10" height="12" rx="1" fill="#44403c" stroke={color} strokeWidth="1"/>
                  {/* Turret */}
                  <rect x="10" y="2" width="4" height="14" fill="#1c1917" />
                  <rect x="9" y="8" width="6" height="8" fill="#1c1917" stroke={color} strokeWidth="0.5"/>
              </g>
          );
      }

      // --- VECTOR-01 (Default Player) ---
      // Render if type is player AND chassis is either unspecified or explicitly vector-01
      if (type === 'player' && (!chassis || chassis === 'vector-01')) {
          return (
              <g>
                  {/* Treads */}
                  <rect x="4" y="4" width="4" height="16" fill="#020617" stroke={color} strokeWidth="0.5"/>
                  <rect x="16" y="4" width="4" height="16" fill="#020617" stroke={color} strokeWidth="0.5"/>
                  {/* Body */}
                  <rect x="7" y="7" width="10" height="10" fill="#1e293b" />
                  {/* Turret */}
                  <rect x="11" y="4" width="2" height="10" fill="#334155" />
                  <circle cx="12" cy="12" r="4" fill="#020617" stroke={color} strokeWidth="1"/>
              </g>
          );
      }
      
      // --- ROGUE SCOUT (Basic Enemy / Chassis / Fallback) ---
      // Rotated to point UP for consistency with other icons
      return (
          <g>
              {/* Body */}
              <path d="M12 2 L18 18 L12 14 L6 18 Z" fill="#1c1917" stroke={color} strokeWidth="1"/>
              {/* Turret */}
              <circle cx="12" cy="12" r="3" fill="#334155" />
              <rect x="11" y="2" width="2" height="10" fill="#334155" />
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
