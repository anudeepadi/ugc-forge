import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

const styles = {
  default: 'border-white/30 text-white/60',
  success: 'border-success text-success',
  warning: 'border-warning text-warning',
  error: 'border-red-brand text-red-brand',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 text-xs font-medium border uppercase tracking-wider',
        styles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
