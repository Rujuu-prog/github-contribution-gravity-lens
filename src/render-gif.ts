import { createCanvas, CanvasRenderingContext2D as NodeCanvasCtx } from 'canvas';
import GIFEncoder from 'gif-encoder-2';
import { ContributionDay, RenderOptions } from './types';
import { normalizeContributions, detectAnomalies } from './normalize';
import { computeLocalLensWarp, computeWarpIntensity, computeInterference, getCellRotation, computeAnomalyActivationDelays, computeLocalLensWarpPerAnomaly } from './gravity';
import { getAnomalyWarpProgress, getAnomalyBrightnessProgress, getInterferenceProgress } from './animation';
import { getTheme } from './theme';
import { hexToRgb, computeAnomalyColor, adjustBrightness, shiftHue, blendColors } from './color-blend';

const DEFAULT_OPTIONS: RenderOptions = {
  theme: 'dark',
  strength: 0.5,
  duration: 14,
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
  const fps = options.fps ?? 12; // 12fps for 14s = 168 frames (manageable GIF size)
  const theme = getTheme(opts.theme);
  const { cellSize, cellGap, cornerRadius } = opts;
  const cellStep = cellSize + cellGap;
  const R = 60;

  const cells = normalizeContributions(days);
  const anomalyCells = detectAnomalies(cells, opts.anomalyPercent);

  // Compute activation delays
  const activationDelays = computeAnomalyActivationDelays(anomalyCells, cellSize, cellGap);

  // Compute interference levels
  const interferenceLevels = computeInterference(anomalyCells, R, cellSize, cellGap);

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

  // Pre-compute max warped positions (all progress=1) for intensity calculation
  const maxWarpedCells = computeLocalLensWarp(anomalyCells, 1, R, opts.strength, cellSize, cellGap);
  const maxIntensities = computeWarpIntensity(maxWarpedCells);

  const encoder = new GIFEncoder(width, height, 'neuquant', true);
  encoder.setDelay(Math.round(1000 / fps));
  encoder.setRepeat(0); // loop forever
  encoder.setQuality(10);
  encoder.start();

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  for (let frame = 0; frame < totalFrames; frame++) {
    const time = (frame / totalFrames) * opts.duration;
    const interferenceProgress = getInterferenceProgress(time, opts.duration);

    // Build per-anomaly progresses
    const progresses = new Map<number, number>();
    anomalyCells.forEach((cell, i) => {
      if (cell.isAnomaly) {
        progresses.set(i, getAnomalyWarpProgress(time, opts.duration, activationDelays[i]));
      }
    });

    // Compute warped positions for this frame
    const warpedCells = computeLocalLensWarpPerAnomaly(anomalyCells, progresses, R, opts.strength, cellSize, cellGap);

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

      // Per-anomaly brightness
      let brightnessProgress = 0;
      if (cell.isAnomaly) {
        brightnessProgress = getAnomalyBrightnessProgress(time, opts.duration, activationDelays[ci]);
      } else {
        // Zone cells: use max brightness of nearby anomalies
        anomalyCells.forEach((ac, ai) => {
          if (ac.isAnomaly) {
            const b = getAnomalyBrightnessProgress(time, opts.duration, activationDelays[ai]);
            if (b > brightnessProgress) brightnessProgress = b;
          }
        });
      }

      // Compute warp progress for color effects
      const cellWarpProgress = progresses.get(ci) ?? 0;
      // For zone cells, use the max warp progress of nearby anomalies
      let effectiveWarpP = cellWarpProgress;
      if (!cell.isAnomaly) {
        let maxWP = 0;
        anomalyCells.forEach((ac, ai) => {
          if (ac.isAnomaly) {
            const wp = progresses.get(ai) ?? 0;
            if (wp > maxWP) maxWP = wp;
          }
        });
        effectiveWarpP = maxWP;
      }

      if (!inZone) {
        // Layer A: Static cells
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
          fillColor = computeAnomalyColor(baseColor, theme.anomalyAccent, brightnessProgress, 0.15);
          if (interferenceProgress > 0.95) {
            fillColor = theme.peakMomentColor;
          } else if (interferenceProgress > 0) {
            fillColor = blendColors(fillColor, theme.peakMomentColor, interferenceProgress * 0.3);
          }
          fillColor = adjustBrightness(fillColor, 0.05 * effectiveWarpP);
        } else if (fg) {
          fillColor = computeAnomalyColor(baseColor, fg.peakColor, maxIntensities[ci] * effectiveWarpP, fg.intensity);
          fillColor = shiftHue(fillColor, 7 * effectiveWarpP);
          fillColor = adjustBrightness(fillColor, -0.08 * effectiveWarpP);
          const interference = interferenceLevels[ci] || 0;
          if (interference > 0 && interferenceProgress > 0) {
            fillColor = adjustBrightness(fillColor, 0.20 * interferenceProgress * interference);
          }
        }

        ctx.fillStyle = fillColor;

        if (cell.isAnomaly && brightnessProgress > 0) {
          const scale = 1 + 0.02 * brightnessProgress;
          const scaledSize = cellSize * scale;
          const offset = (scaledSize - cellSize) / 2;
          const rotation = getCellRotation(cell.row, cell.col);
          const rad = (rotation * Math.PI / 180) * effectiveWarpP;
          const centerX = x - offset + scaledSize / 2;
          const centerY = y - offset + scaledSize / 2;

          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.rotate(rad);
          ctx.translate(-centerX, -centerY);
          roundRect(ctx, x - offset, y - offset, scaledSize, scaledSize, 6);
          ctx.restore();
        } else {
          roundRect(ctx, x, y, cellSize, cellSize, cornerRadius);
        }
      }
    }

    // Soft radial glow around anomaly points
    for (let si = 0; si < anomalySources.length; si++) {
      const src = anomalySources[si];
      const srcIndex = anomalyCells.indexOf(src);
      const glowBrightness = getAnomalyBrightnessProgress(time, opts.duration, activationDelays[srcIndex]);
      if (glowBrightness <= 0) continue;
      const cx = src.col * cellStep + cellSize / 2 + padding;
      const cy = src.row * cellStep + cellSize / 2 + padding;
      const outerR = cellStep * 4;
      const glowAlpha = glowBrightness * 0.12;
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
