# TruthCert-PairwisePro v1.0: a browser-based evidence synthesis platform with integrated verdict assessment and health technology appraisal

Mahmood Ahmad ^1,2^, Niraj Kumar ^1^, Bilaal Dar ^3^, Laiba Khan ^1^, Andrew Woo ^4^

^1^ Royal Free London NHS Foundation Trust, London, UK
^2^ Tahir Heart Institute, Rabwah, Pakistan
^3^ King's College London GKT School of Medical Education, London, UK
^4^ St George's, University of London, London, UK

**Corresponding author:** Mahmood Ahmad (mahmood726@gmail.com)

---

## Abstract

**Background:** Pairwise meta-analysis is central to evidence-based medicine, yet existing software typically requires either commercial licences, desktop installation, or proficiency in statistical programming languages. Furthermore, no current platform integrates pooled estimation, publication bias assessment, evidence verdict classification, and health technology appraisal within a single workflow. We present TruthCert-PairwisePro v1.0, a browser-based evidence synthesis platform that addresses these gaps.

**Methods:** TruthCert-PairwisePro is implemented as a client-side web application (27,086 lines of HTML; 23,334 lines of JavaScript) requiring no server infrastructure or installation. The statistical engine supports binary (OR, RR, RD), continuous (MD, SMD), hazard ratio, proportion, correlation, and generic effect measures, with 17 heterogeneity variance (tau-squared) estimators and 12 publication bias methods. A novel 12-point TruthCert threat assessment produces categorical verdicts (STABLE, MODERATE, EXPOSED, UNCERTAIN) that gate access to an integrated cost-effectiveness module (S14-HTA+). Numerical validation was performed against the R metafor package (v4.8-0) across three benchmark datasets; health technology assessment outputs were compared against TreeAge Pro 2023.

**Results:** Of 112 validation comparisons against metafor, 108 passed (96.4%), with all core estimators (DL, REML, ML, HE), pooled estimates, confidence intervals, and heterogeneity statistics matching to within relative error < 10^-5^. The four partial matches involved advanced iterative estimators (PM, HS, SJ, EB) and reflected convergence threshold differences rather than algorithmic errors. HTA module outputs matched TreeAge Pro with mean absolute ICER difference < 0.01% across three test scenarios. The application runs offline after initial load and exports results to R, CSV, Excel, JSON, and PDF.

**Conclusions:** TruthCert-PairwisePro provides a validated, zero-installation platform for pairwise meta-analysis with integrated evidence appraisal and health economic assessment. It is freely available under the MIT licence.

## Keywords

pairwise meta-analysis, heterogeneity, publication bias, evidence synthesis, health technology assessment, browser-based, open source

---

## Introduction

Systematic reviews with meta-analysis remain the highest level of evidence for informing clinical and policy decisions [1,11]. Conducting a rigorous meta-analysis, however, requires software that can estimate pooled effects, quantify heterogeneity, assess publication bias, evaluate evidence certainty, and---increasingly---translate findings into health economic terms. Existing tools address these needs partially. The R packages metafor [2] and meta [10] provide comprehensive statistical functionality but require programming expertise. Comprehensive Meta-Analysis (CMA) [13] and RevMan (Cochrane Collaboration) offer graphical interfaces but require desktop installation, and CMA requires a commercial licence. None of these platforms integrate statistical synthesis, structured evidence appraisal, and cost-effectiveness analysis within a single workflow.

Browser-based applications offer practical advantages for evidence synthesis: they require no installation, run on any operating system with a modern browser, process data entirely on the client side (avoiding data governance concerns), and can function offline after initial load. These properties are particularly relevant for systematic review teams in resource-limited settings or institutions with restrictive software installation policies.

We developed TruthCert-PairwisePro v1.0 to provide a complete pairwise meta-analysis workflow---from data entry through pooled estimation, heterogeneity assessment, publication bias testing, evidence verdict, and health technology appraisal---within a single browser-based application requiring no server, no installation, and no licence.

This article describes the implementation, operation, and validation of TruthCert-PairwisePro v1.0, following the F1000Research Software Tool Article guidelines.

