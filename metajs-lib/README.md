# MetaJS - JavaScript Meta-Analysis Library

A comprehensive, validated JavaScript library for conducting meta-analysis, designed to match the statistical rigor of R's **metafor** package.

## Features

- **11 Effect Size Measures**: OR, RR, RD, SMD, MD, COR, ZCOR, PR, PLO, PFT, PAS
- **8 tau² Estimators**: DL, REML, ML, PM, HS, SJ, HE, EB
- **Fixed & Random Effects**: Both model types supported
- **HKSJ Adjustment**: Hartung-Knapp-Sidik-Jonkman small-study correction
- **Confidence Intervals**: For tau² and I² (Q-profile method)
- **Meta-Regression**: With multiple moderators and R² calculation
- **Subgroup Analysis**: With Q-between test for heterogeneity
- **Publication Bias**: Egger's test, Begg's test, Trim-and-Fill
- **Sensitivity Analysis**: Leave-one-out, influence diagnostics, cumulative meta
- **Export Options**: JSON and CSV formats
- **TypeScript Support**: Full type definitions included
- **Multiple Access Methods**: Browser, Node.js, CLI
- **Validated**: 100% match with R metafor v4.8.0 (63/63 tests)

## Installation

### npm (Node.js)

```bash
npm install metajs-analysis
```

### Browser (CDN)

```html
<script src="https://unpkg.com/metajs-analysis/meta-analysis.js"></script>
```

### Browser (Local)

```html
<script src="meta-analysis.js"></script>
```

## Quick Start

### Node.js

```javascript
const MetaAnalysis = require('metajs-analysis');

// Your study data
const studies = [
  { study: "DAPA-HF 2019", events_t: 276, n_t: 2373, events_c: 329, n_c: 2371 },
  { study: "EMPEROR 2020", events_t: 249, n_t: 1863, events_c: 266, n_c: 1867 },
  { study: "DELIVER 2022", events_t: 497, n_t: 3131, events_c: 526, n_c: 3132 }
];

// Create instance and run analysis
const ma = new MetaAnalysis();
ma.calculateEffectSizes(studies, 'OR');
const result = ma.runRandomEffectsModel({ method: 'REML', hksj: true });

console.log(`Pooled OR: ${Math.exp(result.estimate).toFixed(3)}`);
console.log(`95% CI: [${Math.exp(result.ci_lb).toFixed(3)}, ${Math.exp(result.ci_ub).toFixed(3)}]`);
console.log(`I²: ${(result.I2 * 100).toFixed(1)}%`);
```

### Browser

```html
<!DOCTYPE html>
<html>
<head>
  <script src="meta-analysis.js"></script>
</head>
<body>
  <script>
    const ma = new MetaAnalysis();

    // Pre-calculated effect sizes
    ma.data = [
      { study: "Study A", yi: -0.5, vi: 0.05 },
      { study: "Study B", yi: -0.3, vi: 0.08 },
      { study: "Study C", yi: -0.6, vi: 0.04 }
    ];

    const result = ma.runRandomEffectsModel({ method: 'REML' });
    console.log("Pooled estimate:", result.estimate);
  </script>
</body>
</html>
```

### CLI

```bash
# Analyze a JSON file
metajs analyze studies.json --method REML --hksj

# Calculate effect sizes
metajs escalc OR binary_data.json -o effects.json

# Run publication bias tests
metajs bias studies.json --format json

# Sensitivity analysis
metajs sensitivity studies.json --verbose
```

## API Reference

### MetaAnalysis Class

```javascript
const ma = new MetaAnalysis();
```

#### Methods

##### `calculateEffectSizes(data, measure)`

Calculate effect sizes from raw study data.

**Parameters:**
- `data` (Array): Array of study objects
- `measure` (String): Effect size measure

**Supported Measures:**

