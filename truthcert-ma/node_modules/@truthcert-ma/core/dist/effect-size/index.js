"use strict";
/**
 * Effect Size Calculations
 * @module effect-size
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
exports.EffectSize = exports.calculateEffectSizes = exports.calculateEffectSize = void 0;
__exportStar(require("./binary"), exports);
__exportStar(require("./continuous"), exports);
const binary_1 = require("./binary");
const continuous_1 = require("./continuous");
/**
 * Calculate effect size for a study based on measure type
 *
 * @param study - Study data (binary or continuous)
 * @param measure - Effect size measure
 * @param options - Additional options
 * @returns Effect size result
 *
 * @example
 * ```ts
 * // Binary outcome
 * const lor = calculateEffectSize(
 *   { ai: 10, bi: 90, ci: 20, di: 80 },
 *   'OR'
 * );
 *
 * // Continuous outcome
 * const smd = calculateEffectSize(
 *   { m1i: 25, sd1i: 5, n1i: 30, m2i: 20, sd2i: 6, n2i: 30 },
 *   'SMD'
 * );
 * ```
 */
function calculateEffectSize(study, measure, options = {}) {
    const { correction = 0.5 } = options;
    switch (measure) {
        case 'OR':
        case 'logOR':
            return (0, binary_1.logOddsRatio)(study, correction);
        case 'RR':
        case 'logRR':
            return (0, binary_1.logRiskRatio)(study, correction);
        case 'RD':
            return (0, binary_1.riskDifference)(study);
        case 'SMD':
            return (0, continuous_1.standardizedMeanDifference)(study);
        case 'MD':
            return (0, continuous_1.meanDifference)(study);
        case 'COR':
            // Assume study has 'r' and 'n' properties
            const s = study;
            if ('r' in s && 'n' in s) {
                return (0, continuous_1.correlationEffectSize)(s.r, s.n, false);
            }
            throw new Error('Correlation requires r and n');
        case 'ZCOR':
            const sz = study;
            if ('r' in sz && 'n' in sz) {
                return (0, continuous_1.correlationEffectSize)(sz.r, sz.n, true);
            }
            throw new Error('Fisher z requires r and n');
        default:
            throw new Error(`Unknown effect measure: ${measure}`);
    }
}
exports.calculateEffectSize = calculateEffectSize;
/**
 * Calculate effect sizes for multiple studies
 *
 * @param studies - Array of studies
 * @param measure - Effect size measure
 * @param options - Additional options
 * @returns Array of effect size results
 */
function calculateEffectSizes(studies, measure, options = {}) {
    return studies.map(study => calculateEffectSize(study, measure, options));
}
exports.calculateEffectSizes = calculateEffectSizes;
/**
 * EffectSize namespace for convenient access
 */
exports.EffectSize = {
    // Binary outcomes
    logOddsRatio: binary_1.logOddsRatio,
    logRiskRatio: binary_1.logRiskRatio,
    riskDifference: binary_1.riskDifference,
    arcsineRiskDifference: binary_1.arcsineRiskDifference,
    // Continuous outcomes
    standardizedMeanDifference: continuous_1.standardizedMeanDifference,
    meanDifference: continuous_1.meanDifference,
    cohensD: continuous_1.cohensD,
    glassDelta: continuous_1.glassDelta,
    smd: continuous_1.standardizedMeanDifference, // alias
    md: continuous_1.meanDifference, // alias
    // Correlations
    correlation: continuous_1.correlationEffectSize,
    fisherZ: continuous_1.fisherZ,
    inverseFisherZ: continuous_1.inverseFisherZ,
    // Generic
    calculate: calculateEffectSize,
    calculateMany: calculateEffectSizes
};
//# sourceMappingURL=index.js.map