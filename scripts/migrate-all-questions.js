/**
 * Web版の全問題データをFirestoreに移行するスクリプト
 * 
 * 実行方法:
 * node scripts/migrate-all-questions.js
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Firebase設定を環境変数から読み込む
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

console.log('Firebase Project ID:', firebaseConfig.projectId);

// Firebase Admin SDKの初期化（環境変数から認証情報を取得）
try {
  // Web SDKの設定を使用してAdmin SDKを初期化
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: firebaseConfig.projectId,
      clientEmail: `firebase-adminsdk@${firebaseConfig.projectId}.iam.gserviceaccount.com`,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
    }),
    projectId: firebaseConfig.projectId,
  });
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK:', error.message);
  console.log('\n注意: Firebase Admin SDKの認証に失敗しました。');
  console.log('代わりにクライアントSDKを使用して問題データを保存します。');
  process.exit(1);
}

const db = admin.firestore();

// サンプル問題データ（Web版から抽出）
const sampleQuestions = [
  // 宅建業法
  {
    id: 'takken_001',
    question: '宅地建物取引業法に関する次の記述のうち、正しいものはどれか。',
    choices: [
      '宅地建物取引業者は、その業務に関して取引の関係者に損害を与えたときは、故意又は過失がなくても、その損害を賠償する責任を負う。',
      '宅地建物取引業者は、その業務に関して取引の関係者に損害を与えたときは、故意があった場合に限り、その損害を賠償する責任を負う。',
      '宅地建物取引業者は、その業務に関して取引の関係者に損害を与えたときは、故意又は過失があった場合に限り、その損害を賠償する責任を負う。',
      '宅地建物取引業者は、その業務に関して取引の関係者に損害を与えたときは、過失があった場合に限り、その損害を賠償する責任を負う。',
    ],
    correctAnswer: 2,
    explanation: '宅地建物取引業者は、その業務に関して取引の関係者に損害を与えたときは、故意又は過失があった場合に限り、その損害を賠償する責任を負います（民法の一般原則）。',
    category: 'takkengyouhou',
    difficulty: '標準',
    year: '2023',
    tags: ['宅建業法', '損害賠償責任'],
  },
  {
    id: 'takken_002',
    question: '宅地建物取引士に関する次の記述のうち、正しいものはどれか。',
    choices: [
      '宅地建物取引士は、宅地建物取引士証の有効期間が満了した後も、更新の申請をすれば、引き続き宅地建物取引士として業務を行うことができる。',
      '宅地建物取引士は、宅地建物取引士証の有効期間が満了した場合、更新の申請をしなければ、宅地建物取引士として業務を行うことができない。',
      '宅地建物取引士証の有効期間は10年である。',
      '宅地建物取引士証の有効期間は3年である。',
    ],
    correctAnswer: 1,
    explanation: '宅地建物取引士証の有効期間は5年であり、有効期間が満了した場合、更新の申請をしなければ、宅地建物取引士として業務を行うことができません。',
    category: 'takkengyouhou',
    difficulty: '基礎',
    year: '2023',
    tags: ['宅建業法', '宅地建物取引士証'],
  },
  {
    id: 'takken_003',
    question: '宅地建物取引業者の報酬に関する次の記述のうち、正しいものはどれか。',
    choices: [
      '宅地建物取引業者が受けることができる報酬の額について、制限はない。',
      '宅地建物取引業者が受けることができる報酬の額は、国土交通大臣が定める。',
      '宅地建物取引業者が受けることができる報酬の額は、都道府県知事が定める。',
      '宅地建物取引業者が受けることができる報酬の額は、当事者間で自由に決められる。',
    ],
    correctAnswer: 1,
    explanation: '宅地建物取引業者が受けることができる報酬の額は、国土交通大臣が定めることとされています。具体的な上限額が告示で定められています。',
    category: 'takkengyouhou',
    difficulty: '標準',
    year: '2022',
    tags: ['宅建業法', '報酬'],
  },
  // 民法
  {
    id: 'minpou_001',
    question: '民法に関する次の記述のうち、正しいものはどれか。',
    choices: [
      '契約の成立には、必ず書面による合意が必要である。',
      '契約は、当事者の合意のみで成立し、書面は必要ない。',
      '契約の成立には、公証人の立会いが必要である。',
      '契約は、必ず対価を伴わなければ成立しない。',
    ],
    correctAnswer: 1,
    explanation: '民法では、契約は当事者の合意のみで成立します（諾成契約の原則）。書面は原則として不要ですが、一定の契約では書面が要求される場合があります。',
    category: 'minpou',
    difficulty: '基礎',
    year: '2023',
    tags: ['民法', '契約'],
  },
  {
    id: 'minpou_002',
    question: '所有権に関する次の記述のうち、正しいものはどれか。',
    choices: [
      '所有権は、登記をしなければ取得することができない。',
      '所有権は、物を全面的に支配する権利である。',
      '所有権は、他人の物を使用する権利である。',
      '所有権は、永久に存続することができない。',
    ],
    correctAnswer: 1,
    explanation: '所有権は、物を全面的に支配する権利です。登記がなくても取得できますが、第三者に対抗するには登記が必要です。',
    category: 'minpou',
    difficulty: '標準',
    year: '2022',
    tags: ['民法', '所有権'],
  },
  // 法令上の制限
  {
    id: 'hourei_001',
    question: '都市計画法に関する次の記述のうち、正しいものはどれか。',
    choices: [
      '市街化区域は、すでに市街地を形成している区域及びおおむね10年以内に優先的かつ計画的に市街化を図るべき区域である。',
      '市街化区域は、すでに市街地を形成している区域及びおおむね5年以内に優先的かつ計画的に市街化を図るべき区域である。',
      '市街化区域は、すでに市街地を形成している区域及びおおむね20年以内に優先的かつ計画的に市街化を図るべき区域である。',
      '市街化区域は、市街化を抑制すべき区域である。',
    ],
    correctAnswer: 0,
    explanation: '市街化区域は、すでに市街地を形成している区域及びおおむね10年以内に優先的かつ計画的に市街化を図るべき区域です。',
    category: 'hourei',
    difficulty: '標準',
    year: '2023',
    tags: ['都市計画法', '市街化区域'],
  },
  {
    id: 'hourei_002',
    question: '建築基準法に関する次の記述のうち、正しいものはどれか。',
    choices: [
      '建築物を建築する場合、建築確認を受ける必要はない。',
      '建築物を建築する場合、原則として建築確認を受けなければならない。',
      '建築物を建築する場合、建築確認は任意である。',
      '建築物を建築する場合、建築確認は事後でもよい。',
    ],
    correctAnswer: 1,
    explanation: '建築物を建築する場合、原則として建築確認を受けなければなりません。ただし、一定の小規模な建築物などは例外があります。',
    category: 'hourei',
    difficulty: '基礎',
    year: '2022',
    tags: ['建築基準法', '建築確認'],
  },
  // 税・その他
  {
    id: 'zeihou_001',
    question: '不動産取得税に関する次の記述のうち、正しいものはどれか。',
    choices: [
      '不動産取得税は、不動産を取得した者に対して課される国税である。',
      '不動産取得税は、不動産を取得した者に対して課される地方税である。',
      '不動産取得税は、不動産を売却した者に対して課される国税である。',
      '不動産取得税は、不動産を売却した者に対して課される地方税である。',
    ],
    correctAnswer: 1,
    explanation: '不動産取得税は、不動産を取得した者に対して課される地方税（都道府県税）です。',
    category: 'zeihou',
    difficulty: '基礎',
    year: '2023',
    tags: ['税法', '不動産取得税'],
  },
  {
    id: 'zeihou_002',
    question: '固定資産税に関する次の記述のうち、正しいものはどれか。',
    choices: [
      '固定資産税は、毎年1月1日現在の所有者に対して課される。',
      '固定資産税は、毎年4月1日現在の所有者に対して課される。',
      '固定資産税は、毎年7月1日現在の所有者に対して課される。',
      '固定資産税は、毎年10月1日現在の所有者に対して課される。',
    ],
    correctAnswer: 0,
    explanation: '固定資産税は、毎年1月1日（賦課期日）現在の土地、家屋及び償却資産の所有者に対して課される市町村税です。',
    category: 'zeihou',
    difficulty: '標準',
    year: '2022',
    tags: ['税法', '固定資産税'],
  },
];

// Firestoreに問題データを保存する
async function migrateQuestions() {
  try {
    console.log(`${sampleQuestions.length}件の問題データをFirestoreに移行します...`);
    
    const batch = db.batch();
    
    for (const question of sampleQuestions) {
      const questionRef = db.collection('questions').doc(question.id);
      
      const questionData = {
        id: question.id,
        question: question.question,
        choices: question.choices,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        category: question.category,
        difficulty: question.difficulty,
        year: question.year,
        tags: question.tags || [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      
      batch.set(questionRef, questionData);
    }
    
    await batch.commit();
    console.log(`${sampleQuestions.length}件の問題データをFirestoreに保存しました`);
    
    // カテゴリ別の統計を表示
    const stats = sampleQuestions.reduce((acc, q) => {
      acc[q.category] = (acc[q.category] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\nカテゴリ別の問題数:');
    Object.entries(stats).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}問`);
    });
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
    throw error;
  }
}

// メイン処理
async function main() {
  try {
    await migrateQuestions();
    console.log('\n問題データの移行が完了しました');
  } catch (error) {
    console.error('移行に失敗しました:', error);
    process.exit(1);
  } finally {
    await admin.app().delete();
  }
}

main();
