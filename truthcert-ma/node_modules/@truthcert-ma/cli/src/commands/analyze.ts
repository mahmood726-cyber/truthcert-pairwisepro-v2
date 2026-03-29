/**
 * Analyze command - Run meta-analysis
 */

import chalk from 'chalk';
import ora from 'ora';
import { table } from 'table';
import {
  MetaAnalysis,
  EffectMeasure,
  Tau2Estimator,
  ModelType,
  EffectSizeResult,
  BinaryStudy,
  ContinuousStudy
} from '@truthcert-ma/core';
import { loadData } from '../utils/data-loader';
import { writeOutput } from '../utils/output';

interface AnalyzeOptions {
  measure: string;
  model: string;
  estimator: string;
  confidence: string;
  output?: string;
  format: string;
  bias?: boolean;
  grade?: boolean;
  sensitivity?: boolean;
  clinical?: string;
  full?: boolean;
  quiet?: boolean;
}

export async function analyzeCommand(file: string, options: AnalyzeOptions): Promise<void> {
  const spinner = options.quiet ? null : ora('Loading data...').start();

  try {
    // Load data
    const data = await loadData(file);
    if (spinner) spinner.text = 'Running meta-analysis...';

    // Determine if data is effect sizes or raw data
    const isEffectSize = data.length > 0 && ('yi' in data[0] && 'vi' in data[0]);
    const typedData = data as unknown as Array<EffectSizeResult | BinaryStudy | ContinuousStudy>;

    // Create meta-analysis instance
    const ma = new MetaAnalysis(
      isEffectSize ? (typedData as EffectSizeResult[]) : undefined,
      {
        method: options.estimator.toUpperCase() as Tau2Estimator,
        model: options.model.toLowerCase() as ModelType,
        confidenceLevel: parseFloat(options.confidence),
        effectMeasure: options.measure.toUpperCase() as EffectMeasure
      }
    );

    // If raw data, calculate effect sizes first
    if (!isEffectSize) {
      ma.calculateEffects(
        typedData as unknown as BinaryStudy[] | ContinuousStudy[],
        options.measure.toUpperCase() as EffectMeasure
      );
    }

    // Run analysis based on options
    let result;
    if (options.full) {
      const clinicalOptions = options.clinical
        ? { baselineRisk: parseFloat(options.clinical) }
        : undefined;
      result = ma.runFull(clinicalOptions);
    } else {
      ma.pool().heterogeneity();

      if (options.bias) ma.publicationBias();
      if (options.grade) ma.grade();
      if (options.sensitivity) ma.sensitivity();
      if (options.clinical) {
        ma.clinical({ baselineRisk: parseFloat(options.clinical) });
      }

      result = ma.run();
    }

    if (spinner) spinner.succeed('Analysis complete');

    // Format and output results
    if (options.output) {
      await writeOutput(result, options.output, options.format);
      console.log(chalk.green(`\nResults saved to: ${options.output}`));
    } else {
      printResults(result, options);
    }

  } catch (error) {
    if (spinner) spinner.fail('Analysis failed');
    console.error(chalk.red(`\nError: ${(error as Error).message}`));
    process.exit(1);
  }
}

