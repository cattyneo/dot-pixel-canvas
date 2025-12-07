# 4x4 Pixel Diary API仕様書

## 概要

Supabase RPC（Remote Procedure Call）を使用したサーバーサイドAPI。
クライアントから直接呼び出し可能な関数を提供。

## RPC関数

### exchange_art

絵を投稿し、他のユーザーの絵と交換する。

#### 関数シグネチャ

```sql
CREATE OR REPLACE FUNCTION exchange_art(
  new_title TEXT,
  new_pixels JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
```

#### パラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| new_title | TEXT | YES | 投稿する絵のタイトル（5文字以内） |
| new_pixels | JSONB | YES | 16色の配列（JSON文字列） |

#### 戻り値

成功時（交換相手あり）:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "ねこ",
  "pixels": "[\"#ffffff\", \"#ffb7b2\", ...]",
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

成功時（交換相手なし）:
```json
null
```

エラー時:
```json
{
  "error": "エラーメッセージ"
}
```

#### 処理フロー

```
1. 入力バリデーション
   - new_title: 5文字以内
   - new_pixels: 16要素の配列

2. 新しい絵を投稿
   INSERT INTO posts (title, pixels, is_exchanged)
   VALUES (new_title, new_pixels, FALSE)
   RETURNING id INTO new_post_id

3. 交換相手を検索（ランダム選択）
   SELECT * FROM posts
   WHERE is_exchanged = FALSE
     AND id != new_post_id
   ORDER BY RANDOM()
   LIMIT 1
   FOR UPDATE SKIP LOCKED

4. 交換相手が見つかった場合
   - 選択した絵を is_exchanged = TRUE に更新
   - 選択した絵のデータを返却

5. 交換相手が見つからなかった場合
   - NULL を返却
```

#### 実装コード

```sql
CREATE OR REPLACE FUNCTION exchange_art(
  new_title TEXT,
  new_pixels JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_post_id UUID;
  exchanged_post RECORD;
  result JSONB;
BEGIN
  -- 入力バリデーション
  IF char_length(new_title) > 5 THEN
    RAISE EXCEPTION 'Title must be 5 characters or less';
  END IF;
  
  IF jsonb_typeof(new_pixels) != 'array' OR jsonb_array_length(new_pixels) != 16 THEN
    RAISE EXCEPTION 'Pixels must be an array of 16 colors';
  END IF;

  -- 新しい絵を投稿
  INSERT INTO posts (title, pixels, is_exchanged)
  VALUES (new_title, new_pixels, FALSE)
  RETURNING id INTO new_post_id;

  -- 交換相手を検索（競合回避のためFOR UPDATE SKIP LOCKED）
  SELECT id, title, pixels, created_at
  INTO exchanged_post
  FROM posts
  WHERE is_exchanged = FALSE
    AND id != new_post_id
  ORDER BY RANDOM()
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  -- 交換相手が見つかった場合
  IF exchanged_post.id IS NOT NULL THEN
    -- 交換済みに更新
    UPDATE posts
    SET is_exchanged = TRUE
    WHERE id = exchanged_post.id;

    -- 結果を構築
    result := jsonb_build_object(
      'id', exchanged_post.id,
      'title', exchanged_post.title,
      'pixels', exchanged_post.pixels::TEXT,
      'created_at', exchanged_post.created_at
    );
    
    RETURN result;
  END IF;

  -- 交換相手なし
  RETURN NULL;
END;
$$;
```

#### 使用例（クライアント側）

```typescript
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const { data, error } = await supabase.rpc('exchange_art', {
  new_title: 'ねこ',
  new_pixels: JSON.stringify([
    '#ffffff', '#ffffff', '#ffffff', '#ffffff',
    '#ffffff', '#ffb7b2', '#ffb7b2', '#ffffff',
    '#ffffff', '#ffb7b2', '#ffb7b2', '#ffffff',
    '#ffffff', '#ffffff', '#ffffff', '#ffffff'
  ])
});

if (error) {
  console.error('Exchange failed:', error.message);
} else if (data) {
  console.log('Received art:', data);
  // アルバムに追加
} else {
  console.log('No exchange partner available');
  // 待機メッセージ表示
}
```

## エラーハンドリング

### エラーコード一覧

| コード | メッセージ | 原因 |
|--------|-----------|------|
| 22001 | Title must be 5 characters or less | タイトルが5文字超過 |
| 22023 | Pixels must be an array of 16 colors | pixels配列の形式不正 |
| PGRST | 各種PostgreSTエラー | Supabaseクライアントエラー |

### クライアント側エラーハンドリング

```typescript
try {
  const { data, error } = await supabase.rpc('exchange_art', { ... });
  
  if (error) {
    // Supabaseエラー
    throw new Error(error.message);
  }
  
  // 成功処理
} catch (e) {
  // ネットワークエラーなど
  alert('エラー：' + e.message);
}
```

## セキュリティ

### SECURITY DEFINER

- 関数はテーブル所有者の権限で実行
- RLSポリシーをバイパス可能
- 入力バリデーションを関数内で必須実施

### SQL Injection対策

- パラメータ化クエリを使用
- 動的SQLは使用しない
- 入力値の型チェックをPostgreSQLが自動実行

### Rate Limiting（推奨）

Supabase Edge Functionsまたはクライアント側で実装:

```typescript
// クライアント側の簡易レート制限
const EXCHANGE_COOLDOWN = 5000; // 5秒
let lastExchangeTime = 0;

async function handleExchange() {
  const now = Date.now();
  if (now - lastExchangeTime < EXCHANGE_COOLDOWN) {
    alert('少し待ってから再度お試しください');
    return;
  }
  lastExchangeTime = now;
  
  // exchange_art 呼び出し
}
```

## 監視・ロギング

### 推奨ログ項目

- 関数呼び出し回数
- 交換成功率
- 平均レスポンスタイム
- エラー発生率

### Supabase Dashboard

- Database > Logs でクエリログ確認
- API > Logs でRPC呼び出しログ確認
