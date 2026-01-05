import React from 'react';

interface FieldsetProps {
  legend: string;
  children: React.ReactNode;
}

const Fieldset: React.FC<FieldsetProps> = ({ legend, children }) => {
  return (
    <fieldset className="relative border-t-2 border-[var(--color-primary-magenta)]/20 pt-4">
      <legend className="font-orbitron text-base font-bold uppercase text-[var(--color-primary-magenta)]/80 tracking-widest px-2 ml-2">
        {legend}
      </legend>
      <div className="relative z-10 px-2 pb-2">
        {children}
      </div>
    </fieldset>
  );
};

export default Fieldset;
