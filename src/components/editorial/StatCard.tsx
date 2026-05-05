import React from 'react';
import { motion } from 'framer-motion';
import { itemVariants } from '@/lib/animations';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  icon?: React.ReactNode;
  value: string | number;
  label: string;
  sublabel?: string;
  className?: string;
}

export function StatCard({ icon, value, label, sublabel, className }: StatCardProps) {
  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        'bg-white p-6 border border-gray-light flex flex-col gap-3',
        className,
      )}
      whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
      transition={{ duration: 0.2 }}
    >
      {icon && <div className="text-gray-mid">{icon}</div>}
      <div className="text-display text-5xl text-black tracking-tight">{value}</div>
      <div>
        <div className="text-label text-gray-mid">{label}</div>
        {sublabel && <div className="text-xs text-gray-mid mt-0.5">{sublabel}</div>}
      </div>
    </motion.div>
  );
}
