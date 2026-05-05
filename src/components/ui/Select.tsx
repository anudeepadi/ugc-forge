import React from 'react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, id, ...props }, ref) => {
    const fieldId = id ?? `select-${Math.random().toString(36).slice(2, 7)}`;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={fieldId} className="text-label text-white/60 mb-2 block">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={fieldId}
          className={cn(
            'w-full px-4 py-3 bg-gray-dark border text-white/90',
            'focus:outline-none transition-colors duration-200 cursor-pointer',
            error ? 'border-red-brand' : 'border-white/20 focus:border-red-brand',
            className,
          )}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-light mt-1.5">{error}</p>}
      </div>
    );
  },
);
Select.displayName = 'Select';
