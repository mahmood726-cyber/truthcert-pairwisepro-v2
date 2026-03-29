import * as fs from 'fs';
import * as path from 'path';
import { formatOutput } from './formatter';

export async function writeOutput(result: any, outputFile: string, format?: string): Promise<void> {
  const inferredFormat = format?.toLowerCase() || path.extname(outputFile).slice(1).toLowerCase() || 'json';
  const content = formatOutput(result, inferredFormat);
  fs.writeFileSync(outputFile, content, 'utf-8');
}
