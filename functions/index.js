const functions = require('firebase-functions');
const admin = require('firebase-admin');
const OpenAI = require('openai');

admin.initializeApp();

// OpenAI client initialization
const openai = new OpenAI({
  apiKey: functions.config().openai.api_key,
});

// AI Chat Message
exports.sendChatMessage = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to use AI chat.'
    );
  }

  const { messages, newMessage } = data;

  if (!newMessage || typeof newMessage !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'newMessage is required and must be a string.'
    );
  }

  try {
    const response = await openai.chat.completions.create({
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
    });

    return { content: response.choices[0].message.content };
  } catch (error) {
    console.error('AI chat error:', error);
    throw new functions.https.HttpsError('internal', 'AI chat failed');
  }
});

// AI Question Generation
exports.generateAIQuestion = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to generate AI questions.'
    );
  }

  const { category, categoryInfo } = data;

  if (!category || !categoryInfo) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'category and categoryInfo are required.'
    );
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
    const response = await openai.chat.completions.create({
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
    });

    const questionData = JSON.parse(response.choices[0].message.content);
    
    return {
      question: questionData,
      category: category,
    };
  } catch (error) {
    console.error('AI question generation error:', error);
    throw new functions.https.HttpsError('internal', 'AI question generation failed');
  }
});

// AI Explanation Generation
exports.generateAIExplanation = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to generate AI explanations.'
    );
  }

  const { question, choices, correctAnswer, originalExplanation } = data;

  if (!question || !choices || correctAnswer === undefined || !originalExplanation) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'question, choices, correctAnswer, and originalExplanation are required.'
    );
  }

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

  try {
    const response = await openai.chat.completions.create({
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
    });

    return { explanation: response.choices[0].message.content };
  } catch (error) {
    console.error('AI explanation generation error:', error);
    throw new functions.https.HttpsError('internal', 'AI explanation generation failed');
  }
});

// AI Study Advice
exports.generateStudyAdvice = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to get study advice.'
    );
  }

  const { stats } = data;

  if (!stats) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'stats is required.'
    );
  }

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

  try {
    const response = await openai.chat.completions.create({
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
    });

    return { advice: response.choices[0].message.content };
  } catch (error) {
    console.error('Study advice generation error:', error);
    throw new functions.https.HttpsError('internal', 'Study advice generation failed');
  }
});

// AI Weakness Analysis
exports.analyzeWeaknesses = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to analyze weaknesses.'
    );
  }

  const { incorrectQuestions } = data;

  if (!incorrectQuestions || !Array.isArray(incorrectQuestions)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'incorrectQuestions array is required.'
    );
  }

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

  try {
    const response = await openai.chat.completions.create({
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
    });

    return { analysis: response.choices[0].message.content };
  } catch (error) {
    console.error('Weakness analysis error:', error);
    throw new functions.https.HttpsError('internal', 'Weakness analysis failed');
  }
});

// AI Question Answer
exports.askAIQuestion = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to ask AI questions.'
    );
  }

  const { question, choices, correctAnswer, explanation, userQuestion } = data;

  if (!question || !choices || correctAnswer === undefined || !explanation || !userQuestion) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'All parameters are required.'
    );
  }

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

  try {
    const response = await openai.chat.completions.create({
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
    });

    return { answer: response.choices[0].message.content };
  } catch (error) {
    console.error('AI question answer error:', error);
    throw new functions.https.HttpsError('internal', 'AI question answer failed');
  }
});

// IAP Receipt Verification
exports.verifyIAPReceipt = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to verify receipts.'
    );
  }

  const { receipt, platform, productId } = data;

  if (!receipt || !platform || !productId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'receipt, platform, and productId are required.'
    );
  }

  try {
    let isValid = false;

    if (platform === 'ios') {
      // Apple App Store receipt verification
      const appleResponse = await fetch(
        'https://buy.itunes.apple.com/verifyReceipt',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            'receipt-data': receipt,
            password: process.env.APPLE_SHARED_SECRET,
          }),
        }
      );

      const appleData = await appleResponse.json();
      
      // Check if receipt is valid
      if (appleData.status === 0) {
        // Verify product ID matches
        const latestReceipt = appleData.latest_receipt_info?.[0];
        if (latestReceipt && latestReceipt.product_id === productId) {
          isValid = true;
        }
      }
    } else if (platform === 'android') {
      // Google Play receipt verification
      // Note: This requires Google Play Developer API setup
      // For now, we'll implement a basic structure
      
      // TODO: Implement Google Play verification using googleapis
      // https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptions/get
      
      console.log('Android receipt verification not yet implemented');
      isValid = false;
    }

    if (isValid) {
      // Update user's premium status in Firestore
      await admin.firestore()
        .collection('users')
        .doc(context.auth.uid)
        .update({
          isPremium: true,
          premiumActivatedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastReceiptVerification: admin.firestore.FieldValue.serverTimestamp(),
        });
    }

    return { isValid };
  } catch (error) {
    console.error('Receipt verification error:', error);
    throw new functions.https.HttpsError('internal', 'Receipt verification failed');
  }
});
