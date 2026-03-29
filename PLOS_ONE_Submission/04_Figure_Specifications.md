# Figure Specifications for PLOS ONE Submission

## PLOS ONE Image Requirements
- Format: TIFF or EPS
- Resolution: 300-600 ppi
- Maximum size: 10 MB per figure
- Color mode: RGB for color figures
- Width: 1 column (5.2 inches / 13.2 cm) or 2 columns (7.5 inches / 19.05 cm)

---

## Figure 1: TruthCert-PairwisePro User Interface

### Description
Screenshot montage showing the four main panels of TruthCert-PairwisePro: data entry, forest plot, verdict classification, and threat ledger.

### Specifications
- **Dimensions**: 7.5 x 6.0 inches (2-column width)
- **Resolution**: 300 ppi
- **Format**: TIFF
- **Layout**: 2x2 grid

### Panel Contents
| Panel | Position | Content |
|-------|----------|---------|
| A | Top-left | Data entry panel with BCG vaccine dataset |
| B | Top-right | Forest plot with pooled estimate diamond |
| C | Bottom-left | Verdict display showing "STABLE" classification |
| D | Bottom-right | Threat ledger with 12-point assessment |

### Caption
**Figure 1. TruthCert-PairwisePro user interface.** (A) Data entry panel showing binary outcome input for the BCG vaccine dataset (k=13). (B) Forest plot with individual study effects (squares), 95% confidence intervals (lines), pooled estimate (diamond), and prediction interval (dashed lines). (C) Verdict classification display with STABLE/MODERATE/UNCERTAIN indicator and supporting metrics. (D) 12-point threat ledger showing pass/warning/fail status for each evidence quality dimension.

### Creation Steps
1. Open TruthCert-PairwisePro with BCG dataset loaded
2. Take screenshots of each panel at 1920x1080 resolution
3. Combine in image editor (Photoshop, GIMP, or similar)
4. Add panel labels (A, B, C, D) in 12pt Arial Bold
5. Export as TIFF, 300 ppi, RGB

---

## Figure 2: Verdict Classification Algorithm Flowchart

### Description
Flowchart showing the decision pathway from raw data to verdict classification, including the 12-point threat assessment.

### Specifications
- **Dimensions**: 7.5 x 8.0 inches (2-column width)
- **Resolution**: 300 ppi
- **Format**: TIFF
- **Style**: Process flowchart with decision nodes

### Elements
```
[Raw Data Input]
       |
       v
[Effect Size Calculation]
       |
       v
[Random Effects Model]
       |
       v
[Statistical Assessment]----+----[Methodological Assessment]
       |                    |              |
       v                    v              v
[6 Statistical Threats] [GRADE Domains] [6 Method Threats]
       |                    |              |
       +--------+-----------+--------------+
                |
                v
        [Calculate Score (0-12)]
                |
        +-------+-------+
        |       |       |
        v       v       v
    [>=9]   [6-8]   [<6]
        |       |       |
        v       v       v
   STABLE  MODERATE UNCERTAIN
```

### Caption
**Figure 2. Verdict classification algorithm flowchart.** The algorithm processes input data through effect size calculation and random effects modeling, then conducts parallel statistical (6 dimensions) and methodological (6 dimensions) threat assessments. The combined 12-point score determines verdict classification: STABLE (>=9 points, no critical threats), MODERATE (6-8 points), or UNCERTAIN (<6 points or any critical threat flagged).

### Creation Steps
1. Create flowchart in diagramming software (draw.io, Lucidchart, or PowerPoint)
2. Use consistent shapes: rectangles for processes, diamonds for decisions
3. Color code: Green for STABLE, Yellow for MODERATE, Red for UNCERTAIN
4. Use 10pt Arial for text
5. Export as TIFF, 300 ppi

---

## Figure 3: Validation Results

### Description
Four-panel figure showing validation metrics: Bland-Altman plot, MCID sensitivity analysis, ROC curve, and Type I error analysis.

### Specifications
- **Dimensions**: 7.5 x 6.0 inches (2-column width)
- **Resolution**: 300 ppi
- **Format**: TIFF
- **Layout**: 2x2 grid

### Panel Contents
| Panel | Content | Axes |
|-------|---------|------|
| A | Bland-Altman plot (TruthCert vs R metafor) | x: Mean, y: Difference |
| B | MCID sensitivity analysis | x: MCID value, y: Verdict stability |
| C | ROC curve for verdict classification | x: 1-Specificity, y: Sensitivity |
| D | Type I error by heterogeneity level | x: tau, y: Type I error rate |

### Panel A: Bland-Altman Plot
- x-axis: Mean of TruthCert and R values
- y-axis: Difference (TruthCert - R)
- Include: Mean difference line, 95% limits of agreement
- Show: 109 validation points

### Panel B: MCID Sensitivity
- x-axis: MCID threshold (OR scale: 0.7 to 1.4)
- y-axis: Percentage maintaining same verdict
- Show: BCG and SGLT2i datasets

### Panel C: ROC Curve
- x-axis: 1 - Specificity (0 to 1)
- y-axis: Sensitivity (0 to 1)
- Include: AUC value, diagonal reference line
- Data: Monte Carlo simulation results

