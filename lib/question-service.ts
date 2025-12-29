import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Question } from './types';

/**
 * Fisher-Yatesアルゴリズムで配列をシャッフル
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Firestoreから指定カテゴリの問題を取得する
 */
export async function getQuestionsByCategory(category: string): Promise<Question[]> {
  try {
    const questionsRef = collection(db, 'questions');
    const q = query(
      questionsRef,
      where('category', '==', category),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const questions: Question[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      questions.push({
        id: doc.id,
        question: data.question,
        choices: data.choices,
        correctAnswer: data.correctAnswer,
        explanation: data.explanation,
        category: data.category,
        difficulty: data.difficulty,
        year: data.year,
        tags: data.tags || [],
      });
    });
    
    // Fisher-Yatesシャッフルを適用
    return shuffleArray(questions);
  } catch (error) {
    console.error('問題の取得に失敗しました:', error);
    throw error;
  }
}

/**
 * Firestoreからすべての問題を取得する
 */
export async function getAllQuestions(): Promise<Question[]> {
  try {
    const questionsRef = collection(db, 'questions');
    const q = query(questionsRef, orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const questions: Question[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      questions.push({
        id: doc.id,
        question: data.question,
        choices: data.choices,
        correctAnswer: data.correctAnswer,
        explanation: data.explanation,
        category: data.category,
        difficulty: data.difficulty,
        year: data.year,
        tags: data.tags || [],
      });
    });
    
    return questions;
  } catch (error) {
    console.error('問題の取得に失敗しました:', error);
    throw error;
  }
}

/**
 * Firestoreから指定された数の問題をランダムに取得する
 */
export async function getRandomQuestions(count: number, category?: string): Promise<Question[]> {
  try {
    const questionsRef = collection(db, 'questions');
    let q;
    
    if (category) {
      q = query(
        questionsRef,
        where('category', '==', category),
        limit(count * 2) // ランダム選択のために多めに取得
      );
    } else {
      q = query(questionsRef, limit(count * 2));
    }
    
    const querySnapshot = await getDocs(q);
    const questions: Question[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      questions.push({
        id: doc.id,
        question: data.question,
        choices: data.choices,
        correctAnswer: data.correctAnswer,
        explanation: data.explanation,
        category: data.category,
        difficulty: data.difficulty,
        year: data.year,
        tags: data.tags || [],
      });
    });
    
    // Fisher-Yatesシャッフルして指定数だけ返す
    return shuffleArray(questions).slice(0, count);
  } catch (error) {
    console.error('問題の取得に失敗しました:', error);
    throw error;
  }
}

/**
 * カテゴリごとの問題数を取得する
 */
export async function getQuestionCountByCategory(category: string): Promise<number> {
  try {
    const questionsRef = collection(db, 'questions');
    const q = query(questionsRef, where('category', '==', category));
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('問題数の取得に失敗しました:', error);
    return 0;
  }
}

/**
 * すべてのカテゴリの問題数を取得する
 */
export async function getAllQuestionCounts(): Promise<Record<string, number>> {
  try {
    const categories = ['takkengyouhou', 'minpou', 'hourei', 'zeihou'];
    const counts: Record<string, number> = {};
    
    for (const category of categories) {
      counts[category] = await getQuestionCountByCategory(category);
    }
    
    return counts;
  } catch (error) {
    console.error('問題数の取得に失敗しました:', error);
    return {};
  }
}

/**
 * カテゴリ情報
 */
// IDで問題を取得
export async function getQuestionById(questionId: string): Promise<Question | null> {
  try {
    const questionDoc = await getDoc(doc(db, 'questions', questionId));
    
    if (!questionDoc.exists()) {
      return null;
    }

    const data = questionDoc.data();
    return {
      id: questionDoc.id,
      category: data.category,
      question: data.question,
      choices: data.choices,
      correctAnswer: data.correctAnswer,
      explanation: data.explanation,
      difficulty: data.difficulty || 'normal',
      year: data.year || 2024,
      tags: data.tags || [],
    };
  } catch (error) {
    console.error('Error getting question by ID:', error);
    return null;
  }
}

export const categoryInfo: Record<string, { name: string; description: string; icon: string; count: number }> = {
  takkengyouhou: {
    name: '宅建業法',
    description: '宅建業法に関する問題',
    icon: '📚',
    count: 250,
  },
  minpou: {
    name: '民法等',
    description: '民法・借地借家法に関する問題',
    icon: '⚖️',
    count: 300,
  },
  hourei: {
    name: '法令上の制限',
    description: '都市計画法・建築基準法等',
    icon: '🏛️',
    count: 200,
  },
  zeihou: {
    name: '税・その他',
    description: '税法・不動産鑑定評価等',
    icon: '💰',
    count: 150,
  },
};
