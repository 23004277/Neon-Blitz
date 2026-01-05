import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange }) => {
  const handleToggle = () => {
    onChange(!checked);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={handleToggle}
      className={`relative inline-flex h-8 w-16 flex-shrink-0 items-center transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[var(--color-primary-cyan)]
      ${checked ? 'bg-[var(--color-primary-cyan)]' : 'bg-stone-800 border-2 border-stone-700'}
      `}
      style={{ clipPath: 'polygon(15% 0, 85% 0, 100% 50%, 85% 100%, 15% 100%, 0 50%)'}}
    >
      <span
        className={`absolute inline-flex h-full w-1/2 transform transition-transform duration-300 ease-in-out ${
          checked ? 'translate-x-full bg-cyan-200' : 'translate-x-0 bg-stone-500'
        }`}
        style={{ clipPath: 'polygon(15% 0, 85% 0, 100% 50%, 85% 100%, 15% 100%, 0 50%)'}}
      />
    </button>
  );
};

export default ToggleSwitch;
