/**
 * Publication bias analysis
 * @module bias
 */
import type { EffectSizeResult, EggerResult, BeggResult, TrimFillResult, PublicationBiasResult, FunnelPlotData, PooledResult } from '../types';
/**
 * Egger's regression test for funnel plot asymmetry
 *
 * Tests for small-study effects by regressing standardized effect
 * sizes against their precision (1/SE)
 *
 * @param effects - Effect sizes with variances
 * @returns Egger test results
 */
export declare function eggerTest(effects: EffectSizeResult[]): EggerResult;
/**
 * Begg's rank correlation test
 *
 * Tests for publication bias using Kendall's tau between
 * effect sizes and their variances
 *
 * @param effects - Effect sizes
 * @returns Begg test results
 */
export declare function beggTest(effects: EffectSizeResult[]): BeggResult;
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
export declare function trimFill(effects: EffectSizeResult[], pooled: PooledResult, side?: 'auto' | 'left' | 'right', maxIter?: number): TrimFillResult;
/**
 * Generate funnel plot data
 *
 * @param effects - Effect sizes
 * @param pooledTheta - Pooled effect estimate
 * @returns Data for rendering funnel plot
 */
export declare function funnelPlotData(effects: EffectSizeResult[], pooledTheta: number): FunnelPlotData;
/**
 * Full publication bias analysis
 *
 * @param effects - Effect sizes
 * @param pooled - Pooled result
 * @returns Complete bias analysis
 */
export declare function analyzeBias(effects: EffectSizeResult[], pooled: PooledResult): PublicationBiasResult;
/**
 * Bias namespace
 */
export declare const Bias: {
    eggerTest: typeof eggerTest;
    beggTest: typeof beggTest;
    trimFill: typeof trimFill;
    funnelPlotData: typeof funnelPlotData;
    analyze: typeof analyzeBias;
};
//# sourceMappingURL=index.d.ts.map