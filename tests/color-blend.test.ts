import { describe, it, expect } from 'vitest';
import { hexToRgb, rgbToHex, blendColors, computeCellColor, computeAnomalyColor, rgbToHsl, hslToRgb, shiftHue, adjustBrightness } from '../src/color-blend';

describe('hexToRgb', () => {
  it('#ff0000 → [255, 0, 0]', () => {
    expect(hexToRgb('#ff0000')).toEqual([255, 0, 0]);
  });

  it('#00ff00 → [0, 255, 0]', () => {
    expect(hexToRgb('#00ff00')).toEqual([0, 255, 0]);
  });

  it('#0000ff → [0, 0, 255]', () => {
    expect(hexToRgb('#0000ff')).toEqual([0, 0, 255]);
  });

  it('#000000 → [0, 0, 0]', () => {
    expect(hexToRgb('#000000')).toEqual([0, 0, 0]);
  });

  it('#ffffff → [255, 255, 255]', () => {
    expect(hexToRgb('#ffffff')).toEqual([255, 255, 255]);
  });
});

describe('rgbToHex', () => {
  it('(255, 0, 0) → #ff0000', () => {
    expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
  });

  it('(0, 255, 0) → #00ff00', () => {
    expect(rgbToHex(0, 255, 0)).toBe('#00ff00');
  });

  it('(0, 0, 0) → #000000', () => {
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
  });

  it('(255, 255, 255) → #ffffff', () => {
    expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
  });
});

describe('blendColors', () => {
  it('ratio=0 で第1色を返す', () => {
    expect(blendColors('#ff0000', '#0000ff', 0)).toBe('#ff0000');
  });

  it('ratio=1 で第2色を返す', () => {
    expect(blendColors('#ff0000', '#0000ff', 1)).toBe('#0000ff');
  });

  it('ratio=0.5 で中間色を返す', () => {
    const result = blendColors('#000000', '#ffffff', 0.5);
    // 各チャネルが127か128 (丸め誤差)
    const rgb = hexToRgb(result);
    expect(rgb[0]).toBeGreaterThanOrEqual(127);
    expect(rgb[0]).toBeLessThanOrEqual(128);
    expect(rgb[1]).toBeGreaterThanOrEqual(127);
    expect(rgb[1]).toBeLessThanOrEqual(128);
  });

  it('同色同士では元の色を返す', () => {
    expect(blendColors('#abcdef', '#abcdef', 0.5)).toBe('#abcdef');
  });
});

describe('computeCellColor', () => {
  const baseColor = '#1f3b4d';
  const peakColor = '#a78bfa';

  it('warpProgress=0 で元の色を返す', () => {
    expect(computeCellColor(baseColor, peakColor, 0.8, 0, 0.6)).toBe(baseColor);
  });

  it('warpIntensity=0 で元の色を返す', () => {
    expect(computeCellColor(baseColor, peakColor, 0, 1, 0.6)).toBe(baseColor);
  });

  it('gradientIntensity=0 で元の色を返す', () => {
    expect(computeCellColor(baseColor, peakColor, 0.8, 1, 0)).toBe(baseColor);
  });

  it('全パラメータ最大でpeakColorに近い色を返す', () => {
    const result = computeCellColor(baseColor, peakColor, 1, 1, 1);
    expect(result).toBe(peakColor);
  });

  it('中間値でブレンド色を返す', () => {
    const result = computeCellColor(baseColor, peakColor, 0.5, 0.5, 1);
    // blendRatio = 0.5 * 0.5 * 1 = 0.25
    // 元の色でもpeakColorでもない中間色
    expect(result).not.toBe(baseColor);
    expect(result).not.toBe(peakColor);
  });
});

describe('computeAnomalyColor', () => {
  const base = '#1f3b4d';
  const accent = '#3ddcff';

  it('brightnessProgress=0 で元の色を返す', () => {
    expect(computeAnomalyColor(base, accent, 0)).toBe(base);
  });

  it('brightnessProgress=1, maxOpacity=0.15 でわずかにブレンドされる', () => {
    const result = computeAnomalyColor(base, accent, 1, 0.15);
    // blendRatio = 1 * 0.15 = 0.15
    expect(result).not.toBe(base);
    expect(result).not.toBe(accent);
  });

  it('maxOpacity=0 で元の色を返す', () => {
    expect(computeAnomalyColor(base, accent, 1, 0)).toBe(base);
  });

  it('maxOpacity=1, brightnessProgress=1 でaccentColorになる', () => {
    const result = computeAnomalyColor(base, accent, 1, 1);
    expect(result).toBe(accent);
  });

  it('デフォルトmaxOpacity=0.15で動作する', () => {
    const result = computeAnomalyColor(base, accent, 0.5);
    // blendRatio = 0.5 * 0.15 = 0.075
    expect(result).not.toBe(base);
    expect(result).not.toBe(accent);
  });
});

