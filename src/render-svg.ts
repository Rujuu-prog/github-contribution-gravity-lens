import { ContributionDay, RenderOptions } from './types';
import { normalizeContributions, detectAnomalies } from './normalize';
import { computeLocalLensWarp, computeWarpIntensity, computeInterference, getCellRotation, computeAnomalyActivationDelays, computeLocalLensWarpPerAnomaly } from './gravity';
import { getAnomalyWarpProgress, getAnomalyBrightnessProgress, getInterferenceProgress } from './animation';
import { getTheme } from './theme';
import { computeAnomalyColor, adjustBrightness, shiftHue, hexToRgb } from './color-blend';

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
  const R = 60;

  const cells = normalizeContributions(days);
  const anomalyCells = detectAnomalies(cells, opts.anomalyPercent);

  // Compute activation delays for each anomaly
  const activationDelays = computeAnomalyActivationDelays(anomalyCells, cellSize, cellGap);

  // Compute interference levels
  const interferenceLevels = computeInterference(anomalyCells, R, cellSize, cellGap);

  // Compute max warped positions (all progress=1) for intensity calculation
  const maxWarpedCells = computeLocalLensWarp(anomalyCells, 1, R, opts.strength, cellSize, cellGap);
  const intensities = computeWarpIntensity(maxWarpedCells);

  // Grid dimensions
  const maxCol = cells.reduce((max, c) => Math.max(max, c.col), 0);
  const maxRow = cells.reduce((max, c) => Math.max(max, c.row), 0);
  const padding = 20;
  const taglineHeight = 40;
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

  // Sampling: generate keyframes by sampling time positions
  const sampleStep = 0.5;
  const sampleCount = Math.floor(opts.duration / sampleStep) + 1;
  const sampleTimes: number[] = [];
  for (let s = 0; s < sampleCount; s++) {
    sampleTimes.push(s * sampleStep);
  }

  // For each sample time, compute warped positions
  const sampledPositions: { x: number; y: number }[][] = []; // [sampleIndex][cellIndex]
  for (const t of sampleTimes) {
    // Build per-anomaly progresses
    const progresses = new Map<number, number>();
    anomalyCells.forEach((cell, i) => {
      if (cell.isAnomaly) {
        progresses.set(i, getAnomalyWarpProgress(t, opts.duration, activationDelays[i]));
      }
    });

    const warped = computeLocalLensWarpPerAnomaly(anomalyCells, progresses, R, opts.strength, cellSize, cellGap);
    sampledPositions.push(warped.map(w => ({ x: w.warpedX, y: w.warpedY })));
  }

  // For each sample time, compute per-anomaly brightness and interference
  const sampledBrightness: number[][] = []; // [sampleIndex][cellIndex]
  const sampledInterference: number[] = [];
  for (const t of sampleTimes) {
    const brightnesses: number[] = anomalyCells.map((cell, i) => {
      if (cell.isAnomaly) {
        return getAnomalyBrightnessProgress(t, opts.duration, activationDelays[i]);
      }
      // Zone cells: use nearest anomaly's brightness
      let maxBright = 0;
      anomalyCells.forEach((ac, ai) => {
        if (ac.isAnomaly) {
          const b = getAnomalyBrightnessProgress(t, opts.duration, activationDelays[ai]);
          if (b > maxBright) maxBright = b;
        }
      });
      return maxBright;
    });
    sampledBrightness.push(brightnesses);
    sampledInterference.push(getInterferenceProgress(t, opts.duration));
  }

  // Build keyframes and rects
  const keyframesArr: string[] = [];
  const rectsArr: string[] = [];

  anomalyCells.forEach((cell, i) => {
    const origX = cell.originalX !== undefined ? (cell as any).originalX : cell.col * cellStep;
    const origY = cell.originalY !== undefined ? (cell as any).originalY : cell.row * cellStep;
    const baseColor = theme.levels[cell.level];
    const inZone = isInZone(cell.col, cell.row);

    if (!inZone) {
      // Layer A: Static cell (no animation)
      rectsArr.push(`<rect x="${origX + padding}" y="${origY + padding}" width="${cellSize}" height="${cellSize}" rx="${cornerRadius}" ry="${cornerRadius}" fill="${baseColor}" />`);
      return;
    }

    // Layer B: Animated cell with sampling-based keyframes
    const animName = `warp-${i}`;
    const isAnomaly = cell.isAnomaly;
    const interference = interferenceLevels[i] || 0;

    // Build position keyframes from samples
    const posKeyframes: string[] = [];
    for (let s = 0; s < sampleTimes.length; s++) {
      const pct = ((sampleTimes[s] / opts.duration) * 100).toFixed(1);
      const pos = sampledPositions[s][i];
      const x = pos.x + padding;
      const y = pos.y + padding;

      if (isAnomaly) {
        const brightnessP = sampledBrightness[s][i];
        const rotation = getCellRotation(cell.row, cell.col);
        const scale = 1 + 0.02 * brightnessP;
        const rotAngle = rotation * brightnessP;
        const scaleStr = ` scale(${scale.toFixed(4)}) rotate(${rotAngle.toFixed(2)}deg)`;
        const contrast = 1 + 0.05 * brightnessP;
        const filterStr = brightnessP > 0 ? ` filter: contrast(${contrast.toFixed(3)});` : '';
        posKeyframes.push(`  ${pct}% { transform: translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)${scaleStr} translateZ(1px);${filterStr} }`);
      } else {
        posKeyframes.push(`  ${pct}% { transform: translate(${x.toFixed(2)}px, ${y.toFixed(2)}px); }`);
      }
    }

    keyframesArr.push(`@keyframes ${animName} {\n${posKeyframes.join('\n')}\n}`);

    // Build color keyframes from samples
    const colorKeyframes: string[] = [];
    for (let s = 0; s < sampleTimes.length; s++) {
      const pct = ((sampleTimes[s] / opts.duration) * 100).toFixed(1);
      const brightnessP = sampledBrightness[s][i];
      const interferenceP = sampledInterference[s];

      // Compute warp progress for color effects
      let warpP = 0;
      const pos = sampledPositions[s][i];
      const disp = Math.hypot(pos.x - origX, pos.y - origY);
      const maxDisp = Math.hypot(
        sampledPositions.reduce((max, sp) => Math.max(max, Math.abs(sp[i].x - origX)), 0),
        sampledPositions.reduce((max, sp) => Math.max(max, Math.abs(sp[i].y - origY)), 0),
      );
      if (maxDisp > 0) warpP = disp / maxDisp;

      let color = baseColor;
      if (isAnomaly) {
        if (brightnessP > 0) {
          color = computeAnomalyColor(baseColor, theme.anomalyAccent, brightnessP, 0.15);
          color = adjustBrightness(color, 0.05 * warpP);
          if (interferenceP > 0.95) {
            color = theme.peakMomentColor;
          } else if (interferenceP > 0) {
            // Peak moment color blend
            const peakBlend = interferenceP * 0.3;
            const peakRgb = hexToRgb(theme.peakMomentColor);
            const colorRgb = hexToRgb(color);
            const r = Math.round(colorRgb[0] + (peakRgb[0] - colorRgb[0]) * peakBlend);
            const g = Math.round(colorRgb[1] + (peakRgb[1] - colorRgb[1]) * peakBlend);
            const b = Math.round(colorRgb[2] + (peakRgb[2] - colorRgb[2]) * peakBlend);
            color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
          }
        }
      } else {
        const fg = theme.fieldGradient;
        if (fg && brightnessP > 0) {
          color = computeAnomalyColor(baseColor, fg.peakColor, intensities[i] * warpP, fg.intensity);
          color = shiftHue(color, 7 * warpP);
          color = adjustBrightness(color, -0.08 * warpP);
          if (interference > 0 && interferenceP > 0) {
            color = adjustBrightness(color, 0.20 * interferenceP * interference);
          }
        }
      }

      colorKeyframes.push(`  ${pct}% { fill: ${color}; }`);
    }

    keyframesArr.push(`@keyframes color-${i} {\n${colorKeyframes.join('\n')}\n}`);

    // rx keyframes for anomaly cells (interpolate cornerRadius → 6 based on brightnessProgress)
    if (isAnomaly) {
      const rxKeyframes: string[] = [];
      for (let s = 0; s < sampleTimes.length; s++) {
        const pct = ((sampleTimes[s] / opts.duration) * 100).toFixed(1);
        const brightnessP = sampledBrightness[s][i];
        const animatedRx = cornerRadius + (6 - cornerRadius) * brightnessP;
        rxKeyframes.push(`  ${pct}% { rx: ${animatedRx.toFixed(2)}; ry: ${animatedRx.toFixed(2)}; }`);
      }
      keyframesArr.push(`@keyframes rx-${i} {\n${rxKeyframes.join('\n')}\n}`);
    }

    const animStyle = isAnomaly
      ? `animation: ${animName} ${opts.duration}s linear infinite, color-${i} ${opts.duration}s linear infinite, rx-${i} ${opts.duration}s linear infinite;`
      : `animation: ${animName} ${opts.duration}s linear infinite, color-${i} ${opts.duration}s linear infinite;`;

    rectsArr.push(`<rect width="${cellSize}" height="${cellSize}" rx="${cornerRadius}" ry="${cornerRadius}" fill="${baseColor}" style="${animStyle}" />`);
  });

  // Glow definitions and elements for anomaly points
  const glowDefs: string[] = [];
  const glowElements: string[] = [];

  anomalySources.forEach((src, idx) => {
    const cx = src.col * cellStep + cellSize / 2 + padding;
    const cy = src.row * cellStep + cellSize / 2 + padding;
    const outerR = cellStep * 4;
    const delay = activationDelays[anomalyCells.indexOf(src)];

    glowDefs.push(`<radialGradient id="glow-${idx}" cx="${cx}" cy="${cy}" r="${outerR}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${theme.anomalyAccent}" stop-opacity="0.12" />
      <stop offset="50%" stop-color="${theme.anomalyAccent}" stop-opacity="0.036" />
      <stop offset="100%" stop-color="${theme.anomalyAccent}" stop-opacity="0" />
    </radialGradient>`);

    // Glow activation timing based on delay
    const brightStart = ((2 + delay) / opts.duration).toFixed(3);
    const brightEnd = ((2 + delay + 1.2) / opts.duration).toFixed(3);
    const restoreStart = (11 / opts.duration).toFixed(3);

    glowElements.push(`<circle cx="${cx}" cy="${cy}" r="${outerR}" fill="url(#glow-${idx})" opacity="0">
    <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;${brightStart};${brightEnd};${restoreStart};1" dur="${opts.duration}s" repeatCount="indefinite" />
  </circle>`);
  });

  // Progress bar dimensions
  const gridBottom = (maxRow + 1) * cellStep + padding;
  const barY = gridBottom + 8;
  const barWidth = (maxCol + 1) * cellStep;
  const barX = padding;

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
  <rect x="${barX}" y="${barY}" width="${barWidth}" height="3" rx="1.5" ry="1.5" fill="${theme.textColor}" opacity="0.15" />
  <rect x="${barX}" y="${barY}" width="0" height="3" rx="1.5" ry="1.5" fill="${theme.anomalyAccent}" opacity="0.6">
    <animate attributeName="width" values="0;${barWidth}" dur="${opts.duration}s" repeatCount="indefinite" />
  </rect>
  <text x="${width - padding}" y="${height - 8}" fill="${theme.textColor}" font-family="Inter, system-ui, sans-serif" font-size="10" font-weight="300" letter-spacing="0.08em" text-anchor="end">Your commits bend spacetime.</text>
</svg>`;

  return svg;
}
