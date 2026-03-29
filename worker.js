/**
 * TruthCert Web Worker - Heavy Calculations
 * Runs meta-analysis, Bayesian MCMC, and statistical tests off the main thread
 */

// Statistical helper functions
function sum(arr) { return arr.reduce((a, b) => a + b, 0); }
function mean(arr) { return arr.length ? sum(arr) / arr.length : 0; }
function variance(arr) {
  const m = mean(arr);
  return arr.length > 1 ? sum(arr.map(x => (x - m) ** 2)) / (arr.length - 1) : 0;
}

function pnorm(x) {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1.0 + sign * y);
}

function qnorm(p) {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p === 0.5) return 0;

  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
             1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
             6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
             -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];

  const pLow = 0.02425, pHigh = 1 - pLow;
  let q, r;

  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  } else if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q / (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }
}

// Tau² estimators
function estimateTau2_DL(yi, vi) {
  const k = yi.length;
  if (k < 2) return 0;

  const wi = vi.map(v => 1 / v);
  const sumW = sum(wi);
  const theta_fe = sum(yi.map((y, i) => wi[i] * y)) / sumW;
  const Q = sum(yi.map((y, i) => wi[i] * (y - theta_fe) ** 2));
  const C = sumW - sum(wi.map(w => w * w)) / sumW;

  return Math.max(0, (Q - (k - 1)) / C);
}

function estimateTau2_REML(yi, vi, maxIter = 100, tol = 1e-6) {
  let tau2 = estimateTau2_DL(yi, vi);

  for (let iter = 0; iter < maxIter; iter++) {
    const wi = vi.map(v => 1 / (v + tau2));
    const sumW = sum(wi);
    const theta = sum(yi.map((y, i) => wi[i] * y)) / sumW;

    const Q = sum(yi.map((y, i) => wi[i] * (y - theta) ** 2));
    const dQ = -sum(wi.map(w => w * w));
    const C = sum(wi.map(w => w * w)) / sumW - sum(wi.map(w => w * w * w)) / sum(wi.map(w => w * w));

    const score = 0.5 * (Q - (yi.length - 1) + tau2 * dQ);
    const info = -0.5 * dQ;

    const delta = score / info;
    const tau2_new = Math.max(0, tau2 + delta);

    if (Math.abs(tau2_new - tau2) < tol) break;
    tau2 = tau2_new;
  }

  return tau2;
}

// Random effects meta-analysis
function randomEffectsMeta(yi, vi, method = 'REML') {
  const k = yi.length;
  if (k === 0) return null;

  // Estimate tau²
  let tau2;
  if (method === 'DL') {
    tau2 = estimateTau2_DL(yi, vi);
  } else {
    tau2 = estimateTau2_REML(yi, vi);
  }

  // Calculate weights and pooled estimate
  const wi = vi.map(v => 1 / (v + tau2));
  const sumW = sum(wi);
  const theta = sum(yi.map((y, i) => wi[i] * y)) / sumW;
  const se = Math.sqrt(1 / sumW);

  // Confidence interval
  const z = qnorm(0.975);
  const ci_lower = theta - z * se;
  const ci_upper = theta + z * se;

  // Heterogeneity statistics
  const wi_fe = vi.map(v => 1 / v);
  const sumW_fe = sum(wi_fe);
  const theta_fe = sum(yi.map((y, i) => wi_fe[i] * y)) / sumW_fe;
  const Q = sum(yi.map((y, i) => wi_fe[i] * (y - theta_fe) ** 2));
  const df = k - 1;
  const I2 = df > 0 ? Math.max(0, 100 * (Q - df) / Q) : 0;
  const H2 = df > 0 ? Q / df : 1;

  // Prediction interval
  let pi_lower = null, pi_upper = null;
  if (k >= 3 && tau2 > 0) {
    const pi_se = Math.sqrt(tau2 + se * se);
    const t_crit = 2.0; // Approximate for df > 10
    pi_lower = theta - t_crit * pi_se;
    pi_upper = theta + t_crit * pi_se;
  }

  return {
    theta, se, tau2,
    ci_lower, ci_upper,
    pi_lower, pi_upper,
    Q, I2, H2, k,
    weights: wi.map(w => w / sumW)
  };
}

// Publication bias tests
function eggerTest(yi, vi) {
  const k = yi.length;
  if (k < 10) return { pval: 1, intercept: 0, se: 0 };

  const sei = vi.map(v => Math.sqrt(v));
  const zi = yi.map((y, i) => y / sei[i]);
  const prec = sei.map(s => 1 / s);

  // Weighted regression of z on precision
  const n = k;
  const sumX = sum(prec);
  const sumY = sum(zi);
  const sumXY = sum(prec.map((x, i) => x * zi[i]));
  const sumX2 = sum(prec.map(x => x * x));

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Standard error of intercept
  const yhat = prec.map(x => intercept + slope * x);
  const residuals = zi.map((y, i) => y - yhat[i]);
  const mse = sum(residuals.map(r => r * r)) / (n - 2);
  const se_int = Math.sqrt(mse * (1/n + (sumX/n)**2 / (sumX2 - sumX**2/n)));

  const t_stat = intercept / se_int;
  const pval = 2 * (1 - pnorm(Math.abs(t_stat)));

  return { pval, intercept, se: se_int, t: t_stat };
}

