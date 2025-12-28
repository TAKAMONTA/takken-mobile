import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../../lib/AuthContext';
import { getStudyStats, StudyStats, getCategoryStats, getIncorrectQuestions, getUserProfile, getTrueFalseQuizResults, TrueFalseQuizResult } from '../../lib/firestore-service';
import { analyzeWeaknesses } from '../../lib/ai-service';
import { getQuestionById } from '../../lib/question-service';
import { ZenColors, Spacing, FontSize, BorderRadius, Shadow } from '../../constants/Colors';

export default function StatsScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [categoryStats, setCategoryStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [trueFalseResults, setTrueFalseResults] = useState<TrueFalseQuizResult[]>([]);

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const userStats = await getStudyStats(user.uid);
      setStats(userStats);
      
      const profile = await getUserProfile(user.uid);
      setIsPremium(profile?.isPremium || false);
      
      // Load category stats
      const categories = ['takkengyouhou', 'minpou', 'hourei', 'zei'];
      const categoryData: any = {};
      for (const category of categories) {
        const catStats = await getCategoryStats(user.uid, category);
        categoryData[category] = catStats;
      }
      setCategoryStats(categoryData);
      
      // Load true/false quiz results
      const tfResults = await getTrueFalseQuizResults(user.uid);
      setTrueFalseResults(tfResults);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetAIAnalysis = async () => {
    if (!isPremium) {
      Alert.alert('プレミアム機能', 'AI弱点分析はプレミアムプラン限定です', [
        { text: 'キャンセル' },
        { text: 'プレミアムプランを見る', onPress: () => router.push('/subscription') },
      ]);
      return;
    }

    if (!user) return;

    setLoadingAnalysis(true);
    try {
      const incorrectSessions = await getIncorrectQuestions(user.uid, 20);
      
      if (incorrectSessions.length === 0) {
        Alert.alert('データ不足', '間違えた問題がまだありません。問題を解いてから分析を実行してください。');
        setLoadingAnalysis(false);
        return;
      }

      const questionsData = [];
      for (const session of incorrectSessions) {
        const question = await getQuestionById(session.questionId);
        if (question) {
          questionsData.push({
            question: question.question,
            category: session.category,
            userAnswer: session.userAnswer,
            correctAnswer: session.correctAnswer,
          });
        }
      }

      const analysis = await analyzeWeaknesses(questionsData);
      setAiAnalysis(analysis);
    } catch (error) {
      Alert.alert('エラー', 'AI分析の生成に失敗しました');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const getAccuracyRate = (): number => {
    if (!stats || stats.totalQuestions === 0) return 0;
    return Math.round((stats.correctAnswers / stats.totalQuestions) * 100);
  };

  const getCategoryAccuracy = (category: string): number => {
    const catStats = categoryStats[category];
    if (!catStats || catStats.totalQuestions === 0) return 0;
    return Math.round((catStats.correctAnswers / catStats.totalQuestions) * 100);
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}時間`;
    }
    if (minutes > 0) {
      return `${minutes}分`;
    }
    return '0時間';
  };

  const getCategoryName = (category: string): string => {
    const names: any = {
      takkengyouhou: '宅建業法',
      minpou: '民法等',
      hourei: '法令上の制限',
      zei: '税・その他',
    };
    return names[category] || category;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ZenColors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* 総合統計 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>総合統計</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats?.totalQuestions || 0}</Text>
              <Text style={styles.statLabel}>総問題数</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{getAccuracyRate()}%</Text>
              <Text style={styles.statLabel}>正答率</Text>
            </View>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats?.currentStreak || 0}日</Text>
              <Text style={styles.statLabel}>学習日数</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatTime(stats?.totalStudyTime || 0)}</Text>
              <Text style={styles.statLabel}>学習時間</Text>
            </View>
          </View>
        </View>

        {/* 分野別正答率 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>分野別正答率</Text>
          <View style={styles.card}>
            {['takkengyouhou', 'minpou', 'hourei', 'zei'].map((category) => {
              const accuracy = getCategoryAccuracy(category);
              return (
                <View key={category} style={styles.categoryRow}>
                  <Text style={styles.categoryName}>{getCategoryName(category)}</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${accuracy}%` }]} />
                  </View>
                  <Text style={styles.percentage}>{accuracy}%</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ◯×問題の正答率推移 */}
        {isPremium && trueFalseResults.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>◯×問題の正答率推移</Text>
            <View style={styles.card}>
              <View style={styles.graphContainer}>
                {trueFalseResults.slice().reverse().map((result, index) => {
                  const maxHeight = 150;
                  const barHeight = (result.accuracy / 100) * maxHeight;
                  const date = new Date(result.completedAt);
                  const dateLabel = `${date.getMonth() + 1}/${date.getDate()}`;
                  
                  return (
                    <View key={index} style={styles.graphBar}>
                      <View style={styles.barContainer}>
                        <View style={[styles.bar, { height: barHeight }]}>
                          <Text style={styles.barLabel}>{result.accuracy}%</Text>
                        </View>
                      </View>
                      <Text style={styles.barDateLabel}>{dateLabel}</Text>
                    </View>
                  );
                })}
              </View>
              <View style={styles.graphLegend}>
                <Text style={styles.legendText}>最近{trueFalseResults.length}回の結果</Text>
                <Text style={styles.legendText}>平均: {Math.round(trueFalseResults.reduce((sum, r) => sum + r.accuracy, 0) / trueFalseResults.length)}%</Text>
              </View>
            </View>
          </View>
        )}

        {/* AI弱点分析 */}
        {isPremium && stats && stats.totalQuestions > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🤖 AI弱点分析</Text>
            <View style={styles.card}>
              {!aiAnalysis ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.analysisButton,
                    pressed && styles.buttonPressed,
                    loadingAnalysis && styles.buttonDisabled,
                  ]}
                  onPress={handleGetAIAnalysis}
                  disabled={loadingAnalysis}
                >
                  {loadingAnalysis ? (
                    <ActivityIndicator size="small" color={ZenColors.text.inverse} />
                  ) : (
                    <Text style={styles.analysisButtonText}>弱点を分析する</Text>
                  )}
                </Pressable>
              ) : (
                <View>
                  <Text style={styles.aiAnalysisText}>{aiAnalysis}</Text>
                  <Pressable
                    style={({ pressed }) => [
                      styles.refreshButton,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={handleGetAIAnalysis}
                  >
                    <Text style={styles.refreshButtonText}>🔄 再分析</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        )}

        {/* 学習の進捗 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>学習の進捗</Text>
          <View style={styles.card}>
            <Text style={styles.progressTitle}>全体の進捗</Text>
            <View style={styles.largeProgressBar}>
              <View style={[styles.largeProgressFill, { width: `${Math.min(100, ((stats?.totalQuestions || 0) / 500) * 100)}%` }]} />
            </View>
            <Text style={styles.progressText}>{stats?.totalQuestions || 0} / 500問</Text>
          </View>
        </View>

        {/* 最近の成績 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>最近の成績</Text>
          <View style={styles.card}>
            {stats && stats.totalQuestions > 0 ? (
              <View>
                <Text style={styles.recentText}>正解: {stats.correctAnswers}問</Text>
                <Text style={styles.recentText}>不正解: {stats.totalQuestions - stats.correctAnswers}問</Text>
                <Text style={styles.recentText}>正答率: {getAccuracyRate()}%</Text>
              </View>
            ) : (
              <Text style={styles.emptyText}>まだデータがありません</Text>
            )}
          </View>
        </View>

        {/* 弱点分野 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>弱点分野</Text>
          <View style={styles.card}>
            {stats && stats.totalQuestions > 0 ? (
              <View>
                {['takkengyouhou', 'minpou', 'hourei', 'zei']
                  .map((category) => ({
                    category,
                    accuracy: getCategoryAccuracy(category),
                    name: getCategoryName(category),
                  }))
                  .filter((item) => item.accuracy < 70 && categoryStats[item.category]?.totalQuestions > 0)
                  .sort((a, b) => a.accuracy - b.accuracy)
                  .map((item) => (
                    <View key={item.category} style={styles.weaknessRow}>
                      <Text style={styles.weaknessName}>{item.name}</Text>
                      <Text style={styles.weaknessAccuracy}>{item.accuracy}%</Text>
                    </View>
                  ))}
                {['takkengyouhou', 'minpou', 'hourei', 'zei'].every(
                  (cat) => getCategoryAccuracy(cat) >= 70 || categoryStats[cat]?.totalQuestions === 0
                ) && (
                  <Text style={styles.emptyText}>弱点分野はありません</Text>
                )}
              </View>
            ) : (
              <Text style={styles.emptyText}>
                学習を進めると、弱点分野が表示されます
              </Text>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ZenColors.background,
  },
  content: {
    padding: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ZenColors.background,
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
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: ZenColors.surface,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: ZenColors.border,
    alignItems: 'center',
    ...Shadow.sm,
  },
  statValue: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: ZenColors.primary,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: FontSize.sm,
    color: ZenColors.text.secondary,
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
    marginBottom: Spacing.md,
  },
  categoryName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: ZenColors.text.primary,
    marginBottom: Spacing.xs,
  },
  progressBar: {
    height: 8,
    backgroundColor: ZenColors.gray[200],
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: ZenColors.primary,
  },
  percentage: {
    fontSize: FontSize.sm,
    color: ZenColors.text.secondary,
    textAlign: 'right',
  },
  progressTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: ZenColors.text.primary,
    marginBottom: Spacing.md,
  },
  largeProgressBar: {
    height: 16,
    backgroundColor: ZenColors.gray[200],
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  largeProgressFill: {
    height: '100%',
    backgroundColor: ZenColors.primary,
  },
  progressText: {
    fontSize: FontSize.md,
    color: ZenColors.text.secondary,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: FontSize.md,
    color: ZenColors.text.secondary,
    textAlign: 'center',
  },
  recentText: {
    fontSize: FontSize.md,
    color: ZenColors.text.primary,
    marginBottom: Spacing.xs,
  },
  weaknessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: ZenColors.border,
  },
  weaknessName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: ZenColors.text.primary,
  },
  weaknessAccuracy: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: ZenColors.error,
  },
  analysisButton: {
    backgroundColor: ZenColors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadow.md,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  analysisButtonText: {
    color: ZenColors.text.inverse,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  aiAnalysisText: {
    fontSize: FontSize.md,
    color: ZenColors.text.primary,
    lineHeight: FontSize.md * 1.7,
    marginBottom: Spacing.md,
  },
  refreshButton: {
    backgroundColor: ZenColors.gray[200],
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
  },
  refreshButtonText: {
    color: ZenColors.text.secondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  graphContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 180,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  graphBar: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: Spacing.xs,
  },
  barContainer: {
    width: '100%',
    height: 150,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '80%',
    backgroundColor: ZenColors.primary,
    borderTopLeftRadius: BorderRadius.sm,
    borderTopRightRadius: BorderRadius.sm,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: Spacing.xs,
    minHeight: 30,
  },
  barLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: ZenColors.text.inverse,
  },
  barDateLabel: {
    fontSize: FontSize.xs,
    color: ZenColors.text.secondary,
    marginTop: Spacing.xs,
  },
  graphLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: ZenColors.border,
  },
  legendText: {
    fontSize: FontSize.sm,
    color: ZenColors.text.secondary,
  },
});
