# Getting Started

[Japanese / 日本語](getting-started_ja.md)

## Quick Start (GitHub Actions)

The easiest way to use this is with a GitHub Actions workflow that regenerates the animation daily. No Personal Access Token required — the workflow uses the built-in `GITHUB_TOKEN` that GitHub Actions provides automatically.

### 1. Create the workflow file

Create `.github/workflows/gravity-lens.yml` in your repository:

```yaml
name: generate gravity-lens

on:
  schedule:
    - cron: "0 0 * * *"   # daily at 00:00 UTC
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

      - name: Generate (dark)
        uses: Rujuu-prog/github-contribution-gravity-lens@v1.0.0
        with:
          github-token: ${{ github.token }}
          theme: github
          output-path: dist/gravity-lens-dark.svg

      - name: Generate (light)
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

> **Note:** This workflow uses the official GitHub Action. For local CLI usage, see [CLI Reference](cli-reference.md).

> **Note:** `github.token` is automatically provided by GitHub Actions — no setup required. If you need to include private contributions, you may need to create a [Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) and store it as a repository secret instead.

### 2. Add the image to your README

Use the `<picture>` element to automatically switch between dark and light themes:

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/<USER>/<REPO>/output/gravity-lens-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/<USER>/<REPO>/output/gravity-lens.svg">
  <img alt="GitHub Contribution Gravity Lens" src="https://raw.githubusercontent.com/<USER>/<REPO>/output/gravity-lens.svg">
</picture>
```

Replace `<USER>/<REPO>` with your GitHub username and repository name (e.g. `octocat/octocat`).

### 3. Run

Trigger the workflow manually from the **Actions** tab, push to `main`, or wait for the daily cron schedule. The generated images are deployed to the `output` branch.

## Using Other Themes

You can use any of the 6 available themes in the workflow. See [Themes](themes.md) for the full list.

To generate a specific theme:

```yaml
- uses: Rujuu-prog/github-contribution-gravity-lens@v1.0.0
  with:
    github-token: ${{ github.token }}
    theme: deep-space
    output-path: dist/gravity-lens.svg
```
