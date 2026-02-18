import { Theme, ThemeName } from './types';

const githubTheme: Theme = {
  name: 'github',
  backgroundTop: '#0d1117',
  backgroundBottom: '#161b22',
  gridBase: '#161b22',
  levels: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
  accentColor: 'rgba(139, 92, 246, 0.15)',
  warpGlow: 'rgba(102, 194, 255, 0.08)',
  textColor: 'rgba(255, 255, 255, 0.35)',
  fieldGradient: { peakColor: '#a78bfa', intensity: 0.6 },
  anomalyAccent: '#3ddcff',
  anomalyHighlight: '#5ee6ff',
  peakMomentColor: '#7df9ff',
  warpMultiplier: 1.0,
  dimming: 0,
  peakBrightnessBoost: 0.15,
};

const deepSpaceTheme: Theme = {
  name: 'deep-space',
  backgroundTop: '#050a18',
  backgroundBottom: '#0a1628',
  gridBase: '#0a1628',
  levels: ['#0a1628', '#0d2847', '#104070', '#1a6ea0', '#30b8e0'],
  accentColor: 'rgba(0, 229, 255, 0.15)',
  warpGlow: 'rgba(0, 229, 255, 0.10)',
  textColor: 'rgba(180, 220, 255, 0.35)',
  fieldGradient: { peakColor: '#8b5cf6', intensity: 0.7 },
  anomalyAccent: '#00e5ff',
  anomalyHighlight: '#40efff',
  peakMomentColor: '#80f4ff',
  warpMultiplier: 1.2,
  dimming: -0.15,
  peakBrightnessBoost: 0.25,
};

const monochromeTheme: Theme = {
  name: 'monochrome',
  backgroundTop: '#0a0a0a',
  backgroundBottom: '#141414',
  gridBase: '#1a1a1a',
  levels: ['#1a1a1a', '#3a3a3a', '#5a5a5a', '#808080', '#b0b0b0'],
  accentColor: 'rgba(160, 160, 180, 0.12)',
  warpGlow: 'rgba(176, 176, 176, 0.06)',
  textColor: 'rgba(200, 200, 200, 0.35)',
  fieldGradient: { peakColor: '#7888a0', intensity: 0.4 },
  anomalyAccent: '#b0b0b0',
  anomalyHighlight: '#c8c8c8',
  peakMomentColor: '#e0e0e0',
  warpMultiplier: 1.1,
  dimming: -0.10,
  peakBrightnessBoost: 0.15,
};

const solarFlareTheme: Theme = {
  name: 'solar-flare',
  backgroundTop: '#1a0505',
  backgroundBottom: '#2a0a0a',
  gridBase: '#2a0a0a',
  levels: ['#2a0a0a', '#5c1a0a', '#8b3010', '#c04e1a', '#ff6b35'],
  accentColor: 'rgba(255, 107, 53, 0.15)',
  warpGlow: 'rgba(255, 107, 53, 0.10)',
  textColor: 'rgba(255, 200, 180, 0.35)',
  fieldGradient: { peakColor: '#d946ef', intensity: 0.8 },
  anomalyAccent: '#ff6b35',
  anomalyHighlight: '#ff8c5a',
  peakMomentColor: '#ffb080',
  warpMultiplier: 1.3,
  dimming: -0.20,
  peakBrightnessBoost: 0.20,
};

const eventHorizonTheme: Theme = {
  name: 'event-horizon',
  backgroundTop: '#050505',
  backgroundBottom: '#0a0a0a',
  gridBase: '#0e0e0e',
  levels: ['#0e0e0e', '#181818', '#1e1e1e', '#262626', '#222222'],
  accentColor: 'rgba(255, 255, 255, 0.08)',
  warpGlow: 'rgba(255, 255, 255, 0.05)',
  textColor: 'rgba(200, 200, 200, 0.30)',
  fieldGradient: { peakColor: '#ffffff', intensity: 0.5 },
  anomalyAccent: '#222222',
  anomalyHighlight: '#2a2a2a',
  peakMomentColor: '#181818',
  warpMultiplier: 1.4,
  dimming: -0.25,
  peakBrightnessBoost: 0.05,
};

const paperLightTheme: Theme = {
  name: 'paper-light',
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
  warpMultiplier: 1.0,
  dimming: -0.08,
  peakBrightnessBoost: 0.15,
};

const themeMap = new Map<string, Theme>([
  ['github', githubTheme],
  ['deep-space', deepSpaceTheme],
  ['monochrome', monochromeTheme],
  ['solar-flare', solarFlareTheme],
  ['event-horizon', eventHorizonTheme],
  ['paper-light', paperLightTheme],
  // backward compatibility aliases
  ['dark', githubTheme],
  ['light', paperLightTheme],
]);

export function getTheme(name: ThemeName | 'dark' | 'light'): Theme {
  const theme = themeMap.get(name);
  if (!theme) {
    return githubTheme;
  }
  return theme;
}
