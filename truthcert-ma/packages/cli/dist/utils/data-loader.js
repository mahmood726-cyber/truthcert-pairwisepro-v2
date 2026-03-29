"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadData = exports.detectDataType = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const sync_1 = require("csv-parse/sync");
function asNumber(value) {
    if (typeof value === 'number' && Number.isFinite(value))
        return value;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed)
            return undefined;
        const num = Number(trimmed);
        if (Number.isFinite(num))
            return num;
    }
    return undefined;
}
function coerceRowValues(row) {
    const out = {};
    for (const [key, value] of Object.entries(row)) {
        const asNum = asNumber(value);
        out[key] = asNum !== undefined ? asNum : value;
    }
    return out;
}
function normalizeEffectSize(row) {
    const yi = asNumber(row.yi);
    const vi = asNumber(row.vi);
    if (yi === undefined || vi === undefined)
        return null;
    const se = asNumber(row.se) ?? Math.sqrt(vi);
    const n = asNumber(row.n);
    const out = { yi, vi, se };
    if (typeof row.id === 'string' || typeof row.id === 'number')
        out.id = String(row.id);
    if (typeof row.study === 'string')
        out.study = row.study;
    if (n !== undefined)
        out.n = n;
    return out;
}
function normalizeBinary(row) {
    const ai = asNumber(row.ai);
    const bi = asNumber(row.bi);
    const ci = asNumber(row.ci);
    const di = asNumber(row.di);
    if (ai !== undefined && bi !== undefined && ci !== undefined && di !== undefined) {
        const out = { ai, bi, ci, di };
        if (typeof row.id === 'string' || typeof row.id === 'number')
            out.id = String(row.id);
        if (typeof row.study === 'string')
            out.study = row.study;
        return out;
    }
    const events1 = asNumber(row.events1 ?? row.e1);
    const total1 = asNumber(row.total1 ?? row.n1);
    const events2 = asNumber(row.events2 ?? row.e2);
    const total2 = asNumber(row.total2 ?? row.n2);
    if (events1 !== undefined &&
        total1 !== undefined &&
        events2 !== undefined &&
        total2 !== undefined) {
        const out = {
            ai: events1,
            bi: total1 - events1,
            ci: events2,
            di: total2 - events2
        };
        if (typeof row.id === 'string' || typeof row.id === 'number')
            out.id = String(row.id);
        if (typeof row.study === 'string')
            out.study = row.study;
        return out;
    }
    return null;
}
function normalizeContinuous(row) {
    const m1i = asNumber(row.m1i);
    const sd1i = asNumber(row.sd1i);
    const n1i = asNumber(row.n1i);
    const m2i = asNumber(row.m2i);
    const sd2i = asNumber(row.sd2i);
    const n2i = asNumber(row.n2i);
    if (m1i !== undefined &&
        sd1i !== undefined &&
        n1i !== undefined &&
        m2i !== undefined &&
        sd2i !== undefined &&
        n2i !== undefined) {
        const out = { m1i, sd1i, n1i, m2i, sd2i, n2i };
        if (typeof row.id === 'string' || typeof row.id === 'number')
            out.id = String(row.id);
        if (typeof row.study === 'string')
            out.study = row.study;
        return out;
    }
    const mean1 = asNumber(row.mean1 ?? row.m1);
    const sd1 = asNumber(row.sd1);
    const n1 = asNumber(row.n1);
    const mean2 = asNumber(row.mean2 ?? row.m2);
    const sd2 = asNumber(row.sd2);
    const n2 = asNumber(row.n2);
    if (mean1 !== undefined &&
        sd1 !== undefined &&
        n1 !== undefined &&
        mean2 !== undefined &&
        sd2 !== undefined &&
        n2 !== undefined) {
        const out = { m1i: mean1, sd1i: sd1, n1i: n1, m2i: mean2, sd2i: sd2, n2i: n2 };
        if (typeof row.id === 'string' || typeof row.id === 'number')
            out.id = String(row.id);
        if (typeof row.study === 'string')
            out.study = row.study;
        return out;
    }
    return null;
}
function normalizeRow(row) {
    const effect = normalizeEffectSize(row);
    if (effect)
        return effect;
    const binary = normalizeBinary(row);
    if (binary)
        return binary;
    const continuous = normalizeContinuous(row);
    if (continuous)
        return continuous;
    return row;
}
function parseCsvLike(content, delimiter) {
    const records = (0, sync_1.parse)(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        delimiter
    });
    return records.map(coerceRowValues).map(normalizeRow);
}
function parseJson(content) {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
        return parsed.map(item => normalizeRow(coerceRowValues(item)));
    }
    if (parsed && typeof parsed === 'object') {
        const obj = parsed;
        if (Array.isArray(obj.studies)) {
            return obj.studies.map(item => normalizeRow(coerceRowValues(item)));
        }
    }
    throw new Error('JSON input must be an array of studies or an object with a "studies" array');
}
function detectDataType(data) {
    if (!data.length)
        return 'unknown';
    const first = data[0];
    if ('yi' in first && 'vi' in first)
        return 'effect';
    if ('ai' in first && 'bi' in first && 'ci' in first && 'di' in first)
        return 'binary';
    if ('m1i' in first && 'sd1i' in first && 'n1i' in first && 'm2i' in first && 'sd2i' in first && 'n2i' in first) {
        return 'continuous';
    }
    return 'unknown';
}
exports.detectDataType = detectDataType;
async function loadData(filePath) {
    const resolved = path.resolve(filePath);
    if (!fs.existsSync(resolved)) {
        throw new Error(`Input file not found: ${resolved}`);
    }
    const content = fs.readFileSync(resolved, 'utf-8');
    const ext = path.extname(resolved).toLowerCase();
    if (ext === '.json') {
        return parseJson(content);
    }
    if (ext === '.csv') {
        return parseCsvLike(content, ',');
    }
    if (ext === '.tsv') {
        return parseCsvLike(content, '\t');
    }
    throw new Error(`Unsupported file format: ${ext || 'unknown'}. Supported: .json, .csv, .tsv`);
}
exports.loadData = loadData;
//# sourceMappingURL=data-loader.js.map