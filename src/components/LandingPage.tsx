
import React, { useState } from 'react';
import { motion } from 'motion/react';
import Mascot from './Mascot';
import { ChevronRight, Sparkles } from 'lucide-react';

interface Props {
  onEnter: (name: string) => void;
}

const LandingPage: React.FC<Props> = ({ onEnter }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onEnter(name);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-8 max-w-md w-full"
      >
        <div className="flex justify-center">
          <Mascot size="lg" animated />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-[49px] font-display font-bold text-telloo-neonGreen tracking-tighter">
            TELLOO
          </h1>
          <p className="text-gray-400 text-[15px] uppercase tracking-[0.3em] font-bold">
            Seu Tutor de Biologia AI
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Qual seu nome, estudante?"
              className="w-full bg-slate-900 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-telloo-neonGreen transition-colors"
              autoFocus
            />
          </div>
          
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full bg-telloo-neonGreen text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            INICIAR JORNADA <ChevronRight size={20} />
          </button>
        </form>

        <div className="flex items-center justify-center gap-2 text-telloo-neonBlue/60 text-[11px] font-bold uppercase tracking-widest">
          <Sparkles size={12} /> Alinhado à BNCC & ENEM
        </div>
      </motion.div>
    </div>
  );
};

export default LandingPage;
