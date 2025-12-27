import { View, Text, TextInput, Pressable, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../../lib/AuthContext';
import { ZenColors, Spacing, FontSize, BorderRadius, Shadow } from '../../constants/Colors';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('エラー', 'すべての項目を入力してください');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('エラー', 'パスワードが一致しません');
      return;
    }

    if (password.length < 6) {
      Alert.alert('エラー', 'パスワードは6文字以上で入力してください');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password);
      Alert.alert('登録完了', 'アカウントが作成されました', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error: any) {
      Alert.alert('登録エラー', error.message);
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
            <Text style={styles.title}>新規登録</Text>
            <Text style={styles.subtitle}>学習を始めましょう</Text>
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
                placeholder="6文字以上"
                placeholderTextColor={ZenColors.gray[400]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>パスワード（確認）</Text>
              <TextInput
                style={styles.input}
                placeholder="もう一度入力"
                placeholderTextColor={ZenColors.gray[400]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
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
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? '登録中...' : '登録'}
              </Text>
            </Pressable>
          </View>

          {/* フッター */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>すでにアカウントをお持ちの方</Text>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.linkButton,
                pressed && styles.linkButtonPressed,
              ]}
            >
              <Text style={styles.linkText}>ログイン</Text>
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
