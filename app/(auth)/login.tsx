import { View, Text, TextInput, Pressable, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../../lib/AuthContext';
import { ZenColors, Spacing, FontSize, BorderRadius, Shadow } from '../../constants/Colors';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('エラー', 'メールアドレスとパスワードを入力してください');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('ログインエラー', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* ヘッダー */}
          <View style={styles.header}>
            <Text style={styles.title}>ログイン</Text>
            <Text style={styles.subtitle}>宅建合格ロードへようこそ</Text>
          </View>

          {/* フォーム */}
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
                styles.button,
                loading && styles.buttonDisabled,
                pressed && !loading && styles.buttonPressed,
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'ログイン中...' : 'ログイン'}
              </Text>
            </Pressable>
          </View>

          {/* フッター */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>アカウントをお持ちでない方</Text>
            <Pressable
              onPress={() => router.push('/(auth)/register')}
              style={({ pressed }) => [
                styles.linkButton,
                pressed && styles.linkButtonPressed,
              ]}
            >
              <Text style={styles.linkText}>新規登録</Text>
            </Pressable>
          </View>
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
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
  button: {
    backgroundColor: ZenColors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: Spacing.md,
    ...Shadow.md,
  },
  buttonDisabled: {
    opacity: 0.6,
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
  footer: {
    marginTop: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  footerText: {
    fontSize: FontSize.md,
    color: ZenColors.text.secondary,
  },
  linkButton: {
    paddingVertical: Spacing.xs,
  },
  linkButtonPressed: {
    opacity: 0.6,
  },
  linkText: {
    fontSize: FontSize.md,
    color: ZenColors.primary,
    fontWeight: '600',
  },
});
