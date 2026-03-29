/**
 * Sensitivity analysis
 * @module sensitivity
 */
import type { EffectSizeResult, LeaveOneOutResult, InfluenceResult, PoolingOptions } from '../types';
/**
 * Leave-one-out analysis
 *
 * Recalculates pooled effect with each study removed
 *
 * @param effects - Effect sizes
 * @param options - Pooling options
 * @returns Array of leave-one-out results
 */
export declare function leaveOneOut(effects: EffectSizeResult[], options?: PoolingOptions): LeaveOneOutResult[];
/**
 * Cumulative meta-analysis
 *
 * Recalculates pooled effect as studies are added sequentially
 *
 * @param effects - Effect sizes (typically sorted by year)
 * @param options - Pooling options
 * @returns Array of cumulative results
 */
export declare function cumulative(effects: EffectSizeResult[], options?: PoolingOptions): LeaveOneOutResult[];
/**
 * Calculate influence diagnostics
 *
 * Identifies influential studies using various metrics
 *
 * @param effects - Effect sizes
 * @param options - Pooling options
 * @returns Influence diagnostics for each study
 */
export declare function influence(effects: EffectSizeResult[], options?: PoolingOptions): InfluenceResult[];
/**
 * Baujat plot data
 *
 * Shows contribution to overall heterogeneity vs influence on result
 *
 * @param effects - Effect sizes
 * @param options - Pooling options
 * @returns Data for Baujat plot
 */
export declare function baujatData(effects: EffectSizeResult[], options?: PoolingOptions): Array<{
    study: string;
    heterogeneity: number;
    influence: number;
}>;
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
export declare function goshData(effects: EffectSizeResult[], options?: PoolingOptions, maxCombinations?: number): Array<{
    theta: number;
    I2: number;
    k: number;
}>;
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
export declare function fragilityIndex(pooledP: number, ci: {
    lower: number;
    upper: number;
}, k: number): {
    index: number;
    interpretation: string;
};
/**
 * Sensitivity namespace
 */
export declare const Sensitivity: {
    leaveOneOut: typeof leaveOneOut;
    cumulative: typeof cumulative;
    influence: typeof influence;
    baujatData: typeof baujatData;
    goshData: typeof goshData;
    fragilityIndex: typeof fragilityIndex;
};
//# sourceMappingURL=index.d.ts.map