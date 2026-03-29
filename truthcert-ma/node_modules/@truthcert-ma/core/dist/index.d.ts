/**
 * TruthCert-MA Core Library
 * A comprehensive meta-analysis library for JavaScript/TypeScript
 *
 * @module @truthcert-ma/core
 * @license MIT
 */
import { MetaAnalysis as MetaAnalysisClass } from './meta-analysis';
export type { BinaryStudy, ContinuousStudy, GenericStudy, EffectSizeResult, EffectMeasure, PoolingOptions, PooledResult, Tau2Estimator, ModelType, QStatistic, HeterogeneityResult, EggerResult, BeggResult, TrimFillResult, PublicationBiasResult, FunnelPlotData, NNTResult, ClinicalOptions, ConfidenceInterval, LeaveOneOutResult, InfluenceResult, GradeDomains, GradeResult, GradeCertainty, GradeRating, MetaAnalysisResult, HookName, HookPayloads, Plugin } from './types';
export { MetaAnalysis, default } from './meta-analysis';
export { calculateEffectSize, calculateEffectSizes, logOddsRatio, logRiskRatio, riskDifference, standardizedMeanDifference, meanDifference, hedgesG, cohensD, correlationEffectSize } from './effect-size';
export { fixedEffects, randomEffects, pool, calculateQ, calculateI2, mantelHaenszel, peto, estimateTau2, Pooling } from './pooling';
export { analyzeHeterogeneity, calculateQStatistic, calculateI2 as computeI2, calculateH2, predictionInterval, Heterogeneity } from './heterogeneity';
export { eggerTest, beggTest, trimFill, funnelPlotData, analyzeBias, Bias } from './bias';
export { calculateNNT, nntFromLogOR, calculateARR, calculateRRR, calculateARI, orToRR, logORToLogRR, rrToOR, probabilityOfBenefit, expectedResponderRate, interpretEffectSize, Clinical } from './clinical';
export { assessGRADE, assessRiskOfBias, assessInconsistency, assessIndirectness, assessImprecision, assessPublicationBias, getCertaintyLevel, getCertaintyDescription, GRADE } from './grade';
export { leaveOneOut, cumulative, influence, baujatData, goshData, fragilityIndex, Sensitivity } from './sensitivity';
export { pnorm, qnorm, pchisq, qchisq, pt, qt, gamma, lgamma, confidenceInterval, pFromZ, kendallTau } from './utils/statistics';
export declare const VERSION = "1.0.0";
export declare const TruthCertMA: {
    MetaAnalysis: typeof MetaAnalysisClass;
    EffectSize: {
        logOddsRatio: typeof import("./effect-size").logOddsRatio;
        logRiskRatio: typeof import("./effect-size").logRiskRatio;
        riskDifference: typeof import("./effect-size").riskDifference;
        arcsineRiskDifference: typeof import("./effect-size").arcsineRiskDifference;
        standardizedMeanDifference: typeof import("./effect-size").standardizedMeanDifference;
        meanDifference: typeof import("./effect-size").meanDifference;
        cohensD: typeof import("./effect-size").cohensD;
        glassDelta: typeof import("./effect-size").glassDelta;
        smd: typeof import("./effect-size").standardizedMeanDifference;
        md: typeof import("./effect-size").meanDifference;
        correlation: typeof import("./effect-size").correlationEffectSize;
        fisherZ: typeof import("./effect-size").fisherZ;
        inverseFisherZ: typeof import("./effect-size").inverseFisherZ;
        calculate: typeof import("./effect-size").calculateEffectSize;
        calculateMany: typeof import("./effect-size").calculateEffectSizes;
    };
    Pooling: {
        fixedEffects: typeof import("./pooling").fixedEffects;
        randomEffects: typeof import("./pooling").randomEffects;
        pool: typeof import("./pooling").pool;
        calculateQ: typeof import("./pooling").calculateQ;
        calculateI2: typeof import("./pooling").calculateI2;
        calculateH2: typeof import("./pooling").calculateH2;
        predictionInterval: typeof import("./pooling").predictionInterval;
        mantelHaenszel: typeof import("./pooling").mantelHaenszel;
        peto: typeof import("./pooling").peto;
        estimators: {
            reml: typeof import("./pooling").reml;
            dl: typeof import("./pooling").dl;
            pm: typeof import("./pooling").pm;
            sj: typeof import("./pooling").sj;
            hs: typeof import("./pooling").hs;
            he: typeof import("./pooling").he;
            eb: typeof import("./pooling").eb;
            ml: typeof import("./pooling").ml;
        };
    };
    Heterogeneity: {
        calculateQ: typeof import("./heterogeneity").calculateQ;
        calculateI2: typeof import("./heterogeneity").calculateI2;
        calculateI2CI: typeof import("./heterogeneity").calculateI2CI;
        calculateH2: typeof import("./heterogeneity").calculateH2;
        calculatePredictionInterval: typeof import("./heterogeneity").calculatePredictionInterval;
        calculateTau: typeof import("./heterogeneity").calculateTau;
        interpretI2: typeof import("./heterogeneity").interpretI2;
        analyze: typeof import("./heterogeneity").analyzeHeterogeneity;
    };
    Bias: {
        eggerTest: typeof import("./bias").eggerTest;
        beggTest: typeof import("./bias").beggTest;
        trimFill: typeof import("./bias").trimFill;
        funnelPlotData: typeof import("./bias").funnelPlotData;
        analyze: typeof import("./bias").analyzeBias;
    };
    Clinical: {
        calculateNNT: typeof import("./clinical").calculateNNT;
        nntFromLogOR: typeof import("./clinical").nntFromLogOR;
        calculateARR: typeof import("./clinical").calculateARR;
        calculateRRR: typeof import("./clinical").calculateRRR;
        calculateARI: typeof import("./clinical").calculateARI;
        orToRR: typeof import("./clinical").orToRR;
        logORToLogRR: typeof import("./clinical").logORToLogRR;
        rrToOR: typeof import("./clinical").rrToOR;
        probabilityOfBenefit: typeof import("./clinical").probabilityOfBenefit;
        expectedResponderRate: typeof import("./clinical").expectedResponderRate;
        interpretEffectSize: typeof import("./clinical").interpretEffectSize;
    };
    GRADE: {
        assessRiskOfBias: typeof import("./grade").assessRiskOfBias;
        assessInconsistency: typeof import("./grade").assessInconsistency;
        assessIndirectness: typeof import("./grade").assessIndirectness;
        assessImprecision: typeof import("./grade").assessImprecision;
        assessPublicationBias: typeof import("./grade").assessPublicationBias;
        getCertaintyLevel: typeof import("./grade").getCertaintyLevel;
        getCertaintyDescription: typeof import("./grade").getCertaintyDescription;
        assess: typeof import("./grade").assessGRADE;
    };
    Sensitivity: {
        leaveOneOut: typeof import("./sensitivity").leaveOneOut;
        cumulative: typeof import("./sensitivity").cumulative;
        influence: typeof import("./sensitivity").influence;
        baujatData: typeof import("./sensitivity").baujatData;
        goshData: typeof import("./sensitivity").goshData;
        fragilityIndex: typeof import("./sensitivity").fragilityIndex;
    };
    VERSION: string;
};
//# sourceMappingURL=index.d.ts.map