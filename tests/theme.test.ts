import { describe, it, expect } from 'vitest';
import { getTheme } from '../src/theme';
import { ThemeName } from '../src/types';

const ALL_THEMES: ThemeName[] = ['github', 'deep-space', 'monochrome', 'solar-flare', 'event-horizon', 'paper-light'];

describe('getTheme', () => {
  describe('全6テーマが取得可能', () => {
    for (const name of ALL_THEMES) {
      it(`'${name}' テーマが取得できる`, () => {
        const theme = getTheme(name);
        expect(theme).toBeDefined();
        expect(theme.name).toBe(name);
      });
    }
  });

  describe('必須フィールド検証', () => {
    for (const name of ALL_THEMES) {
      it(`'${name}' にwarpMultiplier/dimming/peakBrightnessBoostがある`, () => {
        const theme = getTheme(name);
        expect(typeof theme.warpMultiplier).toBe('number');
        expect(typeof theme.dimming).toBe('number');
        expect(typeof theme.peakBrightnessBoost).toBe('number');
      });
    }
  });

  describe('warpMultiplier の範囲 (0.8〜2.0)', () => {
    for (const name of ALL_THEMES) {
      it(`'${name}' warpMultiplier は 0.8〜2.0`, () => {
        const theme = getTheme(name);
        expect(theme.warpMultiplier).toBeGreaterThanOrEqual(0.8);
        expect(theme.warpMultiplier).toBeLessThanOrEqual(2.0);
      });
    }
  });

  describe('dimming の範囲 (-0.5〜0)', () => {
    for (const name of ALL_THEMES) {
      it(`'${name}' dimming は -0.5〜0`, () => {
        const theme = getTheme(name);
        expect(theme.dimming).toBeGreaterThanOrEqual(-0.5);
        expect(theme.dimming).toBeLessThanOrEqual(0);
      });
    }
  });

  describe('peakBrightnessBoost の範囲 (0〜0.5)', () => {
    for (const name of ALL_THEMES) {
      it(`'${name}' peakBrightnessBoost は 0〜0.5`, () => {
        const theme = getTheme(name);
        expect(theme.peakBrightnessBoost).toBeGreaterThanOrEqual(0);
        expect(theme.peakBrightnessBoost).toBeLessThanOrEqual(0.5);
      });
    }
  });

  describe('levels は5要素の配列', () => {
    for (const name of ALL_THEMES) {
      it(`'${name}' levels は5要素`, () => {
        const theme = getTheme(name);
        expect(theme.levels).toHaveLength(5);
      });
    }
  });

  describe('各テーマの基本プロパティ', () => {
    for (const name of ALL_THEMES) {
      it(`'${name}' にbackground/gridBase/textColor等が定義されている`, () => {
        const theme = getTheme(name);
        expect(theme.backgroundTop).toBeTruthy();
        expect(theme.backgroundBottom).toBeTruthy();
        expect(theme.gridBase).toBeTruthy();
        expect(theme.textColor).toBeTruthy();
        expect(theme.anomalyAccent).toBeTruthy();
        expect(theme.anomalyHighlight).toBeTruthy();
        expect(theme.peakMomentColor).toBeTruthy();
        expect(theme.fieldGradient).toBeDefined();
      });
    }
  });

  describe('backgroundTop/Bottomのグラデーション値が異なる', () => {
    for (const name of ALL_THEMES) {
      it(`'${name}' backgroundTop !== backgroundBottom`, () => {
        const theme = getTheme(name);
        expect(theme.backgroundTop).not.toBe(theme.backgroundBottom);
      });
    }
  });

  describe('後方互換テスト', () => {
    it("'dark' → 'github' テーマが返る", () => {
      const theme = getTheme('dark' as any);
      expect(theme.name).toBe('github');
    });

    it("'light' → 'paper-light' テーマが返る", () => {
      const theme = getTheme('light' as any);
      expect(theme.name).toBe('paper-light');
    });
  });

  describe('テーマ固有の特性', () => {
    it('github: warpMultiplier=1.0, dimming=0', () => {
      const theme = getTheme('github');
      expect(theme.warpMultiplier).toBe(1.0);
      expect(theme.dimming).toBe(0);
    });

    it('deep-space: warpMultiplier=1.2, dimming=-0.15', () => {
      const theme = getTheme('deep-space');
      expect(theme.warpMultiplier).toBe(1.2);
      expect(theme.dimming).toBe(-0.15);
      expect(theme.peakBrightnessBoost).toBe(0.25);
    });

    it('monochrome: warpMultiplier=1.1, dimming=-0.10', () => {
      const theme = getTheme('monochrome');
      expect(theme.warpMultiplier).toBe(1.1);
      expect(theme.dimming).toBe(-0.10);
    });

    it('solar-flare: warpMultiplier=1.3, dimming=-0.20', () => {
      const theme = getTheme('solar-flare');
      expect(theme.warpMultiplier).toBe(1.3);
      expect(theme.dimming).toBe(-0.20);
    });

    it('event-horizon: warpMultiplier=1.4, dimming=-0.25, peakBrightnessBoost=0.05', () => {
      const theme = getTheme('event-horizon');
      expect(theme.warpMultiplier).toBe(1.4);
      expect(theme.dimming).toBe(-0.25);
      expect(theme.peakBrightnessBoost).toBe(0.05);
    });

    it('paper-light: warpMultiplier=1.0, dimming=-0.08', () => {
      const theme = getTheme('paper-light');
      expect(theme.warpMultiplier).toBe(1.0);
      expect(theme.dimming).toBe(-0.08);
    });
  });

  describe('fieldGradient検証', () => {
    for (const name of ALL_THEMES) {
      it(`'${name}' fieldGradient.intensity は 0〜1`, () => {
        const theme = getTheme(name);
        expect(theme.fieldGradient!.intensity).toBeGreaterThanOrEqual(0);
        expect(theme.fieldGradient!.intensity).toBeLessThanOrEqual(1);
      });
    }
  });
});
