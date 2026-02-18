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
node dist/cli.js --demo --theme deep-space

# ワープ強度・アニメーション時間の調整
node dist/cli.js --demo --strength 0.5 --duration 14

# 出力先を指定
node dist/cli.js --demo -o preview.svg
```

生成されたSVGファイルをブラウザで開くとアニメーションを確認できます。

利用可能なテーマの一覧は [テーマ](themes_ja.md) を参照してください。

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
├── types.ts          型定義 (ContributionDay, GridCell, WarpedCell, Theme, ThemeName等)
├── normalize.ts      パーセンタイルクリップ・非線形マッピング
├── gravity.ts        重力中心の計算・ワープ位置の算出
├── animation.ts      ワープ進行率・イージング関数
├── color-blend.ts    色空間変換・HSLブレンド・色調シフト
├── theme.ts          カラーテーマ (6テーマ + 物理パラメータ)
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
├── color-blend.test.ts
├── render-svg.test.ts
├── render-gif.test.ts
├── demo-data.test.ts
├── cli.test.ts
└── index.test.ts
```

## CLIオプション一覧

CLIオプションの詳細は [CLI リファレンス](cli-reference_ja.md) を参照してください。
