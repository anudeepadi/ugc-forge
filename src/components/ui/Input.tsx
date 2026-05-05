import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? `input-${Math.random().toString(36).slice(2, 7)}`;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="text-label text-white/60 mb-2 block">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-4 py-3 bg-transparent border text-white/90 placeholder:text-white/30',
            'focus:outline-none transition-colors duration-200',
            error ? 'border-red-brand' : 'border-white/20 focus:border-red-brand',
            className,
          )}
          {...props}
        />
        {hint && !error && <p className="text-xs text-white/50 mt-1.5">{hint}</p>}
        {error && <p className="text-xs text-red-light mt-1.5">{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';
