# 4x4 Pixel Diary

4x4ピクセルアートを描いて他のユーザーと交換する日記アプリケーション。

## 目次

- [概要](#概要)
- [技術スタック](#技術スタック)
- [ドキュメント](#ドキュメント)
- [セットアップ](#セットアップ)
- [開発](#開発)
- [デプロイ](#デプロイ)

## 概要

シンプルな4x4ピクセルアートを描いて、他のユーザーの作品と交換できるWebアプリケーション。
匿名で利用可能で、交換した作品はローカルストレージに保存されます。

## 技術スタック

| カテゴリ | 技術                                           |
| -------- | ---------------------------------------------- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend  | Supabase (PostgreSQL, RLS, RPC)                |
| Monorepo | Turborepo, pnpm                                |
| Testing  | Vitest, Playwright                             |
| Deploy   | Vercel (Web), Supabase Cloud (DB)              |

## ドキュメント

- [要件定義書](doc/requirements.md) - 機能要件・非機能要件・ユーザーフロー
- [データベース設計書](doc/database-schema.md) - テーブル設計・RLSポリシー
- [API仕様書](doc/api-spec.md) - RPC関数仕様
- [改修ロードマップ](doc/improvement-plans.md) - Phase別開発計画

## セットアップ

### 前提条件

- Node.js 20+
- pnpm 9+
- Docker（Supabaseローカル開発用）

### インストール

```bash
# 依存関係のインストール
pnpm install

# Supabaseローカル環境の起動
pnpm supabase:start

# マイグレーション実行
pnpm supabase:migrate
```

### 環境変数

`.env.local` を作成:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
- SUPABASE_SERVICE_ROLE_KEY

## 開発

```bash
# 開発サーバー起動
pnpm dev

# 型チェック
pnpm typecheck

# リント
pnpm lint

# テスト
pnpm test
```

## プロジェクト構成

```
dot-pixel-canvas/
├── apps/
│   └── web/                    # Next.js アプリ
├── packages/
│   └── supabase/               # Supabase設定・マイグレーション
├── doc/                        # ドキュメント
├── turbo.json
└── package.json
```

## デプロイ

### Vercel

```bash
# Vercel CLIでデプロイ
vercel
```

### Supabase

```bash
# Supabase CLIでデプロイ
supabase db push
```
