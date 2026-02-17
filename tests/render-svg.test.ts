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

// 異常点を明確に作るデータ: ほとんどが0-2、一部だけ高い値
function makeDaysWithAnomalies(count: number): ContributionDay[] {
  return Array.from({ length: count }, (_, i) => ({
    date: `2024-01-${String((i % 28) + 1).padStart(2, '0')}`,
    count: i % 20 === 0 ? 30 : i % 3, // 5%程度のセルが突出
    level: (i % 20 === 0 ? 4 : Math.min(4, Math.floor(i % 3))) as 0 | 1 | 2 | 3 | 4,
  }));
}

describe('renderSvg', () => {
  const days = makeSampleDays(7 * 10); // 10 weeks
  const daysWithAnomalies = makeDaysWithAnomalies(7 * 10);

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

  it('静的セル（アニメーション無し）が存在する', () => {
    const svg = renderSvg(daysWithAnomalies, { theme: 'dark' });
    // 静的セルは animation を持たないrect
    // SVG内にrectが存在し、一部はstyle属性にanimationを含まない
    const rects = svg.match(/<rect [^>]+>/g) || [];
    const staticRects = rects.filter(r => !r.includes('animation:'));
    expect(staticRects.length).toBeGreaterThan(0);
  });

  it('CSS @keyframes が含まれる', () => {
    const svg = renderSvg(daysWithAnomalies, { theme: 'dark' });
    expect(svg).toContain('@keyframes');
  });

  it('明度キーフレームが異常点セルに適用される', () => {
    const svg = renderSvg(daysWithAnomalies, { theme: 'dark' });
    // brightness用のcolorキーフレームが存在する
    expect(svg).toContain('@keyframes color-');
  });

  it('anomalyAccent色がSVG内に使われる', () => {
    const svg = renderSvg(daysWithAnomalies, { theme: 'dark' });
    expect(svg).toContain('#3ddcff');
  });

  it('異常点セルにスケール効果がある', () => {
    const svg = renderSvg(daysWithAnomalies, { theme: 'dark' });
    // 異常点セルにscale(1.02)が適用される
    expect(svg).toContain('scale(1.02)');
  });

  it('タグライン "Your commits bend spacetime." が含まれる', () => {
    const svg = renderSvg(days, { theme: 'dark' });
    expect(svg).toContain('Your commits bend spacetime.');
  });

  it('背景色がダークテーマの宇宙パレットと一致する', () => {
    const svg = renderSvg(days, { theme: 'dark' });
    expect(svg).toContain('#0b0f14');
    expect(svg).toContain('#0f1720');
  });

  it('radialGradientグロー要素が含まれる', () => {
    const svg = renderSvg(daysWithAnomalies, { theme: 'dark' });
    expect(svg).toContain('radialGradient');
  });

  it('lightテーマでも生成できる', () => {
    const svg = renderSvg(days, { theme: 'light' });
    expect(svg).toContain('<svg');
    expect(svg).toContain('#ffffff');
  });

  it('anomalyPercentオプションが反映される', () => {
    // anomalyPercent=50 → より多くのセルがアニメーション対象
    const svg50 = renderSvg(daysWithAnomalies, { theme: 'dark', anomalyPercent: 50 });
    const svg5 = renderSvg(daysWithAnomalies, { theme: 'dark', anomalyPercent: 5 });
    // 50%の方がアニメーション付きrectが多い
    const animated50 = (svg50.match(/animation:/g) || []).length;
    const animated5 = (svg5.match(/animation:/g) || []).length;
    expect(animated50).toBeGreaterThan(animated5);
  });

  it('タイポグラフィにfont-weight 300とletter-spacingが含まれる', () => {
    const svg = renderSvg(days, { theme: 'dark' });
    expect(svg).toContain('font-weight="300"');
    expect(svg).toContain('letter-spacing="0.08em"');
  });
});
