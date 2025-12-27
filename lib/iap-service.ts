import {
  initConnection,
  endConnection,
  getProducts,
  requestPurchase,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  Product,
  Purchase,
  PurchaseError,
} from 'react-native-iap';
import { updatePremiumStatus } from './firestore-service';

// App Store Connect で設定する商品ID
export const PRODUCT_IDS = {
  PREMIUM_MONTHLY: 'com.takken.premium.monthly',
  PREMIUM_YEARLY: 'com.takken.premium.yearly',
};

export interface SubscriptionProduct {
  productId: string;
  title: string;
  description: string;
  price: string;
  localizedPrice: string;
}

let purchaseUpdateSubscription: any = null;
let purchaseErrorSubscription: any = null;

// In-App Purchaseの初期化
export async function initializeIAP(): Promise<void> {
  try {
    await initConnection();
    console.log('IAP connection initialized');

    // 購入更新リスナー
    purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase: Purchase) => {
      console.log('Purchase updated:', purchase);
      
      const receipt = purchase.transactionReceipt;
      if (receipt) {
        try {
          // レシート検証（本番環境では必須）
          // ここでは簡易的な処理のみ
          await finishTransaction({ purchase, isConsumable: false });
          console.log('Transaction finished');
        } catch (error) {
          console.error('Error finishing transaction:', error);
        }
      }
    });

    // 購入エラーリスナー
    purchaseErrorSubscription = purchaseErrorListener((error: PurchaseError) => {
      console.error('Purchase error:', error);
    });
  } catch (error) {
    console.error('IAP initialization error:', error);
    throw error;
  }
}

// In-App Purchaseのクリーンアップ
export async function cleanupIAP(): Promise<void> {
  if (purchaseUpdateSubscription) {
    purchaseUpdateSubscription.remove();
    purchaseUpdateSubscription = null;
  }
  if (purchaseErrorSubscription) {
    purchaseErrorSubscription.remove();
    purchaseErrorSubscription = null;
  }
  await endConnection();
  console.log('IAP connection ended');
}

// 商品情報の取得
export async function getSubscriptionProducts(): Promise<SubscriptionProduct[]> {
  try {
    const products = await getProducts({
      skus: Object.values(PRODUCT_IDS),
    });

    return products.map(product => ({
      productId: product.productId,
      title: product.title,
      description: product.description,
      price: product.price,
      localizedPrice: product.localizedPrice,
    }));
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
}

// サブスクリプションの購入
export async function purchaseSubscription(
  productId: string,
  uid: string
): Promise<boolean> {
  try {
    await requestPurchase({ sku: productId });
    
    // 購入成功後、Firestoreのプレミアムステータスを更新
    await updatePremiumStatus(uid, true);
    
    return true;
  } catch (error) {
    console.error('Purchase error:', error);
    return false;
  }
}

// レシート検証（簡易版）
// 本番環境では、サーバー側でAppleのレシート検証APIを使用する必要があります
export async function verifyReceipt(receipt: string): Promise<boolean> {
  // TODO: サーバー側でのレシート検証を実装
  // https://developer.apple.com/documentation/appstorereceipts/verifyreceipt
  
  console.log('Receipt verification (stub):', receipt);
  return true;
}

// プレミアムステータスの確認
export async function checkPremiumStatus(uid: string): Promise<boolean> {
  // Firestoreからプレミアムステータスを取得
  // 実際のアプリでは、getUserProfile関数を使用
  return false;
}

// 機能制限のチェック
export interface FeatureLimits {
  maxAIExplanations: number;
  maxQuestions: number;
  hasAds: boolean;
  hasOfflineDownload: boolean;
  hasDetailedAnalytics: boolean;
}

export function getFeatureLimits(isPremium: boolean): FeatureLimits {
  if (isPremium) {
    return {
      maxAIExplanations: -1, // 無制限
      maxQuestions: -1, // 無制限
      hasAds: false,
      hasOfflineDownload: true,
      hasDetailedAnalytics: true,
    };
  } else {
    return {
      maxAIExplanations: 20, // 月20回まで
      maxQuestions: 300, // 300問まで
      hasAds: true,
      hasOfflineDownload: false,
      hasDetailedAnalytics: false,
    };
  }
}
