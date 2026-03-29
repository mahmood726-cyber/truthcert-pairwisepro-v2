# Locked Reproducibility Report

Generated: 2026-03-03 08:17:15
Run folder: `C:\HTML apps\Truthcert1_work\nightly_runs_test5\run_20260226_221626`

## Gate Verdict
Overall pass: **yes**

## Gate Checks
- test_v2_failed_zero: yes
- test_comprehensive_failed_zero: yes
- oracle_output_present: yes
- oracle_pairwise_failures_zero: yes
- oracle_missing_method_entries_zero: yes
- oracle_glmm_failures_zero: yes
- glmm_crosscheck_artifact_present: yes

## Test Summaries
- v2: passed=64 failed=0 warnings=None
- comprehensive: passed=79 failed=0 warnings=0

## Oracle Output
- file: `C:\HTML apps\Truthcert1_work\oracle_output.json`
- dataset_count: 10
- datasets: bcg_builtin, binary_lowhet_rr, binary_sparse_zero_or, binary_highhet_rr, continuous_md_case, continuous_smd_case, proportion_like_case, correlation_like_case, generic_outlier_case, small_k_edge_case
- requested_methods_count: 17
- requested_methods: DL, REML, ML, PM, PMM, HS, HSk, SJ, HE, EB, GENQ, GENQM, PL, DL2, CA, BMM, QG
- pairwise_failure_count: 0
- missing_method_entry_count: 0
- glmm_failure_count: 0

## GLMM Cross-check Artifacts
- crosscheck_csv_count: 1
- comparison_csv_count: 1
- oracle_glmm_dataset_count: 5
- oracle_glmm_datasets: bcg_builtin, binary_lowhet_rr, binary_sparse_zero_or, binary_highhet_rr, small_k_edge_case

## Build File Hashes (SHA256)
- `TruthCert-PairwisePro-v1.0.html`: `ad3a4c500613dc94e2aba84c471f2398d59fc1da77b914a047c6dc51adbb62f5`
- `app.js`: `e2b71127d2084eb0e7e7317266a55ea957d727468fc7c8825e22b39e9974cbc2`
- `expert_upgrade_additions.js`: `31e3f064b8c63f29bdb8fc6cffbf88b9a90a884d2f65f26ba62fd264493e5221`
- `run_oracle_benchmark.ps1`: `4c0c44878e71b730f6030314d351447929bb2b774f33490d1a04e7c97580515e`
- `R_oracle_pairwise_benchmark.R`: `fdc778701641e409d23c8575fdd80496a0efc1b52259481ea4fc14666979d9c2`
- `run_latest_glmm_metafor_crosscheck.ps1`: `3d5c9bb6da10c255771985d039a8c35943c5c6f7030f8e1cbca3c1f489d82099`
- `run_nightly_quality_gate.ps1`: `15f06ff25c6074f0f46883f91a8a418dbb634e0fa39075d4b4b003916074ba49`
