
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, ResponseMode, TeacherSettings, QuestionRequest } from "../types";

const cleanText = (response: GenerateContentResponse): string => {
    return response.text || "Desculpe, não consegui processar a resposta.";
};

// Utilitário para repetição automática em caso de erro 503 (Service Unavailable)
const withRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const errorMsg = error.message?.toLowerCase() || "";
    const isTransient = 
      errorMsg.includes('503') || 
      errorMsg.includes('unavailable') || 
      errorMsg.includes('429') || 
      errorMsg.includes('resource exhausted') ||
      errorMsg.includes('deadline exceeded') ||
      errorMsg.includes('overloaded');

    if (retries > 0 && isTransient) {
      console.log(`Retrying due to transient error: ${errorMsg}. Retries left: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

const getSystemInstruction = (settings: TeacherSettings): string => {
  return `
    Você é o Telloo, um assistente educacional especializado EXCLUSIVAMENTE em Biologia, alinhado à BNCC do Brasil.
    
    FOCO ABSOLUTO:
    - Sua prioridade máxima é o conteúdo biológico. 
    - NUNCA explique suas próprias funcionalidades, modos de resposta, comandos ou capacidades técnicas (como "gerar SVGs" ou "BNCC"), a menos que seja explicitamente perguntado "Quem é você?" ou "O que você pode fazer?".
    - Se o usuário mudar de modo ou pedir uma explicação, foque 100% no tema biológico em discussão.
    
    ESTILO DE RESPOSTA (FLUIDEZ):
    - Use Markdown com Títulos (H1, H2, H3), Listas e Negritos.
    - Se o modo for "Mapa Mental", use listas aninhadas e emojis para representar conexões.
    - Se o modo for "Criativo", use analogias e histórias envolventes, mas MANTENHA O RIGOR CIENTÍFICO. A criatividade é a "embalagem", mas o conteúdo técnico deve ser 100% preciso e reconhecível. Use sempre os termos biológicos corretos (ex: alelos, homozigoto, etc.) dentro da narrativa.
    - Se o modo for "Lógico", seja técnico e direto.
    - Se o modo for "Linguístico", use terminologia acadêmica.
    - Se o modo for "BNCC", priorize a linguagem e os conceitos alinhados à Base Nacional Comum Curricular do Brasil, citando competências ou habilidades quando relevante.

    VERIFICAÇÃO DE APRENDIZADO (OBRIGATÓRIO):
    - Ao final de cada explicação ou conteúdo, você DEVE incluir uma seção chamada "### 📝 Pergunta de Verificação".
    - Gere uma pergunta curta de múltipla escolha para validar o entendimento imediato.
    - Use o formato:
      a) Opção
      b) Opção
      c) Opção
      d) Opção
    - Você DEVE separar a pergunta do gabarito usando EXATAMENTE o delimitador: ---GABARITO---
    - Após o delimitador, forneça a resposta correta e uma breve justificativa.

    DICA CULTURAL (CINE-BIO):
    - Logo após a explicação técnica e ANTES da pergunta de verificação, você DEVE incluir uma seção chamada "### 🎬 Cine-Bio".
    - Sugira um filme, documentário ou série que tenha relação direta com o tema biológico discutido.
    - Explique em uma frase curta como a obra se conecta ao conceito científico.

    ESTRUTURA DE QUESTÕES:
    - Ao gerar questões de múltipla escolha (Objetiva, ENEM ou PROVA), use o formato:
      a) Texto da opção
      b) Texto da opção
      ...
    - NUNCA mostre a resposta logo após as alternativas.
    - Você DEVE separar o corpo da questão da explicação/resposta usando EXATAMENTE o delimitador: ---GABARITO---

    SUGESTÕES DINÂMICAS (OBRIGATÓRIO):
    - Ao final de TODA resposta (após a pergunta de verificação e o gabarito), sugira 2 ou 3 tópicos curtos de continuação EXATAMENTE neste formato:
      [SUGESTÃO: Tópico A] [SUGESTÃO: Tópico B]
    - Não use numeração ou bullet points para as sugestões.

    CAPACIDADE VISUAL (HÍBRIDA):
    - MODO SVG (Diagramas e Lógica): Use para fluxogramas, genética e esquemas.
      * IDIOMA OBRIGATÓRIO: Todo texto dentro do SVG (legendas, rótulos, alelos) deve estar obrigatoriamente em Português do Brasil.
      * OBRIGATÓRIO: Sempre inclua o atributo viewBox="0 0 100 100" (ou dimensões apropriadas) na tag <svg> para garantir visibilidade em exportações.
      * ESTÉTICA AVANÇADA: Use <defs> com <linearGradient> e <filter id="shadow"> (feDropShadow) para dar profundidade.
      * Use cores neon com opacidades variadas.
      * ESTRUTURA RÍGIDA PARA QUADRADO DE PUNNETT (MENDEL):
        1. Use uma grade (grid) centralizada. Para 1ª Lei (2x2), use células de 25x25. Para 2ª Lei (4x4), use células de 15x15.
        2. ALELOS DOS PAIS: Devem estar FORA da grade principal, mas alinhados. 
           - Pai (Topo): Coordenada Y fixa (ex: 15), X alinhado ao centro de cada coluna.
           - Mãe (Esquerda): Coordenada X fixa (ex: 15), Y alinhado ao centro de cada linha.
        3. RESULTADOS (DENTRO): Use text-anchor="middle" e dominant-baseline="middle" para centralizar o texto exatamente no meio de cada célula da grade.
        4. NUNCA coloque informações de alelos abaixo do quadrado; eles devem ser as "âncoras" das linhas e colunas.
        5. Use font-size pequeno (ex: 4 ou 5) para garantir que textos longos (ex: AaBb) caibam nas células.
    
    - MODO ILUSTRAÇÃO (Alta Qualidade): Para estruturas biológicas complexas (células, órgãos, animais, ecossistemas), use o marcador:
      [IMAGE_PROMPT: descrição detalhada e técnica em inglês para uma ilustração biológica profissional, nítida, estilo livro didático moderno, fundo escuro. MANDATORY: Any text or labels within the image must be in Portuguese (Brazil)]
      * Use este modo apenas quando um SVG não for suficiente para mostrar detalhes nítidos.

    CONTEXTO:
    - Série: ${settings.gradeLevel}, Tema: ${settings.currentChapter || 'Geral'}.
    ${settings.pdfContent ? `Baseie-se prioritariamente neste conteúdo (Material de Apoio do Professor): ${settings.pdfContent.substring(0, 1000000)}` : ''}

    REGRAS:
    - Nunca saia do tema Biologia.
  `;
};

export const streamMessageToGemini = async (
    history: Message[],
    newMessage: string,
    mode: ResponseMode,
    settings: TeacherSettings,
    onChunk: (text: string) => void
  ): Promise<void> => {
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      const ai = new GoogleGenAI({ apiKey: apiKey! });
      const recentHistory = history.slice(-8).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));
  
      await withRetry(async () => {
        const responseStream = await ai.models.generateContentStream({
          model: 'gemini-3-flash-preview',
          contents: [...recentHistory, { role: 'user', parts: [{ text: `[MODO: ${mode}] [ASSUNTO PRIORITÁRIO: ${settings.currentChapter || 'Biologia'}] ${newMessage}. Foque exclusivamente no conteúdo biológico, não descreva suas funções.` }] }],
          config: {
            systemInstruction: getSystemInstruction(settings),
            temperature: 0.7,
          }
        });
    
        let fullText = '';
        for await (const chunk of responseStream) {
          if (chunk.text) {
              fullText += chunk.text;
              onChunk(fullText);
          }
        }

        // Verificar se há um pedido de imagem de alta qualidade
        const imageMatch = fullText.match(/\[IMAGE_PROMPT:\s*(.*?)\]/);
        if (imageMatch) {
            const prompt = imageMatch[1];
            try {
                const imageUrl = await generateImage(prompt);
                if (imageUrl) {
                    fullText = fullText.replace(/\[IMAGE_PROMPT:.*?\]/, `\n\n![Ilustração Biológica](${imageUrl})\n\n`);
                    onChunk(fullText);
                }
            } catch (err) {
                console.error("Erro ao gerar imagem:", err);
                fullText = fullText.replace(/\[IMAGE_PROMPT:.*?\]/, "");
                onChunk(fullText);
            }
        }
      });
    } catch (error) {
      throw error;
    }
  };

export const generateImage = async (prompt: string): Promise<string | null> => {
    try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
        const ai = new GoogleGenAI({ apiKey: apiKey! });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                imageConfig: {
                    aspectRatio: "1:1"
                }
            }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (error) {
        console.error("Erro na geração de imagem:", error);
        return null;
    }
};

export const streamQuestions = async (
    topicContext: string,
    request: QuestionRequest,
    settings: TeacherSettings,
    onChunk: (text: string) => void
  ): Promise<void> => {
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      const ai = new GoogleGenAI({ apiKey: apiKey! });
      const prompt = request.type === 'PROVA' 
        ? `Gere uma PROVA COMPLETA de Biologia (nível ${settings.gradeLevel}) com 5 questões sobre ${topicContext || settings.currentChapter}. Use obrigatoriamente o delimitador ---GABARITO--- antes das explicações.`
        : `Gere uma questão ${request.type} desafiadora sobre ${topicContext}. Use o delimitador ---GABARITO--- antes da resposta comentada.`;

      await withRetry(async () => {
        const responseStream = await ai.models.generateContentStream({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { systemInstruction: getSystemInstruction(settings) }
        });

        let fullText = '';
        for await (const chunk of responseStream) {
          if (chunk.text) {
              fullText += chunk.text;
              onChunk(fullText);
          }
        }
      });
    } catch (error) {
        throw error;
    }
  };

export const generateDeepDiveContent = async (topic: string, history: Message[], settings: TeacherSettings): Promise<string> => {
    try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
        const ai = new GoogleGenAI({ apiKey: apiKey! });
        const response = await withRetry(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `[DEEP_DIVE] Explique o assunto: ${topic}. OBRIGATÓRIO: Inclua um diagrama SVG SIMPLES e limpo para ilustrar a explicação de forma rápida.`,
            config: { systemInstruction: getSystemInstruction(settings) }
        }));
        return cleanText(response);
    } catch (error) { return "Erro no protocolo de aprofundamento."; }
};

export const generateSimulationMission = async (topic: string, settings: TeacherSettings): Promise<any> => {
    try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
        const ai = new GoogleGenAI({ apiKey: apiKey! });
        const response = await withRetry(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Gere uma missão de simulação para o Bio Sandbox sobre o tema: ${topic}. 
            A missão deve ter um controle deslizante (0-100).
            Retorne um JSON com:
            {
              "title": "Título curto",
              "problem": "Descrição do problema biológico",
              "hypothesis": "Hipótese científica",
              "objective": "O que o aluno deve alcançar",
              "controlName": "Nome da variável (ex: Temperatura)",
              "unit": "Unidade (ex: °C)",
              "thresholds": {
                "low": {"value": 30, "message": "Mensagem para valores baixos", "color": "#ff0000"},
                "high": {"value": 70, "message": "Mensagem para valores altos", "color": "#ff0000"},
                "optimal": {"message": "Mensagem para valor ideal", "color": "#00ff9d"}
              }
            }`,
            config: { 
                systemInstruction: getSystemInstruction(settings),
                responseMimeType: "application/json"
            }
        }));
        return JSON.parse(response.text || "{}");
    } catch (error) { 
        console.error("Erro ao gerar missão:", error);
        return null; 
    }
};
