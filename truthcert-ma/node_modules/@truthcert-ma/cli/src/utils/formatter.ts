export function formatOutput(result: any, format: string): string {
  const fmt = format.toLowerCase();

  if (fmt === 'json') {
    return JSON.stringify(result, null, 2);
  }

  if (fmt === 'text') {
    const pooled = result?.pooled;
    const heterogeneity = result?.heterogeneity;
    const lines = [
      'TruthCert-MA Analysis Result',
      pooled ? `theta: ${pooled.theta}` : 'theta: N/A',
      pooled ? `se: ${pooled.se}` : 'se: N/A',
      pooled ? `ci: [${pooled.ci?.lower}, ${pooled.ci?.upper}]` : 'ci: N/A',
      heterogeneity ? `I2: ${heterogeneity.I2}` : 'I2: N/A'
    ];
    return `${lines.join('\n')}\n`;
  }

  if (fmt === 'csv') {
    const pooled = result?.pooled ?? {};
    const heterogeneity = result?.heterogeneity ?? {};
    return [
      'metric,value',
      `theta,${pooled.theta ?? ''}`,
      `se,${pooled.se ?? ''}`,
      `ci_lower,${pooled.ci?.lower ?? ''}`,
      `ci_upper,${pooled.ci?.upper ?? ''}`,
      `p_value,${pooled.p ?? ''}`,
      `i2,${heterogeneity.I2 ?? ''}`
    ].join('\n');
  }

  if (fmt === 'html') {
    const json = JSON.stringify(result, null, 2)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<!doctype html><html><body><pre>${json}</pre></body></html>`;
  }

  throw new Error(`Unsupported output format: ${format}`);
}
