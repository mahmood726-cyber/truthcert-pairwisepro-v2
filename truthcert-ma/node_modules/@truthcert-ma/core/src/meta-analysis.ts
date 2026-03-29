/**
 * Main MetaAnalysis class
 * @module meta-analysis
 */

import type {
  EffectSizeResult,
  PoolingOptions,
  MetaAnalysisResult,
  EffectMeasure,
  BinaryStudy,
  ContinuousStudy,
  ClinicalOptions
} from './types';

import { calculateEffectSizes } from './effect-size';
import { randomEffects, fixedEffects } from './pooling';
import { analyzeHeterogeneity } from './heterogeneity';
import { analyzeBias } from './bias';
import { calculateNNT, nntFromLogOR } from './clinical';
import { assessGRADE } from './grade';
import { leaveOneOut, influence } from './sensitivity';

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
export class MetaAnalysis {
  private effects: EffectSizeResult[] = [];
  private options: PoolingOptions;
  private effectMeasure?: EffectMeasure;
  private _result: Partial<MetaAnalysisResult> = {};
  private _steps: string[] = [];

  /**
   * Create a new MetaAnalysis instance
   *
   * @param data - Effect sizes or raw study data
   * @param options - Analysis options
   */
  constructor(
    data?: EffectSizeResult[] | BinaryStudy[] | ContinuousStudy[],
    options: PoolingOptions & { effectMeasure?: EffectMeasure } = {}
  ) {
    this.options = {
      method: options.method || 'REML',
      model: options.model || 'random',
      confidenceLevel: options.confidenceLevel || 0.95
    };
    this.effectMeasure = options.effectMeasure;

    if (data && data.length > 0) {
      // Check if data is already effect sizes or needs conversion
      if ('yi' in data[0] && 'vi' in data[0]) {
        this.effects = data as EffectSizeResult[];
      } else if (data && this.effectMeasure) {
        this.effects = calculateEffectSizes(
          data as (BinaryStudy | ContinuousStudy)[],
          this.effectMeasure
        );
      }
    }
  }

  /**
   * Set effect sizes directly
   */
  setEffects(effects: EffectSizeResult[]): this {
    this.effects = effects;
    return this;
  }

  /**
   * Calculate effect sizes from raw data
   */
  calculateEffects(
    data?: BinaryStudy[] | ContinuousStudy[],
    measure?: EffectMeasure
  ): this {
    const effectMeasure = measure || this.effectMeasure;
    if (!effectMeasure) {
      throw new Error('Effect measure must be specified');
    }

    const rawData = data || (this.effects as any);
    this.effects = calculateEffectSizes(rawData, effectMeasure);
    this.effectMeasure = effectMeasure;
    this._steps.push('calculateEffects');
    return this;
  }

  /**
   * Pool effect sizes
   */
  pool(): this {
    if (this.effects.length === 0) {
      throw new Error('No effects to pool. Call calculateEffects() first or provide effect sizes.');
    }

    const pooled = this.options.model === 'fixed'
      ? fixedEffects(this.effects, this.options)
      : randomEffects(this.effects, this.options);

    this._result.pooled = pooled;
    this._result.studies = this.effects;

    if ('tau2' in pooled) {
      this._result.meta = {
        method: this.options.method || 'REML',
        model: this.options.model || 'random',
        effectMeasure: this.effectMeasure,
        k: this.effects.length,
        timestamp: new Date().toISOString()
      };
    }

    this._steps.push('pool');
    return this;
  }

  /**
   * Calculate heterogeneity statistics
   */
  heterogeneity(): this {
    if (!this._result.pooled) {
      this.pool();
    }

    const tau2 = (this._result.pooled as any).tau2 || 0;
    this._result.heterogeneity = analyzeHeterogeneity(
      this.effects,
      tau2,
      this._result.pooled!.theta,
      this._result.pooled!.se
    );

    this._steps.push('heterogeneity');
    return this;
  }

