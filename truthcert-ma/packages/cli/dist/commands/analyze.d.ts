/**
 * Analyze command - Run meta-analysis
 */
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
export declare function analyzeCommand(file: string, options: AnalyzeOptions): Promise<void>;
export {};
//# sourceMappingURL=analyze.d.ts.map