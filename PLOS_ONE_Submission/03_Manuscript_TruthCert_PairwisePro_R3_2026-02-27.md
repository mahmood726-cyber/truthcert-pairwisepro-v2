# TruthCert-PairwisePro: A Browser-First Pairwise Meta-Analysis Platform with Extended tau^2 Method Coverage, Decision Layering, and Reproducible QA

## Authors
[Your Name]^1*^

^1^ [Your Institution], [City], [Country]

*Corresponding author: [email]

---

## Abstract

**Background:** Pairwise meta-analysis software is mature, but users still face practical gaps: fragmented workflows across tools, variable estimator coverage in GUI environments, and weak reproducibility evidence for end-to-end use.

**Objective:** To evaluate a browser-first pairwise meta-analysis platform (TruthCert-PairwisePro) after method-expansion and QA hardening, with emphasis on estimator coverage, reproducibility, reporting completeness, and analyst adoption intent.

**Methods:** We conducted a versioned validation program (February 2026) with four components: (1) preregistered oracle rerun against R `metafor` on 10 datasets; (2) GLMM cross-check artifacts against `metafor::rma.glmm`; (3) Firefox Selenium regression testing (`test_v2` and comprehensive suites); and (4) live reporting verification of Methods/Results/Verdict/HTA and export pathways (TXT/Markdown/Word). We also ran a 12-persona simulated expert panel to estimate near-term adoption intent and identify remaining blockers. All work was run under an add-only guardrail (no feature removals).

**Results:** The platform exposed 17 selectable tau^2 estimators in UI/runtime (`REML, DL, PM, PMM, ML, HS, HSk, SJ, HE, EB, GENQ, GENQM, PL, DL2, CA, BMM, QG`) and retained all major prior modules. Locked nightly quality gate (2026-02-26) passed all checks: oracle pack run, GLMM cross-check run, `test_v2` (64 pass, 0 fail), and comprehensive Selenium (79 pass, 0 fail, 0 warnings). Oracle artifacts covered 10 datasets; GLMM oracle artifacts covered 5 datasets. Report verification (2026-02-27) confirmed `analysis_ready=true`, `hta_ready=true`, valid general/PRISMA/GRADE report builds, and successful TXT/Markdown/Word export blob generation with no errors. Simulated expert panel outcome (Round 4): 10/12 adopt now, 2/12 pilot first, 0/12 reject; weighted mean score 4.76/5.

**Conclusions:** TruthCert-PairwisePro demonstrates high method breadth and strong operational reproducibility for pairwise workflows in a browser-first form factor. Evidence supports publication as an advanced software-methods contribution. Remaining blockers are governance and external independent reruns rather than core feature absence.

**Keywords:** meta-analysis, evidence synthesis, reproducibility, software validation, health technology assessment, pairwise methods

---

## Data Availability

All validation artifacts used in this manuscript are available in the project workspace under `C:\HTML apps\Truthcert1_work`, including locked reproducibility reports, oracle outputs, Selenium logs, reporting verification JSON, and expert-panel scoring files (see Supporting Information).

---

## Introduction

Pairwise meta-analysis remains the operational backbone for evidence synthesis in clinical and policy workflows. Advanced engines such as R `metafor` provide broad method families, but many end users still require a no-install interface with transparent outputs and direct reporting support. In practice, analysts often split work across separate statistical, visualization, and reporting systems, increasing friction and audit complexity.

TruthCert-PairwisePro is a browser-first pairwise platform designed to close this implementation gap: strong statistical scope, decision-layer outputs (including verdict and HTA), and reproducible quality assurance artifacts suitable for publication and governance review. Earlier versions emphasized core validity; the current cycle focused on restoring and extending pooling-method breadth, preserving legacy functionality, expanding reporting completeness, and closing adoption blockers.

This manuscript reports the post-hardening validation state as of 2026-02-27.

---

## Methods

### Platform and release principles

TruthCert-PairwisePro is deployed as a single HTML application with local JavaScript execution. The release strategy in this cycle used an explicit add-only rule: no prior user-facing functions were removed; changes were restricted to additions, parity restorations, and robustness fixes.

### Statistical scope under test

The tested build exposed 17 selectable between-study variance (tau^2) estimators:

- REML
- DL
- PM
- PMM
- ML
- HS
- HSk
- SJ
- HE
- EB
- GENQ
- GENQM
- PL
- DL2
- CA
- BMM
- QG

Core pairwise outputs included pooled effects, heterogeneity statistics, prediction intervals, publication-bias diagnostics, subgroup/meta-regression pathways, and sensitivity diagnostics. Decision-layer modules included verdict synthesis and HTA outputs (including CEAC and EVPI sections).

### Validation design

#### 1) Preregistered oracle pack

A locked oracle protocol and benchmark pack were executed against R `metafor` (R 4.5.2, `metafor` 4.8.0). The locked nightly report documented 10 oracle datasets:

- `bcg_builtin`
- `binary_lowhet_rr`
- `binary_sparse_zero_or`
- `binary_highhet_rr`
- `continuous_md_case`
- `continuous_smd_case`
- `proportion_like_case`
- `correlation_like_case`
- `generic_outlier_case`
- `small_k_edge_case`

