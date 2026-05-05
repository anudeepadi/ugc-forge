import React from 'react';
import { cn } from '@/lib/utils';

export interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ eyebrow, title, description, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('mb-10 md:mb-14', className)}>
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          {eyebrow && (
            <p className="text-label text-white/50 mb-3">{eyebrow}</p>
          )}
          <h2 className="text-section-header text-3xl md:text-4xl text-white">{title}</h2>
          {description && (
            <p className="text-white/70 text-base md:text-lg mt-3 max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {action && <div className="flex-shrink-0 mt-1">{action}</div>}
      </div>
    </div>
  );
}
