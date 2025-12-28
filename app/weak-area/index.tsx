import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../../lib/AuthContext';
import { getMockExamResults, getAllCategoryStats, getUserProfile } from '../../lib/firestore-service';
import { analyzeWeakAreas, WeakArea } from '../../lib/ai-service';
import { ZenColors, Spacing, FontSize, BorderRadius, Shadow } from '../../constants/Colors';

export default function WeakAreaAnalysisScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([]);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    checkPremiumAndLoadData();
  }, [user]);

  const checkPremiumAndLoadData = async () => {
    if (!user) {
      router.replace('/(auth)/login');
      return;
    }

    try {
      const profile = await getUserProfile(user.uid);
      setIsPremium(profile?.isPremium || false);

      if (!profile?.isPremium) {
        Alert.alert(
          'プレミアム機能',
          '弱点分野分析はプレミアムプラン限定です',
          [
            { text: 'キャンセル', onPress: () => router.back() },
            { text: 'プレミアムプランを見る', onPress: () => router.push('/subscription') },
          ]
        );
        return;
      }

      await loadWeakAreas();
    } catch (error) {
      console.error('Error checking premium status:', error);
      Alert.alert('エラー', 'データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const loadWeakAreas = async () => {
    if (!user) return;

    setAnalyzing(true);
    try {
      // Get mock exam results
      const mockExamResults = await getMockExamResults(user.uid);

      // Get study stats
      const categoryStats = await getAllCategoryStats(user.uid);

      if (mockExamResults.length === 0 && categoryStats.length === 0) {
        Alert.alert('データ不足', 'まず問題を解いてから分析を行ってください');
        setAnalyzing(false);
        return;
      }

      // Prepare data for analysis
      const studyStats = {
        totalQuestions: categoryStats.reduce((sum, cat) => sum + cat.totalQuestions, 0),
        correctAnswers: categoryStats.reduce((sum, cat) => sum + cat.correctAnswers, 0),
        categoryStats: categoryStats.reduce((acc, cat) => {
          acc[cat.category] = {
            total: cat.totalQuestions,
            correct: cat.correctAnswers,
          };
          return acc;
        }, {} as { [key: string]: { total: number; correct: number } }),
      };

      // Analyze weak areas
      const areas = await analyzeWeakAreas({
        mockExamResults: mockExamResults.map(result => ({
          score: result.score,
          totalQuestions: result.totalQuestions,
          categoryStats: result.categoryStats,
        })),
        studyStats,
      });

      setWeakAreas(areas);
    } catch (error) {
      console.error('Error analyzing weak areas:', error);
      Alert.alert('エラー', '分析に失敗しました');
    } finally {
      setAnalyzing(false);
    }
  };

  const getPriorityColor = (priority: number): string => {
    if (priority >= 5) return '#EF4444'; // Red
    if (priority >= 4) return '#F59E0B'; // Orange
    if (priority >= 3) return '#EAB308'; // Yellow
    if (priority >= 2) return '#10B981'; // Green
    return '#3B82F6'; // Blue
  };

  const getPriorityLabel = (priority: number): string => {
    if (priority >= 5) return '最優先';
    if (priority >= 4) return '優先';
    if (priority >= 3) return '重要';
    if (priority >= 2) return '推奨';
    return '補強';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ZenColors.primary} />
      </View>
    );
  }

  if (!isPremium) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Text style={styles.backButton}>← 戻る</Text>
          </Pressable>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>🎯 弱点分野分析</Text>
          <Text style={styles.subtitle}>
            優先的に学習すべき分野を特定します
          </Text>
        </View>

        {/* Analyze Button */}
        {weakAreas.length === 0 && (
          <Pressable
            style={({ pressed }) => [
              styles.analyzeButton,
              pressed && styles.analyzeButtonPressed,
            ]}
            onPress={loadWeakAreas}
            disabled={analyzing}
          >
            {analyzing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.analyzeButtonText}>分析を開始する</Text>
            )}
          </Pressable>
        )}

        {/* Weak Areas List */}
        {weakAreas.length > 0 && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>優先順位</Text>
              {weakAreas.map((area, index) => (
                <View key={index} style={styles.weakAreaCard}>
                  <View style={styles.weakAreaHeader}>
                    <View style={styles.weakAreaTitleRow}>
                      <Text style={styles.weakAreaCategory}>{area.category}</Text>
                      <View
                        style={[
                          styles.priorityBadge,
                          { backgroundColor: getPriorityColor(area.priority) },
                        ]}
                      >
                        <Text style={styles.priorityText}>
                          {getPriorityLabel(area.priority)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.weakAreaRate}>
                      正答率: {area.correctRate}%
                    </Text>
                  </View>

                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>解答数</Text>
                      <Text style={styles.statValue}>{area.totalQuestions}問</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>間違い</Text>
                      <Text style={styles.statValue}>{area.incorrectCount}問</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>改善期待値</Text>
                      <Text style={styles.statValue}>+{area.improvementPotential}点</Text>
                    </View>
                  </View>

                  <View style={styles.recommendationBox}>
                    <Text style={styles.recommendationTitle}>📚 学習推奨</Text>
                    <Text style={styles.recommendationText}>
                      学習時間: {area.recommendedStudyTime}
                    </Text>
                    <Text style={styles.recommendationText}>
                      推奨問題数: {area.recommendedQuestionCount}問
                    </Text>
                  </View>

                  {area.advice && (
                    <View style={styles.adviceBox}>
                      <Text style={styles.adviceTitle}>💡 AIアドバイス</Text>
                      <Text style={styles.adviceText}>{area.advice}</Text>
                    </View>
                  )}

                  <Pressable
                    style={({ pressed }) => [
                      styles.studyButton,
                      pressed && styles.studyButtonPressed,
                    ]}
                    onPress={() => {
                      // Navigate to category practice
                      const categoryMap: { [key: string]: string } = {
                        '宅建業法': 'takkengyouhou',
                        '民法等': 'minpou',
                        '法令上の制限': 'hourei',
                        '税・その他': 'zei',
                      };
                      const categoryId = categoryMap[area.category];
                      if (categoryId) {
                        router.push(`/question/${categoryId}`);
                      }
                    }}
                  >
                    <Text style={styles.studyButtonText}>この分野を学習する →</Text>
                  </Pressable>
                </View>
              ))}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.reanalyzeButton,
                pressed && styles.reanalyzeButtonPressed,
              ]}
              onPress={loadWeakAreas}
              disabled={analyzing}
            >
              {analyzing ? (
                <ActivityIndicator color={ZenColors.primary} />
              ) : (
                <Text style={styles.reanalyzeButtonText}>再分析する</Text>
              )}
            </Pressable>
          </>
        )}
      </View>
    </ScrollView>
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
  },
  content: {
    padding: Spacing.md,
  },
  header: {
    marginBottom: Spacing.md,
  },
  backButton: {
    fontSize: FontSize.md,
    color: ZenColors.primary,
    fontWeight: '600',
  },
  titleSection: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: ZenColors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: ZenColors.textSecondary,
  },
  analyzeButton: {
    backgroundColor: ZenColors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadow.small,
  },
  analyzeButtonPressed: {
    opacity: 0.8,
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: ZenColors.text,
    marginBottom: Spacing.md,
  },
  weakAreaCard: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    ...Shadow.small,
  },
  weakAreaHeader: {
    marginBottom: Spacing.sm,
  },
  weakAreaTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  weakAreaCategory: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: ZenColors.text,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  priorityText: {
    color: '#FFFFFF',
    fontSize: FontSize.xs,
    fontWeight: 'bold',
  },
  weakAreaRate: {
    fontSize: FontSize.md,
    color: ZenColors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: ZenColors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: ZenColors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    color: ZenColors.text,
  },
  recommendationBox: {
    backgroundColor: ZenColors.backgroundSecondary,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  recommendationTitle: {
    fontSize: FontSize.sm,
    fontWeight: 'bold',
    color: ZenColors.text,
    marginBottom: Spacing.xs,
  },
  recommendationText: {
    fontSize: FontSize.sm,
    color: ZenColors.textSecondary,
  },
  adviceBox: {
    backgroundColor: '#FEF3C7',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  adviceTitle: {
    fontSize: FontSize.sm,
    fontWeight: 'bold',
    color: ZenColors.text,
    marginBottom: Spacing.xs,
  },
  adviceText: {
    fontSize: FontSize.sm,
    color: ZenColors.text,
    lineHeight: 20,
  },
  studyButton: {
    backgroundColor: ZenColors.primary,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  studyButtonPressed: {
    opacity: 0.8,
  },
  studyButtonText: {
    color: '#FFFFFF',
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  reanalyzeButton: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ZenColors.primary,
    marginBottom: Spacing.lg,
  },
  reanalyzeButtonPressed: {
    opacity: 0.8,
  },
  reanalyzeButtonText: {
    color: ZenColors.primary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});
