# S5 File. TruthCert-PairwisePro User Guide

## Version 1.0

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Data Entry](#2-data-entry)
3. [Running Meta-Analysis](#3-running-meta-analysis)
4. [Understanding Results](#4-understanding-results)
5. [Verdict Classification](#5-verdict-classification)
6. [Health Technology Assessment](#6-health-technology-assessment)
7. [Exporting Results](#7-exporting-results)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Getting Started

### 1.1 System Requirements

- Modern web browser (Chrome, Firefox, Edge, Safari)
- JavaScript enabled
- Screen resolution: 1280x720 minimum (1920x1080 recommended)
- No installation required

### 1.2 Accessing the Application

1. Open your web browser
2. Navigate to the application URL or open the HTML file locally
3. The application loads entirely in your browser - no data is sent to any server

### 1.3 Interface Overview

The main interface consists of:

| Section | Purpose |
|---------|---------|
| **Data Entry Panel** | Enter study data manually or import from file |
| **Analysis Options** | Configure statistical methods and parameters |
| **Results Panel** | View forest plot, statistics, and verdict |
| **Threat Ledger** | 12-point assessment of evidence quality |
| **HTA Module** | Health technology assessment calculations |

---

## 2. Data Entry

### 2.1 Binary Outcomes (Default)

For dichotomous outcomes (e.g., death, event rates), enter:

| Field | Description | Example |
|-------|-------------|---------|
| Study Name | Identifier for the study | "Smith 2020" |
| Events (Treatment) | Number of events in treatment arm | 23 |
| Total (Treatment) | Total participants in treatment arm | 150 |
| Events (Control) | Number of events in control arm | 45 |
| Total (Control) | Total participants in control arm | 148 |

**Zero cells**: The application automatically applies a 0.5 continuity correction when any cell is zero.

### 2.2 Continuous Outcomes

For continuous outcomes (e.g., blood pressure, pain scores):

| Field | Description | Example |
|-------|-------------|---------|
| Study Name | Identifier | "Jones 2021" |
| Mean (Treatment) | Mean in treatment group | 12.5 |
| SD (Treatment) | Standard deviation | 4.2 |
| N (Treatment) | Sample size | 80 |
| Mean (Control) | Mean in control group | 15.8 |
| SD (Control) | Standard deviation | 4.5 |
| N (Control) | Sample size | 78 |

### 2.3 Pre-calculated Effect Sizes

If you have already calculated effect sizes:

| Field | Description |
|-------|-------------|
| Effect Size (yi) | Log odds ratio, log risk ratio, SMD, etc. |
| Variance (vi) | Variance of the effect size |
| SE | Standard error (alternative to variance) |

### 2.4 Importing Data

**CSV Import:**
1. Click "Import CSV"
2. Select your file
3. Map columns to required fields
4. Click "Import"

**Required CSV format:**
```
study,events_t,n_t,events_c,n_c
Smith 2020,23,150,45,148
Jones 2021,12,80,28,82
```

---

## 3. Running Meta-Analysis

### 3.1 Effect Measure Selection

| Measure | Use Case | Scale |
|---------|----------|-------|
| Odds Ratio (OR) | Binary outcomes, case-control | Multiplicative |
| Risk Ratio (RR) | Binary outcomes, cohort/RCT | Multiplicative |
| Risk Difference (RD) | Binary outcomes, absolute risk | Additive |
| Hedges' g (SMD) | Continuous outcomes | Standardized |
| Mean Difference (MD) | Continuous, same scale | Original units |

### 3.2 Heterogeneity Estimator

Select from 8 validated estimators:

| Estimator | Recommendation |
|-----------|----------------|
| **REML** | Default - best balance of accuracy and stability |
| **PM (Paule-Mandel)** | Alternative default - robust |
| DL (DerSimonian-Laird) | Traditional, may underestimate |
| ML (Maximum Likelihood) | Tends to underestimate |
| HS (Hunter-Schmidt) | For meta-analyses of correlations |
| SJ (Sidik-Jonkman) | Alternative to DL |
| HE (Hedges)| Unbiased for small k |
| EB (Empirical Bayes) | Shrinkage estimator |

### 3.3 Confidence Interval Method

| Method | Description |
|--------|-------------|
| **HKSJ** | Hartung-Knapp-Sidik-Jonkman adjustment (recommended) |
| Wald | Standard normal approximation |

### 3.4 Running the Analysis

1. Enter all study data
2. Select effect measure
3. Choose heterogeneity estimator (default: REML)
4. Select CI method (default: HKSJ)
5. Click **"Run Analysis"**

---

## 4. Understanding Results

### 4.1 Forest Plot

The forest plot displays:
- Individual study effect sizes (squares)
- 95% confidence intervals (horizontal lines)
- Study weights (square size)
- Pooled estimate (diamond)
- Prediction interval (dashed lines)

### 4.2 Statistical Output

| Statistic | Interpretation |
|-----------|----------------|
| **Pooled Effect** | Combined effect estimate |
| **95% CI** | Confidence interval for pooled effect |
| **p-value** | Significance of pooled effect |
| **tau^2** | Between-study variance |
| **tau** | Between-study standard deviation |
| **I^2** | Percentage of variance due to heterogeneity |
| **H^2** | Ratio of total to sampling variance |
| **Q** | Cochran's Q test statistic |
| **Prediction Interval** | Range for future study effects |

### 4.3 Interpreting Heterogeneity

| I^2 Value | Interpretation |
|-----------|----------------|
| 0-25% | Low heterogeneity |
| 25-50% | Moderate heterogeneity |
| 50-75% | Substantial heterogeneity |
| >75% | Considerable heterogeneity |

### 4.4 Publication Bias Tests

| Test | Interpretation |
|------|----------------|
| **Egger's Test** | p < 0.10 suggests small-study effects |
| **Begg's Test** | Rank correlation test for funnel asymmetry |
| **Trim-and-Fill** | Estimates number of missing studies |
| **PET-PEESE** | Precision-effect test with standard error adjustment |

---

## 5. Verdict Classification

### 5.1 Verdict Categories

| Verdict | Meaning | Action Implication |
|---------|---------|-------------------|
| **STABLE** | High confidence, reliable evidence | Supports clinical/policy decisions |
| **MODERATE** | Reasonable confidence, some uncertainty | Supports decisions with caveats |
| **UNCERTAIN** | Low confidence, substantial uncertainty | Caution advised, more research needed |

### 5.2 Classification Algorithm

The verdict is determined by the 12-point threat assessment:

**Statistical Threats (6 points):**
1. Significance (p < 0.05)
2. Precision (narrow CI)
3. Heterogeneity (I^2 < 50%)
4. Publication bias (Egger p > 0.10)
5. Prediction interval (excludes null)
6. Study count (k >= 5)

**Methodological Threats (6 points):**
7. Risk of bias assessment
8. Consistency across designs
9. Directness of evidence
10. Imprecision considerations
11. Publication bias assessment
12. Large effect / dose-response

**Scoring:**
- STABLE: >= 9 points (no critical threats)
- MODERATE: 6-8 points
- UNCERTAIN: < 6 points (or any critical threat)

### 5.3 Threat Ledger

The threat ledger provides detailed breakdown:

```
THREAT ASSESSMENT
=================
[PASS] Statistical significance: p = 0.0001
[PASS] Confidence interval precision: Width = 0.35
[WARN] Heterogeneity: I^2 = 45%
[PASS] Publication bias: Egger p = 0.42
[PASS] Prediction interval: Excludes null
[PASS] Study count: k = 12

Score: 10/12
Verdict: STABLE
```

---

## 6. Health Technology Assessment

### 6.1 Accessing HTA Module

1. Complete meta-analysis
2. Click "HTA Analysis" tab
3. Enter economic parameters

### 6.2 Required Inputs

| Parameter | Description | Example |
|-----------|-------------|---------|
| Intervention Cost | Cost of treatment per patient | $5,000 |
| Comparator Cost | Cost of standard care | $2,000 |
| QALY Gain (Treatment) | Quality-adjusted life years | 0.85 |
| QALY Gain (Control) | Baseline QALYs | 0.72 |
| WTP Threshold | Willingness-to-pay per QALY | $50,000 |
| Time Horizon | Analysis period | 5 years |
| Discount Rate | Annual discount rate | 3% |

### 6.3 HTA Outputs

| Output | Description |
|--------|-------------|
| **ICER** | Incremental cost-effectiveness ratio |
| **NMB** | Net monetary benefit |
| **CEAC** | Cost-effectiveness acceptability curve |
| **EVPI** | Expected value of perfect information |

### 6.4 Verdict-Gated Recommendations

The HTA recommendation is adjusted based on verdict:

| Tier | Verdict | WTP Adjustment | Recommendation |
|------|---------|----------------|----------------|
| A | STABLE | Standard WTP | Full adoption if cost-effective |
| B | MODERATE | WTP x 0.7 | Adoption with monitoring |
| C | UNCERTAIN | WTP x 0.5 | Conditional/pilot only |
| D | Insufficient | N/A | Defer pending more evidence |

---

## 7. Exporting Results

### 7.1 Export Options

| Format | Contents |
|--------|----------|
| **PDF Report** | Complete analysis with all figures |
| **PNG/SVG** | Forest plot image |
| **CSV** | Numerical results |
| **JSON** | Full analysis object |
| **Word/RTF** | Formatted report |

### 7.2 Generating Reports

1. Click "Export" button
2. Select format
3. Choose sections to include:
   - Forest plot
   - Statistical summary
   - Threat ledger
   - HTA results
   - GRADE assessment
4. Click "Generate"

### 7.3 Citation

When using TruthCert-PairwisePro in publications:

```
[Author]. TruthCert-PairwisePro: A Browser-Based Meta-Analysis
Platform with Verdict Classification and Integrated Health
Technology Assessment. Version 1.0. Available at:
https://github.com/[username]/TruthCert-PairwisePro
```

---

## 8. Troubleshooting

### 8.1 Common Issues

| Issue | Solution |
|-------|----------|
| Analysis won't run | Check all required fields are filled |
| Zero in denominator | Continuity correction applied automatically |
| Very wide CI | Check for data entry errors; few studies |
| Forest plot not showing | Enable JavaScript; try different browser |
| Export fails | Check popup blocker settings |

### 8.2 Data Validation

The application validates:
- Non-negative counts
- n >= events
- At least 2 studies required
- Numeric values in numeric fields

### 8.3 Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome 90+ | Full |
| Firefox 88+ | Full |
| Edge 90+ | Full |
| Safari 14+ | Full |
| IE 11 | Not supported |

### 8.4 Getting Help

- GitHub Issues: Report bugs or request features
- Documentation: Full technical documentation in S1 File
- Validation: R comparison code in S3 File

---

## Appendix A: Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Enter | Run analysis |
| Ctrl+S | Export results |
| Ctrl+N | Clear and new analysis |
| Ctrl+Z | Undo last data entry |
| Tab | Move to next field |

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **Effect size** | Standardized measure of treatment effect |
| **Heterogeneity** | Variability between studies beyond chance |
| **ICER** | Cost per unit of health outcome gained |
| **Meta-analysis** | Statistical combination of study results |
| **QALY** | Quality-adjusted life year |
| **Tau-squared** | Between-study variance estimate |
| **WTP** | Willingness-to-pay threshold |

---

*Document version: 1.0*
*Last updated: January 2026*
