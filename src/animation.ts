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
 * 5フェーズのワープ進行度を返す（改訂版）
 * Phase 1 (0〜0.25   / 0-1.0s):     静止 → 0
 * Phase 2 (0.25〜0.325 / 1.0-1.3s):  明度のみ → warp不動 = 0
 * Phase 3 (0.325〜0.625 / 1.3-2.5s): レンズ → 0→1
 * Phase 4 (0.625〜0.80 / 2.5-3.2s):  干渉 → 1
 * Phase 5 (0.80〜1.00 / 3.2-4.0s):   復元 → 1→0
 */
export function getWarpProgress(time: number, duration: number): number {
  const t = ((time % duration) + duration) % duration;
  const ratio = t / duration;

  // Phase 1: 静止 (0〜0.25)
  if (ratio < 0.25) {
    return 0;
  }

  // Phase 2: 明度のみ (0.25〜0.325) → warp不動
  if (ratio < 0.325) {
    return 0;
  }

  // Phase 3: レンズ (0.325〜0.625) → 0→1
  if (ratio < 0.625) {
    const phaseT = (ratio - 0.325) / 0.3;
    return cubicBezierEase(phaseT);
  }

  // Phase 4: 干渉ホールド (0.625〜0.80)
  if (ratio < 0.80) {
    return 1;
  }

  // Phase 5: 復元 (0.80〜1.00) → 1→0
  const phaseT = (ratio - 0.80) / 0.20;
  return 1 - cubicBezierEase(phaseT);
}

/**
 * 5フェーズの明度進行度を返す
 * Phase 1 (0〜0.25):     0
 * Phase 2 (0.25〜0.325):  0→1 (eased)
 * Phase 3 (0.325〜0.625): 1
 * Phase 4 (0.625〜0.80):  1
 * Phase 5 (0.80〜1.00):   1→0 (eased)
 */
export function getBrightnessProgress(time: number, duration: number): number {
  const t = ((time % duration) + duration) % duration;
  const ratio = t / duration;

  // Phase 1: 静止 (0〜0.25)
  if (ratio < 0.25) {
    return 0;
  }

  // Phase 2: 明度 (0.25〜0.325) → 0→1
  if (ratio < 0.325) {
    const phaseT = (ratio - 0.25) / 0.075;
    return cubicBezierEase(phaseT);
  }

  // Phase 3-4: ホールド (0.325〜0.80)
  if (ratio < 0.80) {
    return 1;
  }

  // Phase 5: 復元 (0.80〜1.00) → 1→0
  const phaseT = (ratio - 0.80) / 0.20;
  return 1 - cubicBezierEase(phaseT);
}
