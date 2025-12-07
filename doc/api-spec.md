# 4x4 Pixel Diary API仕様書

## 概要

Supabase RPC（Remote Procedure Call）を使用したサーバーサイドAPI。

## アーキテクチャ

```
Client → Edge Middleware → Server Actions → RPC関数 → DB
         (レートリミット)   (入口/fingerprint取得)  (ビジネスロジック)
```

## RPC関数

### exchange_art

絵を投稿し、他のユーザーの絵と交換する。

#### シグネチャ

```
exchange_art(
  new_title TEXT,
  new_pixels JSONB,
  client_fingerprint TEXT,
  client_ip INET,
  work_seconds INT DEFAULT 0
) RETURNS JSONB
```

#### パラメータ

| パラメータ         | 型    | 必須 | 説明                                                                                      |
| ------------------ | ----- | ---- | ----------------------------------------------------------------------------------------- |
| new_title          | TEXT  | YES  | タイトル（5文字以内、トリム済み、特殊文字除去済み）                                       |
| new_pixels         | JSONB | YES  | 16色のHEX配列                                                                             |
| client_fingerprint | TEXT  | YES  | UUID v4形式（`/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`） |
| client_ip          | INET  | NO   | クライアントIP（Server Actions経由で取得）                                                |
| work_seconds       | INT   | NO   | 作業時間（秒）。MIN(5)未満→0、MAX(3600)超→クリップ                                        |

#### 戻り値

| ケース   | 戻り値                                                                         |
| -------- | ------------------------------------------------------------------------------ |
| 交換成功 | `{ id, title, pixels, created_at }`                                            |
| 交換待ち | `null`                                                                         |
| 同一盤面 | `{ duplicate: true, id, title, pixels, created_at }` ※既存の同一盤面の絵データ |
| エラー   | 例外発生（SQLSTATE）                                                           |

**注意**:

- `pixels`フィールドはJSON文字列として返却される。Server Actions層でパースして型を統一する。
- 同一盤面の場合、投稿者の絵は**DBに保存されない**。

#### 処理フロー

1. **入力バリデーション**
    - タイトル: 5文字以内、トリム、特殊文字除去（絵文字は許可）
    - pixels: 16要素の配列
    - 各pixel: 有効なHEX形式（`/^#[0-9a-fA-F]{6}$/`）
    - fingerprint: UUID v4形式
    - work_seconds: 5未満→0、3600超→3600にクリップ
    - 全白 かつ タイトル空 → 拒否
    - NGワード → 拒否（部分一致、大文字小文字無視）

2. **同一盤面チェック**
    - 既存postsと同じpixels配列が存在 → 投稿せずduplicate応答（既存データを返却）

3. **投稿登録**
    - postsテーブルにINSERT（is_exchanged=FALSE, fingerprint, ip_address, work_seconds）

4. **交換相手検索**
    - 条件: is_exchanged=FALSE AND id≠自分 AND fingerprint≠自分（過去投稿すべて除外）
    - ORDER BY RANDOM() LIMIT 1 FOR UPDATE SKIP LOCKED

5. **交換処理**
    - 相手あり: is_exchanged=TRUEに更新、相手のデータを返却
    - 相手なし: NULLを返却

#### エラーコード

| SQLSTATE | メッセージ                           | 原因                |
| -------- | ------------------------------------ | ------------------- |
| 22001    | Title must be 5 characters or less   | タイトル超過        |
| 22023    | Pixels must be an array of 16 colors | 配列形式不正        |
| 22023    | Invalid pixel format                 | HEX形式不正         |
| 22023    | Invalid fingerprint format           | fingerprint形式不正 |
| 22023    | Empty canvas with no title           | 全白+タイトル空     |
| 22023    | Title contains inappropriate words   | NGワード検出        |
| 22023    | Title contains invalid characters    | 特殊文字検出        |
| 42501    | Rate limit exceeded                  | レートリミット超過  |

## セキュリティ

### SECURITY DEFINER

- RLSをバイパスして実行
- 入力バリデーションは関数内で必須
- DBへの書き込みはこのRPC関数経由のみ

### Rate Limiting

RPC内でposts履歴を参照して実装（外部Redis不要）

| 制限 | 値              | 目的             |
| ---- | --------------- | ---------------- |
| 短期 | 3 posts/20sec   | バースト防止     |
| 長期 | 20 posts/300sec | 持続的な乱用防止 |

超過時: SQLSTATE `42501` (rate_limit_exceeded)

### NGワード

- 管理場所: RPC関数内にハードコード（クライアントから隠蔽）
- マッチング: 部分一致、大文字小文字無視
- 初期リスト: 差別用語、暴力的表現（5〜10語程度）

## 監視項目（推奨）

- 関数呼び出し回数
- 交換成功率
- 平均レスポンスタイム
- エラー発生率
- レートリミット発動回数