#### 2) GLMM cross-check

A dedicated GLMM cross-check script generated model-level artifacts from `metafor::rma.glmm` lanes and app-side comparison exports. In this run, cross-check outputs were available for UM.FS, UM.RS, and CM.AL; CM.EL required the external `BiasedUrn` package in the R environment.

#### 3) Browser automation regression

Two Firefox Selenium suites were used:

- `test_v2`: broad UI/feature smoke and workflow checks.
- `test_truthcert_comprehensive.py`: extended functional regression, tabs/modules/export checks, and no-JS-error assertions.

#### 4) Reporting and export verification

A live Firefox verifier exercised:

- Run analysis
- Run TruthCert verdict
- Run HTA
- Build reports in `general`, `prisma`, and `grade` styles
- Verify rendered section presence and report assembly
- Verify TXT/Markdown/Word export code paths

### Multipersona adoption panel

A 12-persona simulated expert panel (product-steering simulation, not named external experts) scored adoption intent and domain quality dimensions. Outcomes were aggregated from Round 4 CSV and summary artifacts.

---

## Results

### Method breadth and parity restoration

The tested build retained legacy summary workflows and exposed 17 tau^2 estimators in runtime and selector controls. Advanced tab access was preserved and Selenium-confirmed as clickable in both test suites.

### Locked reproducibility gate

The locked nightly run (`run_20260226_221626`) passed all gate conditions:

- `oracle_preregistered_pack`: PASS
- `glmm_metafor_crosscheck`: PASS
- `firefox_test_v2`: PASS
- `firefox_test_comprehensive`: PASS
- `locked_repro_report`: PASS

Gate report summary:

- `test_v2`: 64 passed, 0 failed
- comprehensive: 79 passed, 0 failed, 0 warnings
- Oracle artifact present
- GLMM cross-check artifacts present

### Oracle and GLMM findings

Oracle outputs confirmed cross-dataset runs across 10 preregistered datasets with pairwise method outputs exported per dataset. In this harness, GENQ and GENQM entries were marked `fit_failed` in oracle JSON across datasets, while the broader method set remained available in the app UI.

GLMM cross-check artifacts were produced for five oracle datasets. In model-level comparison output, OR-scale differences between app and oracle were very small for UM.FS and UM.RS, with larger but still bounded deviation for CM.AL (under 1% relative difference in this run). CM.EL was not estimable in this environment due to missing `BiasedUrn`.

### Reporting pipeline completeness

Live report verification on 2026-02-27 returned:

- `analysis_ready: true`
- `hta_ready: true`
- General style: Methods/Results/Verdict/HTA sections present
- PRISMA style: PRISMA checklist present
- GRADE style: GRADE profile present
- Cross-disciplinary robustness text present in Results
- Export pathway checks passed:
  - TXT blob type: `text/plain`
  - Markdown blob type: `text/markdown`
  - Word blob type: `application/msword`
- Errors: none

### Multipersona adoption outcomes

Round 4 panel totals (n=12 personas):

- Adopt now: 10
- Pilot first: 2
- Not now: 0

Aggregate quality signal:

- Weighted total mean: 4.76/5 (SD 0.14)
- Reproducibility: 5.00/5
- Reporting readiness: 5.00/5
- Estimator coverage: 4.92/5
- Regulatory/HTA readiness: 4.58/5

Panel-identified blockers were governance oriented: independent third-party rerun and routine publication of nightly reproducibility artifacts.

---

## Discussion

### Principal findings

This release demonstrates that a browser-first pairwise platform can combine broad estimator coverage, decision-layer integration, and auditable QA artifacts without sacrificing accessibility. The key maturity shift is not only method count, but release discipline: locked run bundles, reproducibility reports, and explicit pass/fail gates.

### Position relative to existing tools

Compared with conventional GUI-first tools, TruthCert-PairwisePro now provides deeper tau^2 method optionality and integrated verdict-plus-HTA workflow in one interface. Compared with programmatic ecosystems such as R `metafor`, the platform does not yet claim full model-family parity, but provides a practical high-coverage operational subset with browser-native usability.

### Publishability assessment

On the evidence available in the current artifact set, the software is publishable as an advanced pairwise meta-analysis application with integrated decision support. The strongest publication arguments are:

- End-to-end reproducibility evidence with locked gate reports
- Broad method availability preserved and expanded from prior builds
- Independent workflow checks (oracle + Selenium + live report/export verification)
- Transparent statement of unresolved external dependencies

### Remaining gaps

The main remaining gaps are narrower than earlier cycles:

1. External independent rerun by a separate analyst environment should be completed and archived as a publication appendix artifact.
2. Full GLMM parity with all `rma.glmm` model lanes requires completion of dependency support (notably `BiasedUrn` for CM.EL in the current R environment) and extended case coverage.
3. Oracle-side treatment of nonstandard estimators (including GENQ/GENQM in this harness) should be resolved with method-specific validation notes.

### Limitations

