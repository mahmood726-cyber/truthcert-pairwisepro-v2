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
export declare function dl(yi: number[], vi: number[]): number;
export default dl;
//# sourceMappingURL=dl.d.ts.map