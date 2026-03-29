/**
 * Sensitivity analysis
 * @module sensitivity
 */

import type {
  EffectSizeResult,
  LeaveOneOutResult,
  InfluenceResult,
  PoolingOptions,
  Tau2Estimator
} from '../types';
import { randomEffects, calculateQ, calculateI2 } from '../pooling';
import { confidenceInterval, pt } from '../utils/statistics';

/**
 * Leave-one-out analysis
 *
 * Recalculates pooled effect with each study removed
 *
 * @param effects - Effect sizes
 * @param options - Pooling options
 * @returns Array of leave-one-out results
 */
export function leaveOneOut(
  effects: EffectSizeResult[],
  options: PoolingOptions = {}
): LeaveOneOutResult[] {
  const results: LeaveOneOutResult[] = [];

  for (let i = 0; i < effects.length; i++) {
    const subset = effects.filter((_, j) => j !== i);
    const pooled = randomEffects(subset, options);
    const Q = calculateQ(subset);

    results.push({
      omitted: effects[i].study || effects[i].id || `Study ${i + 1}`,
      theta: pooled.theta,
      se: pooled.se,
      ci: pooled.ci,
      I2: calculateI2(Q.value, Q.df)
    });
  }

  return results;
}

/**
 * Cumulative meta-analysis
 *
 * Recalculates pooled effect as studies are added sequentially
 *
 * @param effects - Effect sizes (typically sorted by year)
 * @param options - Pooling options
 * @returns Array of cumulative results
 */
export function cumulative(
  effects: EffectSizeResult[],
  options: PoolingOptions = {}
): LeaveOneOutResult[] {
  const results: LeaveOneOutResult[] = [];

  for (let i = 0; i < effects.length; i++) {
    const subset = effects.slice(0, i + 1);
    const pooled = randomEffects(subset, options);
    const Q = calculateQ(subset);

    results.push({
      omitted: `Up to ${effects[i].study || effects[i].id || `Study ${i + 1}`}`,
      theta: pooled.theta,
      se: pooled.se,
      ci: pooled.ci,
      I2: calculateI2(Q.value, Q.df)
    });
  }

  return results;
}

/**
 * Calculate influence diagnostics
 *
 * Identifies influential studies using various metrics
 *
 * @param effects - Effect sizes
 * @param options - Pooling options
 * @returns Influence diagnostics for each study
 */
export function influence(
  effects: EffectSizeResult[],
  options: PoolingOptions = {}
): InfluenceResult[] {
  const k = effects.length;
  const yi = effects.map(e => e.yi);
  const vi = effects.map(e => e.vi);

  // Full model
  const fullPooled = randomEffects(effects, options);
  const tau2 = fullPooled.tau2 || 0;

  // Calculate weights
  const wi = vi.map(v => 1 / (v + tau2));
  const sumW = wi.reduce((a, b) => a + b, 0);

  // Hat values (leverage)
  const hat = wi.map(w => w / sumW);

  // Residuals
  const residuals = yi.map(y => y - fullPooled.theta);

  // Standardized residuals
  const sigmaResid = Math.sqrt(
    residuals.reduce((s, r, i) => s + wi[i] * r * r, 0) / (k - 1)
  );

  const results: InfluenceResult[] = [];

  for (let i = 0; i < k; i++) {
    // Studentized residual
    const seResid = Math.sqrt((vi[i] + tau2) * (1 - hat[i]));
    const rstudent = residuals[i] / seResid;

    // DFFITS (difference in fits)
    const dffits = rstudent * Math.sqrt(hat[i] / (1 - hat[i]));

    // Cook's distance
    const cooks = (rstudent * rstudent * hat[i]) / (1 * (1 - hat[i]));

    // Covariance ratio
    // Approximate: compare variance with and without study
    const subset = effects.filter((_, j) => j !== i);
    const subPooled = randomEffects(subset, options);
    const covRatio = (fullPooled.se * fullPooled.se) / (subPooled.se * subPooled.se);

    // Determine if influential
    // Common cutoffs: |rstudent| > 2, |DFFITS| > 2*sqrt(1/k), Cook's > 4/k
    const influential =
      Math.abs(rstudent) > 2 ||
      Math.abs(dffits) > 2 * Math.sqrt(1 / k) ||
      cooks > 4 / k;

    results.push({
      study: effects[i].study || effects[i].id || `Study ${i + 1}`,
      rstudent,
      dffits,
      cooks,
      covRatio,
      hat: hat[i],
      weight: (wi[i] / sumW) * 100,
      influential
    });
  }

  return results;
}

/**
 * Baujat plot data
 *
 * Shows contribution to overall heterogeneity vs influence on result
 *
 * @param effects - Effect sizes
 * @param options - Pooling options
 * @returns Data for Baujat plot
 */
