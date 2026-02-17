import { GridCell, Point, WarpedCell } from './types';

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

export function computeWarpedPositions(
  cells: GridCell[],
  center: Point,
  warpProgress: number,
  maxWarp: number,
  cellSize: number,
  cellGap: number,
): WarpedCell[] {
  const cellStep = cellSize + cellGap;

  const centerPx: Point = {
    x: center.x * cellStep + cellSize / 2,
    y: center.y * cellStep + cellSize / 2,
  };

  const totalMass = cells.reduce((sum, c) => sum + c.mass, 0);
  const avgMass = cells.length > 0 ? totalMass / cells.length : 0;
  const k = 50 * (avgMass + 0.1) * cellStep;

  return cells.map(cell => {
    const originalX = cell.col * cellStep;
    const originalY = cell.row * cellStep;

    const cellCenterX = originalX + cellSize / 2;
    const cellCenterY = originalY + cellSize / 2;

    const dx = cellCenterX - centerPx.x;
    const dy = cellCenterY - centerPx.y;
    const r2 = dx * dx + dy * dy + EPSILON;

    const factor = Math.min(k * avgMass / r2, maxWarp);

    const warpedX = originalX + dx * factor * warpProgress;
    const warpedY = originalY + dy * factor * warpProgress;

    return {
      ...cell,
      originalX,
      originalY,
      warpedX,
      warpedY,
    };
  });
}
