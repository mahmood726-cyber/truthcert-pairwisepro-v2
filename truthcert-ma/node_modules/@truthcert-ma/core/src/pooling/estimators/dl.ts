/**
 * DerSimonian-Laird estimator for tau-squared
 * @module pooling/estimators/dl
 */

/**
 * Estimate tau-squared using DerSimonian-Laird method
 *
 * The most commonly used method. Non-iterative, closed-form solution.
 *
 * tau² = max(0, (Q - df) / C)
 *
 * @param yi - Effect sizes
 * @param vi - Variances
 * @returns Estimated tau-squared
 */
export function dl(yi: number[], vi: number[]): number {
  const k = yi.length;
  if (k < 2) return 0;

  // Fixed-effects weights
  const wi = vi.map(v => 1 / v);
  const sumW = wi.reduce((a, b) => a + b, 0);
  const sumW2 = wi.reduce((a, b) => a + b * b, 0);

  // Fixed-effects estimate
  const thetaFE = wi.reduce((sum, w, i) => sum + w * yi[i], 0) / sumW;

  // Q statistic (Cochran's Q)
  const Q = wi.reduce((sum, w, i) => sum + w * (yi[i] - thetaFE) ** 2, 0);

  // Degrees of freedom
  const df = k - 1;

  // C (scaling factor)
  const C = sumW - sumW2 / sumW;

  // DL estimate (truncated at 0)
  return Math.max(0, (Q - df) / C);
}

export default dl;
