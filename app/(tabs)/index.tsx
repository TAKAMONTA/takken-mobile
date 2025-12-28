import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../../lib/AuthContext';
import { getStudyStats, StudyStats, getUserProfile, UserProfile, getCategoryStats } from '../../lib/firestore-service';
import { generateStudyAdvice } from '../../lib/ai-service';
import { ZenColors, Spacing, FontSize, BorderRadius, Shadow } from '../../constants/Colors';

export default function DashboardScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);

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
      
      const userProfile = await getUserProfile(user.uid);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}時間${minutes}分`;
    }
    return `${minutes}分`;
  };

  const getAccuracyRate = (): number => {
    if (!stats || stats.totalQuestions === 0) return 0;
    return Math.round((stats.correctAnswers / stats.totalQuestions) * 100);
  };

  const handleGetAIAdvice = async () => {
    if (!profile?.isPremium) {
      Alert.alert('プレミアム機能', 'AI学習アドバイザーはプレミアムプラン限定です', [
        { text: 'キャンセル' },
        { text: 'プレミアムプランを見る', onPress: () => router.push('/subscription') },
      ]);
      return;
    }

    if (!user || !stats) return;

    setLoadingAdvice(true);
    try {
      const categoryStats = await getCategoryStats(user.uid);
      const advice = await generateStudyAdvice({
        totalQuestions: stats.totalQuestions,
        correctRate: getAccuracyRate(),
        studyDays: stats.studyDays,
        categoryStats: categoryStats.map(cat => ({
          category: cat.category,
          correctRate: cat.correctRate,
          count: cat.totalQuestions,
        })),
      });
      setAiAdvice(advice);
    } catch (error) {
      Alert.alert('エラー', 'AIアドバイスの生成に失敗しました');
    } finally {
      setLoadingAdvice(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* ウェルカムメッセージ */}
        <View style={styles.welcome}>
          <Text style={styles.welcomeText}>おかえりなさい</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* 統計 */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={ZenColors.primary} />
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>学習統計</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats?.totalQuestions || 0}</Text>
                <Text style={styles.statLabel}>総問題数</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{getAccuracyRate()}%</Text>
                <Text style={styles.statLabel}>正答率</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{formatTime(stats?.totalStudyTime || 0)}</Text>
                <Text style={styles.statLabel}>学習時間</Text>
              </View>
            </View>
          </View>
        )}

        {/* 学習ストリーク */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>学習ストリーク</Text>
          <View style={styles.card}>
            <Text style={styles.streakValue}>{stats?.currentStreak || 0}日</Text>
            <Text style={styles.streakLabel}>連続学習日数</Text>
          </View>
        </View>

        {/* プレミアム機能 */}
        {profile?.isPremium && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✨ プレミアム機能</Text>
            <View style={styles.premiumGrid}>
              <Pressable
                style={({ pressed }) => [
                  styles.premiumCard,
                  pressed && styles.premiumCardPressed,
                ]}
                onPress={() => router.push('/ai-practice/takkengyouhou')}
              >
                <Text style={styles.premiumIcon}>🤖</Text>
                <Text style={styles.premiumTitle}>AI問題生成</Text>
                <Text style={styles.premiumDescription}>無制限でAIが問題を生成</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.premiumCard,
                  pressed && styles.premiumCardPressed,
                ]}
                onPress={() => router.push('/review')}
              >
                <Text style={styles.premiumIcon}>🔄</Text>
                <Text style={styles.premiumTitle}>間隔反復学習</Text>
                <Text style={styles.premiumDescription}>間違えた問題を復習</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.premiumCard,
                  pressed && styles.premiumCardPressed,
                ]}
                onPress={() => router.push('/true-false')}
              >
                <Text style={styles.premiumIcon}>◯×</Text>
                <Text style={styles.premiumTitle}>◯×問題</Text>
                <Text style={styles.premiumDescription}>正誤判定で知識を確認</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.premiumCard,
                  pressed && styles.premiumCardPressed,
                ]}
                onPress={() => router.push('/mock-exam')}
              >
                <Text style={styles.premiumIcon}>📝</Text>
                <Text style={styles.premiumTitle}>模擬試験</Text>
                <Text style={styles.premiumDescription}>本番形式で実力を試す</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* AI学習アドバイザー */}
        {profile?.isPremium && stats && stats.totalQuestions > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🧠 AI学習アドバイザー</Text>
            <View style={styles.card}>
              {!aiAdvice ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    pressed && styles.buttonPressed,
                    loadingAdvice && styles.buttonDisabled,
                  ]}
                  onPress={handleGetAIAdvice}
                  disabled={loadingAdvice}
                >
                  {loadingAdvice ? (
                    <ActivityIndicator size="small" color={ZenColors.text.inverse} />
                  ) : (
                    <Text style={styles.buttonText}>AIアドバイスを取得</Text>
                  )}
                </Pressable>
              ) : (
                <View>
                  <Text style={styles.aiAdviceText}>{aiAdvice}</Text>
                  <Pressable
                    style={({ pressed }) => [
                      styles.refreshButton,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={handleGetAIAdvice}
                  >
                    <Text style={styles.refreshButtonText}>🔄 更新</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        )}

        {/* おすすめの学習 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>おすすめの学習</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>宅建業法</Text>
            <Text style={styles.cardDescription}>
              最も出題頻度の高い分野です。まずはここから始めましょう。
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => router.push('/question/takkengyouhou')}
            >
              <Text style={styles.buttonText}>学習を開始</Text>
            </Pressable>
          </View>
        </View>

        {/* 最近の学習履歴 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>最近の学習</Text>
          <View style={styles.card}>
            <Text style={styles.emptyText}>まだ学習履歴がありません</Text>
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
  welcome: {
    marginBottom: Spacing.xl,
  },
  welcomeText: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: ZenColors.text.primary,
    marginBottom: Spacing.xs,
  },
  email: {
    fontSize: FontSize.md,
    color: ZenColors.text.secondary,
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
  streakValue: {
    fontSize: FontSize.xxxl,
    fontWeight: '700',
    color: ZenColors.primary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  streakLabel: {
    fontSize: FontSize.md,
    color: ZenColors.text.secondary,
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: ZenColors.text.primary,
    marginBottom: Spacing.xs,
  },
  cardDescription: {
    fontSize: FontSize.md,
    color: ZenColors.text.secondary,
    lineHeight: FontSize.md * 1.7,
    marginBottom: Spacing.md,
  },
  button: {
    backgroundColor: ZenColors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: ZenColors.text.inverse,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: FontSize.md,
    color: ZenColors.text.secondary,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  premiumGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  premiumCard: {
    width: '48%',
    backgroundColor: '#FFF9E6',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: '#FFD700',
    alignItems: 'center',
    ...Shadow.sm,
  },
  premiumCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  premiumIcon: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  premiumTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: ZenColors.text.primary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  premiumDescription: {
    fontSize: FontSize.sm,
    color: ZenColors.text.secondary,
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  aiAdviceText: {
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
});
