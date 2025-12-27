import { initializeApp } from 'firebase/app';
import { getFirestore, collection, writeBatch, doc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';
import OpenAI from 'openai';

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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface QuestionGenerationConfig {
  category: string;
  categoryKey: string;
  count: number;
  topics: string[];
  difficulty: '基礎' | '標準' | '応用';
}

const configs: QuestionGenerationConfig[] = [
  {
    category: '宅建業法',
    categoryKey: 'takkengyouhou',
    count: 75,
    topics: [
      '免許制度',
      '宅地建物取引士',
      '営業保証金・保証協会',
      '広告規制',
      '媒介契約',
      '重要事項説明',
      '37条書面',
      '報酬制限',
      '自ら売主制限（8種制限）',
      '業務規制',
      '監督・罰則',
    ],
    difficulty: '標準',
  },
  {
    category: '民法等',
    categoryKey: 'minpou',
    count: 50,
    topics: [
      '制限行為能力者',
      '意思表示',
      '代理',
      '時効',
      '物権変動',
      '共有',
      '抵当権',
      '債務不履行・解除',
      '相続',
      '借地借家法',
      '区分所有法',
    ],
    difficulty: '標準',
  },
  {
    category: '法令上の制限',
    categoryKey: 'hourei',
    count: 25,
    topics: [
      '都市計画法',
      '建築基準法',
      '農地法',
      '土地区画整理法',
      '宅地造成等規制法',
      '国土利用計画法',
    ],
    difficulty: '標準',
  },
  {
    category: '税・その他',
    categoryKey: 'zeihou',
    count: 25,
    topics: [
      '不動産取得税',
      '固定資産税',
      '登録免許税',
      '印紙税',
      '所得税',
      '不動産鑑定評価',
      '地価公示法',
      '宅地建物の統計',
    ],
    difficulty: '標準',
  },
];

async function generateQuestions(config: QuestionGenerationConfig): Promise<any[]> {
  console.log(`\n📚 ${config.category}の問題を生成中... (目標: ${config.count}問)`);
  
  const questions: any[] = [];
  const batchSize = 10; // 一度に生成する問題数
  const batches = Math.ceil(config.count / batchSize);
  
  for (let i = 0; i < batches; i++) {
    const currentBatchSize = Math.min(batchSize, config.count - questions.length);
    const topicSubset = config.topics.slice(
      (i * config.topics.length) / batches,
      ((i + 1) * config.topics.length) / batches
    );
    
    console.log(`   バッチ ${i + 1}/${batches}: ${topicSubset.join(', ')} (${currentBatchSize}問)`);
    
    try {
      const prompt = `あなたは宅地建物取引士試験の問題作成の専門家です。

以下の条件で、${config.category}の4択問題を${currentBatchSize}問作成してください：

【カテゴリ】${config.category}
【テーマ】${topicSubset.join('、')}
【難易度】${config.difficulty}
【形式】4択問題（選択肢は4つ）

【出力形式】
必ずJSON配列形式で出力してください。各問題は以下の形式：
[
  {
    "question": "問題文",
    "choices": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
    "correctAnswer": 0,
    "explanation": "解説文",
    "topic": "テーマ名"
  }
]

【注意事項】
1. 問題文は明確で、実務に即した内容にする
2. 選択肢は紛らわしく、思考力を問うものにする
3. 正解の選択肢番号は0-3の範囲で指定
4. 解説は簡潔で分かりやすく
5. 最新の法令に基づいた内容にする
6. 過去問と類似しないオリジナルの問題を作成する`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: 'あなたは宅地建物取引士試験の問題作成の専門家です。高品質な4択問題を作成します。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0].message.content;
      if (!content) {
        console.error('   ❌ AIからの応答が空です');
        continue;
      }

      let parsedData;
      try {
        parsedData = JSON.parse(content);
      } catch (parseError) {
        console.error('   ❌ JSON解析エラー:', parseError);
        console.error('   応答内容:', content.substring(0, 200));
        continue;
      }

      // レスポンスの構造を柔軟に処理
      let batchQuestions = [];
      if (Array.isArray(parsedData)) {
        batchQuestions = parsedData;
      } else if (parsedData.questions && Array.isArray(parsedData.questions)) {
        batchQuestions = parsedData.questions;
      } else if (parsedData.data && Array.isArray(parsedData.data)) {
        batchQuestions = parsedData.data;
      } else {
        console.error('   ❌ 予期しないレスポンス構造:', Object.keys(parsedData));
        continue;
      }

      // 問題データの検証と変換
      for (const q of batchQuestions) {
        if (!q.question || !q.choices || !Array.isArray(q.choices) || q.correctAnswer === undefined) {
          console.warn('   ⚠️  不完全な問題データをスキップ:', q);
          continue;
        }

        questions.push({
          question: q.question,
          choices: q.choices,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || '',
          category: config.categoryKey,
          difficulty: config.difficulty,
          year: '2025',
          topic: q.topic || topicSubset[0],
        });
      }

      console.log(`   ✅ ${batchQuestions.length}問を生成しました（累計: ${questions.length}問）`);

      // API制限を考慮して待機
      if (i < batches - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error: any) {
      console.error(`   ❌ エラー:`, error.message);
      // エラーが発生しても続行
      continue;
    }
  }

  console.log(`   🎉 ${config.category}の生成完了: ${questions.length}問`);
  return questions;
}

async function saveQuestionsToFirestore(questions: any[]) {
  console.log(`\n💾 Firestoreに${questions.length}問を保存中...`);

  let batch = writeBatch(db);
  let batchCount = 0;

  for (const question of questions) {
    const questionRef = doc(collection(db, 'questions'));
    batch.set(questionRef, {
      ...question,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    batchCount++;

    if (batchCount >= 500) {
      await batch.commit();
      console.log(`   ✅ ${batchCount}問を保存しました`);
      batch = writeBatch(db);
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
    console.log(`   ✅ ${batchCount}問を保存しました`);
  }

  console.log(`   🎉 Firestoreへの保存が完了しました`);
}

async function main() {
  console.log('🚀 AI問題生成を開始します...\n');

  const allQuestions: any[] = [];

  for (const config of configs) {
    const questions = await generateQuestions(config);
    allQuestions.push(...questions);
  }

  console.log(`\n📊 生成結果:`);
  console.log(`   合計: ${allQuestions.length}問`);

  // Firestoreに保存
  await saveQuestionsToFirestore(allQuestions);

  console.log('\n✅ すべての処理が完了しました！');
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ エラー:', error);
  process.exit(1);
});
