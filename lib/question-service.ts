import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import { Question } from './types';

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
        id: data.id,
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
        id: data.id,
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
        id: data.id,
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
    
    // ランダムにシャッフルして指定数だけ返す
    const shuffled = questions.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  } catch (error) {
    console.error('問題の取得に失敗しました:', error);
    throw error;
  }
}

/**
 * カテゴリ情報
 */
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
