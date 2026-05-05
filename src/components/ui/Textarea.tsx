import React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, rows = 4, ...props }, ref) => {
    const fieldId = id ?? `ta-${Math.random().toString(36).slice(2, 7)}`;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={fieldId} className="text-label text-white/60 mb-2 block">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={fieldId}
          rows={rows}
          className={cn(
            'w-full px-4 py-3 bg-transparent border text-white/90 placeholder:text-white/30',
            'focus:outline-none transition-colors duration-200 resize-y',
            error ? 'border-red-brand' : 'border-white/20 focus:border-red-brand',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-light mt-1.5">{error}</p>}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';
