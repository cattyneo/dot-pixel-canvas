# 改修ロードマップ

## このファイルについて

4x4 Pixel Diaryの改修ロードマップ。本ドキュメントを参照して改修を進めるが、ユーザー指示や実装方針と矛盾する場合は質問すること。

## ロードマップ概要

| Phase   | 内容                          | 目安  |
| ------- | ----------------------------- | ----- |
| Phase 0 | 基盤整備                      | 完了  |
| Phase 1 | 基盤強化                      | 1日   |
| Phase 2 | UX改善                        | 1日   |
| Phase 3 | ユーザー認証 + ソーシャル機能 | 1週間 |
| Phase 4 | 収益化とスケール              | 1ヶ月 |

## アーキテクチャ方針

### サーバーサイド処理の役割分担

| レイヤー        | 役割                                                    | 実装                                        |
| --------------- | ------------------------------------------------------- | ------------------------------------------- |
| Edge Middleware | IP/UAベースの一次防御、DoS対策、レートリミット          | Vercel Edge Middleware + @upstash/ratelimit |
| Server Actions  | クライアントからの入口、fingerprint/IP取得、RPC呼び出し | Next.js Server Actions                      |
| RPC関数         | 入力バリデーション、ビジネスロジック、DB操作            | Supabase RPC (SECURITY DEFINER)             |

**原則**: DBのpostsテーブルへの書き込みは `exchange_art` RPC関数経由のみ。直接のINSERT/UPDATE/DELETEはRLSで禁止。

---

## Phase 0: 基盤整備 ✅

- [x] Vercel公開
- [x] 環境変数設定
- [x] 本番DBマイグレーション確認

---

## Phase 1: 基盤強化

### 1.1 DBスキーマ改善

postsテーブルに以下カラムを追加:

- `user_id` (UUID, nullable) - 将来の認証連携用
- `likes_count` (INT) - いいね数
- `report_count` (INT) - 通報数
- `ip_address` (INET) - 不正対策用
- `fingerprint` (TEXT) - 匿名ユーザー識別用（UUID v4形式）
- `work_seconds` (INT) - 作業時間（秒）

### 1.2 サーバー側強化

| 優先度 | 項目                   | 詳細                                                               |
| ------ | ---------------------- | ------------------------------------------------------------------ |
| P0     | HEXカラー検証          | 各要素が `/^#[0-9a-fA-F]{6}$/` に適合                              |
| P0     | 盤面データ検証         | 配列長16固定、全要素がHEX形式                                      |
| P1     | タイトル検証           | 5文字以内、トリム、特殊文字除去（絵文字は許可）                    |
| P1     | fingerprint検証        | UUID v4形式                                                        |
| P1     | 全白+タイトル空拒否    | RPC関数内でFR-004バリデーション実施                                |
| P1     | 自己投稿除外           | fingerprintで同一ユーザーの過去投稿すべてを交換対象から除外        |
| P1     | レートリミット         | RPC内でposts履歴を参照して制限（3 posts/20sec, 20 posts/300sec）   |
| P1     | 同一盤面チェック       | 既存と同じpixels → 投稿せずduplicate応答                           |
| P2     | NGワードチェック       | RPC関数内にハードコード、部分一致、大文字小文字無視                |
| P2     | pixels型正規化         | Server Actions層でRPC戻り値をパースし、型を統一                    |
| P2     | 作業時間計測           | クライアント側でアクティブ時間計測、RPC関数でクリップ（5〜3600秒） |
| -      | Supabaseシングルトン化 | コネクション管理の最適化                                           |

### 1.3 fingerprint管理

- 初回訪問時にUUID v4を生成しlocalStorageに保存
- キー名: `pixel_diary_fingerprint`
- localStorage無効時はセッション中のみメモリ保持

### 1.4 テスト戦略

| 種別     | 対象                         | ツール                |
| -------- | ---------------------------- | --------------------- |
| Unit     | lib/actions.ts, hooks        | Vitest                |
| E2E      | 交換フロー全体、エラーケース | Playwright            |
| 視覚回帰 | UIコンポーネント             | Playwright screenshot |

---

## Phase 2: UX改善

### 2.1 UI/UXブラッシュアップ

