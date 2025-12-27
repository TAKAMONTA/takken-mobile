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
  difficultyRatio: { basic: number; standard: number; advanced: number };
}

// 目標500問に到達するための追加生成計画
// 現在: 470問 → 目標: 500問（+30問）
const configs: QuestionGenerationConfig[] = [
  {
    category: '宅建業法',
    categoryKey: 'takkengyouhou',
    count: 15, // 185問 → 200問
    topics: [
      '媒介契約',
      '重要事項説明',
      '報酬制限',
    ],
    difficulty: '標準',
    difficultyRatio: { basic: 0.3, standard: 0.5, advanced: 0.2 },
  },
  {
    category: '民法等',
    categoryKey: 'minpou',
    count: 10, // 140問 → 150問
    topics: [
      '代理',
      '時効',
      '物権変動',
      '抵当権',
      '債務不履行・解除',
    ],
    difficulty: '標準',
    difficultyRatio: { basic: 0.3, standard: 0.5, advanced: 0.2 },
  },
  {
    category: '法令上の制限',
    categoryKey: 'hourei',
    count: 5, // 75問 → 80問
    topics: [
      '宅地造成等規制法',
      '国土利用計画法',
    ],
    difficulty: '標準',
    difficultyRatio: { basic: 0.3, standard: 0.5, advanced: 0.2 },
  },
];

// 難易度別の定義
const difficultyDefinitions = {
  基礎: `
【基礎レベルの定義】
- 法令の基本的な定義や用語を問う問題
- 単純な知識の確認問題
- 初学者でも理解できる内容
- 過去問の頻出基本問題レベル
`,
  標準: `
【標準レベルの定義】
- 本試験レベルの実践的な問題
- 複数の知識を組み合わせて解く問題
- 具体的な事例に法令を適用する問題
- 過去問の標準的な難易度
`,
  応用: `
【応用レベルの定義】
- 複雑な事例を扱う問題
- 複数の法令や条文を横断的に理解する必要がある問題
- 実務での判断力を問う問題
- 過去問の難問レベル
`,
};

async function generateQuestionsWithDifficulty(
  config: QuestionGenerationConfig,
  difficulty: '基礎' | '標準' | '応用',
  count: number
): Promise<any[]> {
  console.log(`   ${difficulty}問題を${count}問生成中...`);

  const prompt = `あなたは宅地建物取引士試験の問題作成の専門家です。

以下の条件で、${config.category}の4択問題を${count}問作成してください：

【カテゴリ】${config.category}
【テーマ】${config.topics.join('、')}
【難易度】${difficulty}

${difficultyDefinitions[difficulty]}

【出力形式】
必ずJSON配列形式で出力してください。各問題は以下の形式：
[
  {
    "question": "問題文（80文字以上、具体的な事例を含む）",
    "choices": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
    "correctAnswer": 0,
    "explanation": "解説文（100文字以上、以下を必ず含める）\\n\\n【各選択肢の解説】\\n1. 選択肢1の正誤理由\\n2. 選択肢2の正誤理由\\n3. 選択肢3の正誤理由\\n4. 選択肢4の正誤理由\\n\\n【関連法令】該当する法令名と条文番号\\n\\n【実務上の注意点】実務での重要ポイント",
    "topic": "テーマ名"
  }
]

【重要な要件】
1. 問題文は最低80文字以上、具体的な事例を含める
2. 選択肢は紛らわしく、思考力を問うものにする
3. 解説は最低100文字以上、以下を必ず含める：
   - 各選択肢の正誤理由（4つすべて）
   - 関連する法令名と条文番号
   - 実務での注意点や補足情報
4. 正解の選択肢番号は0-3の範囲で指定
5. 最新の法令に基づいた内容にする
6. 過去問と類似しないオリジナルの問題を作成する
7. ${difficulty}レベルの難易度を厳守する`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: 'あなたは宅地建物取引士試験の問題作成の専門家です。高品質で詳細な解説付きの4択問題を作成します。',
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
      return [];
    }

    let parsedData;
    try {
      parsedData = JSON.parse(content);
    } catch (parseError) {
      console.error('   ❌ JSON解析エラー:', parseError);
      return [];
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
      return [];
    }

    const validQuestions = [];

    // 品質チェック
    for (const q of batchQuestions) {
      if (!q.question || !q.choices || !Array.isArray(q.choices) || q.correctAnswer === undefined) {
        console.warn('   ⚠️  不完全な問題データをスキップ:', q);
        continue;
      }

      // 問題文の長さチェック
      if (q.question.length < 80) {
        console.warn(`   ⚠️  問題文が短すぎます（${q.question.length}文字）: ${q.question.substring(0, 30)}...`);
        continue;
      }

      // 解説の長さチェック
      if (q.explanation.length < 100) {
        console.warn(`   ⚠️  解説が短すぎます（${q.explanation.length}文字）`);
        continue;
      }

      validQuestions.push({
        question: q.question,
        choices: q.choices,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        category: config.categoryKey,
        difficulty: difficulty,
        year: '2025',
        topic: q.topic || config.topics[0],
      });
    }

    console.log(`   ✅ ${validQuestions.length}問を生成しました（品質チェック通過）`);
    return validQuestions;
  } catch (error: any) {
    console.error(`   ❌ エラー:`, error.message);
    return [];
  }
}

