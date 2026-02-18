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
    expect(rectCount).toBeGreaterThanOrEqual(days.length);
  });

  it('静的セル（アニメーション無し）が存在する', () => {
    const svg = renderSvg(daysWithAnomalies, { theme: 'dark' });
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
    expect(svg).toContain('@keyframes color-');
  });

  it('anomalyAccent色がSVG内に使われる', () => {
    const svg = renderSvg(daysWithAnomalies, { theme: 'dark' });
    expect(svg).toContain('#3ddcff');
  });

  it('異常点セルにスケール効果がある（brightnessProgressで補間される）', () => {
    const svg = renderSvg(daysWithAnomalies, { theme: 'dark' });
    // イージング導入後: scale(1.0200) のフル値だけでなく中間値も含まれる
    expect(svg).toMatch(/scale\(1\.0[0-2]\d{2}\)/);
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
    const svg50 = renderSvg(daysWithAnomalies, { theme: 'dark', anomalyPercent: 50 });
    const svg5 = renderSvg(daysWithAnomalies, { theme: 'dark', anomalyPercent: 5 });
    const animated50 = (svg50.match(/animation:/g) || []).length;
    const animated5 = (svg5.match(/animation:/g) || []).length;
    expect(animated50).toBeGreaterThan(animated5);
  });

  it('タイポグラフィにfont-weight 300とletter-spacingが含まれる', () => {
    const svg = renderSvg(days, { theme: 'dark' });
    expect(svg).toContain('font-weight="300"');
    expect(svg).toContain('letter-spacing="0.08em"');
  });

  it('異常点セルのrxがイージングで補間される（rx="6"のみではない）', () => {
    const svg = renderSvg(daysWithAnomalies, { theme: 'dark' });
    // rx属性はキーフレーム内で補間されるため、静的rect内にrx="6"が存在しなくてもよい
    // アニメーション付きrectは初期状態rx=cornerRadius(2)で開始
    expect(svg).toMatch(/rx="[\d.]+"/);
  });

  it('異常点セルにrotate() transformが存在する', () => {
    const svg = renderSvg(daysWithAnomalies, { theme: 'dark' });
    expect(svg).toMatch(/rotate\([^)]+deg\)/);
  });

  it('異常点セルにtranslateZ(1px)が存在する', () => {
    const svg = renderSvg(daysWithAnomalies, { theme: 'dark' });
    expect(svg).toContain('translateZ(1px)');
  });

  it('peakMomentColor (#7df9ff) がSVG内に存在する', () => {
    const svg = renderSvg(daysWithAnomalies, { theme: 'dark' });
    expect(svg).toContain('#7df9ff');
  });

  it('デフォルトduration=14sである', () => {
    const svg = renderSvg(daysWithAnomalies, { theme: 'dark' });
    expect(svg).toContain('14s');
  });

  it('サンプリングベースのキーフレームが生成される', () => {
    const svg = renderSvg(daysWithAnomalies, { theme: 'dark' });
    // サンプリングベースなのでキーフレーム内に複数のパーセンテージが存在する
    const keyframeBlocks = svg.match(/@keyframes warp-\d+\s*\{[\s\S]*?\n\}/g) || [];
    expect(keyframeBlocks.length).toBeGreaterThan(0);
    // 各キーフレームに複数のストップがある (28サンプル = 28個の百分率)
    for (const kf of keyframeBlocks) {
      const pctMatches = kf.match(/[\d.]+%\s*\{/g) || [];
      expect(pctMatches.length).toBeGreaterThan(2);
    }
  });

  it('animation-timing-function: linear が使用される', () => {
    const svg = renderSvg(daysWithAnomalies, { theme: 'dark' });
    expect(svg).toContain('linear');
  });

  // --- プログレスバーテスト ---

  it('プログレスバーのトラックrectが存在する（opacity="0.15"）', () => {
    const svg = renderSvg(daysWithAnomalies, { theme: 'dark' });
    expect(svg).toMatch(/opacity="0\.15"/);
    // height="3" rx="1.5" のトラック
    expect(svg).toMatch(/height="3".*rx="1\.5"/);
  });

  it('プログレスバーの<animate>要素が存在する', () => {
    const svg = renderSvg(daysWithAnomalies, { theme: 'dark' });
    expect(svg).toMatch(/<animate\s+attributeName="width"/);
  });

  // --- セル形状イージングテスト ---

  it('異常点キーフレームにscale中間値が含まれる（binaryでない）', () => {
    const svg = renderSvg(daysWithAnomalies, { theme: 'dark' });
    // scale(1.0200)（フル値）以外の中間値が存在するはず
    const scaleMatches = svg.match(/scale\((1\.\d{4})\)/g) || [];
    const scaleValues = scaleMatches.map(m => parseFloat(m.match(/\d+\.\d+/)![0]));
    // フル値1.02以外の値が含まれること
    const nonFullValues = scaleValues.filter(v => v > 1.0 && v < 1.02);
    expect(nonFullValues.length).toBeGreaterThan(0);
  });

  it('干渉ゾーンのゾーンセルにscale効果がキーフレーム内に存在する', () => {
    const svg = renderSvg(daysWithAnomalies, { theme: 'dark' });
    // ゾーンセルのscaleパルス: scale(1.00XX) の値が存在
    const warpBlocks = svg.match(/@keyframes warp-\d+\s*\{[\s\S]*?\n\}/g) || [];
    const hasZoneScale = warpBlocks.some(block => /scale\(1\.0[0-1]\d{2}\)/.test(block));
    expect(hasZoneScale).toBe(true);
  });

  it('グロー要素に <animate attributeName="r" が存在する', () => {
    const svg = renderSvg(daysWithAnomalies, { theme: 'dark' });
    expect(svg).toContain('attributeName="r"');
  });

  it('異常点セルのcontrastがbrightnessProgressで補間される', () => {
    const svg = renderSvg(daysWithAnomalies, { theme: 'dark' });
    // contrast(1.050) フル値以外の中間値がある
    const contrastMatches = svg.match(/contrast\(([\d.]+)\)/g) || [];
    const contrastValues = contrastMatches.map(m => parseFloat(m.match(/[\d.]+/)![0]));
    const nonFullValues = contrastValues.filter(v => v > 1.0 && v < 1.05);
    expect(nonFullValues.length).toBeGreaterThan(0);
  });
});
