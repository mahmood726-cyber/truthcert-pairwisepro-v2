# Benchmark Pack V1

This folder contains the locked benchmark input pack for oracle reruns.

## Files
1. `benchmark_pack_manifest_v1.json`  
   Dataset inventory, required method families, and tolerance profile.
2. `oracle_input_preregistered_v1.json`  
   Input payload for `run_oracle_benchmark.ps1` and `R_oracle_pairwise_benchmark.R`.

## Intended usage
1. Execute oracle rerun:
   `powershell -ExecutionPolicy Bypass -File .\run_oracle_benchmark.ps1 -InputJson "C:/HTML apps/Truthcert1_work/benchmark_pack/oracle_input_preregistered_v1.json" -OutputJson "C:/HTML apps/Truthcert1_work/oracle_output_preregistered_v1.json"`
2. Store output with timestamp under a run folder.
3. Include output checksum in locked reproducibility report.

## Change control
Do not modify these files in-place for a locked run.  
If changes are needed, create `v2` files and update protocol references.
