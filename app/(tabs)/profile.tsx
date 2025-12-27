import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../lib/AuthContext';
import { ZenColors, Spacing, FontSize, BorderRadius, Shadow } from '../../constants/Colors';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'ログアウト',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* ユーザー情報 */}
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <Text style={styles.email}>{user?.email}</Text>
            <Text style={styles.plan}>無料プラン</Text>
          </View>
        </View>

        {/* プレミアムプラン */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>プレミアムプラン</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>プレミアムにアップグレード</Text>
            <Text style={styles.cardDescription}>
              AI機能無制限、全問題アクセス、広告非表示など、すべての機能が使い放題
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => router.push('/subscription')}
            >
              <Text style={styles.buttonText}>月額￥980で始める</Text>
            </Pressable>
          </View>
        </View>

        {/* 設定 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>設定</Text>
          
          <Pressable style={styles.menuItem}>
            <Text style={styles.menuText}>通知設定</Text>
          </Pressable>

          <Pressable style={styles.menuItem}>
            <Text style={styles.menuText}>学習目標設定</Text>
          </Pressable>

          <Pressable style={styles.menuItem}>
            <Text style={styles.menuText}>データのバックアップ</Text>
          </Pressable>
        </View>

        {/* サポート */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>サポート</Text>
          
          <Pressable style={styles.menuItem}>
            <Text style={styles.menuText}>使い方ガイド</Text>
          </Pressable>

          <Pressable style={styles.menuItem}>
            <Text style={styles.menuText}>お問い合わせ</Text>
          </Pressable>

          <Pressable style={styles.menuItem}>
            <Text style={styles.menuText}>利用規約</Text>
          </Pressable>

          <Pressable style={styles.menuItem}>
            <Text style={styles.menuText}>プライバシーポリシー</Text>
          </Pressable>
        </View>

        {/* ログアウト */}
        <View style={styles.section}>
          <Pressable
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.logoutButtonPressed,
            ]}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>ログアウト</Text>
          </Pressable>
        </View>

        {/* バージョン情報 */}
        <View style={styles.version}>
          <Text style={styles.versionText}>バージョン 1.0.0</Text>
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
  card: {
    backgroundColor: ZenColors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: ZenColors.border,
    alignItems: 'center',
    ...Shadow.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ZenColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: FontSize.xxxl,
    fontWeight: '700',
    color: ZenColors.text.inverse,
  },
  email: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: ZenColors.text.primary,
    marginBottom: Spacing.xs,
  },
  plan: {
    fontSize: FontSize.md,
    color: ZenColors.text.secondary,
  },
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: ZenColors.text.primary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: FontSize.md,
    color: ZenColors.text.secondary,
    lineHeight: FontSize.md * 1.7,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  button: {
    backgroundColor: ZenColors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    width: '100%',
    alignItems: 'center',
    ...Shadow.md,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: ZenColors.text.inverse,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  menuItem: {
    backgroundColor: ZenColors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: ZenColors.border,
    marginBottom: Spacing.sm,
  },
  menuText: {
    fontSize: FontSize.md,
    color: ZenColors.text.primary,
  },
  logoutButton: {
    backgroundColor: ZenColors.surface,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: ZenColors.error,
    alignItems: 'center',
  },
  logoutButtonPressed: {
    opacity: 0.8,
  },
  logoutText: {
    color: ZenColors.error,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  version: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  versionText: {
    fontSize: FontSize.sm,
    color: ZenColors.text.tertiary,
  },
});
