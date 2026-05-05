import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { pageVariants, pageTransition } from '@/lib/animations';
import { cn } from '@/lib/utils';

export interface PageShellProps {
  children: React.ReactNode;
  className?: string;
}

export function PageShell({ children, className }: PageShellProps) {
  const location = useLocation();
  return (
    <div className="ml-60 min-h-screen bg-black">
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          id="main-content"
          className={cn('max-w-7xl mx-auto px-8 py-10', className)}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
        >
          {children}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}
