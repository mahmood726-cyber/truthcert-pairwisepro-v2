# Migration Guide: Legacy Workflow to TruthCert

Date: 2026-02-26  
From: `C:\HTML apps\Truthcert1`  
To: `C:\HTML apps\Truthcert1_work`

## 1. Goal
Reduce team migration friction by mapping legacy SOP actions to current add-only workflow.

## 2. Quick migration path
1. Load legacy-compatible dataset into Data tab.
2. Use same effect measure and tau2 method as legacy SOP.
3. Run analysis.
4. Open Advanced tab and run GLMM family comparison where applicable.
5. Export audit artifacts (manifest, citations, audit bundle, GLMM cross-check R script).

## 3. Preset templates
Use migration presets from:
- `templates/migration_presets/preset_01_rare_event_safety.json`
- `templates/migration_presets/preset_02_continuous_efficacy.json`
- `templates/migration_presets/preset_03_public_health_proportion.json`

## 4. Team onboarding checklist
- [ ] Confirm legacy SOP mapping row in `MIGRATION_SOP_MAPPING_2026-02-26.csv`
- [ ] Execute one pilot run with matching dataset
- [ ] Export audit bundle and GLMM cross-check script
- [ ] Verify output interpretation with legacy owner

## 5. Near-future switch criteria
1. At least one successful pilot per team with zero critical discrepancies.
2. Team-specific SOP mapping approved.
3. One-click preset templates adopted in routine workflow.

## 6. Guardrail
Migration changes must not remove existing features; only add process clarity and automation.
