import { createCanvas, CanvasRenderingContext2D as NodeCanvasCtx } from 'canvas';
import GIFEncoder from 'gif-encoder-2';
import { ContributionDay, RenderOptions } from './types';
import { normalizeContributions } from './normalize';
import { computeGravityCenter, computeWarpedPositions } from './gravity';
import { getWarpProgress } from './animation';
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

interface GifRenderOptions {
  theme?: 'dark' | 'light';
  strength?: number;
  duration?: number;
  clipPercent?: number;
  fps?: number;
  width?: number;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

export async function renderGif(days: ContributionDay[], options: GifRenderOptions = {}): Promise<Buffer> {
  const opts: RenderOptions = { ...DEFAULT_OPTIONS, ...options };
  const fps = options.fps ?? 24;
  const theme = getTheme(opts.theme);
  const { cellSize, cellGap, cornerRadius } = opts;
  const cellStep = cellSize + cellGap;

  const cells = normalizeContributions(days);
  const center = computeGravityCenter(cells);

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
    const warpedCells = computeWarpedPositions(cells, center, warpProgress, opts.strength, cellSize, cellGap);

    // Background
    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, width, height);

    // Draw cells
    for (const cell of warpedCells) {
      const x = cell.warpedX + padding;
      const y = cell.warpedY + padding;
      ctx.fillStyle = theme.levels[cell.level];
      roundRect(ctx, x, y, cellSize, cellSize, cornerRadius);
    }

    // Tagline
    ctx.fillStyle = theme.textColor;
    ctx.font = '10px Inter, system-ui, sans-serif';
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
