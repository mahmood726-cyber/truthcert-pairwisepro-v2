/**
 * GRADE (Grading of Recommendations Assessment, Development, and Evaluation)
 * @module grade
 */

import type {
  GradeResult,
  GradeDomains,
  GradeRating,
  GradeCertainty,
  HeterogeneityResult,
  PublicationBiasResult,
  PooledResult
} from '../types';

/**
 * Auto-assess risk of bias domain
 *
 * Note: This is a simplified assessment. Full ROB assessment
 * requires study-level data and manual evaluation.
 */
export function assessRiskOfBias(
  options: {
    hasRandomization?: boolean;
    hasBlinding?: boolean;
    hasAllocation?: boolean;
    attritionRate?: number;
    selectiveReporting?: boolean;
  } = {}
): { rating: GradeRating; downgrade: number; notes: string } {
  let concerns = 0;
  const notes: string[] = [];

  if (options.hasRandomization === false) {
    concerns++;
    notes.push('Unclear randomization');
  }
  if (options.hasBlinding === false) {
    concerns++;
    notes.push('No blinding');
  }
  if (options.attritionRate && options.attritionRate > 0.2) {
    concerns++;
    notes.push(`High attrition (${(options.attritionRate * 100).toFixed(0)}%)`);
  }
  if (options.selectiveReporting === true) {
    concerns++;
    notes.push('Selective reporting suspected');
  }

  if (concerns >= 2) {
    return { rating: 'very_serious', downgrade: -2, notes: notes.join('; ') };
  } else if (concerns === 1) {
    return { rating: 'serious', downgrade: -1, notes: notes.join('; ') };
  }
  return { rating: 'none', downgrade: 0, notes: 'No serious concerns' };
}

/**
 * Auto-assess inconsistency domain
 *
 * Based on I² and prediction interval
 */
export function assessInconsistency(
  heterogeneity: HeterogeneityResult
): { rating: GradeRating; downgrade: number; notes: string } {
  const { I2, predictionInterval, Q } = heterogeneity;

  // Check if Q is significant
  const qSignificant = Q.p < 0.10;

  // Check if PI crosses null (for log scale, null = 0)
  const piCrossesNull = predictionInterval &&
    predictionInterval.lower < 0 && predictionInterval.upper > 0;

  const notes: string[] = [];

  if (I2 >= 75) {
    notes.push(`Very high I² (${I2.toFixed(1)}%)`);
    if (qSignificant) notes.push('Q significant');
    if (piCrossesNull) notes.push('PI crosses null');
    return { rating: 'very_serious', downgrade: -2, notes: notes.join('; ') };
  } else if (I2 >= 50 || (qSignificant && piCrossesNull)) {
    notes.push(`Moderate-high I² (${I2.toFixed(1)}%)`);
    if (qSignificant) notes.push('Q significant');
    return { rating: 'serious', downgrade: -1, notes: notes.join('; ') };
  }

  return { rating: 'none', downgrade: 0, notes: `I² = ${I2.toFixed(1)}%` };
}

/**
 * Auto-assess indirectness domain
 *
 * Note: Full assessment requires comparison of PICO elements
 */
export function assessIndirectness(
  options: {
    populationMatch?: boolean;
    interventionMatch?: boolean;
    comparatorMatch?: boolean;
    outcomeMatch?: boolean;
    indirectComparison?: boolean;
  } = {}
): { rating: GradeRating; downgrade: number; notes: string } {
  let concerns = 0;
  const notes: string[] = [];

  if (options.populationMatch === false) {
    concerns++;
    notes.push('Population differs');
  }
  if (options.interventionMatch === false) {
    concerns++;
    notes.push('Intervention differs');
  }
  if (options.comparatorMatch === false) {
    concerns++;
    notes.push('Comparator differs');
  }
  if (options.outcomeMatch === false) {
    concerns++;
    notes.push('Outcome differs');
  }
  if (options.indirectComparison === true) {
    concerns++;
    notes.push('Indirect comparison');
  }

  if (concerns >= 2) {
    return { rating: 'very_serious', downgrade: -2, notes: notes.join('; ') };
  } else if (concerns === 1) {
    return { rating: 'serious', downgrade: -1, notes: notes.join('; ') };
  }
  return { rating: 'none', downgrade: 0, notes: 'No serious concerns' };
}

/**
 * Auto-assess imprecision domain
 *
 * Based on confidence interval width and optimal information size
 */
