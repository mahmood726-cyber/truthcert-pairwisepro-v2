# App vs R Oracle Parity

- Generated: 2026-03-04T06:23:57.197433
- HTML: `C:\HTML apps\Truthcert1_work\TruthCert-PairwisePro-v1.0.html`
- Oracle input: `C:\HTML apps\Truthcert1_work\benchmark_pack\oracle_input_preregistered_v1.json`
- Oracle output: `C:\HTML apps\Truthcert1_work\oracle_parity_runs\run_20260304_062347\oracle_output.json`

## Summary
- Dataset-method checks: 120
- Passed: 113
- Failed: 7
- Skipped: 0
- Overall pass: **False**

## Tolerance
- theta abs tol: 0.001
- se abs tol: 0.01
- tau2 abs tol: 0.01
- I2 abs tol: 1.0

## Failure Samples
- bcg_builtin/GENQ: theta diff=0.2838171676898583, se diff=0.10475852991982093, tau2 diff=4.2474732797670445e-05, I2 diff=0.00027635153924165934
- bcg_builtin/GENQM: theta diff=0.26292162315607004, se diff=0.1739633824058817, tau2 diff=0.21471520622807705, I2 diff=7.127560534911041
- binary_highhet_rr/SJ: theta diff=0.001881647245423529, se diff=0.009059078742389329, tau2 diff=0.014741583598394663, I2 diff=8.817722312581644
- binary_highhet_rr/GENQ: theta diff=0.006983956503918032, se diff=9.33194956947575e-05, tau2 diff=3.3074177841430075e-05, I2 diff=2.4653930026374837e-06
- binary_highhet_rr/GENQM: theta diff=0.005454117934163366, se diff=0.012154657039977937, tau2 diff=0.018206438443378166, I2 diff=14.497757296863924
- continuous_smd_case/SJ: theta diff=0.00039632946395423696, se diff=0.0018194556778217547, tau2 diff=0.0017, I2 diff=5.4288
- generic_outlier_case/SJ: theta diff=0.005309964557738675, se diff=0.012766630880342529, tau2 diff=0.0119, I2 diff=31.1168
