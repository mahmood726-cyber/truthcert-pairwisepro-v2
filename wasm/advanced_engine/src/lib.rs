use std::collections::BTreeMap;
use std::f64::consts::PI;

const EPS: f64 = 1e-12;
const LOG_2PI: f64 = 1.8378770664093453;

#[derive(Clone)]
struct MultilevelFit {
    theta: f64,
    se_model: f64,
    se_robust: f64,
    ci_lower: f64,
    ci_upper: f64,
    tau2_within: f64,
    tau2_between: f64,
    tau2_total: f64,
    df: f64,
    icc_within: f64,
    icc_between: f64,
    converged: bool,
    iterations: usize,
    loglik_reml: f64,
}

#[derive(Clone)]
struct SelectionFit {
    theta_adjusted: f64,
    se_adjusted: f64,
    se_robust: f64,
    ci_lower: f64,
    ci_upper: f64,
    tau2: f64,
    loglik: f64,
    converged: bool,
    iterations: usize,
    theta_unadjusted: f64,
    se_unadjusted: f64,
    weights_step: [f64; 4],
    selection_ratio: f64,
}

#[derive(Clone)]
struct ClusterBlock {
    indices: Vec<usize>,
}

#[derive(Clone)]
struct RemlEval {
    mu: f64,
    xvx: f64,
    q: f64,
    logdet: f64,
    ll_reml: f64,
}

fn normal_cdf(x: f64) -> f64 {
    let a1 = 0.254829592_f64;
    let a2 = -0.284496736_f64;
    let a3 = 1.421413741_f64;
    let a4 = -1.453152027_f64;
    let a5 = 1.061405429_f64;
    let p = 0.3275911_f64;

    let sign = if x < 0.0 { -1.0 } else { 1.0 };
    let ax = x.abs() / std::f64::consts::SQRT_2;
    let t = 1.0 / (1.0 + p * ax);
    let y = 1.0
        - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * (-ax * ax).exp());
    0.5 * (1.0 + sign * y)
}

fn normal_pdf(x: f64) -> f64 {
    (-0.5 * x * x).exp() / (2.0 * PI).sqrt()
}

fn normal_inv(p: f64) -> f64 {
    if p <= 0.0 {
        return f64::NEG_INFINITY;
    }
    if p >= 1.0 {
        return f64::INFINITY;
    }
    if (p - 0.5).abs() < EPS {
        return 0.0;
    }

    let a = [
        -3.969683028665376e+01,
        2.209460984245205e+02,
        -2.759285104469687e+02,
        1.383577518672690e+02,
        -3.066479806614716e+01,
        2.506628277459239e+00,
    ];
    let b = [
        -5.447609879822406e+01,
        1.615858368580409e+02,
        -1.556989798598866e+02,
        6.680131188771972e+01,
        -1.328068155288572e+01,
    ];
    let c = [
        -7.784894002430293e-03,
        -3.223964580411365e-01,
        -2.400758277161838e+00,
        -2.549732539343734e+00,
        4.374664141464968e+00,
        2.938163982698783e+00,
    ];
    let d = [
        7.784695709041462e-03,
        3.224671290700398e-01,
        2.445134137142996e+00,
        3.754408661907416e+00,
    ];
    let p_low = 0.02425_f64;
    let p_high = 1.0 - p_low;

    if p < p_low {
        let q = (-2.0 * p.ln()).sqrt();
        (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5])
            / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1.0)
    } else if p <= p_high {
        let q = p - 0.5;
        let r = q * q;
        (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q
            / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1.0)
    } else {
        let q = (-2.0 * (1.0 - p).ln()).sqrt();
        -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5])
            / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1.0)
    }
}

