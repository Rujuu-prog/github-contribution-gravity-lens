import { GridCell, AnomalyGridCell, Point, WarpedCell } from './types';
import { computeActivationDelay } from './animation';

export function computeWarpIntensity(warpedCells: WarpedCell[]): number[] {
  if (warpedCells.length === 0) return [];

  const displacements = warpedCells.map(cell =>
    Math.hypot(cell.warpedX - cell.originalX, cell.warpedY - cell.originalY),
  );

  const maxDisp = Math.max(...displacements);
  if (maxDisp === 0) return displacements.map(() => 0);

  return displacements.map(d => d / maxDisp);
}

const EPSILON = 0.01;

export function computeGravityCenter(cells: GridCell[]): Point {
  if (cells.length === 0) return { x: 0, y: 0 };

  let totalMass = 0;
  let weightedX = 0;
  let weightedY = 0;

  for (const cell of cells) {
    totalMass += cell.mass;
    weightedX += cell.col * cell.mass;
    weightedY += cell.row * cell.mass;
  }

  if (totalMass === 0) {
    const cols = cells.map(c => c.col);
    const rows = cells.map(c => c.row);
    return {
      x: (Math.min(...cols) + Math.max(...cols)) / 2,
      y: (Math.min(...rows) + Math.max(...rows)) / 2,
    };
  }

  return {
    x: weightedX / totalMass,
    y: weightedY / totalMass,
  };
}

export function findGravityPeaks(cells: GridCell[], n: number): Point[] {
  const nonZero = cells.filter(c => c.mass > 0);
  if (nonZero.length === 0) return [];

  const sorted = [...nonZero].sort((a, b) => b.mass - a.mass);

  const peaks: Point[] = [];
  for (const cell of sorted) {
    if (peaks.length >= n) break;

    const candidate: Point = { x: cell.col, y: cell.row };
    const tooClose = peaks.some(p => {
      const dist = Math.hypot(p.x - candidate.x, p.y - candidate.y);
      return dist <= 2;
    });

    if (!tooClose) {
      peaks.push(candidate);
    }
  }

  return peaks;
}

export function computeFieldWarp(
  cells: GridCell[],
  warpProgress: number,
  maxWarp: number,
  cellSize: number,
  cellGap: number,
): WarpedCell[] {
  const cellStep = cellSize + cellGap;
  const k = cellStep * 3;

  return cells.map(cell => {
    const originalX = cell.col * cellStep;
    const originalY = cell.row * cellStep;
    const cx = originalX + cellSize / 2;
    const cy = originalY + cellSize / 2;

    let dx = 0;
    let dy = 0;

    for (const src of cells) {
      if (src.mass === 0) continue;
      const srcX = src.col * cellStep + cellSize / 2;
      const srcY = src.row * cellStep + cellSize / 2;
      const ddx = cx - srcX;
      const ddy = cy - srcY;
      const r2 = ddx * ddx + ddy * ddy + EPSILON;

      dx += ddx * k * src.mass * src.mass / r2;
      dy += ddy * k * src.mass * src.mass / r2;
    }

    const mag = Math.hypot(dx, dy);
    const maxDisp = maxWarp * cellStep;
    if (mag > maxDisp) {
      dx = dx / mag * maxDisp;
      dy = dy / mag * maxDisp;
    }

    return {
      ...cell,
      originalX,
      originalY,
      warpedX: originalX + dx * warpProgress,
      warpedY: originalY + dy * warpProgress,
    };
  });
}

