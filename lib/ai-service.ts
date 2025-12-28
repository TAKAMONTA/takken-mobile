import { Question } from './types';

// OpenAI APIを使用したAI解説生成
// 環境変数: EXPO_PUBLIC_OPENAI_API_KEY

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
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI API key is not configured');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'あなたは宅建試験の専門家です。受験者の質問に対して、わかりやすく丁寧に回答してください。法律の根拠や具体例を交えて説明してください。',
          },
          ...messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          {
            role: 'user',
            content: newMessage,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('AI chat error:', error);
    throw error;
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
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI API key is not configured');
  }

  const categoryInfo = categoryDetails[category];
  
  if (!categoryInfo) {
    throw new Error('Invalid category');
  }

  const prompt = `あなたは宅地建物取引士試験の問題作成の専門家です。

以下の条件で${categoryInfo.name}の問題を1問作成してください：

【カテゴリ】${categoryInfo.name}
【説明】${categoryInfo.description}
【トピック例】${categoryInfo.topics.join('、')}

【要件】
1. 実際の宅建試験と同レベルの難易度
2. 4つの選択肢（1つが正解、3つが不正解）
3. 選択肢は具体的で紛らわしいものにする
4. 解説は200文字程度で、正解の根拠を明確に説明
5. 問題文は100-200文字程度

以下のJSON形式で出力してください：
{
  "question": "問題文",
  "choices": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
  "correctAnswer": 0,
  "explanation": "解説文",
  "difficulty": "normal",
  "year": 2025,
  "tags": ["タグ1", "タグ2"]
}

※correctAnswerは正解の選択肢のインデックス（0-3）
※difficultyは"easy", "normal", "hard"のいずれか
※tagsは問題に関連するキーワードを2-3個`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: 'あなたは宅地建物取引士試験の問題作成の専門家です。正確で実践的な問題を作成します。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const questionData = JSON.parse(content);

    // Questionオブジェクトに変換
    const question: Question = {
      id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      category,
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
    const prompt = `以下の宅建試験問題について、初心者にもわかりやすく詳しく解説してください。

【問題】
${question}

【選択肢】
${choices.map((choice, index) => `${index + 1}. ${choice}`).join('\n')}

【正解】
${correctAnswer + 1}. ${choices[correctAnswer]}

【基本解説】
${originalExplanation}

【AI解説の要件】
1. なぜこの選択肢が正解なのか、法律の根拠を含めて説明
2. 他の選択肢がなぜ間違っているのか、それぞれ説明
3. 関連する法律や条文を具体的に示す
4. 実務での適用例や覚え方のコツを提示
5. 初心者にもわかりやすい言葉で説明

400文字以内で簡潔に説明してください。`;

    const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: 'あなたは宅建試験の専門講師です。受験生が理解しやすいように、わかりやすく丁寧に解説してください。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();

    return data.choices[0]?.message?.content || '解説の生成に失敗しました。';
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
    const prompt = `以下の学習データを分析して、次に何を勉強すべきか具体的なアドバイスをしてください。

【学習データ】
- 総問題数: ${stats.totalQuestions}問
- 正答率: ${stats.correctRate}%
- 学習日数: ${stats.studyDays}日

【カテゴリ別成績】
${stats.categoryStats.map(cat => `- ${cat.category}: ${cat.count}問、正答率${cat.correctRate}%`).join('\n')}

【アドバイスの要件】
1. 現在の学習状況の評価
2. 優先的に学習すべき分野
3. 具体的な学習方法の提案
4. 目標設定のアドバイス

200文字以内で簡潔にアドバイスしてください。`;

    const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: 'あなたは宅建試験の学習アドバイザーです。受験生の学習状況を分析し、効果的な学習方法を提案してください。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();

    return data.choices[0]?.message?.content || 'アドバイスの生成に失敗しました。';
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
    const prompt = `以下の間違えた問題を分析して、学習者の弱点パターンを特定してください。

【間違えた問題】
${incorrectQuestions.slice(0, 10).map((q, i) => `
${i + 1}. カテゴリ: ${q.category}
問題: ${q.question.substring(0, 100)}...
選んだ答え: ${q.userAnswer + 1}
正解: ${q.correctAnswer + 1}
`).join('\n')}

【分析の要件】
1. 共通する間違いのパターン
2. 理解が不足している分野
3. 改善のための具体的な学習方法
4. 注意すべきポイント

300文字以内で分析結果を提示してください。`;

    const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: 'あなたは宅建試験の分析専門家です。受験生の間違いパターンを分析し、効果的な改善方法を提案してください。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();

    return data.choices[0]?.message?.content || '分析に失敗しました。';
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
    const prompt = `以下の宅建試験問題について、受験生からの質問に答えてください。

【問題】
${question}

【選択肢】
${choices.map((choice, index) => `${index + 1}. ${choice}`).join('\n')}

【正解】
${correctAnswer + 1}. ${choices[correctAnswer]}

【解説】
${explanation}

【受験生からの質問】
${userQuestion}

わかりやすく丁寧に回答してください（200文字以内）。`;

    const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: 'あなたは宅建試験の専門講師です。受験生の質問に対して、わかりやすく丁寧に回答してください。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();

    return data.choices[0]?.message?.content || '回答の生成に失敗しました。';
  } catch (error) {
    console.error('Error asking AI question:', error);
    throw new Error('AI質問の回答に失敗しました');
  }
}

