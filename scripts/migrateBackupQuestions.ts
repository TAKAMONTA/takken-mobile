import { initializeApp } from 'firebase/app';
import { getFirestore, collection, writeBatch, doc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 移行する過去問ファイルの選定（最後の5問）
const filesToMigrate = [
  // 民法等: 5問追加
  { path: 'lib/data/questions/minpou/_backup_copyrighted/new2.ts', category: 'minpou', year: 'r7', limit: 5 },
];

async function migrateBackupQuestions() {
  console.log('🚀 過去問データの移行を開始します...\n');

  let totalMigrated = 0;

  for (const fileInfo of filesToMigrate) {
    try {
      console.log(`📄 ${fileInfo.path} を処理中...`);
      
      // 動的にファイルをインポート
      const fullPath = path.resolve(__dirname, '..', fileInfo.path);
      const module = await import(fullPath);
      
      // エクスポートされた問題データを取得
      let questions = [];
      if (module.default && Array.isArray(module.default)) {
        questions = module.default;
      } else if (module.questions && Array.isArray(module.questions)) {
        questions = module.questions;
      } else {
        // 最初の配列を探す
        for (const key of Object.keys(module)) {
          if (Array.isArray(module[key])) {
            questions = module[key];
            break;
          }
        }
      }

      if (questions.length === 0) {
        console.warn(`   ⚠️  問題データが見つかりません`);
        continue;
      }

      // 指定された数だけ取得
      const selectedQuestions = questions.slice(0, fileInfo.limit);
      console.log(`   ✅ ${selectedQuestions.length}問を選択しました`);

      // Firestoreに保存
      let batch = writeBatch(db);
      let batchCount = 0;

      for (const q of selectedQuestions) {
        const questionRef = doc(collection(db, 'questions'));
        
        // データ構造を変換
        const questionData = {
          question: q.question,
          choices: q.options || q.choices, // optionsをchoicesに変換
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          category: fileInfo.category,
          difficulty: q.difficulty || '標準',
          year: fileInfo.year,
          topic: q.topic || 'その他',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        batch.set(questionRef, questionData);
        batchCount++;

        if (batchCount >= 500) {
          await batch.commit();
          batch = writeBatch(db);
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }

      totalMigrated += selectedQuestions.length;
      console.log(`   💾 Firestoreに保存完了\n`);

    } catch (error: any) {
      console.error(`   ❌ エラー: ${error.message}\n`);
    }
  }

  console.log(`\n🎉 移行完了！`);
  console.log(`   合計: ${totalMigrated}問を移行しました`);
  
  process.exit(0);
}

migrateBackupQuestions().catch((error) => {
  console.error('❌ エラー:', error);
  process.exit(1);
});
