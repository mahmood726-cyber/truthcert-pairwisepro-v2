# TruthCert-MA

A comprehensive, production-ready JavaScript/TypeScript library for meta-analysis. Validated against R's metafor package.

[![npm version](https://badge.fury.io/js/truthcert-ma.svg)](https://www.npmjs.com/package/truthcert-ma)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Complete Meta-Analysis Engine**: Effect sizes, pooling, heterogeneity, publication bias
- **Multiple Access Methods**: CLI, Node.js, Browser, REST API
- **Plugin System**: Extend with custom estimators, parsers, outputs
- **Validated**: Tested against R metafor package
- **TypeScript**: Full type definitions included
- **Zero Dependencies** (core): Pure statistical calculations

## Quick Start

### CLI

```bash
# Install globally
npm install -g truthcert-ma

# Run analysis
tcma analyze studies.csv --method REML --output results.json

# Generate forest plot
tcma forest studies.csv --output forest.svg

# Interactive mode
tcma interactive
```

### Node.js

```javascript
import { MetaAnalysis, EffectSize } from 'truthcert-ma';

// Your study data
const studies = [
  { id: 'Study1', ai: 10, bi: 90, ci: 20, di: 80 },
  { id: 'Study2', ai: 15, bi: 85, ci: 25, di: 75 },
];

// Calculate effect sizes
const effects = studies.map(s => EffectSize.logOddsRatio(s));

// Run meta-analysis
const ma = new MetaAnalysis(effects, { method: 'REML' });
const results = ma.run();

console.log(results.pooled);
// { theta: -0.65, se: 0.23, ci: { lower: -1.10, upper: -0.20 }, p: 0.004 }
```

### Browser

```html
<script src="https://cdn.jsdelivr.net/npm/truthcert-ma/dist/tcma.min.js"></script>
<script>
  const results = TCMA.analyze(studies, { method: 'REML' });
  console.log(results);
</script>
```

### REST API

```bash
# Start server
tcma serve --port 3000

# Call API
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"studies": [...], "options": {"method": "REML"}}'
```

## Packages

| Package | Description |
|---------|-------------|
| `truthcert-ma` | Main package with CLI |
| `@truthcert-ma/core` | Core statistical engine |
| `@truthcert-ma/parsers` | Data format parsers |
| `@truthcert-ma/output` | Output formatters |
| `@truthcert-ma/plugins` | Plugin manager |
| `@truthcert-ma/server` | REST API server |
| `@truthcert-ma/browser` | Browser bundle |

## Statistical Methods

### Effect Sizes
- Odds Ratio (OR), Risk Ratio (RR), Risk Difference (RD)
- Standardized Mean Difference (SMD/Hedges' g)
- Mean Difference (MD)
- Correlation coefficients

### Pooling Methods
- Fixed Effects (Inverse Variance, Mantel-Haenszel, Peto)
- Random Effects with multiple τ² estimators:
  - REML (Restricted Maximum Likelihood)
  - DerSimonian-Laird (DL)
  - Paule-Mandel (PM)
  - Sidik-Jonkman (SJ)
  - Hunter-Schmidt (HS)
  - Hedges (HE)
  - Empirical Bayes (EB)
  - Maximum Likelihood (ML)

### Heterogeneity
- Q statistic with p-value
- I² (inconsistency)
- τ² (between-study variance)
- H² statistic
- Prediction intervals

### Publication Bias
- Funnel plot data
- Egger's regression test
- Begg's rank correlation
- Trim-and-fill analysis

### Clinical Translation
- NNT/NNH (Number Needed to Treat/Harm)
- Absolute Risk Reduction (ARR)
- Relative Risk Reduction (RRR)

### Additional Features
- GRADE assessment (auto and manual)
- Sensitivity analysis (leave-one-out, influence)
- Cumulative meta-analysis
- Subgroup analysis
- Meta-regression

## Plugin Development

```javascript
// my-plugin.js
export default {
  name: 'my-custom-plugin',
  version: '1.0.0',
  hooks: {
    'estimator:register': (registry) => {
      registry.add('MY_METHOD', myEstimatorFunction);
    }
  }
};

// Use plugin
import TCMA from 'truthcert-ma';
import myPlugin from './my-plugin.js';
TCMA.use(myPlugin);
```

## Configuration

Create `tcma.config.yaml`:

```yaml
analysis:
  effectMeasure: OR
  method: REML
  confidenceLevel: 0.95

output:
  - format: json
    file: results.json
  - format: html
    file: report.html
```

Run with: `tcma analyze data.csv --config tcma.config.yaml`

## Validation

TruthCert-MA is validated against R's metafor package. Run validation:

```bash
tcma validate --dataset bcg
# Output: All tests passed (theta: ✓, se: ✓, tau2: ✓, I2: ✓)
```

## Documentation

- [Getting Started](docs/getting-started.md)
- [CLI Reference](docs/cli-reference.md)
- [API Reference](docs/api-reference.md)
- [Plugin Development](docs/plugin-development.md)
- [Statistical Methods](docs/statistical-methods.md)

## Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT License - see [LICENSE](LICENSE)

## Citation

If you use TruthCert-MA in your research, please cite:

```bibtex
@software{truthcert_ma,
  title = {TruthCert-MA: A JavaScript Library for Meta-Analysis},
  year = {2024},
  url = {https://github.com/truthcert/truthcert-ma}
}
```
