import { ContributionDay, RenderOptions } from './types';
import { normalizeContributions } from './normalize';
import { computeGravityCenter, computeWarpedPositions } from './gravity';
import { getTheme } from './theme';

const DEFAULT_OPTIONS: RenderOptions = {
  theme: 'dark',
  strength: 0.35,
  duration: 4,
  clipPercent: 95,
  cellSize: 12,
  cellGap: 3,
  cornerRadius: 2,
};

interface SvgRenderOptions {
  theme?: 'dark' | 'light';
  strength?: number;
  duration?: number;
  clipPercent?: number;
}

export function renderSvg(days: ContributionDay[], options: SvgRenderOptions = {}): string {
  const opts: RenderOptions = { ...DEFAULT_OPTIONS, ...options };
  const theme = getTheme(opts.theme);
  const { cellSize, cellGap, cornerRadius } = opts;
  const cellStep = cellSize + cellGap;

  const cells = normalizeContributions(days);
  const center = computeGravityCenter(cells);

  // Grid dimensions
  const maxCol = cells.reduce((max, c) => Math.max(max, c.col), 0);
  const maxRow = cells.reduce((max, c) => Math.max(max, c.row), 0);
  const padding = 20;
  const taglineHeight = 30;
  const width = (maxCol + 1) * cellStep + padding * 2;
  const height = (maxRow + 1) * cellStep + padding * 2 + taglineHeight;

  // Compute warped positions at full warp
  const warpedCells = computeWarpedPositions(cells, center, 1, opts.strength, cellSize, cellGap);

  // Build keyframes for each cell
  const keyframesArr: string[] = [];
  const rectsArr: string[] = [];

  warpedCells.forEach((cell, i) => {
    const origX = cell.originalX + padding;
    const origY = cell.originalY + padding;
    const warpX = cell.warpedX + padding;
    const warpY = cell.warpedY + padding;
    const color = theme.levels[cell.level];

    const animName = `warp-${i}`;

    // Phase 1 (0%-25%): static
    // Phase 2 (25%-50%): ease to warped
    // Phase 3 (50%-70%): hold warped
    // Phase 4 (70%-100%): ease back
    keyframesArr.push(`@keyframes ${animName} {
  0%, 25% { transform: translate(${origX}px, ${origY}px); }
  50%, 70% { transform: translate(${warpX.toFixed(2)}px, ${warpY.toFixed(2)}px); }
  100% { transform: translate(${origX}px, ${origY}px); }
}`);

    rectsArr.push(`<rect width="${cellSize}" height="${cellSize}" rx="${cornerRadius}" ry="${cornerRadius}" fill="${color}" style="animation: ${animName} ${opts.duration}s cubic-bezier(0.4, 0.0, 0.2, 1) infinite;" />`);
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <style>
    ${keyframesArr.join('\n    ')}
  </style>
  <rect width="${width}" height="${height}" fill="${theme.background}" rx="4" ry="4" />
  ${rectsArr.join('\n  ')}
  <text x="${width - padding}" y="${height - 8}" fill="${theme.textColor}" font-family="Inter, system-ui, sans-serif" font-size="10" text-anchor="end">Your commits bend spacetime.</text>
</svg>`;

  return svg;
}
