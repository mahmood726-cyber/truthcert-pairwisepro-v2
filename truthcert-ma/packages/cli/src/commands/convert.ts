/**
 * Convert command - Convert between data formats
 */

import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs';
import * as path from 'path';
import { loadData } from '../utils/data-loader';

interface ConvertOptions {
  from?: string;
  to?: string;
}

export async function convertCommand(
  input: string,
  output: string,
  options: ConvertOptions
): Promise<void> {
  const spinner = ora('Converting...').start();

  try {
    // Load input data
    const data = await loadData(input);
    spinner.text = 'Writing output...';

    // Determine output format
    const outputFormat = options.to || path.extname(output).slice(1).toLowerCase();

    let outputContent: string;

    switch (outputFormat) {
      case 'json':
        outputContent = JSON.stringify(data, null, 2);
        break;

      case 'csv':
        outputContent = convertToCSV(data);
        break;

      case 'tsv':
        outputContent = convertToCSV(data, '\t');
        break;

      default:
        throw new Error(`Unsupported output format: ${outputFormat}`);
    }

    // Write output
    fs.writeFileSync(output, outputContent, 'utf-8');

    spinner.succeed('Conversion complete');
    console.log(chalk.green(`\nOutput saved to: ${output}`));
    console.log(`Records converted: ${data.length}`);

  } catch (error) {
    spinner.fail('Conversion failed');
    console.error(chalk.red(`\nError: ${(error as Error).message}`));
    process.exit(1);
  }
}

function convertToCSV(data: any[], delimiter = ','): string {
  if (data.length === 0) return '';

  // Get all unique keys
  const keys = new Set<string>();
  data.forEach(row => {
    Object.keys(row).forEach(key => keys.add(key));
  });

  const headers = Array.from(keys);

  // Create CSV content
  const rows = [
    headers.join(delimiter),
    ...data.map(row =>
      headers.map(key => {
        const value = row[key];
        if (value === undefined || value === null) return '';
        if (typeof value === 'string' && value.includes(delimiter)) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      }).join(delimiter)
    )
  ];

  return rows.join('\n');
}
