/**
 * Binary outcome effect size calculations
 * @module effect-size/binary
 */

import type { BinaryStudy, EffectSizeResult } from '../types';

/**
 * Apply continuity correction for zero cells
 */
function applyCorrection(
  ai: number, bi: number, ci: number, di: number,
  correction = 0.5
): { ai: number; bi: number; ci: number; di: number } {
  const needsCorrection = ai === 0 || bi === 0 || ci === 0 || di === 0;
  if (!needsCorrection) return { ai, bi, ci, di };

  return {
    ai: ai + correction,
    bi: bi + correction,
    ci: ci + correction,
    di: di + correction
  };
}

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
export function logOddsRatio(
  study: BinaryStudy,
  correction = 0.5
): EffectSizeResult {
  const { ai, bi, ci, di } = applyCorrection(
    study.ai, study.bi, study.ci, study.di, correction
  );

  // Log odds ratio: ln((ai * di) / (bi * ci))
  const yi = Math.log((ai * di) / (bi * ci));

  // Variance: 1/ai + 1/bi + 1/ci + 1/di
  const vi = 1 / ai + 1 / bi + 1 / ci + 1 / di;

  return {
    yi,
    vi,
    se: Math.sqrt(vi),
    id: study.id,
    study: study.study
  };
}

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
export function logRiskRatio(
  study: BinaryStudy,
  correction = 0.5
): EffectSizeResult {
  const { ai, bi, ci, di } = applyCorrection(
    study.ai, study.bi, study.ci, study.di, correction
  );

  const n1 = ai + bi; // Treatment total
  const n2 = ci + di; // Control total

  // Risk in treatment: ai / n1
  // Risk in control: ci / n2
  // Log RR: ln((ai/n1) / (ci/n2))
  const yi = Math.log((ai / n1) / (ci / n2));

  // Variance: 1/ai - 1/n1 + 1/ci - 1/n2
  const vi = (1 / ai) - (1 / n1) + (1 / ci) - (1 / n2);

  return {
    yi,
    vi,
    se: Math.sqrt(vi),
    id: study.id,
    study: study.study
  };
}

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
export function riskDifference(study: BinaryStudy): EffectSizeResult {
  const { ai, bi, ci, di } = study;

  const n1 = ai + bi; // Treatment total
  const n2 = ci + di; // Control total

  const p1 = ai / n1; // Risk in treatment
  const p2 = ci / n2; // Risk in control

  // Risk difference: p1 - p2
  const yi = p1 - p2;

  // Variance: p1(1-p1)/n1 + p2(1-p2)/n2
  const vi = (p1 * (1 - p1)) / n1 + (p2 * (1 - p2)) / n2;

  return {
    yi,
    vi,
    se: Math.sqrt(vi),
    id: study.id,
    study: study.study
  };
}

/**
 * Calculate Arcsine Risk Difference (Freeman-Tukey)
 *
 * @param study - Binary study data
 * @returns Effect size result
 */
export function arcsineRiskDifference(study: BinaryStudy): EffectSizeResult {
  const { ai, bi, ci, di } = study;

  const n1 = ai + bi;
  const n2 = ci + di;

  const p1 = ai / n1;
  const p2 = ci / n2;

  // Freeman-Tukey double arcsine transformation
  const asin1 = Math.asin(Math.sqrt(ai / (n1 + 1))) + Math.asin(Math.sqrt((ai + 1) / (n1 + 1)));
  const asin2 = Math.asin(Math.sqrt(ci / (n2 + 1))) + Math.asin(Math.sqrt((ci + 1) / (n2 + 1)));

  const yi = asin1 - asin2;
  const vi = 1 / (n1 + 0.5) + 1 / (n2 + 0.5);

  return {
    yi,
    vi,
    se: Math.sqrt(vi),
    id: study.id,
    study: study.study
  };
}

/**
 * Calculate Peto Odds Ratio components
 * Returns O-E (observed minus expected) and variance
 *
 * @param study - Binary study data
 * @returns Object with oe (O-E) and v (variance)
 */
export function petoComponents(study: BinaryStudy): { oe: number; v: number } {
  const { ai, bi, ci, di } = study;

  const n1 = ai + bi; // Treatment total
  const n2 = ci + di; // Control total
  const n = n1 + n2;  // Total
  const m = ai + ci;  // Total events

  // Expected events in treatment under null: n1 * m / n
  const E = (n1 * m) / n;

  // Observed - Expected
  const oe = ai - E;

  // Hypergeometric variance: n1 * n2 * m * (n - m) / (n^2 * (n-1))
  const v = (n1 * n2 * m * (n - m)) / (n * n * (n - 1));

  return { oe, v };
}

/**
 * Convert odds ratio to risk ratio
 */
export function orToRr(or: number, baselineRisk: number): number {
  return or / (1 - baselineRisk + baselineRisk * or);
}

/**
 * Convert odds ratio to risk difference
 */
export function orToRd(or: number, baselineRisk: number): number {
  const rr = orToRr(or, baselineRisk);
  return baselineRisk * (rr - 1);
}

/**
 * Convert log OR to log RR
 */
export function logOrToLogRr(logOr: number, baselineRisk: number): number {
  const or = Math.exp(logOr);
  const rr = orToRr(or, baselineRisk);
  return Math.log(rr);
}