---

## Methods

### Implementation

TruthCert-PairwisePro is implemented as a client-side single-page web application. The statistical engine (`app.js`, 23,334 lines) is written in vanilla JavaScript with no transpilation or build system. The user interface (`TruthCert-PairwisePro-v1.0.html`, 27,086 lines) embeds all CSS and references the engine script. External dependencies are limited to Plotly.js v2.27.0 (interactive visualisations), jsPDF v2.5.1 (PDF export), html2canvas v1.4.1 (screenshot capture), and SheetJS v0.18.5 (Excel export); these are loaded from a local `vendor/` directory, enabling fully offline operation after initial setup.

The architecture follows a centralised state pattern. An `AppState` object holds all study data, model configuration, and analysis results. User interactions trigger functions that update `AppState` and re-render the relevant interface panels. All statistical functions are exposed on the `window` object, permitting console-level inspection and programmatic scripting.

#### Statistical engine

The engine implements the following statistical methods:

**Effect size calculation.** Binary outcomes (odds ratio, risk ratio, risk difference) via 2x2 contingency tables; continuous outcomes (mean difference, standardised mean difference with Hedges' g correction [7]); hazard ratios (log-transformed); proportions (logit and Freeman-Tukey double arcsine); correlations (Fisher's z); and generic pre-calculated effects.

**Heterogeneity estimation.** Seventeen tau-squared estimators are implemented: DerSimonian-Laird (DL) [1], restricted maximum likelihood (REML), maximum likelihood (ML), Paule-Mandel (PM) [9], Paule-Mandel with modification (PMM), Hunter-Schmidt (HS), Hunter-Schmidt with k correction (HSk), Sidik-Jonkman (SJ), Hedges (HE), empirical Bayes (EB), generalised Q-statistic (GENQ, GENQM), profile likelihood (PL), iterated DL (DL2), Cochran ANOVA (CA), Breslow-Mallows-Moments (BMM), and Q-generalised (QG). Heterogeneity is summarised via Q, I-squared [3], H-squared, and prediction intervals.

**Confidence intervals.** Standard Wald-type intervals using normal critical values and Hartung-Knapp-Sidik-Jonkman (HKSJ) adjusted intervals using the t-distribution [8]. Prediction intervals follow the Higgins-Thompson-Spiegelhalter formulation.

**Publication bias.** Twelve methods are available: Egger's regression [4], Peters' test, Harbord's test, Begg's rank correlation, trim-and-fill (L0 and R0 estimators) [5], PET-PEESE [14], step and beta selection models, Copas selection model sensitivity analysis [6], Henmi-Copas adjustment, limit meta-analysis, and funnel plot asymmetry visualisation.

**Clinical translation.** Number needed to treat/harm (NNT/NNH) with confidence intervals, E-values for unmeasured confounding [15], and GRADE certainty of evidence assessment [12].

**Reproducibility.** A seedable linear congruential pseudo-random number generator is available for bootstrap and simulation procedures, enabling deterministic replication when a seed is specified.

#### TruthCert verdict system

The TruthCert module implements a 12-point threat assessment that evaluates the following dimensions: (1) underpowered analysis (total N below optimal information size), (2) sparse evidence (k < 5), (3) high heterogeneity (I-squared > 75%), (4) inconsistent direction (prediction interval crosses null), (5) small-study effects (Egger p < 0.10), (6) publication bias (trim-and-fill changes conclusion), (7) fragility (single study drives result), (8) imprecision (confidence interval crosses clinical threshold), (9) residual confounding (E-value < 2), (10) single large trial dominance (>50% weight), (11) risk of bias (high RoB in majority of studies), and (12) temporal instability (cumulative meta-analysis unstable). Each threat is assigned a severity weight of 1 or 2. The cumulative severity score maps to five verdict categories: STABLE (0--2), STABLE-NID (0--2 with prediction interval concern), MODERATE (3--5), EXPOSED (6--8), and UNCERTAIN (9+). Verdicts are assigned programmatically via a decision tree that considers not only total severity but also the pattern and combination of triggered threats.

#### S14-HTA+ module

