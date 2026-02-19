# GitHub Contribution Gravity Lens

[English](README.md) | **日本語**

あなたのコントリビューションが時空を歪める。

![Gravity Lens](https://raw.githubusercontent.com/Rujuu-prog/github-contribution-gravity-lens/output/theme-deep-space.svg)

---

## 🚀 プロフィールに追加する

### 1. `.github/workflows/gravity-lens.yml` を作成

```yaml
name: generate gravity-lens

on:
  schedule:
    - cron: "0 0 * * *"
  workflow_dispatch:
  push:
    branches: [main]

permissions:
  contents: write

concurrency:
  group: gravity-lens
  cancel-in-progress: true

jobs:
  generate:
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - uses: actions/checkout@v4

      - name: Generate (dark + light)
        uses: Rujuu-prog/github-contribution-gravity-lens@v1.0.0
        with:
          github-token: ${{ github.token }}
          theme: github
          output-path: dist/gravity-lens-dark.svg

      - name: Generate light theme
        uses: Rujuu-prog/github-contribution-gravity-lens@v1.0.0
        with:
          github-token: ${{ github.token }}
          theme: paper-light
          output-path: dist/gravity-lens.svg

      - name: Deploy to output branch
        uses: crazy-max/ghaction-github-pages@v3.2.0
        with:
          target_branch: output
          build_dir: dist
        env:
          GITHUB_TOKEN: ${{ github.token }}
```

PAT不要 — `github.token` は GitHub Actions が自動的に提供します。

<details>
<summary>全入力パラメータ</summary>

| 入力 | 必須 | デフォルト | 説明 |
|------|------|-----------|------|
| `github-token` | Yes | — | GitHub APIアクセス用トークン |
| `username` | No | リポジトリオーナー | GitHubユーザー名 |
| `theme` | No | `github` | テーマ名 |
| `format` | No | `svg` | 出力形式 (`svg` or `gif`) |
| `output-path` | No | `gravity-lens.{format}` | 出力ファイルパス |
| `strength` | No | `0.35` | ワープ強度 (0-1) |

</details>

### 2. README に埋め込む

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/<USER>/<REPO>/output/gravity-lens-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/<USER>/<REPO>/output/gravity-lens.svg">
  <img alt="GitHub Contribution Gravity Lens" src="https://raw.githubusercontent.com/<USER>/<REPO>/output/gravity-lens.svg">
</picture>
```

`<USER>/<REPO>` をあなたの GitHub ユーザー名とリポジトリ名に置き換えてください。

### 3. 実行

**Actions** タブからワークフローを手動実行。以上です。

---

## ✨ 何が違うのか？

- **🌌 物理ベースのアニメーション** — 巨大天体の周りで光が曲がるように、セルが異常点に向かってワープ
- **🌊 左から右への波** — 異常点ごとに時差を持ったアクティベーションが伝播
- **🔮 干渉パターン** — 重力井戸の重なりが可視的なパルス効果を生む
- **🎨 6つのテーマ世界** — テーマごとに固有のワープ強度・ディミング・グローパラメータ

ただの色違いではなく、物理が違う。

---

## 🎨 テーマ

| テーマ | 説明 |
|--------|------|
| `github` | クラシックなダークグリーン。デフォルト。 |
| `deep-space` | 深い青の宇宙。強いワープ、明るいピーク。 |
| `monochrome` | グレースケールのミニマリズム。 |
| `solar-flare` | 暖かい赤橙。激しいワープ。 |
| `event-horizon` | ほぼ黒。異常点が歪めるまでグリッドは隠れている。 |
| `paper-light` | 明るい背景。GitHub ライトモード用。 |

プレビューと物理パラメータは[テーマギャラリー](docs/themes_ja.md)を参照。

---

## 🧠 仕組み

1. **取得** — GitHub GraphQL API で過去1年分のコントリビューションを取得
2. **検出** — 活動スパイクを重力異常点として特定
3. **ワープ** — 局所レンズモデル（R=60px）でセルごとの変位を算出
4. **アニメーション** — 14秒ループを生成：静止 → 覚醒 → レンズ → 干渉 → 復元

---

## 📚 ドキュメント

- [はじめに](docs/getting-started_ja.md) — セットアップ、トークン、ワークフロー設定
- [テーマ](docs/themes_ja.md) — ギャラリーと物理パラメータ
- [CLIリファレンス](docs/cli-reference_ja.md) — 全オプションとプログラマティックAPI
- [開発ガイド](docs/development.md) — ローカルセットアップ、テスト、アーキテクチャ

---

このプロジェクトが気に入ったら ⭐ をお願いします

MIT License
