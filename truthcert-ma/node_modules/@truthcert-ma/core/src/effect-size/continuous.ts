/**
 * Continuous outcome effect size calculations
 * @module effect-size/continuous
 */

import type { ContinuousStudy, EffectSizeResult } from '../types';

/**
 * Calculate Hedges' g correction factor
 * J = 1 - 3/(4*df - 1)
 */
function hedgesCorrection(df: number): number {
  return 1 - 3 / (4 * df - 1);
}

/**
 * Calculate pooled standard deviation
 */
function pooledSD(
  sd1: number, n1: number,
  sd2: number, n2: number
): number {
  return Math.sqrt(
    ((n1 - 1) * sd1 * sd1 + (n2 - 1) * sd2 * sd2) / (n1 + n2 - 2)
  );
}

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
export function standardizedMeanDifference(
  study: ContinuousStudy
): EffectSizeResult {
  const { m1i, sd1i, n1i, m2i, sd2i, n2i } = study;

  // Pooled standard deviation
  const sdPooled = pooledSD(sd1i, n1i, sd2i, n2i);

  // Degrees of freedom
  const df = n1i + n2i - 2;

  // Hedges' correction factor
  const J = hedgesCorrection(df);

  // Raw Cohen's d
  const d = (m1i - m2i) / sdPooled;

  // Hedges' g (bias-corrected)
  const yi = d * J;

  // Variance of Hedges' g
  // vi = (n1 + n2)/(n1*n2) + g^2/(2*(n1+n2))
  const vi = (n1i + n2i) / (n1i * n2i) + (yi * yi) / (2 * (n1i + n2i));

  return {
    yi,
    vi,
    se: Math.sqrt(vi),
    id: study.id,
    study: study.study,
    n: n1i + n2i
  };
}

/**
 * Alias for standardizedMeanDifference (Hedges' g)
 */
export const hedgesG = standardizedMeanDifference;

/**
 * Calculate Cohen's d (uncorrected SMD)
 *
 * @param study - Continuous study data
 * @returns Effect size result
 */
export function cohensD(study: ContinuousStudy): EffectSizeResult {
  const { m1i, sd1i, n1i, m2i, sd2i, n2i } = study;

  // Pooled standard deviation
  const sdPooled = pooledSD(sd1i, n1i, sd2i, n2i);

  // Cohen's d
  const yi = (m1i - m2i) / sdPooled;

  // Variance
  const vi = (n1i + n2i) / (n1i * n2i) + (yi * yi) / (2 * (n1i + n2i));

  return {
    yi,
    vi,
    se: Math.sqrt(vi),
    id: study.id,
    study: study.study,
    n: n1i + n2i
  };
}

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
export function meanDifference(study: ContinuousStudy): EffectSizeResult {
  const { m1i, sd1i, n1i, m2i, sd2i, n2i } = study;

  // Raw mean difference
  const yi = m1i - m2i;

  // Variance: var1/n1 + var2/n2
  const vi = (sd1i * sd1i) / n1i + (sd2i * sd2i) / n2i;

  return {
    yi,
    vi,
    se: Math.sqrt(vi),
    id: study.id,
    study: study.study,
    n: n1i + n2i
  };
}

/**
 * Calculate Glass's delta
 * Uses control group SD as standardizer
 *
 * @param study - Continuous study data
 * @returns Effect size result
 */
export function glassDelta(study: ContinuousStudy): EffectSizeResult {
  const { m1i, sd1i, n1i, m2i, sd2i, n2i } = study;

  // Glass's delta uses control SD only
  const yi = (m1i - m2i) / sd2i;

  // Variance approximation
  const vi = (n1i + n2i) / (n1i * n2i) + (yi * yi) / (2 * (n2i - 1));

  return {
    yi,
    vi,
    se: Math.sqrt(vi),
    id: study.id,
    study: study.study,
    n: n1i + n2i
  };
}

/**
 * Calculate correlation coefficient from t-statistic and df
 */
export function correlationFromT(t: number, df: number): EffectSizeResult {
  const r = t / Math.sqrt(t * t + df);
  const vi = (1 - r * r) ** 2 / (df + 1);

  return {
    yi: r,
    vi,
    se: Math.sqrt(vi)
  };
}

/**
 * Calculate Fisher's z transformation
 */
export function fisherZ(r: number): number {
  return 0.5 * Math.log((1 + r) / (1 - r));
}

/**
 * Inverse Fisher's z transformation
 */
export function inverseFisherZ(z: number): number {
  return (Math.exp(2 * z) - 1) / (Math.exp(2 * z) + 1);
}

/**
 * Calculate effect size from correlation
 *
 * @param r - Correlation coefficient
 * @param n - Sample size
 * @param transform - Whether to use Fisher's z (default: true)
 * @returns Effect size result
 */
export function correlationEffectSize(
  r: number,
  n: number,
  transform = true
): EffectSizeResult {
  if (transform) {
    // Fisher's z transformation
    const z = fisherZ(r);
    const vi = 1 / (n - 3);

    return {
      yi: z,
      vi,
      se: Math.sqrt(vi),
      n
    };
  } else {
    // Raw correlation
    const vi = (1 - r * r) ** 2 / (n - 1);

    return {
      yi: r,
      vi,
      se: Math.sqrt(vi),
      n
    };
  }
}

/**
 * Convert SMD to correlation coefficient
 */
export function smdToCorrelation(d: number, n1: number, n2: number): number {
  const a = (n1 + n2) ** 2 / (n1 * n2);
  return d / Math.sqrt(d * d + a);
}

/**
 * Convert correlation to SMD
 */
export function correlationToSmd(r: number): number {
  return (2 * r) / Math.sqrt(1 - r * r);
}

/**
 * Convert log odds ratio to SMD (Chinn 2000)
 */
export function logOrToSmd(logOr: number): number {
  return logOr * (Math.sqrt(3) / Math.PI);
}

/**
 * Convert SMD to log odds ratio
 */
export function smdToLogOr(d: number): number {
  return d * (Math.PI / Math.sqrt(3));
}
