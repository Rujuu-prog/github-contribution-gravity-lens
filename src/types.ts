export interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface GridCell {
  row: number;
  col: number;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  mass: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface AnomalyGridCell extends GridCell {
  isAnomaly: boolean;
  anomalyIntensity: number;
  originalX?: number;
  originalY?: number;
}

export interface WarpedCell extends GridCell {
  originalX: number;
  originalY: number;
  warpedX: number;
  warpedY: number;
  isAnomaly?: boolean;
  anomalyIntensity?: number;
  rotation?: number;
  interferenceLevel?: number;
}

export interface Theme {
  name: string;
  backgroundTop: string;
  backgroundBottom: string;
  gridBase: string;
  levels: [string, string, string, string, string];
  accentColor: string;
  warpGlow: string;
  textColor: string;
  fieldGradient?: {
    peakColor: string;
    intensity: number;
  };
  anomalyAccent: string;
  anomalyHighlight: string;
  peakMomentColor: string;
}

export interface RenderOptions {
  theme: 'dark' | 'light';
  strength: number;
  duration: number;
  clipPercent: number;
  cellSize: number;
  cellGap: number;
  cornerRadius: number;
  anomalyPercent: number;
}
