## 改修ロードマップ

### Phase 0: 基盤整備（現在）
- [x] Vercel公開
- [ ] 環境変数設定
- [ ] 本番DBマイグレーション確認
- [ ] ドメイン設定（任意）

---

### Phase 1: 基盤強化（1〜2週間）

#### 1.1 DBスキーマ改善
```sql
-- 将来の拡張を見据えた設計
ALTER TABLE posts ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE posts ADD COLUMN likes_count INT DEFAULT 0;
ALTER TABLE posts ADD COLUMN reported BOOLEAN DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN created_by_ip TEXT; -- 不正対策用
```

#### 1.2 サーバー側強化
- **Rate Limiting**: Supabase Edge Functions または Vercel Edge Middleware
- **入力サニタイズ**: HEXカラー形式の厳密検証
- **不正リクエスト対策**: IPベースの一時的ブロック

#### 1.3 クライアント最適化（doc/improvement-notes.md の内容）
- Supabaseシングルトン化
- CSS transition削除
- Hydrationローディング表示

---

### Phase 2: UX改善（1〜2週間）

#### 2.1 UI/UXブラッシュアップ
- **ローディング状態**: スケルトンUI
- **エラー表示**: トースト通知（react-hot-toast等）
- **アニメーション**: 交換成功時のエフェクト
- **レスポンシブ強化**: タブレット/モバイル対応

#### 2.2 PWA対応
- `next-pwa` 導入
- オフラインキャッシュ
- ホーム画面追加対応

---

### Phase 3: ユーザー認証 + ソーシャル機能（2〜3週間）

#### 3.1 認証システム
```
┌─────────────────────────────────────────┐
│  認証方式の選択肢                        │
├─────────────────────────────────────────┤
│  A) Supabase Auth (推奨)                │
│     - メール/パスワード                  │
│     - OAuth (Google, Twitter, etc.)     │
│     - 匿名認証 → アカウント昇格          │
│                                         │
│  B) 匿名認証のみ (簡易版)               │
│     - デバイスID + localStorage         │
│     - クラウド同期なし                   │
└─────────────────────────────────────────┘
```

#### 3.2 クラウド保存
- 認証済みユーザーのアルバムをSupabaseに保存
- localStorage → Supabase 移行スクリプト
- デバイス間同期

#### 3.3 いいねシステム
```sql
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  post_id UUID REFERENCES posts(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);
```

#### 3.4 通報/BANシステム
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users(id),
  post_id UUID REFERENCES posts(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE banned_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  reason TEXT,
  banned_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);
```

---

### Phase 4: 収益化（2〜4週間）

#### 4.1 広告
- **Google AdSense**: バナー広告
- **配置**: アルバムセクション下部、交換完了後
- **実装**: `next/script` で遅延読み込み

#### 4.2 サブスク課金
```
┌─────────────────────────────────────────┐
│  決済プラットフォーム選択                │
├─────────────────────────────────────────┤
│  A) Stripe (推奨)                       │
│     - Stripe Checkout / Payment Links   │
│     - Webhook → Supabaseで権限管理      │
│                                         │
│  B) RevenueCat                          │
│     - モバイルアプリ展開時に有利         │
│     - Web + App 統合管理                │
└─────────────────────────────────────────┘
```

#### 4.3 プレミアム特典案
| 特典 | 無料 | プレミアム |
|------|------|-----------|
| 広告 | あり | なし |
| アルバム保存数 | 50枚 | 無制限 |
| カスタムスキン | なし | あり |
| 特殊カラーパレット | なし | あり |
| 優先交換マッチング | なし | あり |

---

## 追加提案

### 1. アナリティクス
- **Vercel Analytics**: パフォーマンス計測
- **PostHog / Mixpanel**: ユーザー行動分析
- **Supabase**: 交換成功率、滞在時間などカスタム指標

### 2. 多言語対応（i18n）
- `next-intl` または `next-i18next`
- 日本語 / 英語 / 韓国語 など

### 3. ギャラリー機能
- 交換済みの絵を匿名公開
- いいねランキング
- 期間限定イベント

### 4. NFT化（検討段階）
- 特に人気の高い作品をNFT化
- Supabase + Web3ウォレット連携

### 5. モバイルアプリ化
- **Capacitor**: 既存コードをネイティブアプリ化
- **React Native**: 完全ネイティブ（大規模改修）

### 6. セキュリティ強化
- **CSP (Content Security Policy)**: XSS対策
- **CORS設定**: API保護
- **Cloudflare**: DDoS対策、WAF

---

## 優先順位の提案

```
必須 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 │
 │  Phase 0: 環境変数設定
 │  Phase 1.2: Rate Limiting + 不正対策
 │  Phase 1.3: クライアント最適化
 │
推奨 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 │
 │  Phase 2.1: UX改善
 │  Phase 3.1-3.2: 認証 + クラウド保存
 │
収益化 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 │
 │  Phase 4.1: 広告
 │  Phase 3.3-3.4: いいね + 通報システム
 │  Phase 4.2-4.3: サブスク
 │
将来 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 │
 └  ギャラリー、多言語、モバイルアプリ
```