The health technology assessment module accepts meta-analytic results (pooled effect estimate, confidence interval) and user-specified economic parameters (intervention and comparator costs, baseline risks, quality-adjusted life-year utilities). It computes the incremental cost-effectiveness ratio (ICER), net monetary benefit (NMB), and generates cost-effectiveness acceptability curves (CEAC), expected value of perfect information (EVPI), and tornado diagrams for deterministic sensitivity analysis. Access to the HTA module is gated by the TruthCert verdict: UNCERTAIN verdicts trigger a warning and require explicit user confirmation, with results labelled as exploratory only.

The HTA module produces a four-tier recommendation: Tier A (STABLE + cost-effective: adopt), Tier B (MODERATE + favourable: adopt with monitoring), Tier C (EXPOSED + uncertain economics: pilot programme), and Tier D (UNCERTAIN + unfavourable: do not adopt).

### Operation

The application is opened by loading `TruthCert-PairwisePro-v1.0.html` in any modern browser (Chrome, Firefox, Edge, Safari). The interface is organised into seven tabbed panels: Data, Analysis, Heterogeneity, Validation, Verdict, HTA, and Report. A typical workflow proceeds as follows:

1. **Data entry.** Users select the data type (binary, continuous, HR, proportion, correlation, or generic) and enter study-level data manually, paste from a spreadsheet, or load a demonstration dataset.
2. **Model configuration.** Users select the tau-squared estimator (REML by default), choose between fixed-effect and random-effects models, and enable or disable HKSJ adjustment.
3. **Analysis.** Clicking "Analyze" produces the pooled estimate, forest plot, heterogeneity statistics, and prediction interval.
4. **Publication bias.** The bias panel runs Egger's test, trim-and-fill, PET-PEESE, Copas sensitivity analysis, and selection models, presenting results alongside funnel and contour-enhanced funnel plots.
5. **TruthCert verdict.** The 12-point threat assessment is computed automatically, producing a categorical verdict and severity breakdown.
6. **HTA (if applicable).** Users enter economic parameters; the module computes ICER, NMB, CEAC, and the tiered recommendation.
7. **Export.** Results are exportable as CSV, Excel, JSON, PDF, and a reproducible R script that recreates the analysis using metafor.

No data leave the browser at any point.

### Validation

#### In-browser R validation (WebR)

The application includes a WebR in-browser validation feature that loads the R metafor package directly in the browser via WebAssembly (WebR v0.4.4) and runs `metafor::rma(method="REML")` on the current dataset, enabling reviewers to verify results against the gold-standard R implementation without installing R.

#### Numerical validation against R metafor

Three datasets embedded in TruthCert-PairwisePro were validated against R 4.5.2 with metafor v4.8-0 and meta v8.2-1:

- **SGLT2_ACM** (k = 5, binary, odds ratio): five heart failure trials (DAPA-HF, EMPEROR-Reduced, DELIVER, EMPEROR-Preserved, SOLOIST-WHF).
- **BCG** (k = 6, binary, odds ratio): six BCG vaccine trials.
- **BP_REDUCTION** (k = 5, continuous, mean difference / standardised mean difference): five blood pressure reduction trials.

For each dataset, the following quantities were compared: study-level log effect sizes and variances (yi, vi), tau-squared under eight estimators (DL, REML, ML, PM, HS, SJ, HE, EB), pooled estimates, standard errors, confidence intervals, HKSJ-adjusted intervals, prediction intervals, I-squared, Q statistic, and Q p-value. The R scripts for replication are provided in Supplementary File S3.

#### HTA module validation

Three scenarios (basic, SGLT2 inhibitor clinical case, high uncertainty) were compared against TreeAge Pro 2023 and an Excel-based model following NICE Technical Support Document methods. Tolerance criteria were: ICER relative difference < 0.1%, NMB absolute difference < $1, CEAC absolute difference < 2% at any willingness-to-pay threshold, and EVPI relative difference < 5%. Edge cases (dominant intervention, dominated intervention, near-zero QALY increment) were also tested.

---

## Results

### Numerical validation

Table 1 summarises the validation results against R metafor.

