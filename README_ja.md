# GitHub Contribution Gravity Lens

[English](README.md) | **日本語**

GitHubのコントリビューショングラフを時空の歪みに変換します。

活動が集中した日が重力異常点になり、
グリッドが曲がり、空間が波打ち、あなたの1年が歪みます。

![Gravity Lens](gravity-lens.svg)

## これは何？

GitHub Contribution Gravity Lens は、あなたのコントリビューション履歴を分析し、異常な活動ピークを検出して、周囲のセルをその点に向かって歪ませます — まるで巨大な天体の周りで光が曲がるように。
生成されるループアニメーションは、GitHubプロフィールやリポジトリのREADMEに直接埋め込めます。

- **SVG & GIF 出力** — 軽量なSVG（デフォルト）またはポータブルなGIF
- **14秒ループ** — リップル覚醒、レンズワープ、干渉パルス、復元
- **ダーク & ライトテーマ** — GitHubのデフォルト外観に対応
- **異常検出** — コントリビューションスパイクを自動検出してアニメーション化

## クイックスタート（GitHub Actions）

GitHub Actionsワークフローで毎日アニメーションを再生成する方法が最も簡単です。
Personal Access Token は不要 — ワークフローはGitHub Actionsが自動提供する `GITHUB_TOKEN` を使用します。

### 1. ワークフローファイルを作成

リポジトリに `.github/workflows/gravity-lens.yml` を作成します：

```yaml
name: generate gravity-lens

on:
  schedule:
    - cron: "0 0 * * *"   # 毎日 UTC 00:00
  workflow_dispatch:
  push:
    branches: [ main ]

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

      - uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: ツールをクローン
        run: git clone https://github.com/Rujuu-prog/github-contribution-gravity-lens.git tool

      - name: ビルド
        run: |
          cd tool
          npm ci
          npm run build

      - name: 生成（dark + light）
        env:
          GITHUB_TOKEN: ${{ github.token }}
        run: |
          mkdir -p dist
          node tool/dist/cli.js \
            --user "${{ github.repository_owner }}" \
            --token "$GITHUB_TOKEN" \
            --theme dark \
            --format svg \
            --output "dist/gravity-lens-dark.svg"

          node tool/dist/cli.js \
            --user "${{ github.repository_owner }}" \
            --token "$GITHUB_TOKEN" \
            --theme light \
            --format svg \
            --output "dist/gravity-lens.svg"

      - name: output ブランチへデプロイ
        uses: crazy-max/ghaction-github-pages@v3.2.0
        with:
          target_branch: output
          build_dir: dist
        env:
          GITHUB_TOKEN: ${{ github.token }}
```

> **Note:** このワークフローはソースからツールをクローン・ビルドします。npmへの公開後は、クローン/ビルドステップを `npx github-contribution-gravity-lens` に置き換えられます。

> **Note:** `github.token` はGitHub Actionsが自動的に提供するため、設定不要です。プライベートコントリビューションを含める場合は、[Personal Access Token](https://docs.github.com/ja/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) を作成してリポジトリシークレットに保存する必要があります。

### 2. READMEに画像を追加

`<picture>` 要素を使うことで、ダーク/ライトテーマが自動的に切り替わります：

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/<USER>/<REPO>/output/gravity-lens-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/<USER>/<REPO>/output/gravity-lens.svg">
  <img alt="GitHub Contribution Gravity Lens" src="https://raw.githubusercontent.com/<USER>/<REPO>/output/gravity-lens.svg">
</picture>
```

`<USER>/<REPO>` をあなたのGitHubユーザー名とリポジトリ名に置き換えてください（例: `octocat/octocat`）。

### 3. 実行

**Actions** タブからワークフローを手動実行、`main` にプッシュ、または毎日のcronスケジュールを待ちます。生成された画像は `output` ブランチにデプロイされます。

## CLI オプション

| フラグ | 説明 | デフォルト |
|--------|------|------------|
| `-u, --user <username>` | GitHubユーザー名 | *（必須）* |
| `-t, --token <token>` | GitHubアクセストークン（`GITHUB_TOKEN` 環境変数も可） | *（必須）* |
| `-d, --demo` | デモデータで生成（トークン不要） | `false` |
| `--theme <theme>` | カラーテーマ: `dark` または `light` | `dark` |
| `--strength <number>` | ワープ強度の倍率 | `0.35` |
| `--duration <number>` | アニメーション時間（秒） | `14` |
| `--clip-percent <number>` | 正規化のパーセンタイルクリップ | `95` |
| `--format <format>` | 出力フォーマット: `svg` または `gif` | `svg` |
| `-o, --output <path>` | 出力ファイルパス | `gravity-lens.<format>` |

## 設定例

**ライトテーマ SVG：**

```bash
node dist/cli.js --user octocat --token "$TOKEN" --theme light
```

**GIF フォーマット：**

```bash
node dist/cli.js --user octocat --token "$TOKEN" --format gif
```

**高ワープ強度：**

```bash
node dist/cli.js --user octocat --token "$TOKEN" --strength 0.5
```

**デモモード（トークン不要）：**

```bash
node dist/cli.js --demo --theme dark --format svg
```

## プログラマティック API

レンダリング関数を直接コード内で使用することもできます：

```typescript
import { fetchContributions } from 'github-contribution-gravity-lens';
import { renderSvg } from 'github-contribution-gravity-lens';
import { renderGif } from 'github-contribution-gravity-lens';

const days = await fetchContributions('octocat', process.env.GITHUB_TOKEN!);

// SVG
const svg = renderSvg(days, { theme: 'dark', strength: 0.35, duration: 14 });

// GIF
const buffer = await renderGif(days, { theme: 'dark', strength: 0.35, duration: 14 });
```

> **Note:** パッケージはまだnpmに公開されていません（`private: true`）。APIを使用するにはローカルでクローン・ビルドしてください。

## 仕組み

1. **取得** — GitHub GraphQL APIで過去1年分のコントリビューションデータを取得
2. **正規化** — 生のカウントをパーセンタイルクリッピングで0〜1スケールにマッピング
3. **異常検出** — 上位のコントリビューションスパイクを重力源として特定
4. **ワープ計算** — 局所レンズモデル（影響半径R=60px）でセルごとの変位を算出
5. **レンダリング** — 5フェーズの14秒ループアニメーションを生成：
   - **静止** (0〜2秒) — 静的グリッド
   - **覚醒** (2〜8秒) — 明度リップルが左から右へ伝播
   - **レンズ** (2.5〜10秒) — 異常点ごとに時差ありでワープが増加
   - **干渉** (8〜11秒) — 近接する異常点間のサインパルス
   - **復元** (11〜14秒) — 全エフェクトがスムーズにゼロに復帰

## ライセンス

MIT
