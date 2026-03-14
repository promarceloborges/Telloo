
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
          scale: [1, 1.05, 1],
          filter: ["drop-shadow(0 0 8px rgba(0, 255, 157, 0.4))", "drop-shadow(0 0 15px rgba(0, 255, 157, 0.6))", "drop-shadow(0 0 8px rgba(0, 255, 157, 0.4))"]
        } : {}}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-full h-full flex items-center justify-center"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00ff9d" />
              <stop offset="100%" stopColor="#00f0ff" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Hexágono Tecnológico */}
          <path 
            d="M50 5 L90 27.5 L90 72.5 L50 95 L10 72.5 L10 27.5 Z" 
            fill="none" 
            stroke="url(#logoGradient)" 
            strokeWidth="2"
            className="opacity-20"
          />
          
          {/* Hélice de DNA Estilizada formando um 'T' e um Livro */}
          <motion.path
            d="M35 30 C35 30 45 45 50 45 C55 45 65 30 65 30 M50 45 L50 75 M30 75 L70 75"
            fill="none"
            stroke="#00ff9d"
            strokeWidth="4"
            strokeLinecap="round"
            animate={animated ? { strokeDashoffset: [0, 10, 0] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          {/* Elementos de Conexão (Sinapses/Tecnologia) */}
          <circle cx="35" cy="30" r="3" fill="#00f0ff" filter="url(#glow)" />
          <circle cx="65" cy="30" r="3" fill="#00f0ff" filter="url(#glow)" />
          <circle cx="50" cy="45" r="4" fill="#00ff9d" filter="url(#glow)" />
          <circle cx="50" cy="75" r="3" fill="#00f0ff" filter="url(#glow)" />
          
          {/* Base do Livro / Conhecimento */}
          <path 
            d="M30 75 L50 82 L70 75" 
            fill="none" 
            stroke="#00f0ff" 
            strokeWidth="2" 
            strokeLinecap="round" 
            className="opacity-60"
          />
        </svg>
      </motion.div>
      
      {animated && (
        <motion.div
          animate={{
            scale: [1, 1.3],
            opacity: [0.2, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut"
          }}
          className="absolute inset-0 border-2 border-telloo-neonGreen rounded-full"
        />
      )}
    </div>
  );
};

export default Mascot;
