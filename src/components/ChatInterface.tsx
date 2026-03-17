
import React, { useState, useRef, useEffect, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Message, ResponseMode, TeacherSettings, QuestionType } from '../types';
import { streamMessageToGemini, streamQuestions, generateDeepDiveContent, generateSimulationMission, generateLearningPath } from '../services/geminiService';
import Mascot from './Mascot';
import { Send, Brain, Palette, Microscope, BookOpen, Sparkles, X, Target, Library, Share2, ChevronRight, Zap, FileText, Eraser, MapPin, Bookmark, Loader2, Download, Settings, Beaker, Sliders, Play, RotateCcw, Activity, Info, AlertTriangle, ClipboardCheck, Copy, Check, Eye, EyeOff, RefreshCw, GraduationCap, Mic, MessageCircle, LogOut, MoreVertical, Maximize2, Minimize2 } from 'lucide-react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { BIO_GLOSSARY } from '../constants/glossary';
import GlossaryTooltip from './GlossaryTooltip';

interface Props {
  userName: string;
  settings: TeacherSettings;
  onOpenSettings: () => void;
  onLogout: () => void;
}

const ChatInterface: React.FC<Props> = ({ userName, settings, onOpenSettings, onLogout }) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('telloo_chat_history');
      return saved ? JSON.parse(saved) : [{
        id: 'intro',
        role: 'model',
        text: `Olá, **${userName || 'Estudante'}**! Eu sou o Telloo, sua Inteligência Biológica de alto desempenho. 🧬\n\nNo momento, estou operando com foco em **${settings.enemMode ? 'ENEM' : 'BNCC'}** para o **${settings.gradeLevel === 'Amabis Martho' ? 'Livro Amabis e Martho' : settings.gradeLevel}**. ${settings.currentChapter ? `\n\nJá processei as diretrizes sobre **${settings.currentChapter}** e estou pronto para começarmos.` : ''}\n\nPodemos estruturar **Mapas Mentais**, enfrentar **Desafios** ou testar hipóteses no nosso laboratório **Bio-Sandbox**. O que vamos descobrir hoje?`,
        timestamp: Date.now()
      }];
    } catch (e) {
      console.error("Erro ao carregar histórico:", e);
      return [{
        id: 'intro',
        role: 'model',
        text: `Olá, **${userName || 'Estudante'}**! Eu sou o Telloo, sua Inteligência Biológica de alto desempenho. 🧬\n\nNo momento, estou operando com foco em **${settings.enemMode ? 'ENEM' : 'BNCC'}** para o **${settings.gradeLevel === 'Amabis Martho' ? 'Livro Amabis e Martho' : settings.gradeLevel}**. ${settings.currentChapter ? `\n\nJá processei as diretrizes sobre **${settings.currentChapter}** e estou pronto para começarmos.` : ''}\n\nPodemos estruturar **Mapas Mentais**, enfrentar **Desafios** ou testar hipóteses no nosso laboratório **Bio-Sandbox**. O que vamos descobrir hoje?`,
        timestamp: Date.now()
      }];
    }
  });

  const [xp, setXp] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('telloo_xp');
      return saved ? parseInt(saved) : 0;
    } catch (e) {
      return 0;
    }
  });

  useEffect(() => {
    localStorage.setItem('telloo_xp', xp.toString());
  }, [xp]);

  const level = Math.floor(xp / 100) + 1;
  const progress = xp % 100;

  const addXp = (amount: number) => {
    setXp(prev => prev + amount);
  };

  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [selectedMode, setSelectedMode] = useState<ResponseMode>(ResponseMode.CREATIVE);
  const [currentTopic, setCurrentTopic] = useState<string | null>(localStorage.getItem('telloo_current_topic'));
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDrawerFullscreen, setIsDrawerFullscreen] = useState(false);
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [drawerContent, setDrawerContent] = useState('');
  const [isDrawerLoading, setIsDrawerLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [assessmentType, setAssessmentType] = useState<QuestionType>('Objetiva');
  const [assessmentTopic, setAssessmentTopic] = useState('');

  const [userSelections, setUserSelections] = useState<Record<string, Record<number, string>>>({});
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});

  // Listener para mensagens do sistema vindas do Dashboard
  useEffect(() => {
    const handleSystemMessage = (e: any) => {
      const text = e.detail;
      const newMessage: Message = {
        id: Date.now().toString(),
        role: 'model',
        text,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, newMessage]);
    };

    window.addEventListener('telloo_system_message', handleSystemMessage);
    return () => window.removeEventListener('telloo_system_message', handleSystemMessage);
  }, []);

  const [simVariable, setSimVariable] = useState(50);
  const [missionIndex, setMissionIndex] = useState(0);
  const [activeMission, setActiveMission] = useState<any>(null);
  const [isMissionLoading, setIsMissionLoading] = useState(false);

  const [thinkingIndex, setThinkingIndex] = useState(0);
  const thinkingPhrases = useMemo(() => [
    "Sintetizando proteínas de informação...",
    "Desfazendo a hélice de DNA para consulta...",
    "Mapeando conexões sinápticas...",
    "Escaneando nichos ecológicos...",
    "Analisando homeostase dos dados...",
    "Consultando critérios da BNCC...",
    "Sequenciando resposta biológica...",
    "Ativando transcrição de conhecimento...",
    "Catalisando reações pedagógicas..."
  ], []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const lastScrolledId = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    // Debounce o salvamento no localStorage para evitar travamentos durante o streaming
    const timeoutId = setTimeout(() => {
      const isAnyStreaming = messages.some(m => m.isStreaming);
      if (!isAnyStreaming || messages.length % 5 === 0) {
        localStorage.setItem('telloo_chat_history', JSON.stringify(messages));
      }
    }, 1000);

    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === 'model' && lastScrolledId.current !== lastMsg.id) {
        const element = document.getElementById(`msg-${lastMsg.id}`);
        if (element && scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const elementTop = element.offsetTop;
            
            container.scrollTo({
                top: elementTop - 20,
                behavior: 'smooth'
            });
            lastScrolledId.current = lastMsg.id;
        } else {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    } else if (lastMsg && lastMsg.role === 'user') {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    return () => clearTimeout(timeoutId);
  }, [messages]);

  useEffect(() => {
    if (currentTopic) {
        localStorage.setItem('telloo_current_topic', currentTopic);
        setMissionIndex(Math.floor(Math.random() * 3)); 
    }
  }, [currentTopic]);

  useEffect(() => {
    if (settings.currentChapter && settings.currentChapter !== currentTopic) {
      // Sincroniza apenas se não houver uma conversa ativa ou se o tópico estiver vazio
      // Isso evita interromper o fluxo de um aluno que já está estudando outro tema
      if (messages.length <= 1 || !currentTopic) {
        setCurrentTopic(settings.currentChapter);
      }
    }
  }, [settings.currentChapter, currentTopic, messages.length]);

  useEffect(() => {
    let interval: number;
    if (isLoading) {
      interval = window.setInterval(() => {
        setThinkingIndex((prev) => (prev + 1) % thinkingPhrases.length);
      }, 2500);
    } else {
      setThinkingIndex(0);
    }
    return () => clearInterval(interval);
  }, [isLoading, thinkingPhrases.length]);

  const missions = useMemo(() => ({
    osmose: [
      {
        title: "Homeostase Celular: Solo Salino",
        problem: "As células vegetais estão perdendo turgidez após contato com solo salino.",
        hypothesis: "A osmose está movendo água para fora da célula (meio hipertônico).",
        objective: "Equilibre a salinidade para restaurar a pressão interna da célula.",
        controlName: "Concentração Salina",
        unit: "g/L",
        color: (v: number) => v > 65 ? "#ef4444" : v < 35 ? "#3b82f6" : "#00ff9d",
        getLog: (v: number) => v > 65 ? "⚠️ PLASMÓLISE: Salinidade crítica! A membrana está se soltando da parede celular." : v < 35 ? "💧 TURGIDEZ MÁXIMA: A célula está absorvendo água intensamente." : "✅ ESTÁVEL: Meio isotônico alcançado."
      },
      {
        title: "Hemólise em Laboratório",
        problem: "Glóbulos vermelhos foram colocados em uma solução desconhecida e começaram a romper.",
        hypothesis: "O meio é hipotônico, causando entrada excessiva de água por osmose.",
        objective: "Ajuste a tonicidade do meio para evitar a lise celular.",
        controlName: "Tonicidade do Meio",
        unit: "% NaCl",
        color: (v: number) => v < 20 ? "#ef4444" : v > 80 ? "#3b82f6" : "#00ff9d",
        getLog: (v: number) => v < 20 ? "💥 LISE: A pressão osmótica rompeu a membrana plasmática das hemácias!" : v > 80 ? "🍂 CRENAL: As células murcharam devido à saída de água." : "✅ CONSERVAÇÃO: Forma biconcava mantida em soro fisiológico."
      },
      {
        title: "Preservação de Alimentos",
        problem: "Bactérias estão se proliferando em carne fresca armazenada sem proteção.",
        hypothesis: "Um meio hipertônico (salga) pode desidratar microrganismos e impedir sua reprodução.",
        objective: "Encontre o nível de desidratação osmótica ideal para conservação.",
        controlName: "Nível de Salga",
        unit: "kg/ton",
        color: (v: number) => v < 40 ? "#facc15" : "#00ff9d",
        getLog: (v: number) => v < 40 ? "🦠 CONTAMINAÇÃO: Pressão osmótica insuficiente para inibir patógenos." : "🥩 CONSERVADO: Plasmólise bacteriana induzida com sucesso. Alimento seguro."
      }
    ],
    fotosintese: [
      {
        title: "Laboratório de Fotossíntese: Fase Clara",
        problem: "Uma planta em estufa parou de liberar bolhas de oxigênio.",
        hypothesis: "A intensidade luminosa atingiu o ponto de compensação fótico.",
        objective: "Encontre o ponto de saturação luminosa para produção máxima de O2.",
        controlName: "Intensidade de Luz",
        unit: "Lux",
        color: (v: number) => v > 80 ? "#facc15" : v < 30 ? "#1e293b" : "#4ade80",
        getLog: (v: number) => v > 80 ? "🔥 SATURAÇÃO: A taxa de fotossíntese estabilizou. Excesso de luz causa fotoxidação." : v < 30 ? "🌑 INSUFICIENTE: Respiração maior que fotossíntese." : "🌿 OTIMIZADO: Produção de ATP e O2 estável."
      },
      {
        title: "Ciclo de Calvin: Sequestro de Carbono",
        problem: "A planta está apresentando crescimento lento apesar de boa iluminação.",
        hypothesis: "A disponibilidade de CO2 é o fator limitante para a fase escura.",
        objective: "Aumente a concentração de CO2 para otimizar a síntese de glicose.",
        controlName: "CO2 Atmosférico",
        unit: "ppm",
        color: (v: number) => v > 70 ? "#0ea5e9" : "#64748b",
        getLog: (v: number) => v > 70 ? "📈 ALTA PRODUTIVIDADE: Enzima RuBisCO operando em capacidade máxima." : v < 30 ? "📉 FOME: A planta está consumindo reservas de amido para sobreviver." : "✅ EQUILÍBRIO: Taxa de fixação de carbono constante."
      },
      {
        title: "Estresse Térmico e Estômatos",
        problem: "Em dias muito quentes, a planta para de crescer mesmo com sol forte.",
        hypothesis: "O fechamento estomático para evitar transpiração impede a entrada de CO2.",
        objective: "Ajuste a temperatura para manter os estômatos abertos sem desidratar.",
        controlName: "Temperatura",
        unit: "°C",
        color: (v: number) => v > 75 ? "#f43f5e" : "#fbbf24",
        getLog: (v: number) => v > 75 ? "🏜️ DEFESA: Estômatos fechados para evitar dessecação. Trocas gasosas interrompidas." : "🍃 TRANSPIRAÇÃO: Planta resfriada e realizando trocas gasosas ativas."
      }
    ],
    genetica: [
      {
        title: "Mapeamento Genético: Mendel",
        problem: "Uma população de ervilhas apresenta redução de flores brancas.",
        hypothesis: "A frequência do alelo recessivo está sendo reduzida por seleção artificial.",
        objective: "Ajuste a frequência do alelo 'a' para observar a proporção 3:1.",
        controlName: "Frequência Alelo (a)",
        unit: "%",
        color: (v: number) => `hsl(${v * 2.5}, 70%, 50%)`,
        getLog: (v: number) => v > 75 ? "🧬 PUREZA RECESSIVA: Homozigose aa predominante." : v < 25 ? "💎 DOMINÂNCIA: O alelo A mascara a característica branca." : "⚖️ MENDELIANO: Equilíbrio de Hardy-Weinberg simulado."
      },
      {
        title: "Mutação e Adaptação",
        problem: "Uma nova linhagem de bactérias surgiu com resistência a antibióticos.",
        hypothesis: "Mutações aleatórias conferiram vantagem adaptativa no meio.",
        objective: "Simule a taxa de mutação para observar a velocidade da evolução.",
        controlName: "Taxa de Mutação",
        unit: "μ",
        color: (v: number) => v > 80 ? "#8b5cf6" : "#6d28d9",
        getLog: (v: number) => v > 80 ? "👾 CAOS GENÉTICO: Muitas mutações deletérias. A linhagem está instável." : "🐢 EVOLUÇÃO LENTA: Pouca variabilidade para seleção natural atuar."
      }
    ],
    ecologia: [
      {
        title: "Dinâmica Populacional",
        problem: "O número de herbívoros cresce descontroladamente.",
        hypothesis: "A ausência de predadores rompeu o controle biológico.",
        objective: "Introduza predadores para estabilizar a pirâmide.",
        controlName: "Densidade de Predadores",
        unit: "ind/km²",
        color: (v: number) => v > 70 ? "#b91c1c" : v < 20 ? "#15803d" : "#0891b2",
        getLog: (v: number) => v > 70 ? "🌋 SUPERPREDAÇÃO: Colapso das presas iminente!" : v < 20 ? "📉 SUPERPOPULAÇÃO: A vegetação está sendo devastada." : "🌲 EQUILÍBRIO: Ecossistema resiliente."
      },
      {
        title: "Eutrofização de Lagos",
        problem: "Um lago local está coberto por algas verdes e os peixes estão morrendo.",
        hypothesis: "Excesso de nutrientes (fósforo/nitrogênio) causou explosão de algas.",
        objective: "Reduza o descarte de nutrientes para restaurar o oxigênio dissolvido.",
        controlName: "Carga de Nutrientes",
        unit: "mg/L",
        color: (v: number) => v > 60 ? "#4ade80" : "#0ea5e9",
        getLog: (v: number) => v > 60 ? "🤢 ALGAL BLOOM: Decomposição aeróbica consumindo todo o O2. Zona morta detectada." : "💧 LAGO OLIGOTRÓFICO: Água clara e oxigenada. Biodiversidade em alta."
      }
    ],
    corpo: [
      {
        title: "Fisiologia do Esforço",
        problem: "O sistema cardiovascular precisa suprir a demanda de O2.",
        hypothesis: "O débito cardíaco aumenta para manter a homeostase.",
        objective: "Simule a intensidade e observe a resposta do miocárdio.",
        controlName: "Intensidade",
        unit: "Watts",
        color: (v: number) => `rgb(${v * 2.5}, ${255 - v * 2}, 100)`,
        getLog: (v: number) => v > 85 ? "💓 ANAERÓBICO: Paração de ácido lático elevada!" : v < 20 ? "🧘 REPOUSO: Sistema parassimpático domina." : "🏃 AERÓBICO: Estado de Steady State."
      },
      {
        title: "Regulação Glicêmica",
        problem: "O paciente apresenta picos de glicose após as refeições.",
        hypothesis: "A liberação de insulina pelo pâncreas não está sendo suficiente.",
        objective: "Ajuste a sensitividade à insulina para estabilizar a glicemia.",
        controlName: "Nível de Insulina",
        unit: "mU/L",
        color: (v: number) => v < 30 ? "#f87171" : "#4ade80",
        getLog: (v: number) => v < 30 ? "🩸 HIPERGLICEMIA: Risco de glicação de proteínas e danos vasculares." : "⚖️ NORMOGLICEMIA: Glicose sendo transportada para as células eficientemente."
      }
    ]
  }), []);

  const getSimulationMission = () => {
    const t = currentTopic?.toLowerCase() || '';
    let category = 'generico';
    if (t.includes('osmose') || t.includes('célula') || t.includes('membrana')) category = 'osmose';
    else if (t.includes('foto') || t.includes('planta') || t.includes('luz')) category = 'fotosintese';
    else if (t.includes('genética') || t.includes('dna') || t.includes('herança')) category = 'genetica';
    else if (t.includes('ecologia') || t.includes('ecossistema') || t.includes('ambiente')) category = 'ecologia';
    else if (t.includes('corpo') || t.includes('humano') || t.includes('coração')) category = 'corpo';
    const pool = (missions as any)[category] || missions.osmose;
    return pool[missionIndex % pool.length];
  };

  const handleSortearMissao = async () => {
    setIsMissionLoading(true);
    try {
        const topic = currentTopic || settings.currentChapter || "Biologia";
        const mission = await generateSimulationMission(topic, settings);
        if (mission && mission.title) {
            // Adaptar thresholds para o formato de funções esperado pela UI
            const adaptedMission = {
                ...mission,
                color: (v: number) => {
                    if (v < (mission.thresholds?.low?.value || 30)) return mission.thresholds?.low?.color || "#ef4444";
                    if (v > (mission.thresholds?.high?.value || 70)) return mission.thresholds?.high?.color || "#3b82f6";
                    return mission.thresholds?.optimal?.color || "#00ff9d";
                },
                getLog: (v: number) => {
                    if (v < (mission.thresholds?.low?.value || 30)) return mission.thresholds?.low?.message;
                    if (v > (mission.thresholds?.high?.value || 70)) return mission.thresholds?.high?.message;
                    return mission.thresholds?.optimal?.message;
                }
            };
            setActiveMission(adaptedMission);
            setSimVariable(50);
        } else {
            setMissionIndex(prev => prev + 1);
            setActiveMission(null); // Isso forçará o uso do getSimulationMission() no render se não houver activeMission
        }
    } catch (e) {
        setMissionIndex(prev => prev + 1);
        setActiveMission(null);
    } finally {
        setIsMissionLoading(false);
    }
  };

  const currentMission = activeMission || getSimulationMission();

  const cleanMarkdown = (text: string, preserveSvg = false) => {
    let cleaned = text
      .replace(/\[SUGESTÃO:.*?\]/g, '')
      .replace(/---GABARITO---[\s\S]*$/, '');

    if (preserveSvg) {
      cleaned = cleaned.replace(/`{3}(?:svg|html)?\s*([\s\S]*?)`{3}/gi, '$1');
    }

    const placeholders: { key: string, val: string }[] = [];
    
    // Proteger SVGs
    cleaned = cleaned.replace(/<svg[\s\S]*?<\/svg>/gi, (match) => {
      const key = `__SVG_BLOCK_${placeholders.length}__`;
      placeholders.push({ key, val: match });
      return key;
    });

    // Proteger Imagens
    cleaned = cleaned.replace(/!\[.*?\]\(.*?\)/g, (match) => {
      const key = `__IMG_BLOCK_${placeholders.length}__`;
      placeholders.push({ key, val: match });
      return key;
    });

    cleaned = cleaned
      .replace(/#{1,6}\s?/g, '')
      .replace(/\*\*|__/g, '')
      .replace(/\*|_/g, '')
      .replace(/`{1,3}[\s\S]*?`{1,3}/g, (match) => match.replace(/`/g, ''));
    
    cleaned = cleaned.replace(/^>\s?/gm, '');

    // Restaurar protegidos
    placeholders.forEach(({ key, val }) => {
      cleaned = cleaned.replace(key, val);
    });

    if (!preserveSvg) {
      cleaned = cleaned.replace(/!\[.*?\]\(.*?\)/g, '');
      cleaned = cleaned.replace(/\[(.*?)\]\(.*?\)/g, '$1');
      cleaned = cleaned.replace(/<svg[\s\S]*?<\/svg>/g, '\n[Diagrama Biológico Gerado]\n');
    } else {
      cleaned = cleaned.replace(/<svg(?![^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg")/g, '<svg xmlns="http://www.w3.org/2000/svg"');
      cleaned = cleaned.replace(/^\s*(?:svg|html)\s*(?=<svg)/gi, '');
      // Garante dimensões para o html2canvas
      cleaned = cleaned.replace(/<svg/g, '<svg width="100%" height="auto" style="max-width:100%;"');
    }
    
    return cleaned.trim();
  };

  const copyToClipboard = (text: string, id: string) => {
    const clean = cleanMarkdown(text);
    navigator.clipboard.writeText(clean).then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const exportSingleBlock = async (text: string, format: 'txt' | 'doc' | 'pdf' | 'whatsapp', msgId?: string) => {
    const preserveSvg = format === 'pdf' || format === 'doc';
    const clean = cleanMarkdown(text, preserveSvg);
    
    if ((format === 'pdf' || format === 'whatsapp') && msgId) {
        const element = document.getElementById(`msg-content-${msgId}`);
        if (!element) return;

        try {
            setIsLoading(true);
            const canvas = await html2canvas(element, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false,
                scrollX: 0,
                scrollY: 0,
                onclone: (clonedDoc) => {
                    const el = clonedDoc.getElementById(`msg-content-${msgId}`);
                    if (el) {
                        // Estilo de Folha Limpa
                        el.style.backgroundColor = '#ffffff';
                        el.style.color = '#1a1a1a';
                        el.style.padding = '60px 60px 80px 60px'; // Aumentado o padding inferior
                        el.style.borderRadius = '0';
                        el.style.border = 'none';
                        el.style.boxShadow = 'none';
                        el.style.height = 'auto';
                        el.style.minHeight = 'auto';
                        el.style.overflow = 'visible';

                        // Ajustar todo o texto para preto/cinza escuro
                        const textElements = el.querySelectorAll('p, span, li, div, h1, h2, h3, strong');
                        textElements.forEach((node: any) => {
                            node.style.color = '#1a1a1a';
                            node.style.backgroundColor = 'transparent';
                            node.style.textShadow = 'none';
                        });

                        // Títulos em verde escuro profissional
                        el.querySelectorAll('h1, h2, h3').forEach((h: any) => {
                            h.style.color = '#064e3b';
                            h.style.borderBottom = '1px solid #eee';
                        });

                        // Ajustar imagens para garantir que não sejam cortadas
                        el.querySelectorAll('img').forEach((img: any) => {
                            img.style.display = 'block';
                            img.style.maxWidth = '100%';
                            img.style.height = 'auto';
                            img.style.margin = '20px auto';
                            img.style.borderRadius = '12px';
                        });

                        // Ajustar SVGs para fundo branco
                        el.querySelectorAll('svg').forEach((svg: any) => {
                            svg.style.display = 'block';
                            svg.style.margin = '30px auto';
                            svg.style.backgroundColor = '#fcfcfc';
                            svg.style.border = '1px solid #eee';
                            svg.style.padding = '20px';
                            svg.style.borderRadius = '12px';
                            svg.style.filter = 'none';
                            
                            // Converter cores neon para cores de impressão
                            svg.querySelectorAll('text, path, circle, rect, line').forEach((p: any) => {
                                const stroke = p.getAttribute('stroke');
                                const fill = p.getAttribute('fill');
                                if (stroke === '#00ff9d' || stroke === 'rgb(0, 255, 157)') p.setAttribute('stroke', '#059669');
                                if (fill === '#00ff9d' || fill === 'rgb(0, 255, 157)') p.setAttribute('fill', '#059669');
                                if (stroke === '#00e5ff') p.setAttribute('stroke', '#0369a1');
                                if (fill === '#00e5ff') p.setAttribute('fill', '#0369a1');
                            });
                        });

                        // Esconder elementos de interface
                        const uiElements = el.querySelectorAll('.print\\:hidden');
                        uiElements.forEach((e: any) => e.style.display = 'none');
                        
                        // Adicionar cabeçalho de relatório
                        const header = clonedDoc.createElement('div');
                        header.innerHTML = `
                            <div style="border-bottom: 2px solid #064e3b; margin-bottom: 30px; padding-bottom: 15px; font-family: sans-serif;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                    <div style="text-align: left; font-size: 10px; color: #666; font-weight: normal;">
                                        Inteligência Biológica!
                                    </div>
                                    <div style="text-align: right; font-size: 10px; color: #666; font-weight: normal;">
                                        Gerado em ${new Date().toLocaleString('pt-BR')}
                                    </div>
                                </div>
                                <div style="text-align: center; font-weight: bold; color: #064e3b; font-size: 16px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px;">
                                    TELLOO
                                </div>
                                <div style="text-align: center; font-weight: bold; color: #064e3b; font-size: 16px; text-transform: uppercase; letter-spacing: 2px;">
                                    FICHA DE ESTUDO
                                </div>
                            </div>
                        `;
                        el.prepend(header);

                        // Adicionar rodapé
                        const footer = clonedDoc.createElement('div');
                        footer.style.marginTop = '40px';
                        footer.style.paddingTop = '10px';
                        footer.style.borderTop = '1px solid #eee';
                        footer.style.textAlign = 'center';
                        footer.style.fontSize = '9px';
                        footer.style.color = '#999';
                        footer.style.fontFamily = 'sans-serif';
                        footer.innerHTML = `Telloo • Inteligência Biológica • ${new Date().toLocaleString('pt-BR')}`;
                        el.appendChild(footer);
                    }
                }
            });

            const imgData = canvas.toDataURL('image/png', 1.0);
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width / 2, canvas.height / 2]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2, undefined, 'FAST');
            
            if (format === 'whatsapp') {
                const pdfBlob = pdf.output('blob');
                const file = new File([pdfBlob], `telloo-estudo-${Date.now()}.pdf`, { type: 'application/pdf' });
                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({ files: [file], title: 'Ficha de Estudo Telloo - Inteligência Biológica!' });
                } else {
                    pdf.save(`telloo-estudo-${Date.now()}.pdf`);
                }
            } else {
                pdf.save(`telloo-estudo-${Date.now()}.pdf`);
            }
        } catch (err) {
            console.error("Erro na exportação PDF:", err);
            alert("Erro ao gerar PDF. Tente copiar o texto.");
        } finally {
            setIsLoading(false);
        }
        return;
    }

    if (format === 'pdf' && !msgId) {
        // Fallback se o ID não for passado (não deve acontecer com os botões corrigidos)
        const blob = new Blob([clean], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `telloo-estudo-${Date.now()}.pdf`;
        link.click();
        return;
    }

    if (format === 'doc') {
        const html = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'></head>
            <body>
                <div style="font-family: 'Segoe UI', sans-serif; padding: 20px;">
                    ${clean.replace(/\n/g, '<br>').replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width:100%;height:auto;border-radius:12px;margin:20px 0;display:block;" />').replace(/<br><svg/g, '<svg').replace(/<\/svg><br>/g, '</svg>')}
                </div>
            </body>
            </html>
        `;
        const blob = new Blob(['\ufeff', html], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `telloo-estudo-${Date.now()}.docx`;
        link.click();
        return;
    }
    const blob = new Blob([clean], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `telloo-estudo-${Date.now()}.txt`;
    link.click();
  };

  const exportDrawerContent = async (format: 'txt' | 'doc' | 'pdf' | 'whatsapp') => {
    if (!drawerContent) return;
    await exportSingleBlock(drawerContent, format, 'drawer');
  };

  const handleSend = async (text?: string, mode?: ResponseMode, isSilent = false) => {
    const textToSend = text || inputText;
    if (!textToSend.trim()) return;

    const modeToUse = mode || selectedMode;
    
    // Atualiza o tópico atual se a mensagem for substancial e não for uma pergunta meta
    if (!isSilent) {
        const isMetaQuestion = /^(quem é você|o que você faz|como você ajuda|quais suas capacidades|quem criou você|quem é o telloo)/i.test(textToSend.toLowerCase());
        if (!isMetaQuestion && textToSend.length > 3) {
            const newTopic = textToSend.length > 60 ? textToSend.substring(0, 60) + "..." : textToSend;
            if (newTopic !== currentTopic) {
                setCurrentTopic(newTopic);
                // Resetar a missão ativa para que a próxima abertura do Bio-Sandbox 
                // ou sorteio de missão use o novo contexto
                setActiveMission(null);
            }
        }
    }
    
    let currentHistory = [...messages];
    if (!isSilent) {
        const userMsg: Message = { 
            id: Date.now().toString(), 
            role: 'user', 
            text: textToSend, 
            mode: modeToUse, 
            timestamp: Date.now() 
        };
        currentHistory = [...currentHistory, userMsg];
        setMessages(currentHistory);
    }

    setInputText('');
    setIsLoading(true);
    setHasError(false);
    addXp(2);

    const modelMsgId = (Date.now() + 1).toString();
    const modelMsg: Message = { 
        id: modelMsgId, 
        role: 'model', 
        text: '', 
        isStreaming: true, 
        mode: modeToUse,
        timestamp: Date.now() 
    };
    
    setMessages(prev => [...prev, modelMsg]);

    try {
        await streamMessageToGemini(currentHistory, textToSend, modeToUse, settings, (chunk) => {
            setMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, text: chunk } : m));
        });
        setMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, isStreaming: false } : m));
    } catch (err) {
        setHasError(true);
        setMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, text: "🔬 Meus circuitos biológicos detectaram uma instabilidade temporária no servidor (Service Unavailable). Não se preocupe, isso acontece em picos de tráfego!", isStreaming: false } : m));
    } finally {
        setIsLoading(false);
    }
  };

  const retryLastMessage = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      setMessages(prev => prev.slice(0, -1)); // Remove a mensagem de erro
      handleSend(lastUserMsg.text, lastUserMsg.mode, true);
    }
  };

  const handleOpenSimulation = async () => {
    setIsSimulationMode(true);
    setIsDrawerOpen(true);
    addXp(5);
    
    // Se o tópico mudou, forçamos a atualização do conteúdo visual do laboratório
    setDrawerContent(`Laboratório iniciado para o tópico: **${currentTopic || 'Biologia'}**.`);
    
    if (!activeMission) {
        // Se não houver missão ativa (porque resetamos no handleSend ou é a primeira vez),
        // geramos uma nova baseada no tópico atual usando IA
        await handleSortearMissao();
    }
  };

  const handleOpenDeepDive = () => {
    setIsSimulationMode(false);
    setIsDrawerOpen(true);
    setIsDrawerLoading(true);
    addXp(10);
    generateDeepDiveContent(currentTopic || "Biologia", messages, settings).then(c => {
        setDrawerContent(c);
        setIsDrawerLoading(false);
    });
  };

  const exportChat = async (format: 'txt' | 'pdf' | 'docx' | 'whatsapp') => {
    const title = `Relatório de Estudo Telloo - ${currentTopic || 'Biologia'}`;
    const timestamp = new Date().toLocaleString('pt-BR');

    if (format === 'pdf' || format === 'whatsapp') {
        const element = scrollContainerRef.current;
        if (!element) return;
        setShowExportMenu(false);
        setIsLoading(true);

        try {
            const canvas = await html2canvas(element, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false,
                scrollX: 0,
                scrollY: 0,
                onclone: (clonedDoc) => {
                    const el = clonedDoc.querySelector('main');
                    if (el) {
                        // Estilo de Relatório Limpo
                        el.style.backgroundColor = '#ffffff';
                        el.style.color = '#1a1a1a';
                        el.style.padding = '60px 60px 100px 60px'; // Aumentado o padding inferior
                        el.style.height = 'auto';
                        el.style.overflow = 'visible';
                        
                        // Ajustar todas as mensagens no relatório
                        const messages = el.querySelectorAll('[id^="msg-content-"]');
                        messages.forEach((msg: any) => {
                            msg.style.backgroundColor = '#ffffff';
                            msg.style.color = '#1a1a1a';
                            msg.style.border = 'none';
                            msg.style.borderBottom = '1px solid #eee';
                            msg.style.marginBottom = '30px';
                            msg.style.padding = '20px 0';
                            msg.style.boxShadow = 'none';
                            msg.style.height = 'auto';
                            msg.style.overflow = 'visible';
                            
                            // Ajustar textos internos
                            msg.querySelectorAll('p, span, li, h1, h2, h3, strong').forEach((node: any) => {
                                node.style.color = '#1a1a1a';
                                node.style.textShadow = 'none';
                            });

                            // Títulos
                            msg.querySelectorAll('h1, h2, h3').forEach((h: any) => {
                                h.style.color = '#064e3b';
                            });

                            // Ajustar imagens
                            msg.querySelectorAll('img').forEach((img: any) => {
                                img.style.display = 'block';
                                img.style.maxWidth = '100%';
                                img.style.height = 'auto';
                                img.style.margin = '20px auto';
                                img.style.borderRadius = '12px';
                            });

                            // SVGs
                            msg.querySelectorAll('svg').forEach((svg: any) => {
                                svg.style.display = 'block';
                                svg.style.filter = 'none';
                                svg.style.backgroundColor = '#fcfcfc';
                                svg.style.border = '1px solid #eee';
                                svg.style.padding = '15px';
                                svg.style.borderRadius = '12px';
                                
                                svg.querySelectorAll('text, path, circle, rect, line').forEach((p: any) => {
                                    const stroke = p.getAttribute('stroke');
                                    const fill = p.getAttribute('fill');
                                    if (stroke === '#00ff9d' || stroke === 'rgb(0, 255, 157)') p.setAttribute('stroke', '#059669');
                                    if (fill === '#00ff9d' || fill === 'rgb(0, 255, 157)') p.setAttribute('fill', '#059669');
                                });
                            });
                        });

                        const uiElements = el.querySelectorAll('.print\\:hidden');
                        uiElements.forEach((e: any) => e.style.display = 'none');

                        // Adicionar cabeçalho de relatório completo
                        const header = clonedDoc.createElement('div');
                        header.innerHTML = `
                            <div style="border-bottom: 3px solid #064e3b; margin-bottom: 40px; padding-bottom: 20px; font-family: sans-serif;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                                    <div style="text-align: left; font-size: 12px; color: #666; font-weight: normal;">
                                        Inteligência Biológica!
                                    </div>
                                    <div style="text-align: right; font-size: 12px; color: #666; font-weight: normal;">
                                        Data: ${new Date().toLocaleDateString('pt-BR')}
                                    </div>
                                </div>
                                <div style="text-align: center; font-weight: bold; color: #064e3b; font-size: 22px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">
                                    TELLOO
                                </div>
                                <div style="text-align: center; font-weight: bold; color: #064e3b; font-size: 22px; text-transform: uppercase; letter-spacing: 2px;">
                                    RELATÓRIO DE ESTUDO
                                </div>
                                <div style="margin-top: 15px; font-size: 12px; color: #666;">
                                    <span>Tópico: ${currentTopic || 'Biologia'}</span>
                                </div>
                            </div>
                        `;
                        el.prepend(header);

                        // Adicionar rodapé completo
                        const footer = clonedDoc.createElement('div');
                        footer.style.marginTop = '50px';
                        footer.style.paddingTop = '15px';
                        footer.style.borderTop = '1px solid #eee';
                        footer.style.textAlign = 'center';
                        footer.style.fontSize = '10px';
                        footer.style.color = '#999';
                        footer.style.fontFamily = 'sans-serif';
                        footer.innerHTML = `Telloo • Inteligência Biológica • ${new Date().toLocaleString('pt-BR')}`;
                        el.appendChild(footer);
                    }
                }
            });

            const imgData = canvas.toDataURL('image/png', 1.0);
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width / 2, canvas.height / 2]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2, undefined, 'FAST');
            
            if (format === 'whatsapp') {
                const pdfBlob = pdf.output('blob');
                const file = new File([pdfBlob], `telloo-relatorio-${Date.now()}.pdf`, { type: 'application/pdf' });
                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({ files: [file], title: 'Relatório Telloo - Inteligência Biológica!' });
                } else {
                    pdf.save(`telloo-relatorio-${Date.now()}.pdf`);
                }
            } else {
                pdf.save(`telloo-relatorio-${Date.now()}.pdf`);
            }
        } catch (err) {
            console.error("Erro ao exportar PDF:", err);
            alert("Erro ao gerar PDF.");
        } finally {
            setIsLoading(false);
        }
        return;
    }
    if (format === 'txt') {
        const content = messages.map(m => {
            const role = m.role === 'user' ? 'ESTUDANTE' : 'TELLOO';
            return `${role} (${new Date(m.timestamp).toLocaleTimeString()}):\n${cleanMarkdown(m.text)}\n\n`;
        }).join('----------------------------------\n\n');
        const header = `${title}\nGerado por: ${userName}\nData: ${timestamp}\n\n`;
        const blob = new Blob([header + content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `telloo-bio-${Date.now()}.txt`;
        link.click();
    } else if (format === 'docx') {
        const html = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>${title}</title></head>
            <body>
                <h1>${title}</h1>
                <div style="color: #666; margin-bottom: 20px;">Relatório Educacional Telloo - Inteligência Biológica! • Professor(a): ${userName} • ${timestamp}</div>
                ${messages.map(m => `
                    <div style="margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                        <strong style="color: #064e3b; text-transform: uppercase; font-size: 10pt;">${m.role === 'user' ? 'Estudante' : 'Assistente Telloo'}:</strong>
                        <div style="margin-top: 10px;">${cleanMarkdown(m.text, true).replace(/\n/g, '<br>').replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width:100%;height:auto;border-radius:12px;margin:20px 0;display:block;" />').replace(/<br><svg/g, '<svg').replace(/<\/svg><br>/g, '</svg>')}</div>
                    </div>
                `).join('')}
            </body>
            </html>
        `;
        const blob = new Blob(['\ufeff', html], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `telloo-bio-${Date.now()}.docx`;
        link.click();
    }
    setShowExportMenu(false);
  };

  const handleModeSelect = (mode: ResponseMode) => {
    if (mode === selectedMode && messages.length > 1 && !inputText.trim()) return;
    setSelectedMode(mode);
    
    const pendingInput = inputText.trim();
    const topicContext = pendingInput || currentTopic || settings.currentChapter || "Biologia";

    if (pendingInput) {
        // Garantir que o tópico seja atualizado mesmo para inputs curtos ao trocar de modo
        setCurrentTopic(pendingInput);
        handleSend(pendingInput, mode);
        return;
    }

    if (messages.length > 1) {
        const modeFeedback = {
            [ResponseMode.MIND_MAP]: "Entendido! A partir de agora vou estruturar minhas respostas como um **Mapa Mental**. 🧠",
            [ResponseMode.CREATIVE]: "Modo **Criativo** ativado! 🎨",
            [ResponseMode.LOGICAL]: "Certo, ativando modo **Lógico**. 🔬",
            [ResponseMode.LINGUISTIC]: "Modo **Linguístico** pronto. 📖",
            [ResponseMode.BNCC]: "Modo **BNCC** ativado! Vou priorizar as competências e habilidades da Base Nacional Comum Curricular. 🎓"
        };
        
        let text = modeFeedback[mode];
        if (topicContext && topicContext !== "Biologia") {
            text += `\n\nPercebi que estamos focados em **${topicContext}**. Gostaria que eu explicasse este assunto usando este novo estilo ${mode}?`;
        }

        setMessages(prev => [...prev, {
            id: `mode-change-${Date.now()}`,
            role: 'model',
            text: text,
            timestamp: Date.now(),
            mode: mode
        }]);
    } else {
        handleSend(`Ative o modo ${mode}. Vamos estudar sobre ${topicContext}! Me dê uma introdução nesse estilo.`, mode);
    }
  };

  const handleReExplain = (mode: ResponseMode) => {
    setSelectedMode(mode);
    const prompt = `Gostaria que você me explicasse novamente o assunto "${currentTopic || 'Biologia'}" usando o modo ${mode}.`;
    handleSend(prompt, mode);
  };

  const handleGenerateAssessment = (type: QuestionType) => {
    setAssessmentType(type);
    setAssessmentTopic(currentTopic || settings.currentChapter || "Biologia");
    setIsAssessmentModalOpen(true);
  };

  const handleGenerateLearningPath = async (msgId: string, topic: string, correctAnswers: string) => {
    const selections = userSelections[msgId] || {};
    const answersStr = Object.entries(selections)
        .map(([idx, letter]) => `Questão ${parseInt(idx) + 1}: ${letter}`)
        .join(', ') || "Nenhuma resposta selecionada";

    setIsSimulationMode(false);
    setIsDrawerOpen(true);
    setIsDrawerLoading(true);
    
    try {
        const path = await generateLearningPath(topic, answersStr, correctAnswers, settings);
        setDrawerContent(path);
    } catch (err) {
        setDrawerContent("Erro ao gerar sua trilha de recuperação. Tente novamente.");
    } finally {
        setIsDrawerLoading(false);
    }
  };

  const startAssessmentGeneration = async () => {
    setIsAssessmentModalOpen(false);
    setIsLoading(true);
    setHasError(false);
    const modelMsgId = Date.now().toString();
    setMessages(prev => [...prev, { id: modelMsgId, role: 'model', text: '', isStreaming: true, timestamp: Date.now() }]);
    
    try {
        await streamQuestions(assessmentTopic, { type: assessmentType, withAnswerKey: true }, settings, (chunk) => {
            setMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, text: chunk } : m));
        });
        setMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, isStreaming: false } : m));
    } catch (err) {
        setHasError(true);
        setMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, text: "🧬 Ocorreu um erro ao gerar sua avaliação devido à indisponibilidade do serviço. Tente novamente em alguns segundos.", isStreaming: false } : m));
    } finally {
        setIsLoading(false);
    }
  };

  const extractSuggestions = (text: string) => {
    const regex = /\[SUGESTÃO: (.*?)\]/g;
    const matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push(match[1]);
    }
    return matches;
  };

  const clearChat = () => {
    setIsClearConfirmOpen(true);
  };

  const confirmClearChat = () => {
    localStorage.removeItem('telloo_chat_history');
    localStorage.removeItem('telloo_current_topic');
    setMessages([{ 
        id: 'intro', 
        role: 'model', 
        text: `Olá! Eu sou o **Telloo**, seu tutor especializado em Biologia. 🧬\n\nEstou configurado para o **${settings.gradeLevel === 'Amabis Martho' ? 'Livro Amabis e Martho' : settings.gradeLevel}**. O que vamos explorar hoje?`,
        timestamp: Date.now()
    }]);
    setCurrentTopic('');
    setRevealedAnswers({});
    setUserSelections({});
    setIsClearConfirmOpen(false);
  };

  const toggleAnswer = (msgId: string) => {
    setRevealedAnswers(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Ops! Seu navegador ainda não aprendeu a ouvir. Tente usar o Chrome ou Edge! 🧬");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognitionRef.current = recognition;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(prev => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error("Erro no reconhecimento de voz:", event.error);
        setIsListening(false);
        
        if (event.error === 'not-allowed') {
          alert("Acesso ao microfone negado. Por favor, autorize o uso do microfone nas configurações do seu navegador ou celular! 🎙️❌");
        } else if (event.error === 'no-speech') {
          // No alert for no-speech as it can be annoying, just stop listening
        } else if (event.error === 'network') {
          alert("Erro de rede. O reconhecimento de voz precisa de internet para funcionar! 🌐🔌");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognition.start();
    } catch (err) {
      console.error("Erro ao iniciar reconhecimento:", err);
      setIsListening(false);
      alert("Não foi possível iniciar o microfone. Verifique se ele não está sendo usado por outro aplicativo.");
    }
  };

  const selectOption = (msgId: string, qIndex: number, optionLetter: string) => {
    if (!userSelections[msgId]?.[qIndex]) {
        addXp(15);
    }
    setUserSelections(prev => ({
        ...prev,
        [msgId]: {
            ...(prev[msgId] || {}),
            [qIndex]: optionLetter
        }
    }));
  };

  // Helper para extrair texto limpo de componentes React (Markdown)
  const getCleanText = (children: any): string => {
    if (!children) return '';
    if (typeof children === 'string') return children;
    if (Array.isArray(children)) return children.map(getCleanText).join('');
    if (children.props && children.props.children) return getCleanText(children.props.children);
    return '';
  };

  const wrapWithGlossary = (text: string) => {
    if (!text || typeof text !== 'string') return text;
    
    // Proteção: Se o texto contém símbolos de fórmulas ($) ou padrões claros de alelos, 
    // não aplicamos o glossário para evitar conflitos com a renderização científica.
    if (text.includes('$') || /I\^[AB]/i.test(text) || /\b(IA|IB|ii|IAi|IBi)\b/i.test(text) || text.length < 2) return text;
    
    let parts: (string | React.ReactNode)[] = [text];
    
    BIO_GLOSSARY.forEach(item => {
      const newParts: (string | React.ReactNode)[] = [];
      const regex = new RegExp(`\\b(${item.term})\\b`, 'gi');
      
      parts.forEach(part => {
        if (typeof part !== 'string') {
          newParts.push(part);
          return;
        }
        
        const split = part.split(regex);
        if (split.length <= 1) {
          newParts.push(part);
          return;
        }
        
        split.forEach((subPart, i) => {
          if (i % 2 === 1) {
            newParts.push(
              <GlossaryTooltip 
                key={`${item.term}-${i}`} 
                term={item.term} 
                definition={item.definition} 
                category={item.category}
              >
                {subPart}
              </GlossaryTooltip>
            );
          } else if (subPart) {
            newParts.push(subPart);
          }
        });
      });
      parts = newParts;
    });
    
    return parts;
  };

  const MarkdownComponents = (msgId: string, msgText: string, initialQIndex: number = 0, feedbacks: Record<number, { feedbackMap: Record<string, string>, correctAnswer: string | null }> = {}) => {
    let internalQIndex = initialQIndex;

    const renderOptionButton = (letter: string, content: string, qIdx: number) => {
        const normalizedLetter = letter.toLowerCase();
        const isSelected = userSelections[msgId]?.[qIdx] === normalizedLetter;
        const feedback = feedbacks[qIdx]?.feedbackMap?.[normalizedLetter];
        const isCorrect = feedbacks[qIdx]?.correctAnswer === normalizedLetter;
        
        return (
            <div key={`${letter}-${qIdx}`} className="mb-3">
                <div 
                    onClick={() => selectOption(msgId, qIdx, normalizedLetter)} 
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer group/opt ${isSelected ? (isCorrect ? 'bg-telloo-neonGreen/10 border-telloo-neonGreen shadow-[0_0_15px_rgba(0,255,157,0.2)]' : 'bg-red-500/10 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]') : 'bg-white/5 border-white/10 hover:border-white/30'}`}
                >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all font-bold text-[11px] uppercase ${isSelected ? (isCorrect ? 'bg-telloo-neonGreen border-telloo-neonGreen text-black' : 'bg-red-500 border-red-500 text-white') : 'border-white/30 text-gray-400 group-hover/opt:border-telloo-neonBlue/50'}`}>
                        {letter}
                    </div>
                    <p className={`text-[15px] leading-relaxed ${isSelected ? 'text-white' : 'text-gray-300'}`}>{content}</p>
                </div>
                
                {isSelected && feedback && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mt-2 ml-9 p-3 rounded-lg border text-[13px] leading-relaxed ${isCorrect ? 'bg-telloo-neonGreen/5 border-telloo-neonGreen/20 text-telloo-neonGreen' : 'bg-red-500/5 border-red-500/20 text-red-400'}`}
                    >
                        <div className="flex items-center gap-2 mb-1 font-bold uppercase tracking-widest text-[10px]">
                            {isCorrect ? <><Sparkles size={12}/> Bio-Acerto!</> : <><Info size={12}/> Bio-Insight:</>}
                        </div>
                        {feedback}
                    </motion.div>
                )}
            </div>
        );
    };

    const isDrawer = msgId === 'drawer';

    return {
      h1: (props: any) => <h1 className={`${isDrawer ? 'text-[24px] sm:text-[28px]' : 'text-[20px] sm:text-[22px]'} font-display font-bold text-telloo-neonGreen mt-6 mb-4 border-b border-telloo-neonGreen/20 pb-2 print:text-black print:border-black`} {...props} />,
      h2: (props: any) => <h2 className={`${isDrawer ? 'text-[20px] sm:text-[24px]' : 'text-[18px] sm:text-[20px]'} font-semibold text-white mt-6 mb-3 print:text-black`} {...props} />,
      h3: (props: any) => <h3 className={`${isDrawer ? 'text-[18px] sm:text-[20px]' : 'text-[16px] sm:text-[18px]'} font-medium text-telloo-neonBlue mt-4 mb-2 print:text-black`} {...props} />,
      p: (props: any) => {
          const text = getCleanText(props.children);
          
          if (/quest[ãa]o\s?(\d+)/i.test(text)) {
            const numMatch = text.match(/quest[ãa]o\s?(\d+)/i);
            if (numMatch) internalQIndex = parseInt(numMatch[1]) - 1;
            else internalQIndex++;
          }

          // Se for uma opção de múltipla escolha, mantemos o processamento de linha por linha
          if (text.trim().match(/^(\*\*|__)?[a-e][\)\s.-]\s?/i)) {
              const lines = text.split(/\n/).filter(line => line.trim().length > 0);
              const processedLines = lines.map((line, idx) => {
                  const altMatch = line.trim().match(/^(\*\*|__)?[a-e][\)\s.-]\s?(.*)/i);
                  if (altMatch) {
                      const letterMatch = line.match(/[a-e]/i);
                      const letter = letterMatch ? letterMatch[0] : 'a';
                      const content = line.replace(/^(\*\*|__)?[a-e][\)\s.-]\s?/i, '');
                      return renderOptionButton(letter, content, internalQIndex);
                  }
                  return <span key={idx}>{wrapWithGlossary(line)}<br/></span>;
              });
              return <div className="mb-4 leading-relaxed last:mb-0 print:text-black">{processedLines}</div>;
          }

          // Se for um parágrafo comum, renderizamos os filhos preservando elementos (como links/botões)
          return (
              <div className="mb-4 leading-relaxed last:mb-0 print:text-black">
                  {React.Children.map(props.children, child => {
                      if (typeof child === 'string') return wrapWithGlossary(child);
                      return child;
                  })}
              </div>
          );
      },
      li: (props: any) => {
          const text = getCleanText(props.children);
          const altMatch = text.trim().match(/^(\*\*|__)?[a-e][\)\s.-]\s?(.*)/i);
          if (altMatch) {
              const letterMatch = text.match(/[a-e]/i);
              const letter = letterMatch ? letterMatch[0] : 'a';
              const content = text.replace(/^(\*\*|__)?[a-e][\)\s.-]\s?/i, '');
              return renderOptionButton(letter, content, internalQIndex);
          }
          return (
              <li className="mb-1">
                  {React.Children.map(props.children, child => {
                      if (typeof child === 'string') return wrapWithGlossary(child);
                      return child;
                  })}
              </li>
          );
      },
      strong: (props: any) => (
        <strong className="text-telloo-neonGreen font-bold">
          {React.Children.map(props.children, child => {
            if (typeof child === 'string') return wrapWithGlossary(child);
            return child;
          })}
        </strong>
      ),
      em: (props: any) => (
        <em className="text-telloo-neonBlue italic">
          {React.Children.map(props.children, child => {
            if (typeof child === 'string') return wrapWithGlossary(child);
            return child;
          })}
        </em>
      ),
      a: (props: any) => {
          const text = getCleanText(props.children);
          if (text.startsWith('ASSISTIR:')) {
              const label = text.replace('ASSISTIR:', '').trim();
              return (
                  <a 
                      href={props.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-2 px-5 py-2.5 bg-telloo-neonGreen text-black text-[11px] font-bold uppercase tracking-widest rounded-xl hover:scale-105 hover:shadow-[0_0_20px_rgba(0,255,157,0.4)] transition-all no-underline group/btn"
                  >
                      <Play size={14} fill="currentColor" className="group-hover/btn:animate-pulse" />
                      Assistir: {label}
                  </a>
              );
          }
          return <a className="text-telloo-neonBlue hover:underline" target="_blank" rel="noopener noreferrer" {...props} />;
      },
      code: ({ node, inline, className, children, ...props }: any) => {
        const content = String(children);
        if (!inline && content.trim().startsWith('<svg')) {
          return (
            <div className="my-6 p-4 bg-black/40 rounded-2xl border border-telloo-neonGreen/20 shadow-[0_0_15px_rgba(0,255,157,0.1)] overflow-hidden print:bg-white print:border-black print:shadow-none">
              <div className="text-[10px] text-telloo-neonGreen/50 uppercase tracking-[0.2em] font-bold mb-3 flex items-center justify-between print:text-black print:border-b print:mb-2">
                  <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-telloo-neonGreen rounded-full animate-pulse print:hidden"></div>
                      Diagrama Biológico
                  </div>
              </div>
              <div className="flex justify-center items-center w-full min-h-[100px] print:filter-none" dangerouslySetInnerHTML={{ __html: content.trim() }} />
            </div>
          );
        }
        return <code className={`${className} bg-slate-800 px-1.5 py-0.5 rounded text-telloo-neonBlue text-[13px] font-mono`} {...props}>{children}</code>;
      },
      svg: ({node, children, ...props}: any) => {
          const { inline, ...cleanProps } = props;
          return (
              <div className="my-6 p-4 bg-black/40 rounded-2xl border border-telloo-neonGreen/20 shadow-[0_0_15px_rgba(0,255,157,0.1)] overflow-hidden relative group print:bg-white print:border-black print:shadow-none">
                  <div className="flex justify-center items-center w-full min-h-[100px] print:filter-none">
                      <svg xmlns="http://www.w3.org/2000/svg" {...cleanProps} style={{ maxWidth: '100%', height: 'auto', display: 'block' }} className="drop-shadow-[0_0_10px_rgba(0,255,157,0.2)] print:drop-shadow-none">
                          {children}
                      </svg>
                  </div>
              </div>
          )
      },
      img: (props: any) => (
        <img 
          {...props} 
          referrerPolicy="no-referrer" 
          className="max-w-full h-auto rounded-2xl my-6 border border-white/10 shadow-lg print:border-black print:shadow-none block mx-auto" 
        />
      ),
      table: ({ children }: any) => (
        <div className="my-6 overflow-x-auto rounded-xl border border-white/10 glass-panel shadow-2xl print:border-black print:shadow-none">
          <table className="w-full border-collapse text-left text-[14px]">
            {children}
          </table>
        </div>
      ),
      thead: ({ children }: any) => (
        <thead className="bg-telloo-neonGreen/10 border-b border-telloo-neonGreen/20">
          {children}
        </thead>
      ),
      th: ({ children }: any) => (
        <th className="p-4 font-display font-bold text-telloo-neonGreen uppercase tracking-widest text-[11px] print:text-black">
          {children}
        </th>
      ),
      td: ({ children }: any) => (
        <td className="p-4 border-b border-white/5 text-zinc-300 print:text-black print:border-black">
          {React.Children.map(children, child => {
            if (typeof child === 'string') return wrapWithGlossary(child);
            return child;
          })}
        </td>
      ),
      tr: ({ children }: any) => (
        <tr className="hover:bg-white/5 transition-colors odd:bg-white/[0.02]">
          {children}
        </tr>
      )
    };
  };

  const sanitizeGenotypes = (text: string) => {
    if (!text) return text;
    
    // Processar linha por linha para preservar a estrutura de tabelas (|) e quebras de linha
    return text.split('\n').map(line => {
        // Se for uma linha de separação de tabela (ex: |---|), não mexemos
        if (line.trim().match(/^[|:\s-]+$/)) return line;

        let sanitized = line;

        // 1. Colapsar padrões repetitivos e redundantes extremos (ex: IAiI^A iIAi)
        // Usamos [ \t]* em vez de \s* para garantir que a limpeza fique restrita à mesma linha
        sanitized = sanitized.replace(/\(?\b(IAi|IBi|ii|IAIA|IBIB|IAIB)\b[ \t]*\$I\^[ABi][^$\n]*?\$?[ \t]*\b(IAi|IBi|ii|IAIA|IBIB|IAIB)\b\)?/gi, (match) => {
            const latex = match.match(/\$I\^[ABi][^$\n]*?\$/i);
            return latex ? latex[0] : match;
        });

        // 2. Redundâncias comuns: "IAi ($I^A i$)" ou "IAi $I^A i$"
        sanitized = sanitized.replace(/\b(IAi|IBi|ii|IAIA|IBIB|IAIB)\b[ \t]*\(?\$I\^[ABi][^$\n]*?\$?\)?/gi, (match) => {
            const latex = match.match(/\$I\^[ABi][^$\n]*?\$/i);
            return latex ? latex[0] : match;
        });

        // 3. Mapeamento de texto puro remanescente para LaTeX
        const mapping: Record<string, string> = {
            'IAi': '$I^A i$',
            'IBi': '$I^B i$',
            'ii': '$i i$',
            'IAIA': '$I^A I^A$',
            'IBIB': '$I^B I^B$',
            'IAIB': '$I^A I^B$'
        };

        Object.entries(mapping).forEach(([raw, latex]) => {
            // Substitui apenas se não estiver já dentro de um bloco LaTeX
            const regex = new RegExp(`\\b${raw}\\b(?![^$]*\\$)`, 'g');
            sanitized = sanitized.replace(regex, latex);
        });

        return sanitized;
    }).join('\n');
  };

  const memoizedMessages = useMemo(() => {
    const parseAllFeedbacks = (answerKey: string) => {
        const feedbacks: Record<number, { feedbackMap: Record<string, string>, correctAnswer: string | null }> = {};
        
        // Split by "Questão X:" if it exists, otherwise treat as single question
        const questionSections = answerKey.split(/quest[ãa]o\s*(\d+):/i);
        
        if (questionSections.length > 1) {
            for (let i = 1; i < questionSections.length; i += 2) {
                const qNum = parseInt(questionSections[i]) - 1;
                const content = questionSections[i + 1];
                
                const feedbackMap: Record<string, string> = {};
                const feedbackSection = content.split(/feedback:/i)[1];
                if (feedbackSection) {
                    const lines = feedbackSection.split('\n');
                    lines.forEach(line => {
                        const match = line.trim().match(/^([a-e])\)\s*(.*)/i);
                        if (match) {
                            feedbackMap[match[1].toLowerCase()] = match[2];
                        }
                    });
                }
                
                const correctMatch = content.match(/resposta:\s*([a-e])/i);
                const correctAnswer = correctMatch ? correctMatch[1].toLowerCase() : null;
                
                feedbacks[qNum] = { feedbackMap, correctAnswer };
            }
        } else {
            // Single question
            const feedbackMap: Record<string, string> = {};
            const feedbackSection = answerKey.split(/feedback:/i)[1];
            if (feedbackSection) {
                const lines = feedbackSection.split('\n');
                lines.forEach(line => {
                    const match = line.trim().match(/^([a-e])\)\s*(.*)/i);
                    if (match) {
                        feedbackMap[match[1].toLowerCase()] = match[2];
                    }
                });
            }
            
            const correctMatch = answerKey.match(/resposta:\s*([a-e])/i);
            const correctAnswer = correctMatch ? correctMatch[1].toLowerCase() : null;
            
            feedbacks[0] = { feedbackMap, correctAnswer };
        }
        
        return feedbacks;
    };

    return messages.map((msg, i) => {
      const suggestions = msg.role === 'model' && !msg.isStreaming ? extractSuggestions(msg.text) : [];
      const sanitizedText = sanitizeGenotypes(msg.text);
      const parts = sanitizedText.split('---GABARITO---');
      const questionContent = parts[0].replace(/\[SUGESTÃO:.*?\]/g, '');
      const answerKey = parts[1] || '';
      const feedbacks = parseAllFeedbacks(answerKey);
      const isAnswerRevealed = revealedAnswers[msg.id];
      const isLast = i === messages.length - 1;

      return (
        <div id={`msg-${msg.id}`} key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in print:block print:mb-8 print:break-inside-avoid`}>
            <div id={`msg-content-${msg.id}`} className={`relative group max-w-[95%] sm:max-w-[80%] p-4 sm:p-6 rounded-[24px] border transition-all ${msg.role === 'user' ? 'bg-telloo-neonBlue/10 border-telloo-neonBlue/20 rounded-tr-none' : 'bg-white/5 border-white/10 rounded-tl-none shadow-xl'} print:bg-white print:border-none print:p-0 print:max-w-full`}>
            
            {msg.role === 'model' && !msg.isStreaming && (
                <div className="sticky top-24 float-right flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity print:hidden z-10 ml-4 mb-4">
                    <button onClick={() => copyToClipboard(msg.text, msg.id)} className="p-1.5 bg-black/40 border border-white/10 rounded-lg text-gray-400 hover:text-telloo-neonGreen transition-colors" title="Copiar bloco">
                        {copiedId === msg.id ? <Check size={14} className="text-telloo-neonGreen" /> : <Copy size={14}/>}
                    </button>
                    <div className="relative group/exp">
                        <button className="p-1.5 bg-black/40 border border-white/10 rounded-lg text-gray-400 hover:text-telloo-neonBlue transition-colors" title="Exportar este bloco">
                            <Share2 size={14}/>
                        </button>
                        <div className="absolute right-0 top-full mt-1 hidden group-hover/exp:block bg-slate-800 border border-white/10 rounded-lg shadow-xl overflow-hidden z-30">
                            <button onClick={() => exportSingleBlock(msg.text, 'txt')} className="w-full px-3 py-1.5 text-[10px] font-bold text-left hover:bg-white/5 border-b border-white/5">.TXT</button>
                            <button onClick={() => exportSingleBlock(msg.text, 'doc')} className="w-full px-3 py-1.5 text-[10px] font-bold text-left hover:bg-white/5 border-b border-white/5">.DOCX</button>
                            <button onClick={() => exportSingleBlock(msg.text, 'pdf', msg.id)} className="w-full px-3 py-1.5 text-[10px] font-bold text-left hover:bg-white/5 border-b border-white/5">.PDF</button>
                            <button onClick={() => exportSingleBlock(msg.text, 'whatsapp', msg.id)} className="w-full px-3 py-1.5 text-[10px] font-bold text-left hover:bg-white/5 text-green-400">WHATSAPP</button>
                        </div>
                    </div>
                </div>
            )}

            {msg.role === 'model' && msg.mode && <div className="flex items-center gap-2 mb-4 text-[10px] font-bold uppercase tracking-widest text-telloo-neonBlue bg-telloo-neonBlue/10 w-fit px-2 py-0.5 rounded border border-telloo-neonBlue/20 print:hidden"><Zap size={10}/> {msg.mode}</div>}

            <div className="prose prose-invert max-w-none text-zinc-300 leading-relaxed text-[15px] markdown-container print:text-black print:prose-black">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm, remarkMath]} 
                  rehypePlugins={[rehypeRaw, rehypeKatex]} 
                  components={MarkdownComponents(msg.id, questionContent, 0, feedbacks)}
                >
                  {questionContent}
                </ReactMarkdown>
            </div>

            {hasError && isLast && msg.role === 'model' && (
              <div className="mt-4 flex flex-col items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <div className="flex items-center gap-2 text-red-400 text-[13px] font-bold uppercase tracking-widest">
                      <AlertTriangle size={16}/> Falha de Sincronização
                  </div>
                  <button onClick={retryLastMessage} className="flex items-center gap-2 px-4 py-2 bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded-lg hover:scale-105 transition-all">
                      <RefreshCw size={14}/> Tentar Novamente Agora
                  </button>
              </div>
            )}

            {answerKey && !msg.isStreaming && (
                <div className="mt-6 space-y-4 print:mt-10">
                    <button onClick={() => toggleAnswer(msg.id)} className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-telloo-neonGreen/30 text-telloo-neonGreen text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-telloo-neonGreen/10 transition-all print:hidden">
                        {isAnswerRevealed ? <><EyeOff size={14}/> Esconder Gabarito</> : <><Eye size={14}/> Ver Gabarito Comentado</>}
                    </button>
                    {(isAnswerRevealed || window.matchMedia('print').matches) && (
                        <div className="bg-telloo-neonGreen/5 border-l-4 border-telloo-neonGreen p-5 rounded-r-xl animate-fade-in print:bg-white print:border-black print:p-2">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2 text-telloo-neonGreen print:text-black">
                                    <ClipboardCheck size={18}/>
                                    <h4 className="text-[13px] font-bold uppercase tracking-widest">Resolução Comentada</h4>
                                </div>
                                {!window.matchMedia('print').matches && (
                                    <button 
                                        onClick={() => handleGenerateLearningPath(msg.id, currentTopic || 'Biologia', answerKey)}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-telloo-neonBlue/20 border border-telloo-neonBlue/30 text-telloo-neonBlue text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-telloo-neonBlue/30 transition-all"
                                    >
                                        <MapPin size={12}/> Gerar Trilha de Recuperação
                                    </button>
                                )}
                            </div>
                            <div className="prose prose-invert max-w-none text-[13px] sm:text-[15px] text-gray-300 print:text-black">
                                <ReactMarkdown 
                                  remarkPlugins={[remarkGfm, remarkMath]} 
                                  rehypePlugins={[rehypeRaw, rehypeKatex]} 
                                  components={MarkdownComponents(msg.id, answerKey, 99)}
                                >
                                  {answerKey}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            {isLast && !msg.isStreaming && suggestions.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2 print:hidden">
                    {suggestions.map((s, idx) => (<button key={idx} onClick={() => handleSend(s)} className="px-4 py-2 bg-telloo-neonBlue/5 border border-telloo-neonBlue/20 text-telloo-neonBlue text-[12px] font-bold rounded-xl hover:bg-telloo-neonBlue/15 transition-all"><Sparkles size={12}/> {s}</button>))}
                </div>
            )}

            {isLast && !msg.isStreaming && msg.role === 'model' && msg.id !== 'intro' && !hasError && (
                <div className="mt-8 pt-6 border-t border-white/5 space-y-6 print:hidden">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10 animate-fade-in">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                            <Sparkles size={12} className="text-telloo-neonGreen" /> Quer reforçar este aprendizado em outro estilo?
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { mode: ResponseMode.MIND_MAP, icon: Brain, label: 'Mapa Mental', color: 'text-purple-400' },
                                { mode: ResponseMode.CREATIVE, icon: Palette, label: 'Criativo', color: 'text-pink-400' },
                                { mode: ResponseMode.LOGICAL, icon: Microscope, label: 'Lógico', color: 'text-blue-400' },
                                { mode: ResponseMode.LINGUISTIC, icon: BookOpen, label: 'Linguístico', color: 'text-cyan-400' },
                                { mode: ResponseMode.BNCC, icon: GraduationCap, label: 'BNCC', color: 'text-emerald-400' }
                            ].filter(m => m.mode !== selectedMode).map((m) => (
                                <button 
                                    key={m.mode} 
                                    onClick={() => handleReExplain(m.mode)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-wider text-gray-300 hover:bg-white/10 hover:border-white/20 transition-all"
                                >
                                    <m.icon size={12} className={m.color} /> {m.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <button onClick={() => handleGenerateAssessment('Objetiva')} className="flex items-center justify-center gap-2 p-3 bg-telloo-neonGreen/10 border border-telloo-neonGreen/30 rounded-xl text-[10px] font-bold text-telloo-neonGreen uppercase tracking-widest hover:bg-telloo-neonGreen/20 transition-all"><Target size={14}/> Desafio</button>
                        <button onClick={handleOpenDeepDive} className="flex items-center justify-center gap-2 p-3 bg-slate-800 border border-slate-700 rounded-xl text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:bg-slate-700 transition-all"><Library size={14}/> Bio-Data</button>
                        <button onClick={handleOpenSimulation} className="flex items-center justify-center gap-2 p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-[10px] font-bold text-purple-400 uppercase tracking-widest hover:bg-purple-500/20 transition-all"><Beaker size={14}/> Simular</button>
                        <button onClick={() => handleGenerateAssessment('PROVA')} className="flex items-center justify-center gap-2 p-3 bg-telloo-neonBlue/10 border border-telloo-neonBlue/30 rounded-xl text-[10px] font-bold text-telloo-neonBlue uppercase tracking-widest hover:bg-telloo-neonBlue/20 transition-all"><FileText size={14}/> Prova</button>
                    </div>
                </div>
            )}
          </div>
        </div>
      );
    });
  }, [messages, revealedAnswers, userSelections, copiedId, hasError, selectedMode]);

  useEffect(() => {
    if (!isDrawerOpen) {
      setIsDrawerFullscreen(false);
    }
  }, [isDrawerOpen]);

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-white overflow-hidden">
      <motion.div
        drag="x"
        dragConstraints={{ left: 0 }}
        dragElastic={{ left: 0, right: 0.5 }}
        onDragEnd={(_, info) => {
          if (info.offset.x > 100) setIsDrawerOpen(false);
        }}
        initial={{ x: '100%' }}
        animate={{ x: isDrawerOpen ? 0 : '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`fixed inset-y-0 right-0 ${isDrawerFullscreen ? 'w-full' : 'w-full sm:w-[500px]'} bg-slate-900 z-50 border-l border-telloo-neonGreen/30 shadow-2xl transition-all duration-300 print:hidden`}
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
            <h2 className="font-display font-bold text-[19px] flex items-center gap-2 text-telloo-neonGreen uppercase tracking-tighter">
                {isSimulationMode ? <><Beaker size={20}/> Bio-Sandbox</> : <><Library size={20}/> Bio-Data</>}
            </h2>
            <div className="flex items-center gap-2">
                {!isSimulationMode && !isDrawerLoading && drawerContent && (
                    <>
                        <button 
                            onClick={() => setIsDrawerFullscreen(!isDrawerFullscreen)}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-telloo-neonGreen"
                            title={isDrawerFullscreen ? "Sair do Foco Total" : "Modo Foco Total"}
                        >
                            {isDrawerFullscreen ? <Minimize2 size={20}/> : <Maximize2 size={20}/>}
                        </button>
                        <div className="relative group/drawer-exp">
                        <button className="p-2 hover:bg-white/10 rounded-full transition-colors text-telloo-neonBlue">
                            <Share2 size={20}/>
                        </button>
                        <div className="absolute right-0 top-full mt-1 hidden group-hover/drawer-exp:block bg-slate-800 border border-white/10 rounded-lg shadow-xl overflow-hidden z-[60] w-32">
                            <button onClick={() => exportDrawerContent('txt')} className="w-full px-3 py-2 text-[11px] font-bold text-left hover:bg-white/5 border-b border-white/5 flex items-center gap-2"><FileText size={12}/> .TXT</button>
                            <button onClick={() => exportDrawerContent('doc')} className="w-full px-3 py-2 text-[11px] font-bold text-left hover:bg-white/5 border-b border-white/5 flex items-center gap-2"><FileText size={12}/> .DOCX</button>
                            <button onClick={() => exportDrawerContent('pdf')} className="w-full px-3 py-2 text-[11px] font-bold text-left hover:bg-white/5 border-b border-white/5 flex items-center gap-2"><FileText size={12}/> .PDF</button>
                            <button onClick={() => exportDrawerContent('whatsapp')} className="w-full px-3 py-2 text-[11px] font-bold text-left hover:bg-white/5 text-green-400 flex items-center gap-2"><MessageCircle size={12}/> WHATSAPP</button>
                        </div>
                    </div>
                </>
            )}
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X/></button>
            </div>
        </div>
        <div className="p-6 overflow-y-auto h-[calc(100%-80px)] custom-scrollbar">
            {isDrawerLoading || isMissionLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-6">
                    <Loader2 size={48} className="text-telloo-neonGreen animate-spin" />
                    <p className="text-[13px] text-telloo-neonGreen animate-pulse font-mono tracking-widest uppercase font-bold text-center">Processando...</p>
                </div>
            ) : isSimulationMode ? (
                <div className="space-y-6">
                    <div className="bg-slate-800/50 rounded-2xl p-5 border border-white/10 shadow-lg space-y-3">
                        <div className="flex items-center gap-2 text-telloo-neonBlue">
                            <Activity size={18}/>
                            <h3 className="text-[13px] font-bold uppercase tracking-widest">{currentMission.title}</h3>
                        </div>
                        <div className="space-y-2 text-[11px] leading-relaxed">
                            {currentMission.context && (
                                <div className="bg-white/5 p-3 rounded-xl border border-white/5 mb-2">
                                    <p className="text-gray-400 italic leading-relaxed">{currentMission.context}</p>
                                </div>
                            )}
                            <p><strong className="text-telloo-neonGreen uppercase">Problema:</strong> {currentMission.problem}</p>
                            <div className="bg-telloo-neonBlue/5 p-3 rounded-lg border border-telloo-neonBlue/20 flex gap-2">
                                <Target size={14} className="text-telloo-neonBlue shrink-0"/>
                                <p className="italic text-telloo-neonBlue">Objetivo: {currentMission.objective}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-black/60 p-4 rounded-3xl border-4 border-slate-700 relative overflow-hidden group shadow-2xl">
                        <div className="w-full aspect-square bg-slate-900 rounded-2xl flex items-center justify-center relative shadow-inner overflow-hidden border border-white/5">
                            <svg viewBox="0 0 100 100" className="w-4/5 h-4/5 transition-all duration-500 transform">
                                <circle cx="50" cy="50" r={25 + (simVariable * 0.15)} fill="none" stroke="#00ff9d" strokeWidth="1" strokeDasharray="4,4" className="animate-spin-slow opacity-30"/>
                                <circle cx="50" cy="50" r={15 + (simVariable * 0.1)} fill={currentMission.color ? currentMission.color(simVariable) : "#00f0ff"} opacity="0.6" className="transition-colors duration-500"/>
                                <text x="50" y="52" textAnchor="middle" fill="white" fontSize="4" fontWeight="bold" className="uppercase tracking-widest">{simVariable}%</text>
                            </svg>
                        </div>
                        <div className="mt-6 space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[11px] font-black uppercase text-gray-400 tracking-tighter">{currentMission.controlName}</label>
                                    <span className="text-[11px] font-mono text-telloo-neonGreen">{simVariable} {currentMission.unit}</span>
                                </div>
                                <input type="range" min="0" max="100" value={simVariable} onChange={(e) => setSimVariable(parseInt(e.target.value))} className="w-full h-4 bg-slate-800 rounded-xl appearance-none cursor-pointer accent-telloo-neonGreen touch-none" />
                            </div>
                            <button onClick={handleSortearMissao} disabled={isMissionLoading} className="w-full flex items-center justify-center gap-2 p-2 bg-white/5 text-[10px] font-bold text-gray-500 rounded-lg uppercase tracking-widest hover:text-white transition-colors disabled:opacity-50">
                                <RotateCcw size={12} className={isMissionLoading ? 'animate-spin' : ''}/> Sortear nova missão do tema
                            </button>
                        </div>
                    </div>
                    <div className="bg-slate-900 border-l-4 border-telloo-neonGreen rounded-r-2xl p-4 shadow-xl">
                        <p className="text-[12px] text-gray-300 leading-relaxed min-h-[40px]">
                            {currentMission.getLog(simVariable)}
                        </p>
                    </div>
                </div>
            ) : (
                <div id="msg-content-drawer" className={`prose prose-invert ${isDrawerFullscreen ? 'max-w-4xl mx-auto' : 'max-w-none'} custom-scrollbar text-[17px] leading-relaxed text-zinc-300 print:bg-white print:text-black print:p-8`}>
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm, remarkMath]} 
                      rehypePlugins={[rehypeRaw, rehypeKatex]} 
                      components={MarkdownComponents('drawer', drawerContent)}
                    >
                      {drawerContent}
                    </ReactMarkdown>
                </div>
            )}
        </div>
      </motion.div>

      {/* Modal de Confirmação de Avaliação */}
      {isAssessmentModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-telloo-neonGreen/30 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3 text-telloo-neonGreen mb-6">
              <Target size={24} />
              <h2 className="text-[21px] font-bold uppercase tracking-tighter">Preparar {assessmentType}</h2>
            </div>
            
            <div className="space-y-4">
              <p className="text-[15px] text-gray-400">Vou preparar sua avaliação. Confirme ou ajuste o tema abaixo:</p>
              
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-telloo-neonBlue">Tema do Conteúdo</label>
                <input 
                  type="text" 
                  value={assessmentTopic} 
                  onChange={(e) => setAssessmentTopic(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-telloo-neonGreen outline-none transition-all"
                  placeholder="Ex: Relações Interespecíficas"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setIsAssessmentModalOpen(false)}
                  className="flex-1 p-4 bg-white/5 border border-white/10 rounded-xl text-[13px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={startAssessmentGeneration}
                  className="flex-1 p-4 bg-telloo-neonGreen text-black rounded-xl text-[13px] font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Limpeza de Chat */}
      {isClearConfirmOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3 text-red-400 mb-6">
              <Eraser size={24} />
              <h2 className="text-[21px] font-bold uppercase tracking-tighter">Limpar Histórico?</h2>
            </div>
            
            <div className="space-y-6">
              <p className="text-[15px] text-gray-400">Isso apagará todas as mensagens e o progresso atual. Esta ação não pode ser desfeita.</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsClearConfirmOpen(false)}
                  className="flex-1 p-4 bg-white/5 border border-white/10 rounded-xl text-[13px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmClearChat}
                  className="flex-1 p-4 bg-red-500 text-white rounded-xl text-[13px] font-bold uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                >
                  Limpar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="py-3 px-4 border-b border-white/5 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-20 shadow-lg print:hidden">
        <div className="flex items-center gap-3 w-full max-w-7xl mx-auto">
            {/* Mascote com Círculo/Portal */}
            <div className="relative group shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-telloo-neonGreen/20 to-telloo-neonBlue/20 rounded-full blur-md group-hover:blur-lg transition-all duration-500"></div>
                    <div className="relative w-14 h-14 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center shadow-inner overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-telloo-neonGreen/5 via-transparent to-transparent"></div>
                        <Mascot size="md" animated={isLoading} />
                    </div>
                    {isLoading && (
                        <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            className="absolute -inset-1 border-t-2 border-r-2 border-telloo-neonGreen/30 rounded-full pointer-events-none"
                        />
                    )}
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex justify-between items-center gap-4">
                        <div className="flex items-center gap-2">
                            <h1 className="font-display font-bold text-telloo-neonGreen tracking-tighter leading-none text-[24px]">TELLOO</h1>
                            <span className="text-[8px] bg-white/5 px-2 py-0.5 rounded-full text-gray-500 font-bold uppercase tracking-widest border border-white/5 whitespace-nowrap">
                                ENEM/SAEB
                            </span>
                        </div>

                        {/* Lado Direito: Status e Menu */}
                        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                            {/* Card de Status (NV e XP) */}
                            <div className="hidden sm:flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-3 py-2 shadow-inner">
                                <div className="relative group">
                                    <div className="flex items-center gap-2 cursor-help">
                                        <GraduationCap size={14} className="text-telloo-neonGreen" />
                                        <span className="text-[11px] text-white font-black tracking-widest">
                                            NV {level}
                                        </span>
                                    </div>
                                    
                                    {/* Tooltip de Nível */}
                                    <div className="absolute top-full right-0 mt-3 w-56 p-3 bg-slate-800 border border-telloo-neonGreen/30 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[60] pointer-events-none">
                                        <div className="space-y-2">
                                            <p className="text-[10px] text-white leading-relaxed">
                                                <span className="text-telloo-neonGreen font-bold italic">Nível {level}:</span> Foco em conceitos fundamentais e vocabulário básico.
                                            </p>
                                            <div className="h-px bg-white/10 w-full"></div>
                                            <div className="flex justify-between items-center text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
                                                <span>SÍNTESE BIOLÓGICA</span>
                                                <span className="text-telloo-neonGreen">{progress}%</span>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-full right-4 w-2 h-2 bg-slate-800 border-l border-t border-telloo-neonGreen/30 rotate-45 -mb-1"></div>
                                    </div>
                                </div>

                                <div className="w-20 h-1.5 bg-black/40 rounded-full overflow-hidden relative group/bar">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ type: 'spring', stiffness: 50, damping: 15 }}
                                        className="h-full bg-gradient-to-r from-telloo-neonGreen to-telloo-neonBlue"
                                    />
                                    <motion.div
                                        animate={{ x: ['-100%', '200%'] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                                    />
                                </div>
                            </div>

                            {/* Mobile NV Badge */}
                            <div className="sm:hidden flex items-center gap-1 bg-telloo-neonGreen/10 border border-telloo-neonGreen/20 px-2 py-0.5 rounded-lg">
                                <span className="text-[8px] font-black text-telloo-neonGreen tracking-tighter">NV {level}</span>
                            </div>

                            <div className="relative">
                                <button 
                                    onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)} 
                                    className={`p-2 transition-all rounded-xl border ${isHeaderMenuOpen ? 'bg-telloo-neonGreen/10 border-telloo-neonGreen/50 text-telloo-neonGreen shadow-[0_0_15px_rgba(0,255,157,0.1)]' : 'bg-white/5 border-white/10 text-gray-400 hover:text-telloo-neonGreen hover:border-telloo-neonGreen/30'}`}
                                >
                                    <MoreVertical size={18} />
                                </button>
                                
                                {isHeaderMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsHeaderMenuOpen(false)}></div>
                                        <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="p-2 border-b border-white/5 bg-white/5">
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Exportar Estudo</p>
                                            </div>
                                            <button onClick={() => exportChat('txt')} className="w-full px-4 py-2.5 text-[11px] font-bold text-left text-gray-300 hover:bg-white/5 hover:text-white border-b border-white/5 flex items-center gap-2 transition-colors">
                                                <FileText size={14} className="text-gray-500" /> .TXT (Simples)
                                            </button>
                                            <button onClick={() => exportChat('pdf')} className="w-full px-4 py-2.5 text-[11px] font-bold text-left text-gray-300 hover:bg-white/5 hover:text-white border-b border-white/5 flex items-center gap-2 transition-colors">
                                                <Download size={14} className="text-telloo-neonBlue" /> .PDF (Formatado)
                                            </button>
                                            <div className="p-2 border-b border-white/5 bg-white/5">
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Sessão</p>
                                            </div>
                                            <button onClick={() => setIsClearConfirmOpen(true)} className="w-full px-4 py-2.5 text-[11px] font-bold text-left text-gray-300 hover:bg-red-500/10 hover:text-red-400 border-b border-white/5 flex items-center gap-2 transition-colors">
                                                <Eraser size={14} /> Limpar Histórico
                                            </button>
                                            <button onClick={onOpenSettings} className="w-full px-4 py-2.5 text-[11px] font-bold text-left text-gray-300 hover:bg-white/5 hover:text-white border-b border-white/5 flex items-center gap-2 transition-colors">
                                                <Settings size={14} /> Configurações
                                            </button>
                                            <button onClick={onLogout} className="w-full px-4 py-2.5 text-[11px] font-bold text-left text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors">
                                                <LogOut size={14} /> Sair do Telloo
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-1 h-1 bg-telloo-neonBlue rounded-full animate-pulse"></div>
                    <span className="text-[10px] text-telloo-neonBlue/80 font-bold uppercase tracking-widest truncate max-w-[150px] sm:max-w-[300px]" title={currentTopic || 'Biologia'}>
                        {currentTopic || 'Biologia'}
                    </span>
                </div>
            </div>
        </div>
      </header>

      <main ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar pb-32 sm:pb-40 print:p-0 print:bg-white print:text-black print:overflow-visible">
        {memoizedMessages}
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-4 bg-slate-900/80 backdrop-blur-xl border-t border-white/5 fixed bottom-0 w-full z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.3)] print:hidden">
        <div className="max-w-4xl mx-auto space-y-3">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {[
                    { mode: ResponseMode.MIND_MAP, icon: Brain, color: 'text-purple-400', border: 'border-purple-500/20', bg: 'bg-purple-500/5' },
                    { mode: ResponseMode.CREATIVE, icon: Palette, color: 'text-pink-400', border: 'border-pink-500/20', bg: 'bg-pink-500/5' },
                    { mode: ResponseMode.LOGICAL, icon: Microscope, color: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/5' },
                    { mode: ResponseMode.LINGUISTIC, icon: BookOpen, color: 'text-cyan-400', border: 'border-cyan-500/20', bg: 'bg-cyan-500/5' },
                    { mode: ResponseMode.BNCC, icon: GraduationCap, color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5' }
                ].map((item) => (
                    <button key={item.mode} onClick={() => handleModeSelect(item.mode)} className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap ${selectedMode === item.mode ? `${item.bg} ${item.color} ${item.border}` : 'bg-transparent text-gray-500 border-transparent hover:text-gray-400'}`}><item.icon size={12}/>{item.mode}</button>
                ))}
            </div>
            <div className="flex items-center gap-2 relative">
                {isLoading && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md text-telloo-neonGreen px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-telloo-neonGreen/20 shadow-2xl flex items-center gap-2 whitespace-nowrap animate-fade-in">
                    <Loader2 size={10} className="animate-spin" />
                    <span className="animate-pulse">{thinkingPhrases[thinkingIndex]}</span>
                  </div>
                )}
                <div className="flex-1 flex items-center bg-white/5 border border-white/10 rounded-[24px] px-4 py-1 focus-within:border-telloo-neonGreen/50 transition-all shadow-inner">
                    <input ref={inputRef} value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder={isListening ? "Ouvindo... 🎙️" : "Mensagem..."} className="flex-1 bg-transparent py-3 outline-none text-[15px] placeholder:text-gray-500" />
                    <button 
                       onClick={toggleListening} 
                       className={`p-2 rounded-full transition-all ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-white'}`}
                       title={isListening ? "Ouvindo... 🎙️" : "Voz"}
                     >
                       <Mic size={20} />
                     </button>
                </div>
                 <button onClick={() => handleSend()} disabled={!inputText.trim() || isLoading} className="p-3 bg-telloo-neonGreen text-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg shadow-telloo-neonGreen/20"><Send size={20}/></button>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default ChatInterface;
