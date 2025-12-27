/**
 * Web版の問題データをFirestoreに移行するスクリプト
 * 
 * 使用方法:
 * 1. Web版のtakkenリポジトリから問題データをコピー
 * 2. Firebase Admin SDKの認証情報を設定
 * 3. このスクリプトを実行
 */

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Firebase Admin SDKの初期化
const serviceAccount = require(path.join(__dirname, '../firebase-service-account.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// 問題データの型定義
interface Question {
  id: string | number;
  question: string;
  choices?: string[];
  options?: string[];
  correctAnswer: number;
  explanation: string;
  category: string;
  difficulty?: string;
  year?: string;
  topic?: string;
  tags?: string[];
}

// Web版の問題データを読み込む
async function loadQuestionsFromWeb(): Promise<Question[]> {
  // ここでは、Web版のtakkenリポジトリから問題データを読み込む
  // 実際には、Web版のリポジトリをクローンして、問題データをインポートする必要がある
  
  // 仮のデータ構造
  const questions: Question[] = [];
  
  // TODO: Web版の問題データを読み込むロジックを実装
  
  return questions;
}

// Firestoreに問題データを保存する
async function migrateQuestionsToFirestore(questions: Question[]) {
  const batch = db.batch();
  let count = 0;
  
  for (const question of questions) {
    // IDを文字列に変換
    const questionId = String(question.id);
    const questionRef = db.collection('questions').doc(questionId);
    
    // choicesとoptionsを統一
    const choices = question.choices || question.options || [];
    
    // Firestoreに保存するデータ
    const questionData = {
      id: questionId,
      question: question.question,
      choices,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      category: question.category,
      difficulty: question.difficulty || 'medium',
      year: question.year || '2024',
      topic: question.topic || '',
      tags: question.tags || [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    batch.set(questionRef, questionData);
    count++;
    
    // Firestoreのバッチ制限（500件）に達したらコミット
    if (count % 500 === 0) {
      await batch.commit();
      console.log(`${count}件の問題をFirestoreに保存しました`);
    }
  }
  
  // 残りの問題をコミット
  if (count % 500 !== 0) {
    await batch.commit();
    console.log(`${count}件の問題をFirestoreに保存しました`);
  }
  
  console.log(`合計${count}件の問題をFirestoreに移行しました`);
}

// メイン処理
async function main() {
  try {
    console.log('問題データの移行を開始します...');
    
    // Web版の問題データを読み込む
    const questions = await loadQuestionsFromWeb();
    
    if (questions.length === 0) {
      console.log('問題データが見つかりませんでした');
      return;
    }
    
    console.log(`${questions.length}件の問題データを読み込みました`);
    
    // Firestoreに問題データを保存する
    await migrateQuestionsToFirestore(questions);
    
    console.log('問題データの移行が完了しました');
  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    // Firebase Admin SDKを終了
    await admin.app().delete();
  }
}

main();
