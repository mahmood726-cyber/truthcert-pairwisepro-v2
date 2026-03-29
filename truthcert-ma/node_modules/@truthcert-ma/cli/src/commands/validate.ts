/**
 * Validate command - Validate input data format
 */

import chalk from 'chalk';
import { loadData } from '../utils/data-loader';

interface ValidateOptions {
  strict?: boolean;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const n = Number(trimmed);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

export async function validateCommand(file: string, options: ValidateOptions): Promise<void> {
  console.log(chalk.cyan(`\nValidating: ${file}`));
  console.log('─'.repeat(50));

  const errors: string[] = [];
  const warnings: string[] = [];
  let data: any[];

  try {
    data = await loadData(file);
  } catch (error) {
    console.log(chalk.red('✗ Failed to load file'));
    console.error(chalk.red(`  ${(error as Error).message}`));
    process.exit(1);
  }

  console.log(chalk.green(`✓ File loaded successfully`));
  console.log(`  Records found: ${data.length}`);

  if (data.length === 0) {
    errors.push('No data records found in file');
  }

  // Check data format
  if (data.length > 0) {
    const firstRow = data[0];
    const hasEffectSize = 'yi' in firstRow && 'vi' in firstRow;
    const hasBinary =
      ('ai' in firstRow && 'bi' in firstRow && 'ci' in firstRow && 'di' in firstRow) ||
      ('events1' in firstRow && 'total1' in firstRow && 'events2' in firstRow && 'total2' in firstRow);
    const hasContinuous =
      ('m1i' in firstRow && 'sd1i' in firstRow && 'n1i' in firstRow && 'm2i' in firstRow && 'sd2i' in firstRow && 'n2i' in firstRow) ||
      ('mean1' in firstRow && 'sd1' in firstRow && 'n1' in firstRow && 'mean2' in firstRow && 'sd2' in firstRow && 'n2' in firstRow);

    if (hasEffectSize) {
      console.log(chalk.green('✓ Detected format: Pre-calculated effect sizes'));
      validateEffectSizeData(data, errors, warnings, options.strict);
    } else if (hasBinary) {
      console.log(chalk.green('✓ Detected format: Binary outcome data'));
      validateBinaryData(data, errors, warnings, options.strict);
    } else if (hasContinuous) {
      console.log(chalk.green('✓ Detected format: Continuous outcome data'));
      validateContinuousData(data, errors, warnings, options.strict);
    } else {
      errors.push('Unable to detect data format. Expected effect sizes (yi, vi), binary (ai, bi, ci, di or events1, total1, events2, total2), or continuous (m1i, sd1i, n1i, m2i, sd2i, n2i or mean1, sd1, n1, mean2, sd2, n2)');
    }
  }

  // Report results
  console.log('\n' + '─'.repeat(50));

  if (errors.length === 0 && warnings.length === 0) {
    console.log(chalk.green.bold('✓ Validation passed - No issues found'));
    process.exit(0);
  }

  if (warnings.length > 0) {
    console.log(chalk.yellow(`\n⚠ ${warnings.length} Warning(s):`));
    warnings.forEach((w, i) => console.log(chalk.yellow(`  ${i + 1}. ${w}`)));
  }

  if (errors.length > 0) {
    console.log(chalk.red(`\n✗ ${errors.length} Error(s):`));
    errors.forEach((e, i) => console.log(chalk.red(`  ${i + 1}. ${e}`)));
    process.exit(1);
  }

  process.exit(0);
}

function validateEffectSizeData(
  data: any[],
  errors: string[],
  warnings: string[],
  strict?: boolean
): void {
  data.forEach((row, i) => {
    const rowNum = i + 1;

    // Required fields
    if (typeof row.yi !== 'number' || isNaN(row.yi)) {
      errors.push(`Row ${rowNum}: Invalid or missing 'yi' (effect size)`);
    }

    if (typeof row.vi !== 'number' || isNaN(row.vi)) {
      errors.push(`Row ${rowNum}: Invalid or missing 'vi' (variance)`);
    } else if (row.vi <= 0) {
      errors.push(`Row ${rowNum}: Variance 'vi' must be positive (got ${row.vi})`);
    }

    // Optional but recommended
    if (strict && !row.study && !row.id) {
      warnings.push(`Row ${rowNum}: No study identifier provided`);
    }

    // Check for extreme values
    if (Math.abs(row.yi) > 10) {
      warnings.push(`Row ${rowNum}: Effect size may be extreme (yi = ${row.yi})`);
    }
  });
}

function validateBinaryData(
  data: any[],
  errors: string[],
  warnings: string[],
  strict?: boolean
): void {
  data.forEach((row, i) => {
    const rowNum = i + 1;

    const ai = asNumber((row as any).ai ?? (row as any).events1);
    const ci = asNumber((row as any).ci ?? (row as any).events2);
    const bi = asNumber((row as any).bi);
    const di = asNumber((row as any).di);
    const total1 = asNumber((row as any).total1);
    const total2 = asNumber((row as any).total2);

    const resolvedBi = bi ?? (total1 !== undefined && ai !== undefined ? total1 - ai : undefined);
    const resolvedDi = di ?? (total2 !== undefined && ci !== undefined ? total2 - ci : undefined);
    const resolvedTotal1 = total1 ?? (ai !== undefined && resolvedBi !== undefined ? ai + resolvedBi : undefined);
    const resolvedTotal2 = total2 ?? (ci !== undefined && resolvedDi !== undefined ? ci + resolvedDi : undefined);

    const fields: Array<[string, number | undefined]> = [
      ['ai/events1', ai],
      ['bi/non-events1', resolvedBi],
      ['ci/events2', ci],
      ['di/non-events2', resolvedDi]
    ];

    fields.forEach(([name, value]) => {
      if (value === undefined || Number.isNaN(value)) {
        errors.push(`Row ${rowNum}: Invalid or missing '${name}'`);
      } else if (value < 0) {
        errors.push(`Row ${rowNum}: '${name}' cannot be negative`);
      } else if (!Number.isInteger(value)) {
        warnings.push(`Row ${rowNum}: '${name}' should be an integer`);
      }
    });

    // Logical checks
    if (ai !== undefined && resolvedTotal1 !== undefined && ai > resolvedTotal1) {
      errors.push(`Row ${rowNum}: treatment events cannot exceed treatment total`);
    }
    if (ci !== undefined && resolvedTotal2 !== undefined && ci > resolvedTotal2) {
      errors.push(`Row ${rowNum}: control events cannot exceed control total`);
    }

    // Zero cell check
    if (
      ai === 0 ||
      ci === 0 ||
      (ai !== undefined && resolvedTotal1 !== undefined && ai === resolvedTotal1) ||
      (ci !== undefined && resolvedTotal2 !== undefined && ci === resolvedTotal2)
    ) {
      warnings.push(`Row ${rowNum}: Contains zero cells (continuity correction will be applied)`);
    }

    // Sample size warnings
    if (strict && resolvedTotal1 !== undefined && resolvedTotal2 !== undefined && (resolvedTotal1 < 10 || resolvedTotal2 < 10)) {
      warnings.push(`Row ${rowNum}: Very small sample size`);
    }
  });
}

function validateContinuousData(
  data: any[],
  errors: string[],
  warnings: string[],
  strict?: boolean
): void {
  data.forEach((row, i) => {
    const rowNum = i + 1;

    const mean1 = asNumber((row as any).m1i ?? (row as any).mean1);
    const sd1 = asNumber((row as any).sd1i ?? (row as any).sd1);
    const n1 = asNumber((row as any).n1i ?? (row as any).n1);
    const mean2 = asNumber((row as any).m2i ?? (row as any).mean2);
    const sd2 = asNumber((row as any).sd2i ?? (row as any).sd2);
    const n2 = asNumber((row as any).n2i ?? (row as any).n2);

    const fields: Array<[string, number | undefined]> = [
      ['mean1/m1i', mean1],
      ['sd1/sd1i', sd1],
      ['n1/n1i', n1],
      ['mean2/m2i', mean2],
      ['sd2/sd2i', sd2],
      ['n2/n2i', n2]
    ];
    fields.forEach(([name, value]) => {
      if (value === undefined || Number.isNaN(value)) {
        errors.push(`Row ${rowNum}: Invalid or missing '${name}'`);
      }
    });

    // SD must be positive
    if (sd1 !== undefined && sd1 <= 0) {
      errors.push(`Row ${rowNum}: sd1 must be positive (got ${sd1})`);
    }
    if (sd2 !== undefined && sd2 <= 0) {
      errors.push(`Row ${rowNum}: sd2 must be positive (got ${sd2})`);
    }

    // N must be positive integer
    if (n1 !== undefined && (n1 <= 0 || !Number.isInteger(n1))) {
      errors.push(`Row ${rowNum}: n1 must be a positive integer (got ${n1})`);
    }
    if (n2 !== undefined && (n2 <= 0 || !Number.isInteger(n2))) {
      errors.push(`Row ${rowNum}: n2 must be a positive integer (got ${n2})`);
    }

    // Sample size warnings
    if (strict && n1 !== undefined && n2 !== undefined && (n1 < 10 || n2 < 10)) {
      warnings.push(`Row ${rowNum}: Very small sample size`);
    }
  });
}
