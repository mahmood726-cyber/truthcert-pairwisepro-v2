/**
 * Main MetaAnalysis class
 * @module meta-analysis
 */
import type { EffectSizeResult, PoolingOptions, MetaAnalysisResult, EffectMeasure, BinaryStudy, ContinuousStudy, ClinicalOptions } from './types';
import { assessGRADE } from './grade';
/**
 * MetaAnalysis class for running complete meta-analyses
 *
 * @example
 * ```ts
 * const ma = new MetaAnalysis(effects, { method: 'REML' });
 * const results = ma.run();
 *
 * // Or with chaining
 * const results = ma
 *   .calculateEffects()
 *   .pool()
 *   .heterogeneity()
 *   .publicationBias()
 *   .run();
 * ```
 */
export declare class MetaAnalysis {
    private effects;
    private options;
    private effectMeasure?;
    private _result;
    private _steps;
    /**
     * Create a new MetaAnalysis instance
     *
     * @param data - Effect sizes or raw study data
     * @param options - Analysis options
     */
    constructor(data?: EffectSizeResult[] | BinaryStudy[] | ContinuousStudy[], options?: PoolingOptions & {
        effectMeasure?: EffectMeasure;
    });
    /**
     * Set effect sizes directly
     */
    setEffects(effects: EffectSizeResult[]): this;
    /**
     * Calculate effect sizes from raw data
     */
    calculateEffects(data?: BinaryStudy[] | ContinuousStudy[], measure?: EffectMeasure): this;
    /**
     * Pool effect sizes
     */
    pool(): this;
    /**
     * Calculate heterogeneity statistics
     */
    heterogeneity(): this;
    /**
     * Analyze publication bias
     */
    publicationBias(): this;
    /**
     * Calculate clinical translation (NNT, etc.)
     */
    clinical(options: ClinicalOptions): this;
    /**
     * Perform GRADE assessment
     */
    grade(options?: Parameters<typeof assessGRADE>[3]): this;
    /**
     * Perform sensitivity analysis
     */
    sensitivity(): this;
    /**
     * Run all analyses and return complete result
     */
    run(): MetaAnalysisResult;
    /**
     * Run complete analysis with all optional analyses
     */
    runFull(clinicalOptions?: ClinicalOptions): MetaAnalysisResult;
    /**
     * Get forest plot data
     */
    getForestPlotData(): {
        studies: Array<{
            id: string;
            yi: number;
            ci: {
                lower: number;
                upper: number;
            };
            weight: number;
        }>;
        pooled: {
            yi: number;
            ci: {
                lower: number;
                upper: number;
            };
        };
    };
    /**
     * Get current results without running additional analyses
     */
    getResults(): Partial<MetaAnalysisResult>;
}
export default MetaAnalysis;
//# sourceMappingURL=meta-analysis.d.ts.map