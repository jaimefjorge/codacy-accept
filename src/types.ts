export interface Step {
  index: number;
  description: string;
  type: 'action' | 'assertion';
}

export interface SpecMetadata {
  priority?: 'critical' | 'high' | 'medium' | 'low';
  area?: string;
  requiresAuth?: boolean;
  estimatedDuration?: 'fast' | 'medium' | 'slow';
}

export interface SpecContext {
  category:
    | 'bug-fix'
    | 'feature'
    | 'epic'
    | 'regression-test'
    | 'smoke-test'
    | 'integration-test'
    | 'ux-improvement'
    | 'performance'
    | 'security'
    | 'accessibility'
    | 'other';
  scope: 'minor' | 'moderate' | 'major';
  summary: string;
  tags: string[];
  businessContext?: string;
}

export interface Spec {
  title: string;
  url: string;
  why?: string;
  metadata?: SpecMetadata;
  preconditions?: string[];
  successCriteria?: string[];
  notes?: string[];
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
  videoPath?: string;
  specFile?: string;
  specContent?: string;
  specContext?: SpecContext;
}

export interface UploadInput {
  dir?: string;
  json?: string;
}