fn t_critical_approx(level: f64, df: f64) -> f64 {
    let p = 1.0 - (1.0 - level) / 2.0;
    let z = normal_inv(p);
    if df <= 1.0 {
        return z.abs().max(12.0);
    }
    // Expansion around normal quantile
    let z2 = z * z;
    let z3 = z2 * z;
    let z5 = z3 * z2;
    let z7 = z5 * z2;
    z + (z3 + z) / (4.0 * df) + (5.0 * z5 + 16.0 * z3 + 3.0 * z) / (96.0 * df * df)
        + (3.0 * z7 + 19.0 * z5 + 17.0 * z3 - 15.0 * z) / (384.0 * df * df * df)
}

fn sigmoid(x: f64) -> f64 {
    if x >= 0.0 {
        let e = (-x).exp();
        1.0 / (1.0 + e)
    } else {
        let e = x.exp();
        e / (1.0 + e)
    }
}

fn two_sided_p_from_z(z: f64) -> f64 {
    2.0 * (1.0 - normal_cdf(z.abs()))
}

fn clip_positive(x: f64) -> f64 {
    if x.is_finite() { x.max(EPS) } else { EPS }
}

fn group_clusters(cluster: &[u32]) -> Vec<ClusterBlock> {
    let mut map: BTreeMap<u32, Vec<usize>> = BTreeMap::new();
    for (i, cid) in cluster.iter().enumerate() {
        map.entry(*cid).or_default().push(i);
    }
    map.into_values()
        .map(|indices| ClusterBlock { indices })
        .collect()
}

fn dl_tau2(yi: &[f64], vi: &[f64]) -> f64 {
    let k = yi.len();
    if k < 2 {
        return 0.0;
    }
    let wi: Vec<f64> = vi.iter().map(|v| 1.0 / clip_positive(*v)).collect();
    let sum_w: f64 = wi.iter().sum();
    let theta = yi
        .iter()
        .zip(wi.iter())
        .map(|(y, w)| y * w)
        .sum::<f64>()
        / clip_positive(sum_w);
    let q: f64 = yi
        .iter()
        .zip(wi.iter())
        .map(|(y, w)| w * (y - theta) * (y - theta))
        .sum();
    let sum_w2: f64 = wi.iter().map(|w| w * w).sum();
    let c = sum_w - sum_w2 / clip_positive(sum_w);
    ((q - (k as f64 - 1.0)) / clip_positive(c)).max(0.0)
}

fn eval_reml_two_level(
    yi: &[f64],
    vi: &[f64],
    clusters: &[ClusterBlock],
    tau2_within: f64,
    tau2_between: f64,
) -> Option<RemlEval> {
    let n = yi.len();
    if n < 2 {
        return None;
    }
    let sw = clip_positive(tau2_within);
    let sb = clip_positive(tau2_between);

    let mut xvx = 0.0_f64;
    let mut xvy = 0.0_f64;
    let mut logdet = 0.0_f64;

    for block in clusters {
        let mut sum_inv = 0.0;
        let mut sum_inv_y = 0.0;
        for &idx in &block.indices {
            let d = clip_positive(vi[idx] + sw);
            let inv = 1.0 / d;
            sum_inv += inv;
            sum_inv_y += inv * yi[idx];
            logdet += d.ln();
        }
        let den = 1.0 + sb * sum_inv;
        if den <= 0.0 || !den.is_finite() {
            return None;
        }
        logdet += den.ln();
        xvx += sum_inv - sb * sum_inv * sum_inv / den;
        xvy += sum_inv_y - sb * sum_inv * sum_inv_y / den;
    }

    xvx = clip_positive(xvx);
    let mu = xvy / xvx;

    let mut q = 0.0_f64;
    for block in clusters {
        let mut sum_inv = 0.0;
        let mut sum_inv_r = 0.0;
        let mut sum_inv_r2 = 0.0;
        for &idx in &block.indices {
            let d = clip_positive(vi[idx] + sw);
            let inv = 1.0 / d;
            let r = yi[idx] - mu;
            sum_inv += inv;
            sum_inv_r += inv * r;
            sum_inv_r2 += inv * r * r;
        }
        let den = clip_positive(1.0 + sb * sum_inv);
        q += sum_inv_r2 - sb * sum_inv_r * sum_inv_r / den;
    }
    q = clip_positive(q);

    let ll_reml = -0.5 * (logdet + xvx.ln() + q + (n as f64 - 1.0) * LOG_2PI);
    Some(RemlEval {
        mu,
        xvx,
        q,
        logdet,
        ll_reml,
    })
}

