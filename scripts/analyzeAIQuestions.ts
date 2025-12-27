import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

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

interface Question {
  id: string;
  question: string;
  choices: string[];
  correctAnswer: number;
  explanation: string;
  category: string;
  difficulty: string;
  year: string;
  topic?: string;
  createdAt: any;
}

async function analyzeQuestions() {
  console.log('📊 AI生成問題の分析を開始します...\n');

  // 2025年の問題（AI生成問題）を取得
  const questionsRef = collection(db, 'questions');
  const q = query(
    questionsRef,
    where('year', '==', '2025')
  );

  const querySnapshot = await getDocs(q);
  const questions: Question[] = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    questions.push({
      id: doc.id,
      ...data,
    } as Question);
  });

  console.log(`✅ ${questions.length}問のAI生成問題を取得しました\n`);

  // カテゴリ別の分析
  const categoryStats: Record<string, any> = {};
  const categories = ['takkengyouhou', 'minpou', 'hourei', 'zeihou'];
  const categoryNames: Record<string, string> = {
    takkengyouhou: '宅建業法',
    minpou: '民法等',
    hourei: '法令上の制限',
    zeihou: '税・その他',
  };

  for (const category of categories) {
    const categoryQuestions = questions.filter(q => q.category === category);
    
    // 難易度別の集計
    const difficultyCount = {
      基礎: categoryQuestions.filter(q => q.difficulty === '基礎').length,
      標準: categoryQuestions.filter(q => q.difficulty === '標準').length,
      応用: categoryQuestions.filter(q => q.difficulty === '応用').length,
    };

    // トピック別の集計
    const topicCount: Record<string, number> = {};
    categoryQuestions.forEach(q => {
      if (q.topic) {
        topicCount[q.topic] = (topicCount[q.topic] || 0) + 1;
      }
    });

    // 問題文の長さ分析
    const questionLengths = categoryQuestions.map(q => q.question.length);
    const avgQuestionLength = questionLengths.reduce((a, b) => a + b, 0) / questionLengths.length;

    // 選択肢の長さ分析
    const choiceLengths = categoryQuestions.flatMap(q => q.choices.map(c => c.length));
    const avgChoiceLength = choiceLengths.reduce((a, b) => a + b, 0) / choiceLengths.length;

    // 解説の長さ分析
    const explanationLengths = categoryQuestions.map(q => q.explanation.length);
    const avgExplanationLength = explanationLengths.reduce((a, b) => a + b, 0) / explanationLengths.length;

    categoryStats[category] = {
      name: categoryNames[category],
      total: categoryQuestions.length,
      difficulty: difficultyCount,
      topics: topicCount,
      avgQuestionLength: Math.round(avgQuestionLength),
      avgChoiceLength: Math.round(avgChoiceLength),
      avgExplanationLength: Math.round(avgExplanationLength),
      questions: categoryQuestions.slice(0, 3), // サンプル問題
    };
  }

  // 分析結果を出力
  console.log('=' .repeat(80));
  console.log('📊 AI生成問題の分析結果');
  console.log('='.repeat(80));
  console.log();

  for (const category of categories) {
    const stats = categoryStats[category];
    console.log(`\n【${stats.name}】`);
    console.log(`  問題数: ${stats.total}問`);
    console.log(`  難易度分布:`);
    console.log(`    基礎: ${stats.difficulty.基礎}問 (${Math.round(stats.difficulty.基礎 / stats.total * 100)}%)`);
    console.log(`    標準: ${stats.difficulty.標準}問 (${Math.round(stats.difficulty.標準 / stats.total * 100)}%)`);
    console.log(`    応用: ${stats.difficulty.応用}問 (${Math.round(stats.difficulty.応用 / stats.total * 100)}%)`);
    console.log(`  トピック分布:`);
    Object.entries(stats.topics)
      .sort((a: any, b: any) => b[1] - a[1])
      .forEach(([topic, count]) => {
        console.log(`    ${topic}: ${count}問`);
      });
    console.log(`  平均文字数:`);
    console.log(`    問題文: ${stats.avgQuestionLength}文字`);
    console.log(`    選択肢: ${stats.avgChoiceLength}文字`);
    console.log(`    解説: ${stats.avgExplanationLength}文字`);
  }

  // Markdown形式のレポートを生成
  let report = `# AI生成問題の分析レポート\n\n`;
  report += `生成日時: ${new Date().toLocaleString('ja-JP')}\n\n`;
  report += `## 📊 全体サマリー\n\n`;
  report += `- **合計問題数**: ${questions.length}問\n`;
  report += `- **カテゴリ別内訳**:\n`;
  
  for (const category of categories) {
    const stats = categoryStats[category];
    report += `  - ${stats.name}: ${stats.total}問\n`;
  }

  report += `\n---\n\n`;

  for (const category of categories) {
    const stats = categoryStats[category];
    report += `## ${stats.name}\n\n`;
    report += `### 基本統計\n\n`;
    report += `| 項目 | 値 |\n`;
    report += `|------|----|\n`;
    report += `| 問題数 | ${stats.total}問 |\n`;
    report += `| 基礎問題 | ${stats.difficulty.基礎}問 (${Math.round(stats.difficulty.基礎 / stats.total * 100)}%) |\n`;
    report += `| 標準問題 | ${stats.difficulty.標準}問 (${Math.round(stats.difficulty.標準 / stats.total * 100)}%) |\n`;
    report += `| 応用問題 | ${stats.difficulty.応用}問 (${Math.round(stats.difficulty.応用 / stats.total * 100)}%) |\n`;
    report += `| 平均問題文長 | ${stats.avgQuestionLength}文字 |\n`;
    report += `| 平均選択肢長 | ${stats.avgChoiceLength}文字 |\n`;
    report += `| 平均解説長 | ${stats.avgExplanationLength}文字 |\n\n`;

    report += `### トピック分布\n\n`;
    report += `| トピック | 問題数 |\n`;
    report += `|---------|-------|\n`;
    Object.entries(stats.topics)
      .sort((a: any, b: any) => b[1] - a[1])
      .forEach(([topic, count]) => {
        report += `| ${topic} | ${count}問 |\n`;
      });

    report += `\n### サンプル問題\n\n`;
    stats.questions.slice(0, 2).forEach((q: Question, index: number) => {
      report += `#### 問題${index + 1}\n\n`;
      report += `**問題文**: ${q.question}\n\n`;
      report += `**選択肢**:\n`;
      q.choices.forEach((choice, i) => {
        const marker = i === q.correctAnswer ? '✅' : '　';
        report += `${marker} ${i + 1}. ${choice}\n`;
      });
      report += `\n**解説**: ${q.explanation}\n\n`;
      report += `**難易度**: ${q.difficulty} | **トピック**: ${q.topic || 'なし'}\n\n`;
      report += `---\n\n`;
    });
  }

  // 改善提案
  report += `## 🎯 今後の改善提案\n\n`;
  report += `### 1. 難易度バランスの調整\n\n`;
  report += `現在、すべての問題が「標準」難易度に設定されています。\n\n`;
  report += `**推奨配分**:\n`;
  report += `- 基礎: 30% (初学者向け、基本概念の確認)\n`;
  report += `- 標準: 50% (本試験レベル、実践的な問題)\n`;
  report += `- 応用: 20% (難関問題、複合的な知識を要する)\n\n`;

  report += `### 2. トピックの均等化\n\n`;
  for (const category of categories) {
    const stats = categoryStats[category];
    const topics = Object.entries(stats.topics);
    if (topics.length > 0) {
      const maxCount = Math.max(...topics.map((t: any) => t[1]));
      const minCount = Math.min(...topics.map((t: any) => t[1]));
      if (maxCount > minCount * 2) {
        report += `- **${stats.name}**: トピック間の問題数に偏りがあります（最大${maxCount}問、最小${minCount}問）\n`;
      }
    }
  }

  report += `\n### 3. 問題文の長さ調整\n\n`;
  for (const category of categories) {
    const stats = categoryStats[category];
    if (stats.avgQuestionLength < 50) {
      report += `- **${stats.name}**: 問題文が短すぎる可能性があります（平均${stats.avgQuestionLength}文字）\n`;
    } else if (stats.avgQuestionLength > 150) {
      report += `- **${stats.name}**: 問題文が長すぎる可能性があります（平均${stats.avgQuestionLength}文字）\n`;
    }
  }

  report += `\n### 4. 解説の充実化\n\n`;
  for (const category of categories) {
    const stats = categoryStats[category];
    if (stats.avgExplanationLength < 50) {
      report += `- **${stats.name}**: 解説が不十分な可能性があります（平均${stats.avgExplanationLength}文字）\n`;
      report += `  - 推奨: 各選択肢の正誤理由を明記\n`;
      report += `  - 推奨: 関連する法令や条文を引用\n`;
      report += `  - 推奨: 実務での注意点を補足\n`;
    }
  }

  report += `\n### 5. 次回生成時の改善点\n\n`;
  report += `1. **プロンプトの改善**\n`;
  report += `   - 難易度を明確に指定（基礎/標準/応用の定義を詳細化）\n`;
  report += `   - 解説の最低文字数を指定（100文字以上推奨）\n`;
  report += `   - 各選択肢の正誤理由を必須化\n\n`;
  
  report += `2. **品質チェックの強化**\n`;
  report += `   - 生成後に自動で問題文の長さをチェック\n`;
  report += `   - 解説の充実度を評価\n`;
  report += `   - 重複問題の検出\n\n`;

  report += `3. **トピックの細分化**\n`;
  report += `   - 各カテゴリのトピックをより細かく分類\n`;
  report += `   - 出題頻度の高いテーマを重点的に生成\n\n`;

  // レポートをファイルに保存
  const reportPath = path.resolve(__dirname, '../docs/ai-questions-analysis.md');
  fs.writeFileSync(reportPath, report, 'utf-8');
  console.log(`\n✅ 分析レポートを保存しました: ${reportPath}`);

  // JSON形式でも保存
  const jsonPath = path.resolve(__dirname, '../docs/ai-questions-stats.json');
  fs.writeFileSync(jsonPath, JSON.stringify(categoryStats, null, 2), 'utf-8');
  console.log(`✅ 統計データを保存しました: ${jsonPath}`);

  process.exit(0);
}

analyzeQuestions().catch((error) => {
  console.error('❌ エラー:', error);
  process.exit(1);
});
