/**
 * REML (Restricted Maximum Likelihood) estimator for tau-squared
 * @module pooling/estimators/reml
 */

/**
 * Estimate tau-squared using REML
 *
 * Uses Fisher scoring algorithm (iterative)
 *
 * @param yi - Effect sizes
 * @param vi - Variances
 * @param maxIter - Maximum iterations (default: 100)
 * @param tol - Convergence tolerance (default: 1e-5)
 * @returns Estimated tau-squared
 *
 * @example
 * ```ts
 * const yi = [-0.5, -0.3, -0.4, -0.6, -0.2];
 * const vi = [0.1, 0.12, 0.08, 0.15, 0.09];
 * const tau2 = reml(yi, vi);
 * ```
 */
export function reml(
  yi: number[],
  vi: number[],
  maxIter = 100,
  tol = 1e-5
): number {
  const k = yi.length;
  if (k < 2) return 0;

  // Initial estimate using DL
  let tau2 = dlInitial(yi, vi);

  for (let iter = 0; iter < maxIter; iter++) {
    // Calculate weights
    const wi = vi.map(v => 1 / (v + tau2));
    const sumW = wi.reduce((a, b) => a + b, 0);
    const sumW2 = wi.reduce((a, b) => a + b * b, 0);

    // Weighted mean
    const muHat = wi.reduce((sum, w, i) => sum + w * yi[i], 0) / sumW;

    // First derivative (score)
    let U = -0.5 * sumW + 0.5 * sumW2 / sumW;
    U += 0.5 * wi.reduce((sum, w, i) => sum + w * w * (yi[i] - muHat) ** 2, 0);

    // Fisher information
    const I = 0.5 * (sumW2 - sumW2 * sumW2 / (sumW * sumW) / sumW);

    // Newton-Raphson update
    const tau2New = Math.max(0, tau2 + U / I);

    // Check convergence
    if (Math.abs(tau2New - tau2) < tol) {
      return tau2New;
    }

    tau2 = tau2New;
  }

  return Math.max(0, tau2);
}

/**
 * DerSimonian-Laird initial estimate
 */
function dlInitial(yi: number[], vi: number[]): number {
  const k = yi.length;
  const wi = vi.map(v => 1 / v);
  const sumW = wi.reduce((a, b) => a + b, 0);
  const sumW2 = wi.reduce((a, b) => a + b * b, 0);

  // Fixed-effects estimate
  const thetaFE = wi.reduce((sum, w, i) => sum + w * yi[i], 0) / sumW;

  // Q statistic
  const Q = wi.reduce((sum, w, i) => sum + w * (yi[i] - thetaFE) ** 2, 0);

  // C
  const C = sumW - sumW2 / sumW;

  // DL estimate
  return Math.max(0, (Q - (k - 1)) / C);
}

export default reml;
