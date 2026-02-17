import { ContributionDay, GridCell, AnomalyGridCell } from './types';

export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) return sorted[lower];

  const fraction = index - lower;
  return sorted[lower] + fraction * (sorted[upper] - sorted[lower]);
}

export function applyNonLinearMapping(normalized: number): number {
  if (normalized === 0) return 0;
  return Math.pow(normalized, 0.6);
}

export function normalizeContributions(days: ContributionDay[]): GridCell[] {
  if (days.length === 0) return [];

  const counts = days.map(d => d.count);
  const maxCount = percentile(counts, 95);

  return days.map((day, i) => {
    const col = Math.floor(i / 7);
    const row = i % 7;
    const clipped = maxCount > 0 ? Math.min(day.count, maxCount) / maxCount : 0;
    const mass = day.count === 0 ? 0 : applyNonLinearMapping(clipped);

    return {
      row,
      col,
      count: day.count,
      level: day.level,
      mass,
    };
  });
}

export function detectAnomalies(cells: GridCell[], percent: number = 10): AnomalyGridCell[] {
  if (cells.length === 0) return [];

  const counts = cells.map(c => c.count);
  const threshold = percentile(counts, 100 - percent);

  return cells.map(cell => ({
    ...cell,
    isAnomaly: cell.count >= threshold && threshold > 0,
    anomalyIntensity: cell.count >= threshold && threshold > 0 ? cell.mass : 0,
  }));
}
