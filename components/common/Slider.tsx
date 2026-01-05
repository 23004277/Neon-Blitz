import React from 'react';

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  value: number;
}

const Slider: React.FC<SliderProps> = ({ label, value, ...props }) => {
  const min = Number(props.min) || 0;
  const max = Number(props.max) || 1;
  const percentage = ((Number(value) - min) / (max - min)) * 100;

  const trackStyle: React.CSSProperties = {
    background: `linear-gradient(to right, var(--color-primary-magenta) ${percentage}%, #1f2937 ${percentage}%)`,
  };

  return (
    <div className="flex items-center gap-4">
      <label className="font-rajdhani font-semibold text-lg text-[var(--color-text-medium)] uppercase tracking-wide w-24 flex-shrink-0">
        {label}
      </label>
      <div className="flex-grow flex items-center gap-4">
        <div className="relative w-full flex items-center">
            <input
              type="range"
              value={value}
              style={trackStyle}
              className="w-full h-1.5 rounded-lg appearance-none cursor-pointer slider-thumb focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-magenta)]/50"
              {...props}
            />
        </div>
        <span className="font-orbitron font-bold text-lg text-[var(--color-primary-magenta)] w-12 text-center">
          {Math.round(percentage)}
        </span>
      </div>
      <style>{`
        .slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            background: transparent;
        }
        
        /* Webkit Browsers */
        .slider-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          background: var(--color-primary-magenta);
          border: 2px solid #111827;
          cursor: pointer;
          margin-top: 0px;
          box-shadow: 0 0 10px var(--color-primary-magenta);
          transition: background .2s ease-in-out;
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
        }
        .slider-thumb:disabled::-webkit-slider-thumb {
            background: #585858;
            border-color: #838383;
            box-shadow: none;
        }

        /* Firefox */
        .slider-thumb::-moz-range-thumb {
          width: 24px;
          height: 24px;
          background: var(--color-primary-magenta);
          border: 2px solid #111827;
          cursor: pointer;
          box-shadow: 0 0 10px var(--color-primary-magenta);
          transition: background .2s ease-in-out;
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
          border-radius: 0;
        }
        .slider-thumb:disabled::-moz-range-thumb {
            background: #585858;
            border-color: #838383;
            box-shadow: none;
        }
      `}</style>
    </div>
  );
};

export default Slider;
