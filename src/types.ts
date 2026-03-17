
export enum ResponseMode {
  MIND_MAP = 'Mapa Mental',
  CREATIVE = 'Criativo',
  LOGICAL = 'Lógico',
  LINGUISTIC = 'Linguístico',
  BNCC = 'BNCC',
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  mode?: ResponseMode;
  timestamp: number;
  isQuestion?: boolean;
  questionTopic?: string;
  questionType?: QuestionType;
  isStreaming?: boolean;
}

export interface TeacherSettings {
  isLoggedIn: boolean;
  currentChapter: string;
  keywords: string;
  gradeLevel: '6º Ano' | '7º Ano' | '8º Ano' | '9º Ano' | '1º Ano EM' | '2º Ano EM' | '3º Ano EM' | 'Amabis Martho';
  enemMode: boolean;
  bnccFocus: boolean;
  pdfContent?: string;
  pdfName?: string;
  repoUrl?: string;
}

export type QuestionType = 'ENEM' | 'Objetiva' | 'Discursiva' | 'PROVA';

export interface QuestionRequest {
  type: QuestionType;
  numQuestions?: number;
  withAnswerKey: boolean;
}
