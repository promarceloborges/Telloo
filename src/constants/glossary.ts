
export interface GlossaryTerm {
  term: string;
  definition: string;
  category: 'Citologia' | 'Genética' | 'Ecologia' | 'Fisiologia' | 'Evolução' | 'Geral';
}

export const BIO_GLOSSARY: GlossaryTerm[] = [
  {
    term: 'Homeostase',
    definition: 'Estado de equilíbrio dinâmico mantido pelo organismo através de processos autorreguladores.',
    category: 'Fisiologia'
  },
  {
    term: 'Mitocôndria',
    definition: 'Organela responsável pela respiração celular e produção de ATP (energia).',
    category: 'Citologia'
  },
  {
    term: 'Ribossomo',
    definition: 'Estrutura celular responsável pela síntese de proteínas.',
    category: 'Citologia'
  },
  {
    term: 'DNA',
    definition: 'Ácido desoxirribonucleico, molécula que carrega as informações genéticas dos seres vivos.',
    category: 'Genética'
  },
  {
    term: 'RNA',
    definition: 'Ácido ribonucleico, molécula envolvida na síntese de proteínas e transmissão de informação genética.',
    category: 'Genética'
  },
  {
    term: 'Mitose',
    definition: 'Processo de divisão celular que resulta em duas células-filhas geneticamente idênticas à célula-mãe.',
    category: 'Citologia'
  },
  {
    term: 'Meiose',
    definition: 'Divisão celular que reduz o número de cromossomos pela metade, formando gametas.',
    category: 'Genética'
  },
  {
    term: 'ATP',
    definition: 'Trifosfato de Adenosina, a principal moeda energética das células.',
    category: 'Geral'
  },
  {
    term: 'Enzima',
    definition: 'Proteína que atua como catalisador biológico, acelerando reações químicas.',
    category: 'Geral'
  },
  {
    term: 'Simbiose',
    definition: 'Relação próxima e duradoura entre dois organismos de espécies diferentes.',
    category: 'Ecologia'
  },
  {
    term: 'Fenótipo',
    definition: 'Características observáveis de um organismo, resultantes da interação do genótipo com o meio.',
    category: 'Genética'
  },
  {
    term: 'Genótipo',
    definition: 'Conjunto da informação genética de um indivíduo.',
    category: 'Genética'
  },
  {
    term: 'Eucarionte',
    definition: 'Célula que possui núcleo delimitado por membrana e organelas membranosas.',
    category: 'Citologia'
  },
  {
    term: 'Procarionte',
    definition: 'Célula simples que não possui núcleo delimitado por membrana (ex: bactérias).',
    category: 'Citologia'
  },
  {
    term: 'Fotossíntese',
    definition: 'Processo pelo qual plantas e outros organismos convertem energia luminosa em energia química.',
    category: 'Fisiologia'
  },
  {
    term: 'Nicho Ecológico',
    definition: 'O "papel" ou função de uma espécie em seu ecossistema, incluindo seu habitat e hábitos.',
    category: 'Ecologia'
  },
  {
    term: 'Seleção Natural',
    definition: 'Processo evolutivo onde indivíduos com características favoráveis têm mais chances de sobreviver e se reproduzir.',
    category: 'Evolução'
  },
  {
    term: 'Mutação',
    definition: 'Alteração na sequência de nucleotídeos do DNA de um organismo.',
    category: 'Genética'
  },
  {
    term: 'Osmose',
    definition: 'Movimento de água através de uma membrana semipermeável do meio menos concentrado para o mais concentrado.',
    category: 'Citologia'
  },
  {
    term: 'Cloroplasto',
    definition: 'Organela presente em células vegetais onde ocorre a fotossíntese.',
    category: 'Citologia'
  }
];
