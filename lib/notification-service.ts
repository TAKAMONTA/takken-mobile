import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationSettings {
  enabled: boolean;
  dailyReminderTime: string; // HH:MM format
  streakReminder: boolean;
  achievementNotifications: boolean;
  reviewReminder: boolean;
}

// Request notification permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

// Schedule daily study reminder
export async function scheduleDailyReminder(hour: number, minute: number): Promise<string | null> {
  try {
    // Cancel existing daily reminder
    await cancelDailyReminder();

    const trigger: Notifications.CalendarTriggerInput = {
      hour,
      minute,
      repeats: true,
    };

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📚 学習の時間です',
        body: '今日も宅建試験の勉強を続けましょう！',
        data: { type: 'daily_reminder' },
      },
      trigger,
    });

    return id;
  } catch (error) {
    console.error('Error scheduling daily reminder:', error);
    return null;
  }
}

// Cancel daily reminder
export async function cancelDailyReminder(): Promise<void> {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const dailyReminders = scheduledNotifications.filter(
      (notif) => notif.content.data?.type === 'daily_reminder'
    );

    for (const reminder of dailyReminders) {
      await Notifications.cancelScheduledNotificationAsync(reminder.identifier);
    }
  } catch (error) {
    console.error('Error canceling daily reminder:', error);
  }
}

// Send streak notification
export async function sendStreakNotification(streakDays: number): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔥 連続学習記録更新！',
        body: `${streakDays}日連続で学習を続けています！素晴らしい！`,
        data: { type: 'streak', days: streakDays },
      },
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.error('Error sending streak notification:', error);
  }
}

// Send achievement notification
export async function sendAchievementNotification(
  title: string,
  message: string
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🎉 ${title}`,
        body: message,
        data: { type: 'achievement' },
      },
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.error('Error sending achievement notification:', error);
  }
}

// Schedule review reminder
export async function scheduleReviewReminder(
  incorrectCount: number,
  daysFromNow: number
): Promise<string | null> {
  try {
    if (incorrectCount === 0) {
      return null;
    }

    const trigger: Notifications.TimeIntervalTriggerInput = {
      seconds: daysFromNow * 24 * 60 * 60,
      repeats: false,
    };

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📖 復習の時間です',
        body: `${incorrectCount}問の間違えた問題を復習しましょう`,
        data: { type: 'review_reminder', count: incorrectCount },
      },
      trigger,
    });

    return id;
  } catch (error) {
    console.error('Error scheduling review reminder:', error);
    return null;
  }
}

// Cancel all notifications
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all notifications:', error);
  }
}

// Get all scheduled notifications
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
}

// Check if notifications are enabled
export async function areNotificationsEnabled(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking notification status:', error);
    return false;
  }
}
