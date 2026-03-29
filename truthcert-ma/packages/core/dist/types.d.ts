/**
 * TruthCert-MA Core Types
 * @packageDocumentation
 */
/** Binary outcome study data (2x2 table) */
export interface BinaryStudy {
    id?: string;
    study?: string;
    /** Events in treatment group */
    ai: number;
    /** Non-events in treatment group */
    bi: number;
    /** Events in control group */
    ci: number;
    /** Non-events in control group */
    di: number;
}
/** Continuous outcome study data */
export interface ContinuousStudy {
    id?: string;
    study?: string;
    /** Mean in treatment group */
    m1i: number;
    /** SD in treatment group */
    sd1i: number;
    /** Sample size in treatment group */
    n1i: number;
    /** Mean in control group */
    m2i: number;
    /** SD in control group */
    sd2i: number;
    /** Sample size in control group */
    n2i: number;
}
/** Pre-calculated effect size data */
export interface EffectSizeStudy {
    id?: string;
    study?: string;
    /** Effect size (yi) */
    yi: number;
    /** Variance (vi) */
    vi: number;
    /** Standard error (optional, calculated from vi if not provided) */
    se?: number;
    /** Sample size (optional) */
    n?: number;
}
/** Generic study type */
export type Study = BinaryStudy | ContinuousStudy | EffectSizeStudy;
/** Backward-compatible alias */
export type GenericStudy = Study;
/** Effect size measures */
export type EffectMeasure = 'OR' | 'RR' | 'RD' | 'SMD' | 'MD' | 'COR' | 'ZCOR' | 'logOR' | 'logRR';
/** Calculated effect size result */
export interface EffectSizeResult {
    /** Effect size value */
    yi: number;
    /** Variance */
    vi: number;
    /** Standard error */
    se: number;
    /** Sample size (optional) */
    n?: number;
    /** Study identifier */
    id?: string;
    /** Original study data */
    study?: string;
}
/** Tau-squared estimators */
export type Tau2Estimator = 'REML' | 'DL' | 'PM' | 'SJ' | 'HS' | 'HE' | 'EB' | 'ML';
/** Pooling model type */
export type ModelType = 'fixed' | 'random';
/** Pooling method options */
export interface PoolingOptions {
    /** Pooling method */
    method?: Tau2Estimator;
    /** Model type */
    model?: ModelType;
    /** Confidence level (default: 0.95) */
    confidenceLevel?: number;
    /** Maximum iterations for iterative methods */
    maxIterations?: number;
    /** Convergence tolerance */
    tolerance?: number;
}
/** Confidence interval */
export interface ConfidenceInterval {
    lower: number;
    upper: number;
    level: number;
}
/** Pooled effect result */
export interface PooledResult {
    /** Pooled effect size */
    theta: number;
    /** Standard error */
    se: number;
    /** Confidence interval */
    ci: ConfidenceInterval;
    /** Z-statistic */
    z: number;
    /** P-value */
    p: number;
    /** Weights used */
    weights: number[];
}
/** Q statistic result */
export interface QStatistic {
    /** Q value */
    value: number;
    /** Degrees of freedom */
    df: number;
    /** P-value */
    p: number;
}
/** Heterogeneity result */
export interface HeterogeneityResult {
    /** Q statistic */
    Q: QStatistic;
    /** I-squared (%) */
    I2: number;
    /** Tau-squared (between-study variance) */
    tau2: number;
    /** Tau (SD of true effects) */
    tau: number;
    /** H-squared */
    H2: number;
    /** Prediction interval */
    predictionInterval?: ConfidenceInterval;
}
/** Egger's test result */
export interface EggerResult {
    /** Intercept */
    intercept: number;
    /** Standard error of intercept */
    se: number;
    /** T-statistic */
    t: number;
    /** P-value */
    p: number;
    /** Interpretation */
    interpretation: string;
}
/** Begg's test result */
export interface BeggResult {
    /** Kendall's tau */
    tau: number;
    /** Z-statistic */
    z: number;
    /** P-value */
    p: number;
}
/** Trim-and-fill result */
export interface TrimFillResult {
    /** Number of imputed studies */
    k0: number;
    /** Side of imputation */
    side: 'left' | 'right';
    /** Adjusted pooled effect */
    adjusted: PooledResult;
    /** Imputed studies */
    imputed: EffectSizeResult[];
}
/** Publication bias result */
export interface PublicationBiasResult {
    egger?: EggerResult;
    begg?: BeggResult;
    trimFill?: TrimFillResult;
}
/** NNT/NNH result */
export interface NNTResult {
    /** Number needed to treat */
    nnt: number;
    /** Confidence interval */
    ci: ConfidenceInterval;
    /** Absolute risk reduction */
    arr: number;
    /** Interpretation */
    interpretation: string;
}
/** Clinical translation options */
export interface ClinicalOptions {
    /** Baseline risk (control event rate) */
    baselineRisk: number;
    /** Minimal clinically important difference */
    mcid?: number;
    /** Time horizon (for rates) */
    timeHorizon?: number;
}
/** GRADE domain rating */
export type GradeRating = 'none' | 'serious' | 'very_serious';
/** GRADE certainty level */
export type GradeCertainty = 'high' | 'moderate' | 'low' | 'very_low';
/** GRADE domain scores */
export interface GradeDomains {
    riskOfBias: {
        rating: GradeRating;
        downgrade: number;
        notes: string;
    };
    inconsistency: {
        rating: GradeRating;
        downgrade: number;
        notes: string;
    };
    indirectness: {
        rating: GradeRating;
        downgrade: number;
        notes: string;
    };
    imprecision: {
        rating: GradeRating;
        downgrade: number;
        notes: string;
    };
    publicationBias: {
        rating: GradeRating;
        downgrade: number;
        notes: string;
    };
}
/** GRADE result */
export interface GradeResult {
    domains: GradeDomains;
    certainty: GradeCertainty;
    totalDowngrades: number;
}
/** Leave-one-out result */
export interface LeaveOneOutResult {
    /** Study omitted */
    omitted: string;
    /** Pooled effect without this study */
    theta: number;
    /** Standard error */
    se: number;
    /** Confidence interval */
    ci: ConfidenceInterval;
    /** I-squared */
    I2: number;
}
/** Influence diagnostics */
export interface InfluenceResult {
    /** Study ID */
    study: string;
    /** Studentized residual */
    rstudent: number;
    /** DFFITS */
    dffits: number;
    /** Cook's distance */
    cooks: number;
    /** Covariance ratio */
    covRatio: number;
    /** Hat value (leverage) */
    hat: number;
    /** Weight */
    weight: number;
    /** Is influential? */
    influential: boolean;
}
/** Meta-regression result */
export interface MetaRegressionResult {
    /** Coefficients */
    coefficients: {
        name: string;
        estimate: number;
        se: number;
        z: number;
        p: number;
        ci: ConfidenceInterval;
    }[];
    /** Residual heterogeneity */
    tau2Residual: number;
    /** R-squared (variance explained) */
    R2: number;
    /** QM (test of moderators) */
    QM: {
        value: number;
        df: number;
        p: number;
    };
    /** QE (residual heterogeneity) */
    QE: {
        value: number;
        df: number;
        p: number;
    };
}
/** Complete meta-analysis result */
export interface MetaAnalysisResult {
    /** Pooled effect */
    pooled: PooledResult;
    /** Individual study results */
    studies: EffectSizeResult[];
    /** Heterogeneity statistics */
    heterogeneity: HeterogeneityResult;
    /** Publication bias (if calculated) */
    bias?: PublicationBiasResult;
    /** Clinical translation (if calculated) */
    clinical?: NNTResult;
    /** GRADE assessment (if calculated) */
    grade?: GradeResult;
    /** Sensitivity analysis (if calculated) */
    sensitivity?: {
        leaveOneOut?: LeaveOneOutResult[];
        influence?: InfluenceResult[];
    };
    /** Meta-regression (if calculated) */
    metaRegression?: MetaRegressionResult;
    /** Analysis metadata */
    meta: {
        method: Tau2Estimator;
        model: ModelType;
        effectMeasure?: EffectMeasure;
        k: number;
        timestamp: string;
    };
}
/** Plugin hook names */
export type HookName = 'before:analyze' | 'after:analyze' | 'before:pool' | 'after:pool' | 'effect-size:register' | 'estimator:register' | 'output:register' | 'parser:register';
/** Plugin definition */
export interface Plugin {
    name: string;
    version: string;
    hooks?: Partial<Record<HookName, (...args: any[]) => void>>;
}
/** Payload map for plugin hooks */
export type HookPayloads = Record<HookName, unknown>;
/** Forest plot data for rendering */
export interface ForestPlotData {
    studies: {
        id: string;
        yi: number;
        ci: ConfidenceInterval;
        weight: number;
        weightPercent: number;
    }[];
    pooled: {
        yi: number;
        ci: ConfidenceInterval;
    };
    predictionInterval?: ConfidenceInterval;
    scale: {
        min: number;
        max: number;
        nullValue: number;
    };
}
/** Funnel plot data for rendering */
export interface FunnelPlotData {
    studies: {
        x: number;
        y: number;
    }[];
    pooledEffect: number;
    pseudoCI: {
        lower: (se: number) => number;
        upper: (se: number) => number;
    };
}
//# sourceMappingURL=types.d.ts.map