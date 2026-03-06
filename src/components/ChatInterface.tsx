
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Message, ResponseMode, TeacherSettings, QuestionType } from '../types';
import { streamMessageToGemini, streamQuestions, generateDeepDiveContent, generateSimulationMission } from '../services/geminiService';
import Mascot from './Mascot';
import { Send, Brain, Palette, Microscope, BookOpen, Sparkles, X, Target, Library, Share2, ChevronRight, Zap, FileText, Eraser, MapPin, Bookmark, Loader2, Download, Settings, Beaker, Sliders, Play, RotateCcw, Activity, Info, AlertTriangle, ClipboardCheck, Copy, Check, Eye, EyeOff, RefreshCw, GraduationCap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface Props {
  userName: string;
  settings: TeacherSettings;
  onOpenSettings: () => void;
}

const ChatInterface: React.FC<Props> = ({ userName, settings, onOpenSettings }) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('telloo_chat_history');
      return saved ? JSON.parse(saved) : [{
        id: 'intro',
        role: 'model',
        text: `🧠 Olá, **${userName || 'Estudante'}**! Estou com meus circuitos biológicos carregados.\n\nComo você quer estudar hoje? Escolha um estilo abaixo ou me conte o que está estudando!`,
        timestamp: Date.now()
      }];
    } catch (e) {
      console.error("Erro ao carregar histórico:", e);
      return [{
        id: 'intro',
        role: 'model',
        text: `🧠 Olá, **${userName || 'Estudante'}**! Estou com meus circuitos biológicos carregados.\n\nComo você quer estudar hoje? Escolha um estilo abaixo ou me conte o que está estudando!`,
        timestamp: Date.now()
      }];
    }
  });

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [selectedMode, setSelectedMode] = useState<ResponseMode>(ResponseMode.CREATIVE);
  const [currentTopic, setCurrentTopic] = useState<string | null>(localStorage.getItem('telloo_current_topic'));
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [drawerContent, setDrawerContent] = useState('');
  const [isDrawerLoading, setIsDrawerLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [assessmentType, setAssessmentType] = useState<QuestionType>('Objetiva');
  const [assessmentTopic, setAssessmentTopic] = useState('');

  const [userSelections, setUserSelections] = useState<Record<string, Record<number, string>>>({});
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});

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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('telloo_chat_history', JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      .replace(/---GABARITO---[\s\S]*$/, '')
      .replace(/#{1,6}\s?/g, '')
      .replace(/\*\*|__/g, '')
      .replace(/\*|_/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/`{1,3}[\s\S]*?`{1,3}/g, (match) => match.replace(/`/g, ''));
    
    // Remove apenas marcadores de citação (>) no início de linhas, preservando símbolos matemáticos no meio do texto
    cleaned = cleaned.replace(/^>\s?/gm, '');

    if (!preserveSvg) {
      cleaned = cleaned.replace(/<svg[\s\S]*?<\/svg>/g, '\n[Diagrama Biológico Gerado]\n');
    } else {
      // Garante que os SVGs tenham o namespace necessário para exportação, sem duplicar
      cleaned = cleaned.replace(/<svg(?![^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg")/g, '<svg xmlns="http://www.w3.org/2000/svg"');
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

  const exportSingleBlock = (text: string, format: 'txt' | 'doc' | 'pdf') => {
    const preserveSvg = format === 'pdf' || format === 'doc';
    const clean = cleanMarkdown(text, preserveSvg);
    
    if (format === 'pdf') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            // Converter quebras de linha em <br> para o PDF se não for SVG
            const htmlContent = clean.replace(/\n/g, '<br>').replace(/<br><svg/g, '<svg').replace(/<\/svg><br>/g, '</svg>');
            
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Ficha de Estudo - Telloo</title>
                        <style>
                            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; line-height: 1.6; background: white; }
                            h1 { color: #064e3b; border-bottom: 2px solid #00ff9d; padding-bottom: 10px; margin-bottom: 20px; font-family: sans-serif; text-transform: uppercase; letter-spacing: 2px; }
                            .content { margin-bottom: 30px; font-size: 14px; color: black; }
                            svg { max-width: 400px; height: auto; display: block; margin: 20px auto; border: 1px solid #eee; padding: 10px; border-radius: 8px; }
                            .footer { font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 10px; text-align: center; margin-top: 40px; }
                            @media print {
                                body { padding: 0; }
                                svg { page-break-inside: avoid; }
                            }
                        </style>
                    </head>
                    <body>
                        <h1>TELLOO - FICHA DE ESTUDO</h1>
                        <div class="content">${htmlContent}</div>
                        <div class="footer">Gerado por Telloo AI • Especialista em Biologia • Alinhado à BNCC</div>
                        <script>
                            window.onload = () => {
                                setTimeout(() => {
                                    window.print();
                                    // window.close(); // Opcional: fechar após imprimir
                                }, 800);
                            };
                        </script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        }
        return;
    }
    if (format === 'doc') {
        const html = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'></head>
            <body>
                <div style="font-family: 'Segoe UI', sans-serif; padding: 20px;">
                    ${clean.replace(/\n/g, '<br>').replace(/<br><svg/g, '<svg').replace(/<\/svg><br>/g, '</svg>')}
                </div>
            </body>
            </html>
        `;
        const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `telloo-estudo-${Date.now()}.doc`;
        link.click();
        return;
    }
    const blob = new Blob([clean], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `telloo-estudo-${Date.now()}.${format === 'txt' ? 'txt' : 'doc'}`;
    link.click();
  };

  const handleSend = async (text?: string, mode?: ResponseMode, isSilent = false) => {
    const textToSend = text || inputText;
    if (!textToSend.trim()) return;

    const modeToUse = mode || selectedMode;
    if (!currentTopic && !isSilent) {
        const isMetaQuestion = /^(quem é você|o que você faz|como você ajuda|quais suas capacidades|quem criou você|quem é o telloo)/i.test(textToSend.toLowerCase());
        if (!isMetaQuestion) {
            const topic = textToSend.length > 60 ? textToSend.substring(0, 60) + "..." : textToSend;
            setCurrentTopic(topic);
        }
    }
    
    if (!isSilent) {
        const userMsg: Message = { 
            id: Date.now().toString(), 
            role: 'user', 
            text: textToSend, 
            mode: modeToUse, 
            timestamp: Date.now() 
        };
        setMessages(prev => [...prev, userMsg]);
    }

    setInputText('');
    setIsLoading(true);
    setHasError(false);

    const modelMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { 
        id: modelMsgId, 
        role: 'model', 
        text: '', 
        isStreaming: true, 
        mode: modeToUse,
        timestamp: Date.now() 
    }]);

    try {
        await streamMessageToGemini([...messages], textToSend, modeToUse, settings, (chunk) => {
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

  const handleOpenSimulation = () => {
    setIsSimulationMode(true);
    setIsDrawerOpen(true);
    setDrawerContent(`Laboratório iniciado para o tópico: **${currentTopic || 'Biologia'}**.`);
    if (!activeMission) {
        setActiveMission(getSimulationMission());
    }
  };

  const handleOpenDeepDive = () => {
    setIsSimulationMode(false);
    setIsDrawerOpen(true);
    setIsDrawerLoading(true);
    generateDeepDiveContent(currentTopic || "Biologia", messages, settings).then(c => {
        setDrawerContent(c);
        setIsDrawerLoading(false);
    });
  };

  const exportChat = (format: 'txt' | 'pdf' | 'docx') => {
    const title = `Relatório de Estudo Telloo - ${currentTopic || 'Biologia'}`;
    const timestamp = new Date().toLocaleString('pt-BR');
    if (format === 'pdf') {
        setShowExportMenu(false);
        setTimeout(() => window.print(), 200);
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
                <div style="color: #666; margin-bottom: 20px;">Relatório Educacional Telloo AI • Professor(a): ${userName} • ${timestamp}</div>
                ${messages.map(m => `
                    <div style="margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                        <strong style="color: #064e3b; text-transform: uppercase; font-size: 10pt;">${m.role === 'user' ? 'Estudante' : 'Assistente Telloo'}:</strong>
                        <div style="margin-top: 10px;">${cleanMarkdown(m.text, true).replace(/\n/g, '<br>').replace(/<br><svg/g, '<svg').replace(/<\/svg><br>/g, '</svg>')}</div>
                    </div>
                `).join('')}
            </body>
            </html>
        `;
        const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `telloo-bio-${Date.now()}.doc`;
        link.click();
    }
    setShowExportMenu(false);
  };

  const handleModeSelect = (mode: ResponseMode) => {
    if (mode === selectedMode && messages.length > 1) return;
    setSelectedMode(mode);
    if (messages.length > 1) {
        const modeFeedback = {
            [ResponseMode.MIND_MAP]: "Entendido! A partir de agora vou estruturar minhas respostas como um **Mapa Mental**. 🧠",
            [ResponseMode.CREATIVE]: "Modo **Criativo** ativado! 🎨",
            [ResponseMode.LOGICAL]: "Certo, ativando modo **Lógico**. 🔬",
            [ResponseMode.LINGUISTIC]: "Modo **Linguístico** pronto. 📖",
            [ResponseMode.BNCC]: "Modo **BNCC** ativado! Vou priorizar as competências e habilidades da Base Nacional Comum Curricular. 🎓"
        };
        
        let text = modeFeedback[mode];
        if (currentTopic) {
            text += `\n\nPercebi que estávamos estudando **${currentTopic}**. Gostaria que eu re-explicasse este assunto usando este novo estilo ${mode}?`;
        }

        setMessages(prev => [...prev, {
            id: `mode-change-${Date.now()}`,
            role: 'model',
            text: text,
            timestamp: Date.now(),
            mode: mode
        }]);
    } else {
        handleSend(`Ative o modo ${mode}. Me dê uma breve introdução sobre como vamos trabalhar!`, mode);
    }
  };

  const handleGenerateAssessment = (type: QuestionType) => {
    setAssessmentType(type);
    setAssessmentTopic(currentTopic || settings.currentChapter || "Biologia");
    setIsAssessmentModalOpen(true);
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
        text: `Olá! Eu sou o **Telloo**, seu tutor especializado em Biologia. 🧬\n\nEstou configurado para o **${settings.gradeLevel}**. O que vamos explorar hoje?`,
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

  const selectOption = (msgId: string, qIndex: number, optionLetter: string) => {
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

  const MarkdownComponents = (msgId: string, msgText: string, initialQIndex: number = 0) => {
    let internalQIndex = initialQIndex;

    const renderOptionButton = (letter: string, content: string, qIdx: number) => {
        const normalizedLetter = letter.toLowerCase();
        const isSelected = userSelections[msgId]?.[qIdx] === normalizedLetter;
        return (
            <div key={`${letter}-${qIdx}`} onClick={() => selectOption(msgId, qIdx, normalizedLetter)} className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer group/opt mb-2 ${isSelected ? 'bg-telloo-neonBlue/20 border-telloo-neonBlue shadow-[0_0_15px_rgba(0,240,255,0.2)]' : 'bg-white/5 border-white/10 hover:border-white/30'}`}>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all font-bold text-[10px] uppercase ${isSelected ? 'bg-telloo-neonBlue border-telloo-neonBlue text-black' : 'border-white/30 text-gray-400 group-hover/opt:border-telloo-neonBlue/50'}`}>
                    {letter}
                </div>
                <p className={`text-sm leading-relaxed ${isSelected ? 'text-white' : 'text-gray-300'}`}>{content}</p>
            </div>
        );
    };

    return {
      h1: (props: any) => <h1 className="text-xl sm:text-2xl font-display font-bold text-telloo-neonGreen mt-6 mb-4 border-b border-telloo-neonGreen/20 pb-2 print:text-black print:border-black" {...props} />,
      h2: (props: any) => <h2 className="text-lg sm:text-xl font-semibold text-white mt-6 mb-3 print:text-black" {...props} />,
      h3: (props: any) => <h3 className="text-base sm:text-lg font-medium text-telloo-neonBlue mt-4 mb-2 print:text-black" {...props} />,
      p: (props: any) => {
          const text = getCleanText(props.children);
          
          if (/quest[ãa]o\s?(\d+)/i.test(text)) {
            const numMatch = text.match(/quest[ãa]o\s?(\d+)/i);
            if (numMatch) internalQIndex = parseInt(numMatch[1]) - 1;
            else internalQIndex++;
          }

          const lines = text.split(/\n/).filter(line => line.trim().length > 0);
          const processedLines = lines.map((line, idx) => {
              const altMatch = line.trim().match(/^(\*\*|__)?[a-e][\)\s.-]\s?(.*)/i);
              if (altMatch) {
                  const letterMatch = line.match(/[a-e]/i);
                  const letter = letterMatch ? letterMatch[0] : 'a';
                  const content = line.replace(/^(\*\*|__)?[a-e][\)\s.-]\s?/i, '');
                  return renderOptionButton(letter, content, internalQIndex);
              }
              return <span key={idx}>{line}<br/></span>;
          });

          return <div className="mb-4 leading-relaxed last:mb-0 print:text-black">{processedLines}</div>;
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
          return <li className="mb-1" {...props} />;
      },
      code: ({ node, inline, className, children, ...props }: any) => {
        const content = String(children);
        if (!inline && content.trim().startsWith('<svg')) {
          return (
            <div className="my-6 p-4 bg-black/40 rounded-2xl border border-telloo-neonGreen/20 shadow-[0_0_15px_rgba(0,255,157,0.1)] overflow-hidden print:bg-white print:border-black print:shadow-none">
              <div className="text-[9px] text-telloo-neonGreen/50 uppercase tracking-[0.2em] font-bold mb-3 flex items-center justify-between print:text-black print:border-b print:mb-2">
                  <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-telloo-neonGreen rounded-full animate-pulse print:hidden"></div>
                      Diagrama Biológico
                  </div>
              </div>
              <div className="flex justify-center items-center w-full min-h-[100px] print:filter-none" dangerouslySetInnerHTML={{ __html: content.trim() }} />
            </div>
          );
        }
        return <code className={`${className} bg-slate-800 px-1.5 py-0.5 rounded text-telloo-neonBlue text-xs font-mono`} {...props}>{children}</code>;
      },
      svg: ({node, children, ...props}: any) => {
          const { inline, ...cleanProps } = props;
          return (
              <div className="my-6 p-4 bg-black/40 rounded-2xl border border-telloo-neonGreen/20 shadow-[0_0_15px_rgba(0,255,157,0.1)] overflow-hidden relative group print:bg-white print:border-black print:shadow-none">
                  <div className="flex justify-center items-center w-full min-h-[100px] print:filter-none">
                      <svg {...cleanProps} style={{ maxWidth: '100%', height: 'auto', display: 'block' }} className="drop-shadow-[0_0_10px_rgba(0,255,157,0.2)] print:drop-shadow-none">
                          {children}
                      </svg>
                  </div>
              </div>
          )
      }
    };
  };

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-white overflow-hidden">
      <div className={`fixed inset-y-0 right-0 w-full sm:w-[500px] bg-slate-900 z-50 transform transition-transform border-l border-telloo-neonGreen/30 shadow-2xl ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'} print:hidden`}>
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
            <h2 className="font-display font-bold text-lg flex items-center gap-2 text-telloo-neonGreen uppercase tracking-tighter">
                {isSimulationMode ? <><Beaker size={20}/> Bio-Sandbox</> : <><Library size={20}/> Bio-Data</>}
            </h2>
            <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X/></button>
        </div>
        <div className="p-6 overflow-y-auto h-[calc(100%-80px)] custom-scrollbar">
            {isDrawerLoading || isMissionLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-6">
                    <Loader2 size={48} className="text-telloo-neonGreen animate-spin" />
                    <p className="text-xs text-telloo-neonGreen animate-pulse font-mono tracking-widest uppercase font-bold text-center">Processando...</p>
                </div>
            ) : isSimulationMode ? (
                <div className="space-y-6">
                    <div className="bg-slate-800/50 rounded-2xl p-5 border border-white/10 shadow-lg space-y-3">
                        <div className="flex items-center gap-2 text-telloo-neonBlue">
                            <Activity size={18}/>
                            <h3 className="text-xs font-bold uppercase tracking-widest">{currentMission.title}</h3>
                        </div>
                        <div className="space-y-2 text-[11px] leading-relaxed">
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
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">{currentMission.controlName}</label>
                                    <span className="text-[10px] font-mono text-telloo-neonGreen">{simVariable} {currentMission.unit}</span>
                                </div>
                                <input type="range" min="0" max="100" value={simVariable} onChange={(e) => setSimVariable(parseInt(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-telloo-neonGreen" />
                            </div>
                            <button onClick={handleSortearMissao} disabled={isMissionLoading} className="w-full flex items-center justify-center gap-2 p-2 bg-white/5 text-[9px] font-bold text-gray-500 rounded-lg uppercase tracking-widest hover:text-white transition-colors disabled:opacity-50">
                                <RotateCcw size={12} className={isMissionLoading ? 'animate-spin' : ''}/> Sortear nova missão do tema
                            </button>
                        </div>
                    </div>
                    <div className="bg-slate-900 border-l-4 border-telloo-neonGreen rounded-r-2xl p-4 shadow-xl">
                        <p className="text-[11px] text-gray-300 leading-relaxed min-h-[40px]">
                            {currentMission.getLog(simVariable)}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="prose prose-invert max-w-none custom-scrollbar">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={MarkdownComponents('drawer', drawerContent)}>{drawerContent}</ReactMarkdown>
                </div>
            )}
        </div>
      </div>

      {/* Modal de Confirmação de Avaliação */}
      {isAssessmentModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-telloo-neonGreen/30 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3 text-telloo-neonGreen mb-6">
              <Target size={24} />
              <h2 className="text-xl font-bold uppercase tracking-tighter">Preparar {assessmentType}</h2>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-400">Vou preparar sua avaliação. Confirme ou ajuste o tema abaixo:</p>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-telloo-neonBlue">Tema do Conteúdo</label>
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
                  className="flex-1 p-4 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={startAssessmentGeneration}
                  className="flex-1 p-4 bg-telloo-neonGreen text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all"
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
              <h2 className="text-xl font-bold uppercase tracking-tighter">Limpar Histórico?</h2>
            </div>
            
            <div className="space-y-6">
              <p className="text-sm text-gray-400">Isso apagará todas as mensagens e o progresso atual. Esta ação não pode ser desfeita.</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsClearConfirmOpen(false)}
                  className="flex-1 p-4 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmClearChat}
                  className="flex-1 p-4 bg-red-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                >
                  Limpar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="p-4 border-b border-white/5 bg-slate-900/80 backdrop-blur-md flex justify-between items-center sticky top-0 z-20 shadow-lg print:hidden">
        <div className="flex items-center gap-3">
            <Mascot size="sm" animated={isLoading} />
            <div className="flex flex-col">
                <h1 className="font-display font-bold text-telloo-neonGreen tracking-tighter leading-none">TELLOO</h1>
                <div className="flex gap-2 items-center mt-1">
                    <span className="text-[8px] bg-white/10 px-1.5 py-0.5 rounded text-gray-400 font-bold uppercase tracking-widest">{settings.gradeLevel}</span>
                </div>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="relative">
                <button onClick={() => setShowExportMenu(!showExportMenu)} className="p-2 text-gray-400 hover:text-telloo-neonGreen flex items-center gap-1" title="Exportar Estudo"><Download size={18}/></button>
                {showExportMenu && (
                    <div className="absolute right-0 mt-2 w-32 bg-slate-800 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                        <button onClick={() => exportChat('txt')} className="w-full px-4 py-2 text-left text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-colors border-b border-white/5 flex items-center gap-2"><FileText size={12}/> .TXT</button>
                        <button onClick={() => exportChat('docx')} className="w-full px-4 py-2 text-left text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-colors border-b border-white/5 flex items-center gap-2"><FileText size={12}/> .DOC</button>
                        <button onClick={() => exportChat('pdf')} className="w-full px-4 py-2 text-left text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-colors flex items-center gap-2"><FileText size={12}/> .PDF</button>
                    </div>
                )}
            </div>
            <button onClick={clearChat} className="p-2 text-gray-500 hover:text-red-400 transition-colors" title="Limpar Histórico"><Eraser size={18}/></button>
            <button onClick={onOpenSettings} className="p-2 text-telloo-neonGreen hover:scale-110 transition-transform" title="Configurações"><Settings size={20}/></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar pb-32 sm:pb-40 print:p-0 print:bg-white print:text-black print:overflow-visible">
        {messages.map((msg, i) => {
          const suggestions = msg.role === 'model' && !msg.isStreaming ? extractSuggestions(msg.text) : [];
          const parts = msg.text.split('---GABARITO---');
          const questionContent = parts[0].replace(/\[SUGESTÃO:.*?\]/g, '');
          const answerKey = parts[1] || '';
          const isAnswerRevealed = revealedAnswers[msg.id];
          const isLast = i === messages.length - 1;

          return (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in print:block print:mb-8 print:break-inside-avoid`}>
              <div className={`relative group max-w-[95%] sm:max-w-[85%] p-5 sm:p-8 rounded-2xl border transition-all ${msg.role === 'user' ? 'bg-slate-800 border-white/10' : 'bg-slate-900/60 border-telloo-neonGreen/10 shadow-xl'} print:bg-white print:border-none print:p-0 print:max-w-full`}>
                
                {msg.role === 'model' && !msg.isStreaming && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                        <button onClick={() => copyToClipboard(msg.text, msg.id)} className="p-1.5 bg-black/40 border border-white/10 rounded-lg text-gray-400 hover:text-telloo-neonGreen transition-colors" title="Copiar bloco">
                            {copiedId === msg.id ? <Check size={14} className="text-telloo-neonGreen" /> : <Copy size={14}/>}
                        </button>
                        <div className="relative group/exp">
                            <button className="p-1.5 bg-black/40 border border-white/10 rounded-lg text-gray-400 hover:text-telloo-neonBlue transition-colors" title="Exportar este bloco">
                                <Share2 size={14}/>
                            </button>
                            <div className="absolute right-0 top-full mt-1 hidden group-hover/exp:block bg-slate-800 border border-white/10 rounded-lg shadow-xl overflow-hidden z-30">
                                <button onClick={() => exportSingleBlock(msg.text, 'txt')} className="w-full px-3 py-1.5 text-[9px] font-bold text-left hover:bg-white/5 border-b border-white/5">.TXT</button>
                                <button onClick={() => exportSingleBlock(msg.text, 'doc')} className="w-full px-3 py-1.5 text-[9px] font-bold text-left hover:bg-white/5 border-b border-white/5">.DOC</button>
                                <button onClick={() => exportSingleBlock(msg.text, 'pdf')} className="w-full px-3 py-1.5 text-[9px] font-bold text-left hover:bg-white/5">.PDF</button>
                            </div>
                        </div>
                    </div>
                )}

                {msg.role === 'model' && msg.mode && <div className="flex items-center gap-2 mb-4 text-[9px] font-bold uppercase tracking-widest text-telloo-neonBlue bg-telloo-neonBlue/10 w-fit px-2 py-0.5 rounded border border-telloo-neonBlue/20 print:hidden"><Zap size={10}/> {msg.mode}</div>}

                <div className="prose prose-invert max-w-none text-gray-200 leading-relaxed text-sm sm:text-base markdown-container print:text-black print:prose-black">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={MarkdownComponents(msg.id, questionContent)}>{questionContent}</ReactMarkdown>
                </div>

                {hasError && isLast && msg.role === 'model' && (
                  <div className="mt-4 flex flex-col items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-widest">
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
                                <div className="flex items-center gap-2 mb-3 text-telloo-neonGreen print:text-black">
                                    <ClipboardCheck size={18}/>
                                    <h4 className="text-xs font-bold uppercase tracking-widest">Resolução Comentada</h4>
                                </div>
                                <div className="prose prose-invert max-w-none text-xs sm:text-sm text-gray-300 print:text-black">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={MarkdownComponents(msg.id, answerKey, 99)}>{answerKey}</ReactMarkdown>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {isLast && !msg.isStreaming && suggestions.length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-2 print:hidden">
                        {suggestions.map((s, idx) => (<button key={idx} onClick={() => handleSend(s)} className="px-4 py-2 bg-telloo-neonBlue/5 border border-telloo-neonBlue/20 text-telloo-neonBlue text-[11px] font-bold rounded-xl hover:bg-telloo-neonBlue/15 transition-all"><Sparkles size={12}/> {s}</button>))}
                    </div>
                )}

                {isLast && !msg.isStreaming && msg.role === 'model' && msg.id !== 'intro' && !hasError && (
                    <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden">
                        <button onClick={() => handleGenerateAssessment('Objetiva')} className="flex items-center justify-center gap-2 p-3 bg-telloo-neonGreen/10 border border-telloo-neonGreen/30 rounded-xl text-[9px] font-bold text-telloo-neonGreen uppercase tracking-widest hover:bg-telloo-neonGreen/20 transition-all"><Target size={14}/> Desafio</button>
                        <button onClick={handleOpenDeepDive} className="flex items-center justify-center gap-2 p-3 bg-slate-800 border border-slate-700 rounded-xl text-[9px] font-bold text-gray-400 uppercase tracking-widest hover:bg-slate-700 transition-all"><Library size={14}/> Bio-Data</button>
                        <button onClick={handleOpenSimulation} className="flex items-center justify-center gap-2 p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-[9px] font-bold text-purple-400 uppercase tracking-widest hover:bg-purple-500/20 transition-all"><Beaker size={14}/> Simular</button>
                        <button onClick={() => handleGenerateAssessment('PROVA')} className="flex items-center justify-center gap-2 p-3 bg-telloo-neonBlue/10 border border-telloo-neonBlue/30 rounded-xl text-[9px] font-bold text-telloo-neonBlue uppercase tracking-widest hover:bg-telloo-neonBlue/20 transition-all"><FileText size={14}/> Prova</button>
                    </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-4 bg-slate-900 border-t border-white/5 fixed bottom-0 w-full z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.5)] print:hidden">
        <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {[
                    { mode: ResponseMode.MIND_MAP, icon: Brain, color: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-500/5' },
                    { mode: ResponseMode.CREATIVE, icon: Palette, color: 'text-pink-400', border: 'border-pink-500/30', bg: 'bg-pink-500/5' },
                    { mode: ResponseMode.LOGICAL, icon: Microscope, color: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/5' },
                    { mode: ResponseMode.LINGUISTIC, icon: BookOpen, color: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'bg-cyan-500/5' },
                    { mode: ResponseMode.BNCC, icon: GraduationCap, color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/5' }
                ].map((item) => (
                    <button key={item.mode} onClick={() => handleModeSelect(item.mode)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap ${selectedMode === item.mode ? `${item.bg} ${item.color} ${item.border}` : 'bg-transparent text-gray-500 border-transparent hover:text-gray-400'}`}><item.icon size={12}/>{item.mode}</button>
                ))}
            </div>
            <div className="flex items-center gap-3 relative">
                {isLoading && (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-telloo-neonGreen px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border border-telloo-neonGreen/30 shadow-2xl flex items-center gap-3 whitespace-nowrap animate-fade-in">
                    <Loader2 size={12} className="animate-spin" />
                    <span className="animate-pulse">{thinkingPhrases[thinkingIndex]}</span>
                  </div>
                )}
                <input ref={inputRef} value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="O que vamos aprender hoje?" className="flex-1 bg-black/40 border border-white/10 rounded-2xl p-4 focus:border-telloo-neonGreen outline-none text-sm shadow-inner" />
                <button onClick={() => handleSend()} disabled={!inputText.trim() || isLoading} className="p-4 bg-telloo-neonGreen text-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,255,157,0.3)]"><Send size={20}/></button>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default ChatInterface;
