# S1 File: Technical Documentation of Statistical Algorithms

## TruthCert-PairwisePro v1.0

This document provides complete mathematical specifications for all statistical algorithms implemented in TruthCert-PairwisePro.

---

## 1. Effect Size Calculations

### 1.1 Binary Outcomes (2x2 Tables)

Given a 2x2 table:

|              | Events | Non-events | Total |
|--------------|--------|------------|-------|
| Treatment    | a      | b          | n1    |
| Control      | c      | d          | n2    |

**Log Odds Ratio:**
```
yi = ln(a x d / b x c)
vi = 1/a + 1/b + 1/c + 1/d
```

**Log Risk Ratio:**
```
yi = ln((a/n1) / (c/n2))
vi = (1-a/n1)/a + (1-c/n2)/c
```

**Risk Difference:**
```
yi = a/n1 - c/n2
vi = a(n1-a)/n1^3 + c(n2-c)/n2^3
```

**Continuity Correction:** When any cell = 0, add 0.5 to all cells before calculation.

### 1.2 Continuous Outcomes

**Standardized Mean Difference (Hedges' g):**
```
d = (M1 - M2) / S_pooled

where S_pooled = sqrt[((n1-1)S1^2 + (n2-1)S2^2) / (n1 + n2 - 2)]

J = 1 - 3 / (4(n1 + n2 - 2) - 1)    # Hedges' correction factor

g = d x J

vi = (n1 + n2)/(n1 x n2) + g^2/(2(n1 + n2))
```

**Mean Difference:**
```
yi = M1 - M2
vi = S1^2/n1 + S2^2/n2
```

### 1.3 Proportions

**Freeman-Tukey Double Arcsine Transformation:**
```
yi = arcsin(sqrt(x/(n+1))) + arcsin(sqrt((x+1)/(n+1)))
vi = 1/(n + 0.5)
```

**Logit Transformation:**
```
yi = ln(p / (1-p))
vi = 1/(n x p x (1-p))
```

### 1.4 Correlations

**Fisher's z Transformation:**
```
yi = 0.5 x ln((1+r)/(1-r))
vi = 1/(n-3)
```

---

## 2. Heterogeneity Estimators

### 2.1 Fixed Effect Weights and Q Statistic

```
wi = 1/vi                           # Fixed effect weights
theta_FE = Sum(wi x yi) / Sum(wi)   # Fixed effect estimate
Q = Sum(wi(yi - theta_FE)^2)        # Cochran's Q
df = k - 1                          # Degrees of freedom
```

### 2.2 DerSimonian-Laird (DL)

```
C = Sum(wi) - Sum(wi^2)/Sum(wi)
tau^2_DL = max(0, (Q - df) / C)
```

### 2.3 Restricted Maximum Likelihood (REML)

REML tau^2 is found by solving:

```
Sum[wi*(yi - theta)^2 - 1] / [1 + tau^2 x wi*]^2 = 0
```

where wi* = 1/(vi + tau^2)

**Implementation:** Newton-Raphson iteration with:
- Initial value: tau^2_DL
- Damping factor: 0.7
- Convergence tolerance: 10^-8
- Maximum iterations: 100

### 2.4 Paule-Mandel (PM)

Iterative solution to:
```
Q* = Sum(wi*(yi - theta*)^2) = k - 1
```
where wi* = 1/(vi + tau^2) and theta* is the corresponding weighted mean.

### 2.5 Maximum Likelihood (ML)

ML tau^2 maximizes:
```
l(tau^2) = -0.5 x [Sum(log(vi + tau^2)) + Sum((yi - theta)^2/(vi + tau^2))]
```

### 2.6 Hunter-Schmidt (HS)

```
tau^2_HS = max(0, [Sum(wi(yi - theta_FE)^2) - (k-1)] / Sum(wi))
```

### 2.7 Sidik-Jonkman (SJ)

```
tau^2_SJ(0) = Sum((yi - y_bar)^2) / (k - 1)    # Initial estimate

Iterate: tau^2_SJ(j+1) = [Sum(wi*(yi - theta*)^2)] / k
```

### 2.8 Hedges (HE)

```
tau^2_HE = [Sum((yi - theta_bar)^2) - Sum(vi(1 - wi/Sum(wi)))] / (k - 1)
```

### 2.9 Empirical Bayes (EB)

```
tau^2_EB = max(0, [Q - df] / [Sum(wi) - tr(W^2)/Sum(wi)])
```

---

## 3. Heterogeneity Statistics

### 3.1 I^2 (Percentage of Variance Due to Heterogeneity)

```
I^2 = max(0, 100% x (Q - df) / Q)
```

**Interpretation:**
- 0-40%: Low heterogeneity
- 30-60%: Moderate heterogeneity
- 50-90%: Substantial heterogeneity
- 75-100%: Considerable heterogeneity

### 3.2 H^2 (Relative Excess Variance)

```
H^2 = Q / df
```

### 3.3 tau (Between-Study Standard Deviation)

```
tau = sqrt(tau^2)
```

---

## 4. Confidence Intervals

### 4.1 Random Effects Estimate and Standard Error

```
wi* = 1/(vi + tau^2)                # Random effects weights
theta* = Sum(wi* x yi) / Sum(wi*)   # Pooled estimate
SE* = sqrt(1 / Sum(wi*))            # Standard error
```

### 4.2 Standard (Wald) Confidence Interval

```
CI = theta* +/- z_{alpha/2} x SE*

where z_{0.025} = 1.96 for 95% CI
```

### 4.3 Hartung-Knapp-Sidik-Jonkman (HKSJ) Adjustment

```
q = Sum(wi*(yi - theta*)^2) / (k - 1)
SE_HKSJ = sqrt(q) x SE*
CI_HKSJ = theta* +/- t_{alpha/2, k-1} x SE_HKSJ
```

### 4.4 Prediction Intervals

**Standard (Higgins-Thompson-Spiegelhalter):**
```
PI = theta* +/- t_{alpha/2, k-2} x sqrt(tau^2 + SE*^2)
```

**Noma (2023) Adjustment (Equation 7):**

The Noma prediction interval accounts for uncertainty in tau^2 estimation:

```
PI_Noma = theta* +/- t_{alpha/2, k-2} x sqrt(tau^2 + SE*^2 + Var(tau_hat^2)/(4*tau^2))
```

where Var(tau_hat^2) is estimated using the Fisher information from REML:

```
I(tau^2) = 0.5 x Sum[wi*^2]
Var(tau_hat^2) approximately equals 1 / I(tau^2)
```

For small tau^2, a continuity correction is applied:
```
If tau^2 < 0.01: use standard PI
```

Reference: Noma H, Nagashima K, Furukawa TA. Stat Med. 2023;42(16):2837-2854, Equation 7.

---

## 5. Publication Bias Tests

### 5.1 Egger's Regression Test

Regress standardized effect on precision:
```
yi/sqrt(vi) = beta_0 + beta_1(1/sqrt(vi)) + epsilon

Test H0: beta_0 = 0 (no asymmetry)
```

### 5.2 Peters' Test (Binary Outcomes)

```
yi = beta_0 + beta_1(1/n) + epsilon
```

### 5.3 Begg's Rank Correlation

Kendall's tau between yi and vi:
```
tau = (concordant - discordant) / (k(k-1)/2)
```

### 5.4 Trim-and-Fill

**L0 Estimator:**
```
L0 = round((4S - k + 1) / (2k + 3))
```
where S = Sum(rank(|yi - theta_hat|) x sign(yi - theta_hat)) for studies on asymmetric side.

**R0 Estimator:**
```
R0 = round((4S^2 - k^2 + 2kS - S) / ((2k - 1)(k + S)))
```

### 5.5 PET-PEESE

**PET (Precision-Effect Test):**
```
yi = beta_0 + beta_1 x SE_i + epsilon
```

**PEESE (Precision-Effect Estimate with Standard Error):**
```
yi = beta_0 + beta_1 x SE_i^2 + epsilon
```

Decision rule: If PET beta_0 p < 0.10, use PEESE estimate; otherwise use PET.

### 5.6 Vevea-Hedges Selection Model

Step-function selection model with weights:
```
P(select | p-value) = omega_j for p in [a_{j-1}, a_j)
```

**Moderate selection:** omega = (1.0, 0.99, 0.95, 0.80) at cuts (0.05, 0.10, 0.50, 1.00)
**Severe selection:** omega = (1.0, 0.99, 0.90, 0.50) at cuts (0.05, 0.10, 0.50, 1.00)

---

## 6. Sensitivity Analyses

### 6.1 Leave-One-Out Analysis

For each study j:
```
theta*_{-j} = Sum_{i!=j}(wi* x yi) / Sum_{i!=j}(wi*)
```

### 6.2 Cumulative Meta-Analysis

Studies ordered by year; theta* recalculated after adding each study.

### 6.3 Influence Diagnostics

**DFBETAS:**
```
DFBETAS_j = (theta* - theta*_{-j}) / SE*_{-j}
```

**Cook's Distance:**
```
D_j = (theta* - theta*_{-j})^2 x Sum(wi*) / (k x SE*^2)
```

---

## 7. Optimal Information Size (OIS)

For binary outcomes:
```
OIS = 4 x (z_{alpha/2} + z_{beta})^2 x p_bar(1-p_bar) / (p1 - p0)^2
```

where:
- p_bar = (p1 + p0)/2
- p1, p0 = treatment and control event rates
- z_{alpha/2} = 1.96 (two-sided alpha = 0.05)
- z_{beta} = 0.84 (power = 80%)

---

## 8. Fragility Index

The fragility index (FI) is the minimum number of events that, if changed from non-event to event (or vice versa) in the treatment group, would change the conclusion from significant to non-significant.

**Algorithm:**
1. Start with original data
2. Iteratively change one event in treatment group
3. Recalculate pooled p-value
4. FI = number of changes needed to cross p = 0.05

---

## 9. Health Technology Assessment

### 9.1 Incremental Cost-Effectiveness Ratio (ICER)

```
ICER = DeltaCost / DeltaQALY = (C1 - C0) / (Q1 - Q0)
```

**Special cases:**
- DeltaQALY > 0, DeltaCost < 0: Dominant (cost-saving, health-improving)
- DeltaQALY < 0, DeltaCost > 0: Dominated (harmful, costly)
- |DeltaQALY| < 0.001: Indeterminate

### 9.2 Net Monetary Benefit (NMB)

```
NMB = DeltaQALY x WTP - DeltaCost
```

Cost-effective if NMB > 0.

### 9.3 Cost-Effectiveness Acceptability Curve (CEAC)

```
P(cost-effective | WTP) = P(NMB > 0 | WTP)
```

Estimated from PSA iterations:
```
CEAC(lambda) = Sum(I(NMB_i > 0)) / N
```

### 9.4 Expected Value of Perfect Information (EVPI)

```
EVPI = E_theta[max_d NMB(d, theta)] - max_d E_theta[NMB(d, theta)]
```

Population EVPI:
```
pEVPI = EVPI x Incidence x Time_horizon
```

### 9.5 Discounting (Optional)

```
PV = FV / (1 + r)^t
```

Default rates (NICE reference case):
- Costs: 3.5% per annum
- Health outcomes: 3.5% per annum

---

## 10. Distribution Functions

### 10.1 Standard Normal Distribution

**CDF (pnorm):**
```
Phi(x) = 0.5 x [1 + erf(x/sqrt(2))]
```

Approximation (Abramowitz and Stegun):
```
Phi(x) approximately equals 1 - phi(x)(b1*t + b2*t^2 + b3*t^3 + b4*t^4 + b5*t^5)
where t = 1/(1 + 0.2316419|x|)
```

**Inverse CDF (qnorm):**
Rational approximation (Moro 1995).

### 10.2 Student's t Distribution

**CDF (pt):**
Regularized incomplete beta function:
```
pt(x, df) = 1 - 0.5 x I_{df/(df+x^2)}(df/2, 0.5)
```

**Inverse CDF (qt):**
Newton-Raphson iteration on pt.

### 10.3 Chi-squared Distribution

**CDF (pchisq):**
```
pchisq(x, df) = gamma(df/2, x/2) / Gamma(df/2)
```
where gamma is the lower incomplete gamma function.

---

## 11. Verdict Classification Algorithm

### 11.1 Input Metrics

```
evidenceMetrics = {
  k: number of studies,
  theta: pooled effect estimate,
  se: standard error,
  ci_lower, ci_upper: 95% CI bounds,
  I2: I-squared percentage,
  publicationBias: { detected: boolean },
  tau2Stable: boolean (CV of tau^2 estimates < 15%),
  predictionInterval: { crossesNull: boolean },
  fragilityIndex: { fi: number },
  ois: { metOIS: boolean }
}
```

### 11.2 Severity Score Calculation

```javascript
function calculateSeverityScore(metrics) {
  let score = 0;

  if (metrics.k < 3) score += 3;
  else if (metrics.k < 5) score += 2;

  if (metrics.I2 > 90) score += 3;
  else if (metrics.I2 > 75) score += 2;

  if (metrics.publicationBias.detected) score += 2;
  if (metrics.trimFillImputed >= 3) score += 1;
  if (!metrics.tau2Stable) score += 1;
  if (metrics.predictionInterval.crossesNull) score += 1;
  if (!metrics.ois.metOIS) score += 1;
  if (metrics.fragilityIndex.fi < 3) score += 1;
  if (metrics.looChangesConclusion) score += 1;

  return score;
}
```

### 11.3 Verdict Determination

```javascript
function determineVerdict(metrics, config) {
  const mcid = config.mcid || 0.1054;
  const precisionRatio = metrics.se / mcid;
  const severity = calculateSeverityScore(metrics);

  // Check for effect within equivalence bounds
  const withinEquivalence = Math.abs(metrics.theta) < mcid;

  if (precisionRatio <= 2 && severity <= 3) {
    if (withinEquivalence) return 'STABLE-NID';
    return 'STABLE';
  }

  if (precisionRatio <= 4 && severity <= 6) {
    return 'MODERATE';
  }

  return 'UNCERTAIN';
}
```

---

## 12. Pseudo-Random Number Generation

### Mulberry32 Algorithm

32-bit PRNG with period 2^32, passes BigCrush tests.

```javascript
function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
```

**Properties:**
- Deterministic: Same seed produces same sequence
- Cross-platform: Identical results in all JavaScript environments
- Fast: ~15 cycles per random number
- Quality: Passes BigCrush statistical test suite

Reference: https://gist.github.com/tommyettinger/46a874533244883189143505d203312c

---

## Version History

- v1.0 (2024): Initial release with 109 validated statistical tests

---

*End of Technical Documentation*
