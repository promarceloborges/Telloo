
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Book, Target, GraduationCap, FileText, Loader2 } from 'lucide-react';
import { TeacherSettings } from '../types';

interface Props {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  settings: TeacherSettings;
  onUpdate: (settings: TeacherSettings) => void;
}

const TeacherDashboard: React.FC<Props> = ({ isOpen, setIsOpen, settings, onUpdate }) => {
  const [isUploading, setIsUploading] = React.useState(false);

  const handleChange = (field: keyof TeacherSettings, value: any) => {
    onUpdate({ ...settings, [field]: value });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      if (file.type === 'application/pdf') {
        // Importação dinâmica para evitar quebra na carga inicial (tela branca)
        const pdfjs = await import('pdfjs-dist');
        // Configuração segura do worker
        const version = '3.11.174';
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;
        
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n';
        }
        handleChange('pdfContent', fullText);
        handleChange('pdfName', file.name);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const mammoth = await import('mammoth');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        handleChange('pdfContent', result.value);
        handleChange('pdfName', file.name);
      } else {
        // Fallback para texto plano
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          handleChange('pdfContent', content);
          handleChange('pdfName', file.name);
        };
        reader.readAsText(file);
      }
    } catch (error) {
      console.error("Erro ao ler arquivo:", error);
      alert("Erro ao ler o arquivo. Tente um formato de texto simples.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-slate-900 z-[70] shadow-2xl border-l border-white/10 flex flex-col"
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-telloo-neonGreen flex items-center gap-2">
                <GraduationCap /> CONFIGURAÇÕES DO TUTOR
              </h2>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Book size={14} /> Nível de Ensino
                </label>
                <select
                  value={settings.gradeLevel}
                  onChange={(e) => handleChange('gradeLevel', e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-telloo-neonGreen"
                >
                  <option value="6º Ano">Ensino Fundamental - 6º Ano</option>
                  <option value="7º Ano">Ensino Fundamental - 7º Ano</option>
                  <option value="8º Ano">Ensino Fundamental - 8º Ano</option>
                  <option value="9º Ano">Ensino Fundamental - 9º Ano</option>
                  <option value="1º Ano EM">Ensino Médio - 1º Ano</option>
                  <option value="2º Ano EM">Ensino Médio - 2º Ano</option>
                  <option value="3º Ano EM">Ensino Médio - 3º Ano</option>
                </select>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Target size={14} /> Foco de Estudo
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleChange('bnccFocus', !settings.bnccFocus)}
                    className={`p-4 rounded-xl border transition-all text-left ${settings.bnccFocus ? 'bg-telloo-neonGreen/10 border-telloo-neonGreen text-telloo-neonGreen' : 'bg-slate-800 border-white/10 text-gray-400'}`}
                  >
                    <div className="font-bold text-xs uppercase mb-1">BNCC</div>
                    <div className="text-[10px] opacity-70">Alinhado à Base Nacional</div>
                  </button>
                  <button
                    onClick={() => handleChange('enemMode', !settings.enemMode)}
                    className={`p-4 rounded-xl border transition-all text-left ${settings.enemMode ? 'bg-telloo-neonBlue/10 border-telloo-neonBlue text-telloo-neonBlue' : 'bg-slate-800 border-white/10 text-gray-400'}`}
                  >
                    <div className="font-bold text-xs uppercase mb-1">ENEM</div>
                    <div className="text-[10px] opacity-70">Foco em Vestibulares</div>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <FileText size={14} /> Tópico Atual / Capítulo
                </label>
                <input
                  type="text"
                  value={settings.currentChapter}
                  onChange={(e) => handleChange('currentChapter', e.target.value)}
                  placeholder="Ex: Citologia, Genética..."
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-telloo-neonGreen"
                />
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Save size={14} /> Palavras-Chave
                </label>
                <textarea
                  value={settings.keywords}
                  onChange={(e) => handleChange('keywords', e.target.value)}
                  placeholder="Palavras importantes para o tutor focar..."
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-telloo-neonGreen h-24 resize-none"
                />
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <FileText size={14} /> Material de Apoio (Texto/PDF/DOCX)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".txt,.pdf,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    disabled={isUploading}
                  />
                  <label
                    htmlFor="file-upload"
                    className={`flex items-center justify-center gap-2 w-full bg-slate-800 border border-dashed border-white/20 rounded-xl p-6 cursor-pointer hover:border-telloo-neonGreen transition-all group ${isUploading ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    <div className="text-center">
                      {isUploading ? (
                        <Loader2 className="mx-auto mb-2 text-telloo-neonGreen animate-spin" />
                      ) : (
                        <FileText className="mx-auto mb-2 text-gray-500 group-hover:text-telloo-neonGreen transition-colors" />
                      )}
                      <span className="text-xs font-bold text-gray-400 group-hover:text-white">
                        {isUploading ? 'Lendo arquivo...' : (settings.pdfName || 'Clique para anexar material')}
                      </span>
                    </div>
                  </label>
                  {settings.pdfName && !isUploading && (
                    <button 
                      onClick={() => {
                        handleChange('pdfContent', '');
                        handleChange('pdfName', '');
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/40 transition-all"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/10">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full bg-telloo-neonGreen text-black font-bold py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                SALVAR CONFIGURAÇÕES
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TeacherDashboard;
