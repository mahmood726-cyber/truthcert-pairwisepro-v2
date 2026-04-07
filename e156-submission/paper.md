Mahmood Ahmad
Tahir Heart Institute
mahmood.ahmad2@nhs.net

TruthCert-PairwisePro: A Browser-Based Pairwise Meta-Analysis Engine with Seven Heterogeneity Estimators

How can clinicians perform rigorous pairwise meta-analysis entirely within a web browser, without installing any statistical software or writing code? TruthCert-PairwisePro is a 27,901-line single-file HTML application implementing seven heterogeneity estimators, six publication bias tests, three-level and dose-response meta-analysis, subgroup analysis, meta-regression, and GRADE-based evidence appraisal for systematic reviews. The engine uses inverse-variance random-effects pooling with DerSimonian-Laird, REML, Paule-Mandel, empirical Bayes, Hunter-Schmidt, Sidik-Jonkman, and Hedges estimators, validated against R metafor benchmarks. Across 108 validation checks against R version 4.5.2, the tool achieved a 96.4 percent concordance rate, with OR and SMD pooling matching within 95% CI precision. An additional 101 Selenium end-to-end tests confirm interface stability across data import, model execution, visualization rendering, and export workflows under code-freeze conditions. The tool provides an accessible, reproducible platform for evidence synthesis that matches established R package outputs within documented tolerances. Scope is limited to aggregate-level pairwise comparisons; network, diagnostic, and individual participant data meta-analyses require separate specialized tools.

Outside Notes

Type: methods
Primary estimand: Pooled effect size (OR/RR/MD/SMD)
App: TruthCert-PairwisePro v1.1
Data: 27,901-line single-file HTML with 7 heterogeneity estimators
Code: https://github.com/mahmood726-cyber/truthcert-pairwisepro-v2
Version: 1.1
Validation: DRAFT

References

1. Crippa A, Orsini N. Dose-response meta-analysis of differences in means. BMC Med Res Methodol. 2016;16:91.
2. Greenland S, Longnecker MP. Methods for trend estimation from summarized dose-response data, with applications to meta-analysis. Am J Epidemiol. 1992;135(11):1301-1309.
3. Borenstein M, Hedges LV, Higgins JPT, Rothstein HR. Introduction to Meta-Analysis. 2nd ed. Wiley; 2021.
