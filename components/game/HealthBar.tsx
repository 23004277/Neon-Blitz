import React from 'react';

interface HealthBarProps {
  currentHealth: number;
  maxHealth: number;
  color: string;
  shieldHealth?: number;
  maxShieldHealth?: number;
}

const HealthBar: React.FC<HealthBarProps> = ({ currentHealth, maxHealth, color, shieldHealth, maxShieldHealth = 3 }) => {
  const healthPercentage = (currentHealth / maxHealth) * 100;
  
  return (
    <div className="w-full h-4 flex flex-col justify-center">
      {/* Shield Pips */}
      <div className="flex items-center space-x-1 mb-1 h-2">
        {shieldHealth && shieldHealth > 0 && Array.from({ length: maxShieldHealth }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1 transition-colors duration-200 ${i < shieldHealth ? 'bg-cyan-400 animate-pulse-shield' : 'bg-cyan-800/50'}`}
            style={{ 
              boxShadow: i < shieldHealth ? '0 0 4px #06b6d4' : 'none',
              animationDelay: `${i * 100}ms`
            }}
          />
        ))}
      </div>

      {/* Health Bar */}
      <div className="w-full h-1 bg-stone-800/70" style={{boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)'}}>
        <div
          className="h-full transition-all duration-300 ease-out"
          style={{
            width: `${healthPercentage}%`,
            backgroundColor: color,
            boxShadow: `0 0 6px ${color}`,
          }}
        ></div>
      </div>
       <style>{`
        @keyframes pulse-shield {
          50% { opacity: 0.7; transform: scaleY(0.8); }
        }
        .animate-pulse-shield {
          animation: pulse-shield 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default HealthBar;