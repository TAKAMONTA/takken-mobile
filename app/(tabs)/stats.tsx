import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { getStudyStats, StudyStats, getCategoryStats } from '../../lib/firestore-service';
import { ZenColors, Spacing, FontSize, BorderRadius, Shadow } from '../../constants/Colors';

export default function StatsScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [categoryStats, setCategoryStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

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
      
      // Load category stats
      const categories = ['takkengyouhou', 'minpou', 'hourei', 'zei'];
      const categoryData: any = {};
      for (const category of categories) {
        const catStats = await getCategoryStats(user.uid, category);
        categoryData[category] = catStats;
      }
      setCategoryStats(categoryData);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
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
    padding: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ZenColors.background,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: ZenColors.text.primary,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: ZenColors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
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
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
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
});
