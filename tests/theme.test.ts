import { describe, it, expect } from 'vitest';
import { getTheme } from '../src/theme';

describe('getTheme', () => {
  it('darkテーマで仕様通りのカラーパレットを返す', () => {
    const theme = getTheme('dark');
    expect(theme.name).toBe('dark');
    expect(theme.background).toBe('#0d1117');
    expect(theme.gridBase).toBe('#161b22');
    expect(theme.levels[0]).toBe('#161b22');
    expect(theme.levels[1]).toBe('#0e4429');
    expect(theme.levels[2]).toBe('#006d32');
    expect(theme.levels[3]).toBe('#26a641');
    expect(theme.levels[4]).toBe('#39d353');
    expect(theme.warpGlow).toBe('rgba(120, 255, 180, 0.08)');
  });

  it('lightテーマを返す', () => {
    const theme = getTheme('light');
    expect(theme.name).toBe('light');
    expect(theme.background).toBeTruthy();
    expect(theme.gridBase).toBeTruthy();
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
});
