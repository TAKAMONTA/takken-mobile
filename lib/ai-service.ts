import { Question } from './types';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';

// Firebase Functions client
const functions = getFunctions(app);

// AI先生チャット機能
export interface AIChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export async function sendChatMessage(
  messages: AIChatMessage[],
  newMessage: string
): Promise<string> {
  try {
    const sendChatMessageFn = httpsCallable(functions, 'sendChatMessage');
    const result = await sendChatMessageFn({ messages, newMessage });
    const data = result.data as { content: string };
    return data.content;
  } catch (error) {
    console.error('AI chat error:', error);
    throw new Error('AI先生との通信に失敗しました');
  }
}

// AI問題生成機能
interface CategoryInfo {
  name: string;
  description: string;
  topics: string[];
}

const categoryDetails: Record<string, CategoryInfo> = {
  takkengyouhou: {
    name: '宅建業法',
    description: '宅地建物取引業法に関する問題',
    topics: [
      '宅建業の免許',
      '宅地建物取引士',
      '営業保証金',
      '媒介契約',
      '重要事項説明',
      '37条書面',
      '報酬',
      '業務上の規制',
    ],
  },
  minpou: {
    name: '民法等',
    description: '民法および関連法規に関する問題',
    topics: [
      '意思表示',
      '代理',
      '時効',
      '物権変動',
      '抵当権',
      '債務不履行',
      '契約',
      '相続',
    ],
  },
  hourei: {
    name: '法令上の制限',
    description: '都市計画法、建築基準法等に関する問題',
    topics: [
      '都市計画法',
      '建築基準法',
      '国土利用計画法',
      '農地法',
      '土地区画整理法',
      '宅地造成等規制法',
    ],
  },
  zei: {
    name: '税・その他',
    description: '税法、不動産鑑定評価等に関する問題',
    topics: [
      '不動産取得税',
      '固定資産税',
      '所得税',
      '印紙税',
      '登録免許税',
      '不動産鑑定評価',
      '地価公示法',
    ],
  },
};

export async function generateAIQuestion(category: string): Promise<Question> {
  const categoryInfo = categoryDetails[category];
  
  if (!categoryInfo) {
    throw new Error('Invalid category');
  }

  try {
    const generateAIQuestionFn = httpsCallable(functions, 'generateAIQuestion');
    const result = await generateAIQuestionFn({ category, categoryInfo });
    const data = result.data as { question: any; category: string };
    
    const questionData = data.question;

    // Questionオブジェクトに変換
    const question: Question = {
      id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      category: data.category,
      question: questionData.question,
      choices: questionData.choices,
      correctAnswer: questionData.correctAnswer,
      explanation: questionData.explanation,
      difficulty: questionData.difficulty || 'normal',
      year: questionData.year || 2025,
      tags: questionData.tags || [],
    };

    return question;
  } catch (error) {
    console.error('Error generating AI question:', error);
    throw new Error('AI問題の生成に失敗しました');
  }
}

// AI解説生成
export async function generateAIExplanation(
  question: string,
  choices: string[],
  correctAnswer: number,
  originalExplanation: string
): Promise<string> {
  try {
    const generateAIExplanationFn = httpsCallable(functions, 'generateAIExplanation');
    const result = await generateAIExplanationFn({
      question,
      choices,
      correctAnswer,
      originalExplanation,
    });
    const data = result.data as { explanation: string };
    return data.explanation;
  } catch (error) {
    console.error('Error generating AI explanation:', error);
    throw new Error('AI解説の生成に失敗しました');
  }
}

// AI学習アドバイス生成
export async function generateStudyAdvice(stats: {
  totalQuestions: number;
  correctRate: number;
  studyDays: number;
  categoryStats: Array<{ category: string; correctRate: number; count: number }>;
}): Promise<string> {
  try {
    const generateStudyAdviceFn = httpsCallable(functions, 'generateStudyAdvice');
    const result = await generateStudyAdviceFn({ stats });
    const data = result.data as { advice: string };
    return data.advice;
  } catch (error) {
    console.error('Error generating study advice:', error);
    throw new Error('学習アドバイスの生成に失敗しました');
  }
}

