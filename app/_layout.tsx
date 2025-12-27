import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AuthProvider } from '../lib/AuthContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    // Zen Maru Gothicフォントは後で追加
    // 'ZenMaruGothic-Regular': require('../assets/fonts/ZenMaruGothic-Regular.ttf'),
    // 'ZenMaruGothic-Medium': require('../assets/fonts/ZenMaruGothic-Medium.ttf'),
    // 'ZenMaruGothic-Bold': require('../assets/fonts/ZenMaruGothic-Bold.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F4F3EF' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}
