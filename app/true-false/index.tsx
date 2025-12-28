import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../../lib/AuthContext';
import { getQuestionsByCategory } from '../../lib/question-service';
import { Question } from '../../lib/types';
import { saveStudySession, getUserProfile, saveTrueFalseQuizResult } from '../../lib/firestore-service';
import { ZenColors, Spacing, FontSize, BorderRadius, Shadow } from '../../constants/Colors';

// ○×問題用の型
interface TrueFalseQuestion {
  originalQuestion: Question;
  statement: string;
  isTrue: boolean;
  explanation: string;
}

export default function TrueFalseScreen() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<TrueFalseQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    checkPremiumAndLoadQuestions();
  }, [user]);

  const checkPremiumAndLoadQuestions = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const profile = await getUserProfile(user.uid);
      const premium = profile?.isPremium || false;
      setIsPremium(premium);

      if (!premium) {
        Alert.alert('プレミアム機能', '○×問題はプレミアムプラン限定です', [
          { text: 'キャンセル', onPress: () => router.back() },
          { text: 'プレミアムプランを見る', onPress: () => router.push('/subscription') },
        ]);
        return;
      }

      await loadQuestions();
    } catch (error) {
      console.error('Error checking premium:', error);
      setLoading(false);
    }
  };

  const loadQuestions = async () => {
    try {
      // 全カテゴリから問題を取得
      const categories = ['takkengyouhou', 'minpou', 'hourei', 'zei'];
      const allQuestions: Question[] = [];
      
      for (const category of categories) {
        const categoryQuestions = await getQuestionsByCategory(category);
        allQuestions.push(...categoryQuestions);
      }

      // ランダムに20問選択
      const shuffled = allQuestions.sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, 20);

      // ○×問題に変換
      const trueFalseQuestions = selected.map(q => convertToTrueFalse(q));
      setQuestions(trueFalseQuestions);
    } catch (error) {
      console.error('問題の読み込みに失敗しました:', error);
      Alert.alert('エラー', '問題の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const convertToTrueFalse = (question: Question): TrueFalseQuestion => {
    // ランダムに正解または不正解の選択肢を選ぶ
    const useCorrectAnswer = Math.random() > 0.5;
    
    if (useCorrectAnswer) {
      // 正解の選択肢を使用
      return {
        originalQuestion: question,
        statement: question.choices[question.correctAnswer],
        isTrue: true,
        explanation: `正しい。${question.explanation}`,
      };
    } else {
      // 不正解の選択肢をランダムに選択
      const incorrectIndices = question.choices
        .map((_, index) => index)
        .filter(index => index !== question.correctAnswer);
      const randomIncorrectIndex = incorrectIndices[Math.floor(Math.random() * incorrectIndices.length)];
      
      return {
        originalQuestion: question,
        statement: question.choices[randomIncorrectIndex],
        isTrue: false,
        explanation: `誤り。正しくは「${question.choices[question.correctAnswer]}」です。${question.explanation}`,
      };
    }
  };

  const handleSelectAnswer = (answer: boolean) => {
    if (showExplanation) return;
    setSelectedAnswer(answer);
  };

  const handleSubmit = async () => {
    if (selectedAnswer === null) {
      Alert.alert('選択してください', '○か×を選択してから送信してください');
      return;
    }

    const currentQuestion = questions[currentIndex];
    const isCorrect = selectedAnswer === currentQuestion.isTrue;
    setShowExplanation(true);
    
    if (isCorrect) {
      setCorrectCount(correctCount + 1);
    }

    // Firestoreに学習記録を保存
    if (user && currentQuestion.originalQuestion.id) {
      try {
        await saveStudySession(user.uid, {
          questionId: currentQuestion.originalQuestion.id,
          category: currentQuestion.originalQuestion.category,
          isCorrect,
          userAnswer: selectedAnswer ? 1 : 0,
          correctAnswer: currentQuestion.isTrue ? 1 : 0,
          timeSpent: 0,
        });
      } catch (error) {
        console.error('Error saving study session:', error);
      }
    }
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      // 最終結果を保存
      const accuracy = Math.round((correctCount / questions.length) * 100);
      
      if (user) {
        try {
          await saveTrueFalseQuizResult({
            userId: user.uid,
            totalQuestions: questions.length,
            correctCount,
            accuracy,
            completedAt: new Date(),
          });
        } catch (error) {
          console.error('Error saving quiz result:', error);
        }
      }
      
      Alert.alert(
        '◯×問題完了！',
        `正解数: ${correctCount}/${questions.length}\n正答率: ${accuracy}%`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ZenColors.primary} />
          <Text style={styles.loadingText}>問題を読み込み中...</Text>
        </View>
      </View>
    );
  }

  if (!isPremium || questions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>問題が見つかりませんでした</Text>
          <Pressable style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>戻る</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>○×問題</Text>
        <Text style={styles.progress}>
          {currentIndex + 1}/{questions.length}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.questionContainer}>
          {/* カテゴリバッジ */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {currentQuestion.originalQuestion.category}
            </Text>
          </View>

          {/* 問題文 */}
          <Text style={styles.questionTitle}>次の記述は正しいでしょうか？</Text>
          <Text style={styles.statement}>{currentQuestion.statement}</Text>

          {/* ○×ボタン */}
          <View style={styles.choices}>
            <Pressable
              style={[
                styles.choice,
                selectedAnswer === true && styles.choiceSelected,
                showExplanation && currentQuestion.isTrue && styles.choiceCorrect,
                showExplanation && selectedAnswer === true && !currentQuestion.isTrue && styles.choiceIncorrect,
              ]}
              onPress={() => handleSelectAnswer(true)}
              disabled={showExplanation}
            >
              <Text style={styles.choiceSymbol}>○</Text>
              <Text style={styles.choiceLabel}>正しい</Text>
            </Pressable>

            <Pressable
              style={[
                styles.choice,
                selectedAnswer === false && styles.choiceSelected,
                showExplanation && !currentQuestion.isTrue && styles.choiceCorrect,
                showExplanation && selectedAnswer === false && currentQuestion.isTrue && styles.choiceIncorrect,
              ]}
              onPress={() => handleSelectAnswer(false)}
              disabled={showExplanation}
            >
              <Text style={styles.choiceSymbol}>×</Text>
              <Text style={styles.choiceLabel}>誤り</Text>
            </Pressable>
          </View>

          {/* 解説 */}
          {showExplanation && (
            <View style={styles.explanation}>
              <Text style={styles.explanationTitle}>
                {selectedAnswer === currentQuestion.isTrue ? '✓ 正解' : '✗ 不正解'}
              </Text>
              <Text style={styles.explanationText}>
                {currentQuestion.explanation}
              </Text>
            </View>
          )}

          {/* ボタン */}
          <View style={styles.actions}>
            {!showExplanation ? (
              <Pressable
                style={({ pressed }) => [
                  styles.submitButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>回答する</Text>
              </Pressable>
            ) : (
              <Pressable
                style={({ pressed }) => [
                  styles.nextButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleNext}
              >
                <Text style={styles.nextButtonText}>
                  {isLastQuestion ? '結果を見る' : '次の問題'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ZenColors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: ZenColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: ZenColors.border,
  },
  backButton: {
    minWidth: 80,
    minHeight: 44,
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: FontSize.xl,
    color: ZenColors.primary,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: ZenColors.text.primary,
  },
  progress: {
    fontSize: FontSize.md,
    color: ZenColors.text.secondary,
    minWidth: 80,
    textAlign: 'right',
  },
  content: {
    flex: 1,
  },
  questionContainer: {
    padding: Spacing.md,
  },
  categoryBadge: {
    backgroundColor: ZenColors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  categoryText: {
    color: ZenColors.text.inverse,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  questionTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: ZenColors.text.primary,
    marginBottom: Spacing.sm,
  },
  statement: {
    fontSize: FontSize.md,
    color: ZenColors.text.primary,
    lineHeight: FontSize.md * 1.8,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: ZenColors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: ZenColors.primary,
  },
  choices: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  choice: {
    flex: 1,
    backgroundColor: ZenColors.surface,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: ZenColors.border,
    alignItems: 'center',
    ...Shadow.sm,
  },
  choiceSelected: {
    borderColor: ZenColors.primary,
    backgroundColor: ZenColors.primary + '10',
  },
  choiceCorrect: {
    borderColor: ZenColors.success,
    backgroundColor: ZenColors.success + '10',
  },
  choiceIncorrect: {
    borderColor: ZenColors.error,
    backgroundColor: ZenColors.error + '10',
  },
  choiceSymbol: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  choiceLabel: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: ZenColors.text.primary,
  },
  explanation: {
    backgroundColor: ZenColors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: ZenColors.border,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  explanationTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: ZenColors.text.primary,
    marginBottom: Spacing.sm,
  },
  explanationText: {
    fontSize: FontSize.md,
    color: ZenColors.text.secondary,
    lineHeight: FontSize.md * 1.7,
  },
  actions: {
    marginTop: Spacing.lg,
  },
  submitButton: {
    backgroundColor: ZenColors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadow.md,
  },
  nextButton: {
    backgroundColor: ZenColors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadow.md,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  submitButtonText: {
    color: ZenColors.text.inverse,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  nextButtonText: {
    color: ZenColors.text.inverse,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    fontSize: FontSize.md,
    color: ZenColors.text.secondary,
    marginTop: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSize.lg,
    color: ZenColors.text.secondary,
    marginBottom: Spacing.xl,
  },
  button: {
    backgroundColor: ZenColors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  buttonText: {
    color: ZenColors.text.inverse,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});
