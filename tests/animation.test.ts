import { describe, it, expect } from 'vitest';
import { cubicBezierEase, computeActivationDelay, getAnomalyWarpProgress, getAnomalyBrightnessProgress, getInterferenceProgress } from '../src/animation';

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

describe('computeActivationDelay', () => {
  it('col=0 → delay=0', () => {
    expect(computeActivationDelay(0, 51)).toBe(0);
  });

  it('col=maxCol → delay=maxDelay(6)', () => {
    expect(computeActivationDelay(51, 51)).toBeCloseTo(6, 5);
  });

  it('中間col → 比例配分', () => {
    // col=25, maxCol=50 → delay = 25/50 * 6 = 3
    expect(computeActivationDelay(25, 50)).toBeCloseTo(3, 5);
  });

  it('maxCol=0 → delay=0', () => {
    expect(computeActivationDelay(0, 0)).toBe(0);
  });

  it('カスタムmaxDelay', () => {
    expect(computeActivationDelay(10, 20, 10)).toBeCloseTo(5, 5);
  });
});

describe('getAnomalyWarpProgress', () => {
  const duration = 14;

  // delay=0: fireTime=2, warpStart=2.5, warpRampEnd=4.5, restoreStart=11, restoreEnd=14
  describe('delay=0', () => {
    it('Phase 1 (0-2s): 静止 → 0', () => {
      expect(getAnomalyWarpProgress(0, duration, 0)).toBe(0);
      expect(getAnomalyWarpProgress(1, duration, 0)).toBe(0);
      expect(getAnomalyWarpProgress(1.99, duration, 0)).toBe(0);
    });

    it('fire直後 (2-2.5s): まだ0', () => {
      expect(getAnomalyWarpProgress(2.0, duration, 0)).toBe(0);
      expect(getAnomalyWarpProgress(2.4, duration, 0)).toBe(0);
    });

    it('warpRamp (2.5-4.5s): 0→1', () => {
      const start = getAnomalyWarpProgress(2.5, duration, 0);
      const mid = getAnomalyWarpProgress(3.5, duration, 0);
      const end = getAnomalyWarpProgress(4.49, duration, 0);
      expect(start).toBeCloseTo(0, 1);
      expect(mid).toBeGreaterThan(0);
      expect(mid).toBeLessThan(1);
      expect(end).toBeCloseTo(1, 0);
    });

    it('hold (4.5-11s): 1を維持', () => {
      expect(getAnomalyWarpProgress(4.5, duration, 0)).toBeCloseTo(1, 1);
      expect(getAnomalyWarpProgress(7, duration, 0)).toBeCloseTo(1, 1);
      expect(getAnomalyWarpProgress(10.9, duration, 0)).toBeCloseTo(1, 1);
    });

    it('restore (11-14s): 1→0', () => {
      const start = getAnomalyWarpProgress(11.1, duration, 0);
      const mid = getAnomalyWarpProgress(12.5, duration, 0);
      const end = getAnomalyWarpProgress(13.99, duration, 0);
      expect(start).toBeLessThan(1);
      expect(start).toBeGreaterThan(0);
      expect(mid).toBeGreaterThan(0);
      expect(mid).toBeLessThan(1);
      expect(end).toBeCloseTo(0, 0);
    });
  });

  // delay=3: fireTime=5, warpStart=5.5, warpRampEnd=7.5
  describe('delay=3', () => {
    it('5s以前: 0', () => {
      expect(getAnomalyWarpProgress(0, duration, 3)).toBe(0);
      expect(getAnomalyWarpProgress(4.9, duration, 3)).toBe(0);
    });

    it('5-5.5s: まだ0 (fire後0.5s待ち)', () => {
      expect(getAnomalyWarpProgress(5.0, duration, 3)).toBe(0);
      expect(getAnomalyWarpProgress(5.4, duration, 3)).toBe(0);
    });

    it('5.5-7.5s: 0→1', () => {
      const start = getAnomalyWarpProgress(5.5, duration, 3);
      const end = getAnomalyWarpProgress(7.49, duration, 3);
      expect(start).toBeCloseTo(0, 1);
      expect(end).toBeCloseTo(1, 0);
    });

    it('7.5-11s: 1を維持', () => {
      expect(getAnomalyWarpProgress(7.5, duration, 3)).toBeCloseTo(1, 1);
      expect(getAnomalyWarpProgress(10, duration, 3)).toBeCloseTo(1, 1);
    });

    it('11-14s: 1→0', () => {
      expect(getAnomalyWarpProgress(12.5, duration, 3)).toBeGreaterThan(0);
      expect(getAnomalyWarpProgress(12.5, duration, 3)).toBeLessThan(1);
    });
  });

  // delay=6: fireTime=8, warpStart=8.5, warpRampEnd=10.5
  describe('delay=6', () => {
    it('8s以前: 0', () => {
      expect(getAnomalyWarpProgress(0, duration, 6)).toBe(0);
      expect(getAnomalyWarpProgress(7.9, duration, 6)).toBe(0);
    });

    it('8.5-10.5s: 0→1', () => {
      const start = getAnomalyWarpProgress(8.5, duration, 6);
      const end = getAnomalyWarpProgress(10.49, duration, 6);
      expect(start).toBeCloseTo(0, 1);
      expect(end).toBeCloseTo(1, 0);
    });

    it('10.5s: max到達', () => {
      expect(getAnomalyWarpProgress(10.5, duration, 6)).toBeCloseTo(1, 1);
    });

    it('11-14s: 1→0 (hold時間0.5sのみ)', () => {
      // 10.5sでmax到達 → 11sから復元 → hold=0.5s
      expect(getAnomalyWarpProgress(11.0, duration, 6)).toBeCloseTo(1, 1);
      expect(getAnomalyWarpProgress(13.99, duration, 6)).toBeCloseTo(0, 0);
    });
  });

  it('ループ: duration以上の値はmodで処理', () => {
    expect(getAnomalyWarpProgress(14.0, duration, 0)).toBeCloseTo(getAnomalyWarpProgress(0, duration, 0), 5);
    expect(getAnomalyWarpProgress(17.5, duration, 0)).toBeCloseTo(getAnomalyWarpProgress(3.5, duration, 0), 5);
  });

  it('フェーズ境界で連続的', () => {
    const eps = 0.001;
    // warpStart boundary (2.5s for delay=0)
    const before = getAnomalyWarpProgress(2.5 - eps, duration, 0);
    const after = getAnomalyWarpProgress(2.5 + eps, duration, 0);
    expect(Math.abs(after - before)).toBeLessThan(0.05);

    // restore boundary (11s)
    const rBefore = getAnomalyWarpProgress(11 - eps, duration, 0);
    const rAfter = getAnomalyWarpProgress(11 + eps, duration, 0);
    expect(Math.abs(rAfter - rBefore)).toBeLessThan(0.05);
  });
});

