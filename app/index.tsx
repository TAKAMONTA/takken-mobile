import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ZenColors, Spacing, FontSize, BorderRadius, Shadow } from '../constants/Colors';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* ヒーローセクション */}
        <View style={styles.hero}>
          <Text style={styles.title}>宅建合格ロード</Text>
          <Text style={styles.subtitle}>静寂の中で、確かな知識を深める。</Text>
        </View>

        {/* CTAボタン */}
        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.buttonText}>学習を始める</Text>
        </Pressable>

        {/* 特徴カード */}
        <View style={styles.features}>
          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>AI予想問題</Text>
            <Text style={styles.featureDescription}>
              800-1000問の厳選された問題で効率的に学習
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>詳細な分析</Text>
            <Text style={styles.featureDescription}>
              学習進捗を可視化し、弱点を克服
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>禅デザイン</Text>
            <Text style={styles.featureDescription}>
              集中力を高める落ち着いた学習環境
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ZenColors.background,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: '700',
    color: ZenColors.text.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.lg,
    color: ZenColors.text.secondary,
    textAlign: 'center',
    lineHeight: FontSize.lg * 1.7,
  },
  button: {
    backgroundColor: ZenColors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    ...Shadow.md,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: ZenColors.text.inverse,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  features: {
    gap: Spacing.md,
  },
  featureCard: {
    backgroundColor: ZenColors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: ZenColors.border,
    ...Shadow.sm,
  },
  featureTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: ZenColors.text.primary,
    marginBottom: Spacing.xs,
  },
  featureDescription: {
    fontSize: FontSize.md,
    color: ZenColors.text.secondary,
    lineHeight: FontSize.md * 1.7,
  },
});
