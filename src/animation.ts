/**
 * cubic-bezier(0.4, 0.0, 0.2, 1) に基づくイージング関数
 * Newton-Raphson法でベジエ曲線のt値を近似
 */
export function cubicBezierEase(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;

  // cubic-bezier(0.4, 0.0, 0.2, 1.0)
  const p1x = 0.4, p1y = 0.0;
  const p2x = 0.2, p2y = 1.0;

  // x(t) = 3*p1x*(1-t)^2*t + 3*p2x*(1-t)*t^2 + t^3
  function bezierX(u: number): number {
    return 3 * p1x * (1 - u) * (1 - u) * u + 3 * p2x * (1 - u) * u * u + u * u * u;
  }

  // x'(t)
  function bezierXDerivative(u: number): number {
    return 3 * p1x * (1 - 3 * u + 2 * u * u) + 3 * p2x * (2 * u - 3 * u * u) + 3 * u * u;
  }

  // y(t) = 3*p1y*(1-t)^2*t + 3*p2y*(1-t)*t^2 + t^3
  function bezierY(u: number): number {
    return 3 * p1y * (1 - u) * (1 - u) * u + 3 * p2y * (1 - u) * u * u + u * u * u;
  }

  // Newton-Raphson: x(u) = t を解く
  let u = t;
  for (let i = 0; i < 8; i++) {
    const xError = bezierX(u) - t;
    const dx = bezierXDerivative(u);
    if (Math.abs(dx) < 1e-10) break;
    u -= xError / dx;
    u = Math.max(0, Math.min(1, u));
  }

  return bezierY(u);
}

/**
 * x位置ベースの発火遅延を算出
 * col=0 → delay=0, col=maxCol → delay=maxDelay
 */
export function computeActivationDelay(col: number, maxCol: number, maxDelay: number = 6): number {
  if (maxCol === 0) return 0;
  return (col / maxCol) * maxDelay;
}

/**
 * 各異常点のワープ進行度（独立タイムライン）
 *
 * fireTime = 2 + activationDelay
 * warpStart = fireTime + 0.5
 * warpRampEnd = warpStart + 2.0
 * restoreStart = 11
 * restoreEnd = 14 (= duration)
 *
 * 0 → fireTime+0.5: 0
 * warpStart → warpRampEnd: 0→1 (eased)
 * warpRampEnd → restoreStart: 1 (hold)
 * restoreStart → restoreEnd: 1→0 (eased)
 */
export function getAnomalyWarpProgress(time: number, duration: number, activationDelay: number): number {
  const t = ((time % duration) + duration) % duration;

  const fireTime = 2 + activationDelay;
  const warpStart = fireTime + 0.5;
  const warpRampEnd = warpStart + 2.0;
  const restoreStart = 11;
  const restoreEnd = duration; // 14

  // Before warp start
  if (t < warpStart) return 0;

  // Warp ramp: 0→1
  if (t < warpRampEnd) {
    const phaseT = (t - warpStart) / (warpRampEnd - warpStart);
    return cubicBezierEase(phaseT);
  }

  // Hold at max
  if (t < restoreStart) return 1;

  // Restore: 1→0
  if (t < restoreEnd) {
    const phaseT = (t - restoreStart) / (restoreEnd - restoreStart);
    return 1 - cubicBezierEase(phaseT);
  }

  return 0;
}

/**
 * 各異常点の明度進行度（独立タイムライン）
 *
 * brightStart = 2 + activationDelay
 * brightEnd = brightStart + 1.2
 * restoreStart = 11
 * restoreEnd = 14 (= duration)
 */
export function getAnomalyBrightnessProgress(time: number, duration: number, activationDelay: number): number {
  const t = ((time % duration) + duration) % duration;

  const brightStart = 2 + activationDelay;
  const brightEnd = brightStart + 1.2;
  const restoreStart = 11;
  const restoreEnd = duration;

  // Before brightness start
  if (t < brightStart) return 0;

  // Brightness ramp: 0→1
  if (t < brightEnd) {
    const phaseT = (t - brightStart) / (brightEnd - brightStart);
    return cubicBezierEase(phaseT);
  }

  // Hold
  if (t < restoreStart) return 1;

  // Restore: 1→0
  if (t < restoreEnd) {
    const phaseT = (t - restoreStart) / (restoreEnd - restoreStart);
    return 1 - cubicBezierEase(phaseT);
  }

  return 0;
}

/**
 * 干渉パルス波形（14sモデル）
 * 8-11s: sin(π * (t-8)/3) パルス
 * それ以外: 0
 */
export function getInterferenceProgress(time: number, duration: number): number {
  const t = ((time % duration) + duration) % duration;

  const interferenceStart = 8;
  const interferenceEnd = 11;

  if (t < interferenceStart || t >= interferenceEnd) {
    return 0;
  }

  const phaseT = (t - interferenceStart) / (interferenceEnd - interferenceStart);
  return Math.sin(Math.PI * phaseT);
}
