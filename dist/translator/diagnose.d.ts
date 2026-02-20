export interface Diagnosis {
    explanation: string;
    suggestion: string;
}
export declare function diagnoseFailure(stepDescription: string, error: string, a11yTree: string, pageUrl: string, apiKey?: string): Promise<Diagnosis | null>;
//# sourceMappingURL=diagnose.d.ts.map