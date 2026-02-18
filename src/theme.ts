import { Theme } from './types';

const darkTheme: Theme = {
  name: 'dark',
  backgroundTop: '#0b0f14',
  backgroundBottom: '#0f1720',
  gridBase: '#13202b',
  levels: ['#13202b', '#1f3b4d', '#255d73', '#2e86a7', '#66c2ff'],
  accentColor: 'rgba(139, 92, 246, 0.15)',
  warpGlow: 'rgba(102, 194, 255, 0.08)',
  textColor: 'rgba(255, 255, 255, 0.35)',
  fieldGradient: { peakColor: '#a78bfa', intensity: 0.6 },
  anomalyAccent: '#3ddcff',
  anomalyHighlight: '#5ee6ff',
  peakMomentColor: '#7df9ff',
};

const lightTheme: Theme = {
  name: 'light',
  backgroundTop: '#ffffff',
  backgroundBottom: '#f6f8fa',
  gridBase: '#ebedf0',
  levels: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
  accentColor: 'rgba(139, 92, 246, 0.10)',
  warpGlow: 'rgba(0, 120, 60, 0.08)',
  textColor: 'rgba(0, 0, 0, 0.5)',
  fieldGradient: { peakColor: '#7c3aed', intensity: 0.5 },
  anomalyAccent: '#3ddcff',
  anomalyHighlight: '#5ee6ff',
  peakMomentColor: '#7df9ff',
};

export function getTheme(name: 'dark' | 'light'): Theme {
  return name === 'dark' ? darkTheme : lightTheme;
}
