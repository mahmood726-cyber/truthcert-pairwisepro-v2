/**
 * Interactive command - Interactive meta-analysis session
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { MetaAnalysis, EffectMeasure, Tau2Estimator } from '@truthcert-ma/core';
import { loadData } from '../utils/data-loader';

export async function interactiveCommand(): Promise<void> {
  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════╗
║              TruthCert-MA Interactive Mode                    ║
║         Step-by-step Meta-Analysis Configuration              ║
╚═══════════════════════════════════════════════════════════════╝
`));

  try {
    // Step 1: Data source
    const { dataSource } = await inquirer.prompt([
      {
        type: 'list',
        name: 'dataSource',
        message: 'How would you like to input data?',
        choices: [
          { name: 'Load from file (CSV, JSON)', value: 'file' },
          { name: 'Enter data manually', value: 'manual' },
          { name: 'Use demo dataset', value: 'demo' }
        ]
      }
    ]);

    let data: any[];

    if (dataSource === 'file') {
      const { filePath } = await inquirer.prompt([
        {
          type: 'input',
          name: 'filePath',
          message: 'Enter file path:',
          validate: (input) => input.length > 0 || 'Please enter a file path'
        }
      ]);

      const spinner = ora('Loading data...').start();
      try {
        data = await loadData(filePath);
        spinner.succeed(`Loaded ${data.length} studies`);
      } catch (error) {
        spinner.fail('Failed to load file');
        console.error(chalk.red((error as Error).message));
        return;
      }
    } else if (dataSource === 'demo') {
      const { demoType } = await inquirer.prompt([
        {
          type: 'list',
          name: 'demoType',
          message: 'Select demo dataset:',
          choices: [
            { name: 'Binary outcomes (Aspirin for MI)', value: 'binary' },
            { name: 'Continuous outcomes (CBT for depression)', value: 'continuous' },
            { name: 'Effect sizes (Pre-calculated)', value: 'effect' }
          ]
        }
      ]);

      data = getDemoData(demoType);
      console.log(chalk.green(`✓ Loaded demo dataset: ${data.length} studies`));
    } else {
      data = await enterDataManually();
    }

    // Step 2: Detect or select data type
    const isEffectSize = data.length > 0 && 'yi' in data[0] && 'vi' in data[0];
    const isBinary = data.length > 0 && 'ai' in data[0] && 'bi' in data[0] && 'ci' in data[0] && 'di' in data[0];

    let effectMeasure: EffectMeasure;

    if (isEffectSize) {
      console.log(chalk.gray('Detected: Pre-calculated effect sizes'));
      const { measure } = await inquirer.prompt([
        {
          type: 'list',
          name: 'measure',
          message: 'What effect measure are these?',
          choices: ['logOR', 'logRR', 'RD', 'SMD', 'MD', 'COR']
        }
      ]);
      effectMeasure = measure;
    } else if (isBinary) {
      console.log(chalk.gray('Detected: Binary outcome data'));
      const { measure } = await inquirer.prompt([
        {
          type: 'list',
          name: 'measure',
          message: 'Select effect measure:',
          choices: [
            { name: 'Odds Ratio (OR)', value: 'OR' },
            { name: 'Risk Ratio (RR)', value: 'RR' },
            { name: 'Risk Difference (RD)', value: 'RD' }
          ]
        }
      ]);
      effectMeasure = measure;
    } else {
      console.log(chalk.gray('Detected: Continuous outcome data'));
      const { measure } = await inquirer.prompt([
        {
          type: 'list',
          name: 'measure',
          message: 'Select effect measure:',
          choices: [
            { name: 'Standardized Mean Difference (SMD)', value: 'SMD' },
            { name: 'Mean Difference (MD)', value: 'MD' }
          ]
        }
      ]);
      effectMeasure = measure;
    }

    // Step 3: Model selection
    const { model, estimator } = await inquirer.prompt([
      {
        type: 'list',
        name: 'model',
        message: 'Select model:',
        choices: [
          { name: 'Random effects (recommended)', value: 'random' },
          { name: 'Fixed effects', value: 'fixed' }
        ]
      },
      {
        type: 'list',
        name: 'estimator',
        message: 'Select τ² estimator:',
        choices: [
          { name: 'REML (Restricted Maximum Likelihood) - recommended', value: 'REML' },
          { name: 'DL (DerSimonian-Laird)', value: 'DL' },
          { name: 'PM (Paule-Mandel)', value: 'PM' },
          { name: 'SJ (Sidik-Jonkman)', value: 'SJ' },
          { name: 'ML (Maximum Likelihood)', value: 'ML' }
        ],
        when: (answers) => answers.model === 'random'
      }
    ]);

    // Step 4: Additional analyses
    const { additionalAnalyses } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'additionalAnalyses',
        message: 'Select additional analyses:',
        choices: [
          { name: 'Publication bias assessment', value: 'bias', checked: true },
          { name: 'Sensitivity analysis (leave-one-out)', value: 'sensitivity' },
          { name: 'GRADE assessment', value: 'grade' },
          { name: 'Clinical translation (NNT)', value: 'clinical' }
        ]
      }
    ]);

    let baselineRisk: number | undefined;
    if (additionalAnalyses.includes('clinical')) {
      const { baseline } = await inquirer.prompt([
        {
          type: 'input',
          name: 'baseline',
          message: 'Enter baseline risk (0-1):',
          default: '0.1',
          validate: (input) => {
            const num = parseFloat(input);
            return (num > 0 && num < 1) || 'Enter a value between 0 and 1';
          }
        }
      ]);
      baselineRisk = parseFloat(baseline);
    }

    // Run analysis
    console.log(chalk.cyan('\n▶ Running meta-analysis...\n'));
    const spinner = ora('Calculating...').start();

    const ma = new MetaAnalysis(
      isEffectSize ? data : undefined,
      {
        method: estimator as Tau2Estimator || 'REML',
        model: model,
        effectMeasure: effectMeasure
      }
    );

    if (!isEffectSize) {
      ma.calculateEffects(data as any, effectMeasure);
    }

    ma.pool().heterogeneity();

    if (additionalAnalyses.includes('bias')) ma.publicationBias();
    if (additionalAnalyses.includes('sensitivity')) ma.sensitivity();
    if (additionalAnalyses.includes('grade')) ma.grade();
    if (additionalAnalyses.includes('clinical') && baselineRisk) {
      ma.clinical({ baselineRisk });
    }

    const result = ma.run();
    spinner.succeed('Analysis complete!');

    // Display results
    displayInteractiveResults(result, effectMeasure);

    // Ask about saving
    const { saveResults } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'saveResults',
        message: 'Would you like to save the results?',
        default: false
      }
    ]);

    if (saveResults) {
      const { outputPath, outputFormat } = await inquirer.prompt([
        {
          type: 'input',
          name: 'outputPath',
          message: 'Enter output file path:',
          default: 'meta-analysis-results.json'
        },
        {
          type: 'list',
          name: 'outputFormat',
          message: 'Select output format:',
          choices: ['json', 'csv']
        }
      ]);

      const fs = require('fs');
      if (outputFormat === 'json') {
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
      } else {
        // Simplified CSV output
        const csv = `Effect,SE,CI_Lower,CI_Upper,p_value,I2\n${result.pooled?.theta},${result.pooled?.se},${result.pooled?.ci.lower},${result.pooled?.ci.upper},${result.pooled?.p},${result.heterogeneity?.I2}`;
        fs.writeFileSync(outputPath, csv);
      }
      console.log(chalk.green(`\n✓ Results saved to: ${outputPath}`));
    }

  } catch (error) {
    if ((error as any).isTtyError) {
      console.error(chalk.red('Interactive mode not supported in this environment'));
    } else {
      console.error(chalk.red('Error:'), (error as Error).message);
    }
  }
}

function getDemoData(type: string): any[] {
  if (type === 'binary') {
    return [
      { study: 'ISIS-2', ai: 461, bi: 8587 - 461, ci: 568, di: 8600 - 568 },
      { study: 'GISSI-2', ai: 1016, bi: 10372 - 1016, ci: 1120, di: 10396 - 1120 },
      { study: 'GUSTO', ai: 2128, bi: 20173 - 2128, ci: 2369, di: 20320 - 2369 },
      { study: 'ASSENT-2', ai: 1126, bi: 8461 - 1126, ci: 1163, di: 8488 - 1163 },
      { study: 'GUSTO-III', ai: 628, bi: 4921 - 628, ci: 667, di: 5011 - 667 }
    ];
  } else if (type === 'continuous') {
    return [
      { study: 'Beck 1979', m1i: 12.3, sd1i: 4.2, n1i: 25, m2i: 18.7, sd2i: 5.1, n2i: 23 },
      { study: 'Rush 1977', m1i: 11.8, sd1i: 3.9, n1i: 30, m2i: 17.2, sd2i: 4.5, n2i: 28 },
      { study: 'Shaw 1999', m1i: 13.5, sd1i: 4.8, n1i: 45, m2i: 19.1, sd2i: 5.3, n2i: 42 },
      { study: 'Butler 2006', m1i: 10.9, sd1i: 3.6, n1i: 60, m2i: 16.4, sd2i: 4.2, n2i: 58 },
      { study: 'Dobson 2008', m1i: 11.2, sd1i: 4.1, n1i: 35, m2i: 17.8, sd2i: 4.9, n2i: 33 }
    ];
  } else {
    return [
      { study: 'Study 1', yi: -0.45, vi: 0.08 },
      { study: 'Study 2', yi: -0.32, vi: 0.05 },
      { study: 'Study 3', yi: -0.61, vi: 0.12 },
      { study: 'Study 4', yi: -0.28, vi: 0.04 },
      { study: 'Study 5', yi: -0.55, vi: 0.09 },
      { study: 'Study 6', yi: -0.38, vi: 0.06 }
    ];
  }
}

async function enterDataManually(): Promise<any[]> {
  const { dataType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'dataType',
      message: 'What type of data?',
      choices: [
        { name: 'Binary outcomes', value: 'binary' },
        { name: 'Continuous outcomes', value: 'continuous' },
        { name: 'Pre-calculated effect sizes', value: 'effect' }
      ]
    }
  ]);

  const data: any[] = [];
  let addMore = true;
  let studyNum = 1;

  while (addMore) {
    console.log(chalk.cyan(`\n--- Study ${studyNum} ---`));

    let study: any;

    if (dataType === 'binary') {
      const input = await inquirer.prompt([
        { type: 'input', name: 'study', message: 'Study name:', default: `Study ${studyNum}` },
        { type: 'number', name: 'events1', message: 'Events (treatment):' },
        { type: 'number', name: 'total1', message: 'Total (treatment):' },
        { type: 'number', name: 'events2', message: 'Events (control):' },
        { type: 'number', name: 'total2', message: 'Total (control):' }
      ]);
      study = {
        study: input.study,
        ai: input.events1,
        bi: input.total1 - input.events1,
        ci: input.events2,
        di: input.total2 - input.events2
      };
    } else if (dataType === 'continuous') {
      const input = await inquirer.prompt([
        { type: 'input', name: 'study', message: 'Study name:', default: `Study ${studyNum}` },
        { type: 'number', name: 'mean1', message: 'Mean (treatment):' },
        { type: 'number', name: 'sd1', message: 'SD (treatment):' },
        { type: 'number', name: 'n1', message: 'N (treatment):' },
        { type: 'number', name: 'mean2', message: 'Mean (control):' },
        { type: 'number', name: 'sd2', message: 'SD (control):' },
        { type: 'number', name: 'n2', message: 'N (control):' }
      ]);
      study = {
        study: input.study,
        m1i: input.mean1,
        sd1i: input.sd1,
        n1i: input.n1,
        m2i: input.mean2,
        sd2i: input.sd2,
        n2i: input.n2
      };
    } else {
      study = await inquirer.prompt([
        { type: 'input', name: 'study', message: 'Study name:', default: `Study ${studyNum}` },
        { type: 'number', name: 'yi', message: 'Effect size (yi):' },
        { type: 'number', name: 'vi', message: 'Variance (vi):' }
      ]);
    }

    data.push(study);
    studyNum++;

    const { continueAdding } = await inquirer.prompt([
      { type: 'confirm', name: 'continueAdding', message: 'Add another study?', default: true }
    ]);
    addMore = continueAdding;
  }

  return data;
}

function displayInteractiveResults(result: any, effectMeasure: string): void {
  console.log(chalk.cyan.bold('\n' + '═'.repeat(60)));
  console.log(chalk.cyan.bold('                    RESULTS SUMMARY'));
  console.log(chalk.cyan.bold('═'.repeat(60)));

  const pooled = result.pooled;
  const het = result.heterogeneity;
  const isLogScale = ['OR', 'RR', 'logOR', 'logRR'].includes(effectMeasure);

  console.log(chalk.yellow('\n📈 Pooled Effect:'));
  if (isLogScale) {
    console.log(`  ${effectMeasure}: ${Math.exp(pooled.theta).toFixed(3)} [${Math.exp(pooled.ci.lower).toFixed(3)}, ${Math.exp(pooled.ci.upper).toFixed(3)}]`);
    console.log(chalk.gray(`  (log scale: ${pooled.theta.toFixed(4)})`));
  } else {
    console.log(`  ${effectMeasure}: ${pooled.theta.toFixed(3)} [${pooled.ci.lower.toFixed(3)}, ${pooled.ci.upper.toFixed(3)}]`);
  }
  console.log(`  p-value: ${pooled.p < 0.001 ? '<0.001' : pooled.p.toFixed(4)}`);

  console.log(chalk.yellow('\n📉 Heterogeneity:'));
  console.log(`  I²: ${het.I2.toFixed(1)}%`);
  console.log(`  τ²: ${(pooled.tau2 || 0).toFixed(4)}`);

  if (result.bias) {
    console.log(chalk.yellow('\n📚 Publication Bias:'));
    console.log(`  Egger's p: ${result.bias.egger?.p?.toFixed(4) || 'N/A'}`);
    if (result.bias.trimFill?.k0 > 0) {
      console.log(`  Trim-and-fill: ${result.bias.trimFill.k0} imputed studies`);
    }
  }

  if (result.grade) {
    console.log(chalk.yellow('\n⭐ GRADE Certainty:'));
    const colors: Record<string, any> = {
      high: chalk.green,
      moderate: chalk.yellow,
      low: chalk.red,
      very_low: chalk.bgRed
    };
    console.log(`  ${colors[result.grade.certainty](result.grade.certainty.toUpperCase())}`);
  }

  if (result.clinical) {
    console.log(chalk.yellow('\n💊 Clinical Translation:'));
    console.log(`  ${result.clinical.interpretation}`);
  }

  console.log('\n' + chalk.cyan.bold('═'.repeat(60)));
}
