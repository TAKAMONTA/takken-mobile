import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, deleteUser, signInAnonymously } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Firebase認証エラーをユーザーフレンドリーなメッセージに変換
function getAuthErrorMessage(error: any): string {
  const errorCode = error.code;
  
  // ユーザー列挙攻撃を防ぐため、認証エラーは一般化
  switch (errorCode) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'メールアドレスまたはパスワードが正しくありません';
    
    case 'auth/email-already-in-use':
      return 'このメールアドレスは既に使用されています';
    
    case 'auth/weak-password':
      return 'パスワードは6文字以上で設定してください';
    
    case 'auth/invalid-email':
      return 'メールアドレスの形式が正しくありません';
    
    case 'auth/operation-not-allowed':
      return 'この操作は許可されていません';
    
    case 'auth/too-many-requests':
      return 'リクエストが多すぎます。しばらく時間をおいてから再度お試しください';
    
    case 'auth/network-request-failed':
      return 'ネットワークエラーが発生しました。接続を確認してください';
    
    case 'auth/requires-recent-login':
      return 'セキュリティのため、再度ログインしてください';
    
    default:
      return '認証エラーが発生しました。しばらく時間をおいてから再度お試しください';
  }
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInAnonymously: () => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error));
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error));
    }
  };

  const signInAnonymouslyFunc = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error));
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error));
    }
  };

  const deleteAccount = async () => {
    if (!user) {
      throw new Error('ログインしていません');
    }

    try {
      const uid = user.uid;

      // Firestoreのデータを削除
      // ユーザープロフィールを削除
      await deleteDoc(doc(db, 'users', uid));

      // 統計データを削除
      await deleteDoc(doc(db, 'stats', uid));

      // 学習記録を削除
      const sessionsRef = collection(db, 'studySessions');
      const q = query(sessionsRef, where('uid', '==', uid));
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Firebase Authenticationのユーザーを削除
      await deleteUser(user);
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error));
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInAnonymously: signInAnonymouslyFunc, logout, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
