import React from 'react';

interface SegmentedControlProps<T extends string> {
  name: string;
  options: T[];
  value: T;
  onChange: (value: T) => void;
}

const SegmentedControl = <T extends string>({ name, options, value, onChange }: SegmentedControlProps<T>) => {
  return (
    <div className="grid grid-cols-2 w-full h-12 bg-black/50 border-2 border-[var(--color-border)] cut-corners overflow-hidden">
      {options.map((option, index) => {
        const isActive = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`
              relative text-center font-orbitron uppercase text-sm font-bold tracking-wider transition-all duration-300 ease-in-out
              focus:outline-none focus:z-10 focus:ring-2 focus:ring-inset focus:ring-[var(--color-primary-magenta)]
              ${isActive
                ? 'bg-[var(--color-primary-magenta)] text-white shadow-[0_0_15px_rgba(240,0,184,0.5)]'
                : 'text-[var(--color-text-medium)] hover:bg-white/5'
              }
            `}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
};

export default SegmentedControl;
