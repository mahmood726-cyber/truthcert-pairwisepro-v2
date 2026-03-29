/**
 * Convert command - Convert between data formats
 */
interface ConvertOptions {
    from?: string;
    to?: string;
}
export declare function convertCommand(input: string, output: string, options: ConvertOptions): Promise<void>;
export {};
//# sourceMappingURL=convert.d.ts.map