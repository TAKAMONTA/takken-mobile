# 宅建合格ロード - モバイルアプリ

React Native / Expoで構築された宅建試験対策アプリのiOS版です。

## 📱 プロジェクト概要

- **フレームワーク**: Expo SDK 54
- **ナビゲーション**: Expo Router
- **UI**: React Native + StyleSheet
- **認証**: Firebase Auth
- **データベース**: Firestore
- **デザイン**: 禅デザイン（行政書士アプリと統一）

## 🚀 セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example`を`.env`にコピーして、Firebase設定を入力してください。

```bash
cp .env.example .env
```

### 3. 開発サーバーの起動

```bash
npm start
```

## 📂 プロジェクト構造

```
takken-mobile/
├── app/                    # Expo Router (画面)
│   ├── _layout.tsx        # ルートレイアウト
│   └── index.tsx          # トップページ
├── components/            # 共通コンポーネント
├── lib/                   # ビジネスロジック
│   ├── firebase.ts        # Firebase設定
│   ├── types.ts           # 型定義
│   └── ...
├── constants/             # 定数
│   └── Colors.ts          # 禅デザインカラー
└── assets/                # 画像、フォント
```

## 🎨 禅デザイン

行政書士試験攻略アプリと統一された禅デザインを採用しています。

- **カラーパレット**: セージグリーン & ストーングレー
- **フォント**: Zen Maru Gothic
- **デザイン原則**: 余白、シンプルさ、静寂

## 🔧 開発コマンド

```bash
# 開発サーバー起動
npm start

# iOS シミュレーター
npm run ios

# Android エミュレーター
npm run android

# Web ブラウザ
npm run web
```

## 📦 ビルド

### iOS (App Store)

```bash
# EAS Build設定
npx eas build:configure

# プロダクションビルド
npx eas build --platform ios --profile production

# TestFlightにアップロード
npx eas submit --platform ios
```

## 🔐 環境変数

以下の環境変数が必要です：

- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_OPENAI_API_KEY`

## 📝 TODO

- [ ] 認証画面の実装
- [ ] 学習機能の実装
- [ ] AI機能の統合
- [ ] In-App Purchase実装
- [ ] プッシュ通知実装
- [ ] App Storeアセット作成

## 📄 ライセンス

Private
