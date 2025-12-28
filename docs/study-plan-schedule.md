# カスタム学習プラン機能 - 詳細実装スケジュール

**プロジェクト期間**: 8日間  
**開始予定日**: 2025年12月29日  
**完了予定日**: 2026年1月5日

---

## 📊 全体スケジュール概要

```
Week 1 (12/29 - 1/4)
├── Day 1-2: バックエンド開発
├── Day 3-5: フロントエンド開発
├── Day 6-7: 統合・テスト
└── Day 8: リリース準備

Week 2 (1/5)
└── リリース・モニタリング
```

---

## 🗓️ Day 1: データモデルとFirestore設定

**目標**: 学習プラン機能の基盤となるデータ構造を構築

### タスク一覧

#### 1. TypeScript型定義の作成（2時間）

**ファイル**: `lib/types.ts`

```typescript
// 追加する型定義

export interface StudyPlanInput {
  targetExamDate: Date;
  dailyStudyTime: {
    weekday: number;
    weekend: number;
  };
  currentLevel: {
    takkengyouhou: number;
    minpou: number;
    hourei: number;
    zei: number;
  };
  priorityCategories: string[];
  studyStyle: 'intensive' | 'distributed';
}

export interface StudyPlan {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  targetExamDate: Date;
  dailyStudyTime: {
    weekday: number;
    weekend: number;
  };
  currentLevel: {
    takkengyouhou: number;
    minpou: number;
    hourei: number;
    zei: number;
  };
  weeklyPlans: WeeklyPlan[];
  milestones: Milestone[];
  progress: StudyPlanProgress;
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
  categories: CategoryTask[];
  estimatedTime: number;
  completed: boolean;
  actualTime?: number;
}

export interface CategoryTask {
  category: string;
  newQuestions: number;
  reviewQuestions: number;
}

export interface Milestone {
  id: string;
  title: string;
  targetDate: Date;
  description: string;
  completed: boolean;
  completedAt?: Date;
}

export interface StudyPlanProgress {
  completedDays: number;
  totalDays: number;
  completedQuestions: number;
  targetQuestions: number;
  onTrack: boolean;
  daysAhead: number;
  categoryProgress: {
    [category: string]: {
      completed: number;
      target: number;
    };
  };
}
```

#### 2. Firestoreサービス関数の実装（3時間）

**ファイル**: `lib/study-plan-service.ts`（新規作成）

**実装する関数**:
- `createStudyPlan(userId: string, plan: StudyPlan): Promise<string>`
- `getStudyPlan(userId: string, planId: string): Promise<StudyPlan | null>`
- `getUserStudyPlans(userId: string): Promise<StudyPlan[]>`
- `updateStudyPlan(userId: string, planId: string, updates: Partial<StudyPlan>): Promise<void>`
- `deleteStudyPlan(userId: string, planId: string): Promise<void>`
- `updateDailyTaskCompletion(userId: string, planId: string, date: Date, completed: boolean): Promise<void>`
- `updateMilestoneCompletion(userId: string, planId: string, milestoneId: string, completed: boolean): Promise<void>`
- `calculateProgress(plan: StudyPlan, actualStats: StudyStats): StudyPlanProgress`

#### 3. Firestoreセキュリティルールの更新（1時間）

**ファイル**: `firestore.rules`

