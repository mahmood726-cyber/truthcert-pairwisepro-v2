/**
 * Statistical utility functions
 * @module utils/statistics
 */

/**
 * Standard normal CDF (cumulative distribution function)
 * P(Z <= x) for standard normal distribution
 */
export function pnorm(x: number, mean = 0, sd = 1): number {
  const z = (x - mean) / sd;

  // Approximation using error function
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = z < 0 ? -1 : 1;
  const absZ = Math.abs(z) / Math.SQRT2;

  const t = 1.0 / (1.0 + p * absZ);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absZ * absZ);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Standard normal quantile function (inverse CDF)
 * Returns x such that P(Z <= x) = p
 */
export function qnorm(p: number, mean = 0, sd = 1): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p === 0.5) return mean;

  // Rational approximation for central region
  const a = [
    -3.969683028665376e+01, 2.209460984245205e+02,
    -2.759285104469687e+02, 1.383577518672690e+02,
    -3.066479806614716e+01, 2.506628277459239e+00
  ];
  const b = [
    -5.447609879822406e+01, 1.615858368580409e+02,
    -1.556989798598866e+02, 6.680131188771972e+01,
    -1.328068155288572e+01
  ];
  const c = [
    -7.784894002430293e-03, -3.223964580411365e-01,
    -2.400758277161838e+00, -2.549732539343734e+00,
    4.374664141464968e+00, 2.938163982698783e+00
  ];
  const d = [
    7.784695709041462e-03, 3.224671290700398e-01,
    2.445134137142996e+00, 3.754408661907416e+00
  ];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  let q: number;

  if (p < pLow) {
    // Rational approximation for lower region
    q = Math.sqrt(-2 * Math.log(p));
    q = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
        ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= pHigh) {
    // Rational approximation for central region
    q = p - 0.5;
    const r = q * q;
    q = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
        (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    // Rational approximation for upper region
    q = Math.sqrt(-2 * Math.log(1 - p));
    q = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
         ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }

  return mean + sd * q;
}

/**
 * Chi-squared CDF
 */
export function pchisq(x: number, df: number): number {
  if (x <= 0) return 0;
  if (df <= 0) return NaN;

  // Use gamma function relationship
  return gammainc(df / 2, x / 2);
}

/**
 * Chi-squared quantile function
 */
export function qchisq(p: number, df: number): number {
  if (p <= 0) return 0;
  if (p >= 1) return Infinity;
  if (df <= 0) return NaN;

  // Newton-Raphson iteration
  let x = df; // Initial guess
  for (let i = 0; i < 100; i++) {
    const px = pchisq(x, df);
    const dx = (px - p) / dchisq(x, df);
    x = Math.max(0.001, x - dx);
    if (Math.abs(dx) < 1e-10) break;
  }
  return x;
}

/**
 * Chi-squared PDF
 */
export function dchisq(x: number, df: number): number {
  if (x <= 0 || df <= 0) return 0;
  const k = df / 2;
  return Math.pow(x, k - 1) * Math.exp(-x / 2) / (Math.pow(2, k) * gamma(k));
}

/**
 * T-distribution CDF
 */
export function pt(t: number, df: number): number {
  if (df <= 0) return NaN;
  if (!isFinite(t)) return t > 0 ? 1 : 0;

  const x = df / (df + t * t);
  const prob = 0.5 * incompleteBeta(df / 2, 0.5, x);

  return t >= 0 ? 1 - prob : prob;
}

/**
 * T-distribution quantile function
 */
export function qt(p: number, df: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p === 0.5) return 0;

  // Newton-Raphson iteration
  let t = qnorm(p); // Start with normal approximation
  for (let i = 0; i < 100; i++) {
    const pt_val = pt(t, df);
    const dt_val = dt(t, df);
    if (dt_val === 0) break;
    const delta = (pt_val - p) / dt_val;
    t -= delta;
    if (Math.abs(delta) < 1e-10) break;
  }
  return t;
}

/**
 * T-distribution PDF
 */
export function dt(t: number, df: number): number {
  if (df <= 0) return NaN;
  const coef = gamma((df + 1) / 2) / (Math.sqrt(df * Math.PI) * gamma(df / 2));
  return coef * Math.pow(1 + (t * t) / df, -(df + 1) / 2);
}

/**
 * Gamma function
 */
export function gamma(z: number): number {
  if (z <= 0 && z === Math.floor(z)) return Infinity;

  // Lanczos approximation
  const g = 7;
  const c = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7
  ];

  if (z < 0.5) {
    return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  }

  z -= 1;
  let x = c[0];
  for (let i = 1; i < g + 2; i++) {
    x += c[i] / (z + i);
  }

  const t = z + g + 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

