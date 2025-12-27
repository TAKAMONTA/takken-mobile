import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ZenColors, Spacing, FontSize, BorderRadius, Shadow } from '../../constants/Colors';

const categories = [
  {
    id: 'takkengyouhou',
    name: '宅建業法',
    description: '宅建業法に関する問題',
    questionCount: 250,
    color: ZenColors.primary,
  },
  {
    id: 'minpou',
    name: '民法等',
    description: '民法・借地借家法に関する問題',
    questionCount: 300,
    color: '#7B9FAD',
  },
  {
    id: 'hourei',
    name: '法令上の制限',
    description: '都市計画法・建築基準法等',
    questionCount: 200,
    color: '#D4A574',
  },
  {
    id: 'zeihou',
    name: '税・その他',
    description: '税法・不動産鑑定評価等',
    questionCount: 150,
    color: '#6B8E6F',
  },
];

export default function PracticeScreen() {
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
              <View
                style={[
                  styles.categoryIcon,
                  { backgroundColor: category.color },
                ]}
              />
              <View style={styles.categoryContent}>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryDescription}>
                  {category.description}
                </Text>
                <Text style={styles.categoryCount}>
                  {category.questionCount}問
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* その他の学習モード */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>その他の学習モード</Text>
          
          <Pressable
            style={({ pressed }) => [
              styles.modeCard,
              pressed && styles.modeCardPressed,
            ]}
          >
            <Text style={styles.modeTitle}>○×問題</Text>
            <Text style={styles.modeDescription}>
              正誤問題で素早く知識を確認
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.modeCard,
              pressed && styles.modeCardPressed,
            ]}
          >
            <Text style={styles.modeTitle}>模擬試験</Text>
            <Text style={styles.modeDescription}>
              本番形式で実力を試す
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.modeCard,
              pressed && styles.modeCardPressed,
            ]}
          >
            <Text style={styles.modeTitle}>弱点克服</Text>
            <Text style={styles.modeDescription}>
              間違えた問題を重点的に学習
            </Text>
          </Pressable>
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
  header: {
    marginBottom: Spacing.xl,
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
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  categoryCard: {
    backgroundColor: ZenColors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: ZenColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadow.sm,
  },
  categoryCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
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
