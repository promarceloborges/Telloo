
import React from 'react';
import { motion } from 'motion/react';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const Mascot: React.FC<Props> = ({ size = 'md', animated = false }) => {
  const sizes = {
    sm: 'w-10 h-10',
    md: 'w-24 h-24',
    lg: 'w-48 h-48'
  };

  return (
    <div className={`${sizes[size]} relative flex items-center justify-center`}>
      <motion.div
        animate={animated ? {
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0],
        } : {}}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-full h-full bg-telloo-neonGreen rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,255,157,0.4)]"
      >
        <span className="text-black font-bold text-xl">T</span>
      </motion.div>
      {animated && (
        <motion.div
          animate={{
            scale: [1, 1.5],
            opacity: [0.5, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeOut"
          }}
          className="absolute inset-0 bg-telloo-neonGreen rounded-full"
        />
      )}
    </div>
  );
};

export default Mascot;
