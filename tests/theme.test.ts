import { describe, it, expect } from 'vitest';
import { getTheme } from '../src/theme';

describe('getTheme', () => {
  it('darkテーマで宇宙パレットのカラーを返す', () => {
    const theme = getTheme('dark');
    expect(theme.name).toBe('dark');
    expect(theme.backgroundTop).toBe('#0b0f14');
    expect(theme.backgroundBottom).toBe('#0f1720');
    expect(theme.gridBase).toBe('#13202b');
    expect(theme.levels[0]).toBe('#13202b');
    expect(theme.levels[1]).toBe('#1f3b4d');
    expect(theme.levels[2]).toBe('#255d73');
    expect(theme.levels[3]).toBe('#2e86a7');
    expect(theme.levels[4]).toBe('#66c2ff');
    expect(theme.warpGlow).toBe('rgba(102, 194, 255, 0.08)');
    expect(theme.textColor).toBe('rgba(255, 255, 255, 0.35)');
  });

  it('darkテーマにaccentColorがある', () => {
    const theme = getTheme('dark');
    expect(theme.accentColor).toBe('rgba(139, 92, 246, 0.15)');
  });

  it('lightテーマを返す', () => {
    const theme = getTheme('light');
    expect(theme.name).toBe('light');
    expect(theme.backgroundTop).toBeTruthy();
    expect(theme.backgroundBottom).toBeTruthy();
  });

  it('levelsは5要素の配列', () => {
    const dark = getTheme('dark');
    expect(dark.levels).toHaveLength(5);

    const light = getTheme('light');
    expect(light.levels).toHaveLength(5);
  });

  it('textColorが定義されている', () => {
    expect(getTheme('dark').textColor).toBeTruthy();
    expect(getTheme('light').textColor).toBeTruthy();
  });

  it('backgroundTop/Bottomのグラデーション値が異なる', () => {
    const dark = getTheme('dark');
    expect(dark.backgroundTop).not.toBe(dark.backgroundBottom);

    const light = getTheme('light');
    expect(light.backgroundTop).not.toBe(light.backgroundBottom);
  });

  it('darkテーマにfieldGradientが存在する', () => {
    const theme = getTheme('dark');
    expect(theme.fieldGradient).toBeDefined();
    expect(theme.fieldGradient!.peakColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(theme.fieldGradient!.intensity).toBeGreaterThanOrEqual(0);
    expect(theme.fieldGradient!.intensity).toBeLessThanOrEqual(1);
  });

  it('lightテーマにfieldGradientが存在する', () => {
    const theme = getTheme('light');
    expect(theme.fieldGradient).toBeDefined();
    expect(theme.fieldGradient!.peakColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(theme.fieldGradient!.intensity).toBeGreaterThanOrEqual(0);
    expect(theme.fieldGradient!.intensity).toBeLessThanOrEqual(1);
  });

  it('darkテーマにanomalyAccentが#3ddcffである', () => {
    const theme = getTheme('dark');
    expect(theme.anomalyAccent).toBe('#3ddcff');
  });

  it('darkテーマにanomalyHighlightが#5ee6ffである', () => {
    const theme = getTheme('dark');
    expect(theme.anomalyHighlight).toBe('#5ee6ff');
  });

  it('lightテーマにanomalyAccentが#3ddcffである', () => {
    const theme = getTheme('light');
    expect(theme.anomalyAccent).toBe('#3ddcff');
  });

  it('lightテーマにanomalyHighlightが#5ee6ffである', () => {
    const theme = getTheme('light');
    expect(theme.anomalyHighlight).toBe('#5ee6ff');
  });
});
