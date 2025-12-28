# カスタム学習プラン生成機能 - 提案書

**作成日**: 2025年12月28日  
**対象アプリ**: 宅建試験対策モバイルアプリ  
**機能分類**: プレミアム機能

---

## 📋 目次

1. [機能概要](#機能概要)
2. [具体的な要件](#具体的な要件)
3. [技術仕様](#技術仕様)
4. [実装スケジュール](#実装スケジュール)
5. [期待される効果](#期待される効果)

---

## 🎯 機能概要

**カスタム学習プラン生成機能**は、AIを活用してユーザーの学習状況を分析し、個別最適化された学習計画を自動生成するプレミアム機能です。

### 主な特徴

**パーソナライズされた学習計画**  
ユーザーの現在の学習状況、弱点分野、目標試験日、1日の学習可能時間などを総合的に分析し、最適な学習スケジュールを提案します。

**動的な計画調整**  
学習の進捗状況に応じて、AIが自動的にプランを調整します。予定通り進まない場合でも、残り時間で最大の効果を得られるよう再計画を行います。

**科学的根拠に基づく設計**  
間隔反復学習（Spaced Repetition）、分散学習（Distributed Practice）、交互学習（Interleaving）などの学習科学の知見を取り入れた計画を生成します。

---

## 📝 具体的な要件

### 1. 初期設定画面

ユーザーが学習プラン生成に必要な情報を入力する画面を実装します。

#### 入力項目

| 項目 | 説明 | 入力形式 |
|------|------|----------|
| **目標試験日** | 宅建試験の受験予定日 | 日付ピッカー |
| **1日の学習時間** | 平日・休日それぞれの学習可能時間 | スライダー（15分〜4時間） |
| **現在の理解度** | 4カテゴリごとの自己評価 | 5段階評価 |
| **優先分野** | 重点的に学習したい分野 | 複数選択 |
| **学習スタイル** | 集中型 or 分散型 | 選択式 |

#### 画面遷移

```
ホーム画面
  ↓
プレミアム機能一覧
  ↓
学習プラン作成（初期設定）
  ↓
プラン生成中（ローディング）
  ↓
学習プラン表示
```

### 2. AIプラン生成ロジック

OpenAI GPT-4.1-miniを使用して、以下の要素を含む学習プランを生成します。

#### 生成される内容

**週次学習計画（試験日まで）**
- 各週の学習目標
- 1日ごとの学習内容（カテゴリ、問題数、復習項目）
- 週末の総復習セッション

**カテゴリ別配分**
- 宅建業法: 35%
- 権利関係: 30%
- 法令上の制限: 20%
- 税・その他: 15%

**マイルストーン設定**
- 各カテゴリの習得目標日
- 模試実施推奨日（月1回）
- 総復習期間（試験2週間前）

**学習方法の提案**
- 新規問題 vs 復習問題の比率
- ○×問題と4択問題の配分
- AI解説の活用タイミング

#### プロンプト設計

```typescript
const systemPrompt = `あなたは宅建試験の学習計画専門家です。
受験者の状況を分析し、合格に向けた最適な学習プランを作成してください。

【考慮事項】
1. 試験までの残り日数
2. 1日の学習可能時間
3. 現在の理解度と弱点分野
4. 学習科学の原則（間隔反復、分散学習）
5. モチベーション維持のための工夫

【プラン作成の原則】
- 無理のない現実的なスケジュール
- 定期的な復習セッションの組み込み
- 週次・月次の達成目標の設定
- 弱点分野への重点配分
- 試験直前期の総復習期間確保`;
```

### 3. プラン表示画面

生成された学習プランを視覚的にわかりやすく表示します。

#### 表示要素

**サマリーカード**
- 総学習時間
- 予想問題数
- 完了予定日
- 合格可能性スコア

**週次カレンダービュー**
- 1週間ごとの学習内容
- 各日の学習時間と問題数
- 達成状況の進捗バー

**カテゴリ別進捗グラフ**
- 4カテゴリの学習進捗
- 目標達成率
- 弱点分野の改善状況

**今日のタスク**
- 本日の学習内容
- 推奨問題セット
- 復習すべき問題

#### インタラクション

- タップで詳細表示
- スワイプで週の切り替え
- 「学習開始」ボタンで該当問題セットへ遷移
- 「プラン調整」ボタンで再生成

### 4. プラン進捗管理

学習の実施状況を自動的にトラッキングし、プランと比較します。

#### トラッキング項目

| 項目 | 説明 | データソース |
|------|------|-------------|
| **実施済み問題数** | 各カテゴリの学習済み問題数 | Firestore studySessions |
| **学習時間** | 実際の学習時間 | Firestore studyStats |
| **正答率** | カテゴリ別の正答率 | Firestore categoryStats |
| **計画達成率** | プラン通りの進捗率 | 計算値 |

#### 進捗アラート

**遅れている場合**
- 「計画より2日遅れています。プランを調整しますか?」
- 「週末に追加学習を推奨します」

**順調な場合**
- 「素晴らしい！計画通り進んでいます」
- 「この調子で続けましょう」

**先行している場合**
- 「予定より早く進んでいます！」
- 「発展問題に挑戦しますか?」

### 5. プラン再生成機能

学習状況の変化に応じて、プランを再生成します。

#### 再生成トリガー

- ユーザーが手動で「プラン調整」をタップ
- 計画から3日以上遅れた場合（自動提案）
- 目標試験日が変更された場合
- 1週間ごとの定期見直し

#### 再生成時の考慮事項

- 現在までの学習実績
- 残り日数の再計算
- 弱点分野の最新分析
- 達成可能性の再評価

---

## 🔧 技術仕様

### データモデル

#### StudyPlan Interface

```typescript
export interface StudyPlan {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  
  // 目標設定
  targetExamDate: Date;
  dailyStudyTime: {
    weekday: number; // 分
    weekend: number; // 分
  };
  
  // 現在の状態
  currentLevel: {
    takkengyouhou: number; // 1-5
    minpou: number;
    hourei: number;
    zei: number;
  };
  
  // 生成されたプラン
  weeklyPlans: WeeklyPlan[];
  milestones: Milestone[];
  
  // 進捗管理
  progress: {
    completedDays: number;
    totalDays: number;
    completedQuestions: number;
    targetQuestions: number;
    onTrack: boolean;
  };
  
  // AI生成コンテンツ
  aiSummary: string;
  aiAdvice: string;
}

export interface WeeklyPlan {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  weeklyGoal: string;
  dailyTasks: DailyTask[];
}

export interface DailyTask {
  date: Date;
  categories: {
    category: string;
    newQuestions: number;
    reviewQuestions: number;
  }[];
  estimatedTime: number; // 分
  completed: boolean;
}

export interface Milestone {
  id: string;
  title: string;
  targetDate: Date;
  description: string;
  completed: boolean;
}
```

### Firestore コレクション構造

```
studyPlans/
  {userId}/
    plans/
      {planId}/
        - id
        - createdAt
        - targetExamDate
        - dailyStudyTime
        - currentLevel
        - weeklyPlans[]
        - milestones[]
        - progress
        - aiSummary
        - aiAdvice
```

### AI Service 関数

```typescript
// lib/ai-service.ts に追加

export async function generateStudyPlan(
  input: StudyPlanInput
): Promise<StudyPlan> {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured');
  }
  
  const prompt = buildStudyPlanPrompt(input);
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: STUDY_PLAN_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    }),
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  
  const data = await response.json();
  const planData = JSON.parse(data.choices[0].message.content);
  
  return transformToPlanObject(planData, input);
}

export async function adjustStudyPlan(
  currentPlan: StudyPlan,
  actualProgress: StudyProgress
): Promise<StudyPlan> {
  // プラン調整ロジック
}
```

### 画面コンポーネント

#### 新規作成ファイル

```
app/
  study-plan/
    index.tsx              # プラン一覧・作成開始
    create.tsx             # 初期設定入力
    [planId]/
      index.tsx            # プラン詳細表示
      edit.tsx             # プラン編集
      progress.tsx         # 進捗詳細
      
components/
  study-plan/
    PlanSummaryCard.tsx    # サマリーカード
    WeeklyCalendar.tsx     # 週次カレンダー
    CategoryProgress.tsx   # カテゴリ別進捗
    DailyTaskList.tsx      # 今日のタスク
    MilestoneTimeline.tsx  # マイルストーン表示
    
lib/
  study-plan-service.ts    # プラン管理ロジック
  ai-service.ts            # AI関数追加
```

---

## 📅 実装スケジュール

### フェーズ1: データモデルとバックエンド（2日間）

**Day 1: データ構造とFirestore設定**
- StudyPlan関連のTypeScript型定義
- Firestoreコレクション設計
- study-plan-service.tsの基本CRUD関数実装
- ユニットテスト作成

**Day 2: AI統合**
- AI Service関数の実装（generateStudyPlan）
- プロンプト設計と最適化
- エラーハンドリング
- レスポンス変換ロジック

### フェーズ2: UI実装（3日間）

**Day 3: 初期設定画面**
- app/study-plan/create.tsxの実装
- 入力フォームコンポーネント
- バリデーション
- 日付ピッカー、スライダーの統合

**Day 4: プラン表示画面**
- app/study-plan/[planId]/index.tsxの実装
- PlanSummaryCard.tsx
- WeeklyCalendar.tsx
- CategoryProgress.tsx
- DailyTaskList.tsx

**Day 5: 進捗管理とプラン調整**
- 進捗トラッキングロジック
- プラン再生成機能
- アラート・通知機能
- プラン編集画面

### フェーズ3: 統合とテスト（2日間）

**Day 6: 機能統合**
- ホーム画面からの導線追加
- プレミアム機能一覧への追加
- 既存の学習機能との連携
- データ同期の確認

**Day 7: テストとデバッグ**
- E2Eテスト
- エッジケースの処理
- パフォーマンス最適化
- UI/UXの微調整

### フェーズ4: リリース準備（1日間）

**Day 8: ドキュメントとリリース**
- ユーザー向けガイド作成
- プレミアム機能説明の更新
- GitHubへのコミット
- リリースノート作成

---

## 📊 期待される効果

### ユーザー価値

**学習効率の向上**  
科学的根拠に基づいた学習計画により、限られた時間で最大の学習効果を得ることができます。個別最適化されたスケジュールにより、無駄な学習を削減し、弱点分野に集中できます。

**モチベーション維持**  
明確な目標設定と進捗の可視化により、学習のモチベーションを維持しやすくなります。達成感を感じられる小さなマイルストーンを設定することで、継続的な学習習慣を形成できます。

**合格可能性の向上**  
データに基づいた学習計画により、試験日までに必要な知識を確実に習得できます。定期的な復習と弱点克服により、合格ラインを超える実力を養成します。

### ビジネス価値

**プレミアム会員の増加**  
高付加価値機能により、プレミアムプランへの転換率が向上します。無料ユーザーとの明確な差別化により、課金動機を強化できます。

**ユーザー継続率の向上**  
パーソナライズされた学習体験により、アプリの継続利用率が向上します。計画に沿った学習により、途中離脱を防ぐことができます。

**競合優位性の確立**  
AI活用の高度な学習プラン機能により、他の宅建アプリとの差別化を図れます。学習科学に基づいた設計により、信頼性の高いサービスとして認知されます。

---

## 🎨 UI/UXデザイン方針

### デザイン原則

**シンプルで直感的**  
複雑な学習計画を、視覚的にわかりやすく表示します。カレンダー形式、プログレスバー、カードUIなどを活用し、一目で状況を把握できるデザインにします。

**モチベーションを高める**  
達成感を感じられる演出（アニメーション、バッジ、励ましメッセージ）を適切に配置します。ポジティブなフィードバックにより、学習意欲を維持します。

**柔軟性と調整可能性**  
計画通りに進まない場合でも、簡単に調整できるUIを提供します。ユーザーが自分のペースで学習できるよう、柔軟な設計にします。

### カラースキーム

- **メインカラー**: 青系（信頼感、集中力）
- **アクセントカラー**: 緑系（達成、成長）
- **警告カラー**: オレンジ系（注意喚起）
- **背景**: 白・グレー系（可読性）

---

## 🔐 プレミアム機能としての位置づけ

### 無料ユーザーとの差別化

**無料ユーザー**
- 基本的な学習統計の閲覧
- 簡易的な学習アドバイス
- 手動での学習計画

**プレミアムユーザー**
- AI生成のカスタム学習プラン
- 動的なプラン調整
- 詳細な進捗分析
- マイルストーン管理
- 個別最適化された学習推奨

### サブスクリプション画面での訴求

**機能説明**
- 「AIがあなた専用の学習プランを作成」
- 「試験日までの最短ルートを提示」
- 「進捗に応じて自動調整」

**ベネフィット**
- 「学習時間を30%削減」
- 「合格可能性を最大化」
- 「迷わず効率的に学習」

---

## 📈 成功指標（KPI）

### 機能利用率

- プラン作成完了率: 80%以上
- プラン継続利用率: 60%以上（1週間後）
- プラン調整実施率: 40%以上

### ユーザーエンゲージメント

- プラン作成ユーザーの学習日数: +50%
- プラン作成ユーザーの問題解答数: +70%
- プラン作成ユーザーの正答率: +15%

### ビジネス指標

- プレミアム転換率: +25%
- 継続率（1ヶ月後）: +20%
- NPS（Net Promoter Score）: +10ポイント

---

## 🚀 今後の拡張可能性

### フェーズ2機能（将来実装）

**学習仲間機能**
- 同じ目標日のユーザーとの進捗比較
- グループ学習プラン
- 励まし合いメッセージ

**AI学習コーチ**
- 毎日のチェックインと励まし
- リアルタイムでの学習アドバイス
- 音声での学習サポート

**予測分析**
- 合格可能性の予測
- 必要学習時間の算出
- 弱点克服までの期間予測

**外部連携**
- Googleカレンダーとの同期
- リマインダー通知の強化
- 学習記録のエクスポート

---

## 📞 次のステップ

### 承認事項

1. **機能仕様の確認**: 上記の要件で問題ないか確認
2. **実装スケジュールの承認**: 8日間の開発期間で進めるか確認
3. **優先度の調整**: 他の機能との優先順位を確認

### 実装開始準備

承認いただければ、以下の順序で実装を開始します：

1. データモデルの作成
2. Firestore設定
3. AI Service関数の実装
4. UI実装
5. テストとデバッグ

---

**ご質問やご要望があれば、お気軽にお知らせください！**
