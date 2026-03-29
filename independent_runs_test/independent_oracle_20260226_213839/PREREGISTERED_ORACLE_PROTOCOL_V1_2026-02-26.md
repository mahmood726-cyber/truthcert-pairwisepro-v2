# Pre-Registered Oracle Protocol V1

Date locked: 2026-02-26  
Project: TruthCert-PairwisePro  
Scope: Pairwise meta-analysis parity and reproducibility gates

## 1. Objective
Define pre-registered pass/fail criteria for independent reruns against external statistical oracles.

## 2. Primary oracles
1. R `metafor` (primary): `rma`, `rma.glmm`
2. R `meta` (secondary cross-check where applicable)

## 3. Fixed analysis matrix
1. Tau2 estimators: `DL, REML, ML, PM, PMM, HS, HSk, SJ, HE, EB, GENQ, GENQM`
2. GLMM model families: `UM.FS, UM.RS, CM.EL, CM.AL`
3. Outcome classes: binary, continuous, proportion-like, correlation-like, generic yi/vi
4. Edge conditions: sparse/zero-cell data, high heterogeneity, small-k

## 4. Pre-specified tolerances
1. Pooled theta and SE: relative error <= `1e-5`
2. tau2, I2, Q statistics: relative error <= `1e-4`
3. p-values: absolute error <= `1e-4`
4. GLMM transformed estimate and CI bounds: relative error <= `1e-4`

## 5. Rules for adjudication
1. Any out-of-tolerance item must be reproduced in an isolated script.
2. Root cause classification required: settings mismatch, numeric optimization, implementation defect, or oracle-side method mismatch.
3. If unresolved, release is blocked for “production-grade equivalence” claims.

## 6. Artifact lock requirements
A run is considered protocol-compliant only if all are present:
1. Input pack file and SHA256 checksum
2. App build file hash set
3. Oracle outputs (`oracle_output.json`, GLMM cross-check CSV/JSON)
4. Regression test logs
5. Locked reproducibility report with timestamp and checksums

## 7. Independence requirement
For strict governance sign-off, at least one rerun must be performed by a second analyst on a separate machine profile using this exact protocol and same locked input pack.

## 8. Versioned input pack
Protocol V1 is bound to:
- `benchmark_pack/oracle_input_preregistered_v1.json`
- `benchmark_pack/benchmark_pack_manifest_v1.json`

## 9. Non-negotiable guardrail
All remediation actions are add-only and must not remove any app capability.