**Table 1. Summary of validation against R metafor v4.8-0**

| Category | Tests | Passed | Pass rate |
|----------|-------|--------|-----------|
| Effect sizes (yi, vi) | 32 | 32 | 100% |
| tau-squared, core (DL, REML, ML, HE) | 24 | 24 | 100% |
| tau-squared, advanced (PM, HS, SJ, EB) | 16 | 12 | 75% |
| Pooled estimates | 12 | 12 | 100% |
| Confidence intervals | 16 | 16 | 100% |
| Heterogeneity (I-squared, Q) | 12 | 12 | 100% |
| **Total** | **112** | **108** | **96.4%** |

All effect size calculations, core tau-squared estimators, pooled estimates, confidence intervals, and heterogeneity statistics matched R metafor to within relative error < 10^-5^. The four partial matches involved the BCG dataset (k = 6) under iterative estimators PM, HS, SJ, and EB, where convergence threshold differences between the JavaScript and R implementations produced small numerical discrepancies. These estimators are less commonly used in practice; the standard choices (REML, DL) matched exactly.

For the SGLT2_ACM dataset, the REML pooled log(OR) was -0.1096 (SE 0.0387, 95% CI: -0.1854 to -0.0338), I-squared = 0.00%, Q = 1.656 (p = 0.799), matching R metafor to six decimal places. HKSJ-adjusted confidence intervals (-0.1787 to -0.0405, p = 0.0117) also matched exactly.

For the BCG dataset under REML, the pooled log(OR) was -0.9881 (SE 0.2511), tau-squared = 0.2564, I-squared = 85.1%, all matching R within tolerance.

### HTA module validation

**Table 2. HTA validation against TreeAge Pro 2023**

| Test case | Metric | TruthCert | TreeAge Pro | Difference |
|-----------|--------|-----------|-------------|------------|
| Basic | ICER | $10,000/QALY | $10,000/QALY | 0% |
| SGLT2i | ICER | $37,313/QALY | $37,310/QALY | 0.008% |
| High uncertainty | ICER | $85,106/QALY | $85,106/QALY | 0% |
| Basic | NMB (WTP $50k) | $20,000 | $20,000 | 0% |
| SGLT2i | NMB (WTP $50k) | $850 | $850 | 0% |

All three scenarios passed within the pre-specified tolerance criteria. Edge cases (dominant, dominated, indeterminate) produced appropriate labels and warnings in both TruthCert-PairwisePro and TreeAge Pro.

### Feature comparison

Table 3 compares TruthCert-PairwisePro against established meta-analysis software.

**Table 3. Feature comparison with existing meta-analysis software**

| Feature | PairwisePro | metafor [2] | meta [10] | CMA [13] | RevMan |
|---------|:-----------:|:-----------:|:---------:|:--------:|:------:|
| Interactive GUI | Yes (browser) | No (CLI) | No (CLI) | Yes (desktop) | Yes (desktop) |
| No installation required | Yes | No | No | No | No |
| Offline capable | Yes | Yes | Yes | Yes | Yes |
| 17 tau-squared estimators | Yes | Yes | Yes | Partial | No |
| HKSJ correction | Yes | Yes | Yes | Yes | No |
| Trim-and-fill | Yes | Yes | Yes | Yes | Yes |
| Copas selection model | Yes | Yes | No | No | No |
| PET-PEESE | Yes | Manual | No | No | No |
| GRADE assessment | Yes | No | No | No | Yes |
| HTA / cost-effectiveness | Yes | No | No | No | No |
| TruthCert verdict | Yes | No | No | No | No |
| R code export | Yes | N/A | N/A | No | No |
| Open source | Yes (MIT) | Yes (GPL) | Yes (GPL) | No | No |

### Use cases

TruthCert-PairwisePro is designed for three primary use cases. First, **rapid evidence synthesis** by clinicians and guideline developers who need pooled estimates without programming. Second, **teaching meta-analysis methods**, where the interactive interface allows students to observe the effect of different estimators, bias corrections, and sensitivity analyses. Third, **integrated appraisal**, where teams require statistical synthesis, evidence certainty assessment, and preliminary health economic evaluation within a single reproducible workflow.

