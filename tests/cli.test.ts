import { describe, it, expect } from 'vitest';
import { parseCliOptions } from '../src/cli';

describe('parseCliOptions', () => {
  it('デフォルト値が正しい', () => {
    const opts = parseCliOptions([]);
    expect(opts.theme).toBe('github');
    expect(opts.strength).toBe(0.35);
    expect(opts.duration).toBe(14);
    expect(opts.clipPercent).toBe(95);
    expect(opts.format).toBe('svg');
  });

  it('--theme paper-lightが反映される', () => {
    const opts = parseCliOptions(['--theme', 'paper-light']);
    expect(opts.theme).toBe('paper-light');
  });

  it('--strength 0.5が反映される', () => {
    const opts = parseCliOptions(['--strength', '0.5']);
    expect(opts.strength).toBe(0.5);
  });

  it('--duration 6が反映される', () => {
    const opts = parseCliOptions(['--duration', '6']);
    expect(opts.duration).toBe(6);
  });

  it('--clip-percent 90が反映される', () => {
    const opts = parseCliOptions(['--clip-percent', '90']);
    expect(opts.clipPercent).toBe(90);
  });

  it('--format gifが反映される', () => {
    const opts = parseCliOptions(['--format', 'gif']);
    expect(opts.format).toBe('gif');
  });

  it('--user オプションが取得できる', () => {
    const opts = parseCliOptions(['--user', 'testuser']);
    expect(opts.user).toBe('testuser');
  });

  it('--output オプションが取得できる', () => {
    const opts = parseCliOptions(['--output', 'my-output.svg']);
    expect(opts.output).toBe('my-output.svg');
  });

  it('--demo フラグが true になる', () => {
    const opts = parseCliOptions(['--demo']);
    expect(opts.demo).toBe(true);
  });

  it('--demo 未指定時は falsy', () => {
    const opts = parseCliOptions([]);
    expect(opts.demo).toBeFalsy();
  });

  describe('テーマ名パース', () => {
    it('デフォルトは github', () => {
      const opts = parseCliOptions([]);
      expect(opts.theme).toBe('github');
    });

    const themes = ['github', 'deep-space', 'monochrome', 'solar-flare', 'event-horizon', 'paper-light'];
    for (const name of themes) {
      it(`--theme ${name} が反映される`, () => {
        const opts = parseCliOptions(['--theme', name]);
        expect(opts.theme).toBe(name);
      });
    }

    it('後方互換: --theme dark → github', () => {
      const opts = parseCliOptions(['--theme', 'dark']);
      expect(opts.theme).toBe('github');
    });

    it('後方互換: --theme light → paper-light', () => {
      const opts = parseCliOptions(['--theme', 'light']);
      expect(opts.theme).toBe('paper-light');
    });
  });
});
