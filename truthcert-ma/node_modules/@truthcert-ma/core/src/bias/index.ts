/**
 * Publication bias analysis
 * @module bias
 */

import type {
  EffectSizeResult,
  EggerResult,
  BeggResult,
  TrimFillResult,
  PublicationBiasResult,
  FunnelPlotData,
  PooledResult
} from '../types';
import { pnorm, qnorm, pt, kendallTau, pFromZ } from '../utils/statistics';

/**
 * Egger's regression test for funnel plot asymmetry
 *
 * Tests for small-study effects by regressing standardized effect
 * sizes against their precision (1/SE)
 *
 * @param effects - Effect sizes with variances
 * @returns Egger test results
 */
export function eggerTest(effects: EffectSizeResult[]): EggerResult {
  const k = effects.length;
  if (k < 3) {
    return {
      intercept: NaN,
      se: NaN,
      t: NaN,
      p: NaN,
      interpretation: 'Insufficient studies (minimum 3 required)'
    };
  }

  // Calculate z-scores and precision
  const z: number[] = [];
  const precision: number[] = [];

  effects.forEach(e => {
    const se = e.se || Math.sqrt(e.vi);
    z.push(e.yi / se);
    precision.push(1 / se);
  });

  // Weighted least squares regression: z = a + b * precision
  const n = k;
  const sumX = precision.reduce((a, b) => a + b, 0);
  const sumY = z.reduce((a, b) => a + b, 0);
  const sumXY = precision.reduce((s, x, i) => s + x * z[i], 0);
  const sumX2 = precision.reduce((s, x) => s + x * x, 0);

  const denom = n * sumX2 - sumX * sumX;
  const intercept = (sumY * sumX2 - sumX * sumXY) / denom;
  const slope = (n * sumXY - sumX * sumY) / denom;

  // Calculate residuals and standard error
  const residuals = z.map((zi, i) => zi - (intercept + slope * precision[i]));
  const sse = residuals.reduce((s, r) => s + r * r, 0);
  const mse = sse / (n - 2);

  const seIntercept = Math.sqrt(mse * sumX2 / denom);

  // T-statistic
  const t = intercept / seIntercept;

  // P-value (two-tailed)
  const df = n - 2;
  const p = 2 * (1 - pt(Math.abs(t), df));

  // Interpretation
  let interpretation: string;
  if (p < 0.01) {
    interpretation = 'Strong evidence of funnel plot asymmetry (possible publication bias)';
  } else if (p < 0.05) {
    interpretation = 'Moderate evidence of funnel plot asymmetry';
  } else if (p < 0.10) {
    interpretation = 'Weak evidence of funnel plot asymmetry';
  } else {
    interpretation = 'No significant evidence of funnel plot asymmetry';
  }

  return { intercept, se: seIntercept, t, p, interpretation };
}

/**
 * Begg's rank correlation test
 *
 * Tests for publication bias using Kendall's tau between
 * effect sizes and their variances
 *
 * @param effects - Effect sizes
 * @returns Begg test results
 */
export function beggTest(effects: EffectSizeResult[]): BeggResult {
  const k = effects.length;
  if (k < 3) {
    return { tau: NaN, z: NaN, p: NaN };
  }

  // Standardized effect sizes
  const yi = effects.map(e => e.yi);
  const vi = effects.map(e => e.vi);

  // Calculate Kendall's tau
  const result = kendallTau(yi, vi);

  return {
    tau: result.tau,
    z: result.z,
    p: result.p
  };
}

/**
 * Trim-and-fill analysis
 *
 * Estimates the number of missing studies and adjusts
 * the pooled effect accordingly
 *
 * @param effects - Effect sizes
 * @param pooled - Original pooled result
 * @param side - Which side to fill ('auto', 'left', 'right')
 * @param maxIter - Maximum iterations
 * @returns Trim-and-fill results
 */
