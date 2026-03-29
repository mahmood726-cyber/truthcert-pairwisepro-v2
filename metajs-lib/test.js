/**
 * MetaJS Test Suite
 * Validates against R metafor package v4.8.0
 *
 * Run: node test.js
 */

const MetaAnalysis = require('./meta-analysis.js');

// Test utilities
let passed = 0;
let failed = 0;
const tolerance = 0.0001;

function approxEqual(a, b, tol = tolerance) {
  if (a === null || a === undefined || b === null || b === undefined) return false;
  if (isNaN(a) || isNaN(b)) return false;
  return Math.abs(a - b) < tol;
}

function test(name, actual, expected, tol = tolerance) {
  const pass = approxEqual(actual, expected, tol);
  if (pass) {
    passed++;
    console.log(`  ✓ ${name}: ${actual.toFixed(6)} ≈ ${expected.toFixed(6)}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}: ${actual?.toFixed(6)} ≠ ${expected.toFixed(6)}`);
  }
  return pass;
}

function section(name) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${name}`);
  console.log(`${'═'.repeat(60)}`);
}

function subsection(name) {
  console.log(`\n  ${name}`);
  console.log(`  ${'-'.repeat(40)}`);
}

// ============================================================
// TEST DATA: SGLT2 ACM Dataset (k=5)
// R Reference Values from metafor 4.8.0
// ============================================================

const SGLT2_ACM = [
  { study: "DAPA-HF 2019", events_t: 276, n_t: 2373, events_c: 329, n_c: 2371 },
  { study: "EMPEROR-Reduced 2020", events_t: 249, n_t: 1863, events_c: 266, n_c: 1867 },
  { study: "DELIVER 2022", events_t: 497, n_t: 3131, events_c: 526, n_c: 3132 },
  { study: "EMPEROR-Preserved 2021", events_t: 422, n_t: 2997, events_c: 463, n_c: 2991 },
  { study: "SOLOIST-WHF 2021", events_t: 51, n_t: 608, events_c: 58, n_c: 614 }
];

// R reference values for SGLT2_ACM
const R_SGLT2 = {
  yi: [-0.202235, -0.074131, -0.067398, -0.111143, -0.130414],
  vi: [0.007629, 0.009020, 0.004677, 0.005313, 0.040443],
  pooled_logOR: -0.109586,
  se: 0.038671,
  tau2: {
    DL: 0.000000,
    REML: 0.000000,
    ML: 0.000000,
    HE: 0.000000,
    SJ: 0.000726
  },
  I2: 0.0000,
  Q: 1.656246,
  Q_pval: 0.798649,
  hksj_ci: [-0.178674, -0.040497],
  hksj_pval: 0.011656,
  pi: [-0.185379, -0.033792]
};

// ============================================================
// TEST DATA: BCG Dataset (k=6)
// ============================================================

const BCG = [
  { study: "Aronson 1948", events_t: 4, n_t: 123, events_c: 11, n_c: 139 },
  { study: "Ferguson 1949", events_t: 6, n_t: 306, events_c: 29, n_c: 303 },
  { study: "Rosenthal 1960", events_t: 3, n_t: 231, events_c: 11, n_c: 220 },
  { study: "Hart 1977", events_t: 62, n_t: 13598, events_c: 248, n_c: 12867 },
  { study: "Frimodt-Moller 1973", events_t: 33, n_t: 5069, events_c: 47, n_c: 5808 },
  { study: "Comstock 1974", events_t: 180, n_t: 16913, events_c: 372, n_c: 17854 }
];

const R_BCG = {
  yi: [-0.938694, -1.666191, -1.386294, -1.456444, -0.219141, -0.682148],
  vi: [0.357125, 0.208132, 0.433413, 0.020314, 0.051952, 0.008361],
  pooled_logOR: -0.988076,
  se: 0.251054,
  tau2: {
    DL: 0.251009,
    REML: 0.256405,
    ML: 0.199176,
    HE: 0.119240
  },
  I2: 0.8511,
  Q: 32.974174
};

// ============================================================
// TEST DATA: BP Reduction (Continuous, k=5)
// ============================================================

const BP_DATA = [
  { study: "Trial A 2018", mean_t: -12.5, sd_t: 8.2, n_t: 150, mean_c: -4.2, sd_c: 7.8, n_c: 148 },
  { study: "Trial B 2019", mean_t: -10.8, sd_t: 9.1, n_t: 200, mean_c: -3.5, sd_c: 8.5, n_c: 205 },
  { study: "Trial C 2020", mean_t: -14.2, sd_t: 7.5, n_t: 180, mean_c: -5.1, sd_c: 8.0, n_c: 175 },
  { study: "Trial D 2021", mean_t: -11.3, sd_t: 8.8, n_t: 120, mean_c: -4.8, sd_c: 7.2, n_c: 118 },
  { study: "Trial E 2022", mean_t: -9.5, sd_t: 10.2, n_t: 95, mean_c: -2.8, sd_c: 9.8, n_c: 100 }
];

const R_BP = {
  MD: {
    pooled: -7.763485,
    se: 0.515009,
    tau2: 0.362294,
    I2: 0.2742
  },
  SMD: {
    pooled: -0.910505,
    se: 0.088008,
    tau2: 0.023297,
    I2: 0.6066
  }
};

// ============================================================
// RUN TESTS
// ============================================================

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║          MetaJS Validation Test Suite                    ║');
console.log('║          Reference: R metafor v4.8.0                     ║');
console.log('╚══════════════════════════════════════════════════════════╝');

// Test 1: Effect Size Calculations
section('TEST 1: Effect Size Calculations (Odds Ratio)');

const ma1 = new MetaAnalysis();
ma1.calculateEffectSizes(SGLT2_ACM, 'OR');

subsection('SGLT2_ACM Effect Sizes');
for (let i = 0; i < ma1.data.length; i++) {
  test(`yi[${i}] (${SGLT2_ACM[i].study})`, ma1.data[i].yi, R_SGLT2.yi[i]);
  test(`vi[${i}]`, ma1.data[i].vi, R_SGLT2.vi[i]);
}

// Test 2: BCG Effect Sizes
const ma2 = new MetaAnalysis();
ma2.calculateEffectSizes(BCG, 'OR');

subsection('BCG Effect Sizes');
for (let i = 0; i < ma2.data.length; i++) {
  test(`yi[${i}] (${BCG[i].study})`, ma2.data[i].yi, R_BCG.yi[i]);
  test(`vi[${i}]`, ma2.data[i].vi, R_BCG.vi[i]);
}

// Test 3: tau² Estimators
section('TEST 2: tau² Estimators');

subsection('SGLT2_ACM tau² (Low heterogeneity)');
for (const method of ['DL', 'REML', 'ML', 'HE']) {
  const model = ma1.runRandomEffectsModel({ method });
  test(`tau² (${method})`, model.tau2, R_SGLT2.tau2[method]);
}

subsection('BCG tau² (High heterogeneity)');
for (const method of ['DL', 'REML', 'ML', 'HE']) {
  const model = ma2.runRandomEffectsModel({ method });
  test(`tau² (${method})`, model.tau2, R_BCG.tau2[method]);
}

// Test 4: Random Effects Model
section('TEST 3: Random Effects Model Results');

subsection('SGLT2_ACM REML Model');
const reml1 = ma1.runRandomEffectsModel({ method: 'REML' });
test('Pooled log(OR)', reml1.estimate, R_SGLT2.pooled_logOR);
test('SE', reml1.se, R_SGLT2.se);
test('tau²', reml1.tau2, R_SGLT2.tau2.REML);
test('I²', reml1.I2, R_SGLT2.I2, 0.01);
test('Q statistic', reml1.Q, R_SGLT2.Q);
test('Q p-value', reml1.Q_pval, R_SGLT2.Q_pval);

subsection('BCG REML Model');
const reml2 = ma2.runRandomEffectsModel({ method: 'REML' });
test('Pooled log(OR)', reml2.estimate, R_BCG.pooled_logOR);
test('SE', reml2.se, R_BCG.se);
test('tau²', reml2.tau2, R_BCG.tau2.REML);
test('I²', reml2.I2, R_BCG.I2, 0.01);
test('Q statistic', reml2.Q, R_BCG.Q);

// Test 5: HKSJ Adjustment
section('TEST 4: HKSJ Adjustment');

const hksj1 = ma1.runRandomEffectsModel({ method: 'REML', hksj: true });
test('HKSJ CI lower', hksj1.hksj_ci_lb, R_SGLT2.hksj_ci[0]);
test('HKSJ CI upper', hksj1.hksj_ci_ub, R_SGLT2.hksj_ci[1]);
test('HKSJ p-value', hksj1.hksj_pval, R_SGLT2.hksj_pval);

// Test 6: Prediction Interval
section('TEST 5: Prediction Interval');

const pi1 = ma1.runRandomEffectsModel({ method: 'REML', predictionInterval: true });
test('PI lower', pi1.pi_lb, R_SGLT2.pi[0]);
test('PI upper', pi1.pi_ub, R_SGLT2.pi[1]);

// Test 7: Continuous Data (Mean Difference)
section('TEST 6: Continuous Data - Mean Difference');

const ma3 = new MetaAnalysis();
ma3.calculateEffectSizes(BP_DATA, 'MD');
const md = ma3.runRandomEffectsModel({ method: 'REML' });

test('Pooled MD', md.estimate, R_BP.MD.pooled);
test('SE', md.se, R_BP.MD.se);
test('tau²', md.tau2, R_BP.MD.tau2);
test('I²', md.I2, R_BP.MD.I2, 0.01);

// Test 8: Continuous Data (SMD / Hedges' g)
section('TEST 7: Continuous Data - SMD (Hedges\' g)');

const ma4 = new MetaAnalysis();
ma4.calculateEffectSizes(BP_DATA, 'SMD');
const smd = ma4.runRandomEffectsModel({ method: 'REML' });

test('Pooled g', smd.estimate, R_BP.SMD.pooled);
test('SE', smd.se, R_BP.SMD.se);
test('tau²', smd.tau2, R_BP.SMD.tau2);
test('I²', smd.I2, R_BP.SMD.I2, 0.01);

// Test 9: Leave-One-Out Analysis
section('TEST 8: Leave-One-Out Analysis');

const loo = ma1.leaveOneOut({ method: 'REML' });
console.log(`  Running leave-one-out for ${loo.length} studies...`);

// R reference for LOO (SGLT2_ACM)
const R_LOO = [
  { omitted: "DAPA-HF 2019", estimate: -0.086998 },
  { omitted: "EMPEROR-Reduced 2020", estimate: -0.116633 },
  { omitted: "DELIVER 2022", estimate: -0.129418 },
  { omitted: "EMPEROR-Preserved 2021", estimate: -0.108976 },
  { omitted: "SOLOIST-WHF 2021", estimate: -0.108786 }
];

for (let i = 0; i < loo.length; i++) {
  test(`LOO: omit ${loo[i].omitted}`, loo[i].estimate, R_LOO[i].estimate);
}

// Test 10: Publication Bias Tests
section('TEST 9: Publication Bias Tests');

subsection('Egger\'s Test');
const egger = ma1.eggerTest();
// R reference: intercept = -0.071842, p = 0.707189
test('Egger intercept', egger.intercept, -0.071842, 0.01);
test('Egger p-value', egger.pval, 0.707189, 0.01);

subsection('Begg\'s Test');
const begg = ma1.beggTest();
// R reference: tau = -0.400000, p = 0.483333
test('Begg tau', begg.tau, -0.400000, 0.01);

subsection('Trim-and-Fill');
const tf = ma1.trimAndFill();
// R reference: k0 = 0, adjusted = -0.109586
test('Imputed studies (k0)', tf.k0, 0, 0.5);

// Summary
console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║                    TEST SUMMARY                          ║');
console.log('╚══════════════════════════════════════════════════════════╝');

const total = passed + failed;
const pct = ((passed / total) * 100).toFixed(1);

console.log(`\n  Total Tests:  ${total}`);
console.log(`  Passed:       ${passed} (${pct}%)`);
console.log(`  Failed:       ${failed}`);
console.log('');

if (failed === 0) {
  console.log('  ✓ ALL TESTS PASSED - Validated against R metafor v4.8.0');
} else {
  console.log('  ✗ Some tests failed - review results above');
}

console.log('\n' + '═'.repeat(60) + '\n');

process.exit(failed > 0 ? 1 : 0);
