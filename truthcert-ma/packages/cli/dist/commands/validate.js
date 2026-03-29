"use strict";
/**
 * Validate command - Validate input data format
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCommand = void 0;
const chalk_1 = __importDefault(require("chalk"));
const data_loader_1 = require("../utils/data-loader");
function asNumber(value) {
    if (typeof value === 'number' && Number.isFinite(value))
        return value;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed)
            return undefined;
        const n = Number(trimmed);
        if (Number.isFinite(n))
            return n;
    }
    return undefined;
}
async function validateCommand(file, options) {
    console.log(chalk_1.default.cyan(`\nValidating: ${file}`));
    console.log('─'.repeat(50));
    const errors = [];
    const warnings = [];
    let data;
    try {
        data = await (0, data_loader_1.loadData)(file);
    }
    catch (error) {
        console.log(chalk_1.default.red('✗ Failed to load file'));
        console.error(chalk_1.default.red(`  ${error.message}`));
        process.exit(1);
    }
    console.log(chalk_1.default.green(`✓ File loaded successfully`));
    console.log(`  Records found: ${data.length}`);
    if (data.length === 0) {
        errors.push('No data records found in file');
    }
    // Check data format
    if (data.length > 0) {
        const firstRow = data[0];
        const hasEffectSize = 'yi' in firstRow && 'vi' in firstRow;
        const hasBinary = ('ai' in firstRow && 'bi' in firstRow && 'ci' in firstRow && 'di' in firstRow) ||
            ('events1' in firstRow && 'total1' in firstRow && 'events2' in firstRow && 'total2' in firstRow);
        const hasContinuous = ('m1i' in firstRow && 'sd1i' in firstRow && 'n1i' in firstRow && 'm2i' in firstRow && 'sd2i' in firstRow && 'n2i' in firstRow) ||
            ('mean1' in firstRow && 'sd1' in firstRow && 'n1' in firstRow && 'mean2' in firstRow && 'sd2' in firstRow && 'n2' in firstRow);
        if (hasEffectSize) {
            console.log(chalk_1.default.green('✓ Detected format: Pre-calculated effect sizes'));
            validateEffectSizeData(data, errors, warnings, options.strict);
        }
        else if (hasBinary) {
            console.log(chalk_1.default.green('✓ Detected format: Binary outcome data'));
            validateBinaryData(data, errors, warnings, options.strict);
        }
        else if (hasContinuous) {
            console.log(chalk_1.default.green('✓ Detected format: Continuous outcome data'));
            validateContinuousData(data, errors, warnings, options.strict);
        }
        else {
            errors.push('Unable to detect data format. Expected effect sizes (yi, vi), binary (ai, bi, ci, di or events1, total1, events2, total2), or continuous (m1i, sd1i, n1i, m2i, sd2i, n2i or mean1, sd1, n1, mean2, sd2, n2)');
        }
    }
    // Report results
    console.log('\n' + '─'.repeat(50));
    if (errors.length === 0 && warnings.length === 0) {
        console.log(chalk_1.default.green.bold('✓ Validation passed - No issues found'));
        process.exit(0);
    }
    if (warnings.length > 0) {
        console.log(chalk_1.default.yellow(`\n⚠ ${warnings.length} Warning(s):`));
        warnings.forEach((w, i) => console.log(chalk_1.default.yellow(`  ${i + 1}. ${w}`)));
    }
    if (errors.length > 0) {
        console.log(chalk_1.default.red(`\n✗ ${errors.length} Error(s):`));
        errors.forEach((e, i) => console.log(chalk_1.default.red(`  ${i + 1}. ${e}`)));
        process.exit(1);
    }
    process.exit(0);
}
exports.validateCommand = validateCommand;
function validateEffectSizeData(data, errors, warnings, strict) {
    data.forEach((row, i) => {
        const rowNum = i + 1;
        // Required fields
        if (typeof row.yi !== 'number' || isNaN(row.yi)) {
            errors.push(`Row ${rowNum}: Invalid or missing 'yi' (effect size)`);
        }
        if (typeof row.vi !== 'number' || isNaN(row.vi)) {
            errors.push(`Row ${rowNum}: Invalid or missing 'vi' (variance)`);
        }
        else if (row.vi <= 0) {
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
function validateBinaryData(data, errors, warnings, strict) {
    data.forEach((row, i) => {
        const rowNum = i + 1;
        const ai = asNumber(row.ai ?? row.events1);
        const ci = asNumber(row.ci ?? row.events2);
        const bi = asNumber(row.bi);
        const di = asNumber(row.di);
        const total1 = asNumber(row.total1);
        const total2 = asNumber(row.total2);
        const resolvedBi = bi ?? (total1 !== undefined && ai !== undefined ? total1 - ai : undefined);
        const resolvedDi = di ?? (total2 !== undefined && ci !== undefined ? total2 - ci : undefined);
        const resolvedTotal1 = total1 ?? (ai !== undefined && resolvedBi !== undefined ? ai + resolvedBi : undefined);
        const resolvedTotal2 = total2 ?? (ci !== undefined && resolvedDi !== undefined ? ci + resolvedDi : undefined);
        const fields = [
            ['ai/events1', ai],
            ['bi/non-events1', resolvedBi],
            ['ci/events2', ci],
            ['di/non-events2', resolvedDi]
        ];
        fields.forEach(([name, value]) => {
            if (value === undefined || Number.isNaN(value)) {
                errors.push(`Row ${rowNum}: Invalid or missing '${name}'`);
            }
            else if (value < 0) {
                errors.push(`Row ${rowNum}: '${name}' cannot be negative`);
            }
            else if (!Number.isInteger(value)) {
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
        if (ai === 0 ||
            ci === 0 ||
            (ai !== undefined && resolvedTotal1 !== undefined && ai === resolvedTotal1) ||
            (ci !== undefined && resolvedTotal2 !== undefined && ci === resolvedTotal2)) {
            warnings.push(`Row ${rowNum}: Contains zero cells (continuity correction will be applied)`);
        }
        // Sample size warnings
        if (strict && resolvedTotal1 !== undefined && resolvedTotal2 !== undefined && (resolvedTotal1 < 10 || resolvedTotal2 < 10)) {
            warnings.push(`Row ${rowNum}: Very small sample size`);
        }
    });
}
function validateContinuousData(data, errors, warnings, strict) {
    data.forEach((row, i) => {
        const rowNum = i + 1;
        const mean1 = asNumber(row.m1i ?? row.mean1);
        const sd1 = asNumber(row.sd1i ?? row.sd1);
        const n1 = asNumber(row.n1i ?? row.n1);
        const mean2 = asNumber(row.m2i ?? row.mean2);
        const sd2 = asNumber(row.sd2i ?? row.sd2);
        const n2 = asNumber(row.n2i ?? row.n2);
        const fields = [
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
//# sourceMappingURL=validate.js.map