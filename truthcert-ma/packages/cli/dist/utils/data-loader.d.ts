type Row = Record<string, unknown>;
export declare function detectDataType(data: Row[]): 'effect' | 'binary' | 'continuous' | 'unknown';
export declare function loadData(filePath: string): Promise<Row[]>;
export {};
//# sourceMappingURL=data-loader.d.ts.map