fn optimize_two_level_reml(
    yi: &[f64],
    vi: &[f64],
    clusters: &[ClusterBlock],
    max_iter: usize,
    tol: f64,
) -> (f64, f64, bool, usize) {
    let dl = dl_tau2(yi, vi);
    let has_multi = clusters.iter().any(|b| b.indices.len() > 1);
    let init_sw = if has_multi { 0.5 * dl } else { 0.0 };
    let init_sb = if has_multi { 0.5 * dl } else { dl.max(EPS) };

    let mut x = [clip_positive(init_sw).ln(), clip_positive(init_sb).ln()];
    let mut step = 1.0_f64;

    let mut best = {
        let sw = x[0].exp();
        let sb = x[1].exp();
        eval_reml_two_level(yi, vi, clusters, sw, sb)
            .map(|e| -e.ll_reml)
            .unwrap_or(f64::INFINITY)
    };

    let mut converged = false;
    let mut iters = 0usize;
    for iter in 0..max_iter {
        iters = iter + 1;
        let mut improved = false;
        for dim in 0..2 {
            for dir in [-1.0_f64, 1.0_f64] {
                let mut cand = x;
                cand[dim] += dir * step;
                let sw = cand[0].exp();
                let sb = cand[1].exp();
                let val = eval_reml_two_level(yi, vi, clusters, sw, sb)
                    .map(|e| -e.ll_reml)
                    .unwrap_or(f64::INFINITY);
                if val + 1e-12 < best {
                    best = val;
                    x = cand;
                    improved = true;
                }
            }
        }
        if !improved {
            step *= 0.5;
            if step < tol.max(1e-7) {
                converged = true;
                break;
            }
        }
    }
    (x[0].exp(), x[1].exp(), converged, iters)
}

fn fit_multilevel_reml_internal(
    yi: &[f64],
    vi: &[f64],
    cluster_ids: &[u32],
    max_iter: usize,
    tol: f64,
    level: f64,
) -> Option<MultilevelFit> {
    if yi.len() != vi.len() || yi.len() != cluster_ids.len() || yi.len() < 2 {
        return None;
    }
    let clusters = group_clusters(cluster_ids);
    let m = clusters.len();
    if m < 1 {
        return None;
    }

    let (sw, sb, converged, iterations) =
        optimize_two_level_reml(yi, vi, &clusters, max_iter.max(10), tol.max(1e-8));
    let eval = eval_reml_two_level(yi, vi, &clusters, sw, sb)?;

    let theta = eval.mu;
    let se_model = (1.0 / clip_positive(eval.xvx)).sqrt();
    let df = (m as f64 - 1.0).max(1.0);

    let mut meat = 0.0_f64;
    for block in &clusters {
        let mut sum_inv = 0.0_f64;
        let mut sum_inv_r = 0.0_f64;
        for &idx in &block.indices {
            let d = clip_positive(vi[idx] + sw);
            let inv = 1.0 / d;
            let r = yi[idx] - theta;
            sum_inv += inv;
            sum_inv_r += inv * r;
        }
        let den = clip_positive(1.0 + sb * sum_inv);
        let score = sum_inv_r - sb * sum_inv * sum_inv_r / den;
        meat += score * score;
    }
    let m_f = m as f64;
    let se_robust = if m > 1 {
        ((m_f / (m_f - 1.0)) * meat / (eval.xvx * eval.xvx)).sqrt()
    } else {
        se_model
    };

    let tcrit = t_critical_approx(level, df);
    let ci_lower = theta - tcrit * se_robust;
    let ci_upper = theta + tcrit * se_robust;

    let total = sw + sb;
    let icc_within = if total > EPS { sw / total } else { 0.0 };
    let icc_between = if total > EPS { sb / total } else { 0.0 };

    Some(MultilevelFit {
        theta,
        se_model,
        se_robust,
        ci_lower,
        ci_upper,
        tau2_within: sw,
        tau2_between: sb,
        tau2_total: total,
        df,
        icc_within,
        icc_between,
        converged,
        iterations,
        loglik_reml: eval.ll_reml,
    })
}

