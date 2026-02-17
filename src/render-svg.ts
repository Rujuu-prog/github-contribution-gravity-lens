import { ContributionDay, RenderOptions } from './types';
import { normalizeContributions, detectAnomalies } from './normalize';
import { computeLocalLensWarp, computeWarpIntensity } from './gravity';
import { getTheme } from './theme';
import { computeAnomalyColor } from './color-blend';

const DEFAULT_OPTIONS: RenderOptions = {
  theme: 'dark',
  strength: 0.35,
  duration: 4,
  clipPercent: 95,
  cellSize: 11,
  cellGap: 4,
  cornerRadius: 2,
  anomalyPercent: 10,
};

interface SvgRenderOptions {
  theme?: 'dark' | 'light';
  strength?: number;
  duration?: number;
  clipPercent?: number;
  anomalyPercent?: number;
}

export function renderSvg(days: ContributionDay[], options: SvgRenderOptions = {}): string {
  const opts: RenderOptions = { ...DEFAULT_OPTIONS, ...options };
  const theme = getTheme(opts.theme);
  const { cellSize, cellGap, cornerRadius } = opts;
  const cellStep = cellSize + cellGap;
  const R = 40;

  const cells = normalizeContributions(days);
  const anomalyCells = detectAnomalies(cells, opts.anomalyPercent);

  // Compute warped positions at full warp
  const warpedCells = computeLocalLensWarp(anomalyCells, 1, R, opts.strength, cellSize, cellGap);

  // Grid dimensions
  const maxCol = cells.reduce((max, c) => Math.max(max, c.col), 0);
  const maxRow = cells.reduce((max, c) => Math.max(max, c.row), 0);
  const padding = 20;
  const taglineHeight = 30;
  const width = (maxCol + 1) * cellStep + padding * 2;
  const height = (maxRow + 1) * cellStep + padding * 2 + taglineHeight;

  // Determine which cells are in the influence zone of any anomaly
  const anomalySources = anomalyCells.filter(c => c.isAnomaly);
  const isInZone = (col: number, row: number): boolean => {
    const cx = col * cellStep + cellSize / 2;
    const cy = row * cellStep + cellSize / 2;
    for (const src of anomalySources) {
      const sx = src.col * cellStep + cellSize / 2;
      const sy = src.row * cellStep + cellSize / 2;
      if (Math.hypot(cx - sx, cy - sy) <= R) return true;
    }
    return false;
  };

  // Compute warp intensities for color animation
  const intensities = computeWarpIntensity(warpedCells);

  // Build keyframes and rects
  const keyframesArr: string[] = [];
  const rectsArr: string[] = [];

  // 5-phase keyframe percentages (revised):
  // Phase 1: 0%-25% static
  // Phase 2: 25%-32.5% brightness only (no position change)
  // Phase 3: 32.5%-62.5% lens warp (0→1)
  // Phase 4: 62.5%-80% hold
  // Phase 5: 80%-100% restore

  warpedCells.forEach((cell, i) => {
    const origX = cell.originalX + padding;
    const origY = cell.originalY + padding;
    const warpX = cell.warpedX + padding;
    const warpY = cell.warpedY + padding;
    const baseColor = theme.levels[cell.level];
    const inZone = isInZone(cell.col, cell.row);

    if (!inZone) {
      // Layer A: Static cell (no animation)
      rectsArr.push(`<rect x="${origX}" y="${origY}" width="${cellSize}" height="${cellSize}" rx="${cornerRadius}" ry="${cornerRadius}" fill="${baseColor}" />`);
      return;
    }

    // Layer B: Animated cell
    const animName = `warp-${i}`;
    const isAnomaly = cell.isAnomaly;

    // Position keyframes with 5-phase structure
    const scaleStr = isAnomaly ? ' scale(1.02)' : '';
    keyframesArr.push(`@keyframes ${animName} {
  0%, 32.5% { transform: translate(${origX}px, ${origY}px); }
  62.5%, 80% { transform: translate(${warpX.toFixed(2)}px, ${warpY.toFixed(2)}px)${scaleStr}; }
  100% { transform: translate(${origX}px, ${origY}px); }
}`);

    // Color keyframes: anomaly cells get anomalyAccent brightness effect
    if (isAnomaly) {
      const accentColor = computeAnomalyColor(baseColor, theme.anomalyAccent, 1, 0.15);
      keyframesArr.push(`@keyframes color-${i} {
  0%, 25% { fill: ${baseColor}; }
  32.5%, 80% { fill: ${accentColor}; }
  100% { fill: ${baseColor}; }
}`);
    } else {
      // Non-anomaly zone cells: subtle color shift based on warp intensity
      const fg = theme.fieldGradient;
      if (fg) {
        const colorFull = computeAnomalyColor(baseColor, fg.peakColor, intensities[i], fg.intensity);
        keyframesArr.push(`@keyframes color-${i} {
  0%, 32.5% { fill: ${baseColor}; }
  62.5%, 80% { fill: ${colorFull}; }
  100% { fill: ${baseColor}; }
}`);
      }
    }

    const hasColorKf = keyframesArr.some(k => k.includes(`@keyframes color-${i}`));
    const animStyle = hasColorKf
      ? `animation: ${animName} ${opts.duration}s cubic-bezier(0.4, 0.0, 0.2, 1) infinite, color-${i} ${opts.duration}s cubic-bezier(0.4, 0.0, 0.2, 1) infinite;`
      : `animation: ${animName} ${opts.duration}s cubic-bezier(0.4, 0.0, 0.2, 1) infinite;`;

    rectsArr.push(`<rect width="${cellSize}" height="${cellSize}" rx="${cornerRadius}" ry="${cornerRadius}" fill="${baseColor}" style="${animStyle}" />`);
  });

  // Glow definitions and elements for anomaly points
  const glowDefs: string[] = [];
  const glowElements: string[] = [];

  anomalySources.forEach((src, idx) => {
    const cx = src.col * cellStep + cellSize / 2 + padding;
    const cy = src.row * cellStep + cellSize / 2 + padding;
    const outerR = cellStep * 4;

    glowDefs.push(`<radialGradient id="glow-${idx}" cx="${cx}" cy="${cy}" r="${outerR}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${theme.anomalyAccent}" stop-opacity="0.12" />
      <stop offset="50%" stop-color="${theme.anomalyAccent}" stop-opacity="0.036" />
      <stop offset="100%" stop-color="${theme.anomalyAccent}" stop-opacity="0" />
    </radialGradient>`);

    glowElements.push(`<circle cx="${cx}" cy="${cy}" r="${outerR}" fill="url(#glow-${idx})" opacity="0">
    <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.25;0.625;0.8;1" dur="${opts.duration}s" repeatCount="indefinite" />
  </circle>`);
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg-gradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${theme.backgroundTop}" />
      <stop offset="100%" stop-color="${theme.backgroundBottom}" />
    </linearGradient>
    ${glowDefs.join('\n    ')}
  </defs>
  <style>
    ${keyframesArr.join('\n    ')}
  </style>
  <rect width="${width}" height="${height}" fill="url(#bg-gradient)" rx="4" ry="4" />
  ${rectsArr.join('\n  ')}
  ${glowElements.join('\n  ')}
  <text x="${width - padding}" y="${height - 8}" fill="${theme.textColor}" font-family="Inter, system-ui, sans-serif" font-size="10" font-weight="300" letter-spacing="0.08em" text-anchor="end">Your commits bend spacetime.</text>
</svg>`;

  return svg;
}
