import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase設定
// TODO: 実際のFirebase設定に置き換える
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
};

// Firebaseアプリの初期化
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// React Native用のAuth初期化（AsyncStorageで永続化）
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  // 既に初期化されている場合
  auth = getAuth(app);
}

// Firestore初期化
const db = getFirestore(app);

export { app, auth, db };
