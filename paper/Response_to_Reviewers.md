# Response to Reviewer Comments

## TruthCert-PairwisePro v1.0: a browser-based evidence synthesis platform with integrated verdict assessment and health technology appraisal

**Manuscript ID:** (originally submitted as "RRORPair")

**Authors:** Mahmood Ahmad, Niraj Kumar, Bilaal Dar, Laiba Khan, Andrew Woo

**Date:** 19 March 2026

---

We thank both reviewers for their careful and constructive evaluation of our original submission. We agree that version 1 (v1) had fundamental deficiencies: it was an R/Shiny prototype with a skeleton manuscript, no embedded data, no validation evidence, and insufficient documentation. We have completely rebuilt the software and rewritten the manuscript from the ground up. Version 2 (v2), now titled **TruthCert-PairwisePro v1.0**, is a standalone browser-based application implemented in HTML and JavaScript (27,086 lines HTML; 23,334 lines JavaScript) that requires no R installation, no server, and no software dependencies beyond a modern web browser. The accompanying manuscript is a complete F1000Research Software Tool Article with full Methods, Results, and Discussion sections, 15 references, 3 validation tables, a feature comparison, 10 explicitly stated limitations, and supplementary validation files.

Below we address every concern raised by each reviewer, point by point.

---

## Reviewer 1: Naomi Bradbury (University of Leicester)

### Concern 1: No datasets available through GitHub to assess functionality

**Response:** This concern is fully addressed. TruthCert-PairwisePro v2 embeds three demonstration datasets directly within the application:

- **SGLT2_ACM** (k = 5, binary, odds ratio): five heart failure trials (DAPA-HF, EMPEROR-Reduced, DELIVER, EMPEROR-Preserved, SOLOIST-WHF)
- **BCG** (k = 6, binary, odds ratio): six BCG vaccine trials (Colditz et al. benchmark dataset)
- **BP_REDUCTION** (k = 5, continuous, mean difference / standardised mean difference): five blood pressure reduction trials

These datasets are loaded with a single click from the Data panel and immediately produce forest plots, heterogeneity statistics, publication bias analyses, TruthCert verdicts, and HTA outputs. No external files or downloads are required. The datasets are also provided in the R validation scripts (Supplementary File S3) and are fully described in the manuscript (Methods, "Numerical validation against R metafor," lines 96--104; Results, Table 1).

The GitHub repository now contains the complete application source code (HTML + JavaScript), a `vendor/` directory with all library dependencies, an `renv.lock` file pinning R package versions, validation scripts, and a README with usage instructions.

---

### Concern 2: Cannot run code locally (dmetar package not available)

**Response:** This concern is no longer applicable. The v1 submission was an R/Shiny application dependent on the dmetar package. **Version 2 is a completely different technology stack.** TruthCert-PairwisePro is now implemented entirely in HTML5 and vanilla JavaScript (ES2020). It runs in any modern web browser (Chrome, Firefox, Edge, Safari) with absolutely no R installation, no package management, and no server infrastructure required. The user opens a single HTML file and the application is fully functional.

Furthermore, for reviewers who wish to cross-check results against R, we have integrated a **WebR in-browser validation** feature (described in the manuscript, Methods section). This loads the R metafor package directly in the browser via WebAssembly (WebR v0.4.4) and runs `metafor::rma(method="REML")` on the current dataset, enabling one-click verification against the gold-standard R implementation without installing R locally.

The application also exports a **reproducible R script** for any analysis, allowing independent verification using a local R installation if desired.

---

### Concern 3: No testing/validation evidence

**Response:** Validation is now a central component of both the software and the manuscript. We report the following:

**Numerical validation against R metafor v4.8-0 (Table 1 in manuscript):**

| Category | Tests | Passed | Pass rate |
|----------|-------|--------|-----------|
| Effect sizes (yi, vi) | 32 | 32 | 100% |
| tau-squared, core (DL, REML, ML, HE) | 24 | 24 | 100% |
| tau-squared, advanced (PM, HS, SJ, EB) | 16 | 12 | 75% |
| Pooled estimates | 12 | 12 | 100% |
| Confidence intervals | 16 | 16 | 100% |
| Heterogeneity (I-squared, Q) | 12 | 12 | 100% |
| **Total** | **112** | **108** | **96.4%** |

All core estimators (DL, REML, ML, HE), pooled estimates, confidence intervals, and heterogeneity statistics match R metafor to within relative error < 10^-5. The four partial matches involved advanced iterative estimators (PM, HS, SJ, EB) under convergence threshold differences, which are disclosed transparently in Limitation 1.

**HTA module validation against TreeAge Pro 2023 (Table 2 in manuscript):**
Three scenarios (basic, SGLT2 inhibitor, high uncertainty) were validated with mean absolute ICER difference < 0.01%.

**In-browser WebR validation:**
Reviewers can verify any analysis against metafor directly in the browser with one click, without installing R.

The R validation scripts are provided as Supplementary File S3.

---

### Concern 4: No comparison with other open-access tools (e.g., CRSU apps)

