import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { getAllQuestionCounts } from '../../lib/question-service';
import { ZenColors, Spacing, FontSize, BorderRadius, Shadow } from '../../constants/Colors';

const categories = [
  {
    id: 'takkengyouhou',
    name: '宅建業法',
    description: '宅建業法に関する問題',
    questionCount: 250,
    color: ZenColors.primary,
    icon: '📚',
  },
  {
    id: 'minpou',
    name: '民法等',
    description: '民法・借地借家法に関する問題',
    questionCount: 300,
    color: '#7B9FAD',
    icon: '⚖️',
  },
  {
    id: 'hourei',
    name: '法令上の制限',
    description: '都市計画法・建築基準法等',
    questionCount: 200,
    color: '#D4A574',
    icon: '🏛️',
  },
  {
    id: 'zeihou',
    name: '税・その他',
    description: '税法・不動産鑑定評価等',
    questionCount: 150,
    color: '#6B8E6F',
    icon: '💰',
  },
];

export default function PracticeScreen() {
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuestionCounts();
  }, []);

  const loadQuestionCounts = async () => {
    try {
      const counts = await getAllQuestionCounts();
      setQuestionCounts(counts);
    } catch (error) {
      console.error('問題数の読み込みに失敗しました:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryCount = (categoryId: string): number => {
    return questionCounts[categoryId] || 0;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={ZenColors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.title}>学習分野を選択</Text>
          <Text style={styles.subtitle}>
            4つの分野から学習したい分野を選んでください
          </Text>
        </View>

        {/* 分野カード */}
        <View style={styles.categories}>
          {categories.map((category) => (
            <Pressable
              key={category.id}
              style={({ pressed }) => [
                styles.categoryCard,
                pressed && styles.categoryCardPressed,
              ]}
              onPress={() => router.push(`/question/${category.id}`)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <View style={styles.categoryContent}>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryDescription}>
                  {category.description}
                </Text>
                <Text style={styles.categoryCount}>
                  {getCategoryCount(category.id)}問
                </Text>
              </View>
            </Pressable>
          ))}
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: Spacing.md,
  },
  header: {
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: ZenColors.text.primary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: ZenColors.text.secondary,
    lineHeight: FontSize.md * 1.7,
  },
  categories: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  categoryCard: {
    backgroundColor: ZenColors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: ZenColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  categoryCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  categoryIcon: {
    fontSize: 40,
    width: 48,
    height: 48,
    textAlign: 'center',
    lineHeight: 48,
  },
  categoryContent: {
    flex: 1,
  },
  categoryName: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: ZenColors.text.primary,
    marginBottom: Spacing.xs,
  },
  categoryDescription: {
    fontSize: FontSize.sm,
    color: ZenColors.text.secondary,
    marginBottom: Spacing.xs,
  },
  categoryCount: {
    fontSize: FontSize.sm,
    color: ZenColors.primary,
    fontWeight: '600',
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
  modeCard: {
    backgroundColor: ZenColors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: ZenColors.border,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  modeCardPressed: {
    opacity: 0.8,
  },
  modeTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: ZenColors.text.primary,
    marginBottom: Spacing.xs,
  },
  modeDescription: {
    fontSize: FontSize.md,
    color: ZenColors.text.secondary,
  },
});