export function baujatData(
  effects: EffectSizeResult[],
  options: PoolingOptions = {}
): Array<{ study: string; heterogeneity: number; influence: number }> {
  const yi = effects.map(e => e.yi);
  const vi = effects.map(e => e.vi);

  const fullPooled = randomEffects(effects, options);
  const tau2 = fullPooled.tau2 || 0;
  const wi = vi.map(v => 1 / (v + tau2));

  return effects.map((e, i) => {
    // Contribution to Q (heterogeneity)
    const heterogeneity = wi[i] * (yi[i] - fullPooled.theta) ** 2;

    // Influence on pooled effect
    const subset = effects.filter((_, j) => j !== i);
    const subPooled = randomEffects(subset, options);
    const influence = Math.abs(fullPooled.theta - subPooled.theta);

    return {
      study: e.study || e.id || `Study ${i + 1}`,
      heterogeneity,
      influence
    };
  });
}

/**
 * GOSH (Graphical Display of Heterogeneity) plot data
 *
 * Explores all possible subsets to visualize heterogeneity
 *
 * @param effects - Effect sizes (max ~12 studies due to combinatorics)
 * @param options - Pooling options
 * @param maxCombinations - Maximum combinations to compute
 * @returns Data for GOSH plot
 */
export function goshData(
  effects: EffectSizeResult[],
  options: PoolingOptions = {},
  maxCombinations = 10000
): Array<{ theta: number; I2: number; k: number }> {
  const k = effects.length;

  // Generate combinations (power set minus empty and singletons)
  const results: Array<{ theta: number; I2: number; k: number }> = [];

  // For small k, enumerate all combinations
  // For large k, sample randomly
  const totalCombinations = Math.pow(2, k) - k - 1; // Exclude empty and singletons

  if (totalCombinations <= maxCombinations) {
    // Enumerate all subsets of size >= 2
    for (let mask = 3; mask < Math.pow(2, k); mask++) {
      const subset: EffectSizeResult[] = [];
      for (let i = 0; i < k; i++) {
        if (mask & (1 << i)) {
          subset.push(effects[i]);
        }
      }

      if (subset.length >= 2) {
        const pooled = randomEffects(subset, options);
        const Q = calculateQ(subset);
        results.push({
          theta: pooled.theta,
          I2: calculateI2(Q.value, Q.df),
          k: subset.length
        });
      }
    }
  } else {
    // Random sampling for large k
    const seen = new Set<number>();
    while (results.length < maxCombinations && seen.size < totalCombinations) {
      // Generate random subset
      let mask = 0;
      const subsetSize = 2 + Math.floor(Math.random() * (k - 1));
      const indices = new Set<number>();
      while (indices.size < subsetSize) {
        indices.add(Math.floor(Math.random() * k));
      }
      indices.forEach(i => mask |= (1 << i));

      if (!seen.has(mask)) {
        seen.add(mask);
        const subset = effects.filter((_, i) => indices.has(i));
        const pooled = randomEffects(subset, options);
        const Q = calculateQ(subset);
        results.push({
          theta: pooled.theta,
          I2: calculateI2(Q.value, Q.df),
          k: subset.length
        });
      }
    }
  }

  return results;
}

/**
 * Fragility index
 *
 * Minimum number of events to reverse to change statistical significance
 *
 * @param effects - Effect sizes
 * @param pooledP - Current pooled p-value
 * @param alpha - Significance threshold
 * @returns Fragility index and related metrics
 */
export function fragilityIndex(
  pooledP: number,
  ci: { lower: number; upper: number },
  k: number
): { index: number; interpretation: string } {
  // Simplified fragility based on CI proximity to null
  const distanceToNull = Math.min(Math.abs(ci.lower), Math.abs(ci.upper));
  const ciWidth = ci.upper - ci.lower;

  // Rough approximation: how many "standard deviations" from null
  const z = distanceToNull / (ciWidth / 3.92); // 3.92 = 2*1.96

  // Fragility is inversely related to this distance
  let index: number;
  if (pooledP >= 0.05) {
    index = 0; // Already non-significant
  } else {
    index = Math.ceil(k * (1 - Math.min(1, z)));
  }

  let interpretation: string;
  if (index === 0) {
    interpretation = 'Result is not statistically significant';
  } else if (index <= 2) {
    interpretation = 'Very fragile - could reverse with minimal changes';
  } else if (index <= 5) {
    interpretation = 'Moderately fragile';
  } else {
    interpretation = 'Robust to small changes';
  }

  return { index: Math.max(0, index), interpretation };
}

/**
 * Sensitivity namespace
 */
export const Sensitivity = {
  leaveOneOut,
  cumulative,
  influence,
  baujatData,
  goshData,
  fragilityIndex
};
