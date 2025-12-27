import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ZenColors, Spacing, FontSize, BorderRadius, Shadow } from '../../constants/Colors';

export default function StatsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* 総合統計 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>総合統計</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>総問題数</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>0%</Text>
              <Text style={styles.statLabel}>正答率</Text>
            </View>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>0日</Text>
              <Text style={styles.statLabel}>学習日数</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>0時間</Text>
              <Text style={styles.statLabel}>学習時間</Text>
            </View>
          </View>
        </View>

        {/* 分野別正答率 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>分野別正答率</Text>
          <View style={styles.card}>
            <View style={styles.categoryRow}>
              <Text style={styles.categoryName}>宅建業法</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '0%' }]} />
              </View>
              <Text style={styles.percentage}>0%</Text>
            </View>
            <View style={styles.categoryRow}>
              <Text style={styles.categoryName}>民法等</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '0%' }]} />
              </View>
              <Text style={styles.percentage}>0%</Text>
            </View>
            <View style={styles.categoryRow}>
              <Text style={styles.categoryName}>法令上の制限</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '0%' }]} />
              </View>
              <Text style={styles.percentage}>0%</Text>
            </View>
            <View style={styles.categoryRow}>
              <Text style={styles.categoryName}>税・その他</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '0%' }]} />
              </View>
              <Text style={styles.percentage}>0%</Text>
            </View>
          </View>
        </View>

        {/* 学習の進捗 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>学習の進捗</Text>
          <View style={styles.card}>
            <Text style={styles.progressTitle}>全体の進捗</Text>
            <View style={styles.largeProgressBar}>
              <View style={[styles.largeProgressFill, { width: '0%' }]} />
            </View>
            <Text style={styles.progressText}>0 / 900問</Text>
          </View>
        </View>

        {/* 最近の成績 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>最近の成績</Text>
          <View style={styles.card}>
            <Text style={styles.emptyText}>まだデータがありません</Text>
          </View>
        </View>

        {/* 弱点分野 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>弱点分野</Text>
          <View style={styles.card}>
            <Text style={styles.emptyText}>
              学習を進めると、弱点分野が表示されます
            </Text>
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
});
