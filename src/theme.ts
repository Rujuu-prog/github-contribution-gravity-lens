import { Theme } from './types';

const darkTheme: Theme = {
  name: 'dark',
  background: '#0d1117',
  gridBase: '#161b22',
  levels: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
  warpGlow: 'rgba(120, 255, 180, 0.08)',
  textColor: 'rgba(255, 255, 255, 0.5)',
};

const lightTheme: Theme = {
  name: 'light',
  background: '#ffffff',
  gridBase: '#ebedf0',
  levels: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
  warpGlow: 'rgba(0, 120, 60, 0.08)',
  textColor: 'rgba(0, 0, 0, 0.5)',
};

export function getTheme(name: 'dark' | 'light'): Theme {
  return name === 'dark' ? darkTheme : lightTheme;
}
