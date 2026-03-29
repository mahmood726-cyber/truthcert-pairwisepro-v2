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
export declare function reml(yi: number[], vi: number[], maxIter?: number, tol?: number): number;
export default reml;
//# sourceMappingURL=reml.d.ts.map