**Response:** The manuscript now includes a comprehensive feature comparison table (Table 3) benchmarking TruthCert-PairwisePro against four established meta-analysis platforms: metafor [2], meta [10], CMA [13], and RevMan. The comparison covers 12 feature dimensions including: interactive GUI, installation requirement, offline capability, tau-squared estimator coverage (17 estimators), HKSJ correction, trim-and-fill, Copas selection model, PET-PEESE, GRADE assessment, HTA/cost-effectiveness, TruthCert verdict, R code export, and open-source licence status.

The comparison demonstrates that TruthCert-PairwisePro is the only tool that combines a browser-based interactive GUI requiring no installation with 17 tau-squared estimators, 12 publication bias methods, integrated GRADE assessment, cost-effectiveness analysis (HTA module), a structured evidence verdict system, and R code export -- all within a single open-source application.

We also discuss the three primary use cases in the manuscript (Results section): rapid evidence synthesis by clinicians, teaching meta-analysis methods, and integrated appraisal workflows.

---

### Concern 5: Skeleton manuscript with no methods/results/discussion

**Response:** We acknowledge that the v1 manuscript was an incomplete outline. The v2 manuscript has been completely rewritten as a full F1000Research Software Tool Article. The final manuscript comprises 284 lines and includes the following complete sections:

- **Abstract** (Background, Methods, Results, Conclusions): structured summary including all key statistics (112 tests, 96.4% pass rate, <10^-5 relative error, <0.01% ICER difference)
- **Introduction**: motivation, gap analysis, and positioning relative to existing tools (4 paragraphs)
- **Methods**: three subsections:
  - *Implementation* (statistical engine with 6 method categories, TruthCert verdict system with 12-point assessment, S14-HTA+ module with 4-tier recommendation)
  - *Operation* (7-step workflow description with all interface panels)
  - *Validation* (WebR in-browser validation, numerical comparison protocol against metafor, HTA comparison against TreeAge Pro)
- **Results**: numerical validation results (Table 1), HTA validation (Table 2), feature comparison (Table 3), and use cases
- **Discussion**: 4 paragraphs covering principal findings, TruthCert verdict contribution, R code export for auditability, and 10 explicitly stated limitations
- **Software availability**: GitHub URL, Zenodo archive DOI, live demo URL, licence, language, and dependencies
- **Data availability**: description of all embedded datasets with provenance
- **15 references**: all with DOIs

---

## Reviewer 2: Angel Garza Reyna (Duke University)

### Concern 1: No example dataset or tutorial

**Response:** Three demonstration datasets are now embedded directly in the application and loadable with a single click:

1. **SGLT2_ACM** (k = 5, binary, odds ratio): five SGLT2 inhibitor heart failure trials
2. **BCG** (k = 6, binary, odds ratio): six BCG vaccine trials (standard benchmark)
3. **BP_REDUCTION** (k = 5, continuous, MD/SMD): five blood pressure trials

Each dataset immediately populates the data table and allows the user to proceed through the full workflow (analysis, heterogeneity, publication bias, TruthCert verdict, HTA) without entering any data. The manuscript describes the 7-step workflow (Methods, "Operation" section) which effectively serves as a tutorial: (1) data entry or demo dataset loading, (2) model configuration, (3) analysis, (4) publication bias, (5) TruthCert verdict, (6) HTA (if applicable), (7) export.

---

### Concern 2: Broken Acknowledgement hyperlink

**Response:** The Acknowledgements section has been rewritten. It now reads: "The authors thank the developers of metafor, Plotly.js, and the R statistical computing environment, whose open-source tools facilitated both the development and validation of TruthCert-PairwisePro." All hyperlinks have been verified. The application no longer depends on any external links for core functionality -- it operates entirely offline after initial load.

---

### Concern 3: Need grammatical check

**Response:** The v2 manuscript has been completely rewritten with careful attention to grammar, technical precision, and adherence to F1000Research Software Tool Article guidelines. The text has undergone multiple rounds of editorial review. We are confident the current version meets publication standards for English language quality.

---

### Concern 4: No README.md on GitHub

