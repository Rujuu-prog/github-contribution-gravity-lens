import type { ContributionDay } from './types';

/**
 * Simple LCG (Linear Congruential Generator) for deterministic pseudo-random numbers.
 */
function createLcg(seed: number) {
  let state = seed;
  return (): number => {
    state = (state * 1664525 + 1013904223) & 0xffffffff;
    return (state >>> 0) / 0x100000000;
  };
}

function countToLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count <= 3) return 1;
  if (count <= 7) return 2;
  if (count <= 12) return 3;
  return 4;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Generate 365 days of deterministic demo contribution data.
 * Uses seed=42 LCG so results are identical on every call.
 */
export function generateDemoData(): ContributionDay[] {
  const rand = createLcg(42);
  const days: ContributionDay[] = [];

  // 6 "active weeks" with high commit counts — pick week indices deterministically
  const activeWeeks = new Set([3, 10, 18, 27, 35, 45]);

  const baseDate = new Date('2024-01-01');

  for (let i = 0; i < 365; i++) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + i);
    const dow = date.getDay(); // 0=Sun, 6=Sat
    const isWeekend = dow === 0 || dow === 6;
    const weekIndex = Math.floor(i / 7);
    const isActiveWeek = activeWeeks.has(weekIndex);

    let count: number;
    const r = rand();

    if (isActiveWeek && !isWeekend) {
      // Active week weekday: high commits 5–19
      count = 5 + Math.floor(r * 15);
    } else if (isWeekend) {
      // Weekend: 60% chance of activity, count 1–3
      count = r < 0.6 ? 1 + Math.floor(rand() * 3) : 0;
    } else {
      // Normal weekday: 85% chance of activity, count 1–12
      count = r < 0.85 ? 1 + Math.floor(rand() * 12) : 0;
    }

    days.push({
      date: formatDate(date),
      count,
      level: countToLevel(count),
    });
  }

  return days;
}
