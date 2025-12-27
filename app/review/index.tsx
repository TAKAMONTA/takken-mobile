import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../../lib/AuthContext';
import { getUserProfile, getIncorrectQuestions, StudySession } from '../../lib/firestore-service';
import { getQuestionById } from '../../lib/question-service';
import { Question } from '../../lib/types';
import { ZenColors, Spacing, FontSize, BorderRadius, Shadow } from '../../constants/Colors';

export default function ReviewScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [incorrectSessions, setIncorrectSessions] = useState<StudySession[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

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
          '間隔反復学習機能はプレミアムプラン限定です',
          [
            { text: 'キャンセル', onPress: () => router.back() },
            { text: 'プレミアムプランを見る', onPress: () => router.push('/subscription') },
          ]
        );
        return;
      }

      await loadIncorrectQuestions();
    } catch (error) {
      console.error('Error checking premium status:', error);
      Alert.alert('エラー', 'データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const loadIncorrectQuestions = async () => {
    if (!user) return;

    try {
      const sessions = await getIncorrectQuestions(user.uid, 50);
      setIncorrectSessions(sessions);

      // 問題IDのリストを取得
      const questionIds = [...new Set(sessions.map(s => s.questionId))];
      
      // 各問題を取得
      const loadedQuestions: Question[] = [];
      for (const questionId of questionIds) {
        try {
          const question = await getQuestionById(questionId);
          if (question) {
            loadedQuestions.push(question);
          }
        } catch (error) {
          console.error(`Error loading question ${questionId}:`, error);
        }
      }
      
      setQuestions(loadedQuestions);
    } catch (error) {
      console.error('Error loading incorrect questions:', error);
      Alert.alert('エラー', '復習問題の取得に失敗しました');
    }
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

  const getQuestionCount = (category: string): number => {
    return incorrectSessions.filter(s => s.category === category).length;
  };

  const categories = ['takkengyouhou', 'minpou', 'hourei', 'zei'];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ZenColors.primary} />
        <Text style={styles.loadingText}>復習問題を読み込み中...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            style={styles.backButtonContainer}
          >
            <Text style={styles.backButton}>← 戻る</Text>
          </Pressable>
        </View>

        {/* タイトル */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>🔄 間隔反復学習</Text>
          <Text style={styles.subtitle}>
            間違えた問題を効率的に復習して、確実に身につけましょう
          </Text>
        </View>

        {/* 統計 */}
        <View style={styles.section}>
          <View style={styles.statsCard}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>復習対象問題</Text>
              <Text style={styles.statValue}>{questions.length}問</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>間違えた回数</Text>
              <Text style={styles.statValue}>{incorrectSessions.length}回</Text>
            </View>
          </View>
        </View>

        {/* カテゴリ別復習 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>カテゴリ別復習</Text>
          {categories.map((category) => {
            const count = getQuestionCount(category);
            if (count === 0) return null;

            return (
              <Pressable
                key={category}
                style={({ pressed }) => [
                  styles.categoryCard,
                  pressed && styles.categoryCardPressed,
                ]}
                onPress={() => router.push(`/review/${category}`)}
              >
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryName}>{getCategoryName(category)}</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{count}問</Text>
                  </View>
                </View>
                <Text style={styles.categoryDescription}>
                  間違えた問題を復習します
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* 全問復習 */}
        {questions.length > 0 && (
          <View style={styles.section}>
            <Pressable
              style={({ pressed }) => [
                styles.allReviewButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => router.push('/review/all')}
            >
              <Text style={styles.allReviewButtonText}>すべての復習問題を開始</Text>
              <Text style={styles.allReviewButtonSubtext}>
                {questions.length}問をランダムに出題
              </Text>
            </Pressable>
          </View>
        )}

        {/* 空の状態 */}
        {questions.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>✨</Text>
            <Text style={styles.emptyTitle}>復習問題がありません</Text>
            <Text style={styles.emptyText}>
              問題を解いて、間違えた問題が復習対象として表示されます
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => router.push('/(tabs)/practice')}
            >
              <Text style={styles.buttonText}>問題演習を始める</Text>
            </Pressable>
          </View>
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
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ZenColors.background,
    padding: Spacing.xl,
  },
  loadingText: {
    fontSize: FontSize.md,
    color: ZenColors.text.secondary,
    marginTop: Spacing.md,
  },
  header: {
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
    marginLeft: -Spacing.md,
  },
  backButton: {
    fontSize: FontSize.md,
    color: ZenColors.primary,
    fontWeight: '600',
  },
  titleSection: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: '700',
    color: ZenColors.text.primary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: ZenColors.text.secondary,
    textAlign: 'center',
    lineHeight: FontSize.md * 1.7,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: ZenColors.text.primary,
    marginBottom: Spacing.md,
  },
  statsCard: {
    backgroundColor: ZenColors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: ZenColors.border,
    ...Shadow.sm,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statLabel: {
    fontSize: FontSize.md,
    color: ZenColors.text.secondary,
  },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: ZenColors.primary,
  },
  categoryCard: {
    backgroundColor: ZenColors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: ZenColors.border,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  categoryCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  categoryName: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: ZenColors.text.primary,
  },
  countBadge: {
    backgroundColor: ZenColors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  countText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: ZenColors.text.inverse,
  },
  categoryDescription: {
    fontSize: FontSize.md,
    color: ZenColors.text.secondary,
  },
  allReviewButton: {
    backgroundColor: ZenColors.primary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadow.md,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  allReviewButtonText: {
    color: ZenColors.text.inverse,
    fontSize: FontSize.lg,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  allReviewButtonSubtext: {
    color: ZenColors.text.inverse,
    fontSize: FontSize.sm,
    opacity: 0.9,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: '600',
    color: ZenColors.text.primary,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: ZenColors.text.secondary,
    textAlign: 'center',
    lineHeight: FontSize.md * 1.7,
    marginBottom: Spacing.xl,
  },
  button: {
    backgroundColor: ZenColors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    ...Shadow.md,
  },
  buttonText: {
    color: ZenColors.text.inverse,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});
