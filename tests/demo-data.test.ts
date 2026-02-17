import { describe, it, expect } from 'vitest';
import { generateDemoData } from '../src/demo-data';

describe('generateDemoData', () => {
  it('365日分の配列を返す', () => {
    const days = generateDemoData();
    expect(days).toHaveLength(365);
  });

  it('各dateがYYYY-MM-DD形式', () => {
    const days = generateDemoData();
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    for (const day of days) {
      expect(day.date).toMatch(dateRegex);
    }
  });

  it('各countが0以上の整数', () => {
    const days = generateDemoData();
    for (const day of days) {
      expect(day.count).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(day.count)).toBe(true);
    }
  });

  it('各levelが0〜4の範囲', () => {
    const days = generateDemoData();
    for (const day of days) {
      expect(day.level).toBeGreaterThanOrEqual(0);
      expect(day.level).toBeLessThanOrEqual(4);
    }
  });

  it('呼び出すたびに同じ結果（決定的）', () => {
    const first = generateDemoData();
    const second = generateDemoData();
    expect(first).toEqual(second);
  });

  it('週末の平均countが平日より小さい', () => {
    const days = generateDemoData();
    const weekdays: number[] = [];
    const weekends: number[] = [];

    for (const day of days) {
      const dow = new Date(day.date).getDay();
      if (dow === 0 || dow === 6) {
        weekends.push(day.count);
      } else {
        weekdays.push(day.count);
      }
    }

    const weekdayAvg = weekdays.reduce((a, b) => a + b, 0) / weekdays.length;
    const weekendAvg = weekends.reduce((a, b) => a + b, 0) / weekends.length;
    expect(weekendAvg).toBeLessThan(weekdayAvg);
  });
});
