/**
 * MetaJS - TypeScript Definitions
 * @version 1.3.0
 */

declare module 'metajs-analysis' {
  export = MetaAnalysis;
}

declare class MetaAnalysis {
  constructor(options?: MetaAnalysis.Options);

  /** Study data with calculated effect sizes */
  data: MetaAnalysis.StudyData[];

  /** Model results from last analysis */
  model: MetaAnalysis.ModelResult | null;

  /** Analysis options */
  options: MetaAnalysis.Options;

  // ============================================
  // CORE METHODS
  // ============================================

  /**
   * Calculate effect sizes from raw study data
   * @param studies Array of study objects
   * @param measure Effect size measure (OR, RR, RD, SMD, MD, COR, ZCOR, PR, PLO, PFT, PAS)
   */
  calculateEffectSizes(studies: MetaAnalysis.RawStudy[], measure: MetaAnalysis.Measure): MetaAnalysis.StudyData[];

  /**
   * Run random-effects meta-analysis model
   * @param options Model options
   */
  runRandomEffectsModel(options?: MetaAnalysis.ModelOptions): MetaAnalysis.ModelResult;

  /**
   * Run fixed-effects meta-analysis model
   * @param options Model options
   */
  runFixedEffectsModel(options?: MetaAnalysis.ModelOptions): MetaAnalysis.ModelResult;

  /**
   * Meta-regression with one or more moderators
   * @param moderators Moderator variable name(s)
   * @param options Model options
   */
  metaRegression(moderators: string | string[], options?: MetaAnalysis.ModelOptions): MetaAnalysis.MetaRegressionResult;

  // ============================================
  // PUBLICATION BIAS TESTS
  // ============================================

  /**
   * Egger's regression test for publication bias
   */
  eggerTest(): MetaAnalysis.EggerResult;

  /**
   * Begg's rank correlation test for publication bias
   */
  beggTest(): MetaAnalysis.BeggResult;

  /**
   * Trim-and-Fill analysis for publication bias
   * @param side Side to fill ('left', 'right', or 'auto')
   */
  trimAndFill(side?: 'left' | 'right' | 'auto'): MetaAnalysis.TrimFillResult;

  /**
   * Fail-Safe N analysis (File Drawer Analysis)
   * @param options Configuration options
   */
  failSafeN(options?: MetaAnalysis.FailSafeNOptions): MetaAnalysis.FailSafeNResult;

  // ============================================
  // SENSITIVITY ANALYSIS
  // ============================================

  /**
   * Leave-one-out sensitivity analysis
   * @param options Analysis options
   */
  leaveOneOut(options?: MetaAnalysis.ModelOptions): MetaAnalysis.LeaveOneOutResult[];

  /**
   * Cumulative meta-analysis
   * @param options Analysis options or sortBy field
   */
  cumulativeMeta(options?: string | MetaAnalysis.CumulativeOptions): MetaAnalysis.CumulativeResult[];

  /**
   * Influence diagnostics
   */
  influenceDiagnostics(): MetaAnalysis.InfluenceResult[];

  /**
   * Subgroup analysis
   * @param groupVar Variable name to group by
   */
  subgroupAnalysis(groupVar: string): MetaAnalysis.SubgroupResult;

  // ============================================
  // VISUALIZATION DATA
  // ============================================

  /**
   * Get forest plot data
   */
  getForestPlotData(): MetaAnalysis.ForestPlotData[];

  /**
   * Get funnel plot data
   */
  getFunnelPlotData(): MetaAnalysis.FunnelPlotData;

  // ============================================
  // EXPORT METHODS
  // ============================================

  /**
   * Export to JSON format
   * @param options Export options
   */
  toJSON(options?: MetaAnalysis.ExportOptions): string;

  /**
   * Export to CSV format
   * @param options Export options
   */
  toCSV(options?: MetaAnalysis.CSVOptions): string;

  /**
   * Format result for display
   * @param options Formatting options
   */
  formatResult(options?: MetaAnalysis.FormatOptions): MetaAnalysis.FormattedResult | null;

  // ============================================
  // CONVENIENCE METHODS
  // ============================================

  /**
   * Get comprehensive summary of analysis
   */
  getSummary(): MetaAnalysis.Summary;