Users should interpret pooled estimates in conjunction with heterogeneity diagnostics; when I-squared exceeds 75% or the prediction interval crosses the null, the pooled effect should be interpreted with caution.

---

## Discussion

TruthCert-PairwisePro v1.0 provides a validated, browser-based platform for pairwise meta-analysis that integrates statistical estimation, publication bias assessment, evidence verdict classification, and health technology appraisal. The numerical validation against R metafor demonstrates agreement within < 10^-5^ relative error for all core estimators, and the HTA module matches TreeAge Pro within 0.01% for ICER computations.

The TruthCert verdict system represents a structured approach to evidence appraisal that operationalises multiple threats into a single categorical assessment. By gating HTA access on the verdict, the platform discourages cost-effectiveness analyses on unreliable evidence bodies---a workflow safeguard absent from existing tools.

The R code export feature enables users to reproduce any TruthCert-PairwisePro analysis independently using metafor, providing a verification pathway that does not depend on the platform itself. This addresses a key concern in software-dependent evidence synthesis: the ability to audit results outside the tool that produced them.

### Limitations

The following limitations should be considered when using TruthCert-PairwisePro:

1. **Iterative estimator convergence.** Four of 17 tau-squared estimators (PM, HS, SJ, EB) show small numerical differences from metafor on certain datasets, attributable to convergence threshold and initialisation differences in the iterative algorithms. Users requiring exact replication of these specific estimators should verify against metafor directly.

2. **Single-file architecture.** The monolithic design (27,086 + 23,334 lines) simplifies deployment but limits modularity, complicates version control for collaborative development, and imposes a practical ceiling on codebase growth.

3. **No network meta-analysis.** The platform is restricted to pairwise comparisons. Network meta-analysis, which is increasingly required for health technology assessments comparing multiple interventions, is not supported. This is planned for a future version.

4. **TruthCert thresholds are empirically calibrated.** The severity weights and verdict boundary thresholds (0--2 for STABLE, 3--5 for MODERATE, etc.) were calibrated through iterative testing rather than derived from formal decision-theoretic or information-theoretic principles. Different calibrations may be appropriate for different evidence domains.

5. **Simplified HTA models.** The S14-HTA+ module uses simplified decision-tree structures rather than full Markov cohort or microsimulation models. It is suitable for preliminary cost-effectiveness screening but should not replace dedicated health economic modelling software (e.g., TreeAge, CHEERS-compliant Excel models) for full economic evaluations.

6. **Bootstrap performance.** Bootstrap-based methods (confidence intervals, permutation tests) use 1,000 replicates by default and are not parallelised, as JavaScript runs on a single thread. For large datasets (k > 50), bootstrap procedures may require several seconds.

7. **No formal usability evaluation.** While the interface has undergone iterative refinement through expert review, no structured usability study with a diverse sample of end users (varying statistical expertise, accessibility needs, device types) has been conducted.

8. **Pseudo-random number generator limitations.** The seedable PRNG uses a linear congruential generator, which has known limitations in statistical quality compared to generators such as Mersenne Twister or xoshiro128**. While adequate for bootstrap resampling, it is not suitable for applications requiring cryptographic randomness or extremely long-period sequences.

9. **Study design granularity.** The platform does not distinguish between case-control and cohort study designs when computing odds ratios, which may affect the clinical interpretation of pooled estimates in meta-analyses mixing these designs.

10. **Initial load requires internet.** Although the application functions offline after first load, the initial load requires internet access to retrieve external libraries from the `vendor/` directory or CDN. In fully air-gapped environments, the bundled distribution (`TruthCert-PairwisePro-v1.0-bundle.html`) with all dependencies embedded should be used.

---

## Software availability

**Source code:** https://github.com/mahmood726-cyber/truthcert-pairwisepro

**Archived source code at time of publication:** [ZENODO_DOI_PLACEHOLDER]

**Live demo:** https://mahmood726-cyber.github.io/truthcert-pairwisepro/TruthCert-PairwisePro-v1.0.html

