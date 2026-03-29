# Independent Replication Pack V1

Date: 2026-02-26

## Purpose
Enable an external/second analyst to rerun the locked benchmark protocol with minimal ambiguity.

## Required inputs
1. `benchmark_pack/oracle_input_preregistered_v1.json`
2. `benchmark_pack/benchmark_pack_manifest_v1.json`
3. `governance/PREREGISTERED_ORACLE_PROTOCOL_V1_2026-02-26.md`
4. App build files (`TruthCert-PairwisePro-v1.0.html`, `expert_upgrade_additions.js`)

## Run commands
1. Independent oracle rerun:
   - `run_preregistered_oracle_pack.bat`
2. Full quality gate with tests and locked report:
   - `run_nightly_quality_gate.bat`

## Expected outputs
1. `oracle_output.json`
2. `checksum_manifest.csv`
3. `nightly_summary.json` and `nightly_summary.md`
4. `LOCKED_REPRODUCIBILITY_REPORT_*.md` and `.json`

## Independence checklist
- [ ] Separate user profile/environment
- [ ] Same locked protocol and input pack version
- [ ] Output checksums captured
- [ ] Any discrepancy logged with reproducible steps

## Acceptance rule
Replication pass requires no unresolved critical discrepancies and no failed regression tests.
