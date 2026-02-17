import { describe, it, expect } from 'vitest';
import { hexToRgb, rgbToHex, blendColors, computeCellColor, computeAnomalyColor } from '../src/color-blend';

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
