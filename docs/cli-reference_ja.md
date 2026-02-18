# CLI リファレンス

[English](cli-reference.md)

## オプション

| フラグ | 説明 | デフォルト |
|--------|------|------------|
| `-u, --user <username>` | GitHubユーザー名 | *（必須）* |
| `-t, --token <token>` | GitHubアクセストークン（`GITHUB_TOKEN` 環境変数も可） | *（必須）* |
| `-d, --demo` | デモデータで生成（トークン不要） | `false` |
| `--theme <theme>` | カラーテーマ | `github` |
| `--strength <number>` | ワープ強度の倍率 | `0.35` |
| `--duration <number>` | アニメーション時間（秒） | `14` |
| `--clip-percent <number>` | 正規化のパーセンタイルクリップ | `95` |
| `--format <format>` | 出力フォーマット: `svg` または `gif` | `svg` |
| `-o, --output <path>` | 出力ファイルパス | `gravity-lens.<format>` |

### 利用可能なテーマ

`github`（デフォルト）, `deep-space`, `monochrome`, `solar-flare`, `event-horizon`, `paper-light`

レガシーエイリアス `dark` と `light` も引き続き使用可能です。詳細は[テーマ](themes_ja.md)を参照してください。

## 設定例

**デフォルトテーマ SVG：**

```bash
node dist/cli.js --user octocat --token "$TOKEN"
```

**ライトテーマ SVG：**

```bash
node dist/cli.js --user octocat --token "$TOKEN" --theme paper-light
```

**ディープスペーステーマ：**

```bash
node dist/cli.js --user octocat --token "$TOKEN" --theme deep-space
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
node dist/cli.js --demo --theme github --format svg
```

## プログラマティック API

レンダリング関数を直接コード内で使用することもできます：

```typescript
import { fetchContributions } from 'github-contribution-gravity-lens';
import { renderSvg } from 'github-contribution-gravity-lens';
import { renderGif } from 'github-contribution-gravity-lens';

const days = await fetchContributions('octocat', process.env.GITHUB_TOKEN!);

// SVG
const svg = renderSvg(days, { theme: 'github', strength: 0.35, duration: 14 });

// GIF
const buffer = await renderGif(days, { theme: 'deep-space', strength: 0.35, duration: 14 });
```

> **Note:** パッケージはまだnpmに公開されていません（`private: true`）。APIを使用するにはローカルでクローン・ビルドしてください。