export function assessImprecision(
  pooled: PooledResult,
  options: {
    mcid?: number;
    totalN?: number;
    oisMet?: boolean;
  } = {}
): { rating: GradeRating; downgrade: number; notes: string } {
  const { ci, theta } = pooled;
  const ciWidth = Math.abs(ci.upper - ci.lower);
  const notes: string[] = [];

  // Check if CI crosses null (0 for log scale)
  const crossesNull = ci.lower < 0 && ci.upper > 0;

  // Check if CI crosses MCID (if provided)
  const mcid = options.mcid || 0;
  const crossesMCID = mcid > 0 && (
    (ci.lower < mcid && ci.upper > mcid) ||
    (ci.lower < -mcid && ci.upper > -mcid)
  );

  // Check optimal information size
  const smallSample = options.totalN && options.totalN < 400;

  if (crossesNull && crossesMCID) {
    notes.push('CI crosses null and MCID');
    if (smallSample) notes.push('Small sample size');
    return { rating: 'very_serious', downgrade: -2, notes: notes.join('; ') };
  } else if (crossesNull || (ciWidth > 1.0)) {
    notes.push(crossesNull ? 'CI crosses null' : `Wide CI (${ciWidth.toFixed(2)})`);
    if (smallSample) notes.push('Small sample size');
    return { rating: 'serious', downgrade: -1, notes: notes.join('; ') };
  }

  notes.push(`CI: ${ci.lower.toFixed(2)} to ${ci.upper.toFixed(2)}`);
  return { rating: 'none', downgrade: 0, notes: notes.join('; ') };
}

/**
 * Auto-assess publication bias domain
 */
export function assessPublicationBias(
  bias?: PublicationBiasResult,
  k?: number
): { rating: GradeRating; downgrade: number; notes: string } {
  if (!bias) {
    return { rating: 'none', downgrade: 0, notes: 'Not assessed' };
  }

  const notes: string[] = [];
  let concerns = 0;

  // Egger test
  if (bias.egger && bias.egger.p < 0.10) {
    concerns++;
    notes.push(`Egger p = ${bias.egger.p.toFixed(3)}`);
  }

  // Begg test
  if (bias.begg && bias.begg.p < 0.10) {
    concerns++;
    notes.push(`Begg p = ${bias.begg.p.toFixed(3)}`);
  }

  // Trim-and-fill
  if (bias.trimFill && bias.trimFill.k0 > 0) {
    const proportionMissing = k ? bias.trimFill.k0 / k : 0;
    if (proportionMissing > 0.2) {
      concerns++;
      notes.push(`${bias.trimFill.k0} imputed studies`);
    }
  }

  // Small number of studies limits assessment
  if (k && k < 10) {
    notes.push('Limited assessment (k < 10)');
  }

  if (concerns >= 2) {
    return { rating: 'very_serious', downgrade: -2, notes: notes.join('; ') };
  } else if (concerns === 1) {
    return { rating: 'serious', downgrade: -1, notes: notes.join('; ') };
  }
  return { rating: 'none', downgrade: 0, notes: notes.join('; ') || 'No significant asymmetry' };
}

/**
 * Get certainty level from total downgrades
 */
export function getCertaintyLevel(totalDowngrades: number): GradeCertainty {
  if (totalDowngrades === 0) return 'high';
  if (totalDowngrades === -1) return 'moderate';
  if (totalDowngrades === -2) return 'low';
  return 'very_low';
}

/**
 * Full GRADE assessment
 *
 * @param pooled - Pooled analysis results
 * @param heterogeneity - Heterogeneity results
 * @param bias - Publication bias results
 * @param options - Additional assessment options
 * @returns Complete GRADE assessment
 */
export function assessGRADE(
  pooled: PooledResult,
  heterogeneity: HeterogeneityResult,
  bias?: PublicationBiasResult,
  options: {
    k?: number;
    riskOfBias?: Parameters<typeof assessRiskOfBias>[0];
    indirectness?: Parameters<typeof assessIndirectness>[0];
    imprecision?: Parameters<typeof assessImprecision>[1];
  } = {}
): GradeResult {
  const domains: GradeDomains = {
    riskOfBias: assessRiskOfBias(options.riskOfBias || {}),
    inconsistency: assessInconsistency(heterogeneity),
    indirectness: assessIndirectness(options.indirectness || {}),
    imprecision: assessImprecision(pooled, options.imprecision || {}),
    publicationBias: assessPublicationBias(bias, options.k)
  };

  const totalDowngrades =
    domains.riskOfBias.downgrade +
    domains.inconsistency.downgrade +
    domains.indirectness.downgrade +
    domains.imprecision.downgrade +
    domains.publicationBias.downgrade;

  const certainty = getCertaintyLevel(totalDowngrades);

  return {
    domains,
    certainty,
    totalDowngrades: Math.abs(totalDowngrades)
  };
}

/**
 * Get GRADE certainty description
 */
export function getCertaintyDescription(certainty: GradeCertainty): string {
  switch (certainty) {
    case 'high':
      return 'We are very confident that the true effect lies close to the estimate';
    case 'moderate':
      return 'We are moderately confident in the effect estimate; the true effect is likely close to the estimate but may be substantially different';
    case 'low':
      return 'Our confidence in the effect estimate is limited; the true effect may be substantially different';
    case 'very_low':
      return 'We have very little confidence in the effect estimate; the true effect is likely substantially different';
  }
}

/**
 * GRADE namespace
 */
export const GRADE = {
  assessRiskOfBias,
  assessInconsistency,
  assessIndirectness,
  assessImprecision,
  assessPublicationBias,
  getCertaintyLevel,
  getCertaintyDescription,
  assess: assessGRADE
};
