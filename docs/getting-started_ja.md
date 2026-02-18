# はじめに

[English](getting-started.md)

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
            --theme github \
            --format svg \
            --output "dist/gravity-lens-dark.svg"

          node tool/dist/cli.js \
            --user "${{ github.repository_owner }}" \
            --token "$GITHUB_TOKEN" \
            --theme paper-light \
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

## 他のテーマを使う

ワークフローでは6種類のテーマを利用できます。全一覧は[テーマ](themes_ja.md)を参照してください。

特定のテーマで生成する例：

```yaml
node tool/dist/cli.js \
  --user "${{ github.repository_owner }}" \
  --token "$GITHUB_TOKEN" \
  --theme deep-space \
  --format svg \
  --output "dist/gravity-lens.svg"
```
