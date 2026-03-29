/**
 * Clinical translation utilities
 * @module clinical
 */

import type { NNTResult, ClinicalOptions, ConfidenceInterval } from '../types';

/**
 * Calculate Number Needed to Treat (NNT)
 *
 * NNT = 1 / ARR
 * ARR = baselineRisk × (1 - RR)
 *
 * @param riskRatio - Risk ratio (or exp(logRR))
 * @param baselineRisk - Control event rate
 * @param level - Confidence level
 * @returns NNT with confidence interval
 *
 * @example
 * ```ts
 * const result = calculateNNT(0.7, 0.15);
 * // { nnt: 22, arr: 0.045, ci: {...}, interpretation: "..." }
 * ```
 */
export function calculateNNT(
  riskRatio: number,
  baselineRisk: number,
  rrCI?: ConfidenceInterval,
  level = 0.95
): NNTResult {
  // Absolute Risk Reduction
  const arr = baselineRisk * (1 - riskRatio);

  // NNT
  const nnt = arr !== 0 ? Math.abs(1 / arr) : Infinity;

  // Confidence interval for NNT (inverted from ARR CI)
  let ci: ConfidenceInterval;
  if (rrCI) {
    const arrLower = baselineRisk * (1 - rrCI.upper);
    const arrUpper = baselineRisk * (1 - rrCI.lower);

    // Handle cases where ARR crosses zero
    if (arrLower <= 0 && arrUpper >= 0) {
      ci = { lower: Infinity, upper: Infinity, level };
    } else if (arrLower > 0 && arrUpper > 0) {
      // Beneficial effect
      ci = {
        lower: 1 / arrUpper,
        upper: 1 / arrLower,
        level
      };
    } else {
      // Harmful effect (NNH)
      ci = {
        lower: Math.abs(1 / arrLower),
        upper: Math.abs(1 / arrUpper),
        level
      };
    }
  } else {
    ci = { lower: NaN, upper: NaN, level };
  }

  // Interpretation
  let interpretation: string;
  if (arr > 0) {
    interpretation = `Treat ${Math.round(nnt)} patients to prevent 1 event`;
  } else if (arr < 0) {
    interpretation = `Treat ${Math.round(nnt)} patients to cause 1 additional event (NNH)`;
  } else {
    interpretation = 'No effect detected';
  }

  return {
    nnt: Math.round(nnt),
    ci: {
      lower: Math.round(ci.lower),
      upper: Math.round(ci.upper),
      level: ci.level
    },
    arr,
    interpretation
  };
}

/**
 * Calculate NNT from log odds ratio
 */
export function nntFromLogOR(
  logOR: number,
  baselineRisk: number,
  logORCI?: ConfidenceInterval
): NNTResult {
  const or = Math.exp(logOR);

  // Convert OR to RR
  const rr = or / (1 - baselineRisk + baselineRisk * or);

  let rrCI: ConfidenceInterval | undefined;
  if (logORCI) {
    const orLower = Math.exp(logORCI.lower);
    const orUpper = Math.exp(logORCI.upper);
    rrCI = {
      lower: orLower / (1 - baselineRisk + baselineRisk * orLower),
      upper: orUpper / (1 - baselineRisk + baselineRisk * orUpper),
      level: logORCI.level
    };
  }

  return calculateNNT(rr, baselineRisk, rrCI);
}

/**
 * Calculate Absolute Risk Reduction (ARR)
 */
export function calculateARR(
  riskRatio: number,
  baselineRisk: number
): number {
  return baselineRisk * (1 - riskRatio);
}

/**
 * Calculate Relative Risk Reduction (RRR)
 */
export function calculateRRR(riskRatio: number): number {
  return 1 - riskRatio;
}

/**
 * Calculate Absolute Risk Increase (ARI)
 * For harmful effects (RR > 1)
 */
export function calculateARI(
  riskRatio: number,
  baselineRisk: number
): number {
  return baselineRisk * (riskRatio - 1);
}

/**
 * Convert odds ratio to risk ratio
 */
export function orToRR(or: number, baselineRisk: number): number {
  return or / (1 - baselineRisk + baselineRisk * or);
}

/**
 * Convert log odds ratio to log risk ratio
 */
export function logORToLogRR(logOR: number, baselineRisk: number): number {
  return Math.log(orToRR(Math.exp(logOR), baselineRisk));
}

/**
 * Convert risk ratio to odds ratio
 */
export function rrToOR(rr: number, baselineRisk: number): number {
  const p1 = rr * baselineRisk;
  return (p1 / (1 - p1)) / (baselineRisk / (1 - baselineRisk));
}

/**
 * Calculate probability of benefit for individual patient
 *
 * Based on predictive distribution
 */
export function probabilityOfBenefit(
  pooledEffect: number,
  tau: number,
  effectDirection: 'lower' | 'higher' = 'lower'
): number {
  // Standard normal CDF
  const phi = (x: number) => {
    return 0.5 * (1 + erf(x / Math.SQRT2));
  };

  // Error function approximation
  function erf(x: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  if (tau <= 0) {
    // No heterogeneity - effect is deterministic
    if (effectDirection === 'lower') {
      return pooledEffect < 0 ? 1 : 0;
    } else {
      return pooledEffect > 0 ? 1 : 0;
    }
  }

  // Probability that true effect < 0 (or > 0)
  if (effectDirection === 'lower') {
    return phi(-pooledEffect / tau);
  } else {
    return 1 - phi(-pooledEffect / tau);
  }
}

/**
 * Calculate expected responder rate
 *
 * Proportion of patients expected to benefit from treatment
 */
export function expectedResponderRate(
  pooledEffect: number,
  tau: number,
  mcid: number,
  effectDirection: 'lower' | 'higher' = 'lower'
): number {
  const phi = (x: number) => {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    const absX = Math.abs(x) / Math.SQRT2;
    const t = 1.0 / (1.0 + p * absX);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

    return 0.5 * (1.0 + sign * y);
  };

  if (tau <= 0) tau = 0.001;

  // Probability of exceeding MCID
  if (effectDirection === 'lower') {
    return phi((-mcid - pooledEffect) / tau);
  } else {
    return 1 - phi((mcid - pooledEffect) / tau);
  }
}

/**
 * Interpret effect size magnitude
 *
 * Based on Cohen's conventions for SMD
 */
export function interpretEffectSize(smd: number): string {
  const abs = Math.abs(smd);
  if (abs < 0.2) return 'Negligible effect';
  if (abs < 0.5) return 'Small effect';
  if (abs < 0.8) return 'Medium effect';
  return 'Large effect';
}

/**
 * Clinical namespace
 */
export const Clinical = {
  calculateNNT,
  nntFromLogOR,
  calculateARR,
  calculateRRR,
  calculateARI,
  orToRR,
  logORToLogRR,
  rrToOR,
  probabilityOfBenefit,
  expectedResponderRate,
  interpretEffectSize
};
