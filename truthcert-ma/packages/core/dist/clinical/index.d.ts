/**
 * Clinical translation utilities
 * @module clinical
 */
import type { NNTResult, ConfidenceInterval } from '../types';
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
export declare function calculateNNT(riskRatio: number, baselineRisk: number, rrCI?: ConfidenceInterval, level?: number): NNTResult;
/**
 * Calculate NNT from log odds ratio
 */
export declare function nntFromLogOR(logOR: number, baselineRisk: number, logORCI?: ConfidenceInterval): NNTResult;
/**
 * Calculate Absolute Risk Reduction (ARR)
 */
export declare function calculateARR(riskRatio: number, baselineRisk: number): number;
/**
 * Calculate Relative Risk Reduction (RRR)
 */
export declare function calculateRRR(riskRatio: number): number;
/**
 * Calculate Absolute Risk Increase (ARI)
 * For harmful effects (RR > 1)
 */
export declare function calculateARI(riskRatio: number, baselineRisk: number): number;
/**
 * Convert odds ratio to risk ratio
 */
export declare function orToRR(or: number, baselineRisk: number): number;
/**
 * Convert log odds ratio to log risk ratio
 */
export declare function logORToLogRR(logOR: number, baselineRisk: number): number;
/**
 * Convert risk ratio to odds ratio
 */
export declare function rrToOR(rr: number, baselineRisk: number): number;
/**
 * Calculate probability of benefit for individual patient
 *
 * Based on predictive distribution
 */
export declare function probabilityOfBenefit(pooledEffect: number, tau: number, effectDirection?: 'lower' | 'higher'): number;
/**
 * Calculate expected responder rate
 *
 * Proportion of patients expected to benefit from treatment
 */
export declare function expectedResponderRate(pooledEffect: number, tau: number, mcid: number, effectDirection?: 'lower' | 'higher'): number;
/**
 * Interpret effect size magnitude
 *
 * Based on Cohen's conventions for SMD
 */
export declare function interpretEffectSize(smd: number): string;
/**
 * Clinical namespace
 */
export declare const Clinical: {
    calculateNNT: typeof calculateNNT;
    nntFromLogOR: typeof nntFromLogOR;
    calculateARR: typeof calculateARR;
    calculateRRR: typeof calculateRRR;
    calculateARI: typeof calculateARI;
    orToRR: typeof orToRR;
    logORToLogRR: typeof logORToLogRR;
    rrToOR: typeof rrToOR;
    probabilityOfBenefit: typeof probabilityOfBenefit;
    expectedResponderRate: typeof expectedResponderRate;
    interpretEffectSize: typeof interpretEffectSize;
};
//# sourceMappingURL=index.d.ts.map