export function computeWarpedPositions(
  cells: GridCell[],
  centers: Point | Point[],
  warpProgress: number,
  maxWarp: number,
  cellSize: number,
  cellGap: number,
): WarpedCell[] {
  const centerArray = Array.isArray(centers) ? centers : [centers];
  const cellStep = cellSize + cellGap;

  const centersPx: Point[] = centerArray.map(c => ({
    x: c.x * cellStep + cellSize / 2,
    y: c.y * cellStep + cellSize / 2,
  }));

  const totalMass = cells.reduce((sum, c) => sum + c.mass, 0);
  const avgMass = cells.length > 0 ? totalMass / cells.length : 0;
  const k = 50 * (avgMass + 0.1) * cellStep;

  return cells.map(cell => {
    const originalX = cell.col * cellStep;
    const originalY = cell.row * cellStep;

    const cellCenterX = originalX + cellSize / 2;
    const cellCenterY = originalY + cellSize / 2;

    let totalDx = 0;
    let totalDy = 0;

    for (const centerPx of centersPx) {
      const dx = cellCenterX - centerPx.x;
      const dy = cellCenterY - centerPx.y;
      const r2 = dx * dx + dy * dy + EPSILON;

      const factor = Math.min(k * avgMass / r2, maxWarp);

      totalDx += dx * factor;
      totalDy += dy * factor;
    }

    const warpedX = originalX + totalDx * warpProgress;
    const warpedY = originalY + totalDy * warpProgress;

    return {
      ...cell,
      originalX,
      originalY,
      warpedX,
      warpedY,
    };
  });
}

export function computeLocalLensWarp(
  cells: AnomalyGridCell[],
  warpProgress: number,
  R: number,
  maxWarp: number,
  cellSize: number,
  cellGap: number,
): WarpedCell[] {
  if (cells.length === 0) return [];

  const cellStep = cellSize + cellGap;
  const k = cellStep * 3;
  const anomalyCells = cells.filter(c => c.isAnomaly);
  const maxDisp = maxWarp * cellStep;

  return cells.map(cell => {
    const originalX = cell.col * cellStep;
    const originalY = cell.row * cellStep;
    const cx = originalX + cellSize / 2;
    const cy = originalY + cellSize / 2;

    let totalDx = 0;
    let totalDy = 0;

    if (!cell.isAnomaly) {
      for (const src of anomalyCells) {
        const srcX = src.col * cellStep + cellSize / 2;
        const srcY = src.row * cellStep + cellSize / 2;
        const ddx = cx - srcX;
        const ddy = cy - srcY;
        const dist = Math.hypot(ddx, ddy);

        if (dist > R || dist === 0) continue;

        const r2 = dist * dist + EPSILON;
        const factor = Math.min(k * src.mass * src.mass / r2, maxWarp);
        totalDx += ddx * factor * 1.2;
        totalDy += ddy * factor * 0.8;
      }
    }

    // Clamp displacement
    const mag = Math.hypot(totalDx, totalDy);
    if (mag > maxDisp) {
      totalDx = totalDx / mag * maxDisp;
      totalDy = totalDy / mag * maxDisp;
    }

    return {
      ...cell,
      originalX,
      originalY,
      warpedX: originalX + totalDx * warpProgress,
      warpedY: originalY + totalDy * warpProgress,
    };
  });
}

/**
 * 2つ以上の異常点のR内にあるセルの干渉レベルを算出
 * 戻り値は cells と同じ長さの配列で、各セルの interferenceLevel (0-1)
 */
export function computeInterference(
  cells: AnomalyGridCell[],
  R: number,
  cellSize: number,
  cellGap: number,
): number[] {
  const cellStep = cellSize + cellGap;
  const anomalySources = cells.filter(c => c.isAnomaly);

  return cells.map(cell => {
    if (cell.isAnomaly) return 0;

    const cx = cell.col * cellStep + cellSize / 2;
    const cy = cell.row * cellStep + cellSize / 2;

    let influenceCount = 0;
    let totalInfluence = 0;

    for (const src of anomalySources) {
      const sx = src.col * cellStep + cellSize / 2;
      const sy = src.row * cellStep + cellSize / 2;
      const dist = Math.hypot(cx - sx, cy - sy);

      if (dist <= R && dist > 0) {
        influenceCount++;
        totalInfluence += 1 - dist / R;
      }
    }

    if (influenceCount < 2) return 0;

    return Math.min(1, totalInfluence / influenceCount);
  });
}

/**
 * 各セルのx位置ベース発火遅延を算出
 * - 異常点セル: col位置からdelay算出 (maxCol = max(anomalySource.col))
 * - 非異常点セル: 0
 */
