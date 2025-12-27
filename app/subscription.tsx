import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../lib/AuthContext';
import { 
  initializeIAP, 
  cleanupIAP, 
  getSubscriptionProducts, 
  purchaseSubscription,
  SubscriptionProduct,
} from '../lib/iap-service';
import { ZenColors, Spacing, FontSize, BorderRadius, Shadow } from '../constants/Colors';

const features = [
  { icon: '✓', text: 'AI予想問題（無制限）', premium: true },
  { icon: '✓', text: '全年度過去問アクセス', premium: true },
  { icon: '✓', text: 'AI解説（無制限）', premium: true },
  { icon: '✓', text: '詳細学習分析', premium: true },
  { icon: '✓', text: '成功パターン分析', premium: true },
  { icon: '✓', text: '間隔反復学習', premium: true },
  { icon: '✓', text: '広告完全非表示', premium: true },
  { icon: '✓', text: 'オフライン問題ダウンロード', premium: true },
  { icon: '✓', text: 'カスタム学習計画', premium: true },
  { icon: '✓', text: 'プッシュ通知・リマインダー', premium: true },
  { icon: '✓', text: 'AI問題生成機能', premium: true },
];

export default function SubscriptionScreen() {
  const { user } = useAuth();
  const [products, setProducts] = useState<SubscriptionProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    loadProducts();

    return () => {
      cleanupIAP();
    };
  }, []);

  const loadProducts = async () => {
    try {
      await initializeIAP();
      const productList = await getSubscriptionProducts();
      setProducts(productList);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('エラー', '商品情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (productId: string) => {
    if (!user) {
      Alert.alert('エラー', 'ログインが必要です');
      return;
    }

    setPurchasing(true);
    try {
      const success = await purchaseSubscription(productId, user.uid);
      if (success) {
        Alert.alert(
          '購入完了',
          'プレミアムプランへのアップグレードが完了しました！',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('エラー', '購入に失敗しました');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('エラー', '購入処理中にエラーが発生しました');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.closeButton}>✕</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* タイトル */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>プレミアムプラン</Text>
            <Text style={styles.subtitle}>
              すべての機能を使い放題で、効率的に合格を目指しましょう
            </Text>
          </View>

          {/* 機能一覧 */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>プレミアム機能</Text>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            ))}
          </View>

          {/* プラン選択 */}
          <View style={styles.plansSection}>
            <Text style={styles.sectionTitle}>プランを選択</Text>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={ZenColors.primary} />
                <Text style={styles.loadingText}>商品情報を読み込み中...</Text>
              </View>
            ) : products.length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.planTitle}>月額プラン</Text>
                <Text style={styles.planPrice}>¥980/月</Text>
                <Text style={styles.planDescription}>
                  いつでもキャンセル可能
                </Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.purchaseButton,
                    pressed && styles.purchaseButtonPressed,
                    purchasing && styles.purchaseButtonDisabled,
                  ]}
                  onPress={() => handlePurchase('com.takken.premium.monthly')}
                  disabled={purchasing}
                >
                  <Text style={styles.purchaseButtonText}>
                    {purchasing ? '処理中...' : '月額プランで始める'}
                  </Text>
                </Pressable>
              </View>
            ) : (
              products.map((product) => (
                <View key={product.productId} style={styles.card}>
                  <Text style={styles.planTitle}>{product.title}</Text>
                  <Text style={styles.planPrice}>{product.localizedPrice}</Text>
                  <Text style={styles.planDescription}>
                    {product.description}
                  </Text>
                  <Pressable
                    style={({ pressed }) => [
                      styles.purchaseButton,
                      pressed && styles.purchaseButtonPressed,
                      purchasing && styles.purchaseButtonDisabled,
                    ]}
                    onPress={() => handlePurchase(product.productId)}
                    disabled={purchasing}
                  >
                    <Text style={styles.purchaseButtonText}>
                      {purchasing ? '処理中...' : '購入する'}
                    </Text>
                  </Pressable>
                </View>
              ))
            )}

            {/* 年額プラン（デモ用） */}
            <View style={[styles.card, styles.recommendedCard]}>
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedText}>おすすめ</Text>
              </View>
              <Text style={styles.planTitle}>年額プラン</Text>
              <Text style={styles.planPrice}>¥9,800/年</Text>
              <Text style={styles.planSavings}>2ヶ月分お得！</Text>
              <Text style={styles.planDescription}>
                約17%オフ（月額換算¥817）
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.purchaseButton,
                  styles.purchaseButtonPrimary,
                  pressed && styles.purchaseButtonPressed,
                  purchasing && styles.purchaseButtonDisabled,
                ]}
                onPress={() => handlePurchase('com.takken.premium.yearly')}
                disabled={purchasing}
              >
                <Text style={styles.purchaseButtonText}>
                  {purchasing ? '処理中...' : '年額プランで始める'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* 注意事項 */}
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>ご注意</Text>
            <Text style={styles.notesText}>
              • サブスクリプションは自動更新されます{'\n'}
              • 更新の24時間前までにキャンセルしない限り、自動的に更新されます{'\n'}
              • App Storeの設定からいつでもキャンセルできます{'\n'}
              • 購入後、未使用期間の返金はできません
            </Text>
          </View>

          {/* リンク */}
          <View style={styles.linksSection}>
            <Pressable>
              <Text style={styles.linkText}>利用規約</Text>
            </Pressable>
            <Text style={styles.linkSeparator}>•</Text>
            <Pressable>
              <Text style={styles.linkText}>プライバシーポリシー</Text>
            </Pressable>
            <Text style={styles.linkSeparator}>•</Text>
            <Pressable>
              <Text style={styles.linkText}>購入を復元</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ZenColors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: Spacing.lg,
    backgroundColor: ZenColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: ZenColors.border,
  },
  closeButton: {
    fontSize: FontSize.xl,
    color: ZenColors.text.secondary,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
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
  featuresSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: ZenColors.text.primary,
    marginBottom: Spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  featureIcon: {
    fontSize: FontSize.lg,
    color: ZenColors.primary,
    marginRight: Spacing.sm,
  },
  featureText: {
    fontSize: FontSize.md,
    color: ZenColors.text.primary,
  },
  plansSection: {
    marginBottom: Spacing.xl,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    fontSize: FontSize.md,
    color: ZenColors.text.secondary,
    marginTop: Spacing.md,
  },
  card: {
    backgroundColor: ZenColors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: ZenColors.border,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  recommendedCard: {
    borderWidth: 2,
    borderColor: ZenColors.primary,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -12,
    right: Spacing.lg,
    backgroundColor: ZenColors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  recommendedText: {
    color: ZenColors.text.inverse,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  planTitle: {
    fontSize: FontSize.xl,
    fontWeight: '600',
    color: ZenColors.text.primary,
    marginBottom: Spacing.xs,
  },
  planPrice: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: ZenColors.primary,
    marginBottom: Spacing.xs,
  },
  planSavings: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: ZenColors.success,
    marginBottom: Spacing.xs,
  },
  planDescription: {
    fontSize: FontSize.md,
    color: ZenColors.text.secondary,
    marginBottom: Spacing.md,
  },
  purchaseButton: {
    backgroundColor: ZenColors.surface,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: ZenColors.primary,
    alignItems: 'center',
  },
  purchaseButtonPrimary: {
    backgroundColor: ZenColors.primary,
    borderColor: ZenColors.primary,
  },
  purchaseButtonPressed: {
    opacity: 0.8,
  },
  purchaseButtonDisabled: {
    opacity: 0.5,
  },
  purchaseButtonText: {
    color: ZenColors.primary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  notesSection: {
    backgroundColor: ZenColors.gray[100],
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  notesTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: ZenColors.text.primary,
    marginBottom: Spacing.xs,
  },
  notesText: {
    fontSize: FontSize.sm,
    color: ZenColors.text.secondary,
    lineHeight: FontSize.sm * 1.7,
  },
  linksSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  linkText: {
    fontSize: FontSize.sm,
    color: ZenColors.primary,
  },
  linkSeparator: {
    fontSize: FontSize.sm,
    color: ZenColors.text.tertiary,
    marginHorizontal: Spacing.sm,
  },
});
