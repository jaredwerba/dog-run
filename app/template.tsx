'use client';

import { motion, MotionConfig } from 'motion/react';

/* Remounts on every navigation — gives each page an iOS-style push-in */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.995 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}