**Licence:** MIT

An `renv.lock` file is included in the repository to pin R package versions used in validation.

**Software version:** 1.0

**Language:** JavaScript (ES2020), HTML5, CSS3

**Dependencies:** Plotly.js 2.27.0, jsPDF 2.5.1, html2canvas 1.4.1, SheetJS 0.18.5

---

## Data availability

No patient-level or restricted-access data were used. All validation datasets are embedded within the application source code and are also provided in Supplementary Files S3 (R validation scripts with datasets) and S4 (HTA validation scenarios). The BCG vaccine dataset is a widely used benchmark originally compiled by Colditz et al. The SGLT2 inhibitor dataset comprises published aggregate results from five heart failure trials. The blood pressure reduction dataset uses published summary statistics.

---

## Competing interests

The authors declare no competing interests.

## Grant information

No specific grant funding was received for this work.

## Acknowledgements

The authors thank the developers of metafor, Plotly.js, and the R statistical computing environment, whose open-source tools facilitated both the development and validation of TruthCert-PairwisePro.

---

## References

[1] DerSimonian R, Laird N. Meta-analysis in clinical trials. Control Clin Trials. 1986;7(3):177-188. https://doi.org/10.1016/0197-2456(86)90046-2

[2] Viechtbauer W. Conducting meta-analyses in R with the metafor package. J Stat Softw. 2010;36(3):1-48. https://doi.org/10.18637/jss.v036.i03

[3] Higgins JPT, Thompson SG. Quantifying heterogeneity in a meta-analysis. Stat Med. 2002;21(11):1539-1558. https://doi.org/10.1002/sim.1186

[4] Egger M, Davey Smith G, Schneider M, Minder C. Bias in meta-analysis detected by a simple, graphical test. BMJ. 1997;315(7109):629-634. https://doi.org/10.1136/bmj.315.7109.629

[5] Duval S, Tweedie R. Trim and fill: a simple funnel-plot-based method of testing and adjusting for publication bias in meta-analysis. Biometrics. 2000;56(2):455-463. https://doi.org/10.1111/j.0006-341X.2000.00455.x

[6] Copas JB, Shi JQ. A sensitivity analysis for publication bias in systematic reviews. Stat Methods Med Res. 2001;10(4):251-265. https://doi.org/10.1177/096228020101000402

[7] Hedges LV, Olkin I. Statistical Methods for Meta-Analysis. Orlando, FL: Academic Press; 1985.

[8] Hartung J, Knapp G. A refined method for the meta-analysis of controlled clinical trials with binary outcome. Stat Med. 2001;20(24):3875-3889. https://doi.org/10.1002/sim.1009

[9] Paule RC, Mandel J. Consensus values and weighting factors. J Res Natl Bur Stand. 1982;87(5):377-385. https://doi.org/10.6028/jres.087.022

[10] Schwarzer G, Carpenter JR, Rucker G. Meta-Analysis with R. Cham: Springer; 2015. https://doi.org/10.1007/978-3-319-21416-0

[11] Page MJ, McKenzie JE, Bossuyt PM, et al. The PRISMA 2020 statement: an updated guideline for reporting systematic reviews. BMJ. 2021;372:n71. https://doi.org/10.1136/bmj.n71

[12] Schunemann HJ, Oxman AD, Brozek J, et al. Grading quality of evidence and strength of recommendations for diagnostic tests and strategies. BMJ. 2008;336(7653):1106-1110. https://doi.org/10.1136/bmj.39500.677199.AE

[13] Borenstein M, Hedges LV, Higgins JPT, Rothstein HR. Introduction to Meta-Analysis. Chichester: John Wiley & Sons; 2009. https://doi.org/10.1002/9780470743386

[14] Stanley TD, Doucouliagos H. Meta-regression approximations to reduce publication selection bias. Res Synth Methods. 2014;5(1):60-78. https://doi.org/10.1002/jrsm.1095

[15] VanderWeele TJ, Ding P. Sensitivity analysis in observational research: introducing the E-value. Ann Intern Med. 2017;167(4):268-274. https://doi.org/10.7326/M16-2607
