import { RunResult } from '../types.js';
interface CloudRun {
    shortId: string;
    title: string;
    timestamp: string;
    passed: number;
    failed: number;
    url: string;
}
export declare function uploadResults(result: RunResult): Promise<string | null>;
export declare function fetchCloudRuns(): Promise<CloudRun[]>;
export {};
//# sourceMappingURL=cloud.d.ts.map