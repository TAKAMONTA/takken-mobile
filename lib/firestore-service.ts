import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  increment,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';

// ユーザープロフィール
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  isPremium: boolean;
  createdAt: Date;
  lastLoginAt: Date;
}

// 学習記録
export interface StudySession {
  id: string;
  uid: string;
  category: string;
  questionId: string;
  userAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  timeSpent: number; // 秒
  timestamp: Date;
}

// 学習統計
export interface StudyStats {
  uid: string;
  totalQuestions: number;
  correctAnswers: number;
  totalStudyTime: number; // 秒
  studyDays: number;
  currentStreak: number;
  lastStudyDate: Date;
  categoryStats: {
    [category: string]: {
      total: number;
      correct: number;
    };
  };
}

// ユーザープロフィールの作成/更新
export async function createOrUpdateUserProfile(
  uid: string,
  email: string
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    // 新規ユーザー
    await setDoc(userRef, {
      uid,
      email,
      isPremium: false,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });

    // 統計データの初期化
    await setDoc(doc(db, 'stats', uid), {
      uid,
      totalQuestions: 0,
      correctAnswers: 0,
      totalStudyTime: 0,
      studyDays: 0,
      currentStreak: 0,
      lastStudyDate: null,
      categoryStats: {},
    });
  } else {
    // 既存ユーザー
    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp(),
    });
  }
}

// ユーザープロフィールの取得
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    return null;
  }

  const data = userDoc.data();
  return {
    uid: data.uid,
    email: data.email,
    displayName: data.displayName,
    isPremium: data.isPremium || false,
    createdAt: data.createdAt?.toDate() || new Date(),
    lastLoginAt: data.lastLoginAt?.toDate() || new Date(),
  };
}

// 学習記録の保存
export async function saveStudySession(session: Omit<StudySession, 'id'>): Promise<void> {
  const sessionsRef = collection(db, 'studySessions');
  const sessionDoc = doc(sessionsRef);

  await setDoc(sessionDoc, {
    ...session,
    timestamp: serverTimestamp(),
  });

  // 統計の更新
  await updateStudyStats(session);
}

// 学習統計の更新
async function updateStudyStats(session: Omit<StudySession, 'id'>): Promise<void> {
  const statsRef = doc(db, 'stats', session.uid);
  const statsDoc = await getDoc(statsRef);

  if (!statsDoc.exists()) {
    // 統計データが存在しない場合は初期化
    await setDoc(statsRef, {
      uid: session.uid,
      totalQuestions: 1,
      correctAnswers: session.isCorrect ? 1 : 0,
      totalStudyTime: session.timeSpent,
      studyDays: 1,
      currentStreak: 1,
      lastStudyDate: serverTimestamp(),
      categoryStats: {
        [session.category]: {
          total: 1,
          correct: session.isCorrect ? 1 : 0,
        },
      },
    });
    return;
  }

  const stats = statsDoc.data();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastStudyDate = stats.lastStudyDate?.toDate();
  let newStreak = stats.currentStreak || 0;
  let newStudyDays = stats.studyDays || 0;

  if (lastStudyDate) {
    const lastStudyDay = new Date(lastStudyDate);
    lastStudyDay.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((today.getTime() - lastStudyDay.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
      // 今日既に学習済み
      newStreak = stats.currentStreak;
      newStudyDays = stats.studyDays;
    } else if (daysDiff === 1) {
      // 連続学習
      newStreak = stats.currentStreak + 1;
      newStudyDays = stats.studyDays + 1;
    } else {
      // ストリーク途切れ
      newStreak = 1;
      newStudyDays = stats.studyDays + 1;
    }
  } else {
    newStreak = 1;
    newStudyDays = 1;
  }

  // カテゴリ別統計の更新
  const categoryStats = stats.categoryStats || {};
  const currentCategoryStats = categoryStats[session.category] || { total: 0, correct: 0 };

  await updateDoc(statsRef, {
    totalQuestions: increment(1),
    correctAnswers: increment(session.isCorrect ? 1 : 0),
    totalStudyTime: increment(session.timeSpent),
    studyDays: newStudyDays,
    currentStreak: newStreak,
    lastStudyDate: serverTimestamp(),
    [`categoryStats.${session.category}`]: {
      total: currentCategoryStats.total + 1,
      correct: currentCategoryStats.correct + (session.isCorrect ? 1 : 0),
    },
  });
}

// 学習統計の取得
export async function getStudyStats(uid: string): Promise<StudyStats | null> {
  const statsRef = doc(db, 'stats', uid);
  const statsDoc = await getDoc(statsRef);

  if (!statsDoc.exists()) {
    return null;
  }

  const data = statsDoc.data();
  return {
    uid: data.uid,
    totalQuestions: data.totalQuestions || 0,
    correctAnswers: data.correctAnswers || 0,
    totalStudyTime: data.totalStudyTime || 0,
    studyDays: data.studyDays || 0,
    currentStreak: data.currentStreak || 0,
    lastStudyDate: data.lastStudyDate?.toDate() || new Date(),
    categoryStats: data.categoryStats || {},
  };
}

// 最近の学習記録の取得
export async function getRecentStudySessions(
  uid: string,
  limitCount: number = 10
): Promise<StudySession[]> {
  const sessionsRef = collection(db, 'studySessions');
  const q = query(
    sessionsRef,
    where('uid', '==', uid),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp?.toDate() || new Date(),
  } as StudySession));
}

// プレミアムプランの更新
export async function updatePremiumStatus(uid: string, isPremium: boolean): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    isPremium,
  });
}
