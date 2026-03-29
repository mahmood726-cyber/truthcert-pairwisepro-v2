# Release SOP V1 (Add-Only Governance)

Date: 2026-02-26  
Project: TruthCert-PairwisePro

## 1. Scope
This SOP defines mandatory quality gates before claiming production-grade parity and reproducibility.

## 2. Guardrail
1. Do not remove existing functions.
2. All release fixes must be add-only unless a documented bug correction is required.
3. Any behavior change must include before/after evidence.

## 3. Required pre-release gates
1. Run preregistered oracle pack:
   - `run_preregistered_oracle_pack.bat`
2. Run nightly quality gate (can be on-demand):
   - `run_nightly_quality_gate.bat`
3. Verify locked reproducibility report exists in run folder.
4. Verify GLMM cross-check artifacts exist (CSV comparison).
5. Verify both Firefox suites pass:
   - v2 suite: failed = 0
   - comprehensive suite: failed = 0

## 4. Required release artifacts
1. `oracle_output.json` from preregistered pack run
2. `checksum_manifest.csv`
3. `nightly_summary.json` and `nightly_summary.md`
4. `LOCKED_REPRODUCIBILITY_REPORT_*.md` and `.json`
5. GLMM cross-check CSV comparison files

## 5. Two-person sign-off
1. Analyst A executes full run and prepares release bundle.
2. Analyst B independently reruns `run_preregistered_oracle_pack.bat` on a separate machine profile.
3. Both sign off on artifact consistency and pass/fail status.

## 6. Fail conditions
Block release if any occur:
1. Any test suite failure.
2. Missing locked reproducibility report.
3. Missing checksum manifest.
4. Out-of-tolerance discrepancies unresolved.

## 7. Release checklist
- [ ] Add-only guardrail respected
- [ ] Preregistered oracle pack completed
- [ ] Nightly quality gate completed
- [ ] Locked reproducibility report generated
- [ ] Independent rerun performed (second analyst)
- [ ] Release note drafted with artifact links

## 8. Versioning
If protocol/input pack changes, increment to V2 and retain V1 artifacts unchanged.
