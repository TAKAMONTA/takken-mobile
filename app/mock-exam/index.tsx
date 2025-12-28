import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../../lib/AuthContext';
import { getUserProfile } from '../../lib/firestore-service';
import { getAllQuestions } from '../../lib/question-service';
import { Question } from '../../lib/types';
import { ZenColors, Spacing, FontSize, BorderRadius, Shadow } from '../../constants/Colors';

export default function MockExamScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [timeRemaining, setTimeRemaining] = useState(120 * 60); // 2 hours in seconds
  const [examStarted, setExamStarted] = useState(false);
  const [examFinished, setExamFinished] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkPremiumAndLoadQuestions();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (examStarted && !examFinished) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleFinishExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [examStarted, examFinished]);

  const checkPremiumAndLoadQuestions = async () => {
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
          '模擬試験はプレミアムプラン限定です',
          [
            { text: 'キャンセル', onPress: () => router.back() },
            { text: 'プレミアムプランを見る', onPress: () => router.push('/subscription') },
          ]
        );
        return;
      }

      setIsPremium(true);

      // Load all questions and select random 50
      const allQuestions = await getAllQuestions();
      const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, 50);
      setQuestions(selected);
    } catch (error) {
      console.error('Error loading questions:', error);
      Alert.alert('エラー', '問題の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = () => {
    Alert.alert(
      '模擬試験を開始',
      '制限時間は2時間です。途中で中断することはできません。開始しますか？',
      [
        { text: 'キャンセル' },
        { 
          text: '開始する', 
          onPress: () => setExamStarted(true)
        },
      ]
    );
  };

  const handleSelectAnswer = (choiceIndex: number) => {
    setAnswers({ ...answers, [currentIndex]: choiceIndex });
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleFinishExam = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const answeredCount = Object.keys(answers).length;
    if (answeredCount < questions.length) {
      Alert.alert(
        '未回答の問題があります',
        `${questions.length - answeredCount}問が未回答です。このまま終了しますか？`,
        [
          { text: 'キャンセル' },
          { 
            text: '終了する', 
            onPress: () => {
              setExamFinished(true);
              navigateToResult();
            }
          },
        ]
      );
    } else {
      setExamFinished(true);
      navigateToResult();
    }
  };

  const navigateToResult = () => {
    // Calculate score
    let correctCount = 0;
    questions.forEach((q, index) => {
      if (answers[index] === q.correctAnswer) {
        correctCount++;
      }
    });

    const timeUsed = 120 * 60 - timeRemaining;
    
    router.push({
      pathname: '/mock-exam/result',
      params: {
        correctCount,
        totalQuestions: questions.length,
        timeUsed,
        answers: JSON.stringify(answers),
        questions: JSON.stringify(questions.map(q => q.id)),
      },
    });
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>問題を読み込めませんでした</Text>
        </View>
      </View>
    );
  }

  if (!examStarted) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.content}>
          <View style={styles.instructionContainer}>
            <Text style={styles.instructionTitle}>📝 模擬試験</Text>
            <Text style={styles.instructionSubtitle}>本番形式の試験で実力を試そう</Text>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>試験概要</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>問題数:</Text>
                <Text style={styles.infoValue}>50問</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>制限時間:</Text>
                <Text style={styles.infoValue}>2時間（120分）</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>合格基準:</Text>
                <Text style={styles.infoValue}>35点以上（70%）</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>出題形式:</Text>
                <Text style={styles.infoValue}>4択問題</Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>注意事項</Text>
              <Text style={styles.noteText}>• 試験開始後は中断できません</Text>
              <Text style={styles.noteText}>• 制限時間を過ぎると自動的に終了します</Text>
              <Text style={styles.noteText}>• 問題は前後に移動できます</Text>
              <Text style={styles.noteText}>• 解答は後から変更できます</Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.startButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleStartExam}
            >
              <Text style={styles.startButtonText}>試験を開始する</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>戻る</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isAnswered = answers[currentIndex] !== undefined;

  return (
    <View style={styles.container}>
      {/* Header with timer */}
      <View style={styles.header}>
        <Text style={styles.questionNumber}>
          問題 {currentIndex + 1} / {questions.length}
        </Text>
        <Text style={[
          styles.timer,
          timeRemaining < 600 && styles.timerWarning,
        ]}>
          ⏱️ {formatTime(timeRemaining)}
        </Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Category badge */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{currentQuestion.category}</Text>
          </View>

          {/* Question */}
          <Text style={styles.question}>{currentQuestion.question}</Text>

          {/* Choices */}
          <View style={styles.choices}>
            {currentQuestion.choices.map((choice, index) => (
              <Pressable
                key={index}
                style={({ pressed }) => [
                  styles.choice,
                  answers[currentIndex] === index && styles.choiceSelected,
                  pressed && styles.choicePressed,
                ]}
                onPress={() => handleSelectAnswer(index)}
              >
                <View style={styles.choiceNumber}>
                  <Text style={[
                    styles.choiceNumberText,
                    answers[currentIndex] === index && styles.choiceNumberTextSelected,
                  ]}>
                    {index + 1}
                  </Text>
                </View>
                <Text style={[
                  styles.choiceText,
                  answers[currentIndex] === index && styles.choiceTextSelected,
                ]}>
                  {choice}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Answer status */}
          <View style={styles.answerStatus}>
            <Text style={styles.answerStatusText}>
              {isAnswered ? '✓ 回答済み' : '未回答'}
            </Text>
            <Text style={styles.answerStatusCount}>
              回答済み: {Object.keys(answers).length} / {questions.length}
            </Text>
          </View>

          {/* Navigation buttons */}
          <View style={styles.navigationButtons}>
            <Pressable
              style={({ pressed }) => [
                styles.navButton,
                currentIndex === 0 && styles.navButtonDisabled,
                pressed && styles.buttonPressed,
              ]}
              onPress={handlePreviousQuestion}
              disabled={currentIndex === 0}
            >
              <Text style={styles.navButtonText}>← 前の問題</Text>
            </Pressable>

            {currentIndex < questions.length - 1 ? (
              <Pressable
                style={({ pressed }) => [
                  styles.navButton,
                  styles.navButtonPrimary,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleNextQuestion}
              >
                <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>
                  次の問題 →
                </Text>
              </Pressable>
            ) : (
              <Pressable
                style={({ pressed }) => [
                  styles.finishButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleFinishExam}
              >
                <Text style={styles.finishButtonText}>試験を終了する</Text>
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
    padding: Spacing.md,
  },
  loadingText: {
    fontSize: FontSize.md,
    color: ZenColors.text.secondary,
    marginTop: Spacing.md,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  instructionContainer: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: FontSize.xxxl,
    fontWeight: '700',
    color: ZenColors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  instructionSubtitle: {
    fontSize: FontSize.md,
    color: ZenColors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  infoCard: {
    backgroundColor: ZenColors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: ZenColors.border,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  infoTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: ZenColors.text.primary,
    marginBottom: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  infoLabel: {
    fontSize: FontSize.md,
    color: ZenColors.text.secondary,
  },
  infoValue: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: ZenColors.text.primary,
  },
  noteText: {
    fontSize: FontSize.sm,
    color: ZenColors.text.secondary,
    marginBottom: Spacing.xs,
    lineHeight: FontSize.sm * 1.7,
  },
  startButton: {
    backgroundColor: ZenColors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
    ...Shadow.md,
  },
  startButtonText: {
    color: ZenColors.text.inverse,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: ZenColors.gray[200],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  backButtonText: {
    color: ZenColors.text.secondary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.8,
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
  questionNumber: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: ZenColors.text.primary,
  },
  timer: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: ZenColors.primary,
  },
  timerWarning: {
    color: ZenColors.error,
  },
  scrollView: {
    flex: 1,
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
    gap: Spacing.sm,
  },
  choiceSelected: {
    borderColor: ZenColors.primary,
    backgroundColor: ZenColors.primary + '10',
  },
  choicePressed: {
    opacity: 0.8,
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
    color: ZenColors.text.secondary,
  },
  choiceNumberTextSelected: {
    color: ZenColors.primary,
  },
  choiceText: {
    flex: 1,
    fontSize: FontSize.md,
    color: ZenColors.text.primary,
    lineHeight: FontSize.md * 1.7,
  },
  choiceTextSelected: {
    fontWeight: '600',
    color: ZenColors.primary,
  },
  answerStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: ZenColors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: ZenColors.border,
    marginBottom: Spacing.md,
  },
  answerStatusText: {
    fontSize: FontSize.sm,
    color: ZenColors.text.secondary,
  },
  answerStatusCount: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: ZenColors.text.primary,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  navButton: {
    flex: 1,
    backgroundColor: ZenColors.gray[200],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  navButtonPrimary: {
    backgroundColor: ZenColors.primary,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: ZenColors.text.secondary,
  },
  navButtonTextPrimary: {
    color: ZenColors.text.inverse,
  },
  finishButton: {
    flex: 1,
    backgroundColor: ZenColors.success,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    ...Shadow.md,
  },
  finishButtonText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: ZenColors.text.inverse,
  },
});
