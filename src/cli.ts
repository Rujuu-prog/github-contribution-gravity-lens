#!/usr/bin/env node
import { Command } from 'commander';
import { writeFileSync } from 'fs';
import { fetchContributions } from './fetch';
import { generateDemoData } from './demo-data';
import { renderSvg } from './render-svg';
import { renderGif } from './render-gif';

export interface CliOptions {
  user?: string;
  token?: string;
  demo?: boolean;
  theme: 'dark' | 'light';
  strength: number;
  duration: number;
  clipPercent: number;
  format: 'svg' | 'gif';
  output?: string;
}

export function parseCliOptions(args: string[]): CliOptions {
  const program = new Command();
  program
    .name('github-contribution-gravity-lens')
    .description('Generate gravity lens animation from GitHub contributions')
    .option('-u, --user <username>', 'GitHub username')
    .option('-t, --token <token>', 'GitHub personal access token')
    .option('--theme <theme>', 'Color theme', 'dark')
    .option('--strength <number>', 'Warp strength', '0.35')
    .option('--duration <number>', 'Animation duration in seconds', '4')
    .option('--clip-percent <number>', 'Percentile clip value', '95')
    .option('--format <format>', 'Output format (svg or gif)', 'svg')
    .option('-o, --output <path>', 'Output file path')
    .option('-d, --demo', 'Generate with demo data (no token required)');

  program.parse(args, { from: 'user' });
  const opts = program.opts();

  return {
    user: opts.user,
    token: opts.token,
    demo: opts.demo ?? false,
    theme: opts.theme as 'dark' | 'light',
    strength: parseFloat(opts.strength),
    duration: parseFloat(opts.duration),
    clipPercent: parseFloat(opts.clipPercent),
    format: opts.format as 'svg' | 'gif',
    output: opts.output,
  };
}

async function main(): Promise<void> {
  const opts = parseCliOptions(process.argv.slice(2));

  let days;
  if (opts.demo) {
    days = generateDemoData();
  } else {
    const token = opts.token || process.env.GITHUB_TOKEN;

    if (!opts.user) {
      console.error('Error: --user is required');
      process.exit(1);
    }

    if (!token) {
      console.error('Error: --token or GITHUB_TOKEN environment variable is required');
      process.exit(1);
    }

    days = await fetchContributions(opts.user, token);
  }
  const defaultOutput = `gravity-lens.${opts.format}`;
  const outputPath = opts.output || defaultOutput;

  if (opts.format === 'gif') {
    const buffer = await renderGif(days, {
      theme: opts.theme,
      strength: opts.strength,
      duration: opts.duration,
    });
    writeFileSync(outputPath, buffer);
  } else {
    const svg = renderSvg(days, {
      theme: opts.theme,
      strength: opts.strength,
      duration: opts.duration,
    });
    writeFileSync(outputPath, svg, 'utf-8');
  }

  console.log(`Generated: ${outputPath}`);
}

if (require.main === module) {
  main().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
