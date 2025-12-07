# 4x4 Pixel Diary データベース設計書

## 概要

Supabase（PostgreSQL）を使用したデータベース設計。
匿名ユーザーによる絵の投稿・交換機能をサポート。

## テーブル設計

### posts テーブル

絵の投稿データを管理するメインテーブル。

```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  pixels JSONB NOT NULL,
  is_exchanged BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 制約
  CONSTRAINT title_length CHECK (char_length(title) <= 5),
  CONSTRAINT pixels_format CHECK (
    jsonb_typeof(pixels) = 'array'
    AND jsonb_array_length(pixels) = 16
  )
);

-- インデックス
CREATE INDEX idx_posts_is_exchanged ON posts(is_exchanged) WHERE is_exchanged = FALSE;
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
```

#### カラム詳細

| カラム | 型 | NULL | デフォルト | 説明 |
|--------|-----|------|------------|------|
| id | UUID | NO | gen_random_uuid() | プライマリキー |
| title | TEXT | NO | - | 絵のタイトル（5文字以内） |
| pixels | JSONB | NO | - | 16色の配列（例: ["#ffffff", "#ffb7b2", ...] ） |
| is_exchanged | BOOLEAN | NO | FALSE | 交換済みフラグ |
| created_at | TIMESTAMPTZ | NO | NOW() | 作成日時 |

#### pixels フォーマット

```json
[
  "#ffffff", "#ffffff", "#ffffff", "#ffffff",
  "#ffffff", "#ffb7b2", "#ffb7b2", "#ffffff",
  "#ffffff", "#ffb7b2", "#ffb7b2", "#ffffff",
  "#ffffff", "#ffffff", "#ffffff", "#ffffff"
]
```

- 配列長: 固定16要素
- 各要素: HEX形式の色コード（例: #ffffff）
- インデックス配置:
  ```
  [ 0][ 1][ 2][ 3]
  [ 4][ 5][ 6][ 7]
  [ 8][ 9][10][11]
  [12][13][14][15]
  ```

## RLS（Row Level Security）ポリシー

### 設計方針

- 認証なし（匿名アクセス）でも投稿・取得可能
- RPC関数経由でのみデータ操作を許可
- 直接のINSERT/UPDATE/DELETEは禁止

```sql
-- RLSを有効化
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 全ユーザーがSELECT可能（交換済みの絵のみ）
CREATE POLICY "Anyone can view exchanged posts"
  ON posts
  FOR SELECT
  USING (is_exchanged = TRUE);

-- RPC関数用のサービスロールポリシー
-- exchange_art関数はSECURITY DEFINERで実行されるため、
-- RLSをバイパスして全操作が可能
```

## ER図

```
┌─────────────────────────────────────────────┐
│                   posts                      │
├─────────────────────────────────────────────┤
│ PK  id              UUID                     │
│     title           TEXT                     │
│     pixels          JSONB                    │
│     is_exchanged    BOOLEAN                  │
│     created_at      TIMESTAMPTZ              │
└─────────────────────────────────────────────┘
```

## データフロー

```
┌──────────────┐          ┌──────────────┐
│   Client A   │          │   Client B   │
└──────┬───────┘          └──────┬───────┘
       │                         │
       │ exchange_art()          │ exchange_art()
       ▼                         ▼
┌─────────────────────────────────────────────┐
│              Supabase RPC                    │
│                                             │
│  1. INSERT new post (is_exchanged=FALSE)    │
│  2. SELECT random post WHERE                │
│     is_exchanged=FALSE AND id != new_id     │
│  3. UPDATE selected post (is_exchanged=TRUE)│
│  4. RETURN selected post (or NULL)          │
│                                             │
└─────────────────────────────────────────────┘
       │                         │
       ▼                         ▼
┌──────────────┐          ┌──────────────┐
│ Receives B's │          │ Receives A's │
│    art       │          │    art       │
└──────────────┘          └──────────────┘
```

## マイグレーション戦略

### 初期マイグレーション

1. `001_create_posts.sql` - テーブル作成、インデックス、RLSポリシー
2. `002_exchange_art_function.sql` - RPC関数作成

### ロールバック

各マイグレーションにはDOWN文を含める。

```sql
-- 001_create_posts.sql のロールバック
DROP TABLE IF EXISTS posts;

-- 002_exchange_art_function.sql のロールバック
DROP FUNCTION IF EXISTS exchange_art;
```

## パフォーマンス考慮

### インデックス戦略

- `idx_posts_is_exchanged`: 未交換の絵を高速検索（部分インデックス）
- `idx_posts_created_at`: 日時順ソート用

### クエリ最適化

- `FOR UPDATE SKIP LOCKED`: 同時実行時の競合回避
- `LIMIT 1`: ランダム選択時の取得件数制限

## バックアップ・リカバリ

Supabaseの標準バックアップ機能を使用:
- Point-in-Time Recovery（PITR）
- 日次自動バックアップ
