/**
 * TruthCert-MA Core Library
 * A comprehensive meta-analysis library for JavaScript/TypeScript
 *
 * @module @truthcert-ma/core
 * @license MIT
 */

import { MetaAnalysis as MetaAnalysisClass } from './meta-analysis';
import { EffectSize } from './effect-size';
import { Pooling } from './pooling';
import { Heterogeneity } from './heterogeneity';
import { Bias } from './bias';
import { Clinical } from './clinical';
import { GRADE } from './grade';
import { Sensitivity } from './sensitivity';

// Types
export type {
  // Study types
  BinaryStudy,
  ContinuousStudy,
  GenericStudy,
  EffectSizeResult,
  EffectMeasure,

  // Pooling types
  PoolingOptions,
  PooledResult,
  Tau2Estimator,
  ModelType,

  // Heterogeneity types
  QStatistic,
  HeterogeneityResult,

  // Bias types
  EggerResult,
  BeggResult,
  TrimFillResult,
  PublicationBiasResult,
  FunnelPlotData,

  // Clinical types
  NNTResult,
  ClinicalOptions,
  ConfidenceInterval,

  // Sensitivity types
  LeaveOneOutResult,
  InfluenceResult,

  // GRADE types
  GradeDomains,
  GradeResult,
  GradeCertainty,
  GradeRating,

  // Result types
  MetaAnalysisResult,

  // Plugin types
  HookName,
  HookPayloads,
  Plugin
} from './types';

// Main class
export { MetaAnalysis, default } from './meta-analysis';

// Effect size calculations
export {
  calculateEffectSize,
  calculateEffectSizes,
  logOddsRatio,
  logRiskRatio,
  riskDifference,
  standardizedMeanDifference,
  meanDifference,
  hedgesG,
  cohensD,
  correlationEffectSize
} from './effect-size';

// Pooling methods
export {
  fixedEffects,
  randomEffects,
  pool,
  calculateQ,
  calculateI2,
  mantelHaenszel,
  peto,
  estimateTau2,
  Pooling
} from './pooling';

// Heterogeneity analysis
export {
  analyzeHeterogeneity,
  calculateQStatistic,
  calculateI2 as computeI2,
  calculateH2,
  predictionInterval,
  Heterogeneity
} from './heterogeneity';

// Publication bias
export {
  eggerTest,
  beggTest,
  trimFill,
  funnelPlotData,
  analyzeBias,
  Bias
} from './bias';

// Clinical translation
export {
  calculateNNT,
  nntFromLogOR,
  calculateARR,
  calculateRRR,
  calculateARI,
  orToRR,
  logORToLogRR,
  rrToOR,
  probabilityOfBenefit,
  expectedResponderRate,
  interpretEffectSize,
  Clinical
} from './clinical';

// GRADE assessment
export {
  assessGRADE,
  assessRiskOfBias,
  assessInconsistency,
  assessIndirectness,
  assessImprecision,
  assessPublicationBias,
  getCertaintyLevel,
  getCertaintyDescription,
  GRADE
} from './grade';

// Sensitivity analysis
export {
  leaveOneOut,
  cumulative,
  influence,
  baujatData,
  goshData,
  fragilityIndex,
  Sensitivity
} from './sensitivity';

// Statistical utilities
export {
  pnorm,
  qnorm,
  pchisq,
  qchisq,
  pt,
  qt,
  gamma,
  lgamma,
  confidenceInterval,
  pFromZ,
  kendallTau
} from './utils/statistics';

// Version
export const VERSION = '1.0.0';

// Convenience namespace for all functionality
export const TruthCertMA = {
  MetaAnalysis: MetaAnalysisClass,
  EffectSize,
  Pooling,
  Heterogeneity,
  Bias,
  Clinical,
  GRADE,
  Sensitivity,
  VERSION: '1.0.0'
};
