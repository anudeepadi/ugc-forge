import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  as?: 'div' | 'article' | 'section';
}

export function Card({ children, className, hover = false, onClick, as: Tag = 'div' }: CardProps) {
  const base = cn(
    'bg-white text-black border border-gray-light',
    onClick && 'cursor-pointer',
    className,
  );

  if (hover) {
    return (
      <motion.div
        className={base}
        whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.15)' }}
        transition={{ duration: 0.2 }}
        onClick={onClick}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <Tag className={base} onClick={onClick}>
      {children}
    </Tag>
  );
}
