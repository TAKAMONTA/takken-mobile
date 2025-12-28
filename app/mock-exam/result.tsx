import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../lib/AuthContext';
import { saveMockExamResult } from '../../lib/firestore-service';
import { getAllQuestions } from '../../lib/question-service';
import { Question } from '../../lib/types';
import { ZenColors, Spacing, FontSize, BorderRadius, Shadow } from '../../constants/Colors';

export default function MockExamResultScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const correctCount = parseInt(params.correctCount as string);
  const totalQuestions = parseInt(params.totalQuestions as string);
  const timeUsed = parseInt(params.timeUsed as string);
  const answers = JSON.parse(params.answers as string);
  const questionIds = JSON.parse(params.questions as string);

  const score = correctCount;
  const percentage = Math.round((correctCount / totalQuestions) * 100);
  const isPassed = score >= 35;

  useEffect(() => {
    loadQuestionsAndSaveResult();
  }, []);

  const loadQuestionsAndSaveResult = async () => {
    try {
      // Load questions
      const allQuestions = await getAllQuestions();
      const examQuestions = questionIds.map((id: string) => 
        allQuestions.find(q => q.id === id)
      ).filter(Boolean) as Question[];
      setQuestions(examQuestions);

      // Calculate category stats
      const categoryStats: { [key: string]: { correct: number; total: number } } = {};
      examQuestions.forEach((q, index) => {
        if (!categoryStats[q.category]) {
          categoryStats[q.category] = { correct: 0, total: 0 };
        }
        categoryStats[q.category].total++;
        if (answers[index] === q.correctAnswer) {
          categoryStats[q.category].correct++;
        }
      });

      // Save result
      if (user) {
        await saveMockExamResult({
          userId: user.uid,
          score,
          totalQuestions,
          percentage,
          isPassed,
          timeUsed,
          categoryStats,
          completedAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}時間${minutes}分`;
  };

  const getCategoryName = (category: string) => {
    const names: { [key: string]: string } = {
      '宅建業法': '宅建業法',
      '民法等': '民法等',
      '法令上の制限': '法令上の制限',
      '税・その他': '税・その他',
    };
    return names[category] || category;
  };

  const getCategoryStats = () => {
    const stats: { [key: string]: { correct: number; total: number } } = {};
    questions.forEach((q, index) => {
      if (!stats[q.category]) {
        stats[q.category] = { correct: 0, total: 0 };
      }
      stats[q.category].total++;
      if (answers[index] === q.correctAnswer) {
        stats[q.category].correct++;
      }
    });
    return stats;
  };

  const getIncorrectQuestions = () => {
    return questions.filter((q, index) => answers[index] !== q.correctAnswer);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>結果を集計中...</Text>
        </View>
      </View>
    );
  }

  const categoryStats = getCategoryStats();
  const incorrectQuestions = getIncorrectQuestions();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Result header */}
        <View style={[
          styles.resultHeader,
          isPassed ? styles.resultHeaderPassed : styles.resultHeaderFailed,
        ]}>
          <Text style={styles.resultEmoji}>{isPassed ? '🎉' : '📝'}</Text>
          <Text style={styles.resultTitle}>
            {isPassed ? '合格！' : '不合格'}
          </Text>
          <Text style={styles.resultSubtitle}>
            {isPassed ? 'おめでとうございます！' : '次回頑張りましょう！'}
          </Text>
        </View>

        {/* Score card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>得点</Text>
            <Text style={[
              styles.scoreValue,
              isPassed ? styles.scoreValuePassed : styles.scoreValueFailed,
            ]}>
              {score} / {totalQuestions}
            </Text>
          </View>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>正答率</Text>
            <Text style={styles.scoreValue}>{percentage}%</Text>
          </View>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>所要時間</Text>
            <Text style={styles.scoreValue}>{formatTime(timeUsed)}</Text>
          </View>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>合格基準</Text>
            <Text style={styles.scoreValue}>35点以上</Text>
          </View>
        </View>

        {/* Category analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>カテゴリ別正答率</Text>
          <View style={styles.card}>
            {Object.entries(categoryStats).map(([category, stats]) => {
              const accuracy = Math.round((stats.correct / stats.total) * 100);
              return (
                <View key={category} style={styles.categoryRow}>
                  <Text style={styles.categoryName}>{getCategoryName(category)}</Text>
                  <View style={styles.categoryStats}>
                    <Text style={styles.categoryScore}>
                      {stats.correct} / {stats.total}
                    </Text>
                    <Text style={styles.categoryAccuracy}>{accuracy}%</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Incorrect questions */}
        {incorrectQuestions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              間違えた問題（{incorrectQuestions.length}問）
            </Text>
            <View style={styles.card}>
              {incorrectQuestions.map((q, index) => {
                const originalIndex = questions.findIndex(question => question.id === q.id);
                const userAnswer = answers[originalIndex];
                
                return (
                  <View key={q.id} style={styles.incorrectItem}>
                    <View style={styles.incorrectHeader}>
                      <Text style={styles.incorrectNumber}>問題 {originalIndex + 1}</Text>
                      <Text style={styles.incorrectCategory}>{getCategoryName(q.category)}</Text>
                    </View>
                    <Text style={styles.incorrectQuestion} numberOfLines={2}>
                      {q.question}
                    </Text>
                    <View style={styles.answerRow}>
                      <Text style={styles.answerLabel}>あなたの回答:</Text>
                      <Text style={styles.answerWrong}>
                        {userAnswer !== undefined ? `${userAnswer + 1}. ${q.choices[userAnswer]}` : '未回答'}
                      </Text>
                    </View>
                    <View style={styles.answerRow}>
                      <Text style={styles.answerLabel}>正解:</Text>
                      <Text style={styles.answerCorrect}>
                        {q.correctAnswer + 1}. {q.choices[q.correctAnswer]}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actionButtons}>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.actionButtonPrimary,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push('/mock-exam')}
          >
            <Text style={styles.actionButtonTextPrimary}>もう一度挑戦</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push('/')}
          >
            <Text style={styles.actionButtonText}>ホームに戻る</Text>
          </Pressable>
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
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  resultHeader: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadow.md,
  },
  resultHeaderPassed: {
    backgroundColor: ZenColors.success + '20',
    borderWidth: 2,
    borderColor: ZenColors.success,
  },
  resultHeaderFailed: {
    backgroundColor: ZenColors.error + '20',
    borderWidth: 2,
    borderColor: ZenColors.error,
  },
  resultEmoji: {
    fontSize: 64,
    marginBottom: Spacing.sm,
  },
  resultTitle: {
    fontSize: FontSize.xxxl,
    fontWeight: '700',
    color: ZenColors.text.primary,
    marginBottom: Spacing.xs,
  },
  resultSubtitle: {
    fontSize: FontSize.md,
    color: ZenColors.text.secondary,
  },
  scoreCard: {
    backgroundColor: ZenColors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: ZenColors.border,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: ZenColors.border,
  },
  scoreLabel: {
    fontSize: FontSize.md,
    color: ZenColors.text.secondary,
  },
  scoreValue: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: ZenColors.text.primary,
  },
  scoreValuePassed: {
    color: ZenColors.success,
  },
  scoreValueFailed: {
    color: ZenColors.error,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: ZenColors.text.primary,
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: ZenColors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: ZenColors.border,
    ...Shadow.sm,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: ZenColors.border,
  },
  categoryName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: ZenColors.text.primary,
  },
  categoryStats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  categoryScore: {
    fontSize: FontSize.md,
    color: ZenColors.text.secondary,
  },
  categoryAccuracy: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: ZenColors.primary,
  },
  incorrectItem: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ZenColors.border,
  },
  incorrectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  incorrectNumber: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: ZenColors.text.primary,
  },
  incorrectCategory: {
    fontSize: FontSize.xs,
    color: ZenColors.text.secondary,
  },
  incorrectQuestion: {
    fontSize: FontSize.sm,
    color: ZenColors.text.primary,
    marginBottom: Spacing.sm,
    lineHeight: FontSize.sm * 1.7,
  },
  answerRow: {
    marginBottom: Spacing.xs,
  },
  answerLabel: {
    fontSize: FontSize.xs,
    color: ZenColors.text.secondary,
    marginBottom: 2,
  },
  answerWrong: {
    fontSize: FontSize.sm,
    color: ZenColors.error,
  },
  answerCorrect: {
    fontSize: FontSize.sm,
    color: ZenColors.success,
    fontWeight: '600',
  },
  actionButtons: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  actionButton: {
    backgroundColor: ZenColors.gray[200],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  actionButtonPrimary: {
    backgroundColor: ZenColors.primary,
    ...Shadow.md,
  },
  actionButtonText: {
    color: ZenColors.text.secondary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  actionButtonTextPrimary: {
    color: ZenColors.text.inverse,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.8,
  },
});
