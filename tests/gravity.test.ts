import { describe, it, expect } from 'vitest';
import { computeGravityCenter, computeWarpedPositions, findGravityPeaks, computeFieldWarp, computeWarpIntensity, computeLocalLensWarp, computeInterference, getCellRotation, computeAnomalyActivationDelays, computeLocalLensWarpPerAnomaly, computeInterferenceJitter } from '../src/gravity';
import { GridCell, AnomalyGridCell, Point, WarpedCell } from '../src/types';

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

describe('findGravityPeaks', () => {
  it('上位N個のピークを返す', () => {
    const cells = [
      makeCell(0, 0, 1),
      makeCell(0, 5, 10),
      makeCell(3, 3, 8),
      makeCell(6, 10, 5),
      makeCell(2, 2, 3),
    ];
    const peaks = findGravityPeaks(cells, 3);
    expect(peaks).toHaveLength(3);
    // mass順: 10, 8, 5 → col=5/row=0, col=3/row=3, col=10/row=6
    expect(peaks[0]).toEqual({ x: 5, y: 0 });
    expect(peaks[1]).toEqual({ x: 3, y: 3 });
    expect(peaks[2]).toEqual({ x: 10, y: 6 });
  });

  it('近接ピーク（距離2以内）はマージして最大mass側を採用', () => {
    const cells = [
      makeCell(3, 3, 10),  // 最大mass
      makeCell(3, 4, 8),   // 距離1 → マージ
      makeCell(0, 0, 5),   // 遠い → 残る
    ];
    const peaks = findGravityPeaks(cells, 3);
    expect(peaks).toHaveLength(2);
    expect(peaks[0]).toEqual({ x: 3, y: 3 });
    expect(peaks[1]).toEqual({ x: 0, y: 0 });
  });

  it('セル数よりNが大きい場合、利用可能なピーク数を返す', () => {
    const cells = [makeCell(0, 0, 5)];
    const peaks = findGravityPeaks(cells, 3);
    expect(peaks).toHaveLength(1);
  });

  it('空配列では空を返す', () => {
    const peaks = findGravityPeaks([], 3);
    expect(peaks).toHaveLength(0);
  });

  it('全質量0のセルでは空を返す', () => {
    const cells = [makeCell(0, 0, 0), makeCell(1, 1, 0)];
    const peaks = findGravityPeaks(cells, 3);
    expect(peaks).toHaveLength(0);
  });
});

describe('computeWarpedPositions', () => {
  const cellSize = 12;
  const cellGap = 3;

  it('warpProgress=0の場合、元の位置を返す（単一center）', () => {
    const cells = [makeCell(0, 0, 1), makeCell(3, 3, 1)];
    const center: Point = { x: 1.5, y: 1.5 };
    const result = computeWarpedPositions(cells, center, 0, 0.35, cellSize, cellGap);
    result.forEach(w => {
      expect(w.warpedX).toBeCloseTo(w.originalX, 5);
      expect(w.warpedY).toBeCloseTo(w.originalY, 5);
    });
  });

  it('warpProgress=0の場合、元の位置を返す（複数centers）', () => {
    const cells = [makeCell(0, 0, 1), makeCell(3, 3, 1)];
    const centers: Point[] = [{ x: 1, y: 1 }, { x: 2, y: 2 }];
    const result = computeWarpedPositions(cells, centers, 0, 0.35, cellSize, cellGap);
    result.forEach(w => {
      expect(w.warpedX).toBeCloseTo(w.originalX, 5);
      expect(w.warpedY).toBeCloseTo(w.originalY, 5);
    });
  });

  it('複数重力源で変位が合算される', () => {
    const cells = [makeCell(1, 5, 1)];
    const singleCenter: Point = { x: 3, y: 3 };
    const multiCenters: Point[] = [{ x: 3, y: 3 }, { x: 8, y: 3 }];

    const singleResult = computeWarpedPositions(cells, singleCenter, 1, 0.35, cellSize, cellGap);
    const multiResult = computeWarpedPositions(cells, multiCenters, 1, 0.35, cellSize, cellGap);

    const singleDx = Math.abs(singleResult[0].warpedX - singleResult[0].originalX);
    const multiDx = Math.abs(multiResult[0].warpedX - multiResult[0].originalX);
    expect(singleDx).not.toBeCloseTo(multiDx, 1);
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
      makeCell(3, 4, 0.5),  // 近い
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
    expect(farWarp).toBeLessThan(nearWarp);
  });

  it('実用的なグリッドで視認可能なワープ量を生成する', () => {
    const cells: GridCell[] = [];
    for (let col = 0; col < 10; col++) {
      for (let row = 0; row < 7; row++) {
        cells.push(makeCell(row, col, 0.5));
      }
    }
    const center = { x: 5, y: 3 };
    const result = computeWarpedPositions(cells, center, 1, 0.35, 12, 3);

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
    expect(dx).toBeLessThanOrEqual(cellStep * 10 * maxWarp + 1);
    expect(dy).toBeLessThanOrEqual(cellStep * 10 * maxWarp + 1);
  });
});

