/**
 * Effect Size Calculations
 * @module effect-size
 */

export * from './binary';
export * from './continuous';

import type { BinaryStudy, ContinuousStudy, EffectSizeResult, EffectMeasure } from '../types';
import {
  logOddsRatio,
  logRiskRatio,
  riskDifference,
  arcsineRiskDifference
} from './binary';
import {
  standardizedMeanDifference,
  meanDifference,
  cohensD,
  glassDelta,
  correlationEffectSize,
  fisherZ,
  inverseFisherZ
} from './continuous';

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
export function calculateEffectSize(
  study: BinaryStudy | ContinuousStudy,
  measure: EffectMeasure,
  options: { correction?: number } = {}
): EffectSizeResult {
  const { correction = 0.5 } = options;

  switch (measure) {
    case 'OR':
    case 'logOR':
      return logOddsRatio(study as BinaryStudy, correction);

    case 'RR':
    case 'logRR':
      return logRiskRatio(study as BinaryStudy, correction);

    case 'RD':
      return riskDifference(study as BinaryStudy);

    case 'SMD':
      return standardizedMeanDifference(study as ContinuousStudy);

    case 'MD':
      return meanDifference(study as ContinuousStudy);

    case 'COR':
      // Assume study has 'r' and 'n' properties
      const s = study as any;
      if ('r' in s && 'n' in s) {
        return correlationEffectSize(s.r, s.n, false);
      }
      throw new Error('Correlation requires r and n');

    case 'ZCOR':
      const sz = study as any;
      if ('r' in sz && 'n' in sz) {
        return correlationEffectSize(sz.r, sz.n, true);
      }
      throw new Error('Fisher z requires r and n');

    default:
      throw new Error(`Unknown effect measure: ${measure}`);
  }
}

/**
 * Calculate effect sizes for multiple studies
 *
 * @param studies - Array of studies
 * @param measure - Effect size measure
 * @param options - Additional options
 * @returns Array of effect size results
 */
export function calculateEffectSizes(
  studies: (BinaryStudy | ContinuousStudy)[],
  measure: EffectMeasure,
  options: { correction?: number } = {}
): EffectSizeResult[] {
  return studies.map(study => calculateEffectSize(study, measure, options));
}

/**
 * EffectSize namespace for convenient access
 */
export const EffectSize = {
  // Binary outcomes
  logOddsRatio,
  logRiskRatio,
  riskDifference,
  arcsineRiskDifference,

  // Continuous outcomes
  standardizedMeanDifference,
  meanDifference,
  cohensD,
  glassDelta,
  smd: standardizedMeanDifference, // alias
  md: meanDifference, // alias

  // Correlations
  correlation: correlationEffectSize,
  fisherZ,
  inverseFisherZ,

  // Generic
  calculate: calculateEffectSize,
  calculateMany: calculateEffectSizes
};