#### 2.1.1 UIフレームワーク

- shadcn/ui 導入
- next-themes（ダークモード対応）
- 既存デザイン仕様（カラーパレット・レイアウト・フォント）をTailwind/Theme設定に反映
- ダークモード用カラーパレット適用

#### 2.1.2 フィードバック改善

| 優先度 | 項目           | 詳細                                   |
| ------ | -------------- | -------------------------------------- |
| P1     | 確認ダイアログ | confirm()をshadcn/ui AlertDialogに置換 |
| P1     | トースト通知   | alert()をsonnerに置換                  |
| P2     | ローディング   | スケルトンUI、Hydrationローディング    |
| P2     | アニメーション | 交換成功時エフェクト                   |

#### 2.1.3 パフォーマンス最適化

| 優先度 | 項目                    | 詳細                                |
| ------ | ----------------------- | ----------------------------------- |
| P1     | Web Vitals計測          | Next.js標準 + Vercel Analytics導入  |
| P1     | フォント最適化          | `font-display: swap`、next/font使用 |
| P2     | FCP/LCPボトルネック調査 | Lighthouse / PageSpeed Insights     |

#### 2.1.4 レスポンシブ強化

- モバイル/タブレット最適化

### 2.2 PWA対応（ライト版）

- next-pwa導入
- manifest / icons整備（ホーム画面追加可能にする）
- App Shell（トップページ）＋静的アセットのキャッシュ
- オフライン時：
    - アプリ起動・アルバム閲覧は可能（localStorage依存）
    - 「こうかんする」は無効化し、「オフラインのため交換できません」などのメッセージ表示
- ※ オフライン投稿キュー / バックグラウンド同期 / Push通知などは Phase3+ で検討

---

## Phase 3: ユーザー認証 + ソーシャル機能

### 3.1 認証システム（Supabase Auth）

- メール/パスワード
- OAuth（Google, Twitter等）
- 匿名認証 → アカウント昇格

### 3.2 クラウド保存

- アルバムのSupabase保存
- localStorage → Supabase移行
- デバイス間同期

### 3.3 いいねシステム

likesテーブル: user_id, post_id, created_at（UNIQUE制約）

### 3.4 通報/BANシステム

- reportsテーブル: reporter_id, post_id, reason
- banned_usersテーブル: user_id, reason, expires_at

### 3.5 ギャラリー機能

- 交換済み絵の匿名公開
- いいねランキング
- 期間限定イベント

### 3.6 アナリティクス

| 優先度 | 項目               | 詳細                               |
| ------ | ------------------ | ---------------------------------- |
| P2     | パフォーマンス監視 | FCP/LCP閾値アラート（NFR-002準拠） |
| -      | ユーザー行動分析   | PostHog / Mixpanel                 |
| -      | カスタム指標       | 交換成功率、滞在時間等             |

### 3.7 ユーザーフロー拡張

- 匿名利用フローとログイン済みフローの2パターンに分岐
- requirements.mdのユーザーフロー図を更新

---

## Phase 4: 収益化とスケール

### 4.1 広告

- Google AdSense（アルバム下部、交換完了後）

### 4.2 サブスク課金（Stripe）

- Stripe Checkout / Payment Links
- Webhook → Supabase権限管理

### 4.3 プレミアム特典

| 特典           | 無料  | プレミアム |
| -------------- | ----- | ---------- |
| 広告           | あり  | なし       |
| アルバム保存数 | 100枚 | 無制限     |
| カスタムスキン | なし  | あり       |

### 4.4 多言語対応（i18n）

- next-intl: 日本語 / 英語 / 韓国語

### 4.5 モバイルアプリ化

- Capacitor（既存コード流用）

### 4.6 セキュリティ強化

- CSP、CORS設定
- Cloudflare（DDoS対策、WAF）

---

## ドキュメント運用ルール

| 対象               | 同期タイミング               |
| ------------------ | ---------------------------- |
| database-schema.md | マイグレーション作成時に更新 |
| api-spec.md        | RPC関数変更時に更新          |
| requirements.md    | 機能追加/変更時に更新        |

※ マイグレーションファイルが正、ドキュメントは参照用
