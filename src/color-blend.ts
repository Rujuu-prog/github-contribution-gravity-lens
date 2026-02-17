export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
}

export function blendColors(color1: string, color2: string, ratio: number): string {
  const [r1, g1, b1] = hexToRgb(color1);
  const [r2, g2, b2] = hexToRgb(color2);
  return rgbToHex(
    r1 + (r2 - r1) * ratio,
    g1 + (g2 - g1) * ratio,
    b1 + (b2 - b1) * ratio,
  );
}

export function computeCellColor(
  baseColor: string,
  peakColor: string,
  warpIntensity: number,
  warpProgress: number,
  gradientIntensity: number,
): string {
  const blendRatio = warpIntensity * warpProgress * gradientIntensity;
  if (blendRatio <= 0) return baseColor;
  return blendColors(baseColor, peakColor, blendRatio);
}

export function computeAnomalyColor(
  baseColor: string,
  accentColor: string,
  brightnessProgress: number,
  maxOpacity: number = 0.15,
): string {
  const blendRatio = brightnessProgress * maxOpacity;
  if (blendRatio <= 0) return baseColor;
  return blendColors(baseColor, accentColor, blendRatio);
}