// TOST equivalence test
function testEquivalence(theta, se, delta) {
  if (!theta || !se || !delta) return false;
  const tost_lower = (theta - (-delta)) / se;
  const tost_upper = (delta - theta) / se;
  const p_lower = 1 - pnorm(tost_lower);
  const p_upper = 1 - pnorm(tost_upper);
  return Math.max(p_lower, p_upper) < 0.05;
}

// V7.1 Threat assessment
function checkThreats(results, config) {
  const threats = [];
  const k = results.k || 0;
  const delta = config.delta || 0.1054;

  // 1. Small k
  if (k < (config.minK || 4)) threats.push('small_k');

  // 2. High heterogeneity
  let hetScore = 0;
  const I2 = results.I2 || 0;
  if (I2 > 75) hetScore += 1.5;
  else if (I2 > 50) hetScore += 0.5;

  // PI crosses null when CI doesn't
  if (results.pi_lower !== null && results.pi_upper !== null) {
    const ciExcludes = (results.ci_lower > 0) || (results.ci_upper < 0);
    const piCrosses = (results.pi_lower < 0) && (results.pi_upper > 0);
    if (ciExcludes && piCrosses) hetScore += 1.0;
  }

  if (hetScore >= 1.5) threats.push('high_heterogeneity');

  // 3. Publication bias
  if (results.egger && results.egger.pval < 0.10) {
    threats.push('publication_bias');
  }

  return { threats, n_threats: threats.length, hetScore };
}

// V7.1 Verdict determination
function determineVerdict(results, config) {
  const threatCheck = checkThreats(results, config);
  const n_threats = threatCheck.n_threats;
  const k = results.k || 0;
  const delta = config.delta || 0.1054;

  const theta = results.theta || 0;
  const se = results.se || 1;
  const ci_lb = results.ci_lower;
  const ci_ub = results.ci_upper;
  const ci_width = ci_ub - ci_lb;

  const ci_excludes_null = (ci_lb > 0) || (ci_ub < 0);
  const equivalence = testEquivalence(theta, se, delta);
  const effect_near_null = Math.abs(theta) < delta;
  const effect_very_small = Math.abs(theta) < delta / 2;
  const effect_moderate = Math.abs(theta) >= 1.5 * delta;

  // V7.1 precision thresholds
  const prec_excellent = ci_width < delta * 2.0;
  const prec_good = ci_width < delta * 4.0;
  const prec_adequate = ci_width < delta * 8.0;

  const snr = Math.abs(theta) / ci_width;
  const strong_evidence = snr > 0.5;

  let verdict = 'UNCERTAIN';

  if (k < 3) {
    verdict = 'UNCERTAIN';
  } else if (n_threats >= 2) {
    if (ci_excludes_null && prec_good && effect_moderate && strong_evidence) {
      verdict = 'MODERATE';
    } else {
      verdict = 'EXPOSED';
    }
  } else if (n_threats === 1) {
    if (ci_excludes_null && prec_good) verdict = 'MODERATE';
    else if (ci_excludes_null && prec_adequate && effect_moderate) verdict = 'MODERATE';
    else if (equivalence && prec_adequate) verdict = 'MODERATE';
    else if (effect_near_null && prec_good) verdict = 'MODERATE';
    else if (prec_adequate) verdict = 'EXPOSED';
    else verdict = 'UNCERTAIN';
  } else {
    if (ci_excludes_null && prec_good) verdict = 'STABLE';
    else if (ci_excludes_null && prec_adequate && strong_evidence) verdict = 'STABLE';
    else if (equivalence) verdict = 'STABLE-NID';
    else if (effect_very_small && prec_good) verdict = 'STABLE-NID';
    else if (effect_near_null && prec_adequate) verdict = 'STABLE-NID';
    else if (!ci_excludes_null && prec_good) verdict = effect_near_null ? 'STABLE-NID' : 'MODERATE';
    else if (prec_adequate) verdict = 'MODERATE';
    else verdict = 'UNCERTAIN';
  }

  return { verdict, threatCheck, equivalence, ci_excludes_null };
}

// Main message handler
self.onmessage = function(e) {
  const { type, data, config } = e.data;

  try {
    let result;

    switch (type) {
      case 'meta-analysis':
        const yi = data.studies.map(s => s.yi);
        const vi = data.studies.map(s => s.vi);
        result = randomEffectsMeta(yi, vi, config.method || 'REML');

        // Add Egger test if enough studies
        if (yi.length >= 10) {
          result.egger = eggerTest(yi, vi);
        }

        // Add verdict
        const verdictResult = determineVerdict(result, config);
        result.verdict = verdictResult.verdict;
        result.threatCheck = verdictResult.threatCheck;
        break;

      case 'publication-bias':
        result = eggerTest(data.yi, data.vi);
        break;

      case 'verdict':
        result = determineVerdict(data.results, config);
        break;

      default:
        throw new Error(`Unknown task type: ${type}`);
    }

    self.postMessage({ success: true, result });

  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
};