// Weak area analysis
export interface WeakAreaAnalysisRequest {
  mockExamResults: Array<{
    score: number;
    totalQuestions: number;
    categoryStats: { [key: string]: { correct: number; total: number } };
  }>;
  studyStats: {
    totalQuestions: number;
    correctAnswers: number;
    categoryStats: { [key: string]: { total: number; correct: number } };
  };
}

export interface WeakArea {
  category: string;
  correctRate: number;
  totalQuestions: number;
  incorrectCount: number;
  priority: number; // 1-5, 5 being highest priority
  improvementPotential: number; // Expected score increase if improved
  recommendedStudyTime: string;
  recommendedQuestionCount: number;
  advice: string;
}

export async function analyzeWeakAreas(request: WeakAreaAnalysisRequest): Promise<WeakArea[]> {
  try {
    const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not found');
    }

    // Prepare analysis data
    const categoryData: { [key: string]: { correct: number; total: number } } = {};
    
    // Combine mock exam results
    request.mockExamResults.forEach(result => {
      Object.entries(result.categoryStats).forEach(([category, stats]) => {
        if (!categoryData[category]) {
          categoryData[category] = { correct: 0, total: 0 };
        }
        categoryData[category].correct += stats.correct;
        categoryData[category].total += stats.total;
      });
    });

    // Add study stats
    Object.entries(request.studyStats.categoryStats).forEach(([category, stats]) => {
      if (!categoryData[category]) {
        categoryData[category] = { correct: 0, total: 0 };
      }
      categoryData[category].correct += stats.correct;
      categoryData[category].total += stats.total;
    });

    // Calculate basic metrics
    const weakAreas: WeakArea[] = Object.entries(categoryData).map(([category, stats]) => {
      const correctRate = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
      const incorrectCount = stats.total - stats.correct;
      
      // Calculate priority (lower correct rate = higher priority)
      let priority = 5;
      if (correctRate >= 80) priority = 1;
      else if (correctRate >= 70) priority = 2;
      else if (correctRate >= 60) priority = 3;
      else if (correctRate >= 50) priority = 4;
      
      // Calculate improvement potential (more incorrect answers = more potential)
      const improvementPotential = Math.round(incorrectCount * 0.7); // Assume 70% improvement rate
      
      // Recommend study time and question count
      let recommendedStudyTime = '1-2時間';
      let recommendedQuestionCount = 20;
      
      if (correctRate < 50) {
        recommendedStudyTime = '3-4時間';
        recommendedQuestionCount = 40;
      } else if (correctRate < 70) {
        recommendedStudyTime = '2-3時間';
        recommendedQuestionCount = 30;
      }

      return {
        category,
        correctRate: Math.round(correctRate),
        totalQuestions: stats.total,
        incorrectCount,
        priority,
        improvementPotential,
        recommendedStudyTime,
        recommendedQuestionCount,
        advice: '', // Will be filled by AI
      };
    });

    // Sort by priority (highest first)
    weakAreas.sort((a, b) => b.priority - a.priority);

    // Get AI advice for top 3 weak areas
    const top3 = weakAreas.slice(0, 3);
    
    if (top3.length === 0) {
      return weakAreas;
    }

    const prompt = `あなたは宅建試験の学習アドバイザーです。以下の弱点分野について、具体的な学習アドバイスを1文で簡潔に提供してください。

弱点分野:
${top3.map(area => `- ${area.category}: 正答率${area.correctRate}%、${area.incorrectCount}問間違い`).join('\n')}

各分野について、以下のJSON形式で回答してください:
{
  "advice": {
    "${top3[0]?.category}": "具体的なアドバイス",
    "${top3[1]?.category || ''}": "具体的なアドバイス",
    "${top3[2]?.category || ''}": "具体的なアドバイス"
  }
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: 'あなたは宅建試験の学習アドバイザーです。簡潔で実践的なアドバイスを提供してください。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get AI advice');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // Parse AI response
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const adviceData = JSON.parse(jsonMatch[0]);
        
        // Apply AI advice to weak areas
        weakAreas.forEach(area => {
          if (adviceData.advice[area.category]) {
            area.advice = adviceData.advice[area.category];
          } else {
            area.advice = `${area.category}の基礎をしっかり復習し、過去問を繰り返し解きましょう。`;
          }
        });
      }
    } catch (parseError) {
      console.error('Error parsing AI advice:', parseError);
      // Provide default advice
      weakAreas.forEach(area => {
        area.advice = `${area.category}の基礎をしっかり復習し、過去問を繰り返し解きましょう。`;
      });
    }

    return weakAreas;
  } catch (error) {
    console.error('Error analyzing weak areas:', error);
    throw error;
  }
}
