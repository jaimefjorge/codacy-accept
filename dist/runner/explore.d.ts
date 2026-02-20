import { Spec, RunResult, AuthConfig } from '../types.js';
export interface RunOptions {
    headed?: boolean;
    apiKey?: string;
    auth?: AuthConfig;
}
export declare function runSpec(spec: Spec, options?: RunOptions): Promise<RunResult>;
//# sourceMappingURL=explore.d.ts.map