fn pooled_re_unadjusted(yi: &[f64], vi: &[f64], tau2: f64) -> (f64, f64) {
    let w: Vec<f64> = vi
        .iter()
        .map(|v| 1.0 / clip_positive(*v + tau2.max(0.0)))
        .collect();
    let sum_w: f64 = w.iter().sum();
    let theta = yi
        .iter()
        .zip(w.iter())
        .map(|(y, wi)| y * wi)
        .sum::<f64>()
        / clip_positive(sum_w);
    let se = (1.0 / clip_positive(sum_w)).sqrt();
    (theta, se)
}

fn p_bin_prob(mu: f64, sigma: f64, se_obs: f64, lower_p: f64, upper_p: f64) -> f64 {
    let z_lower = normal_inv(1.0 - upper_p / 2.0).max(0.0);
    let z_upper = if lower_p <= 0.0 {
        f64::INFINITY
    } else {
        normal_inv(1.0 - lower_p / 2.0).max(z_lower)
    };

    let l = z_lower * se_obs;
    let u = if z_upper.is_finite() {
        z_upper * se_obs
    } else {
        f64::INFINITY
    };

    let pos = if u.is_finite() {
        normal_cdf((u - mu) / sigma) - normal_cdf((l - mu) / sigma)
    } else {
        1.0 - normal_cdf((l - mu) / sigma)
    };
    let neg = if u.is_finite() {
        normal_cdf((-l - mu) / sigma) - normal_cdf((-u - mu) / sigma)
    } else {
        normal_cdf((-l - mu) / sigma)
    };
    (pos + neg).max(EPS)
}

fn p_bin_index(p: f64) -> usize {
    if p <= 0.025 {
        0
    } else if p <= 0.05 {
        1
    } else if p <= 0.10 {
        2
    } else {
        3
    }
}

fn step_loglik(
    yi: &[f64],
    vi: &[f64],
    params: &[f64; 5],
) -> f64 {
    let mu = params[0];
    let tau2 = params[1].exp().max(0.0);
    let weights = [1.0, sigmoid(params[2]), sigmoid(params[3]), sigmoid(params[4])];
    let bins = [(0.0, 0.025), (0.025, 0.05), (0.05, 0.10), (0.10, 1.0)];

    let mut ll = 0.0_f64;
    for i in 0..yi.len() {
        let se_obs = clip_positive(vi[i].sqrt());
        let sigma = clip_positive((vi[i] + tau2).sqrt());
        let z_obs = yi[i] / se_obs;
        let p_obs = two_sided_p_from_z(z_obs);
        let idx = p_bin_index(p_obs);
        let w_obs = weights[idx].max(EPS);

        let z = (yi[i] - mu) / sigma;
        let f = (normal_pdf(z) / sigma).max(1e-300);

        let mut z_norm = 0.0;
        for (j, (lo, hi)) in bins.iter().enumerate() {
            let pj = p_bin_prob(mu, sigma, se_obs, *lo, *hi);
            z_norm += weights[j] * pj;
        }
        z_norm = z_norm.max(1e-300);
        ll += f.ln() + w_obs.ln() - z_norm.ln();
    }
    ll
}