**Response:** The GitHub repository (https://github.com/mahmood726-cyber/truthcert-pairwisepro) now includes a comprehensive README with: project description, installation/usage instructions (simply open the HTML file in a browser), dependency listing, embedded dataset descriptions, validation summary, licence information, and citation guidance. An `renv.lock` file is also provided to pin R package versions used in validation.

---

### Concern 5: Standalone version fails to display several figures

**Response:** This issue stemmed from the v1 R/Shiny architecture, which required a running R session to render plots. **This is no longer applicable.** TruthCert-PairwisePro v2 uses Plotly.js for all interactive visualisations (forest plots, funnel plots, contour-enhanced funnel plots, L'Abbe plots, Galbraith plots, cost-effectiveness planes, tornado diagrams, CEACs). All figures render entirely client-side in the browser with no server dependency. The application has been tested in Chrome, Firefox, Edge, and Safari.

A fully self-contained bundle (`TruthCert-PairwisePro-v1.0-bundle.html`) with all dependencies embedded inline is also available for air-gapped environments, ensuring figures display correctly regardless of network connectivity.

---

### Concern 6: Code has 4,959 lines with development comments

**Response:** The v1 codebase was a single 4,959-line R/Shiny file with residual development comments. Version 2 is a ground-up rewrite comprising:

- **TruthCert-PairwisePro-v1.0.html**: 27,086 lines (user interface, CSS, layout)
- **app.js**: 23,334 lines (statistical engine, all computational methods)

The JavaScript codebase implements 17 tau-squared estimators, 12 publication bias methods, a 12-point TruthCert threat assessment, and a full HTA module with ICER, NMB, CEAC, EVPI, and tornado sensitivity analysis. Development comments have been replaced with structured JSDoc-style documentation appropriate for a production codebase. The code is released under the MIT licence and is available for inspection on GitHub.

---

### Concern 7: Manuscript is in early stages/outline form

**Response:** We fully acknowledge this criticism of v1. The v2 manuscript is a complete, publication-ready F1000Research Software Tool Article. Please see our response to Reviewer 1, Concern 5 above for a detailed summary of all sections. In brief, the manuscript now includes: a structured abstract; a full Introduction with gap analysis; a Methods section covering implementation (statistical engine, TruthCert system, HTA module), operation (7-step workflow), and validation protocol; Results with three tables (numerical validation, HTA validation, feature comparison); a Discussion with 10 explicitly stated limitations; Software availability and Data availability sections; and 15 references with DOIs. The manuscript is 284 lines in its final form.

---

### Concern 8: Missing citations (bayesmeta)

**Response:** The v1 manuscript failed to cite several relevant packages. The v2 manuscript includes 15 references covering all major methodological foundations: DerSimonian and Laird [1], metafor [2], Higgins and Thompson [3], Egger et al. [4], Duval and Tweedie [5], Copas and Shi [6], Hedges and Olkin [7], Hartung and Knapp [8], Paule and Mandel [9], Schwarzer et al. (meta package) [10], PRISMA 2020 [11], GRADE [12], Borenstein et al. (CMA) [13], Stanley and Doucouliagos (PET-PEESE) [14], and VanderWeele and Ding (E-value) [15].

Regarding the bayesmeta package specifically: TruthCert-PairwisePro v2 does not implement Bayesian meta-analysis methods (this is noted as a scope boundary -- the platform focuses on frequentist pairwise meta-analysis). Therefore, a bayesmeta citation is not applicable to the current version. Bayesian extensions are acknowledged as a potential direction for future development.

---

### Concern 9: No example data in GitHub repo (only LICENSE and app.R)

**Response:** This is fully resolved. The GitHub repository now contains:

- `TruthCert-PairwisePro-v1.0.html` (27,086 lines -- complete application with embedded demo datasets)
- `app.js` (23,334 lines -- statistical engine)
- `vendor/` directory (Plotly.js, jsPDF, html2canvas, SheetJS -- all dependencies for offline operation)
- `renv.lock` (R package version pinning for validation reproducibility)
- `README.md` (usage instructions, feature summary, citation)
- `LICENSE` (MIT)

Critically, **three example datasets are embedded directly in the application source code** and require no separate download. Users load them from the Data panel with one click. The R validation scripts (Supplementary File S3) also contain these datasets in R-readable format for independent verification.

---

## Summary of changes from v1 to v2

| Aspect | v1 (original) | v2 (revised) |
|--------|---------------|--------------|
| Technology | R/Shiny (requires R + packages) | Browser HTML/JavaScript (no installation) |
| Codebase | 4,959 lines R | 27,086 lines HTML + 23,334 lines JS |
| Installation | R, Shiny, dmetar, metafor | None (open HTML file in browser) |
| Embedded datasets | None | 3 datasets (SGLT2_ACM, BCG, BP_REDUCTION) |
| Tau-squared estimators | Limited | 17 estimators |
| Publication bias methods | Limited | 12 methods |
| Validation | None reported | 112 tests vs metafor (96.4% pass); HTA vs TreeAge Pro (<0.01%) |
| In-browser R validation | Not available | WebR one-click verification |
| TruthCert verdict | Not described | 12-point threat assessment, 5 verdict categories |
| HTA module | Not present | ICER, NMB, CEAC, EVPI, tornado, 4-tier recommendation |
| Feature comparison | None | Table comparing 5 platforms across 12 dimensions |
| Limitations | Not stated | 10 explicitly stated limitations |
| Manuscript completeness | Skeleton/outline | Complete Software Tool Article (284 lines, 15 refs, 3 tables) |
| GitHub repo contents | LICENSE + app.R | Full source, vendor libs, renv.lock, README |
| R code export | No | Yes (reproducible metafor script) |
| Licence | Not stated | MIT |

---

We believe version 2 comprehensively addresses all concerns raised by both reviewers. The software has been completely rebuilt, the manuscript has been completely rewritten, and validation evidence is now embedded within both the application and the paper. We welcome further review and are happy to address any additional questions.

Respectfully,

Mahmood Ahmad, on behalf of all authors
