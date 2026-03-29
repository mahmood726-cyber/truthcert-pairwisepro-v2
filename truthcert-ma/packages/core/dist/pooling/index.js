"use strict";
/**
 * Meta-analysis pooling methods
 * @module pooling
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pooling = exports.peto = exports.mantelHaenszel = exports.predictionInterval = exports.calculateH2 = exports.calculateI2 = exports.calculateQ = exports.pool = exports.randomEffects = exports.fixedEffects = exports.estimateTau2 = void 0;
const statistics_1 = require("../utils/statistics");
const estimators_1 = require("./estimators");
__exportStar(require("./estimators"), exports);
/**
 * Get tau² estimator function by method name
 */
function getTau2Estimator(method) {
    switch (method) {
        case 'REML': return estimators_1.reml;
        case 'DL': return estimators_1.dl;
        case 'PM': return estimators_1.pm;
        case 'SJ': return estimators_1.sj;
        case 'HS': return estimators_1.hs;
        case 'HE': return estimators_1.he;
        case 'EB': return estimators_1.eb;
        case 'ML': return estimators_1.ml;
        default: return estimators_1.reml;
    }
}
/**
 * Estimate tau² directly from effect sizes and variances
 */
function estimateTau2(effects, method = 'REML') {
    const yi = effects.map(e => e.yi);
    const vi = effects.map(e => e.vi);
    return getTau2Estimator(method)(yi, vi);
}
exports.estimateTau2 = estimateTau2;
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
function fixedEffects(effects, options = {}) {
    const { confidenceLevel = 0.95 } = options;
    const yi = effects.map(e => e.yi);
    const vi = effects.map(e => e.vi);
    // Inverse variance weights
    const wi = vi.map(v => 1 / v);
    const sumW = wi.reduce((a, b) => a + b, 0);
    // Pooled effect
    const theta = wi.reduce((sum, w, i) => sum + w * yi[i], 0) / sumW;
    // Standard error
    const se = Math.sqrt(1 / sumW);
    // Z-statistic
    const z = theta / se;
    // P-value (two-tailed)
    const p = 2 * (1 - (0, statistics_1.pnorm)(Math.abs(z)));
    // Confidence interval
    const ci = (0, statistics_1.confidenceInterval)(theta, se, confidenceLevel);
    return {
        theta,
        se,
        ci,
        z,
        p,
        weights: wi.map(w => w / sumW) // Normalized weights
    };
}
exports.fixedEffects = fixedEffects;
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
function randomEffects(effects, options = {}) {
    const { method = 'REML', confidenceLevel = 0.95 } = options;
    const yi = effects.map(e => e.yi);
    const vi = effects.map(e => e.vi);
    // Estimate tau²
    const estimator = getTau2Estimator(method);
    const tau2 = estimator(yi, vi);
    // Random-effects weights
    const wi = vi.map(v => 1 / (v + tau2));
    const sumW = wi.reduce((a, b) => a + b, 0);
    // Pooled effect
    const theta = wi.reduce((sum, w, i) => sum + w * yi[i], 0) / sumW;
    // Standard error
    const se = Math.sqrt(1 / sumW);
    // Z-statistic
    const z = theta / se;
    // P-value (two-tailed)
    const p = 2 * (1 - (0, statistics_1.pnorm)(Math.abs(z)));
    // Confidence interval
    const ci = (0, statistics_1.confidenceInterval)(theta, se, confidenceLevel);
    return {
        theta,
        se,
        ci,
        z,
        p,
        weights: wi.map(w => w / sumW),
        tau2
    };
}
exports.randomEffects = randomEffects;
/**
 * Pool effect sizes (auto-selects model based on options)
 *
 * @param effects - Array of effect size results
 * @param options - Pooling options
 * @returns Pooled result
 */
function pool(effects, options = {}) {
    const { model = 'random' } = options;
    if (model === 'fixed') {
        return fixedEffects(effects, options);
    }
    else {
        return randomEffects(effects, options);
    }
}
exports.pool = pool;
/**
 * Calculate Q statistic (Cochran's Q)
 *
 * @param effects - Effect sizes
 * @param theta - Pooled effect (optional, calculated if not provided)
 * @returns Q statistic with p-value
 */
function calculateQ(effects, theta) {
    const yi = effects.map(e => e.yi);
    const vi = effects.map(e => e.vi);
    // Fixed-effects weights for Q
    const wi = vi.map(v => 1 / v);
    const sumW = wi.reduce((a, b) => a + b, 0);
    // Use provided theta or calculate fixed-effects estimate
    const thetaFE = theta ?? wi.reduce((sum, w, i) => sum + w * yi[i], 0) / sumW;
    // Q statistic
    const Q = wi.reduce((sum, w, i) => sum + w * (yi[i] - thetaFE) ** 2, 0);
    // Degrees of freedom
    const df = effects.length - 1;
    // P-value from chi-squared distribution
    const p = 1 - (0, statistics_1.pchisq)(Q, df);
    return { value: Q, df, p };
}
exports.calculateQ = calculateQ;
/**
 * Calculate I² (heterogeneity percentage)
 *
 * I² = max(0, (Q - df) / Q * 100)
 *
 * @param Q - Q statistic
 * @param df - Degrees of freedom
 * @returns I² percentage
 */