  /**
   * Get GRADE assessment of evidence certainty
   * @param options GRADE assessment options
   */
  getGRADESummary(options?: MetaAnalysis.GRADEOptions): MetaAnalysis.GRADEResult;

  /**
   * Set Risk of Bias for a study (chainable)
   * @param studyIdentifier Index or study name
   * @param robData RoB assessment data
   */
  setRiskOfBias(studyIdentifier: number | string, robData: MetaAnalysis.RoBData): MetaAnalysis;

  /**
   * Get Risk of Bias summary across all studies
   */
  getRiskOfBiasSummary(): MetaAnalysis.RoBSummary;

  /**
   * Get number of studies
   */
  getStudyCount(): number;

  /**
   * Check if pooled effect is statistically significant
   * @param alpha Significance level (default: 0.05)
   */
  isSignificant(alpha?: number): boolean;

  /**
   * Get heterogeneity level interpretation
   */
  getHeterogeneityLevel(): 'low' | 'moderate' | 'substantial' | 'considerable';

  /**
   * Get effect direction with significance assessment
   * @param options Direction options
   */
  getEffectDirection(options?: MetaAnalysis.EffectDirectionOptions): MetaAnalysis.EffectDirectionResult;

  // ============================================
  // CHAINABLE METHODS
  // ============================================

  /**
   * Set analysis option (chainable)
   * @param key Option name
   * @param value Option value
   */
  setOption(key: string, value: any): MetaAnalysis;

  /**
   * Add a pre-calculated effect size (chainable)
   * @param study Study object with yi and vi
   */
  addEffectSize(study: { yi: number; vi: number; study?: string; [key: string]: any }): MetaAnalysis;

  /**
   * Remove a study from the dataset (chainable)
   * @param identifier Index or study name
   */
  removeStudy(identifier: number | string): MetaAnalysis;

  /**
   * Reset the analysis (chainable)
   */
  reset(): MetaAnalysis;

  /**
   * Get accumulated warnings
   */
  getWarnings(): MetaAnalysis.Warning[];

  /**
   * Clear accumulated warnings (chainable)
   */
  clearWarnings(): MetaAnalysis;

  /**
   * Compare two model results
   */
  compareModels(model1: MetaAnalysis.ModelResult, model2: MetaAnalysis.ModelResult): MetaAnalysis.ModelComparison;

  /**
   * Validate data
   */
  validate(): MetaAnalysis.ValidationResult;

  // ============================================
  // STATIC PROPERTIES
  // ============================================

  static EffectSizes: MetaAnalysis.EffectSizesModule;
  static Tau2Estimators: MetaAnalysis.Tau2EstimatorsModule;
  static Heterogeneity: MetaAnalysis.HeterogeneityModule;
  static PublicationBias: MetaAnalysis.PublicationBiasModule;
  static Sensitivity: MetaAnalysis.SensitivityModule;
  static PooledEstimate: MetaAnalysis.PooledEstimateModule;
  static utils: MetaAnalysis.UtilsModule;
  static TOLERANCE: MetaAnalysis.ToleranceConfig;
  static MAX_ITERATIONS: MetaAnalysis.IterationsConfig;
  static CRITICAL_VALUES: MetaAnalysis.CriticalValuesConfig;
  static ROB_DOMAINS: MetaAnalysis.RoBDomainsConfig;
}

declare namespace MetaAnalysis {
  // ============================================
  // CONFIGURATION TYPES
  // ============================================

  interface Options {
    measure?: Measure;
    method?: Tau2Method;
    useHKSJ?: boolean;
    continuityCorrection?: number;
    level?: number;
    silent?: boolean;
    onWarning?: (warning: Warning) => void;
    onProgress?: (current: number, total: number, item: string) => void;
  }

  interface ModelOptions {
    method?: Tau2Method;
    hksj?: boolean;
    predictionInterval?: boolean;
    profileLikelihoodCI?: boolean;
    onProgress?: (current: number, total: number, item: string) => void;
  }

  interface CumulativeOptions {
    sortBy?: string;
    onProgress?: (current: number, total: number, item: string) => void;
  }

  interface FailSafeNOptions {
    alpha?: number;
    targetES?: number;
  }

  interface GRADEOptions {
    riskOfBias?: 'low' | 'some' | 'high';
    indirectness?: 'none' | 'some' | 'serious';
    optimalInformationSize?: number;
    publicationBiasDetected?: boolean;
  }

