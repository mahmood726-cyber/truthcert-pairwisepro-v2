/**
 * Binary outcome effect size calculations
 * @module effect-size/binary
 */
import type { BinaryStudy, EffectSizeResult } from '../types';
/**
 * Calculate Log Odds Ratio
 *
 * @param study - Binary study data (2x2 table)
 * @param correction - Continuity correction (default: 0.5)
 * @returns Effect size result with yi, vi, se
 *
 * @example
 * ```ts
 * const result = logOddsRatio({ ai: 10, bi: 90, ci: 20, di: 80 });
 * // { yi: -0.811, vi: 0.156, se: 0.395 }
 * ```
 */
export declare function logOddsRatio(study: BinaryStudy, correction?: number): EffectSizeResult;
/**
 * Calculate Log Risk Ratio (Relative Risk)
 *
 * @param study - Binary study data
 * @param correction - Continuity correction
 * @returns Effect size result
 *
 * @example
 * ```ts
 * const result = logRiskRatio({ ai: 10, bi: 90, ci: 20, di: 80 });
 * // { yi: -0.693, vi: 0.125, se: 0.354 }
 * ```
 */
export declare function logRiskRatio(study: BinaryStudy, correction?: number): EffectSizeResult;
/**
 * Calculate Risk Difference
 *
 * @param study - Binary study data
 * @returns Effect size result
 *
 * @example
 * ```ts
 * const result = riskDifference({ ai: 10, bi: 90, ci: 20, di: 80 });
 * // { yi: -0.1, vi: 0.0028, se: 0.053 }
 * ```
 */
export declare function riskDifference(study: BinaryStudy): EffectSizeResult;
/**
 * Calculate Arcsine Risk Difference (Freeman-Tukey)
 *
 * @param study - Binary study data
 * @returns Effect size result
 */
export declare function arcsineRiskDifference(study: BinaryStudy): EffectSizeResult;
/**
 * Calculate Peto Odds Ratio components
 * Returns O-E (observed minus expected) and variance
 *
 * @param study - Binary study data
 * @returns Object with oe (O-E) and v (variance)
 */
export declare function petoComponents(study: BinaryStudy): {
    oe: number;
    v: number;
};
/**
 * Convert odds ratio to risk ratio
 */
export declare function orToRr(or: number, baselineRisk: number): number;
/**
 * Convert odds ratio to risk difference
 */
export declare function orToRd(or: number, baselineRisk: number): number;
/**
 * Convert log OR to log RR
 */
export declare function logOrToLogRr(logOr: number, baselineRisk: number): number;
//# sourceMappingURL=binary.d.ts.map