describe('rgbToHsl', () => {
  it('赤 (255,0,0) → H=0, S=1, L=0.5', () => {
    const [h, s, l] = rgbToHsl(255, 0, 0);
    expect(h).toBeCloseTo(0, 1);
    expect(s).toBeCloseTo(1, 2);
    expect(l).toBeCloseTo(0.5, 2);
  });

  it('緑 (0,255,0) → H=120, S=1, L=0.5', () => {
    const [h, s, l] = rgbToHsl(0, 255, 0);
    expect(h).toBeCloseTo(120, 1);
    expect(s).toBeCloseTo(1, 2);
    expect(l).toBeCloseTo(0.5, 2);
  });

  it('青 (0,0,255) → H=240, S=1, L=0.5', () => {
    const [h, s, l] = rgbToHsl(0, 0, 255);
    expect(h).toBeCloseTo(240, 1);
    expect(s).toBeCloseTo(1, 2);
    expect(l).toBeCloseTo(0.5, 2);
  });

  it('白 (255,255,255) → H=0, S=0, L=1', () => {
    const [h, s, l] = rgbToHsl(255, 255, 255);
    expect(s).toBeCloseTo(0, 2);
    expect(l).toBeCloseTo(1, 2);
  });

  it('黒 (0,0,0) → H=0, S=0, L=0', () => {
    const [h, s, l] = rgbToHsl(0, 0, 0);
    expect(s).toBeCloseTo(0, 2);
    expect(l).toBeCloseTo(0, 2);
  });
});

describe('hslToRgb', () => {
  it('H=0, S=1, L=0.5 → (255,0,0)', () => {
    const [r, g, b] = hslToRgb(0, 1, 0.5);
    expect(r).toBeCloseTo(255, 0);
    expect(g).toBeCloseTo(0, 0);
    expect(b).toBeCloseTo(0, 0);
  });

  it('H=120, S=1, L=0.5 → (0,255,0)', () => {
    const [r, g, b] = hslToRgb(120, 1, 0.5);
    expect(r).toBeCloseTo(0, 0);
    expect(g).toBeCloseTo(255, 0);
    expect(b).toBeCloseTo(0, 0);
  });

  it('往復変換で一致する', () => {
    const testColors: [number, number, number][] = [
      [255, 0, 0], [0, 255, 0], [0, 0, 255],
      [128, 64, 32], [200, 100, 150],
    ];
    for (const [r, g, b] of testColors) {
      const [h, s, l] = rgbToHsl(r, g, b);
      const [r2, g2, b2] = hslToRgb(h, s, l);
      expect(r2).toBeCloseTo(r, 0);
      expect(g2).toBeCloseTo(g, 0);
      expect(b2).toBeCloseTo(b, 0);
    }
  });
});

describe('shiftHue', () => {
  it('0度シフトで同色を返す', () => {
    expect(shiftHue('#ff0000', 0)).toBe('#ff0000');
  });

  it('360度シフトで同色を返す', () => {
    expect(shiftHue('#ff0000', 360)).toBe('#ff0000');
  });

  it('色相シフトで異なる色を返す', () => {
    const shifted = shiftHue('#ff0000', 120);
    expect(shifted).not.toBe('#ff0000');
    // 赤→120度シフト → 緑付近
    const [r, g, b] = hexToRgb(shifted);
    expect(g).toBeGreaterThan(r);
  });

  it('負の角度でもシフトできる', () => {
    const shifted = shiftHue('#ff0000', -120);
    expect(shifted).not.toBe('#ff0000');
  });
});

describe('adjustBrightness', () => {
  it('amount=0で同色を返す', () => {
    expect(adjustBrightness('#ff0000', 0)).toBe('#ff0000');
  });

  it('正の値で明るくなる', () => {
    const brighter = adjustBrightness('#804020', 0.2);
    const [r1, g1, b1] = hexToRgb('#804020');
    const [r2, g2, b2] = hexToRgb(brighter);
    // 全チャネルの合計が増える
    expect(r2 + g2 + b2).toBeGreaterThan(r1 + g1 + b1);
  });

  it('負の値で暗くなる', () => {
    const darker = adjustBrightness('#804020', -0.2);
    const [r1, g1, b1] = hexToRgb('#804020');
    const [r2, g2, b2] = hexToRgb(darker);
    expect(r2 + g2 + b2).toBeLessThan(r1 + g1 + b1);
  });

  it('L=1を超えない (白以上にならない)', () => {
    const result = adjustBrightness('#ffffff', 0.5);
    expect(result).toBe('#ffffff');
  });
});
