# E156 Protocol — `truthcert-pairwisepro-v2`

This repository is the source code and dashboard backing an E156 micro-paper on the [E156 Student Board](https://mahmood726-cyber.github.io/e156/students.html).

---

## `[480]` TruthCert-PairwisePro: A Browser-Based Pairwise Meta-Analysis Engine with Seven Heterogeneity Estimators

**Type:** methods  |  ESTIMAND: Pooled effect size (OR/RR/MD/SMD)  
**Data:** A 27,901-line browser application for pairwise meta-analysis with 7 tau-squared estimators, 6 bias tests, and 96.4% R concordance across 108 validation checks.

### 156-word body

How can clinicians perform rigorous pairwise meta-analysis entirely within a web browser, without installing any statistical software or writing code? TruthCert-PairwisePro is a 27,901-line single-file HTML application implementing seven heterogeneity estimators, six publication bias tests, three-level and dose-response meta-analysis, subgroup analysis, meta-regression, and GRADE-based evidence appraisal for systematic reviews. The engine uses inverse-variance random-effects pooling with DerSimonian-Laird, REML, Paule-Mandel, empirical Bayes, Hunter-Schmidt, Sidik-Jonkman, and Hedges estimators, validated against R metafor benchmarks. Across 108 validation checks against R version 4.5.2, the tool achieved a 96.4 percent concordance rate, with OR and SMD pooling matching within 95% CI precision. An additional 101 Selenium end-to-end tests confirm interface stability across data import, model execution, visualization rendering, and export workflows under code-freeze conditions. The tool provides an accessible, reproducible platform for evidence synthesis that matches established R package outputs within documented tolerances. Scope is limited to aggregate-level pairwise comparisons; network, diagnostic, and individual participant data meta-analyses require separate specialized tools.

### Submission metadata

```
Corresponding author: Mahmood Ahmad <mahmood.ahmad2@nhs.net>
ORCID: 0000-0001-9107-3704
Affiliation: Tahir Heart Institute, Rabwah, Pakistan

Links:
  Code:      https://github.com/mahmood726-cyber/truthcert-pairwisepro-v2
  Protocol:  https://github.com/mahmood726-cyber/truthcert-pairwisepro-v2/blob/main/E156-PROTOCOL.md
  Dashboard: https://mahmood726-cyber.github.io/truthcert-pairwisepro-v2/

References (topic pack: individual participant data (IPD) meta-analysis):
  1. Riley RD, Lambert PC, Abo-Zaid G. 2010. Meta-analysis of individual participant data: rationale, conduct, and reporting. BMJ. 340:c221. doi:10.1136/bmj.c221
  2. Burke DL, Ensor J, Riley RD. 2017. Meta-analysis using individual participant data: one-stage and two-stage approaches, and why they may differ. Stat Med. 36(5):855-875. doi:10.1002/sim.7141

Data availability: No patient-level data used. Analysis derived exclusively
  from publicly available aggregate records. All source identifiers are in
  the protocol document linked above.

Ethics: Not required. Study uses only publicly available aggregate data; no
  human participants; no patient-identifiable information; no individual-
  participant data. No institutional review board approval sought or required
  under standard research-ethics guidelines for secondary methodological
  research on published literature.

Funding: None.

Competing interests: MA serves on the editorial board of Synthēsis (the
  target journal); MA had no role in editorial decisions on this
  manuscript, which was handled by an independent editor of the journal.

Author contributions (CRediT):
  [STUDENT REWRITER, first author] — Writing – original draft, Writing –
    review & editing, Validation.
  [SUPERVISING FACULTY, last/senior author] — Supervision, Validation,
    Writing – review & editing.
  Mahmood Ahmad (middle author, NOT first or last) — Conceptualization,
    Methodology, Software, Data curation, Formal analysis, Resources.

AI disclosure: Computational tooling (including AI-assisted coding via
  Claude Code [Anthropic]) was used to develop analysis scripts and assist
  with data extraction. The final manuscript was human-written, reviewed,
  and approved by the author; the submitted text is not AI-generated. All
  quantitative claims were verified against source data; cross-validation
  was performed where applicable. The author retains full responsibility for
  the final content.

Preprint: Not preprinted.

Reporting checklist: PRISMA 2020 (methods-paper variant — reports on review corpus).

Target journal: ◆ Synthēsis (https://www.synthesis-medicine.org/index.php/journal)
  Section: Methods Note — submit the 156-word E156 body verbatim as the main text.
  The journal caps main text at ≤400 words; E156's 156-word, 7-sentence
  contract sits well inside that ceiling. Do NOT pad to 400 — the
  micro-paper length is the point of the format.

Manuscript license: CC-BY-4.0.
Code license: MIT.
```


---

_Auto-generated from the workbook by `C:/E156/scripts/create_missing_protocols.py`. If something is wrong, edit `rewrite-workbook.txt` and re-run the script — it will overwrite this file via the GitHub API._