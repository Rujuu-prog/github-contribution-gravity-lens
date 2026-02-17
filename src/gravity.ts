import { GridCell, AnomalyGridCell, Point, WarpedCell } from './types';

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
        totalDx += ddx * factor;
        totalDy += ddy * factor;
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