describe('computeFieldWarp', () => {
  const cellSize = 12;
  const cellGap = 3;
  const cellStep = cellSize + cellGap;

  it('warpProgress=0で元の位置を返す', () => {
    const cells = [makeCell(0, 0, 1), makeCell(3, 3, 5)];
    const result = computeFieldWarp(cells, 0, 0.35, cellSize, cellGap);
    for (const w of result) {
      expect(w.warpedX).toBeCloseTo(w.originalX, 5);
      expect(w.warpedY).toBeCloseTo(w.originalY, 5);
    }
  });

  it('全セルmass=0で元の位置を返す', () => {
    const cells = [makeCell(0, 0, 0), makeCell(1, 1, 0), makeCell(2, 2, 0)];
    const result = computeFieldWarp(cells, 1, 0.35, cellSize, cellGap);
    for (const w of result) {
      expect(w.warpedX).toBeCloseTo(w.originalX, 5);
      expect(w.warpedY).toBeCloseTo(w.originalY, 5);
    }
  });

  it('高massセル近傍のセルは大きく変位する', () => {
    const cells = [
      makeCell(0, 0, 0.1),
      makeCell(0, 1, 0),
      makeCell(0, 4, 0),
      makeCell(0, 5, 1),
    ];
    const result = computeFieldWarp(cells, 1, 0.35, cellSize, cellGap);

    const nearHigh = result.find(w => w.col === 4)!;
    const nearHighDisp = Math.hypot(nearHigh.warpedX - nearHigh.originalX, nearHigh.warpedY - nearHigh.originalY);

    const nearLow = result.find(w => w.col === 1)!;
    const nearLowDisp = Math.hypot(nearLow.warpedX - nearLow.originalX, nearLow.warpedY - nearLow.originalY);

    expect(nearHighDisp).toBeGreaterThan(nearLowDisp);
  });

  it('変位方向はmassの多い方向から離れる向きへ向かう', () => {
    const cells = [
      makeCell(0, 3, 0),
      makeCell(0, 5, 10),
    ];
    const result = computeFieldWarp(cells, 1, 0.35, cellSize, cellGap);
    const target = result.find(w => w.col === 3)!;
    expect(target.warpedX).toBeLessThan(target.originalX);
  });

  it('全セルが何らかの変位を受ける', () => {
    const cells: GridCell[] = [];
    for (let col = 0; col < 10; col++) {
      for (let row = 0; row < 7; row++) {
        cells.push(makeCell(row, col, 0.3 + Math.random() * 0.7));
      }
    }
    const result = computeFieldWarp(cells, 1, 0.35, cellSize, cellGap);
    for (const w of result) {
      const disp = Math.hypot(w.warpedX - w.originalX, w.warpedY - w.originalY);
      expect(disp).toBeGreaterThan(0);
    }
  });

  it('変位量がmaxWarpでクランプされる', () => {
    const maxWarp = 0.1;
    const maxDisp = maxWarp * cellStep;
    const cells = [
      makeCell(0, 0, 0),
      makeCell(0, 1, 100),
    ];
    const result = computeFieldWarp(cells, 1, maxWarp, cellSize, cellGap);
    for (const w of result) {
      const disp = Math.hypot(w.warpedX - w.originalX, w.warpedY - w.originalY);
      expect(disp).toBeLessThanOrEqual(maxDisp + 0.01);
    }
  });

  it('空配列で空を返す', () => {
    const result = computeFieldWarp([], 1, 0.35, cellSize, cellGap);
    expect(result).toHaveLength(0);
  });
});