/**
 * Log gamma function
 */
export function lgamma(z: number): number {
  return Math.log(gamma(z));
}

/**
 * Lower incomplete gamma function P(a,x)
 */
export function gammainc(a: number, x: number): number {
  if (x < 0 || a <= 0) return NaN;
  if (x === 0) return 0;

  // Use series expansion for x < a+1, continued fraction otherwise
  if (x < a + 1) {
    // Series expansion
    let sum = 1 / a;
    let term = 1 / a;
    for (let n = 1; n < 100; n++) {
      term *= x / (a + n);
      sum += term;
      if (Math.abs(term) < Math.abs(sum) * 1e-15) break;
    }
    return sum * Math.exp(-x + a * Math.log(x) - lgamma(a));
  } else {
    // Continued fraction
    return 1 - gammainc_cf(a, x);
  }
}

/**
 * Upper incomplete gamma function Q(a,x) using continued fraction
 */
function gammainc_cf(a: number, x: number): number {
  let f = 1e-30;
  let c = 1e-30;
  let d = 1 / (x + 1 - a);
  let h = d;

  for (let i = 1; i < 100; i++) {
    const an = -i * (i - a);
    const bn = x + 2 * i + 1 - a;
    d = an * d + bn;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = bn + an / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-15) break;
  }

  return Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
}

/**
 * Incomplete beta function I_x(a,b)
 */
export function incompleteBeta(a: number, b: number, x: number): number {
  if (x < 0 || x > 1) return NaN;
  if (x === 0) return 0;
  if (x === 1) return 1;

  // Use continued fraction
  const bt = Math.exp(
    lgamma(a + b) - lgamma(a) - lgamma(b) +
    a * Math.log(x) + b * Math.log(1 - x)
  );

  if (x < (a + 1) / (a + b + 2)) {
    return bt * betacf(a, b, x) / a;
  } else {
    return 1 - bt * betacf(b, a, 1 - x) / b;
  }
}

/**
 * Continued fraction for incomplete beta
 */
function betacf(a: number, b: number, x: number): number {
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - qab * x / qap;
  if (Math.abs(d) < 1e-30) d = 1e-30;
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= 100; m++) {
    const m2 = 2 * m;
    let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    h *= d * c;

    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const del = d * c;
    h *= del;

    if (Math.abs(del - 1) < 1e-15) break;
  }

  return h;
}

/**
 * Calculate z-score from p-value (two-tailed)
 */
export function zFromP(p: number): number {
  return qnorm(1 - p / 2);
}

/**
 * Calculate p-value from z-score (two-tailed)
 */
export function pFromZ(z: number): number {
  return 2 * (1 - pnorm(Math.abs(z)));
}

/**
 * Calculate confidence interval
 */
export function confidenceInterval(
  estimate: number,
  se: number,
  level = 0.95
): { lower: number; upper: number; level: number } {
  const z = qnorm(1 - (1 - level) / 2);
  return {
    lower: estimate - z * se,
    upper: estimate + z * se,
    level
  };
}

/**
 * Weighted mean
 */
export function weightedMean(values: number[], weights: number[]): number {
  const sumW = weights.reduce((a, b) => a + b, 0);
  const sumWX = values.reduce((sum, x, i) => sum + x * weights[i], 0);
  return sumWX / sumW;
}

/**
 * Weighted variance
 */
export function weightedVariance(values: number[], weights: number[]): number {
  const mean = weightedMean(values, weights);
  const sumW = weights.reduce((a, b) => a + b, 0);
  const sumW2 = weights.reduce((a, b) => a + b * b, 0);
  const sumWX2 = values.reduce((sum, x, i) => sum + weights[i] * (x - mean) ** 2, 0);
  return sumWX2 / (sumW - sumW2 / sumW);
}

/**
 * Kendall's tau correlation
 */
export function kendallTau(x: number[], y: number[]): { tau: number; z: number; p: number } {
  const n = x.length;
  let concordant = 0;
  let discordant = 0;

  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      const xDiff = x[j] - x[i];
      const yDiff = y[j] - y[i];
      const product = xDiff * yDiff;
      if (product > 0) concordant++;
      else if (product < 0) discordant++;
    }
  }

  const tau = (concordant - discordant) / (n * (n - 1) / 2);

  // Normal approximation for large n
  const se = Math.sqrt((2 * (2 * n + 5)) / (9 * n * (n - 1)));
  const z = tau / se;
  const p = pFromZ(z);

  return { tau, z, p };
}