fn beta_weight(p: f64, a: f64, b: f64) -> f64 {
    sigmoid(a + b * p).max(EPS)
}

fn beta_norm_integral(mu: f64, sigma: f64, se_obs: f64, a: f64, b: f64) -> f64 {
    // Simpson integration on y-space (mu ± 8 sigma)
    let n = 160usize;
    let lo = mu - 8.0 * sigma;
    let hi = mu + 8.0 * sigma;
    let h = (hi - lo) / n as f64;
    let mut sum = 0.0;
    for k in 0..=n {
        let y = lo + k as f64 * h;
        let z = y / se_obs;
        let p = two_sided_p_from_z(z);
        let w = beta_weight(p, a, b);
        let f = normal_pdf((y - mu) / sigma) / sigma;
        let coeff = if k == 0 || k == n {
            1.0
        } else if k % 2 == 0 {
            2.0
        } else {
            4.0
        };
        sum += coeff * w * f;
    }
    (sum * h / 3.0).max(EPS)
}

fn beta_loglik(
    yi: &[f64],
    vi: &[f64],
    params: &[f64; 4],
) -> f64 {
    let mu = params[0];
    let tau2 = params[1].exp().max(0.0);
    let a = params[2];
    let b = params[3];
    let mut ll = 0.0;

    for i in 0..yi.len() {
        let se_obs = clip_positive(vi[i].sqrt());
        let sigma = clip_positive((vi[i] + tau2).sqrt());
        let p_obs = two_sided_p_from_z(yi[i] / se_obs);
        let w_obs = beta_weight(p_obs, a, b);
        let f = (normal_pdf((yi[i] - mu) / sigma) / sigma).max(1e-300);
        let z_norm = beta_norm_integral(mu, sigma, se_obs, a, b);
        ll += f.ln() + w_obs.ln() - z_norm.ln();
    }
    ll
}

fn optimize_pattern<const N: usize>(
    initial: [f64; N],
    mut step: f64,
    max_iter: usize,
    tol: f64,
    objective: impl Fn(&[f64; N]) -> f64,
) -> ([f64; N], bool, usize) {
    let mut x = initial;
    let mut best = objective(&x);
    let mut converged = false;
    let mut iters = 0usize;

    for iter in 0..max_iter {
        iters = iter + 1;
        let mut improved = false;
        for dim in 0..N {
            for dir in [-1.0_f64, 1.0_f64] {
                let mut cand = x;
                cand[dim] += dir * step;
                let val = objective(&cand);
                if val + 1e-12 < best {
                    best = val;
                    x = cand;
                    improved = true;
                }
            }
        }
        if !improved {
            step *= 0.5;
            if step < tol.max(1e-7) {
                converged = true;
                break;
            }
        }
    }
    (x, converged, iters)
}

fn cluster_ids_or_unique(cluster: Option<&[u32]>, n: usize) -> Vec<u32> {
    if let Some(c) = cluster {
        if c.len() == n {
            return c.to_vec();
        }
    }
    (0..n as u32).collect()
}

fn cluster_robust_se_weighted(
    yi: &[f64],
    wi: &[f64],
    cluster_ids: &[u32],
    theta: f64,
) -> (f64, f64) {
    let mut map: BTreeMap<u32, f64> = BTreeMap::new();
    let a: f64 = wi.iter().sum::<f64>().max(EPS);
    for i in 0..yi.len() {
        let score = wi[i] * (yi[i] - theta);
        *map.entry(cluster_ids[i]).or_insert(0.0) += score;
    }
    let m = map.len().max(1) as f64;
    let meat: f64 = map.values().map(|u| u * u).sum();
    let se = if m > 1.0 {
        ((m / (m - 1.0)) * meat / (a * a)).sqrt()
    } else {
        (1.0 / a).sqrt()
    };
    (se, (m - 1.0).max(1.0))
}

