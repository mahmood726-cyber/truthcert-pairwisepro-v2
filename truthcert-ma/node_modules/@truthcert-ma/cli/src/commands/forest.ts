/**
 * Forest command - Generate forest plot data/visualization
 */

import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs';
import { MetaAnalysis, EffectMeasure } from '@truthcert-ma/core';
import { loadData } from '../utils/data-loader';

interface ForestOptions {
  output?: string;
  svg?: boolean;
  ascii?: boolean;
  measure?: string;
}

export async function forestCommand(file: string, options: ForestOptions): Promise<void> {
  const spinner = ora('Loading data...').start();

  try {
    const data = await loadData(file);
    spinner.text = 'Generating forest plot data...';

    const isEffectSize = data.length > 0 && ('yi' in data[0] && 'vi' in data[0]);
    const isBinary = data.length > 0 && ('ai' in data[0] && 'bi' in data[0] && 'ci' in data[0] && 'di' in data[0]);
    const defaultMeasure: EffectMeasure = isBinary ? 'OR' : 'SMD';
    const selectedMeasure = (options.measure?.toUpperCase() as EffectMeasure | undefined) || defaultMeasure;

    // Run meta-analysis
    const ma = new MetaAnalysis(
      isEffectSize ? (data as any) : undefined,
      { method: 'REML', model: 'random', effectMeasure: selectedMeasure }
    );
    if (!isEffectSize) {
      ma.calculateEffects(data as any, selectedMeasure);
    }
    ma.pool();

    const forestData = ma.getForestPlotData();
    spinner.succeed('Forest plot data generated');

    if (options.ascii) {
      printAsciiForest(forestData);
    }

    if (options.output) {
      const outputData = {
        studies: forestData.studies,
        pooled: forestData.pooled,
        meta: {
          generated: new Date().toISOString(),
          tool: 'truthcert-ma'
        }
      };

      fs.writeFileSync(options.output, JSON.stringify(outputData, null, 2));
      console.log(chalk.green(`\nForest plot data saved to: ${options.output}`));
    }

    if (!options.ascii && !options.output) {
      // Print JSON to stdout
      console.log(JSON.stringify(forestData, null, 2));
    }

  } catch (error) {
    spinner.fail('Failed to generate forest plot');
    console.error(chalk.red(`\nError: ${(error as Error).message}`));
    process.exit(1);
  }
}

function printAsciiForest(data: any): void {
  console.log(chalk.cyan('\n' + '═'.repeat(80)));
  console.log(chalk.cyan.bold('                           ASCII FOREST PLOT'));
  console.log(chalk.cyan('═'.repeat(80)));

  const width = 50;
  const minEffect = Math.min(
    ...data.studies.map((s: any) => s.ci.lower),
    data.pooled.ci.lower
  );
  const maxEffect = Math.max(
    ...data.studies.map((s: any) => s.ci.upper),
    data.pooled.ci.upper
  );

  const range = maxEffect - minEffect;
  const scale = width / range;

  const toPosition = (value: number) => Math.round((value - minEffect) * scale);
  const nullPosition = toPosition(0);

  // Header
  console.log('\n' + ' '.repeat(25) + chalk.gray('Favors Treatment') + ' '.repeat(10) + chalk.gray('Favors Control'));

  // Scale
  const scaleMin = minEffect.toFixed(2);
  const scaleMax = maxEffect.toFixed(2);
  console.log(' '.repeat(20) + scaleMin + ' '.repeat(width - scaleMin.length - scaleMax.length) + scaleMax);
  console.log(' '.repeat(20) + '├' + '─'.repeat(width - 2) + '┤');

  // Studies
  data.studies.forEach((study: any) => {
    const name = (study.id || '').padEnd(18).slice(0, 18);
    const effectStr = study.yi.toFixed(2).padStart(6);

    const ciLower = toPosition(study.ci.lower);
    const ciUpper = toPosition(study.ci.upper);
    const effectPos = toPosition(study.yi);

    let line = ' '.repeat(width);
    const lineArr = line.split('');

    // Draw CI line
    for (let i = ciLower; i <= ciUpper && i < width; i++) {
      if (i >= 0) lineArr[i] = '─';
    }

    // Draw effect point
    if (effectPos >= 0 && effectPos < width) {
      lineArr[effectPos] = '■';
    }

    // Draw null line
    if (nullPosition >= 0 && nullPosition < width) {
      lineArr[nullPosition] = lineArr[nullPosition] === '─' ? '┼' : '│';
    }

    const weightBar = '█'.repeat(Math.round(study.weight / 5));
    console.log(`${name} ${effectStr} │${lineArr.join('')}│ ${weightBar} ${study.weight.toFixed(1)}%`);
  });

  // Separator
  console.log(' '.repeat(20) + '├' + '─'.repeat(width - 2) + '┤');

  // Pooled effect
  {
    const name = 'POOLED'.padEnd(18);
    const effectStr = data.pooled.yi.toFixed(2).padStart(6);

    const ciLower = toPosition(data.pooled.ci.lower);
    const ciUpper = toPosition(data.pooled.ci.upper);
    const effectPos = toPosition(data.pooled.yi);

    let line = ' '.repeat(width);
    const lineArr = line.split('');

    // Draw CI line
    for (let i = ciLower; i <= ciUpper && i < width; i++) {
      if (i >= 0) lineArr[i] = '═';
    }

    // Draw effect diamond
    if (effectPos >= 0 && effectPos < width) {
      lineArr[effectPos] = '◆';
    }

    // Draw null line
    if (nullPosition >= 0 && nullPosition < width) {
      lineArr[nullPosition] = lineArr[nullPosition] === '═' ? '╪' : '│';
    }

    console.log(chalk.bold(`${name} ${effectStr} │${lineArr.join('')}│`));
  }

  // Footer
  console.log(' '.repeat(20) + '└' + '─'.repeat(width - 2) + '┘');
  console.log(chalk.cyan('═'.repeat(80)));

  // Legend
  console.log(chalk.gray('\nLegend: ■ = Study effect, ◆ = Pooled effect, ─ = 95% CI'));
  console.log(chalk.gray('        │ = Null effect (0), Weight shown as bar + percentage\n'));
}
