import { describe, it, expect } from 'vitest';
import { getWarpProgress, getBrightnessProgress, cubicBezierEase } from '../src/animation';

describe('getWarpProgress (5フェーズ改訂版)', () => {
  const duration = 4;

  // Phase 1: 静止 (0-1s, ratio 0-0.25) → 0
  it('Phase 1 (0〜1.0秒): 静止状態 → progress=0', () => {
    expect(getWarpProgress(0, duration)).toBe(0);
    expect(getWarpProgress(0.5, duration)).toBe(0);
    expect(getWarpProgress(0.99, duration)).toBe(0);
  });

  // Phase 2: 明度のみ (1.0-1.3s, ratio 0.25-0.325) → warp不動=0
  it('Phase 2 (1.0〜1.3秒): 明度フェーズ → warp=0', () => {
    expect(getWarpProgress(1.0, duration)).toBe(0);
    expect(getWarpProgress(1.15, duration)).toBe(0);
    expect(getWarpProgress(1.29, duration)).toBe(0);
  });

  // Phase 3: レンズ (1.3-2.5s, ratio 0.325-0.625) → 0→1
  it('Phase 3 (1.3〜2.5秒): レンズ発生 → 0→1', () => {
    const start = getWarpProgress(1.3, duration);
    const mid = getWarpProgress(1.9, duration);
    const end = getWarpProgress(2.49, duration);
    expect(start).toBeCloseTo(0, 1);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
    expect(end).toBeCloseTo(1, 0);
  });

  // Phase 4: 干渉 (2.5-3.2s, ratio 0.625-0.80) → 1
  it('Phase 4 (2.5〜3.2秒): 干渉ホールド → progress=1', () => {
    expect(getWarpProgress(2.5, duration)).toBeCloseTo(1, 1);
    expect(getWarpProgress(2.8, duration)).toBeCloseTo(1, 1);
    expect(getWarpProgress(3.19, duration)).toBeCloseTo(1, 1);
  });

  // Phase 5: 復元 (3.2-4.0s, ratio 0.80-1.00) → 1→0
  it('Phase 5 (3.2〜4.0秒): 復元 → 1→0', () => {
    const start = getWarpProgress(3.21, duration);
    const mid = getWarpProgress(3.6, duration);
    const end = getWarpProgress(3.99, duration);
    expect(start).toBeLessThan(1);
    expect(start).toBeGreaterThan(0);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
    expect(end).toBeCloseTo(0, 0);
  });

  it('ループ: duration以上の値はmodで処理', () => {
    expect(getWarpProgress(4.0, duration)).toBeCloseTo(getWarpProgress(0, duration), 5);
    expect(getWarpProgress(5.3, duration)).toBeCloseTo(getWarpProgress(1.3, duration), 5);
  });

  it('フェーズ境界で連続的である', () => {
    // Phase 2→3 境界 (ratio=0.325)
    const p2end = getWarpProgress(1.299, duration);
    const p3start = getWarpProgress(1.301, duration);
    expect(Math.abs(p3start - p2end)).toBeLessThan(0.05);

    // Phase 3→4 境界 (ratio=0.625)
    const p3end = getWarpProgress(2.499, duration);
    const p4start = getWarpProgress(2.501, duration);
    expect(Math.abs(p4start - p3end)).toBeLessThan(0.05);

    // Phase 4→5 境界 (ratio=0.80)
    const p4end = getWarpProgress(3.199, duration);
    const p5start = getWarpProgress(3.201, duration);
    expect(Math.abs(p5start - p4end)).toBeLessThan(0.05);
  });
});

describe('getBrightnessProgress', () => {
  const duration = 4;

  it('Phase 1 (0〜1.0秒): brightness=0', () => {
    expect(getBrightnessProgress(0, duration)).toBe(0);
    expect(getBrightnessProgress(0.5, duration)).toBe(0);
    expect(getBrightnessProgress(0.99, duration)).toBe(0);
  });

  it('Phase 2 (1.0〜1.3秒): 0→1 (eased)', () => {
    const start = getBrightnessProgress(1.0, duration);
    const mid = getBrightnessProgress(1.15, duration);
    const end = getBrightnessProgress(1.29, duration);
    expect(start).toBeCloseTo(0, 1);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
    expect(end).toBeCloseTo(1, 0);
  });

  it('Phase 3 (1.3〜2.5秒): brightness=1', () => {
    expect(getBrightnessProgress(1.3, duration)).toBeCloseTo(1, 1);
    expect(getBrightnessProgress(1.9, duration)).toBeCloseTo(1, 1);
    expect(getBrightnessProgress(2.49, duration)).toBeCloseTo(1, 1);
  });

  it('Phase 4 (2.5〜3.2秒): brightness=1', () => {
    expect(getBrightnessProgress(2.5, duration)).toBeCloseTo(1, 1);
    expect(getBrightnessProgress(2.8, duration)).toBeCloseTo(1, 1);
    expect(getBrightnessProgress(3.19, duration)).toBeCloseTo(1, 1);
  });

  it('Phase 5 (3.2〜4.0秒): 1→0 (eased)', () => {
    const start = getBrightnessProgress(3.21, duration);
    const mid = getBrightnessProgress(3.6, duration);
    const end = getBrightnessProgress(3.99, duration);
    expect(start).toBeLessThan(1);
    expect(start).toBeGreaterThan(0);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
    expect(end).toBeCloseTo(0, 0);
  });

  it('ループ: duration以上の値はmodで処理', () => {
    expect(getBrightnessProgress(4.0, duration)).toBeCloseTo(getBrightnessProgress(0, duration), 5);
    expect(getBrightnessProgress(5.15, duration)).toBeCloseTo(getBrightnessProgress(1.15, duration), 5);
  });

  it('フェーズ境界で連続的である', () => {
    // Phase 1→2 境界 (ratio=0.25)
    const p1end = getBrightnessProgress(0.999, duration);
    const p2start = getBrightnessProgress(1.001, duration);
    expect(Math.abs(p2start - p1end)).toBeLessThan(0.05);

    // Phase 2→3 境界 (ratio=0.325)
    const p2end = getBrightnessProgress(1.299, duration);
    const p3start = getBrightnessProgress(1.301, duration);
    expect(Math.abs(p3start - p2end)).toBeLessThan(0.05);

    // Phase 4→5 境界 (ratio=0.80)
    const p4end = getBrightnessProgress(3.199, duration);
    const p5start = getBrightnessProgress(3.201, duration);
    expect(Math.abs(p5start - p4end)).toBeLessThan(0.05);
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
