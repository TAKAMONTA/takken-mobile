import { Tabs } from 'expo-router';
import { ZenColors } from '../../constants/Colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ZenColors.primary,
        tabBarInactiveTintColor: ZenColors.gray[400],
        tabBarStyle: {
          backgroundColor: ZenColors.surface,
          borderTopColor: ZenColors.border,
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: ZenColors.surface,
        },
        headerTintColor: ZenColors.text.primary,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'ダッシュボード',
          tabBarLabel: 'ホーム',
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: '学習',
          tabBarLabel: '学習',
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: '分析',
          tabBarLabel: '分析',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'プロフィール',
          tabBarLabel: 'プロフィール',
        }}
      />
    </Tabs>
  );
}
