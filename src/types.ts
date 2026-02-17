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

export interface WarpedCell extends GridCell {
  originalX: number;
  originalY: number;
  warpedX: number;
  warpedY: number;
}

export interface Theme {
  name: string;
  background: string;
  gridBase: string;
  levels: [string, string, string, string, string];
  warpGlow: string;
  textColor: string;
}

export interface RenderOptions {
  theme: 'dark' | 'light';
  strength: number;
  duration: number;
  clipPercent: number;
  cellSize: number;
  cellGap: number;
  cornerRadius: number;
}
