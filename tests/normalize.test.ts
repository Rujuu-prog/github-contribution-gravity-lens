import { describe, it, expect } from 'vitest';
import { percentile, normalizeContributions, applyNonLinearMapping } from '../src/normalize';
import { ContributionDay } from '../src/types';

describe('percentile', () => {
  it('空配列に対して0を返す', () => {
    expect(percentile([], 95)).toBe(0);
  });

  it('単一要素の配列で正しく計算する', () => {
    expect(percentile([10], 95)).toBe(10);
  });

  it('既知の配列で95パーセンタイルを正しく計算する', () => {
    const values = Array.from({ length: 100 }, (_, i) => i + 1);
    const p95 = percentile(values, 95);
    expect(p95).toBeCloseTo(95.05, 0);
  });

  it('50パーセンタイルで中央値を返す', () => {
    const values = [1, 2, 3, 4, 5];
    const p50 = percentile(values, 50);
    expect(p50).toBeCloseTo(3, 0);
  });

  it('全て同じ値の配列でその値を返す', () => {
    expect(percentile([5, 5, 5, 5], 95)).toBe(5);
  });
});

describe('applyNonLinearMapping', () => {
  it('0に対して0を返す', () => {
    expect(applyNonLinearMapping(0)).toBe(0);
  });

  it('1に対して1を返す', () => {
    expect(applyNonLinearMapping(1)).toBe(1);
  });

  it('0.5に対してpow(0.5, 0.6)を返す', () => {
    const expected = Math.pow(0.5, 0.6);
    expect(applyNonLinearMapping(0.5)).toBeCloseTo(expected, 10);
  });

  it('結果は入力より大きい（0<x<1の範囲）', () => {
    const input = 0.3;
    const result = applyNonLinearMapping(input);
    expect(result).toBeGreaterThan(input);
    expect(result).toBeLessThan(1);
  });
});

describe('normalizeContributions', () => {
  it('空配列に対して空配列を返す', () => {
    expect(normalizeContributions([])).toEqual([]);
  });

  it('count=0のセルはmass=0になる', () => {
    const days: ContributionDay[] = [
      { date: '2024-01-01', count: 0, level: 0 },
    ];
    const result = normalizeContributions(days);
    expect(result[0].mass).toBe(0);
  });

  it('正規化でmassが0〜1の範囲に収まる', () => {
    const days: ContributionDay[] = Array.from({ length: 100 }, (_, i) => ({
      date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      count: i * 2,
      level: Math.min(4, Math.floor(i / 25)) as 0 | 1 | 2 | 3 | 4,
    }));
    const result = normalizeContributions(days);
    result.forEach(cell => {
      expect(cell.mass).toBeGreaterThanOrEqual(0);
      expect(cell.mass).toBeLessThanOrEqual(1);
    });
  });

  it('外れ値がクリップされる', () => {
    const days: ContributionDay[] = [
      ...Array.from({ length: 99 }, (_, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        count: 10,
        level: 2 as const,
      })),
      { date: '2024-04-10', count: 1000, level: 4 as const },
    ];
    const result = normalizeContributions(days);
    const outlierCell = result[result.length - 1];
    expect(outlierCell.mass).toBeLessThanOrEqual(1);
  });

  it('行と列が正しく割り当てられる', () => {
    const days: ContributionDay[] = Array.from({ length: 14 }, (_, i) => ({
      date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      count: i,
      level: 0 as const,
    }));
    const result = normalizeContributions(days);
    // 最初の7日は col=0 の row 0-6
    expect(result[0].col).toBe(0);
    expect(result[0].row).toBe(0);
    expect(result[6].col).toBe(0);
    expect(result[6].row).toBe(6);
    // 次の7日は col=1
    expect(result[7].col).toBe(1);
    expect(result[7].row).toBe(0);
  });
});
