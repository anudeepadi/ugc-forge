import React from 'react';
import { motion } from 'framer-motion';
import { containerVariants } from '@/lib/animations';
import { cn } from '@/lib/utils';

export interface ContentGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

const colClasses = {
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
};

const gapClasses = {
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8',
};

export function ContentGrid({ children, columns = 3, gap = 'md', className }: ContentGridProps) {
  return (
    <motion.div
      className={cn('grid', colClasses[columns], gapClasses[gap], className)}
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {children}
    </motion.div>
  );
}
