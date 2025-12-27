import { Question } from '../types';

// サンプル問題データ（デモ用）
// 実際のアプリでは、Webアプリの問題データをJSON形式で移植する必要があります

export const sampleQuestions: Question[] = [
  {
    id: 'takken_001',
    category: 'takkengyouhou',
    question: '宅地建物取引業法に関する次の記述のうち、正しいものはどれか。',
    choices: [
      '宅地建物取引業者は、その業務に関して取引の関係者に損害を与えたときは、故意又は過失がなくても、その損害を賠償する責任を負う。',
      '宅地建物取引業者は、その業務に関して取引の関係者に損害を与えたときは、故意があった場合に限り、その損害を賠償する責任を負う。',
      '宅地建物取引業者は、その業務に関して取引の関係者に損害を与えたときは、故意又は過失があった場合に限り、その損害を賠償する責任を負う。',
      '宅地建物取引業者は、その業務に関して取引の関係者に損害を与えたときは、過失があった場合に限り、その損害を賠償する責任を負う。',
    ],
    correctAnswer: 2,
    explanation: '宅地建物取引業者は、その業務に関して取引の関係者に損害を与えたときは、故意又は過失があった場合に限り、その損害を賠償する責任を負います（民法の一般原則）。',
    difficulty: 'medium',
    tags: ['宅建業法', '損害賠償責任'],
  },
  {
    id: 'takken_002',
    category: 'takkengyouhou',
    question: '宅地建物取引士に関する次の記述のうち、正しいものはどれか。',
    choices: [
      '宅地建物取引士は、宅地建物取引士証の有効期間が満了した後も、更新の申請をすれば、引き続き宅地建物取引士として業務を行うことができる。',
      '宅地建物取引士は、宅地建物取引士証の有効期間が満了した場合、更新の申請をしなければ、宅地建物取引士として業務を行うことができない。',
      '宅地建物取引士証の有効期間は10年である。',
      '宅地建物取引士証の有効期間は3年である。',
    ],
    correctAnswer: 1,
    explanation: '宅地建物取引士証の有効期間は5年であり、有効期間が満了した場合、更新の申請をしなければ、宅地建物取引士として業務を行うことができません。',
    difficulty: 'easy',
    tags: ['宅建業法', '宅地建物取引士証'],
  },
  {
    id: 'minpou_001',
    category: 'minpou',
    question: '民法に関する次の記述のうち、正しいものはどれか。',
    choices: [
      '契約の成立には、必ず書面による合意が必要である。',
      '契約は、当事者の合意のみで成立し、書面は必要ない。',
      '契約の成立には、公証人の立会いが必要である。',
      '契約は、必ず対価を伴わなければ成立しない。',
    ],
    correctAnswer: 1,
    explanation: '民法では、契約は当事者の合意のみで成立します（諾成契約の原則）。書面は原則として不要ですが、一定の契約では書面が要求される場合があります。',
    difficulty: 'easy',
    tags: ['民法', '契約'],
  },
  {
    id: 'hourei_001',
    category: 'hourei',
    question: '都市計画法に関する次の記述のうち、正しいものはどれか。',
    choices: [
      '市街化区域は、すでに市街地を形成している区域及びおおむね10年以内に優先的かつ計画的に市街化を図るべき区域である。',
      '市街化区域は、すでに市街地を形成している区域及びおおむね5年以内に優先的かつ計画的に市街化を図るべき区域である。',
      '市街化区域は、すでに市街地を形成している区域及びおおむね20年以内に優先的かつ計画的に市街化を図るべき区域である。',
      '市街化区域は、市街化を抑制すべき区域である。',
    ],
    correctAnswer: 0,
    explanation: '市街化区域は、すでに市街地を形成している区域及びおおむね10年以内に優先的かつ計画的に市街化を図るべき区域です。',
    difficulty: 'medium',
    tags: ['都市計画法', '市街化区域'],
  },
  {
    id: 'zeihou_001',
    category: 'zeihou',
    question: '不動産取得税に関する次の記述のうち、正しいものはどれか。',
    choices: [
      '不動産取得税は、不動産を取得した者に対して課される国税である。',
      '不動産取得税は、不動産を取得した者に対して課される地方税である。',
      '不動産取得税は、不動産を売却した者に対して課される国税である。',
      '不動産取得税は、不動産を売却した者に対して課される地方税である。',
    ],
    correctAnswer: 1,
    explanation: '不動産取得税は、不動産を取得した者に対して課される地方税（都道府県税）です。',
    difficulty: 'easy',
    tags: ['税法', '不動産取得税'],
  },
];

// カテゴリ別に問題を取得
export function getQuestionsByCategory(category: string): Question[] {
  return sampleQuestions.filter(q => q.category === category);
}

// ランダムに問題を取得
export function getRandomQuestions(count: number): Question[] {
  const shuffled = [...sampleQuestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// カテゴリ情報
export const categoryInfo = {
  takkengyouhou: {
    name: '宅建業法',
    description: '宅地建物取引業法に関する問題',
    color: '#7B5F43',
    questionCount: sampleQuestions.filter(q => q.category === 'takkengyouhou').length,
  },
  minpou: {
    name: '民法等',
    description: '民法、借地借家法等に関する問題',
    color: '#7B9FAD',
    questionCount: sampleQuestions.filter(q => q.category === 'minpou').length,
  },
  hourei: {
    name: '法令上の制限',
    description: '都市計画法、建築基準法等に関する問題',
    color: '#D4A574',
    questionCount: sampleQuestions.filter(q => q.category === 'hourei').length,
  },
  zeihou: {
    name: '税・その他',
    description: '税法、不動産鑑定評価等に関する問題',
    color: '#6B8E6F',
    questionCount: sampleQuestions.filter(q => q.category === 'zeihou').length,
  },
};