  /**
   * Analyze publication bias
   */
  publicationBias(): this {
    if (!this._result.pooled) {
      this.pool();
    }

    this._result.bias = analyzeBias(this.effects, this._result.pooled!);
    this._steps.push('publicationBias');
    return this;
  }

  /**
   * Calculate clinical translation (NNT, etc.)
   */
  clinical(options: ClinicalOptions): this {
    if (!this._result.pooled) {
      this.pool();
    }

    const { baselineRisk } = options;
    const theta = this._result.pooled!.theta;
    const ci = this._result.pooled!.ci;

    if (this.effectMeasure === 'OR' || this.effectMeasure === 'logOR') {
      this._result.clinical = nntFromLogOR(theta, baselineRisk, ci);
    } else if (this.effectMeasure === 'RR' || this.effectMeasure === 'logRR') {
      const rr = Math.exp(theta);
      const rrCI = {
        lower: Math.exp(ci.lower),
        upper: Math.exp(ci.upper),
        level: ci.level
      };
      this._result.clinical = calculateNNT(rr, baselineRisk, rrCI);
    } else {
      throw new Error(
        `Clinical translation requires RR/logRR or OR/logOR effect measures; received ${this.effectMeasure ?? 'unknown'}.`
      );
    }

    this._steps.push('clinical');
    return this;
  }

  /**
   * Perform GRADE assessment
   */
  grade(options: Parameters<typeof assessGRADE>[3] = {}): this {
    if (!this._result.pooled) this.pool();
    if (!this._result.heterogeneity) this.heterogeneity();

    this._result.grade = assessGRADE(
      this._result.pooled!,
      this._result.heterogeneity!,
      this._result.bias,
      { k: this.effects.length, ...options }
    );

    this._steps.push('grade');
    return this;
  }

  /**
   * Perform sensitivity analysis
   */
  sensitivity(): this {
    if (!this._result.pooled) {
      this.pool();
    }

    this._result.sensitivity = {
      leaveOneOut: leaveOneOut(this.effects, this.options),
      influence: influence(this.effects, this.options)
    };

    this._steps.push('sensitivity');
    return this;
  }

  /**
   * Run all analyses and return complete result
   */
  run(): MetaAnalysisResult {
    // Run any steps that haven't been run
    if (!this._steps.includes('pool')) this.pool();
    if (!this._steps.includes('heterogeneity')) this.heterogeneity();

    // Ensure meta is set
    if (!this._result.meta) {
      this._result.meta = {
        method: this.options.method || 'REML',
        model: this.options.model || 'random',
        effectMeasure: this.effectMeasure,
        k: this.effects.length,
        timestamp: new Date().toISOString()
      };
    }

    return this._result as MetaAnalysisResult;
  }

  /**
   * Run complete analysis with all optional analyses
   */
  runFull(clinicalOptions?: ClinicalOptions): MetaAnalysisResult {
    this.pool()
      .heterogeneity()
      .publicationBias()
      .sensitivity()
      .grade();

    if (clinicalOptions) {
      this.clinical(clinicalOptions);
    }

    return this.run();
  }

  /**
   * Get forest plot data
   */
  getForestPlotData(): {
    studies: Array<{
      id: string;
      yi: number;
      ci: { lower: number; upper: number };
      weight: number;
    }>;
    pooled: { yi: number; ci: { lower: number; upper: number } };
  } {
    if (!this._result.pooled) {
      this.pool();
    }

    const weights = this._result.pooled!.weights;
    const z = 1.96; // 95% CI

    return {
      studies: this.effects.map((e, i) => ({
        id: e.study || e.id || `Study ${i + 1}`,
        yi: e.yi,
        ci: {
          lower: e.yi - z * e.se,
          upper: e.yi + z * e.se
        },
        weight: weights[i] * 100
      })),
      pooled: {
        yi: this._result.pooled!.theta,
        ci: {
          lower: this._result.pooled!.ci.lower,
          upper: this._result.pooled!.ci.upper
        }
      }
    };
  }

  /**
   * Get current results without running additional analyses
   */
  getResults(): Partial<MetaAnalysisResult> {
    return { ...this._result };
  }
}

export default MetaAnalysis;