function calculateI2(Q, df) {
    if (df <= 0 || Q <= df)
        return 0;
    return Math.max(0, ((Q - df) / Q) * 100);
}
exports.calculateI2 = calculateI2;
/**
 * Calculate H² statistic
 *
 * H² = Q / df
 *
 * @param Q - Q statistic
 * @param df - Degrees of freedom
 * @returns H² value
 */
function calculateH2(Q, df) {
    return df > 0 ? Q / df : 1;
}
exports.calculateH2 = calculateH2;
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
function predictionInterval(theta, se, tau2, k, level = 0.95) {
    // Degrees of freedom for prediction interval
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
exports.predictionInterval = predictionInterval;
/**
 * Mantel-Haenszel pooling for binary outcomes
 *
 * @param studies - Binary study data with ai, bi, ci, di
 * @param measure - 'OR' or 'RR'
 * @returns Pooled result
 */
function mantelHaenszel(studies, measure = 'OR') {
    if (measure === 'OR') {
        // MH Odds Ratio
        let num = 0, den = 0;
        let varNum = 0;
        studies.forEach(s => {
            const n = s.ai + s.bi + s.ci + s.di;
            num += (s.ai * s.di) / n;
            den += (s.bi * s.ci) / n;
        });
        const orMH = num / den;
        const logOR = Math.log(orMH);
        // Variance using Robins-Breslow-Greenland method
        let P = 0, Q = 0, R = 0, S = 0;
        studies.forEach(s => {
            const n = s.ai + s.bi + s.ci + s.di;
            const n1 = s.ai + s.bi;
            const n2 = s.ci + s.di;
            P += (s.ai + s.di) * s.ai * s.di / (n * n);
            Q += ((s.ai + s.di) * s.bi * s.ci + (s.bi + s.ci) * s.ai * s.di) / (n * n);
            R += (s.bi + s.ci) * s.bi * s.ci / (n * n);
            S += s.ai * s.di / n;
        });
        const T = studies.reduce((sum, s) => sum + s.bi * s.ci / (s.ai + s.bi + s.ci + s.di), 0);
        const se = Math.sqrt(P / (2 * S * S) + Q / (2 * S * T) + R / (2 * T * T));
        const z = logOR / se;
        const p = 2 * (1 - (0, statistics_1.pnorm)(Math.abs(z)));
        const ci = (0, statistics_1.confidenceInterval)(logOR, se, 0.95);
        return {
            theta: logOR,
            se,
            ci,
            z,
            p,
            weights: studies.map(() => 1 / studies.length)
        };
    }
    else {
        // MH Risk Ratio
        let num = 0, den = 0;
        studies.forEach(s => {
            const n = s.ai + s.bi + s.ci + s.di;
            num += s.ai * (s.ci + s.di) / n;
            den += s.ci * (s.ai + s.bi) / n;
        });
        const rrMH = num / den;
        const logRR = Math.log(rrMH);
        // Greenland-Robins variance
        let varTerm = 0;
        studies.forEach(s => {
            const n = s.ai + s.bi + s.ci + s.di;
            const n1 = s.ai + s.bi;
            const n2 = s.ci + s.di;
            varTerm += ((n1 * n2 * (s.ai + s.ci)) - s.ai * s.ci * n) / (n * n);
        });
        const se = Math.sqrt(varTerm / (num * den));
        const z = logRR / se;
        const p = 2 * (1 - (0, statistics_1.pnorm)(Math.abs(z)));
        const ci = (0, statistics_1.confidenceInterval)(logRR, se, 0.95);
        return {
            theta: logRR,
            se,
            ci,
            z,
            p,
            weights: studies.map(() => 1 / studies.length)
        };
    }
}
exports.mantelHaenszel = mantelHaenszel;
/**
 * Peto's method for pooling odds ratios
 *
 * @param studies - Binary study data
 * @returns Pooled result
 */
function peto(studies) {
    // Calculate O-E and V for each study
    let sumOE = 0, sumV = 0;
    studies.forEach(s => {
        const n1 = s.ai + s.bi;
        const n2 = s.ci + s.di;
        const n = n1 + n2;
        const m = s.ai + s.ci;
        const E = (n1 * m) / n;
        const V = (n1 * n2 * m * (n - m)) / (n * n * (n - 1));
        sumOE += s.ai - E;
        sumV += V;
    });
    // Peto log OR
    const logOR = sumOE / sumV;
    const se = 1 / Math.sqrt(sumV);
    const z = logOR / se;
    const p = 2 * (1 - (0, statistics_1.pnorm)(Math.abs(z)));
    const ci = (0, statistics_1.confidenceInterval)(logOR, se, 0.95);
    return {
        theta: logOR,
        se,
        ci,
        z,
        p,
        weights: studies.map(() => 1 / studies.length)
    };
}
exports.peto = peto;
/**
 * Pooling namespace for convenient access
 */
exports.Pooling = {
    fixedEffects,
    randomEffects,
    pool,
    calculateQ,
    calculateI2,
    calculateH2,
    predictionInterval,
    mantelHaenszel,
    peto,
    estimators: { reml: estimators_1.reml, dl: estimators_1.dl, pm: estimators_1.pm, sj: estimators_1.sj, hs: estimators_1.hs, he: estimators_1.he, eb: estimators_1.eb, ml: estimators_1.ml }
};
//# sourceMappingURL=index.js.map