  interface EffectDirectionOptions {
    alpha?: number;
    favorLower?: boolean;
  }

  interface RoBData {
    overall?: 'low' | 'some' | 'high' | 'unclear';
    domains?: { [domain: string]: 'low' | 'some' | 'high' | 'unclear' };
    framework?: 'ROB2' | 'ROBINS_I';
    notes?: string;
  }

  interface Warning {
    message: string;
    context: string | null;
    timestamp: Date;
  }

  interface ExportOptions {
    includeModel?: boolean;
    includeStudies?: boolean;
    pretty?: boolean;
  }

  interface CSVOptions {
    delimiter?: string;
    includeHeader?: boolean;
  }

  interface FormatOptions {
    decimalPlaces?: number;
    transformBack?: boolean;
  }

  // ============================================
  // DATA TYPES
  // ============================================

  type Measure = 'OR' | 'RR' | 'RD' | 'SMD' | 'MD' | 'COR' | 'ZCOR' | 'PR' | 'PLO' | 'PFT' | 'PAS';
  type Tau2Method = 'DL' | 'REML' | 'ML' | 'PM' | 'HS' | 'SJ' | 'HE' | 'EB';

  interface RawStudy {
    study?: string;
    // Binary outcome data
    events_t?: number;
    n_t?: number;
    events_c?: number;
    n_c?: number;
    // Continuous outcome data
    mean_t?: number;
    sd_t?: number;
    mean_c?: number;
    sd_c?: number;
    // Correlation data
    r?: number;
    n?: number;
    // Proportion data
    events?: number;
    // Pre-calculated effect sizes
    yi?: number;
    vi?: number;
    // Additional moderators
    [key: string]: any;
  }

  interface StudyData {
    study: string;
    yi: number;
    vi: number;
    se: number;
    weight?: number;
    n_t?: number;
    n_c?: number;
    [key: string]: any;
  }

  // ============================================
  // RESULT TYPES
  // ============================================

  interface ModelResult {
    estimate: number;
    se: number;
    ci_lb: number;
    ci_ub: number;
    zval: number;
    pval: number;
    tau2: number;
    tau: number;
    tau2_ci_lb?: number;
    tau2_ci_ub?: number;
    I2: number;
    I2_ci_lb?: number;
    I2_ci_ub?: number;
    H2: number;
    Q: number;
    Q_df: number;
    Q_pval: number;
    k: number;
    method: string;
    hksj?: boolean;
    converged?: boolean;
    modelType?: 'fixed' | 'random';
    // HKSJ adjusted values
    hksj_ci_lb?: number;
    hksj_ci_ub?: number;
    hksj_tval?: number;
    hksj_pval?: number;
    // Prediction interval
    predictionInterval?: boolean;
    pi_lb?: number;
    pi_ub?: number;
  }

  interface MetaRegressionResult {
    coefficients: CoefficientResult[];
    tau2: number;
    tau: number;
    I2_residual: number;
    R2: number;
    QM: {
      Q: number;
      df: number;
      p: number;
    };
    QE: {
      Q: number;
      df: number;
      p: number;
    };
    k: number;
    p: number;
    moderators: string[];
  }

  interface CoefficientResult {
    name: string;
    estimate: number;
    se: number;
    zval: number;
    pval: number;
    ci_lb: number;
    ci_ub: number;
  }

  interface EggerResult {
    intercept: number;
    se: number;
    tval: number;
    pval: number;
    slope?: number;
  }

  interface BeggResult {
    tau: number;
    z?: number;
    pval: number;
  }

  interface TrimFillResult {
    k0: number;
    estimate: number;
    se: number;
    ci_lb: number;
    ci_ub: number;
    side: string;
    filled: StudyData[];
  }

  interface FailSafeNResult {
    rosenthal: {
      N: number;
      interpretation: string;
    };
    orwin: {
      N: number;
      targetES: number;
      interpretation: string;
    };
    rosenberg: {
      N: number;
      interpretation: string;
    };
    pooledEffect: number;
    k: number;
    alpha: number;
    method: string;
  }

