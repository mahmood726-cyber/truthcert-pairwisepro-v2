# Multi-Person Arabic Review (2026-03-06)

## Scope
- Files reviewed:
  - `TruthCert-PairwisePro-v1.0.html`
  - `TruthCert-PairwisePro-v1.0-fast.html`
  - `TruthCert-PairwisePro-v1.0-bundle.html`
  - `TruthCert-PairwisePro-v1.0-dist.html`
  - `TruthCert-PairwisePro-v1.0-min.html`
  - `TruthCert-PairwisePro-v1.0-optimized.html`
  - `TruthCert-PairwisePro-v1.0-production.html`
- Validation method:
  - Playwright QA run (`tools/qa_arabic_coverage.js`)
  - Runtime audit via `window.TC_I18N.auditCoverage()`
  - Targeted override pass for uncovered user-facing phrases

## Reviewer 1: Arabic Language QA
- Focus: wording quality, readability, and consistency across labels/help text.
- Findings:
  - Core UI labels, buttons, tips, and long descriptive help text translated to Arabic.
  - Numerically dense statistical strings kept partially in English where this improves clinical readability.
- Actions applied:
  - Added manual Arabic overrides for high-impact explanatory text and warnings.

## Reviewer 2: Biostatistics Terminology QA
- Focus: avoid mistranslation of technical tokens and statistical notation.
- Findings:
  - Statistical acronyms/symbolic terms should remain unchanged to avoid semantic drift.
  - Examples: `REML`, `HKSJ`, `DDMA`, `HTA`, `NNT`, `MCID`, `pt(2, 10)`, `qt(0.975, 10)`.
- Actions applied:
  - Protected-term preservation in translation generation.
  - Residual untranslated set constrained to technical tokens/notation only.

## Reviewer 3: RTL/UX Engineering QA
- Focus: runtime switching, RTL layout, DOM updates, and script stability.
- Findings:
  - Language switcher present and functional in all reviewed files.
  - `lang="ar"` and `dir="rtl"` correctly applied for Arabic mode.
  - No runtime load/page errors in final QA run.
- Actions applied:
  - Added runtime i18n (`arabic_i18n.js`) with mutation-based dynamic translation and RTL CSS adaptations.
  - Added generated and override translation packs across all variant entry HTML files.

## Final QA Result
- Source: `output/arabic_qa/arabic_coverage_report.json`
- Final status:
  - `files_tested`: 7
  - `files_loaded`: 7
  - `i18n_ready_files`: 7
  - `rtl_files`: 7
  - `files_with_errors`: 0

## Residual Untranslated Terms (Intentional)
These are intentionally preserved as technical/statistical notation or product identifiers:
- `TC`
- `TruthCert-PairwisePro`
- `DDMA`
- `HTA`
- `REML`
- `ML`
- `HKSJ`
- `NNT`
- `GRADE`
- `R`
- `PASS`
- `HR:`
- `OR 1.0:`
- `OR 0.5-2.0:`
- `SMD 0.2:`
- `SMD 0.5:`
- `SMD 0.8:`
- `MCID (δ)` (including mojibake variant in legacy content)
- `95% CI` and numeric examples such as `3.1% [95% CI: 2.5-3.8%]`
- `pt(2, 10)`, `qt(0.975, 10)`
- `cv_death_or_hfh`
- `CSV:`, `JSON:`, `YAML:`, `Excel:`
- `🎯 DDMA`
