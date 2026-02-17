import { describe, it, expect } from 'vitest';
import { renderGif } from '../src/render-gif';
import { ContributionDay } from '../src/types';

function makeSampleDays(count: number): ContributionDay[] {
  return Array.from({ length: count }, (_, i) => ({
    date: `2024-01-${String((i % 28) + 1).padStart(2, '0')}`,
    count: i % 15,
    level: Math.min(4, Math.floor(i % 5)) as 0 | 1 | 2 | 3 | 4,
  }));
}

describe('renderGif', () => {
  // 小さなグリッドで高速にテスト
  const days = makeSampleDays(7 * 4); // 4 weeks

  it('Bufferを返す', { timeout: 30000 }, async () => {
    const gif = await renderGif(days, { theme: 'dark' });
    expect(gif).toBeInstanceOf(Buffer);
  });

  it('GIFマジックバイト（GIF89a）で開始する', { timeout: 30000 }, async () => {
    const gif = await renderGif(days, { theme: 'dark' });
    const header = gif.subarray(0, 6).toString('ascii');
    expect(header).toBe('GIF89a');
  });

  it('2MB以下である', { timeout: 30000 }, async () => {
    const gif = await renderGif(days, { theme: 'dark' });
    expect(gif.length).toBeLessThan(2 * 1024 * 1024);
  });

  it('テーマ指定でも正常生成できる', { timeout: 30000 }, async () => {
    const gif = await renderGif(days, { theme: 'light' });
    expect(gif).toBeInstanceOf(Buffer);
    const header = gif.subarray(0, 6).toString('ascii');
    expect(header).toBe('GIF89a');
  });
});