export function computeAnomalyActivationDelays(
  cells: AnomalyGridCell[],
  cellSize: number,
  cellGap: number,
): number[] {
  if (cells.length === 0) return [];

  const anomalySources = cells.filter(c => c.isAnomaly);
  if (anomalySources.length === 0) {
    return cells.map(() => 0);
  }

  const maxCol = Math.max(...anomalySources.map(c => c.col));

  return cells.map(cell => {
    if (!cell.isAnomaly) return 0;
    return computeActivationDelay(cell.col, maxCol);
  });
}

/**
 * 異常点ごとに独立したwarpProgressを適用してワープ位置を計算
 * progresses: Map<cellIndex, warpProgress> (異常点セルのインデックス → そのwarpProgress)
 */
export function computeLocalLensWarpPerAnomaly(
  cells: AnomalyGridCell[],
  progresses: Map<number, number>,
  R: number,
  maxWarp: number,
  cellSize: number,
  cellGap: number,
): WarpedCell[] {
  if (cells.length === 0) return [];

  const cellStep = cellSize + cellGap;
  const k = cellStep * 3;
  const maxDisp = maxWarp * cellStep;

  // Build anomaly list with their progress
  const anomalyEntries: { cell: AnomalyGridCell; index: number; progress: number }[] = [];
  cells.forEach((cell, i) => {
    if (cell.isAnomaly) {
      anomalyEntries.push({ cell, index: i, progress: progresses.get(i) ?? 0 });
    }
  });

  return cells.map(cell => {
    const originalX = cell.col * cellStep;
    const originalY = cell.row * cellStep;
    const cx = originalX + cellSize / 2;
    const cy = originalY + cellSize / 2;

    let totalDx = 0;
    let totalDy = 0;

    if (!cell.isAnomaly) {
      for (const entry of anomalyEntries) {
        if (entry.progress === 0) continue;

        const src = entry.cell;
        const srcX = src.col * cellStep + cellSize / 2;
        const srcY = src.row * cellStep + cellSize / 2;
        const ddx = cx - srcX;
        const ddy = cy - srcY;
        const dist = Math.hypot(ddx, ddy);

        if (dist > R || dist === 0) continue;

        const r2 = dist * dist + 0.01;
        const factor = Math.min(k * src.mass * src.mass / r2, maxWarp);
        totalDx += ddx * factor * 1.2 * entry.progress;
        totalDy += ddy * factor * 0.8 * entry.progress;
      }
    }

    // Clamp displacement
    const mag = Math.hypot(totalDx, totalDy);
    if (mag > maxDisp) {
      totalDx = totalDx / mag * maxDisp;
      totalDy = totalDy / mag * maxDisp;
    }

    return {
      ...cell,
      originalX,
      originalY,
      warpedX: originalX + totalDx,
      warpedY: originalY + totalDy,
    };
  });
}

/**
 * 干渉中のゾーンセルに適用する決定論的位置ジッターを算出
 */
export function computeInterferenceJitter(
  row: number, col: number,
  interferenceProgress: number,
  interferenceLevel: number,
  maxJitter: number = 0.8,
): { x: number; y: number } {
  if (interferenceProgress <= 0 || interferenceLevel <= 0) return { x: 0, y: 0 };
  const hash = ((row * 13397 + col * 8461) ^ 0x3c6ef35f) & 0xffffffff;
  const angle = ((hash & 0x7fffffff) % 1000) / 1000 * Math.PI * 2;
  const magnitude = maxJitter * interferenceProgress * interferenceLevel;
  return { x: Math.cos(angle) * magnitude, y: Math.sin(angle) * magnitude };
}

/**
 * 決定的ハッシュベースでセルの回転角 (±1-2deg) を返す
 */
export function getCellRotation(row: number, col: number): number {
  // Simple deterministic hash
  const hash = ((row * 7919 + col * 6271) ^ 0x5deece66d) & 0xffffffff;
  const normalized = ((hash & 0x7fffffff) % 1000) / 1000; // 0-1
  // Map to ±1-2deg: sign from hash, magnitude 1-2
  const sign = (hash & 1) === 0 ? 1 : -1;
  const magnitude = 1 + normalized;
  return sign * magnitude;
}
