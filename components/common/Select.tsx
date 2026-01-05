import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({ children, className, ...props }) => {
  return (
    <div className="relative w-full">
      <select
        className={`w-full appearance-none bg-black/50 border-2 border-[var(--color-primary-magenta)]/60 text-white text-lg font-rajdhani font-semibold py-2.5 px-4 pr-10 rounded-md leading-tight focus:outline-none focus:bg-stone-800 focus:border-[var(--color-primary-magenta)] ${className}`}
        {...props}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[var(--color-primary-magenta)]">
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </div>
    </div>
  );
};

export default Select;
