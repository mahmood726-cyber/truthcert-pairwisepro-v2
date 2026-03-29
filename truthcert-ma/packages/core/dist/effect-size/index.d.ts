/**
 * Effect Size Calculations
 * @module effect-size
 */
export * from './binary';
export * from './continuous';
import type { BinaryStudy, ContinuousStudy, EffectSizeResult, EffectMeasure } from '../types';
import { logOddsRatio, logRiskRatio, riskDifference, arcsineRiskDifference } from './binary';
import { standardizedMeanDifference, meanDifference, cohensD, glassDelta, correlationEffectSize, fisherZ, inverseFisherZ } from './continuous';
/**
 * Calculate effect size for a study based on measure type
 *
 * @param study - Study data (binary or continuous)
 * @param measure - Effect size measure
 * @param options - Additional options
 * @returns Effect size result
 *
 * @example
 * ```ts
 * // Binary outcome
 * const lor = calculateEffectSize(
 *   { ai: 10, bi: 90, ci: 20, di: 80 },
 *   'OR'
 * );
 *
 * // Continuous outcome
 * const smd = calculateEffectSize(
 *   { m1i: 25, sd1i: 5, n1i: 30, m2i: 20, sd2i: 6, n2i: 30 },
 *   'SMD'
 * );
 * ```
 */
export declare function calculateEffectSize(study: BinaryStudy | ContinuousStudy, measure: EffectMeasure, options?: {
    correction?: number;
}): EffectSizeResult;
/**
 * Calculate effect sizes for multiple studies
 *
 * @param studies - Array of studies
 * @param measure - Effect size measure
 * @param options - Additional options
 * @returns Array of effect size results
 */
export declare function calculateEffectSizes(studies: (BinaryStudy | ContinuousStudy)[], measure: EffectMeasure, options?: {
    correction?: number;
}): EffectSizeResult[];
/**
 * EffectSize namespace for convenient access
 */
export declare const EffectSize: {
    logOddsRatio: typeof logOddsRatio;
    logRiskRatio: typeof logRiskRatio;
    riskDifference: typeof riskDifference;
    arcsineRiskDifference: typeof arcsineRiskDifference;
    standardizedMeanDifference: typeof standardizedMeanDifference;
    meanDifference: typeof meanDifference;
    cohensD: typeof cohensD;
    glassDelta: typeof glassDelta;
    smd: typeof standardizedMeanDifference;
    md: typeof meanDifference;
    correlation: typeof correlationEffectSize;
    fisherZ: typeof fisherZ;
    inverseFisherZ: typeof inverseFisherZ;
    calculate: typeof calculateEffectSize;
    calculateMany: typeof calculateEffectSizes;
};
//# sourceMappingURL=index.d.ts.map