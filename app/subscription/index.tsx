import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../lib/AuthContext';
import { updatePremiumStatus } from '../../lib/firestore-service';
import { ZenColors, Spacing, FontSize, BorderRadius, Shadow } from '../../constants/Colors';

export default function SubscriptionScreen() {
  const { user } = useAuth();

  const handleSubscribe = async () => {
    // TODO: 実際の決済処理を実装
    // 現在はデモとして即座にプレミアムステータスを付与
    Alert.alert(
      '確認',
      '月額プランに登録しますか？\n\n※現在はデモモードです。実際の課金は発生しません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '登録する',
          onPress: async () => {
            try {
              if (user) {
                await updatePremiumStatus(user.uid, true);
                Alert.alert(
                  '登録完了',
                  'プレミアムプランに登録しました！',
                  [
                    {
                      text: 'OK',
                      onPress: () => router.back(),
                    },
                  ]
                );
              }
            } catch (error) {
              console.error('Error updating premium status:', error);
              Alert.alert('エラー', 'プレミアムプランの登録に失敗しました');
            }
          },
        },
      ]
    );
  };

  const premiumFeatures = [
    { icon: '🤖', text: 'AI問題生成（無制限）' },
    { icon: '🔄', text: '間隔反復学習（復習機能）' },
    { icon: '📊', text: '詳細学習分析' },
    { icon: '🚫', text: '広告完全非表示' },
  ];

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
          <Text style={styles.title}>プレミアムプラン</Text>
          <Text style={styles.subtitle}>
            すべての機能を使い放題で、効率的に合格を目指しましょう
          </Text>
        </View>

        {/* プレミアム機能一覧 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>プレミアム機能</Text>
          <View style={styles.featuresCard}>
            {premiumFeatures.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* プラン選択 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>プランを選択</Text>
          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planName}>月額プラン</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>おすすめ</Text>
              </View>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>¥980</Text>
              <Text style={styles.priceUnit}>/月</Text>
            </View>
            <Text style={styles.planDescription}>いつでもキャンセル可能</Text>
            <Pressable
              style={({ pressed }) => [
                styles.subscribeButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleSubscribe}
            >
              <Text style={styles.subscribeButtonText}>月額プランで始める</Text>
            </Pressable>
          </View>
        </View>

        {/* 注意事項 */}
        <View style={styles.section}>
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>ご利用にあたって</Text>
            <Text style={styles.noticeText}>
              • 登録後すぐにすべての機能をご利用いただけます{'\n'}
              • 自動更新されますが、いつでもキャンセル可能です{'\n'}
              • キャンセル後も期間終了まで機能をご利用いただけます{'\n'}
              • 返金は承っておりません
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
    flex: 1,
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
  featuresCard: {
    backgroundColor: ZenColors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: ZenColors.border,
    ...Shadow.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  featureIcon: {
    fontSize: FontSize.xl,
    marginRight: Spacing.md,
  },
  featureText: {
    fontSize: FontSize.md,
    color: ZenColors.text.primary,
    flex: 1,
  },
  planCard: {
    backgroundColor: ZenColors.surface,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: ZenColors.primary,
    ...Shadow.md,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  planName: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: ZenColors.text.primary,
  },
  badge: {
    backgroundColor: ZenColors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: ZenColors.text.inverse,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.xs,
  },
  price: {
    fontSize: 48,
    fontWeight: '700',
    color: ZenColors.primary,
  },
  priceUnit: {
    fontSize: FontSize.lg,
    color: ZenColors.text.secondary,
    marginLeft: Spacing.xs,
  },
  planDescription: {
    fontSize: FontSize.md,
    color: ZenColors.text.secondary,
    marginBottom: Spacing.lg,
  },
  subscribeButton: {
    backgroundColor: ZenColors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadow.md,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  subscribeButtonText: {
    color: ZenColors.text.inverse,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  noticeCard: {
    backgroundColor: ZenColors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: ZenColors.border,
  },
  noticeTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: ZenColors.text.primary,
    marginBottom: Spacing.sm,
  },
  noticeText: {
    fontSize: FontSize.sm,
    color: ZenColors.text.secondary,
    lineHeight: FontSize.sm * 1.7,
  },
});
