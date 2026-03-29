"use strict";
/**
 * Heterogeneity analysis
 * @module heterogeneity
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Heterogeneity = exports.analyzeHeterogeneity = exports.calculateTau = exports.predictionInterval = exports.calculatePredictionInterval = exports.interpretI2 = exports.calculateH2 = exports.calculateI2CI = exports.calculateI2 = exports.calculateQStatistic = exports.calculateQ = void 0;
const statistics_1 = require("../utils/statistics");
/**
 * Calculate Q statistic (Cochran's Q)
 *
 * @param effects - Effect sizes with variances
 * @returns Q statistic with df and p-value
 */
function calculateQ(effects) {
    const yi = effects.map(e => e.yi);
    const vi = effects.map(e => e.vi);
    const k = yi.length;
    // Fixed-effects weights
    const wi = vi.map(v => 1 / v);
    const sumW = wi.reduce((a, b) => a + b, 0);
    // Fixed-effects estimate
    const thetaFE = wi.reduce((sum, w, i) => sum + w * yi[i], 0) / sumW;
    // Q statistic
    const Q = wi.reduce((sum, w, i) => sum + w * (yi[i] - thetaFE) ** 2, 0);
    // Degrees of freedom
    const df = k - 1;
    // P-value
    const p = 1 - (0, statistics_1.pchisq)(Q, df);
    return { value: Q, df, p };
}
exports.calculateQ = calculateQ;
/** Backward-compatible alias for calculateQ */
exports.calculateQStatistic = calculateQ;
/**
 * Calculate I² statistic (inconsistency)
 *
 * I² = max(0, (Q - df) / Q × 100)
 *
 * @param Q - Q statistic value
 * @param df - Degrees of freedom
 * @returns I² percentage (0-100)
 */
function calculateI2(Q, df) {
    if (Q <= df || df <= 0)
        return 0;
    return Math.max(0, ((Q - df) / Q) * 100);
}
exports.calculateI2 = calculateI2;
/**
 * Calculate confidence interval for I²
 *
 * Uses the test-based method
 */
function calculateI2CI(Q, k, level = 0.95) {
    const df = k - 1;
    const alpha = 1 - level;
    // Lower bound
    const QL = (0, statistics_1.qchisq)(1 - alpha / 2, df);
    const I2Lower = Math.max(0, ((Q - df) / QL) * 100);
    // Upper bound
    const QU = (0, statistics_1.qchisq)(alpha / 2, df);
    const I2Upper = Math.min(100, ((Q - df) / QU) * 100);
    return { lower: I2Lower, upper: Math.max(I2Lower, I2Upper), level };
}
exports.calculateI2CI = calculateI2CI;
/**
 * Calculate H² statistic
 *
 * H² = Q / (k - 1)
 * H = sqrt(H²) represents the ratio of total to sampling variance
 */
function calculateH2(Q, df) {
    return df > 0 ? Q / df : 1;
}
exports.calculateH2 = calculateH2;
/**
 * Interpret I² value
 *
 * Based on Higgins et al. (2003) thresholds
 */
function interpretI2(I2) {
    if (I2 < 25)
        return 'Low heterogeneity';
    if (I2 < 50)
        return 'Moderate heterogeneity';
    if (I2 < 75)
        return 'Substantial heterogeneity';
    return 'Considerable heterogeneity';
}
exports.interpretI2 = interpretI2;
/**
 * Calculate prediction interval
 *
 * Represents the range where 95% of true effects are expected to fall
 *
 * @param theta - Pooled effect
 * @param tau2 - Between-study variance
 * @param se - Standard error of pooled effect
 * @param k - Number of studies
 * @param level - Confidence level
 */
function calculatePredictionInterval(theta, tau2, se, k, level = 0.95) {
    // Degrees of freedom for t-distribution
    const df = k - 2;
    if (df <= 0) {
        return { lower: -Infinity, upper: Infinity, level };
    }
    // Standard error for prediction
    const sePred = Math.sqrt(tau2 + se * se);
    // Critical value from t-distribution
    const t = (0, statistics_1.qt)(1 - (1 - level) / 2, df);
    return {
        lower: theta - t * sePred,
        upper: theta + t * sePred,
        level
    };
}
exports.calculatePredictionInterval = calculatePredictionInterval;
/** Backward-compatible alias for calculatePredictionInterval */
exports.predictionInterval = calculatePredictionInterval;
/**
 * Calculate tau (standard deviation of true effects)
 */
function calculateTau(tau2) {
    return Math.sqrt(Math.max(0, tau2));
}
exports.calculateTau = calculateTau;
/**
 * Full heterogeneity analysis
 *
 * @param effects - Effect sizes
 * @param tau2 - Between-study variance (from pooling)
 * @param pooledTheta - Pooled effect estimate
 * @param pooledSE - Standard error of pooled estimate
 * @returns Complete heterogeneity results
 */
function analyzeHeterogeneity(effects, tau2, pooledTheta, pooledSE) {
    const k = effects.length;
    const Q = calculateQ(effects);
    const I2 = calculateI2(Q.value, Q.df);
    const H2 = calculateH2(Q.value, Q.df);
    const tau = calculateTau(tau2);
    const predictionInterval = k >= 3
        ? calculatePredictionInterval(pooledTheta, tau2, pooledSE, k)
        : undefined;
    return {
        Q,
        I2,
        tau2,
        tau,
        H2,
        predictionInterval
    };
}
exports.analyzeHeterogeneity = analyzeHeterogeneity;
/**
 * Heterogeneity namespace
 */
exports.Heterogeneity = {
    calculateQ,
    calculateI2,
    calculateI2CI,
    calculateH2,
    calculatePredictionInterval,
    calculateTau,
    interpretI2,
    analyze: analyzeHeterogeneity
};
//# sourceMappingURL=index.js.map