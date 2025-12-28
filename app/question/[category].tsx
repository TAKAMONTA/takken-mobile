import { View, Text, StyleSheet, Pressable, ScrollView, Alert, ActivityIndicator, TextInput, Modal } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '../../lib/AuthContext';
import { getQuestionsByCategory, categoryInfo } from '../../lib/question-service';
import { Question } from '../../lib/types';
import { saveStudySession, getUserProfile } from '../../lib/firestore-service';
import { generateAIExplanation, askAIQuestion } from '../../lib/ai-service';
import { ZenColors, Spacing, FontSize, BorderRadius, Shadow } from '../../constants/Colors';

export default function QuestionScreen() {
  const { user } = useAuth();
  const { category } = useLocalSearchParams<{ category: string }>();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [isPremium, setIsPremium] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [loadingAiExplanation, setLoadingAiExplanation] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  const [userQuestion, setUserQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [loadingAiAnswer, setLoadingAiAnswer] = useState(false);

  useEffect(() => {
    if (category) {
      loadQuestions();
    }
    checkPremium();
  }, [category]);

  const checkPremium = async () => {
    if (!user) return;
    try {
      const profile = await getUserProfile(user.uid);
      setIsPremium(profile?.isPremium || false);
    } catch (error) {
      console.error('Error checking premium status:', error);
    }
  };

  const loadQuestions = async () => {
    try {
      const categoryQuestions = await getQuestionsByCategory(category as string);
      setQuestions(categoryQuestions);
    } catch (error) {
      console.error('問題の読み込みに失敗しました:', error);
      Alert.alert('エラー', '問題の読み込みに失敗しました');
    }
  };

  const handleGetAIExplanation = async () => {
    if (!isPremium) {
      Alert.alert('プレミアム機能', 'AI解説はプレミアムプラン限定です', [
        { text: 'キャンセル' },
        { text: 'プレミアムプランを見る', onPress: () => router.push('/subscription') },
      ]);
      return;
    }

    setLoadingAiExplanation(true);
    try {
      const explanation = await generateAIExplanation(
        currentQuestion.question,
        currentQuestion.choices,
        currentQuestion.correctAnswer,
        currentQuestion.explanation
      );
      setAiExplanation(explanation);
    } catch (error) {
      Alert.alert('エラー', 'AI解説の生成に失敗しました');
    } finally {
      setLoadingAiExplanation(false);
    }
  };

  const handleAskAI = async () => {
    if (!isPremium) {
      Alert.alert('プレミアム機能', 'AI質問機能はプレミアムプラン限定です', [
        { text: 'キャンセル' },
        { text: 'プレミアムプランを見る', onPress: () => router.push('/subscription') },
      ]);
      return;
    }
    setShowAiChat(true);
  };

  const handleSubmitQuestion = async () => {
    if (!userQuestion.trim()) {
      Alert.alert('質問を入力してください');
      return;
    }

    setLoadingAiAnswer(true);
    try {
      const answer = await askAIQuestion(
        currentQuestion.question,
        currentQuestion.choices,
        currentQuestion.correctAnswer,
        currentQuestion.explanation,
        userQuestion
      );
      setAiAnswer(answer);
    } catch (error) {
      Alert.alert('エラー', 'AIの回答生成に失敗しました');
    } finally {
      setLoadingAiAnswer(false);
    }
  };

  if (questions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>問題が見つかりませんでした</Text>
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

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleSelectAnswer = (index: number) => {
    if (showExplanation) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = async () => {
    if (selectedAnswer === null) {
      Alert.alert('選択してください', '回答を選択してから送信してください');
      return;
    }

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    setShowExplanation(true);
    if (isCorrect) {
      setCorrectCount(correctCount + 1);
    }

    // Firestoreに学習記録を保存
    if (user) {
      const timeSpent = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
      
      // デバッグログ
      console.log('Current question:', currentQuestion);
      console.log('Question ID:', currentQuestion.id);
      
      // questionIdがundefinedの場合はスキップ
      if (!currentQuestion.id) {
        console.error('Question ID is undefined, skipping save');
        return;
      }
      
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
        console.log('Study session saved successfully');
      } catch (error) {
        console.error('Error saving study session:', error);
      }
    }
  };

  const handleNext = () => {
    // 次の問題の開始時刻をリセット
    setStartTime(new Date());

    if (isLastQuestion) {
      // 結果画面に遷移
      Alert.alert(
        '学習完了',
        `正解数: ${correctCount + (selectedAnswer === currentQuestion.correctAnswer ? 1 : 0)}/${questions.length}\n正答率: ${Math.round(((correctCount + (selectedAnswer === currentQuestion.correctAnswer ? 1 : 0)) / questions.length) * 100)}%`,
        [
          { text: 'OK', onPress: () => router.back() }
        ]
      );
    } else {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

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
        <Text style={styles.progress}>
          {currentIndex + 1} / {questions.length}
        </Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
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
            <>
              <View style={styles.explanation}>
                <Text style={styles.explanationTitle}>
                  {selectedAnswer === currentQuestion.correctAnswer ? '✓ 正解' : '✗ 不正解'}
                </Text>
                <Text style={styles.explanationText}>
                  {currentQuestion.explanation}
                </Text>
              </View>

              {/* AI解説ボタン */}
              {isPremium && (
                <Pressable
                  style={({ pressed }) => [
                    styles.aiButton,
                    pressed && styles.buttonPressed,
                    loadingAiExplanation && styles.buttonDisabled,
                  ]}
                  onPress={handleGetAIExplanation}
                  disabled={loadingAiExplanation}
                >
                  {loadingAiExplanation ? (
                    <ActivityIndicator size="small" color={ZenColors.text.inverse} />
                  ) : (
                    <Text style={styles.aiButtonText}>🤖 AI解説を見る</Text>
                  )}
                </Pressable>
              )}

              {/* AI解説表示 */}
              {aiExplanation && (
                <View style={styles.aiExplanation}>
                  <Text style={styles.aiExplanationTitle}>🤖 AI解説</Text>
                  <Text style={styles.aiExplanationText}>{aiExplanation}</Text>
                </View>
              )}

              {/* AI質問ボタン */}
              {isPremium && (
                <Pressable
                  style={({ pressed }) => [
                    styles.aiQuestionButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={handleAskAI}
                >
                  <Text style={styles.aiQuestionButtonText}>💬 AIに質問する</Text>
                </Pressable>
              )}
            </>
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

      {/* AI質問モーダル */}
      <Modal
        visible={showAiChat}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAiChat(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🤖 AIに質問</Text>
              <Pressable
                onPress={() => {
                  setShowAiChat(false);
                  setUserQuestion('');
                  setAiAnswer(null);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalClose}>×</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalLabel}>この問題について質問してください</Text>
              <TextInput
                style={styles.modalInput}
                value={userQuestion}
                onChangeText={setUserQuestion}
                placeholder="例: なぜ選択肢1が間違いなのですか？"
                multiline
                numberOfLines={4}
              />

              <Pressable
                style={({ pressed }) => [
                  styles.modalSubmitButton,
                  pressed && styles.buttonPressed,
                  loadingAiAnswer && styles.buttonDisabled,
                ]}
                onPress={handleSubmitQuestion}
                disabled={loadingAiAnswer}
              >
                {loadingAiAnswer ? (
                  <ActivityIndicator size="small" color={ZenColors.text.inverse} />
                ) : (
                  <Text style={styles.modalSubmitButtonText}>質問する</Text>
                )}
              </Pressable>

              {aiAnswer && (
                <View style={styles.aiAnswerContainer}>
                  <Text style={styles.aiAnswerTitle}>🤖 AIの回答</Text>
                  <Text style={styles.aiAnswerText}>{aiAnswer}</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  progress: {
    fontSize: FontSize.md,
    color: ZenColors.text.secondary,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
  },
  categoryBadge: {
    backgroundColor: ZenColors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  categoryText: {
    color: ZenColors.text.inverse,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  question: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: ZenColors.text.primary,
    lineHeight: FontSize.md * 1.7,
    marginBottom: Spacing.md,
  },
  choices: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  choice: {
    backgroundColor: ZenColors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
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
  buttonDisabled: {
    opacity: 0.6,
  },
  aiButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: Spacing.md,
    ...Shadow.sm,
  },
  aiButtonText: {
    color: ZenColors.text.inverse,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  aiExplanation: {
    backgroundColor: '#E8F5E9',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#4CAF50',
    marginTop: Spacing.md,
  },
  aiExplanationTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: Spacing.sm,
  },
  aiExplanationText: {
    fontSize: FontSize.md,
    color: '#1B5E20',
    lineHeight: FontSize.md * 1.7,
  },
  aiQuestionButton: {
    backgroundColor: '#2196F3',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: Spacing.md,
    ...Shadow.sm,
  },
  aiQuestionButtonText: {
    color: ZenColors.text.inverse,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: ZenColors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '80%',
    ...Shadow.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: ZenColors.border,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: ZenColors.text.primary,
  },
  modalClose: {
    fontSize: 32,
    color: ZenColors.text.secondary,
    fontWeight: '300',
  },
  modalScroll: {
    padding: Spacing.lg,
  },
  modalLabel: {
    fontSize: FontSize.md,
    color: ZenColors.text.secondary,
    marginBottom: Spacing.sm,
  },
  modalInput: {
    backgroundColor: ZenColors.background,
    borderWidth: 1,
    borderColor: ZenColors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: ZenColors.text.primary,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: Spacing.md,
  },
  modalSubmitButton: {
    backgroundColor: ZenColors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadow.md,
  },
  modalSubmitButtonText: {
    color: ZenColors.text.inverse,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  aiAnswerContainer: {
    backgroundColor: '#E3F2FD',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#2196F3',
    marginTop: Spacing.lg,
  },
  aiAnswerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: '#1565C0',
    marginBottom: Spacing.sm,
  },
  aiAnswerText: {
    fontSize: FontSize.md,
    color: '#0D47A1',
    lineHeight: FontSize.md * 1.7,
  },
});
