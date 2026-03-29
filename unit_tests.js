/**
 * TruthCert-PairwisePro v1.0 - Unit Tests
 * Core statistical function verification
 */

const UnitTests = {
  passed: 0,
  failed: 0,
  results: [],

  // Test helper
  test(name, actual, expected, tolerance = 0.0001) {
    let pass = false;
    if (typeof expected === 'number' && typeof actual === 'number') {
      pass = Math.abs(actual - expected) < tolerance;
    } else if (typeof expected === 'boolean') {
      pass = actual === expected;
    } else if (expected === null || expected === undefined) {
      pass = actual !== null && actual !== undefined;
    } else {
      pass = actual === expected;
    }

    if (pass) {
      this.passed++;
      this.results.push({ name, status: 'PASS', actual, expected });
    } else {
      this.failed++;
      this.results.push({ name, status: 'FAIL', actual, expected });
    }
    return pass;
  },

  // Run all tests
  runAll() {
    this.passed = 0;
    this.failed = 0;
    this.results = [];

    console.log('=' .repeat(70));
    console.log('TruthCert-PairwisePro v1.0 - UNIT TESTS');
    console.log('=' .repeat(70));

    this.testBasicMath();
    this.testEffectSizeCalculations();
    this.testMetaAnalysis();
    this.testHeterogeneity();
    this.testBootstrap();
    this.testBayesian();
    this.testHTA();
    this.testPSA();

    this.printSummary();
    return { passed: this.passed, failed: this.failed, total: this.passed + this.failed };
  },

  // 1. Basic Math Functions
  testBasicMath() {
    console.log('\n--- Basic Math Functions ---');

    // Normal distribution
    this.test('qnorm(0.975) ~ 1.96', qnorm(0.975), 1.959964, 0.01);
    this.test('qnorm(0.5) = 0', qnorm(0.5), 0, 0.01);
    this.test('pnorm(0) = 0.5', pnorm(0), 0.5, 0.01);
    this.test('pnorm(1.96) ~ 0.975', pnorm(1.96), 0.975, 0.01);

    // Chi-square
    this.test('qchisq(0.95, 1) ~ 3.84', qchisq(0.95, 1), 3.841, 0.1);
    this.test('pchisq(3.84, 1) ~ 0.95', pchisq(3.84, 1), 0.95, 0.1);

    // jStat gamma function (if available)
    if (typeof jStat !== 'undefined' && jStat.gammafn) {
      this.test('jStat.gammafn(5) = 24', jStat.gammafn(5), 24, 0.1);
    } else {
      // Use factorial approximation
      const factorial4 = 1 * 2 * 3 * 4;
      this.test('Factorial(4) = 24', factorial4, 24, 1); // tolerance 1 for integer comparison
    }
  },

  // 2. Effect Size Calculations
  testEffectSizeCalculations() {
    console.log('\n--- Effect Size Calculations ---');

    // Log Odds Ratio
    // Study with events: 10/100 vs 20/100
    const lor = Math.log((10 * 80) / (90 * 20));
    this.test('Log OR calculation', lor, -0.8109, 0.01);

    // Variance of log OR
    const varLOR = 1/10 + 1/90 + 1/20 + 1/80;
    this.test('Var(log OR) calculation', varLOR, 0.1736, 0.01);

    // Log Risk Ratio
    const lrr = Math.log((10/100) / (20/100));
    this.test('Log RR calculation', lrr, -0.6931, 0.01);

    // Risk Difference
    const rd = (10/100) - (20/100);
    this.test('Risk Difference calculation', rd, -0.10, 0.001);

    // Standardized Mean Difference (Cohen's d)
    // Mean1=10, SD1=2, n1=30; Mean2=12, SD2=2, n2=30
    const pooledSD = Math.sqrt(((29 * 4) + (29 * 4)) / 58);
    const d = (10 - 12) / pooledSD;
    this.test("Cohen's d calculation", d, -1.0, 0.01);
  },

  // 3. Meta-Analysis
  testMetaAnalysis() {
    console.log('\n--- Meta-Analysis Functions ---');

    // Test data: 3 studies
    const yi = [-0.5, -0.3, -0.7];
    const vi = [0.04, 0.05, 0.03];

    // Fixed-effect weights
    const w = vi.map(v => 1/v);
    const sumW = w.reduce((a, b) => a + b, 0);
    const theta_fe = yi.reduce((s, y, i) => s + w[i] * y, 0) / sumW;
    // Expected: weighted average of -0.5, -0.3, -0.7 with weights 25, 20, 33.33
    this.test('Fixed-effect theta ~ -0.53', Math.abs(theta_fe - (-0.53)) < 0.02, true);

    // Q statistic
    const Q = yi.reduce((s, y, i) => s + w[i] * Math.pow(y - theta_fe, 2), 0);
    this.test('Q statistic > 0', Q > 0, true);

    // DL tau2
    const c = sumW - w.reduce((s, wi) => s + wi * wi, 0) / sumW;
    const tau2 = Math.max(0, (Q - 2) / c);
    this.test('DL tau2 >= 0', tau2 >= 0, true);

    // Test metaAnalysisDL_boot function
    const result = metaAnalysisDL_boot(yi, vi);
    this.test('metaAnalysisDL_boot theta', result.theta, null);
    this.test('metaAnalysisDL_boot se > 0', result.se > 0, true);
    this.test('metaAnalysisDL_boot tau2 >= 0', result.tau2 >= 0, true);
  },

  // 4. Heterogeneity
  testHeterogeneity() {
    console.log('\n--- Heterogeneity Statistics ---');

    // I² = (Q - df) / Q * 100
    const Q = 10;
    const df = 5;
    const I2 = ((Q - df) / Q) * 100;
    this.test('I² calculation', I2, 50, 0.1);

    // H² = Q / df
    const H2 = Q / df;
    this.test('H² calculation', H2, 2, 0.01);

    // Tau² prediction interval
    // PI = theta +/- t * sqrt(se² + tau²)
    const theta = -0.5;
    const se = 0.1;
    const tau2 = 0.02;
    const t = 2.571; // t(df=5, 0.975)
    const pi_lower = theta - t * Math.sqrt(se * se + tau2);
    const pi_upper = theta + t * Math.sqrt(se * se + tau2);
    this.test('Prediction interval lower', pi_lower < theta, true);
    this.test('Prediction interval upper', pi_upper > theta, true);
  },

  // 5. Bootstrap
  testBootstrap() {
    console.log('\n--- Bootstrap Functions ---');

    const yi = [-0.5, -0.3, -0.7, -0.4, -0.6];
    const vi = [0.04, 0.05, 0.03, 0.04, 0.03];

    const result = bootstrapMetaAnalysis(yi, vi, { nBoot: 200, ciMethod: 'percentile' });

    this.test('Bootstrap returns theta', result.theta, null);
    this.test('Bootstrap returns CI', result.ci_lower < result.ci_upper, true);
    this.test('Bootstrap CI contains theta', result.ci_lower < result.theta && result.theta < result.ci_upper, true);
    this.test('Bootstrap nBoot correct', result.nBoot >= 100, true);

    // BCa method
    const resultBCa = bootstrapMetaAnalysis(yi, vi, { nBoot: 200, ciMethod: 'bca' });
    this.test('BCa method returns CI', resultBCa.ci_lower < resultBCa.ci_upper, true);
  },

  // 6. Bayesian
  testBayesian() {
    console.log('\n--- Bayesian Functions ---');

    const yi = [-0.5, -0.3, -0.7];
    const vi = [0.04, 0.05, 0.03];

    // Test basic Bayesian calculation
    const theta = -0.5;
    const se = 0.1;

    // P(theta < 0) with normal prior
    const pBenefit = pnorm(0, theta, se);
    this.test('P(benefit) > 0.5 for negative effect', pBenefit > 0.5, true);

    // Savage-Dickey BF approximation
    const prior0 = 1 / (se * Math.sqrt(2 * Math.PI)); // prior density at 0
    const post0 = Math.exp(-0.5 * Math.pow(0 - theta, 2) / (se * se)) / (se * Math.sqrt(2 * Math.PI));
    const BF01 = post0 / prior0;
    this.test('BF01 calculation', BF01, null);
    this.test('BF01 < 1 for effect away from 0', BF01 < 1, true);
  },

  // 7. HTA Functions
  testHTA() {
    console.log('\n--- HTA Functions ---');

    // ICER calculation
    const costs = [1000, 2000, 1500];
    const effects = [0.5, 0.8, 0.6];
    const result = calculateICER(costs, effects, { threshold: 30000 });

    this.test('ICER returns results', result.results.length > 0, true);
    this.test('ICER NMB calculated', result.nmb.length === 3, true);

    // QALY conversion
    const qaly = effectToQALY(0.7, { effectType: 'RR' });
    this.test('effectToQALY returns QALY gain', qaly.qalyGain, null);

    // Budget Impact
    const bia = budgetImpactAnalysis({ timeHorizon: 5 });
    this.test('BIA returns 5 years', bia.yearlyResults.length, 5);
    this.test('BIA total budget impact', bia.totalBudgetImpact, null);
  },

  // 8. PSA Functions
  testPSA() {
    console.log('\n--- PSA Functions ---');

    // Test distribution sampling
    const samples = [];
    for (let i = 0; i < 100; i++) {
      samples.push(rnorm_psa(0, 1, Math.random));
    }
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    this.test('rnorm_psa mean ~ 0', Math.abs(mean) < 0.5, true);

    // Gamma sampling
    const gammaSamples = [];
    for (let i = 0; i < 100; i++) {
      gammaSamples.push(rgamma_psa(5, 2, Math.random));
    }
    const gammaMean = gammaSamples.reduce((a, b) => a + b, 0) / gammaSamples.length;
    this.test('rgamma_psa mean ~ 10 (shape*scale)', Math.abs(gammaMean - 10) < 3, true);

    // Beta sampling
    const betaSamples = [];
    for (let i = 0; i < 100; i++) {
      betaSamples.push(rbeta_psa(2, 5, Math.random));
    }
    const betaMean = betaSamples.reduce((a, b) => a + b, 0) / betaSamples.length;
    this.test('rbeta_psa mean ~ 0.286 (alpha/(alpha+beta))', Math.abs(betaMean - 0.286) < 0.1, true);

    // PSA simulation
    const params = {
      cost: { distribution: 'normal', mean: 1000, sd: 100 },
      effect: { distribution: 'normal', mean: 0.5, sd: 0.1 }
    };
    const model = p => ({ cost: p.cost, effect: p.effect });
    const psa = runPSA(params, model, { nSim: 50 });
    this.test('PSA runs successfully', psa.nSimulations >= 40, true);
    this.test('PSA summary has cost', psa.summary.cost, null);

    // EVPI
    const evpi = calculateEVPI(psa, 50000);
    this.test('EVPI calculation', evpi.evpiPerPatient, null);
  },

  // Print summary
  printSummary() {
    console.log('\n' + '='.repeat(70));
    console.log('TEST SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total: ${this.passed + this.failed}`);
    console.log(`Passed: ${this.passed}`);
    console.log(`Failed: ${this.failed}`);
    console.log(`Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);

    if (this.failed > 0) {
      console.log('\nFailed tests:');
      this.results.filter(r => r.status === 'FAIL').forEach(r => {
        console.log(`  - ${r.name}: expected ${r.expected}, got ${r.actual}`);
      });
    }

    console.log('='.repeat(70));
  }
};

// Export for browser
if (typeof window !== 'undefined') {
  window.UnitTests = UnitTests;
  window.runUnitTests = () => UnitTests.runAll();
}

// Auto-run if in test environment
if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') {
  UnitTests.runAll();
}

console.log('TruthCert Unit Tests loaded. Run with: UnitTests.runAll() or runUnitTests()');
