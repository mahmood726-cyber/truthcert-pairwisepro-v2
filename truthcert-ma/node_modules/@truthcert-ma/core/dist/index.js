"use strict";
/**
 * TruthCert-MA Core Library
 * A comprehensive meta-analysis library for JavaScript/TypeScript
 *
 * @module @truthcert-ma/core
 * @license MIT
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assessImprecision = exports.assessIndirectness = exports.assessInconsistency = exports.assessRiskOfBias = exports.assessGRADE = exports.Clinical = exports.interpretEffectSize = exports.expectedResponderRate = exports.probabilityOfBenefit = exports.rrToOR = exports.logORToLogRR = exports.orToRR = exports.calculateARI = exports.calculateRRR = exports.calculateARR = exports.nntFromLogOR = exports.calculateNNT = exports.Bias = exports.analyzeBias = exports.funnelPlotData = exports.trimFill = exports.beggTest = exports.eggerTest = exports.Heterogeneity = exports.predictionInterval = exports.calculateH2 = exports.computeI2 = exports.calculateQStatistic = exports.analyzeHeterogeneity = exports.Pooling = exports.estimateTau2 = exports.peto = exports.mantelHaenszel = exports.calculateI2 = exports.calculateQ = exports.pool = exports.randomEffects = exports.fixedEffects = exports.correlationEffectSize = exports.cohensD = exports.hedgesG = exports.meanDifference = exports.standardizedMeanDifference = exports.riskDifference = exports.logRiskRatio = exports.logOddsRatio = exports.calculateEffectSizes = exports.calculateEffectSize = exports.default = exports.MetaAnalysis = void 0;
exports.TruthCertMA = exports.VERSION = exports.kendallTau = exports.pFromZ = exports.confidenceInterval = exports.lgamma = exports.gamma = exports.qt = exports.pt = exports.qchisq = exports.pchisq = exports.qnorm = exports.pnorm = exports.Sensitivity = exports.fragilityIndex = exports.goshData = exports.baujatData = exports.influence = exports.cumulative = exports.leaveOneOut = exports.GRADE = exports.getCertaintyDescription = exports.getCertaintyLevel = exports.assessPublicationBias = void 0;
const meta_analysis_1 = require("./meta-analysis");
const effect_size_1 = require("./effect-size");
const pooling_1 = require("./pooling");
const heterogeneity_1 = require("./heterogeneity");
const bias_1 = require("./bias");
const clinical_1 = require("./clinical");
const grade_1 = require("./grade");
const sensitivity_1 = require("./sensitivity");
// Main class
var meta_analysis_2 = require("./meta-analysis");
Object.defineProperty(exports, "MetaAnalysis", { enumerable: true, get: function () { return meta_analysis_2.MetaAnalysis; } });
Object.defineProperty(exports, "default", { enumerable: true, get: function () { return __importDefault(meta_analysis_2).default; } });
// Effect size calculations
var effect_size_2 = require("./effect-size");
Object.defineProperty(exports, "calculateEffectSize", { enumerable: true, get: function () { return effect_size_2.calculateEffectSize; } });
Object.defineProperty(exports, "calculateEffectSizes", { enumerable: true, get: function () { return effect_size_2.calculateEffectSizes; } });
Object.defineProperty(exports, "logOddsRatio", { enumerable: true, get: function () { return effect_size_2.logOddsRatio; } });
Object.defineProperty(exports, "logRiskRatio", { enumerable: true, get: function () { return effect_size_2.logRiskRatio; } });
Object.defineProperty(exports, "riskDifference", { enumerable: true, get: function () { return effect_size_2.riskDifference; } });
Object.defineProperty(exports, "standardizedMeanDifference", { enumerable: true, get: function () { return effect_size_2.standardizedMeanDifference; } });
Object.defineProperty(exports, "meanDifference", { enumerable: true, get: function () { return effect_size_2.meanDifference; } });
Object.defineProperty(exports, "hedgesG", { enumerable: true, get: function () { return effect_size_2.hedgesG; } });
Object.defineProperty(exports, "cohensD", { enumerable: true, get: function () { return effect_size_2.cohensD; } });
Object.defineProperty(exports, "correlationEffectSize", { enumerable: true, get: function () { return effect_size_2.correlationEffectSize; } });
// Pooling methods
var pooling_2 = require("./pooling");
Object.defineProperty(exports, "fixedEffects", { enumerable: true, get: function () { return pooling_2.fixedEffects; } });
Object.defineProperty(exports, "randomEffects", { enumerable: true, get: function () { return pooling_2.randomEffects; } });
Object.defineProperty(exports, "pool", { enumerable: true, get: function () { return pooling_2.pool; } });
Object.defineProperty(exports, "calculateQ", { enumerable: true, get: function () { return pooling_2.calculateQ; } });
Object.defineProperty(exports, "calculateI2", { enumerable: true, get: function () { return pooling_2.calculateI2; } });
Object.defineProperty(exports, "mantelHaenszel", { enumerable: true, get: function () { return pooling_2.mantelHaenszel; } });
Object.defineProperty(exports, "peto", { enumerable: true, get: function () { return pooling_2.peto; } });
Object.defineProperty(exports, "estimateTau2", { enumerable: true, get: function () { return pooling_2.estimateTau2; } });
Object.defineProperty(exports, "Pooling", { enumerable: true, get: function () { return pooling_2.Pooling; } });
// Heterogeneity analysis
var heterogeneity_2 = require("./heterogeneity");
Object.defineProperty(exports, "analyzeHeterogeneity", { enumerable: true, get: function () { return heterogeneity_2.analyzeHeterogeneity; } });
Object.defineProperty(exports, "calculateQStatistic", { enumerable: true, get: function () { return heterogeneity_2.calculateQStatistic; } });
Object.defineProperty(exports, "computeI2", { enumerable: true, get: function () { return heterogeneity_2.calculateI2; } });
Object.defineProperty(exports, "calculateH2", { enumerable: true, get: function () { return heterogeneity_2.calculateH2; } });
Object.defineProperty(exports, "predictionInterval", { enumerable: true, get: function () { return heterogeneity_2.predictionInterval; } });
Object.defineProperty(exports, "Heterogeneity", { enumerable: true, get: function () { return heterogeneity_2.Heterogeneity; } });
// Publication bias
var bias_2 = require("./bias");
Object.defineProperty(exports, "eggerTest", { enumerable: true, get: function () { return bias_2.eggerTest; } });
Object.defineProperty(exports, "beggTest", { enumerable: true, get: function () { return bias_2.beggTest; } });
Object.defineProperty(exports, "trimFill", { enumerable: true, get: function () { return bias_2.trimFill; } });
Object.defineProperty(exports, "funnelPlotData", { enumerable: true, get: function () { return bias_2.funnelPlotData; } });
Object.defineProperty(exports, "analyzeBias", { enumerable: true, get: function () { return bias_2.analyzeBias; } });
Object.defineProperty(exports, "Bias", { enumerable: true, get: function () { return bias_2.Bias; } });
// Clinical translation
var clinical_2 = require("./clinical");
Object.defineProperty(exports, "calculateNNT", { enumerable: true, get: function () { return clinical_2.calculateNNT; } });
Object.defineProperty(exports, "nntFromLogOR", { enumerable: true, get: function () { return clinical_2.nntFromLogOR; } });
Object.defineProperty(exports, "calculateARR", { enumerable: true, get: function () { return clinical_2.calculateARR; } });
Object.defineProperty(exports, "calculateRRR", { enumerable: true, get: function () { return clinical_2.calculateRRR; } });
Object.defineProperty(exports, "calculateARI", { enumerable: true, get: function () { return clinical_2.calculateARI; } });
Object.defineProperty(exports, "orToRR", { enumerable: true, get: function () { return clinical_2.orToRR; } });
Object.defineProperty(exports, "logORToLogRR", { enumerable: true, get: function () { return clinical_2.logORToLogRR; } });
Object.defineProperty(exports, "rrToOR", { enumerable: true, get: function () { return clinical_2.rrToOR; } });
Object.defineProperty(exports, "probabilityOfBenefit", { enumerable: true, get: function () { return clinical_2.probabilityOfBenefit; } });
Object.defineProperty(exports, "expectedResponderRate", { enumerable: true, get: function () { return clinical_2.expectedResponderRate; } });
Object.defineProperty(exports, "interpretEffectSize", { enumerable: true, get: function () { return clinical_2.interpretEffectSize; } });
Object.defineProperty(exports, "Clinical", { enumerable: true, get: function () { return clinical_2.Clinical; } });
// GRADE assessment
var grade_2 = require("./grade");
Object.defineProperty(exports, "assessGRADE", { enumerable: true, get: function () { return grade_2.assessGRADE; } });
Object.defineProperty(exports, "assessRiskOfBias", { enumerable: true, get: function () { return grade_2.assessRiskOfBias; } });
Object.defineProperty(exports, "assessInconsistency", { enumerable: true, get: function () { return grade_2.assessInconsistency; } });
Object.defineProperty(exports, "assessIndirectness", { enumerable: true, get: function () { return grade_2.assessIndirectness; } });
Object.defineProperty(exports, "assessImprecision", { enumerable: true, get: function () { return grade_2.assessImprecision; } });
Object.defineProperty(exports, "assessPublicationBias", { enumerable: true, get: function () { return grade_2.assessPublicationBias; } });
Object.defineProperty(exports, "getCertaintyLevel", { enumerable: true, get: function () { return grade_2.getCertaintyLevel; } });
Object.defineProperty(exports, "getCertaintyDescription", { enumerable: true, get: function () { return grade_2.getCertaintyDescription; } });
Object.defineProperty(exports, "GRADE", { enumerable: true, get: function () { return grade_2.GRADE; } });
// Sensitivity analysis
var sensitivity_2 = require("./sensitivity");
Object.defineProperty(exports, "leaveOneOut", { enumerable: true, get: function () { return sensitivity_2.leaveOneOut; } });
Object.defineProperty(exports, "cumulative", { enumerable: true, get: function () { return sensitivity_2.cumulative; } });
Object.defineProperty(exports, "influence", { enumerable: true, get: function () { return sensitivity_2.influence; } });
Object.defineProperty(exports, "baujatData", { enumerable: true, get: function () { return sensitivity_2.baujatData; } });
Object.defineProperty(exports, "goshData", { enumerable: true, get: function () { return sensitivity_2.goshData; } });
Object.defineProperty(exports, "fragilityIndex", { enumerable: true, get: function () { return sensitivity_2.fragilityIndex; } });
Object.defineProperty(exports, "Sensitivity", { enumerable: true, get: function () { return sensitivity_2.Sensitivity; } });
// Statistical utilities
var statistics_1 = require("./utils/statistics");
Object.defineProperty(exports, "pnorm", { enumerable: true, get: function () { return statistics_1.pnorm; } });
Object.defineProperty(exports, "qnorm", { enumerable: true, get: function () { return statistics_1.qnorm; } });
Object.defineProperty(exports, "pchisq", { enumerable: true, get: function () { return statistics_1.pchisq; } });
Object.defineProperty(exports, "qchisq", { enumerable: true, get: function () { return statistics_1.qchisq; } });
Object.defineProperty(exports, "pt", { enumerable: true, get: function () { return statistics_1.pt; } });
Object.defineProperty(exports, "qt", { enumerable: true, get: function () { return statistics_1.qt; } });
Object.defineProperty(exports, "gamma", { enumerable: true, get: function () { return statistics_1.gamma; } });
Object.defineProperty(exports, "lgamma", { enumerable: true, get: function () { return statistics_1.lgamma; } });
Object.defineProperty(exports, "confidenceInterval", { enumerable: true, get: function () { return statistics_1.confidenceInterval; } });
Object.defineProperty(exports, "pFromZ", { enumerable: true, get: function () { return statistics_1.pFromZ; } });
Object.defineProperty(exports, "kendallTau", { enumerable: true, get: function () { return statistics_1.kendallTau; } });
// Version
exports.VERSION = '1.0.0';
// Convenience namespace for all functionality
exports.TruthCertMA = {
    MetaAnalysis: meta_analysis_1.MetaAnalysis,
    EffectSize: effect_size_1.EffectSize,
    Pooling: pooling_1.Pooling,
    Heterogeneity: heterogeneity_1.Heterogeneity,
    Bias: bias_1.Bias,
    Clinical: clinical_1.Clinical,
    GRADE: grade_1.GRADE,
    Sensitivity: sensitivity_1.Sensitivity,
    VERSION: '1.0.0'
};
//# sourceMappingURL=index.js.map