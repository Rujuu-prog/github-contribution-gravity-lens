# Development Guide

## セットアップ

### 前提条件

- Node.js 18+
- npm

### インストール

```bash
npm install
npm run build
```

## ローカルプレビュー

`--demo` フラグを使うと、GitHub トークンなしでダミーデータからSVG/GIFを生成できます。

```bash
# SVG出力（デフォルト）
node dist/cli.js --demo

# GIF出力
node dist/cli.js --demo --format gif

# テーマ切替
node dist/cli.js --demo --theme light

# ワープ強度・アニメーション時間の調整
node dist/cli.js --demo --strength 0.5 --duration 6

# 出力先を指定
node dist/cli.js --demo -o preview.svg
```

生成されたSVGファイルをブラウザで開くとアニメーションを確認できます。

## テスト

```bash
# 全テスト実行
npm test

# ウォッチモード
npm run test:watch
```

## アーキテクチャ

### データフロー

```
GitHub API / Demo Data
        │
        ▼
  ContributionDay[]     ← fetch.ts / demo-data.ts
        │
        ▼
  normalize (percentile clip + non-linear mapping)
        │
        ▼
  gravity (center computation + warp positions)
        │
        ▼
  render-svg / render-gif (animation output)
        │
        ▼
  .svg / .gif file
```

### ファイル構成

```
src/
├── types.ts          型定義 (ContributionDay, GridCell, WarpedCell, Theme等)
├── normalize.ts      パーセンタイルクリップ・非線形マッピング
├── gravity.ts        重力中心の計算・ワープ位置の算出
├── animation.ts      ワープ進行率・イージング関数
├── theme.ts          カラーテーマ (dark / light)
├── fetch.ts          GitHub GraphQL APIからコントリビューションデータ取得
├── demo-data.ts      決定的ダミーデータ生成 (トークン不要のプレビュー用)
├── render-svg.ts     CSS @keyframes によるSVGアニメーション生成
├── render-gif.ts     gif-encoder-2 + canvas によるGIF生成
├── cli.ts            CLIエントリポイント (commander)
└── index.ts          ライブラリとしてのre-export

tests/
├── normalize.test.ts
├── gravity.test.ts
├── animation.test.ts
├── theme.test.ts
├── render-svg.test.ts
├── render-gif.test.ts
├── demo-data.test.ts
└── cli.test.ts
```

## CLIオプション一覧

| オプション | 短縮形 | 説明 | デフォルト |
|---|---|---|---|
| `--user <username>` | `-u` | GitHubユーザー名 | — |
| `--token <token>` | `-t` | GitHub Personal Access Token | `GITHUB_TOKEN`環境変数 |
| `--demo` | `-d` | ダミーデータで生成（user/token不要） | `false` |
| `--theme <theme>` | — | カラーテーマ (`dark` / `light`) | `dark` |
| `--strength <number>` | — | ワープ強度 | `0.35` |
| `--duration <number>` | — | アニメーション時間（秒） | `4` |
| `--clip-percent <number>` | — | パーセンタイルクリップ値 | `95` |
| `--format <format>` | — | 出力形式 (`svg` / `gif`) | `svg` |
| `--output <path>` | `-o` | 出力ファイルパス | `gravity-lens.{format}` |

> `--demo` 使用時は `--user` と `--token` は不要です。
