/**
 * Forest command - Generate forest plot data/visualization
 */
interface ForestOptions {
    output?: string;
    svg?: boolean;
    ascii?: boolean;
    measure?: string;
}
export declare function forestCommand(file: string, options: ForestOptions): Promise<void>;
export {};
//# sourceMappingURL=forest.d.ts.map