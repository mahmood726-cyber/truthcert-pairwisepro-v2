/**
 * Statistical utility functions
 * @module utils/statistics
 */
/**
 * Standard normal CDF (cumulative distribution function)
 * P(Z <= x) for standard normal distribution
 */
export declare function pnorm(x: number, mean?: number, sd?: number): number;
/**
 * Standard normal quantile function (inverse CDF)
 * Returns x such that P(Z <= x) = p
 */
export declare function qnorm(p: number, mean?: number, sd?: number): number;
/**
 * Chi-squared CDF
 */
export declare function pchisq(x: number, df: number): number;
/**
 * Chi-squared quantile function
 */
export declare function qchisq(p: number, df: number): number;
/**
 * Chi-squared PDF
 */
export declare function dchisq(x: number, df: number): number;
/**
 * T-distribution CDF
 */
export declare function pt(t: number, df: number): number;
/**
 * T-distribution quantile function
 */
export declare function qt(p: number, df: number): number;
/**
 * T-distribution PDF
 */
export declare function dt(t: number, df: number): number;
/**
 * Gamma function
 */
export declare function gamma(z: number): number;
/**
 * Log gamma function
 */
export declare function lgamma(z: number): number;
/**
 * Lower incomplete gamma function P(a,x)
 */
export declare function gammainc(a: number, x: number): number;
/**
 * Incomplete beta function I_x(a,b)
 */
export declare function incompleteBeta(a: number, b: number, x: number): number;
/**
 * Calculate z-score from p-value (two-tailed)
 */
export declare function zFromP(p: number): number;
/**
 * Calculate p-value from z-score (two-tailed)
 */
export declare function pFromZ(z: number): number;
/**
 * Calculate confidence interval
 */
export declare function confidenceInterval(estimate: number, se: number, level?: number): {
    lower: number;
    upper: number;
    level: number;
};
/**
 * Weighted mean
 */
export declare function weightedMean(values: number[], weights: number[]): number;
/**
 * Weighted variance
 */
export declare function weightedVariance(values: number[], weights: number[]): number;
/**
 * Kendall's tau correlation
 */
export declare function kendallTau(x: number[], y: number[]): {
    tau: number;
    z: number;
    p: number;
};
//# sourceMappingURL=statistics.d.ts.map