| Measure | Description | Required Fields |
|---------|-------------|-----------------|
| `OR` | Odds Ratio | events_t, n_t, events_c, n_c |
| `RR` | Risk Ratio | events_t, n_t, events_c, n_c |
| `RD` | Risk Difference | events_t, n_t, events_c, n_c |
| `SMD` | Standardized Mean Diff (Hedges' g) | mean_t, sd_t, n_t, mean_c, sd_c, n_c |
| `MD` | Mean Difference | mean_t, sd_t, n_t, mean_c, sd_c, n_c |
| `COR` | Correlation | r, n |
| `ZCOR` | Fisher's z-transformed correlation | r, n |
| `PR` | Proportion | events, n |
| `PLO` | Log Odds of Proportion | events, n |

**Example:**
```javascript
const studies = [
  { study: "A", events_t: 10, n_t: 100, events_c: 20, n_c: 100 },
  { study: "B", events_t: 15, n_t: 80, events_c: 25, n_c: 85 }
];

ma.calculateEffectSizes(studies, 'OR');
console.log(ma.data); // [{study, yi, vi, se}, ...]
```

##### `runRandomEffectsModel(options)`

Fit a random-effects meta-analysis model.

**Options:**
- `method` (String): tau² estimator (default: 'REML')
- `hksj` (Boolean): Apply HKSJ adjustment (default: false)
- `predictionInterval` (Boolean): Calculate prediction interval (default: false)

**tau² Estimators:**

| Method | Name | Description |
|--------|------|-------------|
| `DL` | DerSimonian-Laird | Most widely used, method of moments |
| `REML` | Restricted Maximum Likelihood | Recommended, unbiased |
| `ML` | Maximum Likelihood | Slightly biased |
| `PM` | Paule-Mandel | Iterative, unbiased |
| `HS` | Hunter-Schmidt | Simple variance component |
| `SJ` | Sidik-Jonkman | Alternative estimator |
| `HE` | Hedges | Unbiased estimator |
| `EB` | Empirical Bayes | Morris estimator |

**Returns:**
```javascript
{
  estimate: -0.109,    // Pooled effect
  se: 0.039,           // Standard error
  ci_lb: -0.185,       // 95% CI lower bound
  ci_ub: -0.034,       // 95% CI upper bound
  zval: -2.83,         // z-value
  pval: 0.0046,        // p-value
  tau2: 0.0,           // Between-study variance
  tau: 0.0,            // sqrt(tau²)
  tau2_ci_lb: 0.0,     // tau² 95% CI lower (Q-profile)
  tau2_ci_ub: 0.05,    // tau² 95% CI upper (Q-profile)
  I2: 0.0,             // I² heterogeneity
  I2_ci_lb: 0.0,       // I² 95% CI lower
  I2_ci_ub: 0.45,      // I² 95% CI upper
  H2: 1.0,             // H² statistic
  Q: 1.66,             // Cochran's Q
  Q_df: 4,             // Q degrees of freedom
  Q_pval: 0.80,        // Q p-value
  k: 5,                // Number of studies
  // If hksj: true
  hksj_ci_lb: -0.179,
  hksj_ci_ub: -0.040,
  hksj_tval: -4.40,
  hksj_pval: 0.012,
  // If predictionInterval: true
  pi_lb: -0.185,
  pi_ub: -0.034
}
```

##### `runFixedEffectsModel(options)`

Fit a fixed-effects (common-effect) meta-analysis model.

```javascript
const feModel = ma.runFixedEffectsModel();
// { estimate, se, ci_lb, ci_ub, zval, pval, Q, Q_pval, I2, k }
```

##### `metaRegression(moderators, options)`

Perform meta-regression with one or more moderators.

```javascript
// Add moderator to data first
ma.data.forEach((d, i) => d.year = [2019, 2020, 2021, 2022, 2023][i]);

// Run meta-regression
const reg = ma.metaRegression('year', { method: 'REML' });
// {
//   coefficients: [{name, estimate, se, zval, pval, ci_lb, ci_ub}, ...],
//   tau2, tau, I2_residual, R2,
//   QM: {Q, df, p},  // Test of moderators
//   QE: {Q, df, p}   // Residual heterogeneity
// }
```

##### `subgroupAnalysis(groupVar)`

Perform subgroup analysis with Q-between test.

```javascript
// Add group variable
ma.data.forEach((d, i) => d.region = i < 3 ? 'Europe' : 'USA');

const subgroups = ma.subgroupAnalysis('region');
// {
//   subgroups: { Europe: {...}, USA: {...} },
//   test: { Q_between, df, p },
//   overall: {...}
// }
```

##### `eggerTest()`

Perform Egger's regression test for funnel plot asymmetry.

```javascript
const egger = ma.eggerTest();
// { intercept, se, tval, pval }
```

##### `beggTest()`

Perform Begg's rank correlation test.

```javascript
const begg = ma.beggTest();
// { tau, pval }
```

##### `trimAndFill(side)`

Perform Trim-and-Fill analysis for publication bias.

```javascript
const tf = ma.trimAndFill('right');
// { k0, estimate, se, ci_lb, ci_ub, filled }
```

##### `leaveOneOut(options)`

Perform leave-one-out sensitivity analysis.

```javascript
const loo = ma.leaveOneOut({ method: 'REML' });
// [{omitted, estimate, se, ci_lb, ci_ub, tau2, I2}, ...]
```

##### `cumulativeMeta(sortBy)`

Perform cumulative meta-analysis.

```javascript
const cumul = ma.cumulativeMeta('year');
// [{k, estimate, se, ci_lb, ci_ub, tau2}, ...]
```

### Static Methods

```javascript
// Effect size calculations
MetaAnalysis.EffectSizes.oddsRatio(a, b, c, d);
MetaAnalysis.EffectSizes.riskRatio(a, b, c, d);
MetaAnalysis.EffectSizes.smd(mean1, sd1, n1, mean2, sd2, n2);
MetaAnalysis.EffectSizes.meanDifference(mean1, sd1, n1, mean2, sd2, n2);
MetaAnalysis.EffectSizes.correlation(r, n);

// tau² estimators
MetaAnalysis.Tau2Estimators.DL(yi, vi, weights);
MetaAnalysis.Tau2Estimators.REML(yi, vi);
MetaAnalysis.Tau2Estimators.ML(yi, vi);

// Heterogeneity
MetaAnalysis.Heterogeneity.Q(yi, vi, weights);
MetaAnalysis.Heterogeneity.I2(Q, k);
MetaAnalysis.Heterogeneity.H2(Q, k);
```

## Input Data Formats

### Binary Data (2×2 Tables)

```json
{
  "studies": [
    {
      "study": "Trial Name",
      "events_t": 10,
      "n_t": 100,
      "events_c": 20,
      "n_c": 100
    }
  ]
}
```

### Continuous Data

```json
{
  "studies": [
    {
      "study": "Trial Name",
      "mean_t": 10.5,
      "sd_t": 2.1,
      "n_t": 50,
      "mean_c": 12.3,
      "sd_c": 2.4,
      "n_c": 48
    }
  ]
}
```

### Pre-calculated Effect Sizes

```json
{
  "studies": [
    {
      "study": "Study A",
      "yi": -0.5,
      "vi": 0.05
    }
  ]
}
```

## CLI Reference

```
metajs <command> [input] [options]

Commands:
  analyze      Run random-effects meta-analysis
  escalc       Calculate effect sizes from raw data
  bias         Run publication bias tests
  sensitivity  Run sensitivity analyses
  forest       Generate forest plot data
  funnel       Generate funnel plot data

Options:
  -m, --measure <type>   Effect size (OR, RR, RD, SMD, MD, COR, ZCOR)
  -t, --method <method>  tau² estimator (DL, REML, ML, PM, HS, SJ, HE, EB)
  --hksj                 Apply HKSJ adjustment
  --pi                   Calculate prediction interval
  -o, --output <file>    Output file
  -f, --format <format>  Output: text, json, csv
  --verbose              Detailed output
  -h, --help             Help
  -v, --version          Version
```

## Validation

This library has been validated against R's **metafor** package (v4.8.0) using multiple test datasets:

| Category | Tests | Pass Rate |
|----------|-------|-----------|
| Effect Sizes (OR) | 22 | 100% |
| tau² Estimators | 8 | 100% |
| Pooled Estimates | 11 | 100% |
| HKSJ Adjustment | 3 | 100% |
| Prediction Intervals | 2 | 100% |
| Continuous Data (MD/SMD) | 8 | 100% |
| Leave-One-Out | 5 | 100% |
| Publication Bias | 4 | 100% |
| **Overall** | **63** | **100%** |

Run validation tests:
```bash
npm test
```

## Examples

### Complete Analysis Workflow

```javascript
const MetaAnalysis = require('metajs-analysis');

// 1. Prepare data
const studies = [
  { study: "DAPA-HF", events_t: 276, n_t: 2373, events_c: 329, n_c: 2371 },
  { study: "EMPEROR-R", events_t: 249, n_t: 1863, events_c: 266, n_c: 1867 },
  { study: "DELIVER", events_t: 497, n_t: 3131, events_c: 526, n_c: 3132 },
  { study: "EMPEROR-P", events_t: 422, n_t: 2997, events_c: 463, n_c: 2991 },
  { study: "SOLOIST", events_t: 51, n_t: 608, events_c: 58, n_c: 614 }
];

// 2. Initialize and calculate effect sizes
const ma = new MetaAnalysis();
ma.calculateEffectSizes(studies, 'OR');

// 3. Run random-effects model
const model = ma.runRandomEffectsModel({
  method: 'REML',
  hksj: true,
  predictionInterval: true
});

// 4. Report results
console.log('=== Meta-Analysis Results ===');
console.log(`Studies: ${model.k}`);
console.log(`Pooled OR: ${Math.exp(model.estimate).toFixed(3)}`);
console.log(`95% CI: [${Math.exp(model.ci_lb).toFixed(3)}, ${Math.exp(model.ci_ub).toFixed(3)}]`);
console.log(`p-value: ${model.pval.toFixed(4)}`);
console.log(`I²: ${(model.I2 * 100).toFixed(1)}%`);
console.log(`tau²: ${model.tau2.toFixed(4)}`);

// 5. HKSJ-adjusted results
console.log('\n=== HKSJ-Adjusted ===');
console.log(`95% CI: [${Math.exp(model.hksj_ci_lb).toFixed(3)}, ${Math.exp(model.hksj_ci_ub).toFixed(3)}]`);
console.log(`p-value: ${model.hksj_pval.toFixed(4)}`);

// 6. Publication bias
const egger = ma.eggerTest();
const begg = ma.beggTest();
const trimfill = ma.trimAndFill();

console.log('\n=== Publication Bias ===');
console.log(`Egger's test p-value: ${egger.pval.toFixed(4)}`);
console.log(`Begg's test p-value: ${begg.pval.toFixed(4)}`);
console.log(`Trim-and-fill imputed: ${trimfill.k0} studies`);

// 7. Sensitivity analysis
const loo = ma.leaveOneOut();
console.log('\n=== Leave-One-Out ===');
for (const r of loo) {
  console.log(`Omit ${r.omitted}: OR = ${Math.exp(r.estimate).toFixed(3)}`);
}
```

### Building a GUI

```html
<!DOCTYPE html>
<html>
<head>
  <title>Meta-Analysis Tool</title>
  <script src="meta-analysis.js"></script>
</head>
<body>
  <h1>Meta-Analysis</h1>

  <div id="input">
    <textarea id="data" rows="10" cols="50">
[
  {"study": "Study A", "yi": -0.5, "vi": 0.05},
  {"study": "Study B", "yi": -0.3, "vi": 0.08},
  {"study": "Study C", "yi": -0.6, "vi": 0.04}
]
    </textarea>
    <br>
    <select id="method">
      <option value="DL">DerSimonian-Laird</option>
      <option value="REML" selected>REML</option>
      <option value="ML">Maximum Likelihood</option>
    </select>
    <button onclick="runAnalysis()">Analyze</button>
  </div>

  <div id="results"></div>

  <script>
    function runAnalysis() {
      try {
        const data = JSON.parse(document.getElementById('data').value);
        const method = document.getElementById('method').value;

        const ma = new MetaAnalysis();
        ma.data = data;

        const result = ma.runRandomEffectsModel({ method, hksj: true });

        document.getElementById('results').innerHTML = `
          <h2>Results</h2>
          <p>Pooled estimate: ${result.estimate.toFixed(4)}</p>
          <p>95% CI: [${result.ci_lb.toFixed(4)}, ${result.ci_ub.toFixed(4)}]</p>
          <p>p-value: ${result.pval.toFixed(4)}</p>
          <p>I²: ${(result.I2 * 100).toFixed(1)}%</p>
          <p>tau²: ${result.tau2.toFixed(4)}</p>
        `;
      } catch (e) {
        document.getElementById('results').innerHTML = `Error: ${e.message}`;
      }
    }
  </script>
</body>
</html>
```

## License

MIT License

## Citation

If you use this library in academic work, please cite:

```
MetaJS: JavaScript Meta-Analysis Library (2026)
https://github.com/truthcert/metajs-analysis
Validated against R metafor v4.8.0
```

## Acknowledgments

- Statistical methods based on Viechtbauer, W. (2010). metafor: Meta-Analysis Package for R
- Validation datasets from TruthCert-PairwisePro project