fn fit_selection_step_internal(
    yi: &[f64],
    vi: &[f64],
    cluster: Option<&[u32]>,
    max_iter: usize,
    tol: f64,
    level: f64,
) -> Option<SelectionFit> {
    if yi.len() != vi.len() || yi.len() < 3 {
        return None;
    }
    let n = yi.len();
    let tau_dl = dl_tau2(yi, vi);
    let (theta0, _) = pooled_re_unadjusted(yi, vi, tau_dl);
    let init = [theta0, clip_positive(tau_dl + 1e-6).ln(), 0.0, -0.5, -1.0];

    let objective = |x: &[f64; 5]| -> f64 { -step_loglik(yi, vi, x) };
    let (par, converged, iterations) = optimize_pattern(init, 0.5, max_iter.max(40), tol, objective);

    let ll = step_loglik(yi, vi, &par);
    let tau2 = par[1].exp().max(0.0);
    let weights_step = [1.0, sigmoid(par[2]), sigmoid(par[3]), sigmoid(par[4])];
    let selection_ratio =
        weights_step.iter().copied().fold(f64::MIN, f64::max) / weights_step.iter().copied().fold(f64::MAX, f64::min).max(EPS);

    let h = 1e-4;
    let mut ph = par;
    ph[0] += h;
    let ll_up = step_loglik(yi, vi, &ph);
    let mut pl = par;
    pl[0] -= h;
    let ll_dn = step_loglik(yi, vi, &pl);
    let d2 = (ll_up - 2.0 * ll + ll_dn) / (h * h);

    let mut wi_adj = Vec::with_capacity(n);
    for i in 0..n {
        let se_obs = clip_positive(vi[i].sqrt());
        let p_obs = two_sided_p_from_z(yi[i] / se_obs);
        let idx = p_bin_index(p_obs);
        wi_adj.push(weights_step[idx] / clip_positive(vi[i] + tau2));
    }
    let sum_w: f64 = wi_adj.iter().sum::<f64>().max(EPS);
    let theta = yi
        .iter()
        .zip(wi_adj.iter())
        .map(|(y, w)| y * w)
        .sum::<f64>()
        / sum_w;
    let se_default = (1.0 / sum_w).sqrt();
    let se_model = if d2 < -EPS { (-1.0 / d2).sqrt() } else { se_default };

    let cluster_ids = cluster_ids_or_unique(cluster, n);
    let (se_robust, df) = cluster_robust_se_weighted(yi, &wi_adj, &cluster_ids, theta);
    let tcrit = t_critical_approx(level, df);
    let ci_lower = theta - tcrit * se_robust;
    let ci_upper = theta + tcrit * se_robust;

    let (theta_unadjusted, se_unadjusted) = pooled_re_unadjusted(yi, vi, tau2);

    Some(SelectionFit {
        theta_adjusted: theta,
        se_adjusted: se_model,
        se_robust,
        ci_lower,
        ci_upper,
        tau2,
        loglik: ll,
        converged,
        iterations,
        theta_unadjusted,
        se_unadjusted,
        weights_step,
        selection_ratio,
    })
}

