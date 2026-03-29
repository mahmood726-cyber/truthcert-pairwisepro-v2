/**
 * GRADE (Grading of Recommendations Assessment, Development, and Evaluation)
 * @module grade
 */
import type { GradeResult, GradeRating, GradeCertainty, HeterogeneityResult, PublicationBiasResult, PooledResult } from '../types';
/**
 * Auto-assess risk of bias domain
 *
 * Note: This is a simplified assessment. Full ROB assessment
 * requires study-level data and manual evaluation.
 */
export declare function assessRiskOfBias(options?: {
    hasRandomization?: boolean;
    hasBlinding?: boolean;
    hasAllocation?: boolean;
    attritionRate?: number;
    selectiveReporting?: boolean;
}): {
    rating: GradeRating;
    downgrade: number;
    notes: string;
};
/**
 * Auto-assess inconsistency domain
 *
 * Based on I² and prediction interval
 */
export declare function assessInconsistency(heterogeneity: HeterogeneityResult): {
    rating: GradeRating;
    downgrade: number;
    notes: string;
};
/**
 * Auto-assess indirectness domain
 *
 * Note: Full assessment requires comparison of PICO elements
 */
export declare function assessIndirectness(options?: {
    populationMatch?: boolean;
    interventionMatch?: boolean;
    comparatorMatch?: boolean;
    outcomeMatch?: boolean;
    indirectComparison?: boolean;
}): {
    rating: GradeRating;
    downgrade: number;
    notes: string;
};
/**
 * Auto-assess imprecision domain
 *
 * Based on confidence interval width and optimal information size
 */
export declare function assessImprecision(pooled: PooledResult, options?: {
    mcid?: number;
    totalN?: number;
    oisMet?: boolean;
}): {
    rating: GradeRating;
    downgrade: number;
    notes: string;
};
/**
 * Auto-assess publication bias domain
 */
export declare function assessPublicationBias(bias?: PublicationBiasResult, k?: number): {
    rating: GradeRating;
    downgrade: number;
    notes: string;
};
/**
 * Get certainty level from total downgrades
 */
export declare function getCertaintyLevel(totalDowngrades: number): GradeCertainty;
/**
 * Full GRADE assessment
 *
 * @param pooled - Pooled analysis results
 * @param heterogeneity - Heterogeneity results
 * @param bias - Publication bias results
 * @param options - Additional assessment options
 * @returns Complete GRADE assessment
 */
export declare function assessGRADE(pooled: PooledResult, heterogeneity: HeterogeneityResult, bias?: PublicationBiasResult, options?: {
    k?: number;
    riskOfBias?: Parameters<typeof assessRiskOfBias>[0];
    indirectness?: Parameters<typeof assessIndirectness>[0];
    imprecision?: Parameters<typeof assessImprecision>[1];
}): GradeResult;
/**
 * Get GRADE certainty description
 */
export declare function getCertaintyDescription(certainty: GradeCertainty): string;
/**
 * GRADE namespace
 */
export declare const GRADE: {
    assessRiskOfBias: typeof assessRiskOfBias;
    assessInconsistency: typeof assessInconsistency;
    assessIndirectness: typeof assessIndirectness;
    assessImprecision: typeof assessImprecision;
    assessPublicationBias: typeof assessPublicationBias;
    getCertaintyLevel: typeof getCertaintyLevel;
    getCertaintyDescription: typeof getCertaintyDescription;
    assess: typeof assessGRADE;
};
//# sourceMappingURL=index.d.ts.map