function printResults(result: any, options: AnalyzeOptions): void {
  console.log('\n' + chalk.cyan.bold('═'.repeat(60)));
  console.log(chalk.cyan.bold('                    META-ANALYSIS RESULTS'));
  console.log(chalk.cyan.bold('═'.repeat(60)));

  // Meta information
  console.log(chalk.yellow('\n📊 Analysis Settings'));
  console.log('─'.repeat(40));
  console.log(`Model: ${result.meta?.model || options.model}`);
  console.log(`Method: ${result.meta?.method || options.estimator}`);
  console.log(`Effect Measure: ${result.meta?.effectMeasure || options.measure}`);
  console.log(`Number of Studies: ${result.meta?.k || result.studies?.length || 'N/A'}`);

  // Pooled result
  if (result.pooled) {
    console.log(chalk.yellow('\n📈 Pooled Effect'));
    console.log('─'.repeat(40));

    const pooled = result.pooled;
    const isLogScale = ['OR', 'RR', 'logOR', 'logRR'].includes(options.measure.toUpperCase());

    console.log(`Effect (${isLogScale ? 'log scale' : 'raw'}): ${pooled.theta.toFixed(4)}`);
    console.log(`SE: ${pooled.se.toFixed(4)}`);
    console.log(`95% CI: [${pooled.ci.lower.toFixed(4)}, ${pooled.ci.upper.toFixed(4)}]`);
    console.log(`z: ${pooled.z.toFixed(3)}`);
    console.log(`p-value: ${pooled.p < 0.001 ? '<0.001' : pooled.p.toFixed(4)}`);

    if (isLogScale) {
      console.log(chalk.gray('\nExponentiated:'));
      console.log(`  ${options.measure.toUpperCase()}: ${Math.exp(pooled.theta).toFixed(4)}`);
      console.log(`  95% CI: [${Math.exp(pooled.ci.lower).toFixed(4)}, ${Math.exp(pooled.ci.upper).toFixed(4)}]`);
    }

    if (pooled.tau2 !== undefined) {
      console.log(chalk.gray('\nVariance Components:'));
      console.log(`  τ²: ${pooled.tau2.toFixed(6)}`);
      console.log(`  τ: ${Math.sqrt(pooled.tau2).toFixed(4)}`);
    }
  }

  // Heterogeneity
  if (result.heterogeneity) {
    console.log(chalk.yellow('\n📉 Heterogeneity'));
    console.log('─'.repeat(40));

    const het = result.heterogeneity;
    console.log(`Q: ${het.Q.value.toFixed(2)} (df = ${het.Q.df}, p = ${het.Q.p < 0.001 ? '<0.001' : het.Q.p.toFixed(4)})`);
    console.log(`I²: ${het.I2.toFixed(1)}%`);
    console.log(`H²: ${het.H2.toFixed(2)}`);

    if (het.predictionInterval) {
      console.log(`\nPrediction Interval: [${het.predictionInterval.lower.toFixed(4)}, ${het.predictionInterval.upper.toFixed(4)}]`);
    }

    // Interpretation
    let i2Interp = 'low';
    if (het.I2 >= 75) i2Interp = 'considerable';
    else if (het.I2 >= 50) i2Interp = 'substantial';
    else if (het.I2 >= 25) i2Interp = 'moderate';

    console.log(chalk.gray(`\nInterpretation: ${i2Interp} heterogeneity`));
  }

  // Publication bias
  if (result.bias) {
    console.log(chalk.yellow('\n📚 Publication Bias'));
    console.log('─'.repeat(40));

    if (result.bias.egger) {
      const egger = result.bias.egger;
      console.log(`Egger's test: intercept = ${egger.intercept.toFixed(3)}, p = ${egger.p < 0.001 ? '<0.001' : egger.p.toFixed(4)}`);
      console.log(`  ${egger.interpretation}`);
    }

    if (result.bias.begg) {
      const begg = result.bias.begg;
      console.log(`Begg's test: τ = ${begg.tau.toFixed(3)}, p = ${begg.p < 0.001 ? '<0.001' : begg.p.toFixed(4)}`);
    }

    if (result.bias.trimFill && result.bias.trimFill.k0 > 0) {
      const tf = result.bias.trimFill;
      console.log(`\nTrim-and-Fill: ${tf.k0} imputed studies (${tf.side} side)`);
      console.log(`  Adjusted effect: ${tf.adjusted.theta.toFixed(4)}`);
      console.log(`  Adjusted 95% CI: [${tf.adjusted.ci.lower.toFixed(4)}, ${tf.adjusted.ci.upper.toFixed(4)}]`);
    }
  }

  // GRADE
  if (result.grade) {
    console.log(chalk.yellow('\n⭐ GRADE Assessment'));
    console.log('─'.repeat(40));

    const certaintyColors: Record<string, any> = {
      high: chalk.green,
      moderate: chalk.yellow,
      low: chalk.red,
      very_low: chalk.bgRed.white
    };

    const certainty = result.grade.certainty;
    const colorFn = certaintyColors[certainty] || chalk.white;
    console.log(`Certainty: ${colorFn(certainty.toUpperCase())}`);
    console.log(`Total downgrades: ${result.grade.totalDowngrades}`);

    console.log('\nDomain Assessments:');
    const domains = result.grade.domains;
    Object.entries(domains).forEach(([key, value]: [string, any]) => {
      const rating = value.rating === 'none' ? chalk.green('✓') :
                     value.rating === 'serious' ? chalk.yellow('↓') :
                     chalk.red('↓↓');
      console.log(`  ${key}: ${rating} ${value.notes}`);
    });
  }

  // Clinical
  if (result.clinical) {
    console.log(chalk.yellow('\n💊 Clinical Translation'));
    console.log('─'.repeat(40));

    const clin = result.clinical;
    console.log(`NNT: ${clin.nnt}`);
    console.log(`NNT 95% CI: [${clin.ci.lower}, ${clin.ci.upper}]`);
    console.log(`ARR: ${(clin.arr * 100).toFixed(2)}%`);
    console.log(`\n${clin.interpretation}`);
  }

  // Sensitivity
  if (result.sensitivity) {
    console.log(chalk.yellow('\n🔍 Sensitivity Analysis'));
    console.log('─'.repeat(40));

    if (result.sensitivity.leaveOneOut) {
      console.log('\nLeave-One-Out Analysis:');
      const looData = result.sensitivity.leaveOneOut.map((loo: any) => [
        loo.omitted,
        loo.theta.toFixed(4),
        `[${loo.ci.lower.toFixed(4)}, ${loo.ci.upper.toFixed(4)}]`,
        `${loo.I2.toFixed(1)}%`
      ]);

      console.log(table([
        ['Omitted', 'Effect', '95% CI', 'I²'],
        ...looData
      ], {
        border: {
          topBody: '─',
          topJoin: '┬',
          topLeft: '┌',
          topRight: '┐',
          bottomBody: '─',
          bottomJoin: '┴',
          bottomLeft: '└',
          bottomRight: '┘',
          bodyLeft: '│',
          bodyRight: '│',
          bodyJoin: '│',
          joinBody: '─',
          joinLeft: '├',
          joinRight: '┤',
          joinJoin: '┼'
        }
      }));
    }

    if (result.sensitivity.influence) {
      const influential = result.sensitivity.influence.filter((i: any) => i.influential);
      if (influential.length > 0) {
        console.log(chalk.red(`\n⚠ ${influential.length} influential study/studies detected:`));
        influential.forEach((i: any) => {
          console.log(`  - ${i.study} (Cook's D: ${i.cooks.toFixed(3)}, DFFITS: ${i.dffits.toFixed(3)})`);
        });
      } else {
        console.log(chalk.green('\n✓ No influential studies detected'));
      }
    }
  }

  // Studies table
  if (result.studies && result.studies.length <= 20) {
    console.log(chalk.yellow('\n📋 Study Details'));
    console.log('─'.repeat(40));

    const studyData = result.studies.map((s: any, i: number) => [
      s.study || s.id || `Study ${i + 1}`,
      s.yi.toFixed(4),
      s.se.toFixed(4),
      result.pooled?.weights ? `${(result.pooled.weights[i] * 100).toFixed(1)}%` : 'N/A'
    ]);

    console.log(table([
      ['Study', 'Effect', 'SE', 'Weight'],
      ...studyData
    ]));
  }

  console.log('\n' + chalk.cyan.bold('═'.repeat(60)));
}
