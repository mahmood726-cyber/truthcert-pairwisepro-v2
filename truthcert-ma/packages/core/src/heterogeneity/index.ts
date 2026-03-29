/**
 * Heterogeneity analysis
 * @module heterogeneity
 */

import type {
  EffectSizeResult,
  HeterogeneityResult,
  ConfidenceInterval,
  QStatistic
} from '../types';
import { pchisq, qchisq, qt } from '../utils/statistics';

/**
 * Calculate Q statistic (Cochran's Q)
 *
 * @param effects - Effect sizes with variances
 * @returns Q statistic with df and p-value
 */
export function calculateQ(effects: EffectSizeResult[]): QStatistic {
  const yi = effects.map(e => e.yi);
  const vi = effects.map(e => e.vi);
  const k = yi.length;

  // Fixed-effects weights
  const wi = vi.map(v => 1 / v);
  const sumW = wi.reduce((a, b) => a + b, 0);

  // Fixed-effects estimate
  const thetaFE = wi.reduce((sum, w, i) => sum + w * yi[i], 0) / sumW;

  // Q statistic
  const Q = wi.reduce((sum, w, i) => sum + w * (yi[i] - thetaFE) ** 2, 0);

  // Degrees of freedom
  const df = k - 1;

  // P-value
  const p = 1 - pchisq(Q, df);

  return { value: Q, df, p };
}

/** Backward-compatible alias for calculateQ */
export const calculateQStatistic = calculateQ;

/**
 * Calculate I² statistic (inconsistency)
 *
 * I² = max(0, (Q - df) / Q × 100)
 *
 * @param Q - Q statistic value
 * @param df - Degrees of freedom
 * @returns I² percentage (0-100)
 */
export function calculateI2(Q: number, df: number): number {
  if (Q <= df || df <= 0) return 0;
  return Math.max(0, ((Q - df) / Q) * 100);
}

/**
 * Calculate confidence interval for I²
 *
 * Uses the test-based method
 */
export function calculateI2CI(Q: number, k: number, level = 0.95): ConfidenceInterval {
  const df = k - 1;
  const alpha = 1 - level;

  // Lower bound
  const QL = qchisq(1 - alpha / 2, df);
  const I2Lower = Math.max(0, ((Q - df) / QL) * 100);

  // Upper bound
  const QU = qchisq(alpha / 2, df);
  const I2Upper = Math.min(100, ((Q - df) / QU) * 100);

  return { lower: I2Lower, upper: Math.max(I2Lower, I2Upper), level };
}

/**
 * Calculate H² statistic
 *
 * H² = Q / (k - 1)
 * H = sqrt(H²) represents the ratio of total to sampling variance
 */
export function calculateH2(Q: number, df: number): number {
  return df > 0 ? Q / df : 1;
}

/**
 * Interpret I² value
 *
 * Based on Higgins et al. (2003) thresholds
 */
export function interpretI2(I2: number): string {
  if (I2 < 25) return 'Low heterogeneity';
  if (I2 < 50) return 'Moderate heterogeneity';
  if (I2 < 75) return 'Substantial heterogeneity';
  return 'Considerable heterogeneity';
}

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
export function calculatePredictionInterval(
  theta: number,
  tau2: number,
  se: number,
  k: number,
  level = 0.95
): ConfidenceInterval {
  // Degrees of freedom for t-distribution
  const df = k - 2;

  if (df <= 0) {
    return { lower: -Infinity, upper: Infinity, level };
  }

  // Standard error for prediction
  const sePred = Math.sqrt(tau2 + se * se);

  // Critical value from t-distribution
  const t = qt(1 - (1 - level) / 2, df);

  return {
    lower: theta - t * sePred,
    upper: theta + t * sePred,
    level
  };
}

/** Backward-compatible alias for calculatePredictionInterval */
export const predictionInterval = calculatePredictionInterval;

/**
 * Calculate tau (standard deviation of true effects)
 */
export function calculateTau(tau2: number): number {
  return Math.sqrt(Math.max(0, tau2));
}

/**
 * Full heterogeneity analysis
 *
 * @param effects - Effect sizes
 * @param tau2 - Between-study variance (from pooling)
 * @param pooledTheta - Pooled effect estimate
 * @param pooledSE - Standard error of pooled estimate
 * @returns Complete heterogeneity results
 */
export function analyzeHeterogeneity(
  effects: EffectSizeResult[],
  tau2: number,
  pooledTheta: number,
  pooledSE: number
): HeterogeneityResult {
  const k = effects.length;
  const Q = calculateQ(effects);
  const I2 = calculateI2(Q.value, Q.df);
  const H2 = calculateH2(Q.value, Q.df);
  const tau = calculateTau(tau2);

  const predictionInterval = k >= 3
    ? calculatePredictionInterval(pooledTheta, tau2, pooledSE, k)
    : undefined;

  return {
    Q,
    I2,
    tau2,
    tau,
    H2,
    predictionInterval
  };
}

/**
 * Heterogeneity namespace
 */
export const Heterogeneity = {
  calculateQ,
  calculateI2,
  calculateI2CI,
  calculateH2,
  calculatePredictionInterval,
  calculateTau,
  interpretI2,
  analyze: analyzeHeterogeneity
};