describe('getAnomalyBrightnessProgress', () => {
  const duration = 14;

  // delay=0: brightStart=2, brightEnd=3.2, restoreStart=11, restoreEnd=14
  describe('delay=0', () => {
    it('Phase 1 (0-2s): 0', () => {
      expect(getAnomalyBrightnessProgress(0, duration, 0)).toBe(0);
      expect(getAnomalyBrightnessProgress(1.99, duration, 0)).toBe(0);
    });

    it('brightRamp (2-3.2s): 0→1', () => {
      const start = getAnomalyBrightnessProgress(2.0, duration, 0);
      const mid = getAnomalyBrightnessProgress(2.6, duration, 0);
      const end = getAnomalyBrightnessProgress(3.19, duration, 0);
      expect(start).toBeCloseTo(0, 1);
      expect(mid).toBeGreaterThan(0);
      expect(mid).toBeLessThan(1);
      expect(end).toBeCloseTo(1, 0);
    });

    it('hold (3.2-11s): 1', () => {
      expect(getAnomalyBrightnessProgress(3.2, duration, 0)).toBeCloseTo(1, 1);
      expect(getAnomalyBrightnessProgress(7, duration, 0)).toBeCloseTo(1, 1);
      expect(getAnomalyBrightnessProgress(10.9, duration, 0)).toBeCloseTo(1, 1);
    });

    it('restore (11-14s): 1→0', () => {
      const start = getAnomalyBrightnessProgress(11.1, duration, 0);
      const end = getAnomalyBrightnessProgress(13.99, duration, 0);
      expect(start).toBeLessThan(1);
      expect(start).toBeGreaterThan(0);
      expect(end).toBeCloseTo(0, 0);
    });
  });

  // delay=3: brightStart=5, brightEnd=6.2
  describe('delay=3', () => {
    it('5s以前: 0', () => {
      expect(getAnomalyBrightnessProgress(4.9, duration, 3)).toBe(0);
    });

    it('5-6.2s: 0→1', () => {
      const start = getAnomalyBrightnessProgress(5.0, duration, 3);
      const end = getAnomalyBrightnessProgress(6.19, duration, 3);
      expect(start).toBeCloseTo(0, 1);
      expect(end).toBeCloseTo(1, 0);
    });

    it('hold: 1', () => {
      expect(getAnomalyBrightnessProgress(7, duration, 3)).toBeCloseTo(1, 1);
    });
  });

  // delay=6: brightStart=8, brightEnd=9.2
  describe('delay=6', () => {
    it('8s以前: 0', () => {
      expect(getAnomalyBrightnessProgress(7.9, duration, 6)).toBe(0);
    });

    it('8-9.2s: 0→1', () => {
      const start = getAnomalyBrightnessProgress(8.0, duration, 6);
      const end = getAnomalyBrightnessProgress(9.19, duration, 6);
      expect(start).toBeCloseTo(0, 1);
      expect(end).toBeCloseTo(1, 0);
    });
  });

  it('ループ: duration以上の値はmodで処理', () => {
    expect(getAnomalyBrightnessProgress(14.0, duration, 0)).toBeCloseTo(getAnomalyBrightnessProgress(0, duration, 0), 5);
  });
});

describe('getInterferenceProgress (14sモデル)', () => {
  const duration = 14;

  it('0-8s: 0', () => {
    expect(getInterferenceProgress(0, duration)).toBe(0);
    expect(getInterferenceProgress(4, duration)).toBe(0);
    expect(getInterferenceProgress(7.99, duration)).toBe(0);
  });

  it('8-11s: sin パルス (0→peak→0)', () => {
    // ピーク at 9.5s (midpoint of 8-11)
    const mid = getInterferenceProgress(9.5, duration);
    expect(mid).toBeGreaterThan(0.9);

    const start = getInterferenceProgress(8.1, duration);
    expect(start).toBeGreaterThan(0);
    expect(start).toBeLessThan(mid);

    const end = getInterferenceProgress(10.9, duration);
    expect(end).toBeGreaterThan(0);
    expect(end).toBeLessThan(mid);
  });

  it('11-14s: 0', () => {
    expect(getInterferenceProgress(11, duration)).toBe(0);
    expect(getInterferenceProgress(12, duration)).toBe(0);
    expect(getInterferenceProgress(13.99, duration)).toBe(0);
  });

  it('ループ: duration以上の値はmodで処理', () => {
    expect(getInterferenceProgress(14.0, duration)).toBeCloseTo(getInterferenceProgress(0, duration), 5);
  });
});
