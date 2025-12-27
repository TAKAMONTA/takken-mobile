import { View, Text, StyleSheet, Pressable, ActivityIndicator, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../lib/AuthContext';
import { ZenColors, Spacing, FontSize, BorderRadius, Shadow } from '../constants/Colors';

export default function HomeScreen() {
  const { user, loading, signIn, signInAnonymously } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      // ログイン済みの場合はダッシュボードにリダイレクト
      router.replace('/(tabs)');
    }
  }, [user, loading]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('エラー', 'メールアドレスとパスワードを入力してください');
      return;
    }

    setIsLoggingIn(true);
    try {
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('ログインエラー', error.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setIsLoggingIn(true);
    try {
      await signInAnonymously();
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('エラー', 'ゲストログインに失敗しました');
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={ZenColors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* ヒーローセクション */}
          <View style={styles.hero}>
            <Text style={styles.emoji}>🏯</Text>
            <Text style={styles.title}>宅建合格ロード</Text>
            <Text style={styles.subtitle}>静寂の中で、確かな知識を深める。</Text>
          </View>

          {!showLogin ? (
            // LP表示モード
            <>
              {/* CTAボタン */}
              <View style={styles.ctaButtons}>
                <Pressable
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => setShowLogin(true)}
                >
                  <Text style={styles.primaryButtonText}>学習を始める</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={handleAnonymousLogin}
                  disabled={isLoggingIn}
                >
                  <Text style={styles.secondaryButtonText}>
                    {isLoggingIn ? 'ログイン中...' : 'ゲストで試す'}
                  </Text>
                </Pressable>
              </View>

              {/* 特徴カード */}
              <View style={styles.features}>
                <View style={styles.featureCard}>
                  <Text style={styles.featureEmoji}>🤖</Text>
                  <Text style={styles.featureTitle}>AI予想問題</Text>
                  <Text style={styles.featureDescription}>
                    500問の厳選された問題で効率的に学習
                  </Text>
                </View>

                <View style={styles.featureCard}>
                  <Text style={styles.featureEmoji}>📊</Text>
                  <Text style={styles.featureTitle}>詳細な分析</Text>
                  <Text style={styles.featureDescription}>
                    学習進捗を可視化し、弱点を克服
                  </Text>
                </View>

                <View style={styles.featureCard}>
                  <Text style={styles.featureEmoji}>🧘</Text>
                  <Text style={styles.featureTitle}>禅デザイン</Text>
                  <Text style={styles.featureDescription}>
                    集中力を高める落ち着いた学習環境
                  </Text>
                </View>
              </View>
            </>
          ) : (
            // ログインフォーム表示モード
            <>
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>メールアドレス</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="example@email.com"
                    placeholderTextColor={ZenColors.gray[400]}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>パスワード</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={ZenColors.gray[400]}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.primaryButton,
                    isLoggingIn && styles.buttonDisabled,
                    pressed && !isLoggingIn && styles.buttonPressed,
                  ]}
                  onPress={handleLogin}
                  disabled={isLoggingIn}
                >
                  <Text style={styles.primaryButtonText}>
                    {isLoggingIn ? 'ログイン中...' : 'ログイン'}
                  </Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.textButton,
                    pressed && styles.textButtonPressed,
                  ]}
                  onPress={() => router.push('/(auth)/register')}
                >
                  <Text style={styles.textButtonText}>
                    アカウントをお持ちでない方はこちら
                  </Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.textButton,
                    pressed && styles.textButtonPressed,
                  ]}
                  onPress={() => setShowLogin(false)}
                >
                  <Text style={styles.textButtonText}>← 戻る</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  scrollContent: {
    flexGrow: 1,
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
  emoji: {
    fontSize: 64,
    marginBottom: Spacing.md,
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
  ctaButtons: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  primaryButton: {
    backgroundColor: ZenColors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadow.md,
  },
  secondaryButton: {
    backgroundColor: ZenColors.surface,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ZenColors.border,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: ZenColors.text.inverse,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: ZenColors.text.primary,
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
    alignItems: 'center',
    ...Shadow.sm,
  },
  featureEmoji: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  featureTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: ZenColors.text.primary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: FontSize.md,
    color: ZenColors.text.secondary,
    lineHeight: FontSize.md * 1.7,
    textAlign: 'center',
  },
  form: {
    gap: Spacing.lg,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: ZenColors.text.primary,
  },
  input: {
    backgroundColor: ZenColors.surface,
    borderWidth: 1,
    borderColor: ZenColors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: ZenColors.text.primary,
  },
  textButton: {
    paddingVertical: Spacing.xs,
    alignItems: 'center',
  },
  textButtonPressed: {
    opacity: 0.6,
  },
  textButtonText: {
    fontSize: FontSize.md,
    color: ZenColors.primary,
    fontWeight: '600',
  },
});
