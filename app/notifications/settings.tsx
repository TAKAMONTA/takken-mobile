import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../lib/AuthContext';
import { getUserProfile } from '../../lib/firestore-service';
import {
  requestNotificationPermissions,
  scheduleDailyReminder,
  cancelDailyReminder,
  cancelAllNotifications,
  areNotificationsEnabled,
} from '../../lib/notification-service';
import { ZenColors, Spacing, FontSize, BorderRadius, Shadow } from '../../constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_SETTINGS_KEY = 'notification_settings';

export default function NotificationSettingsScreen() {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Notification settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [streakReminder, setStreakReminder] = useState(true);
  const [achievementNotifications, setAchievementNotifications] = useState(true);
  const [reviewReminder, setReviewReminder] = useState(true);

  useEffect(() => {
    checkPremiumAndLoadSettings();
  }, [user]);

  const checkPremiumAndLoadSettings = async () => {
    if (!user) {
      router.replace('/(auth)/login');
      return;
    }

    try {
      const profile = await getUserProfile(user.uid);
      setIsPremium(profile?.isPremium || false);

      if (!profile?.isPremium) {
        Alert.alert(
          'プレミアム機能',
          '通知設定はプレミアムプラン限定です',
          [
            { text: 'キャンセル', onPress: () => router.back() },
            { text: 'プレミアムプランを見る', onPress: () => router.push('/subscription') },
          ]
        );
        return;
      }

      // Load saved settings
      await loadSettings();
      
      // Check if notifications are enabled
      const enabled = await areNotificationsEnabled();
      setNotificationsEnabled(enabled);
    } catch (error) {
      console.error('Error checking premium status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const settingsJson = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (settingsJson) {
        const settings = JSON.parse(settingsJson);
        setDailyReminderEnabled(settings.dailyReminderEnabled || false);
        setStreakReminder(settings.streakReminder !== false);
        setAchievementNotifications(settings.achievementNotifications !== false);
        setReviewReminder(settings.reviewReminder !== false);
        
        if (settings.reminderTime) {
          setReminderTime(new Date(settings.reminderTime));
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const settings = {
        dailyReminderEnabled,
        reminderTime: reminderTime.toISOString(),
        streakReminder,
        achievementNotifications,
        reviewReminder,
      };
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermissions();
    if (granted) {
      setNotificationsEnabled(true);
      Alert.alert('成功', '通知が有効になりました');
    } else {
      Alert.alert(
        '通知の許可が必要です',
        '設定アプリから通知を許可してください',
        [
          { text: 'キャンセル' },
          { text: '設定を開く', onPress: () => {
            // Open app settings
            if (Platform.OS === 'ios') {
              // Linking.openURL('app-settings:');
            }
          }},
        ]
      );
    }
  };

  const handleDailyReminderToggle = async (value: boolean) => {
    setDailyReminderEnabled(value);
    
    if (value) {
      const hour = reminderTime.getHours();
      const minute = reminderTime.getMinutes();
      await scheduleDailyReminder(hour, minute);
      Alert.alert('設定完了', `毎日${hour}:${minute.toString().padStart(2, '0')}に通知します`);
    } else {
      await cancelDailyReminder();
    }
    
    await saveSettings();
  };

  const handleTimeChange = async (event: any, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    
    if (selectedDate) {
      setReminderTime(selectedDate);
      
      if (dailyReminderEnabled) {
        const hour = selectedDate.getHours();
        const minute = selectedDate.getMinutes();
        await scheduleDailyReminder(hour, minute);
      }
      
      await saveSettings();
    }
  };

  const handleClearAllNotifications = async () => {
    Alert.alert(
      '通知をクリア',
      'すべての予定された通知をキャンセルしますか？',
      [
        { text: 'キャンセル' },
        {
          text: 'クリア',
          style: 'destructive',
          onPress: async () => {
            await cancelAllNotifications();
            setDailyReminderEnabled(false);
            await saveSettings();
            Alert.alert('完了', 'すべての通知をキャンセルしました');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>読み込み中...</Text>
      </View>
    );
  }

  if (!isPremium) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Text style={styles.backButton}>← 戻る</Text>
          </Pressable>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>🔔 通知設定</Text>
          <Text style={styles.subtitle}>
            学習リマインダーと通知をカスタマイズ
          </Text>
        </View>

        {/* Enable Notifications */}
        {!notificationsEnabled && (
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>⚠️ 通知が無効です</Text>
            <Text style={styles.warningText}>
              通知を受け取るには、アプリの通知を許可してください
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.enableButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleEnableNotifications}
            >
              <Text style={styles.enableButtonText}>通知を許可する</Text>
            </Pressable>
          </View>
        )}

        {/* Daily Reminder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>毎日の学習リマインダー</Text>
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>リマインダーを有効化</Text>
                <Text style={styles.settingDescription}>
                  毎日決まった時刻に通知
                </Text>
              </View>
              <Switch
                value={dailyReminderEnabled}
                onValueChange={handleDailyReminderToggle}
                disabled={!notificationsEnabled}
              />
            </View>

            {dailyReminderEnabled && (
              <View style={styles.timePickerSection}>
                <Text style={styles.timeLabel}>通知時刻</Text>
                <Pressable
                  style={styles.timeButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={styles.timeText}>
                    {reminderTime.getHours()}:{reminderTime.getMinutes().toString().padStart(2, '0')}
                  </Text>
                </Pressable>

                {showTimePicker && (
                  <DateTimePicker
                    value={reminderTime}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={handleTimeChange}
                  />
                )}
              </View>
            )}
          </View>
        </View>

        {/* Other Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>その他の通知</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>連続学習記録</Text>
                <Text style={styles.settingDescription}>
                  連続学習日数の達成通知
                </Text>
              </View>
              <Switch
                value={streakReminder}
                onValueChange={(value) => {
                  setStreakReminder(value);
                  saveSettings();
                }}
                disabled={!notificationsEnabled}
              />
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>目標達成通知</Text>
                <Text style={styles.settingDescription}>
                  学習目標達成時に通知
                </Text>
              </View>
              <Switch
                value={achievementNotifications}
                onValueChange={(value) => {
                  setAchievementNotifications(value);
                  saveSettings();
                }}
                disabled={!notificationsEnabled}
              />
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>復習リマインダー</Text>
                <Text style={styles.settingDescription}>
                  間違えた問題の復習時期を通知
                </Text>
              </View>
              <Switch
                value={reviewReminder}
                onValueChange={(value) => {
                  setReviewReminder(value);
                  saveSettings();
                }}
                disabled={!notificationsEnabled}
              />
            </View>
          </View>
        </View>

        {/* Clear All */}
        <Pressable
          style={({ pressed }) => [
            styles.clearButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleClearAllNotifications}
        >
          <Text style={styles.clearButtonText}>すべての通知をクリア</Text>
        </Pressable>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ZenColors.background,
  },
  content: {
    padding: Spacing.md,
  },
  header: {
    marginBottom: Spacing.md,
  },
  backButton: {
    fontSize: FontSize.md,
    color: ZenColors.primary,
    fontWeight: '600',
  },
  titleSection: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: ZenColors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: ZenColors.textSecondary,
  },
  warningCard: {
    backgroundColor: '#FEF3C7',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  warningTitle: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    color: ZenColors.text,
    marginBottom: Spacing.xs,
  },
  warningText: {
    fontSize: FontSize.sm,
    color: ZenColors.textSecondary,
    marginBottom: Spacing.md,
  },
  enableButton: {
    backgroundColor: ZenColors.primary,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  enableButtonText: {
    color: '#FFFFFF',
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: ZenColors.text,
    marginBottom: Spacing.md,
  },
  settingCard: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    ...Shadow.small,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingLabel: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: ZenColors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: FontSize.sm,
    color: ZenColors.textSecondary,
  },
  timePickerSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: ZenColors.border,
  },
  timeLabel: {
    fontSize: FontSize.sm,
    color: ZenColors.textSecondary,
    marginBottom: Spacing.sm,
  },
  timeButton: {
    backgroundColor: ZenColors.backgroundSecondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  timeText: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: ZenColors.text,
  },
  clearButton: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
    marginBottom: Spacing.lg,
  },
  clearButtonText: {
    color: '#EF4444',
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.8,
  },
});