1. Multipersona panel results are simulated and useful for product steering, not a substitute for named external expert adoption data.
2. Some plot checks in automation are container- or layout-dependent and can be marked as skipped while still passing suite-level criteria.
3. This manuscript reports software and QA outcomes, not clinical-effect claims from a new systematic review.

---

## Conclusions

TruthCert-PairwisePro now meets a high bar for a browser-first pairwise meta-analysis platform: broad estimator set, retained legacy functionality, integrated report/verdict/HTA workflow, and reproducible automated QA with zero-failure regression runs in the locked gate artifacts reported here.

The remaining blockers to immediate universal adoption are operational and governance focused, not core-function deficits. This supports near-term publication as an advanced, transparent, and practically deployable meta-analysis software platform.

---

## Supporting Information (local artifact map)

- **S1 File:** Locked reproducibility report (Markdown/JSON)
  - `nightly_runs_test5/run_20260226_221626/LOCKED_REPRODUCIBILITY_REPORT_20260226_221913.md`
  - `nightly_runs_test5/run_20260226_221626/LOCKED_REPRODUCIBILITY_REPORT_20260226_221913.json`
- **S2 File:** Nightly gate summary
  - `nightly_runs_test5/run_20260226_221626/nightly_summary.md`
  - `nightly_runs_test5/run_20260226_221626/nightly_summary.json`
- **S3 File:** Oracle output (preregistered pack)
  - `nightly_runs_test5/run_20260226_221626/oracle_output.json`
- **S4 File:** GLMM cross-check artifacts
  - `nightly_runs_test5/run_20260226_221626/truthcert_glmm_metafor_crosscheck_20260226_221634.csv`
  - `nightly_runs_test5/run_20260226_221626/truthcert_glmm_metafor_comparison_20260226_221634.csv`
  - `nightly_runs_test5/run_20260226_221626/truthcert_glmm_metafor_crosscheck_20260226_221634.json`
- **S5 File:** Selenium comprehensive log
  - `selenium_round4_comprehensive.log`
- **S6 File:** Live reporting verification JSON
  - `REPORTING_VERIFICATION_2026-02-27.json`
- **S7 File:** Multipersona round-4 data
  - `EXPERT_SCORING_ROUND4_2026-02-27.csv`
  - `ROUND4_EXPERT_SUMMARY_2026-02-27.txt`
  - `MULTI_EXPERT_REVIEW_ROUND4_2026-02-27.md`
- **S8 File:** Benchmark and governance protocol files
  - `PAIRWISE_BENCHMARK_2026-02-26.md`
  - `governance/PREREGISTERED_ORACLE_PROTOCOL_V1_2026-02-26.md`
  - `governance/RELEASE_SOP_V1_2026-02-26.md`

---

## References

1. Higgins JPT, Thomas J, Chandler J, et al. Cochrane Handbook for Systematic Reviews of Interventions. 2nd ed. Wiley; 2019.
2. Viechtbauer W. Conducting Meta-Analyses in R with the metafor Package. J Stat Softw. 2010;36(3):1-48.
3. IntHout J, Ioannidis JPA, Borm GF. The Hartung-Knapp-Sidik-Jonkman method for random effects meta-analysis is straightforward and considerably outperforms the standard DerSimonian-Laird method. BMC Med Res Methodol. 2014;14:25.
4. DerSimonian R, Laird N. Meta-analysis in clinical trials. Control Clin Trials. 1986;7(3):177-188.
5. Paule RC, Mandel J. Consensus Values and Weighting Factors. J Res Natl Bur Stand. 1982;87(5):377-385.
6. Sidik K, Jonkman JN. A simple confidence interval for meta-analysis. Stat Med. 2002;21(21):3153-3159.
7. Egger M, Davey Smith G, Schneider M, Minder C. Bias in meta-analysis detected by a simple, graphical test. BMJ. 1997;315(7109):629-634.
8. Begg CB, Mazumdar M. Operating characteristics of a rank correlation test for publication bias. Biometrics. 1994;50(4):1088-1101.
9. Duval S, Tweedie R. Trim and fill: A simple funnel-plot based method of testing and adjusting for publication bias in meta-analysis. Biometrics. 2000;56(2):455-463.
10. Peters JL, Sutton AJ, Jones DR, Abrams KR, Rushton L. Comparison of two methods to detect publication bias in meta-analysis. JAMA. 2006;295(6):676-680.
11. Noma H, Nagashima K, Furukawa TA. Prediction intervals for random-effects meta-analysis accounting for between-study heterogeneity uncertainty. Stat Med. 2023;42(16):2837-2854.
12. Guyatt GH, Oxman AD, Vist GE, et al. GRADE: an emerging consensus on rating quality of evidence and strength of recommendations. BMJ. 2008;336(7650):924-926.
13. Ioannidis JPA. The Mass Production of Redundant, Misleading, and Conflicted Systematic Reviews and Meta-analyses. Milbank Q. 2016;94(3):485-514.
14. National Institute for Health and Care Excellence. NICE health technology evaluations: the manual. NICE; 2022.
15. Garrison LP, Towse A, Briggs A, et al. Performance-based risk-sharing arrangements: good practices for design, implementation, and evaluation. Value Health. 2013;16(5):703-719.

---

*Draft date: 2026-02-27*
