"use strict";
/**
 * Convert command - Convert between data formats
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
exports.convertCommand = void 0;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const data_loader_1 = require("../utils/data-loader");
async function convertCommand(input, output, options) {
    const spinner = (0, ora_1.default)('Converting...').start();
    try {
        // Load input data
        const data = await (0, data_loader_1.loadData)(input);
        spinner.text = 'Writing output...';
        // Determine output format
        const outputFormat = options.to || path.extname(output).slice(1).toLowerCase();
        let outputContent;
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
        console.log(chalk_1.default.green(`\nOutput saved to: ${output}`));
        console.log(`Records converted: ${data.length}`);
    }
    catch (error) {
        spinner.fail('Conversion failed');
        console.error(chalk_1.default.red(`\nError: ${error.message}`));
        process.exit(1);
    }
}
exports.convertCommand = convertCommand;
function convertToCSV(data, delimiter = ',') {
    if (data.length === 0)
        return '';
    // Get all unique keys
    const keys = new Set();
    data.forEach(row => {
        Object.keys(row).forEach(key => keys.add(key));
    });
    const headers = Array.from(keys);
    // Create CSV content
    const rows = [
        headers.join(delimiter),
        ...data.map(row => headers.map(key => {
            const value = row[key];
            if (value === undefined || value === null)
                return '';
            if (typeof value === 'string' && value.includes(delimiter)) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return String(value);
        }).join(delimiter))
    ];
    return rows.join('\n');
}
//# sourceMappingURL=convert.js.map