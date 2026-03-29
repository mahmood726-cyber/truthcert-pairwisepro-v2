#!/usr/bin/env node
/**
 * TruthCert-MA CLI
 * Command-line interface for meta-analysis
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { VERSION } from '@truthcert-ma/core';
import { analyzeCommand } from './commands/analyze';
import { convertCommand } from './commands/convert';
import { validateCommand } from './commands/validate';
import { interactiveCommand } from './commands/interactive';
import { forestCommand } from './commands/forest';

const program = new Command();

program
  .name('truthcert-ma')
  .description('TruthCert-MA: A comprehensive meta-analysis CLI tool')
  .version(VERSION, '-v, --version', 'Output the current version')
  .addHelpText('before', chalk.cyan(`
╔═══════════════════════════════════════════════════════════════╗
║                     TruthCert-MA v${VERSION}                      ║
║          Comprehensive Meta-Analysis Command Line Tool         ║
╚═══════════════════════════════════════════════════════════════╝
`));

// Main analyze command
program
  .command('analyze')
  .alias('run')
  .description('Run a meta-analysis on input data')
  .argument('<file>', 'Input data file (CSV, TSV, or JSON)')
  .option('-m, --measure <type>', 'Effect measure (OR, RR, RD, SMD, MD)', 'OR')
  .option('-M, --model <type>', 'Model type (fixed, random)', 'random')
  .option('-e, --estimator <type>', 'Tau² estimator (REML, DL, PM, SJ, HS, HE, EB, ML)', 'REML')
  .option('-c, --confidence <level>', 'Confidence level', '0.95')
  .option('-o, --output <file>', 'Output file (JSON, CSV, or HTML)')
  .option('-f, --format <type>', 'Output format (json, csv, html, text)', 'text')
  .option('--bias', 'Include publication bias analysis')
  .option('--grade', 'Include GRADE assessment')
  .option('--sensitivity', 'Include sensitivity analysis')
  .option('--clinical <baseline>', 'Calculate NNT with baseline risk')
  .option('--full', 'Run full analysis with all options')
  .option('-q, --quiet', 'Suppress progress output')
  .action(analyzeCommand);

// Convert command
program
  .command('convert')
  .description('Convert between data formats')
  .argument('<input>', 'Input file')
  .argument('<output>', 'Output file')
  .option('--from <format>', 'Input format (auto-detected if not specified)')
  .option('--to <format>', 'Output format (inferred from extension if not specified)')
  .action(convertCommand);

// Validate command
program
  .command('validate')
  .description('Validate input data format')
  .argument('<file>', 'File to validate')
  .option('-s, --strict', 'Use strict validation')
  .action(validateCommand);

// Interactive mode
program
  .command('interactive')
  .alias('i')
  .description('Start interactive meta-analysis session')
  .action(interactiveCommand);

// Forest plot command
program
  .command('forest')
  .description('Generate forest plot data')
  .argument('<file>', 'Input data file')
  .option('-m, --measure <type>', 'Effect measure for raw input (OR, RR, RD, SMD, MD)')
  .option('-o, --output <file>', 'Output file for plot data')
  .option('--svg', 'Generate SVG output')
  .option('--ascii', 'Generate ASCII art forest plot')
  .action(forestCommand);

// Effect size calculator
program
  .command('effect')
  .description('Calculate effect size from raw data')
  .option('--binary <data>', 'Binary data: "e1,n1,e2,n2"')
  .option('--continuous <data>', 'Continuous data: "m1,sd1,n1,m2,sd2,n2"')
  .option('-m, --measure <type>', 'Effect measure (OR, RR, RD, SMD, MD)', 'OR')
  .action((options) => {
    const { logOddsRatio, logRiskRatio, riskDifference, standardizedMeanDifference, meanDifference } = require('@truthcert-ma/core');

    if (options.binary) {
      const [e1, n1, e2, n2] = options.binary.split(',').map(Number);
      const study = {
        ai: e1,
        bi: n1 - e1,
        ci: e2,
        di: n2 - e2
      };

      let result;
      switch (options.measure.toUpperCase()) {
        case 'RR': result = logRiskRatio(study); break;
        case 'RD': result = riskDifference(study); break;
        default: result = logOddsRatio(study);
      }

      console.log(chalk.cyan('\nEffect Size Calculation'));
      console.log('━'.repeat(40));
      console.log(`Measure: ${options.measure.toUpperCase()}`);
      console.log(`Effect (yi): ${result.yi.toFixed(4)}`);
      console.log(`Variance (vi): ${result.vi.toFixed(6)}`);
      console.log(`SE: ${result.se.toFixed(4)}`);

      if (options.measure.toUpperCase() !== 'RD') {
        console.log(`\nExponentiated: ${Math.exp(result.yi).toFixed(4)}`);
        console.log(`95% CI: [${Math.exp(result.yi - 1.96 * result.se).toFixed(4)}, ${Math.exp(result.yi + 1.96 * result.se).toFixed(4)}]`);
      }
    }

    if (options.continuous) {
      const [m1, sd1, n1, m2, sd2, n2] = options.continuous.split(',').map(Number);
      const study = { m1i: m1, sd1i: sd1, n1i: n1, m2i: m2, sd2i: sd2, n2i: n2 };

      let result;
      if (options.measure.toUpperCase() === 'MD') {
        result = meanDifference(study);
      } else {
        result = standardizedMeanDifference(study);
      }

      console.log(chalk.cyan('\nEffect Size Calculation'));
      console.log('━'.repeat(40));
      console.log(`Measure: ${options.measure.toUpperCase()}`);
      console.log(`Effect (yi): ${result.yi.toFixed(4)}`);
      console.log(`Variance (vi): ${result.vi.toFixed(6)}`);
      console.log(`SE: ${result.se.toFixed(4)}`);
      console.log(`95% CI: [${(result.yi - 1.96 * result.se).toFixed(4)}, ${(result.yi + 1.96 * result.se).toFixed(4)}]`);
    }
  });

// Parse and execute
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
