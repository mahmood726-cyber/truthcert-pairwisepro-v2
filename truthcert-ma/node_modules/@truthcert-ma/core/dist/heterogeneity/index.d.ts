/**
 * Heterogeneity analysis
 * @module heterogeneity
 */
import type { EffectSizeResult, HeterogeneityResult, ConfidenceInterval, QStatistic } from '../types';
/**
 * Calculate Q statistic (Cochran's Q)
 *
 * @param effects - Effect sizes with variances
 * @returns Q statistic with df and p-value
 */
export declare function calculateQ(effects: EffectSizeResult[]): QStatistic;
/** Backward-compatible alias for calculateQ */
export declare const calculateQStatistic: typeof calculateQ;
/**
 * Calculate I² statistic (inconsistency)
 *
 * I² = max(0, (Q - df) / Q × 100)
 *
 * @param Q - Q statistic value
 * @param df - Degrees of freedom
 * @returns I² percentage (0-100)
 */
export declare function calculateI2(Q: number, df: number): number;
/**
 * Calculate confidence interval for I²
 *
 * Uses the test-based method
 */
export declare function calculateI2CI(Q: number, k: number, level?: number): ConfidenceInterval;
/**
 * Calculate H² statistic
 *
 * H² = Q / (k - 1)
 * H = sqrt(H²) represents the ratio of total to sampling variance
 */
export declare function calculateH2(Q: number, df: number): number;
/**
 * Interpret I² value
 *
 * Based on Higgins et al. (2003) thresholds
 */
export declare function interpretI2(I2: number): string;
/**
 * Calculate prediction interval
 *
 * Represents the range where 95% of true effects are expected to fall
 *
 * @param theta - Pooled effect
 * @param tau2 - Between-study variance
 * @param se - Standard error of pooled effect
 * @param k - Number of studies
 * @param level - Confidence level
 */
export declare function calculatePredictionInterval(theta: number, tau2: number, se: number, k: number, level?: number): ConfidenceInterval;
/** Backward-compatible alias for calculatePredictionInterval */
export declare const predictionInterval: typeof calculatePredictionInterval;
/**
 * Calculate tau (standard deviation of true effects)
 */
export declare function calculateTau(tau2: number): number;
/**
 * Full heterogeneity analysis
 *
 * @param effects - Effect sizes
 * @param tau2 - Between-study variance (from pooling)
 * @param pooledTheta - Pooled effect estimate
 * @param pooledSE - Standard error of pooled estimate
 * @returns Complete heterogeneity results
 */
export declare function analyzeHeterogeneity(effects: EffectSizeResult[], tau2: number, pooledTheta: number, pooledSE: number): HeterogeneityResult;
/**
 * Heterogeneity namespace
 */
export declare const Heterogeneity: {
    calculateQ: typeof calculateQ;
    calculateI2: typeof calculateI2;
    calculateI2CI: typeof calculateI2CI;
    calculateH2: typeof calculateH2;
    calculatePredictionInterval: typeof calculatePredictionInterval;
    calculateTau: typeof calculateTau;
    interpretI2: typeof interpretI2;
    analyze: typeof analyzeHeterogeneity;
};
//# sourceMappingURL=index.d.ts.map