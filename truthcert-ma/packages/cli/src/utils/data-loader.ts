import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

type Row = Record<string, unknown>;

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const num = Number(trimmed);
    if (Number.isFinite(num)) return num;
  }
  return undefined;
}

function coerceRowValues(row: Row): Row {
  const out: Row = {};
  for (const [key, value] of Object.entries(row)) {
    const asNum = asNumber(value);
    out[key] = asNum !== undefined ? asNum : value;
  }
  return out;
}

function normalizeEffectSize(row: Row): Row | null {
  const yi = asNumber(row.yi);
  const vi = asNumber(row.vi);
  if (yi === undefined || vi === undefined) return null;

  const se = asNumber(row.se) ?? Math.sqrt(vi);
  const n = asNumber(row.n);

  const out: Row = { yi, vi, se };
  if (typeof row.id === 'string' || typeof row.id === 'number') out.id = String(row.id);
  if (typeof row.study === 'string') out.study = row.study;
  if (n !== undefined) out.n = n;
  return out;
}

function normalizeBinary(row: Row): Row | null {
  const ai = asNumber(row.ai);
  const bi = asNumber(row.bi);
  const ci = asNumber(row.ci);
  const di = asNumber(row.di);

  if (ai !== undefined && bi !== undefined && ci !== undefined && di !== undefined) {
    const out: Row = { ai, bi, ci, di };
    if (typeof row.id === 'string' || typeof row.id === 'number') out.id = String(row.id);
    if (typeof row.study === 'string') out.study = row.study;
    return out;
  }

  const events1 = asNumber(row.events1 ?? row.e1);
  const total1 = asNumber(row.total1 ?? row.n1);
  const events2 = asNumber(row.events2 ?? row.e2);
  const total2 = asNumber(row.total2 ?? row.n2);
  if (
    events1 !== undefined &&
    total1 !== undefined &&
    events2 !== undefined &&
    total2 !== undefined
  ) {
    const out: Row = {
      ai: events1,
      bi: total1 - events1,
      ci: events2,
      di: total2 - events2
    };
    if (typeof row.id === 'string' || typeof row.id === 'number') out.id = String(row.id);
    if (typeof row.study === 'string') out.study = row.study;
    return out;
  }

  return null;
}

function normalizeContinuous(row: Row): Row | null {
  const m1i = asNumber(row.m1i);
  const sd1i = asNumber(row.sd1i);
  const n1i = asNumber(row.n1i);
  const m2i = asNumber(row.m2i);
  const sd2i = asNumber(row.sd2i);
  const n2i = asNumber(row.n2i);

  if (
    m1i !== undefined &&
    sd1i !== undefined &&
    n1i !== undefined &&
    m2i !== undefined &&
    sd2i !== undefined &&
    n2i !== undefined
  ) {
    const out: Row = { m1i, sd1i, n1i, m2i, sd2i, n2i };
    if (typeof row.id === 'string' || typeof row.id === 'number') out.id = String(row.id);
    if (typeof row.study === 'string') out.study = row.study;
    return out;
  }

  const mean1 = asNumber(row.mean1 ?? row.m1);
  const sd1 = asNumber(row.sd1);
  const n1 = asNumber(row.n1);
  const mean2 = asNumber(row.mean2 ?? row.m2);
  const sd2 = asNumber(row.sd2);
  const n2 = asNumber(row.n2);
  if (
    mean1 !== undefined &&
    sd1 !== undefined &&
    n1 !== undefined &&
    mean2 !== undefined &&
    sd2 !== undefined &&
    n2 !== undefined
  ) {
    const out: Row = { m1i: mean1, sd1i: sd1, n1i: n1, m2i: mean2, sd2i: sd2, n2i: n2 };
    if (typeof row.id === 'string' || typeof row.id === 'number') out.id = String(row.id);
    if (typeof row.study === 'string') out.study = row.study;
    return out;
  }

  return null;
}

function normalizeRow(row: Row): Row {
  const effect = normalizeEffectSize(row);
  if (effect) return effect;

  const binary = normalizeBinary(row);
  if (binary) return binary;

  const continuous = normalizeContinuous(row);
  if (continuous) return continuous;

  return row;
}

function parseCsvLike(content: string, delimiter: string): Row[] {
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    delimiter
  }) as Row[];
  return records.map(coerceRowValues).map(normalizeRow);
}

function parseJson(content: string): Row[] {
  const parsed = JSON.parse(content) as unknown;

  if (Array.isArray(parsed)) {
    return parsed.map(item => normalizeRow(coerceRowValues(item as Row)));
  }

  if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.studies)) {
      return obj.studies.map(item => normalizeRow(coerceRowValues(item as Row)));
    }
  }

  throw new Error('JSON input must be an array of studies or an object with a "studies" array');
}

export function detectDataType(data: Row[]): 'effect' | 'binary' | 'continuous' | 'unknown' {
  if (!data.length) return 'unknown';
  const first = data[0];
  if ('yi' in first && 'vi' in first) return 'effect';
  if ('ai' in first && 'bi' in first && 'ci' in first && 'di' in first) return 'binary';
  if ('m1i' in first && 'sd1i' in first && 'n1i' in first && 'm2i' in first && 'sd2i' in first && 'n2i' in first) {
    return 'continuous';
  }
  return 'unknown';
}

export async function loadData(filePath: string): Promise<Row[]> {
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
