/**
 * Continuous outcome effect size calculations
 * @module effect-size/continuous
 */
import type { ContinuousStudy, EffectSizeResult } from '../types';
/**
 * Calculate Standardized Mean Difference (Hedges' g)
 *
 * SMD = (m1 - m2) / pooled_sd * J
 * where J is Hedges' correction for small sample bias
 *
 * @param study - Continuous study data
 * @returns Effect size result with yi, vi, se
 *
 * @example
 * ```ts
 * const result = standardizedMeanDifference({
 *   m1i: 25, sd1i: 5, n1i: 30,
 *   m2i: 20, sd2i: 6, n2i: 30
 * });
 * // { yi: 0.89, vi: 0.072, se: 0.268 }
 * ```
 */
export declare function standardizedMeanDifference(study: ContinuousStudy): EffectSizeResult;
/**
 * Alias for standardizedMeanDifference (Hedges' g)
 */
export declare const hedgesG: typeof standardizedMeanDifference;
/**
 * Calculate Cohen's d (uncorrected SMD)
 *
 * @param study - Continuous study data
 * @returns Effect size result
 */
export declare function cohensD(study: ContinuousStudy): EffectSizeResult;
/**
 * Calculate Mean Difference (unstandardized)
 *
 * @param study - Continuous study data
 * @returns Effect size result
 *
 * @example
 * ```ts
 * const result = meanDifference({
 *   m1i: 25, sd1i: 5, n1i: 30,
 *   m2i: 20, sd2i: 6, n2i: 30
 * });
 * // { yi: 5.0, vi: 1.02, se: 1.01 }
 * ```
 */
export declare function meanDifference(study: ContinuousStudy): EffectSizeResult;
/**
 * Calculate Glass's delta
 * Uses control group SD as standardizer
 *
 * @param study - Continuous study data
 * @returns Effect size result
 */
export declare function glassDelta(study: ContinuousStudy): EffectSizeResult;
/**
 * Calculate correlation coefficient from t-statistic and df
 */
export declare function correlationFromT(t: number, df: number): EffectSizeResult;
/**
 * Calculate Fisher's z transformation
 */
export declare function fisherZ(r: number): number;
/**
 * Inverse Fisher's z transformation
 */
export declare function inverseFisherZ(z: number): number;
/**
 * Calculate effect size from correlation
 *
 * @param r - Correlation coefficient
 * @param n - Sample size
 * @param transform - Whether to use Fisher's z (default: true)
 * @returns Effect size result
 */
export declare function correlationEffectSize(r: number, n: number, transform?: boolean): EffectSizeResult;
/**
 * Convert SMD to correlation coefficient
 */
export declare function smdToCorrelation(d: number, n1: number, n2: number): number;
/**
 * Convert correlation to SMD
 */
export declare function correlationToSmd(r: number): number;
/**
 * Convert log odds ratio to SMD (Chinn 2000)
 */
export declare function logOrToSmd(logOr: number): number;
/**
 * Convert SMD to log odds ratio
 */
export declare function smdToLogOr(d: number): number;
//# sourceMappingURL=continuous.d.ts.map