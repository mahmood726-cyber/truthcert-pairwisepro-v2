/**
 * Tau-squared estimators
 * @module pooling/estimators
 */

import { reml } from './reml';
import { dl } from './dl';
export { reml, dl };

import type { Tau2Estimator } from '../../types';

/**
 * Paule-Mandel estimator for tau-squared
 * Iterative method that solves Q(tau²) = k-1
 */
export function pm(yi: number[], vi: number[], maxIter = 100, tol = 1e-5): number {
  const k = yi.length;
  if (k < 2) return 0;

  let tau2 = dl(yi, vi); // Start with DL estimate

  for (let iter = 0; iter < maxIter; iter++) {
    const wi = vi.map(v => 1 / (v + tau2));
    const sumW = wi.reduce((a, b) => a + b, 0);
    const theta = wi.reduce((s, w, i) => s + w * yi[i], 0) / sumW;
    const Q = wi.reduce((s, w, i) => s + w * (yi[i] - theta) ** 2, 0);

    // Target: Q = k - 1
    const target = k - 1;
    const diff = Q - target;

    if (Math.abs(diff) < tol) break;

    // Update tau2 (simple iteration)
    const sumW2 = wi.reduce((a, b) => a + b * b, 0);
    const dQ = -sumW2 + wi.reduce((s, w, i) => s + w * w * (yi[i] - theta) ** 2, 0) * 2 / sumW;

    tau2 = Math.max(0, tau2 - diff / dQ * 0.5);
  }

  return Math.max(0, tau2);
}

/**
 * Sidik-Jonkman estimator
 */
export function sj(yi: number[], vi: number[]): number {
  const k = yi.length;
  if (k < 2) return 0;

  // Initial estimate using sample variance
  const meanY = yi.reduce((a, b) => a + b, 0) / k;
  const varY = yi.reduce((s, y) => s + (y - meanY) ** 2, 0) / (k - 1);
  const meanV = vi.reduce((a, b) => a + b, 0) / k;

  let tau2 = Math.max(0, varY - meanV);

  // Iterative refinement
  for (let iter = 0; iter < 50; iter++) {
    const wi = vi.map(v => 1 / (v + tau2));
    const sumW = wi.reduce((a, b) => a + b, 0);
    const theta = wi.reduce((s, w, i) => s + w * yi[i], 0) / sumW;

    const tau2New = wi.reduce((s, w, i) => s + w * w * ((yi[i] - theta) ** 2 - vi[i]), 0) /
                    wi.reduce((s, w) => s + w * w, 0);

    if (Math.abs(tau2New - tau2) < 1e-5) break;
    tau2 = Math.max(0, tau2New);
  }

  return Math.max(0, tau2);
}

/**
 * Hunter-Schmidt estimator
 */
export function hs(yi: number[], vi: number[]): number {
  const k = yi.length;
  if (k < 2) return 0;

  // Simple sample-based estimate
  const meanY = yi.reduce((a, b) => a + b, 0) / k;
  const varY = yi.reduce((s, y) => s + (y - meanY) ** 2, 0) / (k - 1);
  const meanV = vi.reduce((a, b) => a + b, 0) / k;

  return Math.max(0, varY - meanV);
}

/**
 * Hedges estimator (HE)
 */
export function he(yi: number[], vi: number[]): number {
  const k = yi.length;
  if (k < 2) return 0;

  // Unweighted mean
  const meanY = yi.reduce((a, b) => a + b, 0) / k;

  // Q* using unweighted mean
  const Qstar = yi.reduce((s, y, i) => s + (y - meanY) ** 2 / vi[i], 0);

  // S = sum(1/vi)
  const S = vi.reduce((s, v) => s + 1 / v, 0);
  const S2 = vi.reduce((s, v) => s + 1 / (v * v), 0);

  const C = S - S2 / S;

  return Math.max(0, (Qstar - (k - 1)) / C);
}

/**
 * Empirical Bayes (EB) estimator
 */
export function eb(yi: number[], vi: number[]): number {
  const k = yi.length;
  if (k < 2) return 0;

  // Start with DL
  let tau2 = dl(yi, vi);

  // EB adjustment
  for (let iter = 0; iter < 50; iter++) {
    const wi = vi.map(v => 1 / (v + tau2));
    const sumW = wi.reduce((a, b) => a + b, 0);
    const theta = wi.reduce((s, w, i) => s + w * yi[i], 0) / sumW;

    const num = yi.reduce((s, y, i) => s + ((y - theta) ** 2 - vi[i]) / ((vi[i] + tau2) ** 2), 0);
    const den = yi.reduce((s, _, i) => s + 1 / ((vi[i] + tau2) ** 2), 0);

    const tau2New = Math.max(0, num / den);

    if (Math.abs(tau2New - tau2) < 1e-5) break;
    tau2 = tau2New;
  }

  return Math.max(0, tau2);
}

/**
 * Maximum Likelihood (ML) estimator
 */
export function ml(yi: number[], vi: number[], maxIter = 100, tol = 1e-5): number {
  const k = yi.length;
  if (k < 2) return 0;

  let tau2 = dl(yi, vi);

  for (let iter = 0; iter < maxIter; iter++) {
    const wi = vi.map(v => 1 / (v + tau2));
    const sumW = wi.reduce((a, b) => a + b, 0);
    const theta = wi.reduce((s, w, i) => s + w * yi[i], 0) / sumW;

    // First derivative
    let U = -0.5 * wi.reduce((s, w) => s + w, 0);
    U += 0.5 * wi.reduce((s, w, i) => s + w * w * (yi[i] - theta) ** 2, 0);

    // Second derivative (Fisher information)
    const I = 0.5 * wi.reduce((s, w) => s + w * w, 0);

    const tau2New = Math.max(0, tau2 + U / I);

    if (Math.abs(tau2New - tau2) < tol) break;
    tau2 = tau2New;
  }

  return Math.max(0, tau2);
}

/**
 * Get tau-squared estimator function by name
 */
export function getEstimator(method: Tau2Estimator): (yi: number[], vi: number[]) => number {
  const estimators: Record<Tau2Estimator, (yi: number[], vi: number[]) => number> = {
    REML: reml,
    DL: dl,
    PM: pm,
    SJ: sj,
    HS: hs,
    HE: he,
    EB: eb,
    ML: ml
  };

  const estimator = estimators[method];
  if (!estimator) {
    throw new Error(`Unknown estimator: ${method}`);
  }

  return estimator;
}