```javascript
match /studyPlans/{userId}/plans/{planId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

#### 4. ユニットテストの作成（2時間）

**ファイル**: `__tests__/study-plan-service.test.ts`

**テストケース**:
- プラン作成のテスト
- プラン取得のテスト
- プラン更新のテスト
- 進捗計算のテスト
- エラーハンドリングのテスト

**完了基準**:
- ✅ すべての型定義が完成
- ✅ Firestore CRUD関数が実装済み
- ✅ ユニットテストが全て通過
- ✅ TypeScriptコンパイルエラーなし

---

## 🗓️ Day 2: AI統合とプラン生成ロジック

**目標**: AIを使った学習プラン生成機能を実装

### タスク一覧

#### 1. AIプロンプト設計（2時間）

**ファイル**: `lib/ai-prompts.ts`（新規作成）

```typescript
export const STUDY_PLAN_SYSTEM_PROMPT = `あなたは宅地建物取引士試験の学習計画専門家です。
受験者の状況を分析し、合格に向けた最適な学習プランを作成してください。

【考慮事項】
1. 試験までの残り日数と1日の学習可能時間
2. 現在の理解度と弱点分野
3. 学習科学の原則（間隔反復、分散学習、交互学習）
4. モチベーション維持のための工夫
5. 現実的で達成可能なスケジュール

【プラン作成の原則】
- 無理のない現実的なスケジュール
- 定期的な復習セッションの組み込み
- 週次・月次の達成目標の設定
- 弱点分野への重点配分（通常の1.5倍の時間）
- 試験直前2週間は総復習期間
- 週末は復習と模試に充てる
- 新規学習と復習の比率は6:4

【カテゴリ別配分】
- 宅建業法: 35%（最重要）
- 権利関係: 30%（難易度高）
- 法令上の制限: 20%
- 税・その他: 15%

【出力形式】
JSON形式で以下の構造を出力してください：
{
  "summary": "プランの概要（200文字）",
  "advice": "学習アドバイス（150文字）",
  "totalDays": 計画日数,
  "totalQuestions": 予定問題数,
  "weeklyPlans": [週次プランの配列],
  "milestones": [マイルストーンの配列]
}`;