// AI弱点分析
export async function analyzeWeaknesses(incorrectQuestions: Array<{
  question: string;
  category: string;
  userAnswer: number;
  correctAnswer: number;
}>): Promise<string> {
  try {
    const analyzeWeaknessesFn = httpsCallable(functions, 'analyzeWeaknesses');
    const result = await analyzeWeaknessesFn({ incorrectQuestions });
    const data = result.data as { analysis: string };
    return data.analysis;
  } catch (error) {
    console.error('Error analyzing weaknesses:', error);
    throw new Error('弱点分析に失敗しました');
  }
}

// AI質問応答
export async function askAIQuestion(
  question: string,
  choices: string[],
  correctAnswer: number,
  explanation: string,
  userQuestion: string
): Promise<string> {
  try {
    const askAIQuestionFn = httpsCallable(functions, 'askAIQuestion');
    const result = await askAIQuestionFn({
      question,
      choices,
      correctAnswer,
      explanation,
      userQuestion,
    });
    const data = result.data as { answer: string };
    return data.answer;
  } catch (error) {
    console.error('Error asking AI question:', error);
    throw new Error('AI質問の回答に失敗しました');
  }
}

// Weak area analysis (keeping the existing interface for compatibility)
export interface WeakAreaAnalysisRequest {
  mockExamResults: Array<{
    score: number;
    totalQuestions: number;
    percentage: number;
    categoryStats: { [key: string]: { correct: number; total: number } };
  }>;
  trueFalseResults: Array<{
    totalQuestions: number;
    correctCount: number;
    accuracy: number;
  }>;
  studyStats: {
    totalQuestions: number;
    correctAnswers: number;
    categoryStats: {
      [category: string]: {
        total: number;
        correct: number;
      };
    };
  };
}

export interface WeakAreaAnalysisResult {
  weakestCategory: string;
  weakestCategoryName: string;
  weakestAccuracy: number;
  recommendations: string[];
  priorityAreas: Array<{
    category: string;
    categoryName: string;
    accuracy: number;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export async function analyzeWeakAreas(
  request: WeakAreaAnalysisRequest
): Promise<WeakAreaAnalysisResult> {
  // This function uses local analysis, not AI
  const categoryNames: Record<string, string> = {
    takkengyouhou: '宅建業法',
    minpou: '権利関係',
    hourei: '法令上の制限',
    zei: '税・その他',
  };

  const categoryAccuracies: Record<string, { total: number; correct: number }> = {};

  // Aggregate from all sources
  request.mockExamResults.forEach(result => {
    Object.entries(result.categoryStats).forEach(([category, stats]) => {
      if (!categoryAccuracies[category]) {
        categoryAccuracies[category] = { total: 0, correct: 0 };
      }
      categoryAccuracies[category].total += stats.total;
      categoryAccuracies[category].correct += stats.correct;
    });
  });

  Object.entries(request.studyStats.categoryStats).forEach(([category, stats]) => {
    if (!categoryAccuracies[category]) {
      categoryAccuracies[category] = { total: 0, correct: 0 };
    }
    categoryAccuracies[category].total += stats.total;
    categoryAccuracies[category].correct += stats.correct;
  });

  // Calculate accuracies
  const accuracies = Object.entries(categoryAccuracies).map(([category, stats]) => ({
    category,
    categoryName: categoryNames[category] || category,
    accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
    total: stats.total,
  }));

  // Sort by accuracy (ascending)
  accuracies.sort((a, b) => a.accuracy - b.accuracy);

  const weakest = accuracies[0];

  // Determine priority
  const priorityAreas = accuracies.map(area => ({
    category: area.category,
    categoryName: area.categoryName,
    accuracy: area.accuracy,
    priority: (area.accuracy < 60 ? 'high' : area.accuracy < 75 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
  }));

  // Generate recommendations
  const recommendations: string[] = [];
  
  if (weakest.accuracy < 50) {
    recommendations.push(`${weakest.categoryName}の基礎から復習することをお勧めします`);
  } else if (weakest.accuracy < 70) {
    recommendations.push(`${weakest.categoryName}の重要ポイントを重点的に学習しましょう`);
  } else {
    recommendations.push(`${weakest.categoryName}の応用問題に挑戦しましょう`);
  }

  const highPriorityAreas = priorityAreas.filter(a => a.priority === 'high');
  if (highPriorityAreas.length > 1) {
    recommendations.push('複数の分野で基礎固めが必要です。1つずつ確実に進めましょう');
  }

  return {
    weakestCategory: weakest.category,
    weakestCategoryName: weakest.categoryName,
    weakestAccuracy: weakest.accuracy,
    recommendations,
    priorityAreas,
  };
}
