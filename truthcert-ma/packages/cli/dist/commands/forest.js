"use strict";
/**
 * Forest command - Generate forest plot data/visualization
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forestCommand = void 0;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const fs = __importStar(require("fs"));
const core_1 = require("@truthcert-ma/core");
const data_loader_1 = require("../utils/data-loader");
async function forestCommand(file, options) {
    const spinner = (0, ora_1.default)('Loading data...').start();
    try {
        const data = await (0, data_loader_1.loadData)(file);
        spinner.text = 'Generating forest plot data...';
        const isEffectSize = data.length > 0 && ('yi' in data[0] && 'vi' in data[0]);
        const isBinary = data.length > 0 && ('ai' in data[0] && 'bi' in data[0] && 'ci' in data[0] && 'di' in data[0]);
        const defaultMeasure = isBinary ? 'OR' : 'SMD';
        const selectedMeasure = options.measure?.toUpperCase() || defaultMeasure;
        // Run meta-analysis
        const ma = new core_1.MetaAnalysis(isEffectSize ? data : undefined, { method: 'REML', model: 'random', effectMeasure: selectedMeasure });
        if (!isEffectSize) {
            ma.calculateEffects(data, selectedMeasure);
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
            console.log(chalk_1.default.green(`\nForest plot data saved to: ${options.output}`));
        }
        if (!options.ascii && !options.output) {
            // Print JSON to stdout
            console.log(JSON.stringify(forestData, null, 2));
        }
    }
    catch (error) {
        spinner.fail('Failed to generate forest plot');
        console.error(chalk_1.default.red(`\nError: ${error.message}`));
        process.exit(1);
    }
}
exports.forestCommand = forestCommand;
function printAsciiForest(data) {
    console.log(chalk_1.default.cyan('\n' + '═'.repeat(80)));
    console.log(chalk_1.default.cyan.bold('                           ASCII FOREST PLOT'));
    console.log(chalk_1.default.cyan('═'.repeat(80)));
    const width = 50;
    const minEffect = Math.min(...data.studies.map((s) => s.ci.lower), data.pooled.ci.lower);
    const maxEffect = Math.max(...data.studies.map((s) => s.ci.upper), data.pooled.ci.upper);
    const range = maxEffect - minEffect;
    const scale = width / range;
    const toPosition = (value) => Math.round((value - minEffect) * scale);
    const nullPosition = toPosition(0);
    // Header
    console.log('\n' + ' '.repeat(25) + chalk_1.default.gray('Favors Treatment') + ' '.repeat(10) + chalk_1.default.gray('Favors Control'));
    // Scale
    const scaleMin = minEffect.toFixed(2);
    const scaleMax = maxEffect.toFixed(2);
    console.log(' '.repeat(20) + scaleMin + ' '.repeat(width - scaleMin.length - scaleMax.length) + scaleMax);
    console.log(' '.repeat(20) + '├' + '─'.repeat(width - 2) + '┤');
    // Studies
    data.studies.forEach((study) => {
        const name = (study.id || '').padEnd(18).slice(0, 18);
        const effectStr = study.yi.toFixed(2).padStart(6);
        const ciLower = toPosition(study.ci.lower);
        const ciUpper = toPosition(study.ci.upper);
        const effectPos = toPosition(study.yi);
        let line = ' '.repeat(width);
        const lineArr = line.split('');
        // Draw CI line
        for (let i = ciLower; i <= ciUpper && i < width; i++) {
            if (i >= 0)
                lineArr[i] = '─';
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
            if (i >= 0)
                lineArr[i] = '═';
        }
        // Draw effect diamond
        if (effectPos >= 0 && effectPos < width) {
            lineArr[effectPos] = '◆';
        }
        // Draw null line
        if (nullPosition >= 0 && nullPosition < width) {
            lineArr[nullPosition] = lineArr[nullPosition] === '═' ? '╪' : '│';
        }
        console.log(chalk_1.default.bold(`${name} ${effectStr} │${lineArr.join('')}│`));
    }
    // Footer
    console.log(' '.repeat(20) + '└' + '─'.repeat(width - 2) + '┘');
    console.log(chalk_1.default.cyan('═'.repeat(80)));
    // Legend
    console.log(chalk_1.default.gray('\nLegend: ■ = Study effect, ◆ = Pooled effect, ─ = 95% CI'));
    console.log(chalk_1.default.gray('        │ = Null effect (0), Weight shown as bar + percentage\n'));
}
//# sourceMappingURL=forest.js.map