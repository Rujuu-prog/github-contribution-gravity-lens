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

      - uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Clone gravity-lens tool
        run: git clone https://github.com/Rujuu-prog/github-contribution-gravity-lens.git tool

      - name: Build tool
        run: |
          cd tool
          npm ci
          npm run build

      - name: Generate (dark + light)
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

      - name: Deploy to output branch
        uses: crazy-max/ghaction-github-pages@v3.2.0
        with:
          target_branch: output
          build_dir: dist
        env:
          GITHUB_TOKEN: ${{ github.token }}
```

> **Note:** This workflow clones and builds the tool from source. Once the package is published to npm, you will be able to replace the clone/build steps with a single `npx github-contribution-gravity-lens` command.

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
node tool/dist/cli.js \
  --user "${{ github.repository_owner }}" \
  --token "$GITHUB_TOKEN" \
  --theme deep-space \
  --format svg \
  --output "dist/gravity-lens.svg"
```
