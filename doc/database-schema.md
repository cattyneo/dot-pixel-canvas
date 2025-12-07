# 4x4 Pixel Diary データベース設計書

## 概要

Supabase（PostgreSQL）を使用。匿名ユーザーによる絵の投稿・交換機能をサポート。

## テーブル設計

### posts テーブル

| カラム | 型 | NULL | デフォルト | 説明 |
|--------|-----|------|------------|------|
| id | UUID | NO | gen_random_uuid() | PK |
| title | TEXT | NO | - | タイトル（5文字以内、絵文字許可、特殊文字不可） |
| pixels | JSONB | NO | - | 16色HEX配列 |
| is_exchanged | BOOLEAN | NO | FALSE | 交換済みフラグ |
| created_at | TIMESTAMPTZ | NO | NOW() | 作成日時 |
| user_id | UUID | YES | NULL | 認証ユーザーID |
| ip_address | INET | YES | NULL | 不正対策用 |
| fingerprint | TEXT | YES | NULL | 匿名ユーザー識別（UUID v4形式） |
| work_seconds | INT | NO | 0 | 作業時間（秒）。分析・表示用 |
| likes_count | INT | NO | 0 | いいね数 |
| report_count | INT | NO | 0 | 通報数 |

#### 制約

- `title_length`: char_length(title) <= 5
- `pixels_format`: 配列長16

#### インデックス

| 名前 | 対象 | 用途 |
|------|------|------|
| idx_posts_is_exchanged | is_exchanged (部分) | 未交換絵の高速検索 |
| idx_posts_created_at | created_at DESC | 日時順ソート |
| idx_posts_fingerprint | fingerprint | 自己投稿除外検索 |
| idx_posts_pixels | pixels (HASH) | 同一盤面チェック |

#### pixels フォーマット

```json
["#ffffff", "#ffffff", ..., "#ffb7b2"]
```

- 配列長: 固定16要素
- 各要素: HEX形式（`/^#[0-9a-fA-F]{6}$/`）
- 配置: 左上から右下へ（0→15）

## RLS（Row Level Security）

### 方針

- 認証なしでも投稿・取得可能
- RPC関数（SECURITY DEFINER）経由でのみデータ操作
- 直接のINSERT/UPDATE/DELETEは禁止

### ポリシー

| 操作 | 条件 |
|------|------|
| SELECT | is_exchanged = TRUE のみ |

## ER図

```
┌─────────────────────────────────────┐
│              posts                   │
├─────────────────────────────────────┤
│ PK  id              UUID             │
│     title           TEXT             │
│     pixels          JSONB            │
│     is_exchanged    BOOLEAN          │
│     created_at      TIMESTAMPTZ      │
│ FK  user_id         UUID (nullable)  │
│     ip_address      INET (nullable)  │
│     fingerprint     TEXT (nullable)  │
│     work_seconds    INT              │
│     likes_count     INT              │
│     report_count    INT              │
└─────────────────────────────────────┘
```

## データフロー

```
Client A                    Client B
    │                           │
    │ exchange_art()            │ exchange_art()
    ▼                           ▼
┌─────────────────────────────────────┐
│           Supabase RPC               │
│                                      │
│  1. バリデーション                    │
│     - HEX形式、全白+空タイトル        │
│     - NGワード、特殊文字              │
│     - fingerprint形式                │
│     - work_seconds正規化(5〜3600)    │
│  2. 同一盤面チェック                  │
│     → 存在時: 投稿せずduplicate応答   │
│  3. INSERT (is_exchanged=FALSE)      │
│  4. SELECT WHERE                     │
│     is_exchanged=FALSE               │
│     AND id != new_id                 │
│     AND fingerprint != self (全履歴) │
│  5. UPDATE is_exchanged=TRUE         │
│  6. RETURN post or NULL              │
└─────────────────────────────────────┘
    │                           │
    ▼                           ▼
Receives B's art         Receives A's art
```

## マイグレーション

| ファイル | 内容 |
|----------|------|
| 20241207000001_create_posts.sql | テーブル、インデックス、RLS |
| 20241207000002_create_exchange_art_function.sql | RPC関数 |
| （Phase 1で追加予定） | カラム追加、RPC関数更新 |

## パフォーマンス考慮

- `FOR UPDATE SKIP LOCKED`: 同時実行時の競合回避
- 部分インデックス: 未交換絵のみ対象で効率化
- HASHインデックス: 同一盤面チェックの高速化

---

## 将来予定（Phase 3以降）

### likes テーブル

| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | PK |
| user_id | UUID | FK → auth.users |
| post_id | UUID | FK → posts |
| created_at | TIMESTAMPTZ | 作成日時 |

UNIQUE(user_id, post_id)

### reports テーブル

| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | PK |
| reporter_id | UUID | FK → auth.users |
| post_id | UUID | FK → posts |
| reason | TEXT | 通報理由 |
| created_at | TIMESTAMPTZ | 作成日時 |

### banned_users テーブル

| カラム | 型 | 説明 |
|--------|-----|------|
| user_id | UUID | PK, FK → auth.users |
| reason | TEXT | BAN理由 |
| banned_at | TIMESTAMPTZ | BAN日時 |
| expires_at | TIMESTAMPTZ | 解除日時 |
