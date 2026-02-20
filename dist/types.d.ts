export interface Step {
    index: number;
    description: string;
    type: 'action' | 'assertion';
}
export interface Spec {
    title: string;
    url: string;
    why?: string;
    steps: Step[];
}
export interface AuthConfig {
    strategy: 'credentials' | 'cookie' | 'none';
    loginUrl?: string;
    credentials?: {
        usernameField?: string;
        passwordField?: string;
        username?: string;
        password?: string;
    };
    cookiePath?: string;
    notes?: string;
}
export interface StepResult {
    step: Step;
    status: 'passed' | 'failed';
    durationMs: number;
    screenshotPath: string;
    error?: string;
    expected?: string;
    actual?: string;
}
export interface RunResult {
    id: number;
    spec: Spec;
    steps: StepResult[];
    totalDurationMs: number;
    timestamp: string;
    commit?: string;
    passed: number;
    failed: number;
    reportPath: string;
    shareUrl?: string;
}
export interface UploadInput {
    dir?: string;
    json?: string;
}
//# sourceMappingURL=types.d.ts.map