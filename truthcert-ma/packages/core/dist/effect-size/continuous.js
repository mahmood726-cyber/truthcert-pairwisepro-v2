"use strict";
/**
 * Continuous outcome effect size calculations
 * @module effect-size/continuous
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.smdToLogOr = exports.logOrToSmd = exports.correlationToSmd = exports.smdToCorrelation = exports.correlationEffectSize = exports.inverseFisherZ = exports.fisherZ = exports.correlationFromT = exports.glassDelta = exports.meanDifference = exports.cohensD = exports.hedgesG = exports.standardizedMeanDifference = void 0;
/**
 * Calculate Hedges' g correction factor
 * J = 1 - 3/(4*df - 1)
 */
function hedgesCorrection(df) {
    return 1 - 3 / (4 * df - 1);
}
/**
 * Calculate pooled standard deviation
 */
function pooledSD(sd1, n1, sd2, n2) {
    return Math.sqrt(((n1 - 1) * sd1 * sd1 + (n2 - 1) * sd2 * sd2) / (n1 + n2 - 2));
}
/**
 * Calculate Standardized Mean Difference (Hedges' g)
 *
 * SMD = (m1 - m2) / pooled_sd * J
 * where J is Hedges' correction for small sample bias
 *
 * @param study - Continuous study data
 * @returns Effect size result with yi, vi, se
 *
 * @example
 * ```ts
 * const result = standardizedMeanDifference({
 *   m1i: 25, sd1i: 5, n1i: 30,
 *   m2i: 20, sd2i: 6, n2i: 30
 * });
 * // { yi: 0.89, vi: 0.072, se: 0.268 }
 * ```
 */
function standardizedMeanDifference(study) {
    const { m1i, sd1i, n1i, m2i, sd2i, n2i } = study;
    // Pooled standard deviation
    const sdPooled = pooledSD(sd1i, n1i, sd2i, n2i);
    // Degrees of freedom
    const df = n1i + n2i - 2;
    // Hedges' correction factor
    const J = hedgesCorrection(df);
    // Raw Cohen's d
    const d = (m1i - m2i) / sdPooled;
    // Hedges' g (bias-corrected)
    const yi = d * J;
    // Variance of Hedges' g
    // vi = (n1 + n2)/(n1*n2) + g^2/(2*(n1+n2))
    const vi = (n1i + n2i) / (n1i * n2i) + (yi * yi) / (2 * (n1i + n2i));
    return {
        yi,
        vi,
        se: Math.sqrt(vi),
        id: study.id,
        study: study.study,
        n: n1i + n2i
    };
}
exports.standardizedMeanDifference = standardizedMeanDifference;
/**
 * Alias for standardizedMeanDifference (Hedges' g)
 */
exports.hedgesG = standardizedMeanDifference;
/**
 * Calculate Cohen's d (uncorrected SMD)
 *
 * @param study - Continuous study data
 * @returns Effect size result
 */
function cohensD(study) {
    const { m1i, sd1i, n1i, m2i, sd2i, n2i } = study;
    // Pooled standard deviation
    const sdPooled = pooledSD(sd1i, n1i, sd2i, n2i);
    // Cohen's d
    const yi = (m1i - m2i) / sdPooled;
    // Variance
    const vi = (n1i + n2i) / (n1i * n2i) + (yi * yi) / (2 * (n1i + n2i));
    return {
        yi,
        vi,
        se: Math.sqrt(vi),
        id: study.id,
        study: study.study,
        n: n1i + n2i
    };
}
exports.cohensD = cohensD;
/**
 * Calculate Mean Difference (unstandardized)
 *
 * @param study - Continuous study data
 * @returns Effect size result
 *
 * @example
 * ```ts
 * const result = meanDifference({
 *   m1i: 25, sd1i: 5, n1i: 30,
 *   m2i: 20, sd2i: 6, n2i: 30
 * });
 * // { yi: 5.0, vi: 1.02, se: 1.01 }
 * ```
 */
function meanDifference(study) {
    const { m1i, sd1i, n1i, m2i, sd2i, n2i } = study;
    // Raw mean difference
    const yi = m1i - m2i;
    // Variance: var1/n1 + var2/n2
    const vi = (sd1i * sd1i) / n1i + (sd2i * sd2i) / n2i;
    return {
        yi,
        vi,
        se: Math.sqrt(vi),
        id: study.id,
        study: study.study,
        n: n1i + n2i
    };
}
exports.meanDifference = meanDifference;
/**
 * Calculate Glass's delta
 * Uses control group SD as standardizer
 *
 * @param study - Continuous study data
 * @returns Effect size result
 */
function glassDelta(study) {
    const { m1i, sd1i, n1i, m2i, sd2i, n2i } = study;
    // Glass's delta uses control SD only
    const yi = (m1i - m2i) / sd2i;
    // Variance approximation
    const vi = (n1i + n2i) / (n1i * n2i) + (yi * yi) / (2 * (n2i - 1));
    return {
        yi,
        vi,
        se: Math.sqrt(vi),
        id: study.id,
        study: study.study,
        n: n1i + n2i
    };
}
exports.glassDelta = glassDelta;
/**
 * Calculate correlation coefficient from t-statistic and df
 */
function correlationFromT(t, df) {
    const r = t / Math.sqrt(t * t + df);
    const vi = (1 - r * r) ** 2 / (df + 1);
    return {
        yi: r,
        vi,
        se: Math.sqrt(vi)
    };
}
exports.correlationFromT = correlationFromT;
/**
 * Calculate Fisher's z transformation
 */
function fisherZ(r) {
    return 0.5 * Math.log((1 + r) / (1 - r));
}
exports.fisherZ = fisherZ;
/**
 * Inverse Fisher's z transformation
 */
function inverseFisherZ(z) {
    return (Math.exp(2 * z) - 1) / (Math.exp(2 * z) + 1);
}
exports.inverseFisherZ = inverseFisherZ;
/**
 * Calculate effect size from correlation
 *
 * @param r - Correlation coefficient
 * @param n - Sample size
 * @param transform - Whether to use Fisher's z (default: true)
 * @returns Effect size result
 */
function correlationEffectSize(r, n, transform = true) {
    if (transform) {
        // Fisher's z transformation
        const z = fisherZ(r);
        const vi = 1 / (n - 3);
        return {
            yi: z,
            vi,
            se: Math.sqrt(vi),
            n
        };
    }
    else {
        // Raw correlation
        const vi = (1 - r * r) ** 2 / (n - 1);
        return {
            yi: r,
            vi,
            se: Math.sqrt(vi),
            n
        };
    }
}
exports.correlationEffectSize = correlationEffectSize;
/**
 * Convert SMD to correlation coefficient
 */
function smdToCorrelation(d, n1, n2) {
    const a = (n1 + n2) ** 2 / (n1 * n2);
    return d / Math.sqrt(d * d + a);
}
exports.smdToCorrelation = smdToCorrelation;
/**
 * Convert correlation to SMD
 */
function correlationToSmd(r) {
    return (2 * r) / Math.sqrt(1 - r * r);
}
exports.correlationToSmd = correlationToSmd;
/**
 * Convert log odds ratio to SMD (Chinn 2000)
 */
function logOrToSmd(logOr) {
    return logOr * (Math.sqrt(3) / Math.PI);
}
exports.logOrToSmd = logOrToSmd;
/**
 * Convert SMD to log odds ratio
 */
function smdToLogOr(d) {
    return d * (Math.PI / Math.sqrt(3));
}
exports.smdToLogOr = smdToLogOr;
//# sourceMappingURL=continuous.js.map