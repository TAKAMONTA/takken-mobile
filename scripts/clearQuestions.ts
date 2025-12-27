import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearQuestions() {
  console.log('🗑️  既存の問題データを削除します...');
  
  const questionsRef = collection(db, 'questions');
  const snapshot = await getDocs(questionsRef);
  
  let batch = writeBatch(db);
  let count = 0;
  
  snapshot.docs.forEach((docSnapshot) => {
    batch.delete(docSnapshot.ref);
    count++;
    
    if (count % 500 === 0) {
      batch.commit();
      batch = writeBatch(db);
    }
  });
  
  if (count % 500 !== 0) {
    await batch.commit();
  }
  
  console.log(`✅ ${count}問を削除しました`);
}

clearQuestions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ エラー:', error);
    process.exit(1);
  });
