/**
 * Tau-squared estimators
 * @module pooling/estimators
 */
import { reml } from './reml';
import { dl } from './dl';
export { reml, dl };
import type { Tau2Estimator } from '../../types';
/**
 * Paule-Mandel estimator for tau-squared
 * Iterative method that solves Q(tau²) = k-1
 */
export declare function pm(yi: number[], vi: number[], maxIter?: number, tol?: number): number;
/**
 * Sidik-Jonkman estimator
 */
export declare function sj(yi: number[], vi: number[]): number;
/**
 * Hunter-Schmidt estimator
 */
export declare function hs(yi: number[], vi: number[]): number;
/**
 * Hedges estimator (HE)
 */
export declare function he(yi: number[], vi: number[]): number;
/**
 * Empirical Bayes (EB) estimator
 */
export declare function eb(yi: number[], vi: number[]): number;
/**
 * Maximum Likelihood (ML) estimator
 */
export declare function ml(yi: number[], vi: number[], maxIter?: number, tol?: number): number;
/**
 * Get tau-squared estimator function by name
 */
export declare function getEstimator(method: Tau2Estimator): (yi: number[], vi: number[]) => number;
//# sourceMappingURL=index.d.ts.map