### Panel D: Type I Error
- x-axis: tau (0, 0.1, 0.3, 0.5)
- y-axis: Type I error rate (0% to 10%)
- Include: 5% threshold line
- Show: k=5, k=10, k=20

### Caption
**Figure 3. Validation results.** (A) Bland-Altman plot comparing TruthCert-PairwisePro to R metafor package across 109 validation tests; mean difference 2.3 x 10^-7, limits of agreement within 10^-5. (B) MCID sensitivity analysis showing verdict stability across clinically meaningful threshold values. (C) ROC curve for verdict classification algorithm (AUC = 0.87, 95% CI: 0.84-0.90). (D) Type I error rate by heterogeneity level, demonstrating control below 5% threshold across all conditions.

---

## Figure 4: Health Technology Assessment Module

### Description
Screenshot showing HTA outputs for the SGLT2 inhibitor case study.

### Specifications
- **Dimensions**: 5.2 x 5.0 inches (1-column width)
- **Resolution**: 300 ppi
- **Format**: TIFF
- **Layout**: Vertical stack

### Panel Contents
| Panel | Content |
|-------|---------|
| A | Input parameters panel |
| B | ICER/NMB results with verdict adjustment |
| C | CEAC curve (probability cost-effective vs WTP) |
| D | EVPI calculation and recommendation |

### Caption
**Figure 4. Health Technology Assessment module outputs for SGLT2 inhibitor case study.** (A) Economic input parameters: intervention cost, comparator cost, QALY gains, time horizon, and discount rate. (B) Base-case results showing ICER ($32,450/QALY), NMB ($18,750), and verdict-adjusted WTP threshold. (C) Cost-effectiveness acceptability curve showing probability of cost-effectiveness across WTP thresholds ($0-$150,000/QALY). (D) Expected value of perfect information (EVPI = $2,340 per patient) and tier-based recommendation (Tier A: Full adoption recommended).

---

## Figure 5: Complete Analytical Workflow

### Description
Horizontal workflow diagram showing the complete analytical pipeline from data entry to HTA recommendation.

### Specifications
- **Dimensions**: 7.5 x 3.5 inches (2-column width)
- **Resolution**: 300 ppi
- **Format**: TIFF
- **Style**: Linear process diagram

### Workflow Steps
```
[1. DATA ENTRY] --> [2. EFFECT SIZE] --> [3. META-ANALYSIS] --> [4. THREAT ASSESSMENT] --> [5. VERDICT] --> [6. HTA ANALYSIS] --> [7. RECOMMENDATION]

   Binary/        Log OR,          REML,           12-point          STABLE/        ICER,          Tier A/B/C/D
   Continuous     SMD, etc.        HKSJ            ledger            MODERATE/      CEAC,
   data                                                              UNCERTAIN      EVPI
```

### Visual Elements
- Arrow connectors between stages
- Icons representing each stage
- Color gradient from blue (data) through green (analysis) to orange (decision)

### Caption
**Figure 5. Complete analytical workflow from data entry to HTA recommendation.** The seven-stage pipeline processes raw study data (1) through effect size calculation (2), random effects meta-analysis with REML estimator and HKSJ confidence intervals (3), 12-point threat assessment (4), verdict classification (5), health technology assessment with ICER, CEAC, and EVPI calculations (6), to generate tier-based adoption recommendations (7). The entire workflow executes in-browser with no external dependencies.

---

## Figure Checklist

| Figure | Content | Dimensions | Resolution | Format | Created |
|--------|---------|------------|------------|--------|---------|
| 1 | User Interface | 7.5 x 6.0 in | 300 ppi | TIFF | [ ] |
| 2 | Algorithm Flowchart | 7.5 x 8.0 in | 300 ppi | TIFF | [ ] |
| 3 | Validation Results | 7.5 x 6.0 in | 300 ppi | TIFF | [ ] |
| 4 | HTA Module | 5.2 x 5.0 in | 300 ppi | TIFF | [ ] |
| 5 | Workflow | 7.5 x 3.5 in | 300 ppi | TIFF | [ ] |

## File Naming Convention

```
Figure1_UserInterface.tif
Figure2_VerdictAlgorithm.tif
Figure3_ValidationResults.tif
Figure4_HTA_Module.tif
Figure5_Workflow.tif
```

---

## Tools for Figure Creation

| Tool | Use Case | Notes |
|------|----------|-------|
| **Screenshot** | Fig 1, 4 | Use Windows Snipping Tool at 1920x1080 |
| **draw.io** | Fig 2, 5 | Free diagramming, export as PNG then convert |
| **R/ggplot2** | Fig 3 | Statistical plots, export at 300 ppi |
| **GIMP/Photoshop** | All | Combine panels, add labels, convert to TIFF |
| **ImageMagick** | Conversion | `convert input.png -density 300 output.tif` |

## Notes for Author

1. All screenshots should be taken at highest available resolution
2. Remove any personal/identifying information before screenshotting
3. Use consistent fonts (Arial) across all figures
4. Ensure text is readable at final print size (minimum 8pt)
5. Color-blind friendly palette recommended
6. Save source files separately for potential revisions