fn fit_selection_beta_internal(
    yi: &[f64],
    vi: &[f64],
    cluster: Option<&[u32]>,
    max_iter: usize,
    tol: f64,
    level: f64,
) -> Option<SelectionFit> {
    if yi.len() != vi.len() || yi.len() < 3 {
        return None;
    }
    let n = yi.len();
    let tau_dl = dl_tau2(yi, vi);
    let (theta0, _) = pooled_re_unadjusted(yi, vi, tau_dl);
    let init = [theta0, clip_positive(tau_dl + 1e-6).ln(), 0.0, -3.0];
    let objective = |x: &[f64; 4]| -> f64 { -beta_loglik(yi, vi, x) };
    let (par, converged, iterations) = optimize_pattern(init, 0.5, max_iter.max(40), tol, objective);

    let ll = beta_loglik(yi, vi, &par);
    let tau2 = par[1].exp().max(0.0);
    let a = par[2];
    let b = par[3];

    let mut wi_adj = Vec::with_capacity(n);
    for i in 0..n {
        let p_obs = two_sided_p_from_z(yi[i] / clip_positive(vi[i].sqrt()));
        let w = beta_weight(p_obs, a, b);
        wi_adj.push(w / clip_positive(vi[i] + tau2));
    }
    let sum_w: f64 = wi_adj.iter().sum::<f64>().max(EPS);
    let theta = yi
        .iter()
        .zip(wi_adj.iter())
        .map(|(y, w)| y * w)
        .sum::<f64>()
        / sum_w;
    let se_model = (1.0 / sum_w).sqrt();

    let cluster_ids = cluster_ids_or_unique(cluster, n);
    let (se_robust, df) = cluster_robust_se_weighted(yi, &wi_adj, &cluster_ids, theta);
    let tcrit = t_critical_approx(level, df);
    let ci_lower = theta - tcrit * se_robust;
    let ci_upper = theta + tcrit * se_robust;

    let (theta_unadjusted, se_unadjusted) = pooled_re_unadjusted(yi, vi, tau2);
    let weights_step = [
        beta_weight(0.0125, a, b),
        beta_weight(0.0375, a, b),
        beta_weight(0.075, a, b),
        beta_weight(0.55, a, b),
    ];
    let selection_ratio =
        weights_step.iter().copied().fold(f64::MIN, f64::max) / weights_step.iter().copied().fold(f64::MAX, f64::min).max(EPS);

    Some(SelectionFit {
        theta_adjusted: theta,
        se_adjusted: se_model,
        se_robust,
        ci_lower,
        ci_upper,
        tau2,
        loglik: ll,
        converged,
        iterations,
        theta_unadjusted,
        se_unadjusted,
        weights_step,
        selection_ratio,
    })
}

unsafe fn read_f64_slice<'a>(ptr: *const f64, len: usize) -> &'a [f64] {
    std::slice::from_raw_parts(ptr, len)
}

unsafe fn read_u32_slice<'a>(ptr: *const u32, len: usize) -> &'a [u32] {
    std::slice::from_raw_parts(ptr, len)
}

unsafe fn write_out(out_ptr: *mut f64, data: &[f64]) {
    let out = std::slice::from_raw_parts_mut(out_ptr, data.len());
    out.copy_from_slice(data);
}

#[no_mangle]
pub extern "C" fn alloc_f64(len: usize) -> *mut f64 {
    let mut v = Vec::<f64>::with_capacity(len);
    let ptr = v.as_mut_ptr();
    std::mem::forget(v);
    ptr
}

#[no_mangle]
pub extern "C" fn free_f64(ptr: *mut f64, len: usize) {
    if ptr.is_null() || len == 0 {
        return;
    }
    unsafe {
        let _ = Vec::from_raw_parts(ptr, len, len);
    }
}

#[no_mangle]
pub extern "C" fn alloc_u32(len: usize) -> *mut u32 {
    let mut v = Vec::<u32>::with_capacity(len);
    let ptr = v.as_mut_ptr();
    std::mem::forget(v);
    ptr
}

#[no_mangle]
pub extern "C" fn free_u32(ptr: *mut u32, len: usize) {
    if ptr.is_null() || len == 0 {
        return;
    }
    unsafe {
        let _ = Vec::from_raw_parts(ptr, len, len);
    }
}

