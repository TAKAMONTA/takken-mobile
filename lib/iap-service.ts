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
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';
import { Platform } from 'react-native';

const functions = getFunctions(app);

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
    const purchase = await requestPurchase({ sku: productId });
    
    // レシート検証を実施
    if (purchase && purchase.transactionReceipt) {
      const isValid = await verifyReceipt(
        purchase.transactionReceipt,
        productId
      );
      
      if (isValid) {
        // 検証成功後、トランザクションを完了
        await finishTransaction({ purchase, isConsumable: false });
        return true;
      } else {
        console.error('Receipt verification failed');
        return false;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Purchase error:', error);
    return false;
  }
}

// レシート検証（Cloud Functions経由）
export async function verifyReceipt(
  receipt: string,
  productId: string
): Promise<boolean> {
  try {
    const verifyIAPReceiptFn = httpsCallable(functions, 'verifyIAPReceipt');
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    
    const result = await verifyIAPReceiptFn({
      receipt,
      platform,
      productId,
    });
    
    const data = result.data as { isValid: boolean };
    return data.isValid;
  } catch (error) {
    console.error('Receipt verification error:', error);
    return false;
  }
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
