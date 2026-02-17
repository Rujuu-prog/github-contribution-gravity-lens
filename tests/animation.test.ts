import { describe, it, expect } from 'vitest';
import { getWarpProgress, cubicBezierEase } from '../src/animation';

describe('getWarpProgress', () => {
  const duration = 4;

  it('Phase 1 (0〜1秒): 静止状態 → progress=0', () => {
    expect(getWarpProgress(0, duration)).toBe(0);
    expect(getWarpProgress(0.5, duration)).toBe(0);
    expect(getWarpProgress(0.99, duration)).toBe(0);
  });

  it('Phase 2 (1〜2秒): ease-in → 0から1へ', () => {
    const start = getWarpProgress(1.0, duration);
    const mid = getWarpProgress(1.5, duration);
    const end = getWarpProgress(1.99, duration);
    expect(start).toBeCloseTo(0, 1);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
    expect(end).toBeCloseTo(1, 0);
  });

  it('Phase 3 (2〜2.8秒): ホールド → progress=1', () => {
    expect(getWarpProgress(2.0, duration)).toBeCloseTo(1, 1);
    expect(getWarpProgress(2.4, duration)).toBeCloseTo(1, 1);
    expect(getWarpProgress(2.79, duration)).toBeCloseTo(1, 1);
  });

  it('Phase 4 (2.8〜4秒): ease-out → 1から0へ', () => {
    const start = getWarpProgress(2.81, duration);
    const mid = getWarpProgress(3.4, duration);
    const end = getWarpProgress(3.99, duration);
    expect(start).toBeLessThan(1);
    expect(start).toBeGreaterThan(0);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
    expect(end).toBeCloseTo(0, 0);
  });

  it('ループ: duration以上の値はmodで処理', () => {
    expect(getWarpProgress(4.0, duration)).toBeCloseTo(getWarpProgress(0, duration), 5);
    expect(getWarpProgress(5.5, duration)).toBeCloseTo(getWarpProgress(1.5, duration), 5);
  });
});

describe('cubicBezierEase', () => {
  it('t=0で0を返す', () => {
    expect(cubicBezierEase(0)).toBeCloseTo(0, 5);
  });

  it('t=1で1を返す', () => {
    expect(cubicBezierEase(1)).toBeCloseTo(1, 5);
  });

  it('単調増加する', () => {
    let prev = 0;
    for (let t = 0.1; t <= 1; t += 0.1) {
      const val = cubicBezierEase(t);
      expect(val).toBeGreaterThanOrEqual(prev);
      prev = val;
    }
  });

  it('中間値が0と1の間にある', () => {
    const mid = cubicBezierEase(0.5);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
  });
});
