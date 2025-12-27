/**
 * 全問題データをFirestoreに移行するスクリプト
 * Web版の問題データをモバイル版のFirestoreに一括移行
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, writeBatch, doc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 環境変数を読み込み
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Firebase設定
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Firebaseを初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 問題データをインポート
import { takkengyouhouQuestions } from '../lib/data/questions/takkengyouhou/index';
import { minpouQuestions } from '../lib/data/questions/minpou/index';
import { houreiQuestions } from '../lib/data/questions/hourei/index';
import { zeihouQuestions } from '../lib/data/questions/zeihou/index';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: string;
  difficulty?: string;
  year?: string;
  topic?: string;
  frequency?: string;
}

async function migrateQuestions() {
  console.log('🚀 問題データの移行を開始します...\n');

  // カテゴリごとの問題データ
  const categories = [
    { name: '宅建業法', key: 'takkengyouhou', questions: takkengyouhouQuestions },
    { name: '民法等', key: 'minpou', questions: minpouQuestions },
    { name: '法令上の制限', key: 'hourei', questions: houreiQuestions },
    { name: '税・その他', key: 'zeihou', questions: zeihouQuestions },
  ];

  let totalMigrated = 0;

  for (const category of categories) {
    console.log(`\n📚 ${category.name}の移行を開始...`);
    console.log(`   問題数: ${category.questions.length}問`);

    if (category.questions.length === 0) {
      console.log(`   ⚠️ ${category.name}の問題データが見つかりません`);
      continue;
    }

    // Firestoreのバッチ処理（最大500件まで）
    let batch = writeBatch(db);
    let batchCount = 0;
    let questionCount = 0;

    for (const question of category.questions) {
      // 問題データをFirestoreに追加
      const questionRef = doc(collection(db, 'questions'));
      const questionData: any = {
        ...question,
        category: category.key,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // optionsをchoicesに変換（互換性のため）
      if (questionData.options && !questionData.choices) {
        questionData.choices = questionData.options;
        delete questionData.options;
      }
      
      batch.set(questionRef, questionData);

      batchCount++;
      questionCount++;

      // 500件ごとにコミット
      if (batchCount === 500) {
        await batch.commit();
        console.log(`   ✅ ${questionCount}問を移行しました`);
        batch = writeBatch(db);
        batchCount = 0;
      }
    }

    // 残りのデータをコミット
    if (batchCount > 0) {
      await batch.commit();
      console.log(`   ✅ ${questionCount}問を移行しました`);
    }

    totalMigrated += questionCount;
    console.log(`   🎉 ${category.name}の移行が完了しました`);
  }

  console.log(`\n✨ すべての問題データの移行が完了しました！`);
  console.log(`   合計: ${totalMigrated}問\n`);
}

// スクリプト実行
migrateQuestions()
  .then(() => {
    console.log('✅ 移行処理が正常に完了しました');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  });