#[no_mangle]
pub extern "C" fn tc_multilevel_reml(
    yi_ptr: *const f64,
    vi_ptr: *const f64,
    cluster_ptr: *const u32,
    n: usize,
    max_iter: usize,
    tol: f64,
    level: f64,
    out_ptr: *mut f64,
) -> i32 {
    if yi_ptr.is_null() || vi_ptr.is_null() || cluster_ptr.is_null() || out_ptr.is_null() || n < 2 {
        return -1;
    }
    let yi = unsafe { read_f64_slice(yi_ptr, n) };
    let vi = unsafe { read_f64_slice(vi_ptr, n) };
    let cluster = unsafe { read_u32_slice(cluster_ptr, n) };

    match fit_multilevel_reml_internal(yi, vi, cluster, max_iter, tol, level) {
        Some(fit) => {
            let out = [
                fit.theta,
                fit.se_model,
                fit.se_robust,
                fit.ci_lower,
                fit.ci_upper,
                fit.tau2_within,
                fit.tau2_between,
                fit.tau2_total,
                fit.df,
                fit.icc_within,
                fit.icc_between,
                if fit.converged { 1.0 } else { 0.0 },
                fit.iterations as f64,
                fit.loglik_reml,
            ];
            unsafe { write_out(out_ptr, &out) };
            0
        }
        None => -2,
    }
}

#[no_mangle]
pub extern "C" fn tc_selection_step(
    yi_ptr: *const f64,
    vi_ptr: *const f64,
    cluster_ptr: *const u32,
    n: usize,
    max_iter: usize,
    tol: f64,
    level: f64,
    out_ptr: *mut f64,
) -> i32 {
    if yi_ptr.is_null() || vi_ptr.is_null() || out_ptr.is_null() || n < 3 {
        return -1;
    }
    let yi = unsafe { read_f64_slice(yi_ptr, n) };
    let vi = unsafe { read_f64_slice(vi_ptr, n) };
    let cluster = if cluster_ptr.is_null() {
        None
    } else {
        Some(unsafe { read_u32_slice(cluster_ptr, n) })
    };

    match fit_selection_step_internal(yi, vi, cluster, max_iter, tol, level) {
        Some(fit) => {
            let out = [
                fit.theta_adjusted,
                fit.se_adjusted,
                fit.se_robust,
                fit.ci_lower,
                fit.ci_upper,
                fit.tau2,
                fit.loglik,
                fit.weights_step[0],
                fit.weights_step[1],
                fit.weights_step[2],
                fit.weights_step[3],
                fit.selection_ratio,
                if fit.converged { 1.0 } else { 0.0 },
                fit.iterations as f64,
                fit.theta_unadjusted,
                fit.se_unadjusted,
            ];
            unsafe { write_out(out_ptr, &out) };
            0
        }
        None => -2,
    }
}

#[no_mangle]
pub extern "C" fn tc_selection_beta(
    yi_ptr: *const f64,
    vi_ptr: *const f64,
    cluster_ptr: *const u32,
    n: usize,
    max_iter: usize,
    tol: f64,
    level: f64,
    out_ptr: *mut f64,
) -> i32 {
    if yi_ptr.is_null() || vi_ptr.is_null() || out_ptr.is_null() || n < 3 {
        return -1;
    }
    let yi = unsafe { read_f64_slice(yi_ptr, n) };
    let vi = unsafe { read_f64_slice(vi_ptr, n) };
    let cluster = if cluster_ptr.is_null() {
        None
    } else {
        Some(unsafe { read_u32_slice(cluster_ptr, n) })
    };

    match fit_selection_beta_internal(yi, vi, cluster, max_iter, tol, level) {
        Some(fit) => {
            let out = [
                fit.theta_adjusted,
                fit.se_adjusted,
                fit.se_robust,
                fit.ci_lower,
                fit.ci_upper,
                fit.tau2,
                fit.loglik,
                fit.weights_step[0],
                fit.weights_step[1],
                fit.weights_step[2],
                fit.weights_step[3],
                fit.selection_ratio,
                if fit.converged { 1.0 } else { 0.0 },
                fit.iterations as f64,
                fit.theta_unadjusted,
                fit.se_unadjusted,
            ];
            unsafe { write_out(out_ptr, &out) };
            0
        }
        None => -2,
    }
}
