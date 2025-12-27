import { View, Text, StyleSheet, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '../../lib/AuthContext';
import { getUserProfile } from '../../lib/firestore-service';
import { generateAIQuestion } from '../../lib/ai-service';
import { categoryInfo } from '../../lib/question-service';
import { Question } from '../../lib/types';
import { saveStudySession } from '../../lib/firestore-service';
import { ZenColors, Spacing, FontSize, BorderRadius, Shadow } from '../../constants/Colors';

export default function AIPracticeScreen() {
  const { user } = useAuth();
  const { category } = useLocalSearchParams<{ category: string }>();
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [startTime, setStartTime] = useState<Date>(new Date());

  useEffect(() => {
    checkPremiumAndLoad();
  }, []);

  const checkPremiumAndLoad = async () => {
    if (!user) {
      Alert.alert('エラー', 'ログインが必要です');
      router.back();
      return;
    }

    try {
      const profile = await getUserProfile(user.uid);
      if (!profile?.isPremium) {
        Alert.alert(
          'プレミアム機能',
          'AI問題生成機能はプレミアムプラン限定です',
          [
            { text: 'キャンセル', onPress: () => router.back() },
            { text: 'プレミアムプランを見る', onPress: () => router.push('/subscription') },
          ]
        );
        return;
      }

      await loadNewQuestion();
    } catch (error) {
      console.error('Error checking premium status:', error);
      Alert.alert('エラー', 'ユーザー情報の取得に失敗しました');
      router.back();
    }
  };

  const loadNewQuestion = async () => {
    setLoading(true);
    setGenerating(true);
    try {
      const question = await generateAIQuestion(category as string);
      setCurrentQuestion(question);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setStartTime(new Date());
    } catch (error) {
      console.error('Error generating question:', error);
      Alert.alert('エラー', 'AI問題の生成に失敗しました');
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  const handleSelectAnswer = (index: number) => {
    if (showExplanation) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = async () => {
    if (selectedAnswer === null || !currentQuestion) {
      Alert.alert('選択してください', '回答を選択してから送信してください');
      return;
    }

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    setShowExplanation(true);
    setTotalCount(totalCount + 1);
    if (isCorrect) {
      setCorrectCount(correctCount + 1);
    }

    // Firestoreに学習記録を保存
    if (user) {
      const timeSpent = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
      
      try {
        await saveStudySession({
          uid: user.uid,
          category: category || 'unknown',
          questionId: currentQuestion.id,
          userAnswer: selectedAnswer,
          correctAnswer: currentQuestion.correctAnswer,
          isCorrect,
          timeSpent,
        });
      } catch (error) {
        console.error('Error saving study session:', error);
      }
    }
  };

  const handleNext = async () => {
    await loadNewQuestion();
  };

  if (loading && !currentQuestion) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ZenColors.primary} />
        <Text style={styles.loadingText}>AI問題を生成中...</Text>
        <Text style={styles.loadingSubtext}>最適な問題を作成しています</Text>
      </View>
    );
  }

  if (!currentQuestion) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>問題の生成に失敗しました</Text>
          <Pressable
            style={styles.button}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>戻る</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Pressable 
          onPress={() => router.back()}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          style={styles.backButtonContainer}
        >
          <Text style={styles.backButton}>← 戻る</Text>
        </Pressable>
        <View style={styles.statsContainer}>
          <Text style={styles.stats}>
            正解: {correctCount}/{totalCount}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* AI生成バッジ */}
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>🤖 AI生成問題</Text>
          </View>

          {/* カテゴリ */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {categoryInfo[category as keyof typeof categoryInfo]?.name || category}
            </Text>
          </View>

          {/* 問題文 */}
          <Text style={styles.question}>{currentQuestion.question}</Text>

          {/* 選択肢 */}
          <View style={styles.choices}>
            {currentQuestion.choices.map((choice, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === currentQuestion.correctAnswer;
              const showResult = showExplanation;

              let choiceStyle = styles.choice;
              if (showResult) {
                if (isCorrect) {
                  choiceStyle = styles.choiceCorrect;
                } else if (isSelected) {
                  choiceStyle = styles.choiceIncorrect;
                }
              } else if (isSelected) {
                choiceStyle = styles.choiceSelected;
              }

              return (
                <Pressable
                  key={index}
                  style={choiceStyle}
                  onPress={() => handleSelectAnswer(index)}
                  disabled={showExplanation}
                >
                  <View style={styles.choiceNumber}>
                    <Text style={styles.choiceNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.choiceText}>{choice}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* 解説 */}
          {showExplanation && (
            <View style={styles.explanation}>
              <Text style={styles.explanationTitle}>
                {selectedAnswer === currentQuestion.correctAnswer ? '✓ 正解' : '✗ 不正解'}
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
                  generating && styles.buttonDisabled,
                ]}
                onPress={handleNext}
                disabled={generating}
              >
                {generating ? (
                  <View style={styles.buttonContent}>
                    <ActivityIndicator size="small" color={ZenColors.text.inverse} />
                    <Text style={styles.nextButtonText}>生成中...</Text>
                  </View>
                ) : (
                  <Text style={styles.nextButtonText}>次の問題を生成</Text>
                )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ZenColors.background,
    padding: Spacing.xl,
  },
  loadingText: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: ZenColors.text.primary,
    marginTop: Spacing.lg,
  },
  loadingSubtext: {
    fontSize: FontSize.md,
    color: ZenColors.text.secondary,
    marginTop: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: ZenColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: ZenColors.border,
  },
  backButtonContainer: {
    padding: Spacing.md,
    minWidth: 80,
    minHeight: 44,
    justifyContent: 'center',
  },
  backButton: {
    fontSize: FontSize.md,
    color: ZenColors.primary,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stats: {
    fontSize: FontSize.md,
    color: ZenColors.text.secondary,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  aiBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  aiBadgeText: {
    color: '#2E7D32',
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  categoryBadge: {
    backgroundColor: ZenColors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginBottom: Spacing.lg,
  },
  categoryText: {
    color: ZenColors.text.inverse,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  question: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: ZenColors.text.primary,
    lineHeight: FontSize.lg * 1.7,
    marginBottom: Spacing.xl,
  },
  choices: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  choice: {
    backgroundColor: ZenColors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: ZenColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  choiceSelected: {
    backgroundColor: ZenColors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: ZenColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  choiceCorrect: {
    backgroundColor: '#E8F5E9',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: ZenColors.success,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  choiceIncorrect: {
    backgroundColor: '#FFEBEE',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: ZenColors.error,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  choiceNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ZenColors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceNumberText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: ZenColors.text.primary,
  },
  choiceText: {
    flex: 1,
    fontSize: FontSize.md,
    color: ZenColors.text.primary,
    lineHeight: FontSize.md * 1.7,
  },
  explanation: {
    backgroundColor: ZenColors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: ZenColors.border,
    marginBottom: Spacing.xl,
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
    marginBottom: Spacing.xxl,
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
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
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
