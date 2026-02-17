import { describe, it, expect } from 'vitest';
import { computeGravityCenter, computeWarpedPositions } from '../src/gravity';
import { GridCell, Point } from '../src/types';

function makeCell(row: number, col: number, mass: number): GridCell {
  return { row, col, count: 0, level: 0, mass };
}

describe('computeGravityCenter', () => {
  it('均一質量のグリッドでは中心付近を返す', () => {
    const cells: GridCell[] = [];
    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 4; row++) {
        cells.push(makeCell(row, col, 1));
      }
    }
    const center = computeGravityCenter(cells);
    expect(center.x).toBeCloseTo(1.5, 1);
    expect(center.y).toBeCloseTo(1.5, 1);
  });

  it('単一セルに質量が集中している場合、そのセル位置を返す', () => {
    const cells: GridCell[] = [
      makeCell(0, 0, 0),
      makeCell(0, 1, 0),
      makeCell(1, 0, 0),
      makeCell(1, 1, 10),
    ];
    const center = computeGravityCenter(cells);
    expect(center.x).toBeCloseTo(1, 1);
    expect(center.y).toBeCloseTo(1, 1);
  });

  it('全セルの質量が0の場合、グリッド中心を返す', () => {
    const cells: GridCell[] = [
      makeCell(0, 0, 0),
      makeCell(0, 1, 0),
      makeCell(1, 0, 0),
      makeCell(1, 1, 0),
    ];
    const center = computeGravityCenter(cells);
    expect(center.x).toBeCloseTo(0.5, 1);
    expect(center.y).toBeCloseTo(0.5, 1);
  });

  it('空配列では(0,0)を返す', () => {
    const center = computeGravityCenter([]);
    expect(center.x).toBe(0);
    expect(center.y).toBe(0);
  });
});

describe('computeWarpedPositions', () => {
  const cellSize = 12;
  const cellGap = 3;

  it('warpProgress=0の場合、元の位置を返す', () => {
    const cells = [makeCell(0, 0, 1), makeCell(3, 3, 1)];
    const center: Point = { x: 1.5, y: 1.5 };
    const result = computeWarpedPositions(cells, center, 0, 0.35, cellSize, cellGap);
    result.forEach(w => {
      expect(w.warpedX).toBeCloseTo(w.originalX, 5);
      expect(w.warpedY).toBeCloseTo(w.originalY, 5);
    });
  });

  it('warpProgress=1の場合、中心に近いセルはほぼ不動', () => {
    const cells = [makeCell(2, 2, 0.5)];
    const center: Point = { x: 2, y: 2 };
    const result = computeWarpedPositions(cells, center, 1, 0.35, cellSize, cellGap);
    const w = result[0];
    const dx = Math.abs(w.warpedX - w.originalX);
    const dy = Math.abs(w.warpedY - w.originalY);
    expect(dx).toBeLessThan(1);
    expect(dy).toBeLessThan(1);
  });

  it('遠いセルのワープ量は近いセルより小さい', () => {
    const cells = [
      makeCell(0, 5, 0.5),  // 遠い
      makeCell(3, 4, 0.5),  // 近い（中心から1離れた位置）
    ];
    const center: Point = { x: 3, y: 3 };
    const result = computeWarpedPositions(cells, center, 1, 0.35, cellSize, cellGap);

    const farWarp = Math.hypot(
      result[0].warpedX - result[0].originalX,
      result[0].warpedY - result[0].originalY
    );
    const nearWarp = Math.hypot(
      result[1].warpedX - result[1].originalX,
      result[1].warpedY - result[1].originalY
    );
    // 逆二乗法則により遠いセルのワープは小さい
    expect(farWarp).toBeLessThan(nearWarp);
  });

  it('実用的なグリッドで視認可能なワープ量を生成する', () => {
    // 7x10グリッド（70セル）、適度な貢献活動を想定
    const cells: GridCell[] = [];
    for (let col = 0; col < 10; col++) {
      for (let row = 0; row < 7; row++) {
        cells.push(makeCell(row, col, 0.5));
      }
    }
    const center = { x: 5, y: 3 };
    const result = computeWarpedPositions(cells, center, 1, 0.35, 12, 3);

    // 中心から2-3セル離れた要素のワープが3px以上であること
    const nearCenterCells = result.filter(w => {
      const gridDist = Math.hypot(w.col - center.x, w.row - center.y);
      return gridDist >= 2 && gridDist <= 3;
    });

    expect(nearCenterCells.length).toBeGreaterThan(0);
    for (const w of nearCenterCells) {
      const warpDist = Math.hypot(w.warpedX - w.originalX, w.warpedY - w.originalY);
      expect(warpDist).toBeGreaterThan(3);
    }
  });

  it('ワープ量がmaxWarpでクランプされる', () => {
    const maxWarp = 0.1;
    const cells = [makeCell(3, 0, 1)];
    const center: Point = { x: 3, y: 3 };
    const result = computeWarpedPositions(cells, center, 1, maxWarp, cellSize, cellGap);
    const w = result[0];
    const dx = Math.abs(w.warpedX - w.originalX);
    const dy = Math.abs(w.warpedY - w.originalY);
    const cellStep = cellSize + cellGap;
    // factor <= maxWarp なので、変位 = distance * factor <= distance * maxWarp
    expect(dx).toBeLessThanOrEqual(cellStep * 10 * maxWarp + 1);
    expect(dy).toBeLessThanOrEqual(cellStep * 10 * maxWarp + 1);
  });
});