export function trimFill(
  effects: EffectSizeResult[],
  pooled: PooledResult,
  side: 'auto' | 'left' | 'right' = 'auto',
  maxIter = 100
): TrimFillResult {
  const k = effects.length;
  const yi = effects.map(e => e.yi);
  const vi = effects.map(e => e.vi);

  // Determine side if auto
  let fillSide: 'left' | 'right' = 'left';
  if (side === 'auto') {
    // Check which side has fewer extreme studies
    const sortedByDeviation = effects
      .map((e, i) => ({ yi: e.yi, vi: e.vi, deviation: e.yi - pooled.theta }))
      .sort((a, b) => a.deviation - b.deviation);

    const leftExtreme = sortedByDeviation.filter(s => s.deviation < 0).length;
    const rightExtreme = sortedByDeviation.filter(s => s.deviation > 0).length;
    fillSide = leftExtreme < rightExtreme ? 'left' : 'right';
  } else {
    fillSide = side;
  }

  // Trim-and-fill algorithm (L0 estimator)
  let k0 = 0;
  let currentTheta = pooled.theta;
  let adjustedEffects = [...effects];

  for (let iter = 0; iter < maxIter; iter++) {
    // Calculate ranks based on distance from current theta
    const deviations = adjustedEffects.map(e => Math.abs(e.yi - currentTheta));
    const ranks = deviations.map((d, i) => {
      return deviations.filter(d2 => d2 < d).length + 1;
    });

    // Identify extreme studies on the specified side
    const extremeStudies = adjustedEffects
      .map((e, i) => ({ ...e, rank: ranks[i], deviation: e.yi - currentTheta }))
      .filter(s => fillSide === 'left' ? s.deviation < 0 : s.deviation > 0)
      .sort((a, b) => b.rank - a.rank);

    // Estimate k0 using L0 method
    const n = adjustedEffects.length;
    let T = 0;
    for (let i = 0; i < extremeStudies.length; i++) {
      const Si = extremeStudies.slice(0, i + 1).reduce((s, e) => s + e.rank, 0);
      T = Math.max(T, 4 * Si - n * (n + 1) / 2);
    }

    const newK0 = Math.round(T / (2 * n));

    if (newK0 === k0 && iter > 0) break;
    k0 = newK0;

    if (k0 === 0) break;

    // Add imputed studies
    const imputed: EffectSizeResult[] = [];
    const extremeToFill = extremeStudies.slice(0, k0);

    extremeToFill.forEach(e => {
      const mirroredYi = 2 * currentTheta - e.yi;
      imputed.push({
        yi: mirroredYi,
        vi: e.vi,
        se: Math.sqrt(e.vi),
        study: `Imputed (mirror of ${e.study || 'study'})`
      });
    });

    // Recalculate pooled effect with imputed studies
    adjustedEffects = [...effects, ...imputed];
    const allYi = adjustedEffects.map(e => e.yi);
    const allVi = adjustedEffects.map(e => e.vi);
    const wi = allVi.map(v => 1 / v);
    const sumW = wi.reduce((a, b) => a + b, 0);
    currentTheta = wi.reduce((s, w, i) => s + w * allYi[i], 0) / sumW;
  }

  // Calculate final adjusted pooled effect
  const finalYi = adjustedEffects.map(e => e.yi);
  const finalVi = adjustedEffects.map(e => e.vi);
  const wi = finalVi.map(v => 1 / v);
  const sumW = wi.reduce((a, b) => a + b, 0);
  const adjustedTheta = wi.reduce((s, w, i) => s + w * finalYi[i], 0) / sumW;
  const adjustedSE = Math.sqrt(1 / sumW);
  const z = adjustedTheta / adjustedSE;
  const p = pFromZ(z);

  const adjustedCI = {
    lower: adjustedTheta - 1.96 * adjustedSE,
    upper: adjustedTheta + 1.96 * adjustedSE,
    level: 0.95
  };

  return {
    k0,
    side: fillSide,
    adjusted: {
      theta: adjustedTheta,
      se: adjustedSE,
      ci: adjustedCI,
      z,
      p,
      weights: wi.map(w => w / sumW)
    },
    imputed: adjustedEffects.slice(effects.length)
  };
}

/**
 * Generate funnel plot data
 *
 * @param effects - Effect sizes
 * @param pooledTheta - Pooled effect estimate
 * @returns Data for rendering funnel plot
 */
export function funnelPlotData(
  effects: EffectSizeResult[],
  pooledTheta: number
): FunnelPlotData {
  const studies = effects.map(e => ({
    x: e.yi,
    y: e.se || Math.sqrt(e.vi)
  }));

  // Pseudo confidence interval bounds
  const pseudoCI = {
    lower: (se: number) => pooledTheta - 1.96 * se,
    upper: (se: number) => pooledTheta + 1.96 * se
  };

  return {
    studies,
    pooledEffect: pooledTheta,
    pseudoCI
  };
}

/**
 * Full publication bias analysis
 *
 * @param effects - Effect sizes
 * @param pooled - Pooled result
 * @returns Complete bias analysis
 */
export function analyzeBias(
  effects: EffectSizeResult[],
  pooled: PooledResult
): PublicationBiasResult {
  const egger = eggerTest(effects);
  const begg = beggTest(effects);
  const trimFillResult = effects.length >= 3 ? trimFill(effects, pooled) : undefined;

  return {
    egger,
    begg,
    trimFill: trimFillResult
  };
}

/**
 * Bias namespace
 */
export const Bias = {
  eggerTest,
  beggTest,
  trimFill,
  funnelPlotData,
  analyze: analyzeBias
};
