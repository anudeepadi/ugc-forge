import type { Variants, Transition } from 'framer-motion';

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const pageTransition: Transition = {
  duration: 0.4,
  ease: [0.22, 1, 0.36, 1],
};

export const containerVariants: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.08 },
  },
};

export const itemVariants: Variants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

export const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4 } },
};
