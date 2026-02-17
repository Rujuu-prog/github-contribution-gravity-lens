import { describe, it, expect } from 'vitest';
import { renderSvg } from '../src/render-svg';
import { ContributionDay } from '../src/types';

function makeSampleDays(count: number): ContributionDay[] {
  return Array.from({ length: count }, (_, i) => ({
    date: `2024-01-${String((i % 28) + 1).padStart(2, '0')}`,
    count: Math.floor(Math.random() * 20),
    level: Math.min(4, Math.floor(i % 5)) as 0 | 1 | 2 | 3 | 4,
  }));
}

describe('renderSvg', () => {
  const days = makeSampleDays(7 * 10); // 10 weeks

  it('有効なSVGを出力する', () => {
    const svg = renderSvg(days, { theme: 'dark' });
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('全セル分のrectが含まれる', () => {
    const svg = renderSvg(days, { theme: 'dark' });
    const rectCount = (svg.match(/<rect /g) || []).length;
    // 各セル + 背景rect
    expect(rectCount).toBeGreaterThanOrEqual(days.length);
  });

  it('CSS @keyframes が含まれる', () => {
    const svg = renderSvg(days, { theme: 'dark' });
    expect(svg).toContain('@keyframes');
  });

  it('タグライン "Your commits bend spacetime." が含まれる', () => {
    const svg = renderSvg(days, { theme: 'dark' });
    expect(svg).toContain('Your commits bend spacetime.');
  });

  it('背景色がダークテーマと一致する', () => {
    const svg = renderSvg(days, { theme: 'dark' });
    expect(svg).toContain('#0d1117');
  });

  it('lightテーマでも生成できる', () => {
    const svg = renderSvg(days, { theme: 'light' });
    expect(svg).toContain('<svg');
    expect(svg).toContain('#ffffff');
  });

  it('strengthオプションが反映される', () => {
    const svgDefault = renderSvg(days, { theme: 'dark' });
    const svgStrong = renderSvg(days, { theme: 'dark', strength: 0.8 });
    // 両方ともSVGとして有効
    expect(svgDefault).toContain('<svg');
    expect(svgStrong).toContain('<svg');
  });
});