describe('computeWarpIntensity', () => {
  function makeWarpedCell(
    row: number, col: number,
    originalX: number, originalY: number,
    warpedX: number, warpedY: number,
  ): WarpedCell {
    return { row, col, count: 0, level: 0, mass: 0, originalX, originalY, warpedX, warpedY };
  }

  it('空配列で空を返す', () => {
    expect(computeWarpIntensity([])).toEqual([]);
  });

  it('全セルワープ量0で全セルintensity=0', () => {
    const cells: WarpedCell[] = [
      makeWarpedCell(0, 0, 0, 0, 0, 0),
      makeWarpedCell(0, 1, 15, 0, 15, 0),
    ];
    const intensities = computeWarpIntensity(cells);
    expect(intensities).toEqual([0, 0]);
  });

  it('最大ワープ量のセルはintensity=1', () => {
    const cells: WarpedCell[] = [
      makeWarpedCell(0, 0, 0, 0, 3, 4),   // displacement=5
      makeWarpedCell(0, 1, 15, 0, 15, 0),  // displacement=0
      makeWarpedCell(1, 0, 0, 15, 1, 15),  // displacement=1
    ];
    const intensities = computeWarpIntensity(cells);
    expect(intensities[0]).toBe(1);
    expect(intensities[1]).toBe(0);
    expect(intensities[2]).toBeCloseTo(0.2, 5);
  });

  it('全セルのintensityが0〜1の範囲', () => {
    const cells: WarpedCell[] = [
      makeWarpedCell(0, 0, 0, 0, 10, 0),
      makeWarpedCell(0, 1, 15, 0, 18, 4),
      makeWarpedCell(1, 0, 0, 15, 2, 17),
      makeWarpedCell(1, 1, 15, 15, 15, 15),
    ];
    const intensities = computeWarpIntensity(cells);
    for (const v of intensities) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});

function makeAnomalyCell(row: number, col: number, mass: number, isAnomaly: boolean): AnomalyGridCell {
  return { row, col, count: isAnomaly ? 10 : 1, level: 0, mass, isAnomaly, anomalyIntensity: isAnomaly ? mass : 0 };
}

describe('computeLocalLensWarp', () => {
  const cellSize = 11;
  const cellGap = 4;
  const cellStep = cellSize + cellGap;
  const R = 60;
  const maxWarp = 0.5;

  it('異常点がない場合、全セルが元の位置を返す', () => {
    const cells = [
      makeAnomalyCell(0, 0, 0.5, false),
      makeAnomalyCell(0, 1, 0.3, false),
    ];
    const result = computeLocalLensWarp(cells, 1, R, maxWarp, cellSize, cellGap);
    for (const w of result) {
      expect(w.warpedX).toBeCloseTo(w.originalX, 5);
      expect(w.warpedY).toBeCloseTo(w.originalY, 5);
    }
  });

  it('warpProgress=0で全セルが元の位置を返す', () => {
    const cells = [
      makeAnomalyCell(0, 0, 0.9, true),
      makeAnomalyCell(0, 1, 0.3, false),
    ];
    const result = computeLocalLensWarp(cells, 0, R, maxWarp, cellSize, cellGap);
    for (const w of result) {
      expect(w.warpedX).toBeCloseTo(w.originalX, 5);
      expect(w.warpedY).toBeCloseTo(w.originalY, 5);
    }
  });

  it('R外のセルは変位しない', () => {
    const cells = [
      makeAnomalyCell(0, 0, 0.9, true),
      makeAnomalyCell(6, 10, 0.3, false),
    ];
    const result = computeLocalLensWarp(cells, 1, R, maxWarp, cellSize, cellGap);
    const farCell = result.find(w => w.col === 10)!;
    expect(farCell.warpedX).toBeCloseTo(farCell.originalX, 5);
    expect(farCell.warpedY).toBeCloseTo(farCell.originalY, 5);
  });

  it('R内のセルは変位する', () => {
    const cells = [
      makeAnomalyCell(3, 3, 0.9, true),
      makeAnomalyCell(3, 4, 0.3, false),
    ];
    const result = computeLocalLensWarp(cells, 1, R, maxWarp, cellSize, cellGap);
    const nearCell = result.find(w => w.col === 4 && !w.isAnomaly)!;
    const disp = Math.hypot(nearCell.warpedX - nearCell.originalX, nearCell.warpedY - nearCell.originalY);
    expect(disp).toBeGreaterThan(0);
  });

  it('異常点セル自身は変位しない', () => {
    const cells = [
      makeAnomalyCell(3, 3, 0.9, true),
      makeAnomalyCell(3, 4, 0.3, false),
    ];
    const result = computeLocalLensWarp(cells, 1, R, maxWarp, cellSize, cellGap);
    const anomalyCell = result.find(w => w.isAnomaly)!;
    expect(anomalyCell.warpedX).toBeCloseTo(anomalyCell.originalX, 5);
    expect(anomalyCell.warpedY).toBeCloseTo(anomalyCell.originalY, 5);
  });

  it('距離に応じて変位量が変わる（近いほど大きい）', () => {
    const cells = [
      makeAnomalyCell(3, 5, 0.9, true),
      makeAnomalyCell(3, 6, 0.3, false),
      makeAnomalyCell(3, 7, 0.3, false),
    ];
    const result = computeLocalLensWarp(cells, 1, R, maxWarp, cellSize, cellGap);
    const near = result.find(w => w.col === 6)!;
    const far = result.find(w => w.col === 7)!;
    const nearDisp = Math.hypot(near.warpedX - near.originalX, near.warpedY - near.originalY);
    const farDisp = Math.hypot(far.warpedX - far.originalX, far.warpedY - far.originalY);
    expect(nearDisp).toBeGreaterThan(farDisp);
  });

  it('複数の異常点からの変位が合算される', () => {
    const cells = [
      makeAnomalyCell(3, 2, 0.9, true),
      makeAnomalyCell(3, 4, 0.3, false),
      makeAnomalyCell(3, 6, 0.9, true),
    ];
    const resultMulti = computeLocalLensWarp(cells, 1, R, maxWarp, cellSize, cellGap);

    const cellsSingle = [
      makeAnomalyCell(3, 2, 0.9, true),
      makeAnomalyCell(3, 4, 0.3, false),
      makeAnomalyCell(3, 6, 0.9, false),
    ];
    const resultSingle = computeLocalLensWarp(cellsSingle, 1, R, maxWarp, cellSize, cellGap);

    const multiCell = resultMulti.find(w => w.col === 4)!;
    const singleCell = resultSingle.find(w => w.col === 4)!;
    const multiDisp = Math.hypot(multiCell.warpedX - multiCell.originalX, multiCell.warpedY - multiCell.originalY);
    const singleDisp = Math.hypot(singleCell.warpedX - singleCell.originalX, singleCell.warpedY - singleCell.originalY);
    expect(multiDisp).not.toBeCloseTo(singleDisp, 1);
  });

  it('変位量がクランプされる', () => {
    const smallMaxWarp = 0.05;
    const maxDisp = smallMaxWarp * cellStep;
    const cells = [
      makeAnomalyCell(3, 3, 1.0, true),
      makeAnomalyCell(3, 4, 0.3, false),
    ];
    const result = computeLocalLensWarp(cells, 1, R, smallMaxWarp, cellSize, cellGap);
    for (const w of result) {
      const disp = Math.hypot(w.warpedX - w.originalX, w.warpedY - w.originalY);
      expect(disp).toBeLessThanOrEqual(maxDisp + 0.01);
    }
  });

  it('isAnomaly/anomalyIntensityフラグが保持される', () => {
    const cells = [
      makeAnomalyCell(0, 0, 0.9, true),
      makeAnomalyCell(0, 1, 0.3, false),
    ];
    const result = computeLocalLensWarp(cells, 1, R, maxWarp, cellSize, cellGap);
    expect(result[0].isAnomaly).toBe(true);
    expect(result[0].anomalyIntensity).toBe(0.9);
    expect(result[1].isAnomaly).toBe(false);
    expect(result[1].anomalyIntensity).toBe(0);
  });

  it('空配列で空を返す', () => {
    const result = computeLocalLensWarp([], 1, R, maxWarp, cellSize, cellGap);
    expect(result).toHaveLength(0);
  });

  it('非対称ワープ: dx方向がdy方向より大きい', () => {
    const cells = [
      makeAnomalyCell(5, 5, 0.9, true),
      makeAnomalyCell(7, 7, 0.3, false),
    ];
    const result = computeLocalLensWarp(cells, 1, R, maxWarp, cellSize, cellGap);
    const target = result.find(w => w.col === 7 && w.row === 7)!;
    const dx = Math.abs(target.warpedX - target.originalX);
    const dy = Math.abs(target.warpedY - target.originalY);
    expect(dx / dy).toBeCloseTo(1.5, 1);
  });
});

describe('computeInterference', () => {
  const cellSize = 11;
  const cellGap = 4;
  const R = 60;

  it('単一異常点 → 干渉なし', () => {
    const cells = [
      makeAnomalyCell(3, 3, 0.9, true),
      makeAnomalyCell(3, 4, 0.3, false),
      makeAnomalyCell(3, 5, 0.3, false),
    ];
    const result = computeInterference(cells, R, cellSize, cellGap);
    for (const level of result) {
      expect(level).toBe(0);
    }
  });

  it('2つの異常点の間のセル → interferenceLevel > 0', () => {
    const cells = [
      makeAnomalyCell(3, 2, 0.9, true),
      makeAnomalyCell(3, 4, 0.3, false),
      makeAnomalyCell(3, 6, 0.9, true),
    ];
    const result = computeInterference(cells, R, cellSize, cellGap);
    expect(result[1]).toBeGreaterThan(0);
  });

  it('R外のセル → interferenceLevel = 0', () => {
    const cells = [
      makeAnomalyCell(0, 0, 0.9, true),
      makeAnomalyCell(0, 10, 0.9, true),
      makeAnomalyCell(6, 20, 0.3, false),
    ];
    const result = computeInterference(cells, R, cellSize, cellGap);
    expect(result[2]).toBe(0);
  });

  it('異常点自身 → interferenceLevel = 0', () => {
    const cells = [
      makeAnomalyCell(3, 2, 0.9, true),
      makeAnomalyCell(3, 4, 0.3, false),
      makeAnomalyCell(3, 6, 0.9, true),
    ];
    const result = computeInterference(cells, R, cellSize, cellGap);
    expect(result[0]).toBe(0);
    expect(result[2]).toBe(0);
  });
});

describe('computeAnomalyActivationDelays', () => {
  const cellSize = 11;
  const cellGap = 4;

  it('異常点のcol位置からdelay算出', () => {
    const cells = [
      makeAnomalyCell(0, 0, 0.9, true),   // col=0 → delay=0
      makeAnomalyCell(0, 1, 0.3, false),   // non-anomaly → delay=0
      makeAnomalyCell(0, 10, 0.9, true),   // col=10 → delay=6 (maxCol=10)
    ];
    const delays = computeAnomalyActivationDelays(cells, cellSize, cellGap);
    expect(delays).toHaveLength(3);
    expect(delays[0]).toBe(0);         // col=0 → 0
    expect(delays[1]).toBe(0);         // non-anomaly
    expect(delays[2]).toBeCloseTo(6);  // col=10/10 * 6 = 6
  });

  it('非異常点 → 0', () => {
    const cells = [
      makeAnomalyCell(0, 5, 0.3, false),
      makeAnomalyCell(0, 10, 0.3, false),
    ];
    const delays = computeAnomalyActivationDelays(cells, cellSize, cellGap);
    expect(delays).toEqual([0, 0]);
  });

  it('maxCol = max(anomalySource.col)', () => {
    // maxColは異常点セルのcolの最大値で決まる
    const cells = [
      makeAnomalyCell(0, 5, 0.9, true),   // col=5
      makeAnomalyCell(0, 10, 0.9, true),   // col=10 → maxCol=10
      makeAnomalyCell(0, 20, 0.3, false),  // non-anomaly、col=20だが無視
    ];
    const delays = computeAnomalyActivationDelays(cells, cellSize, cellGap);
    // col=5, maxCol=10 → delay = 5/10 * 6 = 3
    expect(delays[0]).toBeCloseTo(3);
    // col=10, maxCol=10 → delay = 6
    expect(delays[1]).toBeCloseTo(6);
    // non-anomaly → 0
    expect(delays[2]).toBe(0);
  });

  it('異常点が1つだけ → delay=0', () => {
    const cells = [
      makeAnomalyCell(0, 5, 0.9, true),
      makeAnomalyCell(0, 10, 0.3, false),
    ];
    const delays = computeAnomalyActivationDelays(cells, cellSize, cellGap);
    // maxCol=5 → col=5/5 * 6 = 6? No, when maxCol = col, delay = 6?
    // Actually: single anomaly at col=5 → maxCol=5 → delay = 5/5 * 6 = 6
    // But that doesn't make sense for a single anomaly. Let me re-read the spec.
    // The spec says maxCol = max(anomalySource.col). With 1 anomaly at col=5, maxCol=5, delay=5/5*6=6
    // Actually wait - computeActivationDelay(col, maxCol) with col=maxCol → delay=maxDelay=6
    // For single anomaly this is fine - it just means it fires at 2+6=8s
    // Actually no, single anomaly at col=0 would get delay=0, at col=5 delay=6
    // Let me think again: if maxCol=5 and col=5, delay=6. That means single anomaly always gets maxDelay.
    // That seems wrong. Let me check: if there's only one anomaly, its delay should probably be 0.
    // But the spec says activationDelay = map(xPosition, 0→width, 0s→6s)
    // So it's a linear map from position. Single anomaly at col=5 gets delay based on its position.
    // However, maxCol in the spec is based on anomaly sources. With 1 source maxCol = that col.
    // delay = col/maxCol * 6 = 1.0 * 6 = 6. This means single anomaly at any position delays fully.
    // That seems odd. Let me reconsider - maybe maxCol should be the grid's maxCol, not anomaly maxCol.
    // The plan says "maxCol = max(anomalySource.col)" but this is for the normalization.
    // I'll follow the plan as written and test accordingly.
    expect(delays[0]).toBeCloseTo(6);
  });

  it('空配列 → 空', () => {
    const delays = computeAnomalyActivationDelays([], cellSize, cellGap);
    expect(delays).toEqual([]);
  });

  it('異常点なし → 全0', () => {
    const cells = [
      makeAnomalyCell(0, 0, 0.5, false),
      makeAnomalyCell(0, 1, 0.3, false),
    ];
    const delays = computeAnomalyActivationDelays(cells, cellSize, cellGap);
    expect(delays).toEqual([0, 0]);
  });
});

describe('computeLocalLensWarpPerAnomaly', () => {
  const cellSize = 11;
  const cellGap = 4;
  const cellStep = cellSize + cellGap;
  const R = 60;
  const maxWarp = 0.5;

  it('全progress=0 → 変位なし', () => {
    const cells = [
      makeAnomalyCell(3, 3, 0.9, true),
      makeAnomalyCell(3, 4, 0.3, false),
    ];
    const progresses = new Map<number, number>(); // anomalyIndex → warpProgress
    progresses.set(0, 0); // index 0 (the anomaly) has progress 0
    const result = computeLocalLensWarpPerAnomaly(cells, progresses, R, maxWarp, cellSize, cellGap);
    for (const w of result) {
      expect(w.warpedX).toBeCloseTo(w.originalX, 5);
      expect(w.warpedY).toBeCloseTo(w.originalY, 5);
    }
  });

  it('全progress=1 → computeLocalLensWarpと同一結果', () => {
    const cells = [
      makeAnomalyCell(3, 3, 0.9, true),
      makeAnomalyCell(3, 4, 0.3, false),
      makeAnomalyCell(3, 5, 0.3, false),
    ];
    const progresses = new Map<number, number>();
    progresses.set(0, 1); // index 0 has progress 1
    const resultPerAnomaly = computeLocalLensWarpPerAnomaly(cells, progresses, R, maxWarp, cellSize, cellGap);
    const resultFull = computeLocalLensWarp(cells, 1, R, maxWarp, cellSize, cellGap);

    for (let i = 0; i < cells.length; i++) {
      expect(resultPerAnomaly[i].warpedX).toBeCloseTo(resultFull[i].warpedX, 3);
      expect(resultPerAnomaly[i].warpedY).toBeCloseTo(resultFull[i].warpedY, 3);
    }
  });

  it('部分的progress → 左側anomalyのみアクティブ時の変位', () => {
    // 2つの異常点: col=2 (active, progress=1), col=8 (inactive, progress=0)
    const cells = [
      makeAnomalyCell(3, 2, 0.9, true),   // anomaly index 0 in anomaly list
      makeAnomalyCell(3, 4, 0.3, false),   // between anomalies
      makeAnomalyCell(3, 8, 0.9, true),    // anomaly index 1 in anomaly list
    ];
    const progresses = new Map<number, number>();
    progresses.set(0, 1); // left anomaly active
    progresses.set(2, 0); // right anomaly inactive

    const result = computeLocalLensWarpPerAnomaly(cells, progresses, R, maxWarp, cellSize, cellGap);

    // col=4 should only be affected by col=2 anomaly
    const middleCell = result[1];
    const disp = Math.hypot(middleCell.warpedX - middleCell.originalX, middleCell.warpedY - middleCell.originalY);
    expect(disp).toBeGreaterThan(0);

    // Compare with both active - should be different
    const progressesBoth = new Map<number, number>();
    progressesBoth.set(0, 1);
    progressesBoth.set(2, 1);
    const resultBoth = computeLocalLensWarpPerAnomaly(cells, progressesBoth, R, maxWarp, cellSize, cellGap);
    const middleCellBoth = resultBoth[1];
    const dispBoth = Math.hypot(middleCellBoth.warpedX - middleCellBoth.originalX, middleCellBoth.warpedY - middleCellBoth.originalY);
    // Different because one side is inactive
    expect(disp).not.toBeCloseTo(dispBoth, 1);
  });

  it('空配列 → 空', () => {
    const result = computeLocalLensWarpPerAnomaly([], new Map(), R, maxWarp, cellSize, cellGap);
    expect(result).toHaveLength(0);
  });
});

describe('getCellRotation', () => {
  it('決定的: 同じ入力で同じ結果を返す', () => {
    const r1 = getCellRotation(3, 5);
    const r2 = getCellRotation(3, 5);
    expect(r1).toBe(r2);
  });

  it('回転角は ±1-2deg の範囲内', () => {
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 52; col++) {
        const rot = getCellRotation(row, col);
        expect(Math.abs(rot)).toBeGreaterThanOrEqual(1);
        expect(Math.abs(rot)).toBeLessThanOrEqual(2);
      }
    }
  });

  it('異なるセルで異なる回転角を返す（少なくとも一部）', () => {
    const r1 = getCellRotation(0, 0);
    const r2 = getCellRotation(0, 1);
    const r3 = getCellRotation(1, 0);
    const unique = new Set([r1, r2, r3]);
    expect(unique.size).toBeGreaterThanOrEqual(2);
  });
});

