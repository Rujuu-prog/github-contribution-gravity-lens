# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build          # TypeScript → dist/ (tsc)
npm test               # vitest run (all tests)
npm run test:watch     # vitest in watch mode
npm start              # node dist/cli.js

# Run a single test file
npx vitest run tests/gravity.test.ts

# Run tests matching a pattern
npx vitest run -t "computeLocalLensWarp"
```

## Architecture

CLI tool that transforms GitHub contribution graphs into gravity-lens animations (SVG/GIF).

### Pipeline

```
fetchContributions (GitHub GraphQL)
  → normalizeContributions (grid layout + percentile clip + power curve)
  → detectAnomalies (top 10% cells by mass)
  → computeAnomalyActivationDelays (col-based 0-6s left→right delay)
  → computeLocalLensWarpPerAnomaly (per-anomaly independent warp)
  → renderSvg / renderGif
```

### Key Modules (src/)

- **types.ts** — `ContributionDay`, `GridCell`, `AnomalyGridCell`, `WarpedCell`, `RenderOptions`
- **normalize.ts** — `normalizeContributions`, `detectAnomalies`, `percentile`
- **gravity.ts** — Warp physics: `computeLocalLensWarpPerAnomaly` (per-anomaly timelines), `computeInterference`, `computeInterferenceJitter`, `getCellRotation`
- **animation.ts** — Timeline functions: `getAnomalyWarpProgress`, `getAnomalyBrightnessProgress`, `getInterferenceProgress`, `cubicBezierEase`, `computeActivationDelay`
- **color-blend.ts** — `hexToRgb`/`rgbToHex`, `rgbToHsl`/`hslToRgb`, `shiftHue`, `adjustBrightness`, `blendColors`
- **render-svg.ts** — SVG with CSS keyframes (0.5s sampling intervals, 28 samples over 14s)
- **render-gif.ts** — GIF via canvas + gif-encoder-2 (12fps × 14s = 168 frames, neuquant palette)
- **theme.ts** — Dark/light color palettes (anomalyAccent: #3ddcff)
- **fetch.ts** — GitHub GraphQL API client
- **cli.ts** — Commander-based CLI entry point

### 14-Second Animation Loop

| Phase | Time | Effect |
|-------|------|--------|
| Rest | 0-2s | Static grid |
| Awakening | 2s + delay → +1.2s | Brightness 0→1, left→right propagation |
| Lens | fireTime + 0.5s → +2s | Warp 0→1, per-anomaly timeline |
| Interference | 8-11s | sin(π) pulse between nearby anomalies |
| Restore | 11-14s | All effects simultaneously return to 0 |

Per-anomaly `fireTime = 2 + (col/maxCol) * 6`, creating a left-to-right wave.

### Rendering Differences

- **SVG**: Layer A (outside R, static) / Layer B (inside R, animated via CSS keyframes). Sampling-based: 28 keyframe snapshots at 0.5s intervals.
- **GIF**: Frame-by-frame canvas rendering. `computeLocalLensWarpPerAnomaly` called per frame with per-anomaly progress maps.

### Physics Model

- Local lens: R=60px influence radius, maxWarp=0.35
- Asymmetric warp: dx×1.2, dy×0.8
- Anomaly cells themselves have zero self-warp
- Zone cells: hue shift +7° (purple), brightness -0.08 density gradient
- Interference requires 2+ anomaly sources overlapping

## Testing

- Framework: vitest v4 with `globals: true`
- Tests: `tests/**/*.test.ts` (10 files, 216+ tests)
- Vitest 4 timeout syntax: `it('name', { timeout: 30000 }, async () => {})`
- GIF/SVG render tests need longer timeouts (~30s)

## Notable Quirks

- `gif-encoder-2` lacks types; custom `src/gif-encoder-2.d.ts` provides declarations
- `detectAnomalies` with threshold=0 marks all cells as non-anomaly
- SVG keyframe regex must use `[\s\S]*?` for multiline block matching in tests
- Module system is CommonJS (`"module": "commonjs"` in tsconfig)
