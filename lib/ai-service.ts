import { Question } from './types';

// OpenAI APIを使用したAI解説生成
// 環境変数: EXPO_PUBLIC_OPENAI_API_KEY

export interface AIExplanationRequest {
  question: Question;
  userAnswer: number;
  isCorrect: boolean;
}

export interface AIExplanationResponse {
  explanation: string;
  tips: string[];
  relatedTopics: string[];
}

export async function generateAIExplanation(
  request: AIExplanationRequest
): Promise<AIExplanationResponse> {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI API key is not configured');
  }

  const { question, userAnswer, isCorrect } = request;

  const prompt = `
あなたは宅建試験の専門家です。以下の問題について、詳しい解説を提供してください。

【問題】
${question.question}

【選択肢】
${question.choices.map((choice, index) => `${index + 1}. ${choice}`).join('\n')}

【正解】
${question.correctAnswer + 1}. ${question.choices[question.correctAnswer]}

【受験者の回答】
${userAnswer + 1}. ${question.choices[userAnswer]}

【結果】
${isCorrect ? '正解' : '不正解'}

以下の形式でJSON形式で回答してください：
{
  "explanation": "詳しい解説（なぜこの選択肢が正解/不正解なのか、法律の根拠など）",
  "tips": ["学習のポイント1", "学習のポイント2", "学習のポイント3"],
  "relatedTopics": ["関連トピック1", "関連トピック2"]
}
`;

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
            content: 'あなたは宅建試験の専門家です。受験者の理解を深めるために、わかりやすく詳しい解説を提供してください。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const result = JSON.parse(content);

    return {
      explanation: result.explanation || '解説を生成できませんでした。',
      tips: result.tips || [],
      relatedTopics: result.relatedTopics || [],
    };
  } catch (error) {
    console.error('AI explanation generation error:', error);
    throw error;
  }
}

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