export function buildStudyPlanPrompt(input: StudyPlanInput): string {
  const daysUntilExam = Math.ceil(
    (input.targetExamDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  
  const avgDailyTime = 
    (input.dailyStudyTime.weekday * 5 + input.dailyStudyTime.weekend * 2) / 7;
  
  return `以下の条件で学習プランを作成してください：

【受験者情報】
- 試験日: ${input.targetExamDate.toLocaleDateString('ja-JP')}
- 残り日数: ${daysUntilExam}日
- 1日の学習時間: 平日${input.dailyStudyTime.weekday}分、休日${input.dailyStudyTime.weekend}分
- 平均学習時間: ${avgDailyTime}分/日

【現在の理解度】（5段階評価）
- 宅建業法: ${input.currentLevel.takkengyouhou}
- 権利関係: ${input.currentLevel.minpou}
- 法令上の制限: ${input.currentLevel.hourei}
- 税・その他: ${input.currentLevel.zei}

【優先分野】
${input.priorityCategories.join('、')}

【学習スタイル】
${input.studyStyle === 'intensive' ? '集中型（短期間で集中的に学習）' : '分散型（長期間でじっくり学習）'}

上記を考慮して、合格に向けた最適な学習プランを作成してください。`;
}
```

#### 2. AI Service関数の実装（3時間）

**ファイル**: `lib/ai-service.ts`（既存ファイルに追加）

**実装する関数**:
- `generateStudyPlan(input: StudyPlanInput, currentStats: StudyStats): Promise<StudyPlan>`
- `adjustStudyPlan(currentPlan: StudyPlan, actualProgress: StudyPlanProgress): Promise<StudyPlan>`
- `generateWeeklyAdvice(plan: StudyPlan, weekNumber: number): Promise<string>`

#### 3. レスポンス変換ロジック（2時間）

**ファイル**: `lib/study-plan-transformer.ts`（新規作成）

```typescript
export function transformAIResponseToPlan(
  aiResponse: any,
  input: StudyPlanInput,
  userId: string
): StudyPlan {
  // AI生成データをStudyPlan型に変換
  // 日付の計算、IDの生成、デフォルト値の設定など
}

export function generateDailyTasks(
  weekPlan: any,
  dailyStudyTime: { weekday: number; weekend: number }
): DailyTask[] {
  // 週次プランから日次タスクを生成
}
```

#### 4. エラーハンドリングとリトライロジック（1時間）

**実装内容**:
- API呼び出し失敗時のリトライ（最大3回）
- タイムアウト処理（30秒）
- フォールバック処理（テンプレートプラン）

#### 5. 統合テスト（2時間）

**テストケース**:
- 正常系: プラン生成成功
- 異常系: API失敗時のフォールバック
- エッジケース: 試験まで1週間の場合
- エッジケース: 試験まで6ヶ月の場合

**完了基準**:
- ✅ AI関数が正常に動作
- ✅ プラン生成が5秒以内に完了
- ✅ エラー時のフォールバックが機能
- ✅ 統合テストが全て通過

---

## 🗓️ Day 3: 初期設定画面の実装

**目標**: ユーザーがプラン作成に必要な情報を入力できる画面を実装

### タスク一覧

#### 1. ルーティング設定（30分）

**ファイル**: `app/study-plan/_layout.tsx`（新規作成）

```typescript
import { Stack } from 'expo-router';

export default function StudyPlanLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: '学習プラン',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: 'プラン作成',
          headerShown: true,
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
```

#### 2. プラン一覧画面（1時間）

**ファイル**: `app/study-plan/index.tsx`（新規作成）

**機能**:
- 既存プランの一覧表示
- 「新しいプランを作成」ボタン
- プランカードのタップで詳細へ遷移
- プランがない場合の空状態表示

#### 3. 初期設定入力画面（4時間）

**ファイル**: `app/study-plan/create.tsx`（新規作成）

**実装するコンポーネント**:

```typescript
// 目標試験日選択
<DatePickerSection
  label="目標試験日"
  value={targetExamDate}
  onChange={setTargetExamDate}
  minimumDate={new Date()}
/>

// 学習時間設定
<StudyTimeSection
  weekdayTime={weekdayTime}
  weekendTime={weekendTime}
  onWeekdayChange={setWeekdayTime}
  onWeekendChange={setWeekendTime}
/>

// 現在の理解度
<LevelAssessmentSection
  levels={currentLevel}
  onChange={setCurrentLevel}
/>

// 優先分野選択
<PrioritySection
  selected={priorityCategories}
  onChange={setPriorityCategories}
/>

// 学習スタイル
<StudyStyleSection
  value={studyStyle}
  onChange={setStudyStyle}
/>
```

#### 4. バリデーション実装（1時間）

**検証項目**:
- 試験日が未来の日付であること
- 試験日が3日以上先であること
- 学習時間が15分以上であること
- 理解度が全カテゴリで入力されていること

#### 5. ローディング状態とエラー処理（1.5時間）

**実装内容**:
- プラン生成中のローディング画面
- 進捗インジケーター
- エラー時のエラーメッセージ表示
- リトライボタン

**完了基準**:
- ✅ 入力フォームが正常に動作
- ✅ バリデーションが機能
- ✅ プラン生成が成功
- ✅ エラー時の処理が適切

---

## 🗓️ Day 4: プラン表示画面の実装

**目標**: 生成された学習プランを視覚的に表示

### タスク一覧

#### 1. プラン詳細画面の基本構造（1時間）

**ファイル**: `app/study-plan/[planId]/index.tsx`（新規作成）

```typescript
export default function StudyPlanDetailScreen() {
  const { planId } = useLocalSearchParams();
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  
  return (
    <ScrollView>
      <PlanSummaryCard plan={plan} />
      <WeeklyCalendar plan={plan} />
      <CategoryProgress plan={plan} />
      <DailyTaskList plan={plan} />
      <MilestoneTimeline plan={plan} />
    </ScrollView>
  );
}
```

#### 2. サマリーカードコンポーネント（1.5時間）

**ファイル**: `components/study-plan/PlanSummaryCard.tsx`（新規作成）

**表示内容**:
- プラン作成日
- 目標試験日
- 残り日数
- 総学習時間
- 予想問題数
- 進捗率
- AIサマリー

#### 3. 週次カレンダーコンポーネント（2時間）

**ファイル**: `components/study-plan/WeeklyCalendar.tsx`（新規作成）

**機能**:
- 週ごとの表示
- スワイプで週の切り替え
- 各日のタスク表示
- 完了状態の表示
- タップで日次詳細へ

#### 4. カテゴリ別進捗コンポーネント（1.5時間）

**ファイル**: `components/study-plan/CategoryProgress.tsx`（新規作成）

**表示内容**:
- 4カテゴリの進捗バー
- 完了問題数 / 目標問題数
- 達成率（%）
- 色分け（達成度に応じて）

#### 5. 今日のタスクリストコンポーネント（1.5時間）

**ファイル**: `components/study-plan/DailyTaskList.tsx`（新規作成）

**機能**:
- 今日のタスク一覧
- 「学習開始」ボタン
- タスク完了チェック
- 推定学習時間の表示

#### 6. マイルストーンタイムラインコンポーネント（1.5時間）

**ファイル**: `components/study-plan/MilestoneTimeline.tsx`（新規作成）

**表示内容**:
- マイルストーン一覧
- 目標日
- 完了状態
- 進捗インジケーター

**完了基準**:
- ✅ 全コンポーネントが正常に表示
- ✅ データが正しく表示される
- ✅ インタラクションが機能
- ✅ レスポンシブデザイン

---

## 🗓️ Day 5: 進捗管理とプラン調整機能

**目標**: 学習進捗のトラッキングとプラン再生成機能を実装

### タスク一覧

#### 1. 進捗計算ロジック（2時間）

**ファイル**: `lib/study-plan-service.ts`（追加）

**実装する関数**:
```typescript
export function calculatePlanProgress(
  plan: StudyPlan,
  actualStats: StudyStats,
  studySessions: StudySession[]
): StudyPlanProgress {
  // 実際の学習データとプランを比較
  // 進捗率、遅れ日数、カテゴリ別進捗を計算
}

export function isOnTrack(
  plan: StudyPlan,
  progress: StudyPlanProgress
): boolean {
  // プラン通りに進んでいるか判定
}

export function calculateDaysAhead(
  plan: StudyPlan,
  progress: StudyPlanProgress
): number {
  // 予定より何日進んでいる/遅れているか
}
```

#### 2. 進捗アラート機能（1.5時間）

**ファイル**: `components/study-plan/ProgressAlert.tsx`（新規作成）

**アラートタイプ**:
- 遅れアラート（3日以上遅れ）
- 順調アラート（計画通り）
- 先行アラート（予定より早い）

#### 3. プラン調整画面（2時間）

**ファイル**: `app/study-plan/[planId]/adjust.tsx`（新規作成）

**機能**:
- 現在の進捗状況表示
- 調整理由の選択
- 新しい目標日の設定
- 学習時間の再設定
- 「プラン再生成」ボタン

#### 4. プラン再生成ロジック（2時間）

**ファイル**: `lib/ai-service.ts`（追加）

```typescript
export async function adjustStudyPlan(
  currentPlan: StudyPlan,
  actualProgress: StudyPlanProgress,
  newSettings?: Partial<StudyPlanInput>
): Promise<StudyPlan> {
  // 現在の進捗を考慮して新しいプランを生成
  // 完了済みのタスクは維持
  // 未完了のタスクを再配分
}
```

#### 5. タスク完了機能（1.5時間）

**実装内容**:
- タスク完了チェックボックス
- Firestoreへの保存
- 進捗の再計算
- UI更新

#### 6. 統合とテスト（1時間）

**テストケース**:
- 進捗計算の正確性
- プラン調整の動作確認
- タスク完了の保存確認

**完了基準**:
- ✅ 進捗が正確に計算される
- ✅ プラン調整が正常に動作
- ✅ タスク完了が保存される
- ✅ アラートが適切に表示される

---

## 🗓️ Day 6: 機能統合とナビゲーション

**目標**: 既存機能との統合と導線の整備

### タスク一覧

#### 1. ホーム画面への統合（2時間）

**ファイル**: `app/(tabs)/index.tsx`（修正）

**追加要素**:
```typescript
// 学習プランカード
<StudyPlanCard
  plan={currentPlan}
  onPress={() => router.push(`/study-plan/${currentPlan.id}`)}
/>

// 今日のタスク表示
<TodayTasksWidget
  tasks={todayTasks}
  onStartStudy={handleStartStudy}
/>
```

#### 2. プレミアム機能一覧への追加（1時間）

**ファイル**: `app/subscription/index.tsx`（修正）

**追加する説明**:
- 「AIカスタム学習プラン」
- 「試験日までの最適スケジュール」
- 「進捗に応じた自動調整」

#### 3. 学習機能との連携（2時間）

**実装内容**:
- プランからの問題セット起動
- 学習完了時のプラン進捗更新
- カテゴリ選択画面でのプラン推奨表示

**ファイル**: `app/study/index.tsx`（修正）

```typescript
// プランからの推奨カテゴリ表示
{currentPlan && (
  <RecommendedByPlan
    category={currentPlan.todayRecommendation}
    questionCount={currentPlan.todayQuestionCount}
  />
)}
```

#### 4. 通知機能との連携（1.5時間）

**実装内容**:
- プラン開始時に学習リマインダー設定
- マイルストーン達成通知
- 遅れアラート通知

**ファイル**: `lib/notification-service.ts`（追加）

```typescript
export async function schedulePlanReminders(plan: StudyPlan): Promise<void> {
  // プランに基づいた通知をスケジュール
}

export async function sendMilestoneNotification(
  milestone: Milestone
): Promise<void> {
  // マイルストーン達成通知
}
```

#### 5. データ同期の確認（1.5時間）

**確認項目**:
- Firestoreへの保存確認
- リアルタイム更新の動作確認
- オフライン時の動作確認
- データ整合性の確認

#### 6. パフォーマンス最適化（2時間）

**最適化項目**:
- 画像の遅延読み込み
- リスト仮想化
- メモ化（useMemo, useCallback）
- 不要な再レンダリングの削減

**完了基準**:
- ✅ ホーム画面にプラン表示
- ✅ 学習機能との連携動作
- ✅ 通知が正常にスケジュール
- ✅ データ同期が正常

---

## 🗓️ Day 7: テストとデバッグ

**目標**: 全機能の動作確認とバグ修正

### タスク一覧

#### 1. E2Eテストシナリオ実行（3時間）

**シナリオ1: プラン作成フロー**
1. ホーム画面から「学習プラン作成」をタップ
2. 初期設定を入力
3. プラン生成を実行
4. 生成されたプランを確認
5. タスクを完了
6. 進捗を確認

**シナリオ2: プラン調整フロー**
1. 既存プランを開く
2. 進捗が遅れている状態を作る
3. 調整アラートを確認
4. プラン調整を実行
5. 新しいプランを確認

**シナリオ3: 学習連携フロー**
1. プランから学習開始
2. 問題を解答
3. プラン進捗が更新されることを確認
4. ホーム画面の表示が更新されることを確認

#### 2. エッジケースのテスト（2時間）

**テストケース**:
- 試験まで3日の場合
- 試験まで180日の場合
- 学習時間が極端に少ない場合（15分/日）
- 学習時間が極端に多い場合（4時間/日）
- 全カテゴリの理解度が1の場合
- 全カテゴリの理解度が5の場合

#### 3. エラーハンドリングのテスト（1.5時間）

**テストケース**:
- API呼び出し失敗
- ネットワークエラー
- Firestore書き込み失敗
- 不正なデータ形式

#### 4. UI/UXの微調整（2時間）

**調整項目**:
- ボタンのタップ領域
- スクロールの滑らかさ
- アニメーションのタイミング
- フォントサイズと行間
- 色のコントラスト

#### 5. パフォーマンステスト（1時間）

**測定項目**:
- プラン生成時間（目標: 5秒以内）
- 画面遷移速度（目標: 300ms以内）
- メモリ使用量
- バッテリー消費

#### 6. バグ修正（2.5時間）

**予想される問題**:
- 日付計算のずれ
- 進捗計算の誤差
- UI表示の崩れ
- データ同期の遅延

**完了基準**:
- ✅ 全E2Eシナリオが成功
- ✅ エッジケースが正常動作
- ✅ エラー処理が適切
- ✅ UI/UXが洗練されている
- ✅ パフォーマンスが基準内

---

## 🗓️ Day 8: リリース準備

**目標**: ドキュメント作成とリリース

### タスク一覧

#### 1. ユーザー向けガイド作成（2時間）

**ファイル**: `docs/user-guide-study-plan.md`

**内容**:
- 学習プラン機能の概要
- プラン作成方法
- プランの見方
- タスクの完了方法
- プラン調整方法
- よくある質問

#### 2. 開発者向けドキュメント（1.5時間）

**ファイル**: `docs/dev-study-plan.md`

**内容**:
- アーキテクチャ概要
- データモデル
- API仕様
- 関数リファレンス
- トラブルシューティング

#### 3. プレミアム機能説明の更新（1時間）

**ファイル**: `app/subscription/index.tsx`

**更新内容**:
- 学習プラン機能の詳細説明
- スクリーンショット追加
- ベネフィットの強調

#### 4. リリースノート作成（1時間）

**ファイル**: `CHANGELOG.md`

```markdown
## [1.5.0] - 2026-01-05

### 追加
- 🎯 AIカスタム学習プラン生成機能
  - 個別最適化された学習スケジュール
  - 進捗に応じた自動調整
  - マイルストーン管理
  - 今日のタスク表示
  
### 改善
- ホーム画面に学習プラン表示を追加
- 学習機能とプランの連携強化
- 通知機能にプラン関連通知を追加

### 技術
- OpenAI GPT-4.1-mini統合
- Firestore studyPlansコレクション追加
- 新規コンポーネント10個追加
```

#### 5. GitHubへのコミット（1時間）

**コミット手順**:
```bash
git checkout -b feature/study-plan
git add .
git commit -m "feat: AIカスタム学習プラン生成機能を実装"
git push origin feature/study-plan
# プルリクエスト作成
```

#### 6. 最終動作確認（1.5時間）

**確認項目**:
- 本番環境でのビルド確認
- 全機能の動作確認
- パフォーマンス確認
- エラーログの確認

#### 7. リリース（2時間）

**リリース手順**:
1. プルリクエストのマージ
2. バージョンタグの作成
3. リリースノートの公開
4. モニタリング開始

**完了基準**:
- ✅ ドキュメントが完成
- ✅ GitHubにコミット済み
- ✅ リリースノート公開
- ✅ 本番環境で動作確認

---

## 📊 進捗管理

### デイリーチェックリスト

各日の終わりに以下を確認：

- [ ] 計画したタスクが完了
- [ ] コードがGitHubにコミット
- [ ] テストが全て通過
- [ ] ドキュメントが更新
- [ ] 次の日の準備完了

### リスク管理

| リスク | 影響 | 対策 |
|--------|------|------|
| API呼び出し制限 | 高 | フォールバック実装、キャッシュ活用 |
| プラン生成時間超過 | 中 | タイムアウト設定、ローディング表示 |
| データ同期エラー | 中 | リトライロジック、エラー通知 |
| UI実装の遅延 | 低 | シンプルなデザインで開始 |

### コミュニケーション

**日次報告**:
- 完了したタスク
- 進行中のタスク
- ブロッカー
- 翌日の予定

---

## 🎯 成功基準

### 機能要件

- ✅ プラン作成が5秒以内に完了
- ✅ プラン表示が滑らかに動作
- ✅ 進捗計算が正確
- ✅ プラン調整が正常に機能
- ✅ 学習機能との連携が動作

### 品質要件

- ✅ ユニットテストカバレッジ80%以上
- ✅ E2Eテスト全シナリオ成功
- ✅ TypeScriptエラーゼロ
- ✅ ESLint警告ゼロ
- ✅ パフォーマンス基準達成

### ユーザー体験

- ✅ 直感的で使いやすいUI
- ✅ エラーメッセージがわかりやすい
- ✅ ローディング状態が明確
- ✅ レスポンシブデザイン
- ✅ アクセシビリティ対応

---

## 📞 次のステップ

このスケジュールで進めることに同意いただければ、**Day 1のタスクから実装を開始**します。

ご質問や調整が必要な箇所があれば、お気軽にお知らせください！
