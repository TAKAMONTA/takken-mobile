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
