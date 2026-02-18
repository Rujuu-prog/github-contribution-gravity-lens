# CLI Reference

[Japanese / 日本語](cli-reference_ja.md)

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `-u, --user <username>` | GitHub username | *(required)* |
| `-t, --token <token>` | GitHub personal access token (or set `GITHUB_TOKEN` env) | *(required)* |
| `-d, --demo` | Generate with demo data (no token needed) | `false` |
| `--theme <theme>` | Color theme | `github` |
| `--strength <number>` | Warp strength multiplier | `0.35` |
| `--duration <number>` | Animation duration in seconds | `14` |
| `--clip-percent <number>` | Percentile clip for normalization | `95` |
| `--format <format>` | Output format: `svg` or `gif` | `svg` |
| `-o, --output <path>` | Output file path | `gravity-lens.<format>` |

### Available Themes

`github` (default), `deep-space`, `monochrome`, `solar-flare`, `event-horizon`, `paper-light`

Legacy aliases `dark` and `light` are also accepted. See [Themes](themes.md) for details.

## Configuration Examples

**Default theme SVG:**

```bash
node dist/cli.js --user octocat --token "$TOKEN"
```

**Light theme SVG:**

```bash
node dist/cli.js --user octocat --token "$TOKEN" --theme paper-light
```

**Deep space theme:**

```bash
node dist/cli.js --user octocat --token "$TOKEN" --theme deep-space
```

**GIF format:**

```bash
node dist/cli.js --user octocat --token "$TOKEN" --format gif
```

**High warp strength:**

```bash
node dist/cli.js --user octocat --token "$TOKEN" --strength 0.5
```

**Demo mode (no token required):**

```bash
node dist/cli.js --demo --theme github --format svg
```

## Programmatic API

You can also use the rendering functions directly in your own code:

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

> **Note:** The package is not yet published to npm (`private: true`). Clone and build locally to use the API.
