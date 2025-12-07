# 改修メモ（WIP）

## 概要

本ドキュメントは、4x4 Pixel Diaryアプリケーションの今後の改修候補をまとめたものです。
要件を変えない範囲でのパフォーマンス改善・効率化を目的としています。

## 改修候補一覧

### 1. Supabaseクライアントのシングルトン化

**優先度**: 高
**効果**: パフォーマンス向上
**現状**: 
```typescript
// 毎回新しいインスタンスを生成
const supabase = createClient(supabaseUrl, supabaseServiceKey);
```

**改善案**:
```typescript
let supabaseInstance: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseInstance;
}
```

**理由**: 毎回のクライアント生成オーバーヘッドを削減

---

### 2. Canvas ピクセルの transition 削除

**優先度**: 中
**効果**: レスポンス向上、ピクセルアートらしい即時反映

**現状**:
```typescript
className="... transition-colors hover:opacity-80"
```

**改善案**:
```typescript
className="... hover:opacity-80"
```

**理由**: ピクセルアートは色が即座に変わる方が自然

---

### 3. 個別ピクセルの memo 化

**優先度**: 低〜中
**効果**: 再レンダリング最適化

**現状**: Canvasコンポーネント全体がmemo化されているが、内部のピクセルは個別にmemo化されていない

**改善案**:
```typescript
const Pixel = memo(({ color, index, onClick }: PixelProps) => (
  <button
    type="button"
    className="w-full h-full cursor-pointer hover:opacity-80"
    style={{ backgroundColor: color }}
    onClick={() => onClick(index)}
    aria-label={`ピクセル ${index + 1}`}
    aria-pressed={color !== "#ffffff"}
  />
));
```

**理由**: 1つのピクセル変更時に他の15ピクセルの再レンダリングを防止

---

### 4. Hydration ローディング表示

**優先度**: 中
**効果**: UX改善

**現状**: `useAlbum` フックで `isLoaded` を返しているが未使用

**改善案**:
```typescript
const { posts, isLoaded } = useAlbum();

if (!isLoaded) {
  return <AlbumSkeleton />;
}
```

**理由**: SSRとクライアントの不整合によるちらつき防止

---

### 5. CSS変数の重複削除

**優先度**: 低
**効果**: 保守性向上

**現状**: `globals.css` と `tailwind.config.ts` で同じカラー変数を二重定義

**改善案**: Tailwind config のみに統一し、globals.css からCSS変数定義を削除

---

### 6. handleDelete の useCallback 化

**優先度**: 低
**効果**: 微小なパフォーマンス向上

**現状**: 
```typescript
const handleDelete = (e: React.MouseEvent) => {
  // ...
};
```

**改善案**:
```typescript
const handleDelete = useCallback((e: React.MouseEvent) => {
  // ...
}, [onDelete, post.id]);
```

---

## 修正済みの問題

### RPC呼び出しのパラメータ形式

**問題**: `JSON.stringify(pixels)` で二重エンコード
**解決**: `pixels` を直接渡すように修正

### 環境変数のキー名対応

**問題**: Supabaseの新しい `PUBLISHABLE_DEFAULT_KEY` に未対応
**解決**: 両方のキー名に対応するように修正

---

## 今後の検討事項

1. **E2Eテストの拡充**: 現在は基本的なテストのみ
2. **パフォーマンス計測**: Lighthouse / Web Vitals での定量的な計測
3. **エラーハンドリングの改善**: ユーザーフレンドリーなエラー表示
4. **オフライン対応**: Service Worker によるオフライン対応（将来的な検討）

---

## 参考情報

- [要件定義書](./requirements.md)
- [データベース設計書](./database-schema.md)
- [API仕様書](./api-spec.md)

