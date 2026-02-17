import { createCanvas, CanvasRenderingContext2D as NodeCanvasCtx } from 'canvas';
import GIFEncoder from 'gif-encoder-2';
import { ContributionDay, RenderOptions } from './types';
import { normalizeContributions, detectAnomalies } from './normalize';
import { computeLocalLensWarp, computeWarpIntensity } from './gravity';
import { getWarpProgress, getBrightnessProgress } from './animation';
import { getTheme } from './theme';
import { hexToRgb, computeAnomalyColor } from './color-blend';

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

interface GifRenderOptions {
  theme?: 'dark' | 'light';
  strength?: number;
  duration?: number;
  clipPercent?: number;
  fps?: number;
  width?: number;
  anomalyPercent?: number;
}

export async function renderGif(days: ContributionDay[], options: GifRenderOptions = {}): Promise<Buffer> {
  const opts: RenderOptions = { ...DEFAULT_OPTIONS, ...options };
  const fps = options.fps ?? 24;
  const theme = getTheme(opts.theme);
  const { cellSize, cellGap, cornerRadius } = opts;
  const cellStep = cellSize + cellGap;
  const R = 40;

  const cells = normalizeContributions(days);
  const anomalyCells = detectAnomalies(cells, opts.anomalyPercent);

  // Determine which cells are in the influence zone
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

  const maxCol = cells.reduce((max, c) => Math.max(max, c.col), 0);
  const maxRow = cells.reduce((max, c) => Math.max(max, c.row), 0);
  const padding = 20;
  const taglineHeight = 30;
  const width = options.width ?? (maxCol + 1) * cellStep + padding * 2;
  const height = (maxRow + 1) * cellStep + padding * 2 + taglineHeight;

  const totalFrames = Math.floor(fps * opts.duration);

  const encoder = new GIFEncoder(width, height, 'neuquant', true);
  encoder.setDelay(Math.round(1000 / fps));
  encoder.setRepeat(0); // loop forever
  encoder.setQuality(10);
  encoder.start();

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  for (let frame = 0; frame < totalFrames; frame++) {
    const time = (frame / totalFrames) * opts.duration;
    const warpProgress = getWarpProgress(time, opts.duration);
    const brightnessProgress = getBrightnessProgress(time, opts.duration);

    // Compute warped positions for this frame
    const warpedCells = computeLocalLensWarp(anomalyCells, warpProgress, R, opts.strength, cellSize, cellGap);
    const intensities = computeWarpIntensity(warpedCells);

    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, theme.backgroundTop);
    gradient.addColorStop(1, theme.backgroundBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw cells
    const fg = theme.fieldGradient;

    for (let ci = 0; ci < warpedCells.length; ci++) {
      const cell = warpedCells[ci];
      const inZone = isInZone(cell.col, cell.row);
      const baseColor = theme.levels[cell.level];

      if (!inZone) {
        // Layer A: Static cells - draw at original position
        const x = cell.originalX + padding;
        const y = cell.originalY + padding;
        ctx.fillStyle = baseColor;
        roundRect(ctx, x, y, cellSize, cellSize, cornerRadius);
      } else {
        // Layer B: Animated cells
        const x = cell.warpedX + padding;
        const y = cell.warpedY + padding;

        let fillColor = baseColor;
        if (cell.isAnomaly) {
          // Anomaly cell: brightness effect with anomalyAccent
          fillColor = computeAnomalyColor(baseColor, theme.anomalyAccent, brightnessProgress, 0.15);
        } else if (fg) {
          // Zone cell: subtle color shift based on warp intensity
          fillColor = computeAnomalyColor(baseColor, fg.peakColor, intensities[ci] * warpProgress, fg.intensity);
        }

        ctx.fillStyle = fillColor;

        // Anomaly cells get a micro scale effect
        if (cell.isAnomaly && brightnessProgress > 0) {
          const scale = 1 + 0.02 * brightnessProgress;
          const scaledSize = cellSize * scale;
          const offset = (scaledSize - cellSize) / 2;
          roundRect(ctx, x - offset, y - offset, scaledSize, scaledSize, cornerRadius);
        } else {
          roundRect(ctx, x, y, cellSize, cellSize, cornerRadius);
        }
      }
    }

    // Soft radial glow around anomaly points
    for (const src of anomalySources) {
      if (brightnessProgress <= 0) continue;
      const cx = src.col * cellStep + cellSize / 2 + padding;
      const cy = src.row * cellStep + cellSize / 2 + padding;
      const outerR = cellStep * 4;
      const glowAlpha = brightnessProgress * 0.12;
      const glowGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, outerR);
      const accentRgb = hexToRgb(theme.anomalyAccent);
      glowGradient.addColorStop(0, `rgba(${accentRgb[0]}, ${accentRgb[1]}, ${accentRgb[2]}, ${glowAlpha})`);
      glowGradient.addColorStop(0.5, `rgba(${accentRgb[0]}, ${accentRgb[1]}, ${accentRgb[2]}, ${glowAlpha * 0.3})`);
      glowGradient.addColorStop(1, `rgba(${accentRgb[0]}, ${accentRgb[1]}, ${accentRgb[2]}, 0)`);
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
      ctx.fillStyle = glowGradient;
      ctx.fill();
    }

    // Tagline
    ctx.fillStyle = theme.textColor;
    ctx.font = '300 10px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Your commits bend spacetime.', width - padding, height - 8);

    encoder.addFrame(ctx as any);
  }

  encoder.finish();

  const buffer = encoder.out.getData();
  return buffer;
}

function roundRect(
  ctx: NodeCanvasCtx,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}
