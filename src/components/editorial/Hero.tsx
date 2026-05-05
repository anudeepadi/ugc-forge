import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { fadeVariants } from '@/lib/animations';

export interface HeroCta {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

export interface HeroProps {
  eyebrow?: string;
  headline: string;
  description?: string;
  cta?: HeroCta;
  secondaryCta?: HeroCta;
  className?: string;
}

export function Hero({ eyebrow, headline, description, cta, secondaryCta, className }: HeroProps) {
  return (
    <motion.div
      className={cn('py-14 md:py-20 border-b border-white/10', className)}
      variants={fadeVariants}
      initial="initial"
      animate="animate"
    >
      {eyebrow && (
        <p className="text-label text-white/50 mb-5">{eyebrow}</p>
      )}
      <h1 className="text-display text-4xl md:text-5xl lg:text-6xl text-white max-w-4xl">
        {headline}
      </h1>
      {description && (
        <p className="text-white/80 text-lg md:text-xl mt-5 max-w-2xl leading-relaxed">
          {description}
        </p>
      )}
      {(cta || secondaryCta) && (
        <div className="flex flex-wrap gap-4 mt-8">
          {cta && (
            <Button variant="primary" size="lg" onClick={cta.onClick}>
              {cta.icon}
              {cta.label}
            </Button>
          )}
          {secondaryCta && (
            <Button variant="secondary" size="lg" onClick={secondaryCta.onClick}>
              {secondaryCta.icon}
              {secondaryCta.label}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}