async function generateQuestions(config: QuestionGenerationConfig): Promise<any[]> {
  console.log(`\n📚 ${config.category}の問題を生成中... (目標: ${config.count}問)`);

  const questions: any[] = [];

  // 難易度別に生成
  const basicCount = Math.round(config.count * config.difficultyRatio.basic);
  const standardCount = Math.round(config.count * config.difficultyRatio.standard);
  const advancedCount = config.count - basicCount - standardCount;

  console.log(`   難易度配分: 基礎${basicCount}問、標準${standardCount}問、応用${advancedCount}問`);

  // 基礎問題
  if (basicCount > 0) {
    const basicQuestions = await generateQuestionsWithDifficulty(config, '基礎', basicCount);
    questions.push(...basicQuestions);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // 標準問題
  if (standardCount > 0) {
    const standardQuestions = await generateQuestionsWithDifficulty(config, '標準', standardCount);
    questions.push(...standardQuestions);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // 応用問題
  if (advancedCount > 0) {
    const advancedQuestions = await generateQuestionsWithDifficulty(config, '応用', advancedCount);
    questions.push(...advancedQuestions);
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
  console.log('🚀 改善版AI問題生成を開始します...\n');
  console.log('📋 改善ポイント:');
  console.log('   1. 難易度を3段階に分けて生成（基礎30%、標準50%、応用20%）');
  console.log('   2. 問題文の最低文字数: 80文字');
  console.log('   3. 解説の最低文字数: 100文字');
  console.log('   4. 各選択肢の正誤理由を必須化');
  console.log('   5. 関連法令・条文の引用を必須化\n');

  const allQuestions: any[] = [];

  for (const config of configs) {
    const questions = await generateQuestions(config);
    allQuestions.push(...questions);
  }

  console.log(`\n📊 生成結果:`);
  console.log(`   合計: ${allQuestions.length}問`);

  // 難易度別の集計
  const difficultyCount = {
    基礎: allQuestions.filter(q => q.difficulty === '基礎').length,
    標準: allQuestions.filter(q => q.difficulty === '標準').length,
    応用: allQuestions.filter(q => q.difficulty === '応用').length,
  };

  console.log(`   難易度別: 基礎${difficultyCount.基礎}問、標準${difficultyCount.標準}問、応用${difficultyCount.応用}問`);

  // Firestoreに保存
  await saveQuestionsToFirestore(allQuestions);

  console.log('\n✅ すべての処理が完了しました！');
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ エラー:', error);
  process.exit(1);
});
