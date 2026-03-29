(function () {
  'use strict';

  if (typeof window === 'undefined') {
    return;
  }
  if (window.TruthCertWasmBridge && window.TruthCertWasmBridge.version >= 1) {
    return;
  }

  function finiteOr(value, fallback) {
    return Number.isFinite(value) ? value : fallback;
  }

  function positiveOr(value, fallback) {
    const num = Number(value);
    return Number.isFinite(num) && num > 0 ? num : fallback;
  }

  function normalizeNumberArray(input, name) {
    if (!Array.isArray(input)) {
      throw new Error(name + ' must be an array.');
    }
    const out = new Float64Array(input.length);
    for (let i = 0; i < input.length; i += 1) {
      const v = Number(input[i]);
      if (!Number.isFinite(v)) {
        throw new Error(name + '[' + i + '] is not finite.');
      }
      out[i] = v;
    }
    return out;
  }

  function normalizeClusterIds(cluster, n) {
    if (!Array.isArray(cluster) || cluster.length !== n) {
      return null;
    }
    const map = new Map();
    const out = new Uint32Array(n);
    let next = 1;
    for (let i = 0; i < n; i += 1) {
      const raw = cluster[i];
      const key = raw === null || raw === undefined ? '__missing__' : String(raw);
      if (!map.has(key)) {
        map.set(key, next);
        next += 1;
      }
      out[i] = map.get(key);
    }
    return out;
  }

  function detectWasmUrl() {
    if (typeof document !== 'undefined' && document.currentScript && document.currentScript.src) {
      return new URL('advanced_engine.wasm', document.currentScript.src).toString();
    }
    return 'wasm/advanced_engine.wasm';
  }

  function isFileProtocol() {
    return typeof window !== 'undefined' &&
      window.location &&
      String(window.location.protocol || '').toLowerCase() === 'file:';
  }

  async function fetchArrayBuffer(url) {
    if (typeof fetch === 'function') {
      try {
        const response = await fetch(url);
        if (response && response.ok) {
          return response.arrayBuffer();
        }
      } catch (_) {
        // Ignore and fall back.
      }
    }

    return new Promise((resolve, reject) => {
      if (typeof XMLHttpRequest === 'undefined') {
        reject(new Error('No fetch/XMLHttpRequest available to load WASM.'));
        return;
      }
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.responseType = 'arraybuffer';
      xhr.onload = function () {
        const status = xhr.status;
        if ((status >= 200 && status < 300) || status === 0) {
          resolve(xhr.response);
        } else {
          reject(new Error('Failed to load WASM (' + status + ').'));
        }
      };
      xhr.onerror = function () {
        reject(new Error('Network error while loading WASM.'));
      };
      xhr.send();
    });
  }

  const bridge = {
    version: 1,
    status: 'loading',
    wasmUrl: detectWasmUrl(),
    exports: null,
    memory: null,
    error: null,
    ready: null,
    isReady: function () {
      return this.status === 'ready' && !!this.exports;
    },
    getStatus: function () {
      return {
        status: this.status,
        wasmUrl: this.wasmUrl,
        error: this.error ? this.error.message : null
      };
    }
  };

  function ensureReady() {
    if (!bridge.exports || !bridge.memory) {
      throw new Error('WASM engine is not ready.');
    }
  }

  function allocF64(values) {
    const len = values.length;
    const ptr = bridge.exports.alloc_f64(len);
    if (len > 0 && !ptr) {
      throw new Error('alloc_f64 failed.');
    }
    if (len > 0) {
      const view = new Float64Array(bridge.memory.buffer, ptr, len);
      view.set(values);
    }
    return { ptr: ptr, len: len };
  }

  function allocU32(values) {
    const len = values.length;
    const ptr = bridge.exports.alloc_u32(len);
    if (len > 0 && !ptr) {
      throw new Error('alloc_u32 failed.');
    }
    if (len > 0) {
      const view = new Uint32Array(bridge.memory.buffer, ptr, len);
      view.set(values);
    }
    return { ptr: ptr, len: len };
  }

  function allocOutF64(len) {
    const ptr = bridge.exports.alloc_f64(len);
    if (len > 0 && !ptr) {
      throw new Error('alloc_f64(out) failed.');
    }
    return { ptr: ptr, len: len };
  }

  function readOutF64(ptr, len) {
    if (len <= 0) {
      return [];
    }
    return Array.from(new Float64Array(bridge.memory.buffer, ptr, len));
  }

  function freeF64(block) {
    if (block && block.ptr) {
      bridge.exports.free_f64(block.ptr, block.len);
    }
  }

  function freeU32(block) {
    if (block && block.ptr) {
      bridge.exports.free_u32(block.ptr, block.len);
    }
  }

  function runMultilevel(yi, vi, cluster, options) {
    ensureReady();

    const y = normalizeNumberArray(yi, 'yi');
    const v = normalizeNumberArray(vi, 'vi');
    if (y.length !== v.length || y.length < 2) {
      throw new Error('yi/vi must have same length and at least 2 rows.');
    }

    const c = normalizeClusterIds(cluster, y.length);
    if (!c) {
      throw new Error('cluster_ids are required and must match yi length.');
    }

    const maxIter = Math.max(10, Math.floor(finiteOr(options && options.maxIter, 120)));
    const tol = positiveOr(options && options.tol, 1e-6);
    const level = Math.min(0.999, Math.max(0.5, finiteOr(options && options.level, 0.95)));

    const yPtr = allocF64(y);
    const vPtr = allocF64(v);
    const cPtr = allocU32(c);
    const outPtr = allocOutF64(14);

    try {
      const status = bridge.exports.tc_multilevel_reml(
        yPtr.ptr,
        vPtr.ptr,
        cPtr.ptr,
        y.length,
        maxIter,
        tol,
        level,
        outPtr.ptr
      );
      if (status !== 0) {
        throw new Error('tc_multilevel_reml failed (' + status + ').');
      }
      const out = readOutF64(outPtr.ptr, outPtr.len);
      return {
        theta: out[0],
        se_model: out[1],
        se_robust: out[2],
        ci_lower: out[3],
        ci_upper: out[4],
        tau2_within: out[5],
        tau2_between: out[6],
        tau2_total: out[7],
        df: out[8],
        icc_within: out[9],
        icc_between: out[10],
        converged: out[11] >= 0.5,
        iterations: Math.round(out[12]),
        logLik: out[13]
      };
    } finally {
      freeF64(outPtr);
      freeU32(cPtr);
      freeF64(vPtr);
      freeF64(yPtr);
    }
  }

  function runSelectionCore(mode, yi, vi, cluster, options) {
    ensureReady();

    const y = normalizeNumberArray(yi, 'yi');
    const v = normalizeNumberArray(vi, 'vi');
    if (y.length !== v.length || y.length < 3) {
      throw new Error('yi/vi must have same length and at least 3 rows.');
    }

    const c = normalizeClusterIds(cluster, y.length);
    const maxIter = Math.max(40, Math.floor(finiteOr(options && options.maxIter, 120)));
    const tol = positiveOr(options && options.tol, 1e-6);
    const level = Math.min(0.999, Math.max(0.5, finiteOr(options && options.level, 0.95)));

    const yPtr = allocF64(y);
    const vPtr = allocF64(v);
    const cPtr = c ? allocU32(c) : null;
    const outPtr = allocOutF64(16);

    try {
      const fn = mode === 'beta' ? bridge.exports.tc_selection_beta : bridge.exports.tc_selection_step;
      const status = fn(
        yPtr.ptr,
        vPtr.ptr,
        cPtr ? cPtr.ptr : 0,
        y.length,
        maxIter,
        tol,
        level,
        outPtr.ptr
      );
      if (status !== 0) {
        throw new Error('tc_selection_' + mode + ' failed (' + status + ').');
      }

      const out = readOutF64(outPtr.ptr, outPtr.len);
      return {
        theta_adjusted: out[0],
        se_adjusted: out[1],
        se_robust: out[2],
        ci_lower: out[3],
        ci_upper: out[4],
        tau2: out[5],
        logLik: out[6],
        weights_step: [out[7], out[8], out[9], out[10]],
        selection_ratio: out[11],
        converged: out[12] >= 0.5,
        iterations: Math.round(out[13]),
        theta_unadjusted: out[14],
        se_unadjusted: out[15]
      };
    } finally {
      freeF64(outPtr);
      if (cPtr) {
        freeU32(cPtr);
      }
      freeF64(vPtr);
      freeF64(yPtr);
    }
  }

  bridge.multilevelReml = function (yi, vi, cluster, options) {
    return runMultilevel(yi, vi, cluster, options || {});
  };

  bridge.selectionStep = function (yi, vi, cluster, options) {
    return runSelectionCore('step', yi, vi, cluster, options || {});
  };

  bridge.selectionBeta = function (yi, vi, cluster, options) {
    return runSelectionCore('beta', yi, vi, cluster, options || {});
  };

  bridge.ready = (async function initialize() {
    try {
      if (isFileProtocol()) {
        bridge.status = 'disabled';
        bridge.error = new Error('WASM engine disabled for file:// mode. Serve over HTTP to enable WASM acceleration.');
        return bridge;
      }

      const bytes = await fetchArrayBuffer(bridge.wasmUrl);
      const instantiated = await WebAssembly.instantiate(bytes, {});
      const exports = instantiated && instantiated.instance ? instantiated.instance.exports : null;
      if (!exports || !exports.memory) {
        throw new Error('WASM exports are missing required symbols.');
      }
      bridge.exports = exports;
      bridge.memory = exports.memory;
      bridge.status = 'ready';
      return bridge;
    } catch (err) {
      bridge.status = 'error';
      bridge.error = err instanceof Error ? err : new Error(String(err));
      throw bridge.error;
    }
  })();

  // Avoid unhandled promise noise while still exposing error in bridge status.
  bridge.ready.catch(function () {
    return null;
  });

  window.TruthCertWasmBridge = bridge;
})();
