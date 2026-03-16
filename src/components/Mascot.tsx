
import React from 'react';
import { motion } from 'motion/react';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const Mascot: React.FC<Props> = ({ size = 'md', animated = false }) => {
  const sizes = {
    sm: 'w-10 h-12',
    md: 'w-24 h-24',
    lg: 'w-48 h-48'
  };

  return (
    <div className={`${sizes[size]} relative flex items-end justify-center overflow-visible`}>
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
          
          {/* Ocular do Microscópio (Moldura Circular) */}
          <circle 
            cx="50" cy="50" r="45" 
            fill="none" 
            stroke="url(#logoGradient)" 
            strokeWidth="1" 
            className="opacity-20"
          />
          
          {/* Escala Micrométrica (Traços na borda) */}
          {[...Array(12)].map((_, i) => (
            <line
              key={i}
              x1="50" y1="6" x2="50" y2="10"
              stroke="url(#logoGradient)"
              strokeWidth="1"
              className="opacity-40"
              transform={`rotate(${i * 30} 50 50)`}
            />
          ))}

          {/* Dupla Hélice de DNA (Foco Central) */}
          <motion.path
            d="M38 30 C38 30 62 45 62 55 C62 65 38 80 38 80"
            fill="none"
            stroke="url(#logoGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            animate={animated ? { 
              strokeWidth: [4, 5, 4],
              filter: ["brightness(1)", "brightness(1.3)", "brightness(1)"]
            } : {}}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.path
            d="M62 30 C62 30 38 45 38 55 C38 65 62 80 62 80"
            fill="none"
            stroke="url(#logoGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            animate={animated ? { 
              strokeWidth: [4, 5, 4],
              filter: ["brightness(1)", "brightness(1.3)", "brightness(1)"]
            } : {}}
            transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
          />

          {/* Barra Superior do 'T' (Iluminação de Foco) */}
          <path 
            d="M32 30 L68 30" 
            fill="none" 
            stroke="#00ff9d" 
            strokeWidth="7" 
            strokeLinecap="round"
            filter="url(#glow)"
          />

          {/* Eixo de Observação */}
          <line x1="50" y1="30" x2="50" y2="85" stroke="#00f0ff" strokeWidth="2" strokeDasharray="2 2" className="opacity-30" />

          {/* Nodos de Dados Genéticos */}
          <circle cx="38" cy="30" r="3" fill="#00ff9d" filter="url(#glow)" />
          <circle cx="62" cy="30" r="3" fill="#00ff9d" filter="url(#glow)" />
          <circle cx="50" cy="55" r="4" fill="#00f0ff" filter="url(#glow)" />
          
          {/* Lâmina de Microscopia (Base) */}
          <path 
            d="M35 85 L65 85 M40 90 L60 90" 
            fill="none" 
            stroke="#00f0ff" 
            strokeWidth="2" 
            strokeLinecap="round"
            className="opacity-50"
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
