'use client';

import Link from 'next/link';
import { motion } from 'motion/react';

/* iOS-feel spring presets */
export const spring = { type: 'spring', stiffness: 380, damping: 30 } as const;
export const springBouncy = { type: 'spring', stiffness: 420, damping: 18 } as const;
export const springGentle = { type: 'spring', stiffness: 260, damping: 28 } as const;

/* Press-down feedback, like a UIButton highlight */
export const press = { whileTap: { scale: 0.96 }, transition: spring } as const;
export const pressFirm = { whileTap: { scale: 0.9 }, transition: spring } as const;

export const MotionLink = motion.create(Link);
