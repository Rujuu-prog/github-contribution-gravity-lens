import { describe, it, expect } from 'vitest';
import { computeGravityCenter, computeWarpedPositions, findGravityPeaks, computeFieldWarp, computeWarpIntensity, computeLocalLensWarp } from '../src/gravity';
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
    // col=3/row=3 と col=4/row=3 は距離1 → マージ
    expect(peaks).toHaveLength(2);
    expect(peaks[0]).toEqual({ x: 3, y: 3 }); // 最大mass
    expect(peaks[1]).toEqual({ x: 0, y: 0 }); // 遠い
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
    const cells = [makeCell(1, 5, 1)]; // 2つの重力源の間のセル
    const singleCenter: Point = { x: 3, y: 3 };
    const multiCenters: Point[] = [{ x: 3, y: 3 }, { x: 8, y: 3 }];

    const singleResult = computeWarpedPositions(cells, singleCenter, 1, 0.35, cellSize, cellGap);
    const multiResult = computeWarpedPositions(cells, multiCenters, 1, 0.35, cellSize, cellGap);

    // 複数重力源の場合、変位が異なることを検証
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
    // 高massセル(col=5)の隣接セル(col=4) vs 低massセル(col=0)の隣接セル(col=1)
    const cells = [
      makeCell(0, 0, 0.1),  // 低mass
      makeCell(0, 1, 0),    // 低mass隣接 → 弱い引力
      makeCell(0, 4, 0),    // 高mass隣接 → 強い引力
      makeCell(0, 5, 1),    // 高mass
    ];
    const result = computeFieldWarp(cells, 1, 0.35, cellSize, cellGap);

    // col=4のセル（高mass隣接）の変位
    const nearHigh = result.find(w => w.col === 4)!;
    const nearHighDisp = Math.hypot(nearHigh.warpedX - nearHigh.originalX, nearHigh.warpedY - nearHigh.originalY);

    // col=1のセル（低mass隣接）の変位
    const nearLow = result.find(w => w.col === 1)!;
    const nearLowDisp = Math.hypot(nearLow.warpedX - nearLow.originalX, nearLow.warpedY - nearLow.originalY);

    expect(nearHighDisp).toBeGreaterThan(nearLowDisp);
  });

  it('変位方向はmassの多い方向から離れる向きへ向かう', () => {
    // 重いセルがcol=5にある → col=3のセルは左(-x)へ押し出される
    const cells = [
      makeCell(0, 3, 0),   // 観察対象
      makeCell(0, 5, 10),  // 重いセル（右側）
    ];
    const result = computeFieldWarp(cells, 1, 0.35, cellSize, cellGap);
    const target = result.find(w => w.col === 3)!;
    // 斥力により左へ押されるので warpedX < originalX
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
    // 非常に重いセルの隣に軽いセルを置いて、クランプを発動させる
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
    expect(intensities[0]).toBe(1);   // 最大
    expect(intensities[1]).toBe(0);   // 変位なし
    expect(intensities[2]).toBeCloseTo(0.2, 5); // 1/5
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
  const R = 40;
  const maxWarp = 0.35;

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
    // 異常点: col=0, row=0 → cx = 5.5, cy = 5.5
    // 遠いセル: col=10, row=6 → cx = 155.5, cy = 95.5 → dist ≈ 167 > R=40
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
    // 異常点: col=3, row=3 → cx = 50.5, cy = 50.5
    // 近いセル: col=4, row=3 → cx = 65.5, cy = 50.5 → dist = 15 < R=40
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
    // 異常点: col=5, row=3
    // 近い: col=6, row=3 → dist = 15
    // 遠い: col=7, row=3 → dist = 30
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
    // 異常点2つの間にあるセル
    const cells = [
      makeAnomalyCell(3, 2, 0.9, true),
      makeAnomalyCell(3, 4, 0.3, false), // 中間のセル
      makeAnomalyCell(3, 6, 0.9, true),
    ];
    const resultMulti = computeLocalLensWarp(cells, 1, R, maxWarp, cellSize, cellGap);

    // 異常点1つだけの場合
    const cellsSingle = [
      makeAnomalyCell(3, 2, 0.9, true),
      makeAnomalyCell(3, 4, 0.3, false),
      makeAnomalyCell(3, 6, 0.9, false), // non-anomaly
    ];
    const resultSingle = computeLocalLensWarp(cellsSingle, 1, R, maxWarp, cellSize, cellGap);

    const multiCell = resultMulti.find(w => w.col === 4)!;
    const singleCell = resultSingle.find(w => w.col === 4)!;
    const multiDisp = Math.hypot(multiCell.warpedX - multiCell.originalX, multiCell.warpedY - multiCell.originalY);
    const singleDisp = Math.hypot(singleCell.warpedX - singleCell.originalX, singleCell.warpedY - singleCell.originalY);
    // 合算により異なる変位（必ずしも大きいとは限らない、方向が相殺する可能性）
    expect(multiDisp).not.toBeCloseTo(singleDisp, 1);
  });

  it('変位量がクランプされる', () => {
    const smallMaxWarp = 0.05;
    const maxDisp = smallMaxWarp * cellStep;
    const cells = [
      makeAnomalyCell(3, 3, 1.0, true),
      makeAnomalyCell(3, 4, 0.3, false), // 非常に近い
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
});