  interface GRADEResult {
    certainty: 'High' | 'Moderate' | 'Low' | 'Very Low';
    certaintyScore: number;
    symbol: string;
    downgrades: string[];
    domains: {
      riskOfBias: { level: string; reason: string };
      inconsistency: { level: string; reason: string };
      indirectness: { level: string; reason: string };
      imprecision: { level: string; reason: string };
      publicationBias: { level: string; reason: string };
    };
    evidence: {
      k: number;
      estimate: number;
      ci: [number, number];
      I2: number;
      tau2: number;
    };
    interpretation: string;
  }

  interface RoBSummary {
    overall: {
      low: number;
      some: number;
      high: number;
      unclear: number;
      notAssessed: number;
    };
    byStudy: Array<{
      study: string;
      overall: string;
      domains: { [domain: string]: string };
    }>;
    studiesAssessed: number;
    studiesTotal: number;
    predominantRisk: string;
  }

  interface EffectDirectionResult {
    direction: 'favors_treatment' | 'favors_control' | 'no_difference';
    magnitude: 'large' | 'moderate' | 'small' | 'trivial';
    significant: boolean;
    pval: number;
    estimate: number;
    ci: [number, number];
    interpretation: string;
    measure: string;
  }

  interface LeaveOneOutResult {
    omitted: string;
    estimate: number;
    se: number;
    ci_lb: number;
    ci_ub: number;
    tau2: number;
    I2: number;
  }

  interface CumulativeResult {
    k: number;
    lastStudy: string;
    estimate: number;
    se: number;
    ci_lb: number;
    ci_ub: number;
    tau2: number;
    I2: number;
  }

  interface InfluenceResult {
    study: string;
    residual: number;
    rstudent: number;
    hat: number;
    cooksd: number;
    dfbetas: number;
  }

  interface SubgroupResult {
    subgroups: { [key: string]: ModelResult };
    test: {
      Q_between: number;
      df: number;
      p: number;
      heterogeneityDifference: string;
    };
    overall: ModelResult;
  }

  interface ForestPlotData {
    study: string;
    y: number;
    estimate: number;
    ci_lb: number;
    ci_ub: number;
    weight: number;
    isPooled: boolean;
  }

  interface FunnelPlotData {
    points: FunnelPoint[];
    pooledEstimate: number;
    lowerBound: FunnelBound[];
    upperBound: FunnelBound[];
    seMax: number;
    measure: string;
  }

  interface FunnelPoint {
    study: string;
    x: number;
    y: number;
    yi: number;
    se: number;
  }

  interface FunnelBound {
    se: number;
    x: number;
  }

  interface FormattedResult {
    estimate: string;
    ci: string;
    formatted: string;
    pval: string;
    I2: string;
    tau2: string;
  }

  interface Summary {
    estimate: number;
    ci: [number, number];
    pval: number;
    significant: boolean;
    heterogeneity: {
      tau2: number;
      tau2_ci: [number, number] | null;
      I2: number;
      I2_ci: [number, number] | null;
      I2_percent: string;
      level: string;
      Q: number;
      Q_pval: number;
    };
    studies: number;
    method: string;
    measure: string;
    formatted: {
      estimate: string;
      ci: string;
      pval: string;
      I2: string;
    };
  }

  interface ModelComparison {
    estimateDiff: number;
    seDiff: number;
    model1: {
      estimate: number;
      se: number;
      method: string;
    };
    model2: {
      estimate: number;
      se: number;
      method: string;
    };
    agreement: boolean;
  }

  interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    summary: {
      studies: number;
      errorCount: number;
      warningCount: number;
    };
  }

  interface ValidationError {
    code: string;
    study?: string;
    message: string;
  }

  interface ValidationWarning {
    code: string;
    study?: string;
    message: string;
  }

  // ============================================
  // MODULE TYPES
  // ============================================

  interface EffectSizesModule {
    oddsRatio(a: number, b: number, c: number, d: number): { yi: number; vi: number };
    riskRatio(a: number, b: number, c: number, d: number): { yi: number; vi: number };
    riskDiff(a: number, b: number, c: number, d: number): { yi: number; vi: number };
    smd(m1: number, s1: number, n1: number, m2: number, s2: number, n2: number): { yi: number; vi: number };
    meanDiff(m1: number, s1: number, n1: number, m2: number, s2: number, n2: number): { yi: number; vi: number };
    correlation(r: number, n: number): { yi: number; vi: number };
    fisherZ(r: number, n: number): { yi: number; vi: number };
    proportion(x: number, n: number): { yi: number; vi: number };
    logitProp(x: number, n: number): { yi: number; vi: number };
    freemanTukey(x: number, n: number): { yi: number; vi: number };
    arcsineProp(x: number, n: number): { yi: number; vi: number };
  }

  interface Tau2EstimatorsModule {
    DL(yi: number[], vi: number[]): { tau2: number; converged: boolean };
    REML(yi: number[], vi: number[]): { tau2: number; converged: boolean };
    ML(yi: number[], vi: number[]): { tau2: number; converged: boolean };
    PM(yi: number[], vi: number[]): { tau2: number; converged: boolean };
    HS(yi: number[], vi: number[]): { tau2: number; converged: boolean };
    SJ(yi: number[], vi: number[]): { tau2: number; converged: boolean };
    HE(yi: number[], vi: number[]): { tau2: number; converged: boolean };
    EB(yi: number[], vi: number[]): { tau2: number; converged: boolean };
  }

  interface HeterogeneityModule {
    calculate(yi: number[], vi: number[], tau2: number): {
      Q: number;
      df: number;
      p_Q: number;
      I2: number;
      H2: number;
      H: number;
      tau2: number;
      tau: number;
      typicalV: number;
    };
    tau2ConfidenceInterval(yi: number[], vi: number[], Q: number, level?: number): {
      tau2_lb: number;
      tau2_ub: number;
      level: number;
      method: string;
    };
    I2ConfidenceInterval(yi: number[], vi: number[], tau2CI: { tau2_lb: number; tau2_ub: number }, level?: number): {
      I2_lb: number;
      I2_ub: number;
      level: number;
      method: string;
    };
    profileLikelihoodCI(yi: number[], vi: number[], tau2_hat: number, method?: 'REML' | 'ML', level?: number): {
      tau2_lb: number;
      tau2_ub: number;
      level: number;
      method: string;
    };
  }

  interface PublicationBiasModule {
    egger(yi: number[], vi: number[]): { intercept: number; slope: number; se: number; t: number; p: number };
    begg(yi: number[], vi: number[]): { tau: number; z: number; p: number };
    trimFill(yi: number[], vi: number[], tau2: number, side?: string): {
      k0: number;
      estimate: number;
      se: number;
      side: string;
      imputed: any[];
    };
    failSafeN(yi: number[], vi: number[], options?: FailSafeNOptions): FailSafeNResult;
  }

  interface SensitivityModule {
    leaveOneOut(yi: number[], vi: number[], method?: string): LeaveOneOutResult[];
    influence(yi: number[], vi: number[], tau2: number): InfluenceResult[];
  }

  interface PooledEstimateModule {
    calculate(yi: number[], vi: number[], tau2: number, useHKSJ?: boolean): {
      estimate: number;
      se: number;
      ci_lb: number;
      ci_ub: number;
      zval: number;
      pval: number;
      weights: number[];
      hksj: boolean;
      hksj_mult: number;
      df: number;
    };
  }

  interface UtilsModule {
    sum(arr: number[]): number;
    mean(arr: number[]): number;
    variance(arr: number[]): number;
    normalCDF(x: number, mu?: number, sigma?: number): number;
    normalQuantile(p: number, mu?: number, sigma?: number): number;
    tCDF(t: number, df: number): number;
    tQuantile(p: number, df: number): number;
    chiSquareCDF(x: number, df: number): number;
    chiSquareQuantile(p: number, df: number): number;
    chiSquarePDF(x: number, df: number): number;
    lgamma(x: number): number;
  }

  interface ToleranceConfig {
    readonly CONVERGENCE: number;
    readonly ZERO_CHECK: number;
    readonly SMALL_VALUE: number;
    readonly BETA_EPS: number;
    readonly PIVOT: number;
  }

  interface IterationsConfig {
    readonly REML: number;
    readonly ML: number;
    readonly PM: number;
    readonly EB: number;
    readonly BETA_CF: number;
    readonly BISECTION: number;
  }

  interface CriticalValuesConfig {
    readonly Z_95: number;
    readonly Z_99: number;
    readonly Z_90: number;
  }

  interface RoBDomainsConfig {
    readonly ROB2: readonly string[];
    readonly ROBINS_I: readonly string[];
    readonly LEVELS: readonly string[];
  }
}
