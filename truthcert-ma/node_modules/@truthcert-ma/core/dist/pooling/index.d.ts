/**
 * Meta-analysis pooling methods
 * @module pooling
 */
import type { EffectSizeResult, PoolingOptions, PooledResult, ConfidenceInterval, Tau2Estimator } from '../types';
import { reml, dl, pm, sj, hs, he, eb, ml } from './estimators';
export * from './estimators';
/**
 * Estimate tau² directly from effect sizes and variances
 */
export declare function estimateTau2(effects: EffectSizeResult[], method?: Tau2Estimator): number;
/**
 * Pool effect sizes using fixed-effects model
 *
 * @param effects - Array of effect size results
 * @param options - Pooling options
 * @returns Pooled result
 *
 * @example
 * ```ts
 * const result = fixedEffects([
 *   { yi: -0.5, vi: 0.1 },
 *   { yi: -0.3, vi: 0.12 }
 * ]);
 * ```
 */
export declare function fixedEffects(effects: EffectSizeResult[], options?: PoolingOptions): PooledResult;
/**
 * Pool effect sizes using random-effects model
 *
 * @param effects - Array of effect size results
 * @param options - Pooling options
 * @returns Pooled result with tau² information
 *
 * @example
 * ```ts
 * const result = randomEffects(effects, { method: 'REML' });
 * console.log(result.theta, result.se, result.tau2);
 * ```
 */
export declare function randomEffects(effects: EffectSizeResult[], options?: PoolingOptions): PooledResult & {
    tau2: number;
};
/**
 * Pool effect sizes (auto-selects model based on options)
 *
 * @param effects - Array of effect size results
 * @param options - Pooling options
 * @returns Pooled result
 */
export declare function pool(effects: EffectSizeResult[], options?: PoolingOptions): PooledResult & {
    tau2?: number;
};
/**
 * Calculate Q statistic (Cochran's Q)
 *
 * @param effects - Effect sizes
 * @param theta - Pooled effect (optional, calculated if not provided)
 * @returns Q statistic with p-value
 */
export declare function calculateQ(effects: EffectSizeResult[], theta?: number): {
    value: number;
    df: number;
    p: number;
};
/**
 * Calculate I² (heterogeneity percentage)
 *
 * I² = max(0, (Q - df) / Q * 100)
 *
 * @param Q - Q statistic
 * @param df - Degrees of freedom
 * @returns I² percentage
 */
export declare function calculateI2(Q: number, df: number): number;
/**
 * Calculate H² statistic
 *
 * H² = Q / df
 *
 * @param Q - Q statistic
 * @param df - Degrees of freedom
 * @returns H² value
 */
export declare function calculateH2(Q: number, df: number): number;
/**
 * Calculate prediction interval
 *
 * @param theta - Pooled effect
 * @param se - Standard error of pooled effect
 * @param tau2 - Between-study variance
 * @param k - Number of studies
 * @param level - Confidence level (default: 0.95)
 * @returns Prediction interval
 */
export declare function predictionInterval(theta: number, se: number, tau2: number, k: number, level?: number): ConfidenceInterval;
/**
 * Mantel-Haenszel pooling for binary outcomes
 *
 * @param studies - Binary study data with ai, bi, ci, di
 * @param measure - 'OR' or 'RR'
 * @returns Pooled result
 */
export declare function mantelHaenszel(studies: Array<{
    ai: number;
    bi: number;
    ci: number;
    di: number;
}>, measure?: 'OR' | 'RR'): PooledResult;
/**
 * Peto's method for pooling odds ratios
 *
 * @param studies - Binary study data
 * @returns Pooled result
 */
export declare function peto(studies: Array<{
    ai: number;
    bi: number;
    ci: number;
    di: number;
}>): PooledResult;
/**
 * Pooling namespace for convenient access
 */
export declare const Pooling: {
    fixedEffects: typeof fixedEffects;
    randomEffects: typeof randomEffects;
    pool: typeof pool;
    calculateQ: typeof calculateQ;
    calculateI2: typeof calculateI2;
    calculateH2: typeof calculateH2;
    predictionInterval: typeof predictionInterval;
    mantelHaenszel: typeof mantelHaenszel;
    peto: typeof peto;
    estimators: {
        reml: typeof reml;
        dl: typeof dl;
        pm: typeof pm;
        sj: typeof sj;
        hs: typeof hs;
        he: typeof he;
        eb: typeof eb;
        ml: typeof ml;
    };
};
//# sourceMappingURL=index.d.ts.map