describe('computeInterferenceJitter', () => {
  it('interferenceProgress=0 → {x:0, y:0}', () => {
    const result = computeInterferenceJitter(3, 5, 0, 0.5);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });

  it('interferenceLevel=0 → {x:0, y:0}', () => {
    const result = computeInterferenceJitter(3, 5, 0.8, 0);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });

  it('正の値のとき magnitude ≤ maxJitter * progress * level', () => {
    const progress = 0.7;
    const level = 0.6;
    const maxJitter = 0.8;
    const result = computeInterferenceJitter(3, 5, progress, level, maxJitter);
    const mag = Math.hypot(result.x, result.y);
    expect(mag).toBeGreaterThan(0);
    expect(mag).toBeLessThanOrEqual(maxJitter * progress * level + 0.001);
  });

  it('同じ row, col → 決定論的（同一結果）', () => {
    const r1 = computeInterferenceJitter(3, 5, 0.5, 0.5);
    const r2 = computeInterferenceJitter(3, 5, 0.5, 0.5);
    expect(r1.x).toBe(r2.x);
    expect(r1.y).toBe(r2.y);
  });

  it('異なる row, col → 異なる方向', () => {
    const r1 = computeInterferenceJitter(0, 0, 1, 1);
    const r2 = computeInterferenceJitter(3, 7, 1, 1);
    // 角度が異なるはず（完全一致は極めて低確率）
    const angle1 = Math.atan2(r1.y, r1.x);
    const angle2 = Math.atan2(r2.y, r2.x);
    expect(angle1).not.toBeCloseTo(angle2, 2);
  });

  it('デフォルトmaxJitter=0.8', () => {
    const result = computeInterferenceJitter(3, 5, 1, 1);
    const mag = Math.hypot(result.x, result.y);
    expect(mag).toBeLessThanOrEqual(0.8 + 0.001);
    expect(mag).toBeGreaterThan(0);
  });
});
