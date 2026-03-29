(function () {
  'use strict';

  if (typeof window === 'undefined') {
    return;
  }
  if (window.__tc_wasm_pairwise_overrides__) {
    return;
  }
  window.__tc_wasm_pairwise_overrides__ = true;

  const legacy = {
    rma_mv_multilevel: typeof window.rma_mv_multilevel === 'function' ? window.rma_mv_multilevel : null,
    threeLevel_MetaAnalysis: typeof window.threeLevel_MetaAnalysis === 'function' ? window.threeLevel_MetaAnalysis : null,
    selectionModel: typeof window.selectionModel === 'function' ? window.selectionModel : null,
    stepSelectionCRVE: typeof window.stepSelectionCRVE === 'function' ? window.stepSelectionCRVE : null,
    fitSelectionModelRoBMA: typeof window.fitSelectionModelRoBMA === 'function' ? window.fitSelectionModelRoBMA : null
  };
  window.__tc_wasm_pairwise_legacy__ = legacy;

  const STEP_BREAKS = [0.025, 0.05, 0.1, 1.0];

  function finiteOr(value, fallback) {
    return Number.isFinite(value) ? value : fallback;
  }

  function positiveOr(value, fallback) {
    const num = Number(value);
    return Number.isFinite(num) && num > 0 ? num : fallback;
  }

  function toNumericArray(input, name) {
    if (!Array.isArray(input)) {
      throw new Error(name + ' must be an array.');
    }
    return input.map(function (value, index) {
      const num = Number(value);
      if (!Number.isFinite(num)) {
        throw new Error(name + '[' + index + '] is not finite.');
      }
      return num;
    });
  }

  function erfApprox(x) {
    const sign = x < 0 ? -1 : 1;
    const ax = Math.abs(x);
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    const t = 1 / (1 + p * ax);
    const y = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax));
    return sign * y;
  }

  function normalCdf(x) {
    if (typeof window.normalCDF === 'function') {
      return window.normalCDF(x);
    }
    return 0.5 * (1 + erfApprox(x / Math.SQRT2));
  }

  function normalInv(p) {
    if (typeof window.qnorm === 'function') {
      return window.qnorm(p);
    }
    const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
    const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
    const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
    const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
    const pLow = 0.02425;
    const pHigh = 1 - pLow;

    if (p <= 0) {
      return Number.NEGATIVE_INFINITY;
    }
    if (p >= 1) {
      return Number.POSITIVE_INFINITY;
    }

    let q;
    let r;
    if (p < pLow) {
      q = Math.sqrt(-2 * Math.log(p));
      return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
        ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }
    if (p <= pHigh) {
      q = p - 0.5;
      r = q * q;
      return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
        (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
    }

    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }

  function tCdf(x, df) {
    if (typeof window.tCDF === 'function') {
      return window.tCDF(x, df);
    }
    return normalCdf(x);
  }

  function tQuantile(p, df) {
    if (typeof window.tQuantile === 'function') {
      return window.tQuantile(p, df);
    }
    if (typeof window.qt === 'function') {
      return window.qt(p, df);
    }
    return normalInv(p);
  }

  function chiSquareCdf(x, df) {
    if (typeof window.chiSquareCDF === 'function') {
      return window.chiSquareCDF(x, df);
    }
    if (x <= 0) {
      return 0;
    }
    // Wilson-Hilferty approximation
    const z = (Math.pow(x / df, 1 / 3) - (1 - 2 / (9 * df))) / Math.sqrt(2 / (9 * df));
    return normalCdf(z);
  }

  function bridgeReady() {
    return !!(window.TruthCertWasmBridge && typeof window.TruthCertWasmBridge.isReady === 'function' && window.TruthCertWasmBridge.isReady());
  }

  function withFallback(name, argsLike, fn) {
    try {
      return fn();
    } catch (err) {
      const fb = legacy[name];
      if (typeof fb === 'function') {
        return fb.apply(window, argsLike);
      }
      throw err;
    }
  }

  function summarizeClusters(cluster) {
    const counts = new Map();
    for (let i = 0; i < cluster.length; i += 1) {
      const key = String(cluster[i]);
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    const sizes = Array.from(counts.values());
    return {
      nClusters: sizes.length,
      sizes: sizes,
      avgPerCluster: sizes.length > 0 ? (cluster.length / sizes.length).toFixed(2) : '0.00'
    };
  }

  function twoSidedP(yi, vi) {
    const se = Math.sqrt(positiveOr(vi, 1e-12));
    const z = yi / se;
    return 2 * (1 - normalCdf(Math.abs(z)));
  }

  function buildStepWeightObjects(weights) {
    return [
      { lower: 0, upper: STEP_BREAKS[0], weight: weights[0] },
      { lower: STEP_BREAKS[0], upper: STEP_BREAKS[1], weight: weights[1] },
      { lower: STEP_BREAKS[1], upper: STEP_BREAKS[2], weight: weights[2] },
      { lower: STEP_BREAKS[2], upper: STEP_BREAKS[3], weight: weights[3] }
    ];
  }

  window.rma_mv_multilevel = function (yi, vi, clusterIds, options) {
    return withFallback('rma_mv_multilevel', arguments, function () {
      if (!bridgeReady()) {
        throw new Error('WASM bridge not ready.');
      }

      const bridge = window.TruthCertWasmBridge;
      const y = toNumericArray(yi, 'yi');
      const v = toNumericArray(vi, 'vi');
      if (y.length !== v.length || y.length < 2) {
        throw new Error('yi/vi must have same length and at least 2 rows.');
      }
      if (!Array.isArray(clusterIds) || clusterIds.length !== y.length) {
        throw new Error('cluster_ids must match yi length.');
      }

      const opts = options || {};
      const level = Math.min(0.999, Math.max(0.5, finiteOr(opts.level, 0.95)));
      const test = String(opts.test || 'z').toLowerCase();
      const useTInference = test === 'knha' || test === 't';

      const fit = bridge.multilevelReml(y, v, clusterIds, {
        maxIter: opts.maxIter,
        tol: opts.tol,
        level: level
      });

      const clusterMeta = summarizeClusters(clusterIds);
      const meanVi = v.reduce(function (acc, value) { return acc + value; }, 0) / y.length;
      const totalDenom = Math.max(1e-12, meanVi + fit.tau2_total);
      const i2Level2 = 100 * fit.tau2_within / totalDenom;
      const i2Level3 = 100 * fit.tau2_between / totalDenom;
      const i2Total = i2Level2 + i2Level3;

      const dfRaw = Math.max(1, finiteOr(fit.df, clusterMeta.nClusters - 1));
      const seModel = positiveOr(fit.se_model, positiveOr(fit.se_robust, 1e-12));
      const seRobust = positiveOr(fit.se_robust, seModel);
      const seForInference = useTInference ? seRobust : seModel;
      const statValue = fit.theta / seForInference;
      const pval = useTInference ?
        2 * (1 - tCdf(Math.abs(statValue), dfRaw)) :
        2 * (1 - normalCdf(Math.abs(statValue)));
      const zval = useTInference ? null : statValue;
      const tval = useTInference ? statValue : null;
      const pooledDf = useTInference ? dfRaw : null;
      const ciCrit = useTInference ?
        tQuantile(1 - (1 - level) / 2, dfRaw) :
        normalInv(1 - (1 - level) / 2);
      const ciLower = fit.theta - ciCrit * seForInference;
      const ciUpper = fit.theta + ciCrit * seForInference;

      const qTotal = y.reduce(function (acc, yiValue, idx) {
        return acc + Math.pow(yiValue - fit.theta, 2) / positiveOr(v[idx] + fit.tau2_total, 1e-12);
      }, 0);
      const qDf = Math.max(1, y.length - 1);
      const qP = 1 - chiSquareCdf(qTotal, qDf);

      const piDf = Math.max(1, clusterMeta.nClusters - 1);
      const tCrit = tQuantile(1 - (1 - level) / 2, piDf);
      const piSE = Math.sqrt(Math.max(0, seForInference * seForInference + fit.tau2_total));
      const piLower = fit.theta - tCrit * piSE;
      const piUpper = fit.theta + tCrit * piSE;

      const nParams = 3;
      const aic = -2 * fit.logLik + 2 * nParams;
      const bic = -2 * fit.logLik + Math.log(Math.max(y.length, 2)) * nParams;

      return {
        model: 'Three-Level Random Effects (rma.mv, WASM)',
        method: opts.method || 'REML',
        pooled: {
          estimate: fit.theta,
          se: seForInference,
          se_model: seModel,
          se_robust: seRobust,
          ci_lower: ciLower,
          ci_upper: ciUpper,
          zval: zval,
          tval: tval,
          df: pooledDf,
          pval: pval
        },
        predictionInterval: {
          lower: piLower,
          upper: piUpper
        },
        varianceComponents: {
          sigma2_within: fit.tau2_within,
          sigma2_between: fit.tau2_between,
          tau2_total: fit.tau2_total,
          sigma_within: Math.sqrt(Math.max(0, fit.tau2_within)),
          sigma_between: Math.sqrt(Math.max(0, fit.tau2_between))
        },
        heterogeneity: {
          I2_level2: i2Level2,
          I2_level3: i2Level3,
          I2_total: i2Total,
          Q_total: qTotal,
          Q_df: qDf,
          Q_pval: qP
        },
        structure: {
          k: y.length,
          nClusters: clusterMeta.nClusters,
          avgPerCluster: clusterMeta.avgPerCluster,
          clusterSizes: clusterMeta.sizes,
          nStudies: clusterMeta.nClusters,
          nEffects: y.length
        },
        fit: {
          logLik: fit.logLik,
          AIC: aic,
          BIC: bic,
          converged: !!fit.converged,
          iterations: fit.iterations
        },
        test: test,
        interpretation: {
          variance: i2Level3 > i2Level2 ?
            'Most heterogeneity is between clusters (Level 3 dominant)' :
            'Substantial within-cluster heterogeneity (Level 2 dominant)',
          effect: pval < 0.05 ?
            'Significant pooled effect (' + (useTInference ? 't' : 'z') + ' = ' + statValue.toFixed(3) + ', p = ' + pval.toFixed(4) + ')' :
            'No significant pooled effect'
        }
      };
    });
  };

  window.threeLevel_MetaAnalysis = function (rows, options) {
    return withFallback('threeLevel_MetaAnalysis', arguments, function () {
      if (!Array.isArray(rows) || rows.length < 2) {
        throw new Error('threeLevel_MetaAnalysis requires at least two rows.');
      }
      const yi = [];
      const vi = [];
      const clusters = [];
      for (let i = 0; i < rows.length; i += 1) {
        const row = rows[i] || {};
        yi.push(Number(row.yi));
        vi.push(Number(row.vi));
        clusters.push(row.cluster_id);
      }

      const fit = window.rma_mv_multilevel(yi, vi, clusters, {
        method: (options && options.method) || 'REML',
        maxIter: options && options.maxIter,
        tol: options && options.tol,
        test: 'z',
        level: finiteOr(options && options.level, 0.95)
      });

      const within = Math.max(0, Number(fit.varianceComponents.sigma2_within) || 0);
      const between = Math.max(0, Number(fit.varianceComponents.sigma2_between) || 0);
      const total = within + between;
      const iccWithin = total > 0 ? within / total : 0;
      const iccBetween = total > 0 ? between / total : 0;

      return {
        theta: fit.pooled.estimate,
        se: fit.pooled.se,
        ci_lower: fit.pooled.ci_lower,
        ci_upper: fit.pooled.ci_upper,
        df: fit.pooled.df,
        exp_theta: Math.exp(fit.pooled.estimate),
        exp_ci: [Math.exp(fit.pooled.ci_lower), Math.exp(fit.pooled.ci_upper)],
        tau2_within: within,
        tau2_between: between,
        tau2_total: total,
        tau_within: Math.sqrt(within),
        tau_between: Math.sqrt(between),
        ICC: {
          level2: iccWithin,
          level3: iccBetween,
          interpretation: (100 * iccWithin).toFixed(1) + '% within-cluster, ' + (100 * iccBetween).toFixed(1) + '% between-cluster heterogeneity'
        },
        n_effects: yi.length,
        n_clusters: fit.structure.nClusters,
        converged: !!(fit.fit && fit.fit.converged),
        convergence_iter: fit.fit ? fit.fit.iterations : null,
        method: 'Three-Level RE (WASM likelihood + CRVE)',
        warning: null,
        reference: 'Viechtbauer W. J Stat Softw 2010;36(3):1-48'
      };
    });
  };

  window.selectionModel = function (yi, vi, type) {
    return withFallback('selectionModel', arguments, function () {
      if (!bridgeReady()) {
        throw new Error('WASM bridge not ready.');
      }

      const bridge = window.TruthCertWasmBridge;
      const mode = String(type || 'step').toLowerCase() === 'beta' ? 'beta' : 'step';
      const y = toNumericArray(yi, 'yi');
      const v = toNumericArray(vi, 'vi');
      if (y.length !== v.length || y.length < 3) {
        throw new Error('yi/vi must have same length and at least 3 rows.');
      }

      const fit = mode === 'beta' ?
        bridge.selectionBeta(y, v, null, { maxIter: 140, tol: 1e-6, level: 0.95 }) :
        bridge.selectionStep(y, v, null, { maxIter: 140, tol: 1e-6, level: 0.95 });

      const seAdj = positiveOr(fit.se_robust, positiveOr(fit.se_adjusted, 1e-12));
      const unadjDen = Math.max(1e-12, Math.abs(fit.theta_unadjusted));
      const changePct = 100 * (fit.theta_unadjusted - fit.theta_adjusted) / unadjDen;

      const unadjusted = {
        theta: fit.theta_unadjusted,
        se: fit.se_unadjusted,
        ci_lower: fit.theta_unadjusted - 1.96 * fit.se_unadjusted,
        ci_upper: fit.theta_unadjusted + 1.96 * fit.se_unadjusted
      };

      const adjusted = {
        theta: fit.theta_adjusted,
        se: seAdj,
        se_model: fit.se_adjusted,
        se_robust: fit.se_robust,
        ci_lower: fit.ci_lower,
        ci_upper: fit.ci_upper
      };

      const selectionWeights = buildStepWeightObjects(fit.weights_step);

      return {
        type: mode,
        unadjusted: unadjusted,
        adjusted: adjusted,
        selectionWeights: selectionWeights,
        selectionRatio: fit.selection_ratio,
        selectionDetected: fit.selection_ratio > 2,
        changePct: changePct,
        interpretation: Math.abs(fit.theta_adjusted) < Math.abs(fit.theta_unadjusted) ?
          'Selection model suggests publication bias inflated the effect' :
          'Selection model suggests limited publication bias',
        fit: {
          tau2: fit.tau2,
          logLik: fit.logLik,
          converged: fit.converged,
          iterations: fit.iterations
        }
      };
    });
  };

  window.stepSelectionCRVE = function (yi, vi, clusterIds, pCuts) {
    return withFallback('stepSelectionCRVE', arguments, function () {
      if (!bridgeReady()) {
        throw new Error('WASM bridge not ready.');
      }

      const bridge = window.TruthCertWasmBridge;
      const y = toNumericArray(yi, 'yi');
      const v = toNumericArray(vi, 'vi');
      if (y.length !== v.length || y.length < 3) {
        throw new Error('yi/vi must have same length and at least 3 rows.');
      }

      const clusters = Array.isArray(clusterIds) && clusterIds.length === y.length ? clusterIds :
        y.map(function (_, idx) { return idx + 1; });

      const fit = bridge.selectionStep(y, v, clusters, { maxIter: 160, tol: 1e-6, level: 0.95 });
      const nClusters = new Set(clusters.map(function (id) { return String(id); })).size;

      const targetCuts = Array.isArray(pCuts) && pCuts.length === 4 ? pCuts.map(Number) : STEP_BREAKS.slice();
      const intervals = [];
      for (let i = 0; i < 4; i += 1) {
        intervals.push({
          lower: i === 0 ? 0 : targetCuts[i - 1],
          upper: targetCuts[i],
          count: 0,
          studies: []
        });
      }

      for (let i = 0; i < y.length; i += 1) {
        const p = twoSidedP(y[i], v[i]);
        for (let b = 0; b < intervals.length; b += 1) {
          if (p > intervals[b].lower && p <= intervals[b].upper) {
            intervals[b].count += 1;
            intervals[b].studies.push(i);
            break;
          }
        }
      }

      const wiNaive = v.map(function (value) {
        return 1 / positiveOr(value, 1e-12);
      });
      const sumW = wiNaive.reduce(function (acc, value) { return acc + value; }, 0);
      const thetaNaive = y.reduce(function (acc, yiValue, idx) {
        return acc + wiNaive[idx] * yiValue;
      }, 0) / Math.max(1e-12, sumW);

      const seRobust = positiveOr(fit.se_robust, positiveOr(fit.se_adjusted, 1e-12));
      const df = Math.max(1, nClusters - 1);
      const tCrit = tQuantile(0.975, df);

      return {
        ok: true,
        thetaAdjusted: fit.theta_adjusted,
        seAdjusted: fit.se_adjusted,
        seRobust: seRobust,
        df: df,
        ciLower: fit.theta_adjusted - tCrit * seRobust,
        ciUpper: fit.theta_adjusted + tCrit * seRobust,
        thetaNaive: thetaNaive,
        weights: fit.weights_step.slice(),
        intervals: intervals,
        selectionRatio: fit.selection_ratio,
        selectionDetected: fit.selection_ratio > 2,
        interpretation: fit.selection_ratio > 2 ?
          'Evidence of p-value dependent selection' :
          'No strong evidence of selection bias',
        converged: fit.converged,
        logLik: fit.logLik
      };
    });
  };

  window.fitSelectionModelRoBMA = function (yi, vi, sei) {
    return withFallback('fitSelectionModelRoBMA', arguments, function () {
      if (!bridgeReady()) {
        throw new Error('WASM bridge not ready.');
      }

      const bridge = window.TruthCertWasmBridge;
      const y = toNumericArray(yi, 'yi');
      const v = toNumericArray(vi, 'vi');
      if (y.length !== v.length || y.length < 3) {
        throw new Error('yi/vi must have same length and at least 3 rows.');
      }

      const fit = bridge.selectionBeta(y, v, null, { maxIter: 180, tol: 1e-6, level: 0.95 });
      const se = positiveOr(fit.se_robust, positiveOr(fit.se_adjusted, 1e-12));
      const n = Math.max(2, y.length);
      const nParams = 4;
      const bic = -2 * fit.logLik + nParams * Math.log(n);

      return {
        theta: fit.theta_adjusted,
        se: se,
        ll: fit.logLik,
        bic: bic,
        tau2: fit.tau2,
        selectionRatio: fit.selection_ratio,
        converged: fit.converged,
        iterations: fit.iterations
      };
    });
  };
})();
