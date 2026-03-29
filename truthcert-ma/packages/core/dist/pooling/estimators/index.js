"use strict";
/**
 * Tau-squared estimators
 * @module pooling/estimators
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEstimator = exports.ml = exports.eb = exports.he = exports.hs = exports.sj = exports.pm = exports.dl = exports.reml = void 0;
const reml_1 = require("./reml");
Object.defineProperty(exports, "reml", { enumerable: true, get: function () { return reml_1.reml; } });
const dl_1 = require("./dl");
Object.defineProperty(exports, "dl", { enumerable: true, get: function () { return dl_1.dl; } });
/**
 * Paule-Mandel estimator for tau-squared
 * Iterative method that solves Q(tau²) = k-1
 */
function pm(yi, vi, maxIter = 100, tol = 1e-5) {
    const k = yi.length;
    if (k < 2)
        return 0;
    let tau2 = (0, dl_1.dl)(yi, vi); // Start with DL estimate
    for (let iter = 0; iter < maxIter; iter++) {
        const wi = vi.map(v => 1 / (v + tau2));
        const sumW = wi.reduce((a, b) => a + b, 0);
        const theta = wi.reduce((s, w, i) => s + w * yi[i], 0) / sumW;
        const Q = wi.reduce((s, w, i) => s + w * (yi[i] - theta) ** 2, 0);
        // Target: Q = k - 1
        const target = k - 1;
        const diff = Q - target;
        if (Math.abs(diff) < tol)
            break;
        // Update tau2 (simple iteration)
        const sumW2 = wi.reduce((a, b) => a + b * b, 0);
        const dQ = -sumW2 + wi.reduce((s, w, i) => s + w * w * (yi[i] - theta) ** 2, 0) * 2 / sumW;
        tau2 = Math.max(0, tau2 - diff / dQ * 0.5);
    }
    return Math.max(0, tau2);
}
exports.pm = pm;
/**
 * Sidik-Jonkman estimator
 */
function sj(yi, vi) {
    const k = yi.length;
    if (k < 2)
        return 0;
    // Initial estimate using sample variance
    const meanY = yi.reduce((a, b) => a + b, 0) / k;
    const varY = yi.reduce((s, y) => s + (y - meanY) ** 2, 0) / (k - 1);
    const meanV = vi.reduce((a, b) => a + b, 0) / k;
    let tau2 = Math.max(0, varY - meanV);
    // Iterative refinement
    for (let iter = 0; iter < 50; iter++) {
        const wi = vi.map(v => 1 / (v + tau2));
        const sumW = wi.reduce((a, b) => a + b, 0);
        const theta = wi.reduce((s, w, i) => s + w * yi[i], 0) / sumW;
        const tau2New = wi.reduce((s, w, i) => s + w * w * ((yi[i] - theta) ** 2 - vi[i]), 0) /
            wi.reduce((s, w) => s + w * w, 0);
        if (Math.abs(tau2New - tau2) < 1e-5)
            break;
        tau2 = Math.max(0, tau2New);
    }
    return Math.max(0, tau2);
}
exports.sj = sj;
/**
 * Hunter-Schmidt estimator
 */
function hs(yi, vi) {
    const k = yi.length;
    if (k < 2)
        return 0;
    // Simple sample-based estimate
    const meanY = yi.reduce((a, b) => a + b, 0) / k;
    const varY = yi.reduce((s, y) => s + (y - meanY) ** 2, 0) / (k - 1);
    const meanV = vi.reduce((a, b) => a + b, 0) / k;
    return Math.max(0, varY - meanV);
}
exports.hs = hs;
/**
 * Hedges estimator (HE)
 */
function he(yi, vi) {
    const k = yi.length;
    if (k < 2)
        return 0;
    // Unweighted mean
    const meanY = yi.reduce((a, b) => a + b, 0) / k;
    // Q* using unweighted mean
    const Qstar = yi.reduce((s, y, i) => s + (y - meanY) ** 2 / vi[i], 0);
    // S = sum(1/vi)
    const S = vi.reduce((s, v) => s + 1 / v, 0);
    const S2 = vi.reduce((s, v) => s + 1 / (v * v), 0);
    const C = S - S2 / S;
    return Math.max(0, (Qstar - (k - 1)) / C);
}
exports.he = he;
/**
 * Empirical Bayes (EB) estimator
 */
function eb(yi, vi) {
    const k = yi.length;
    if (k < 2)
        return 0;
    // Start with DL
    let tau2 = (0, dl_1.dl)(yi, vi);
    // EB adjustment
    for (let iter = 0; iter < 50; iter++) {
        const wi = vi.map(v => 1 / (v + tau2));
        const sumW = wi.reduce((a, b) => a + b, 0);
        const theta = wi.reduce((s, w, i) => s + w * yi[i], 0) / sumW;
        const num = yi.reduce((s, y, i) => s + ((y - theta) ** 2 - vi[i]) / ((vi[i] + tau2) ** 2), 0);
        const den = yi.reduce((s, _, i) => s + 1 / ((vi[i] + tau2) ** 2), 0);
        const tau2New = Math.max(0, num / den);
        if (Math.abs(tau2New - tau2) < 1e-5)
            break;
        tau2 = tau2New;
    }
    return Math.max(0, tau2);
}
exports.eb = eb;
/**
 * Maximum Likelihood (ML) estimator
 */
function ml(yi, vi, maxIter = 100, tol = 1e-5) {
    const k = yi.length;
    if (k < 2)
        return 0;
    let tau2 = (0, dl_1.dl)(yi, vi);
    for (let iter = 0; iter < maxIter; iter++) {
        const wi = vi.map(v => 1 / (v + tau2));
        const sumW = wi.reduce((a, b) => a + b, 0);
        const theta = wi.reduce((s, w, i) => s + w * yi[i], 0) / sumW;
        // First derivative
        let U = -0.5 * wi.reduce((s, w) => s + w, 0);
        U += 0.5 * wi.reduce((s, w, i) => s + w * w * (yi[i] - theta) ** 2, 0);
        // Second derivative (Fisher information)
        const I = 0.5 * wi.reduce((s, w) => s + w * w, 0);
        const tau2New = Math.max(0, tau2 + U / I);
        if (Math.abs(tau2New - tau2) < tol)
            break;
        tau2 = tau2New;
    }
    return Math.max(0, tau2);
}
exports.ml = ml;
/**
 * Get tau-squared estimator function by name
 */
function getEstimator(method) {
    const estimators = {
        REML: reml_1.reml,
        DL: dl_1.dl,
        PM: pm,
        SJ: sj,
        HS: hs,
        HE: he,
        EB: eb,
        ML: ml
    };
    const estimator = estimators[method];
    if (!estimator) {
        throw new Error(`Unknown estimator: ${method}`);
    }
    return estimator;
}
exports.getEstimator = getEstimator;
//# sourceMappingURL=index.js.map