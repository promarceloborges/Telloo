
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, Book } from 'lucide-react';

interface Props {
  term: string;
  definition: string;
  category: string;
  children: React.ReactNode;
}

const GlossaryTooltip: React.FC<Props> = ({ term, definition, category, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span 
      className="relative inline-block group cursor-help"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <span className="border-b border-dotted border-telloo-neonBlue text-telloo-neonBlue hover:text-telloo-neonGreen transition-colors">
        {children}
      </span>
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute z-[100] bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-4 bg-slate-900 border border-telloo-neonBlue/30 rounded-2xl shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-telloo-neonBlue/10 rounded-lg text-telloo-neonBlue">
                <Book size={14} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-telloo-neonBlue/60">
                {category}
              </span>
            </div>
            <h4 className="text-[14px] font-bold text-white mb-1">{term}</h4>
            <p className="text-[12px] text-gray-400 leading-relaxed">
              {definition}
            </p>
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-r border-b border-telloo-neonBlue/30 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
};

export default GlossaryTooltip;
