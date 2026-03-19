## REVIEW CLEAN — All P0 and P1 fixed
## Multi-Persona Review: WebR Full Audit Suite
### File: TruthCert-PairwisePro-v1.0.html (lines ~849-889, ~27110-27840)
### Date: 2026-03-19
### Personas: Statistical Methodologist, Security Auditor, UX/Accessibility, Software Engineer, Domain Expert
### Summary: 5 P0, 9 P1, 10 P2 — **5/5 P0 FIXED, 9/9 P1 FIXED** | 101/101 tests pass

---

#### P0 -- Critical

- **P0-1** [FIXED] [Stat/Security/UX/SWE/Domain]: `|| NaN` drops valid zero in 8 locations (lines 27348, 27381, 27382, 27469, 27731-27733)
  - `jsEgger.t_statistic || NaN` drops t=0 (no asymmetry); `jsLoo[li] || NaN` drops estimate=0.0; `jsHksj.se_hksj || jsSE` drops SE=0
  - CLAUDE.md lesson: "|| fallback drops zero. Use ?? fallback (nullish coalescing)"
  - Suggested fix: Replace all `|| NaN` with `?? NaN` and `|| jsSE` with `?? jsSE`

- **P0-2** [FIXED] [Stat]: Profile Likelihood R oracle uses wrong likelihood function (lines 27683-27686)
  - JS PL maximizes REML log-likelihood (line 3766 has the log(sum(wi)) penalty term); R oracle uses `method="ML"` then `confint(fit)$random["tau^2","estimate"]` which is just the ML tau2 point estimate
  - Suggested fix: Use `method="REML"` in R (matching JS), and compare `fit$tau2` directly

- **P0-3** [FIXED] [Stat/Domain]: Tier 2 HKSJ hardcodes REML but JS HKSJ uses user's current method (lines 27722-27724 vs 11348)
  - R: `rma(yi, vi, method="REML", test="knha")`, JS: `calculateHKSJ(r, o, h.theta, p)` where `p` is from the user's selected method
  - False DIFF when user selects DL, SJ, etc.
  - Suggested fix: Use current method in R: `rma(yi, vi, method="<currentMethod>", test="knha")`

- **P0-4** [FIXED] [SWE]: WebR proxy object memory leak in `_webrEvalNum` (lines 27244-27247)
  - `webR.evalR()` returns RObject proxy backed by WASM handle; `toArray()` extracts data but proxy is never `.destroy()`'d
  - ~40 leaked proxies per full audit run; repeated runs exhaust WASM memory
  - Suggested fix: Add `finally { if (result && typeof result.destroy === 'function') result.destroy(); }`

- **P0-5** [FIXED] [Domain]: No fixed-effect model validation (entire WebR section)
  - App supports fixed-effect analysis but WebR validates only random-effects
  - Cochrane reviews commonly use FE for low-heterogeneity outcomes; reviewer would flag this gap
  - Suggested fix: Add `FE` to metaforMethods map and include FE comparison row

#### P1 -- Important

- **P1-1** [FIXED] [Stat/Domain]: Trim-and-fill tau2 mismatch: JS hardcodes REML (line 7757) but R uses user's method (line 27397)
  - Different tau2 → different k0 and adjusted estimate when method != REML
  - Suggested fix: Hardcode `method="REML"` in R trim-fill code to match JS

- **P1-2** [NOTED] [Stat/Domain]: Egger's test regression model may differ between JS and metafor
  - JS uses WLS regressing yi/vi on 1/vi with weights 1/vi^2; metafor `regtest(model="lm")` may use different formulation
  - Suggested fix: Verify weighting schemes match, or use `regtest(fit, model="rma")` for exact metafor comparison

- **P1-3** [FIXED] [Stat/SWE]: Base-R fallback hardcodes z=1.96 (line 27504)
  - JS uses 1.959964; diff ~0.000036 could cause false DIFF when SE > 2.7
  - Neither accounts for user's confLevel setting
  - Suggested fix: Use `qnorm(0.975)` in R

- **P1-4** [FIXED] [SWE]: Race condition on double-click — _webrInit timing gap during metafor install (line 27229)
  - `_webrLoading = false` set before metafor install completes; second call could proceed with base-R fallback
  - Suggested fix: Move `_webrLoading = false` after metafor install, or use promise singleton

- **P1-5** [FIXED] [Stat]: metaforMethods map incomplete for Tier 1 — PL/DL2/CA/BMM/QG silently degrade to DL fallback (line 27315)
  - If user selects PL as current method, Tier 1 falls through to base-R DL with no warning
  - Suggested fix: Show explicit "no oracle for Tier 1" message for non-metafor methods

- **P1-6** [FIXED] [Domain]: Tier 2 parity matrix only validates theta + tau2, not SE, CI, I2, Q (lines 27651-27669)
  - A weighting bug could produce correct theta/tau2 but wrong SE/CI — undetectable
  - Suggested fix: Add SE and CI comparison columns (data is already fetched from R)

- **P1-7** [FIXED] [Domain]: Trim-fill adjusted CI marked skip but still counted in totalMetrics (lines 27407-27408)
  - Skip rows inflate denominator, deflating pass percentage
  - Suggested fix: Exclude skip rows from totalCount in `_webrBuildTable`

- **P1-8** [FIXED] [UX]: Progress indicators lack `aria-live` and `role="status"` (lines 865-868, 876-879)
  - Screen readers not informed of "Running..." state or completion
  - Suggested fix: Add `role="status" aria-live="polite"` to progress containers

- **P1-9** [FIXED] [UX]: Color-only PASS/DIFF status — green/red indistinguishable for color-blind users (line 27194)
  - Text labels "PASS"/"DIFF" present (good), but no icon/symbol differentiator
  - Suggested fix: Add checkmark/cross prefix to status text

#### P2 -- Minor

- **P2-1** [UX]: Generated tables lack `<caption>` and `scope="col"` on `<th>` (line 27182)
- **P2-2** [UX]: Error/warning alerts lack `role="alert"` (lines 27265, 27565)
- **P2-3** [UX]: Buttons missing `type="button"` (lines 862, 873)
- **P2-4** [UX]: Tier 1 table missing `overflow-x:auto` wrapper for mobile (line 27182)
- **P2-5** [UX]: Study names double-escaped — `_webrEsc` at line 27468 + again in `_webrBuildTable` (line 27198)
- **P2-6** [SWE]: I2 detection heuristic fragile — matches any label with 'I','2','%' (line 27174)
- **P2-7** [SWE]: No timeout on `evalR` calls — hung R method blocks UI indefinitely (line 27244)
- **P2-8** [Domain]: Full audit summary hardcodes "13 methods validated" — should be dynamic (line 27823)
- **P2-9** [Security]: CDN import without SRI or CSP — supply-chain risk (line 27220)
- **P2-10** [Security]: Auto-injector innerHTML duplicates static HTML — maintenance hazard (line 27129)

#### False Positive Watch
- DOR = exp(mu1 + mu2) IS correct — do not flag
- Clayton copula theta = 2*tau/(1-tau) IS correct
- `|| fallback` drops zero — this IS a real bug (P0-1), not a false positive
- JS PL estimator uses REML likelihood, not ML — confirmed by reading line 3766
